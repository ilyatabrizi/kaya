#!/usr/bin/env python3
"""Cut the arrangement out of the orbit clip, frame by frame, into the
transparent sequence the hero scrubs.

The hero must not read as a video: no window, no photographic background — the
arrangement itself, floating on the white page, turning as you scroll. v3 works
from footage generated for exactly that: a locked-distance orbit with the whole
piece inside the frame the entire time. That kills the two hacks v2 needed
(the "safe" boundary and the dive into edge-clipped frames) and lets every
frame ship whole, high-res, and uniformly sampled.

Matting is isnet-general-use (rembg). Two things make it hold up:

  * Padding. The model is trained on bounded subjects; if anything approaches
    the frame edge it starts dissolving. Extending each frame with a blurred
    stretch of its own background before matting — and cropping the matte
    back — keeps the subject bounded everywhere.
  * Alpha cleanup. WebP stores alpha losslessly and this outline — hundreds of
    petal and stem edges — is the most expensive mask a florist could draw.
    After a 1-2-1 temporal blend: hard floor, hard ceiling, ONE mid level for
    the 1px feather kept only within 3px of solid coverage (anything further
    out is background haze, and haze amplified to 50% grey is how v2 grew
    blobs), and no colour under fully-transparent pixels.

Out:
  assets/hero/f-000.webp …   the sequence (RGBA)
  assets/hero/poster.webp    frame 0 — the LCP image
  js/hero-manifest.js        count and size

    python3 scripts/build_hero.py

Needs imageio-ffmpeg, Pillow, numpy, rembg (isnet-general-use).
"""

import io
import json
import pathlib
import re
import shutil
import subprocess

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
MEDIA = ROOT / "media"
OUT = ROOT / "assets" / "hero"

CLIP = MEDIA / "orbit.mp4"
MODEL = "isnet-general-use"
FRAMES = 64
WIDTH = 1000         # from a 1080 source — the zoom now reads source pixels,
                     # so resolution here is what the dive's sharpness is made of
BUDGET_KB = 4300
Q_START = 70
PAD = 0.20           # matting context border, fraction of each side
TRIM_HEAD = 0.55     # the raw start pose carries the photo's own floor shadow
TRIM_TAIL = 0.15     # the clip holds its last pose for a beat
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def probe(path):
    out = subprocess.run([FFMPEG, "-i", str(path)], capture_output=True, text=True).stderr
    line = next((l for l in out.splitlines() if "Stream" in l and "Video:" in l), "")
    m = re.search(r"\b(\d{2,5})x(\d{2,5})\b", line)
    d = re.search(r"Duration: (\d+):(\d+):([\d.]+)", out)
    if not m or not d:
        raise SystemExit(f"could not probe {path.name}")
    dur = int(d.group(1)) * 3600 + int(d.group(2)) * 60 + float(d.group(3))
    return int(m.group(1)), int(m.group(2)), dur


def decode(n):
    """n frames, evenly spaced across the clip, at source resolution."""
    w, h, dur = probe(CLIP)
    keep = dur - TRIM_HEAD - TRIM_TAIL
    raw = subprocess.run(
        [FFMPEG, "-v", "error", "-ss", f"{TRIM_HEAD}", "-t", f"{keep}",
         "-i", str(CLIP), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        capture_output=True, check=True).stdout
    stride = w * h * 3
    total = len(raw) // stride
    step = (total - 1) / (n - 1)
    return [Image.frombytes("RGB", (w, h), raw[round(i * step) * stride:
                                               (round(i * step) + 1) * stride])
            for i in range(n)], w, h


def matte(im, sess, remove):
    """isnet with the padding trick: bound the subject, matte, crop back."""
    w, h = im.size
    pw, ph = round(w * PAD), round(h * PAD)
    big = im.resize((w + 2 * pw, h + 2 * ph), Image.LANCZOS).filter(
        ImageFilter.GaussianBlur(40))
    big.paste(im, (pw, ph))
    cut = remove(big, session=sess)
    return cut.crop((pw, ph, pw + w, ph + h))


def encode(im, q):
    # method=4: method=6 spends ~15s a frame inside libwebp's lossless
    # alpha-plane search for ~4% fewer bytes.
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=q, method=4)
    return buf.getvalue()


def main():
    from rembg import remove, new_session

    if not CLIP.exists():
        raise SystemExit(f"missing {CLIP}")
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    # The originals are always needed: rembg zeroes the colour under deleted
    # pixels, so anything the matte wrongly removed — the white satin ribbon,
    # every time — can only be restored from the source frames.
    picked, w0, h0 = decode(FRAMES)
    print(f"  decoded    {FRAMES} frames @ {w0}x{h0} from {CLIP.name} "
          f"({TRIM_HEAD}s–end)")

    # The mattes are the expensive part; cache them per clip and trim.
    cache = MEDIA / f"_mattes-{CLIP.stem}-{FRAMES}-t{TRIM_HEAD}-{MODEL}"
    if cache.exists() and len(list(cache.glob("m-*.png"))) == FRAMES:
        cuts = [Image.open(cache / f"m-{i:03d}.png").convert("RGBA")
                for i in range(FRAMES)]
        print(f"  mattes     {FRAMES} frames from cache ({cache.name})")
    else:
        # CPU provider, pinned: CoreML crashed mid-run when another
        # model was loaded beside it, and isnet is fast on CPU anyway.
        sess = new_session(MODEL, providers=["CPUExecutionProvider"])
        cuts = [matte(im, sess, remove) for im in picked]
        cache.mkdir(parents=True, exist_ok=True)
        for i, c in enumerate(cuts):
            c.save(cache / f"m-{i:03d}.png")
        print(f"  matted     {len(cuts)} frames ({MODEL}, padded; cached)")

    w, h = cuts[0].size
    if WIDTH < w:
        cuts = [c.resize((WIDTH, round(h * WIDTH / w)), Image.LANCZOS) for c in cuts]
        picked = [im.resize((WIDTH, round(h * WIDTH / w)), Image.LANCZOS)
                  for im in picked]
        w, h = cuts[0].size

    # The ribbon rescue, done with geometry rather than colour: the satin in
    # this footage measures the same luminance as the studio wall (that is
    # exactly why the model deletes it), so no per-pixel test can tell them
    # apart. What CAN: the ribbon runs deep inside the bouquet's mass. So the
    # matte's solid region is morphologically closed (bridging gaps to ~90px)
    # and then eroded back past its own boundary — and anything the matte
    # left transparent inside that deep-interior envelope is restored with
    # its original pixels. The eroded guard keeps the outline matte-carved,
    # so no webbing appears between the outer spikes; the few real stem-gaps
    # that get filled show the wall greys the actual photograph shows there,
    # which reads as depth, not dirt.
    from scipy import ndimage
    CLOSE_IT = 24        # dilation reach ~48px — bridges the ribbon band
    GUARD_IT = 9         # extra erosion ~18px — keeps the outline carved
    raw_alphas = []
    restored_px = 0
    for i, c in enumerate(cuts):
        a = np.asarray(c.split()[3]).copy()
        a[a < 40] = 0
        a[a > 215] = 255
        solid = a == 255
        env = ndimage.binary_dilation(solid, iterations=CLOSE_IT)
        env = ndimage.binary_erosion(env, iterations=CLOSE_IT + GUARD_IT,
                                     border_value=1)
        restore = env & (a < 40)
        restored_px += int(restore.sum())
        a[restore] = 255
        raw_alphas.append(a.astype(np.uint16))

    cleaned = []
    for i, c in enumerate(cuts):
        a0 = raw_alphas[max(0, i - 1)]
        a2 = raw_alphas[min(len(raw_alphas) - 1, i + 1)]
        a = ((a0 + 2 * raw_alphas[i] + a2) // 4).astype(np.uint8)
        a[a < 40] = 0
        a[a > 215] = 255
        mid = (a > 0) & (a < 255)
        near = np.asarray(Image.fromarray(((a == 255) * 255).astype(np.uint8))
                          .filter(ImageFilter.MaxFilter(7))) > 0
        a[mid & ~near] = 0
        a[mid & near] = 128
        # Colour always comes from the source — the matte's own RGB is
        # zeroed under removals and untrustworthy at the feather.
        src = np.asarray(picked[i].convert("RGB"))
        rgba = np.dstack([src, a]).astype(np.uint8)
        rgba[a == 0] = 0
        cleaned.append(Image.fromarray(rgba))
    cuts = cleaned
    print(f"  restored   {restored_px // len(cuts)} px/frame inside the envelope")

    # Common crop: drop margins that are transparent in every frame.
    union = np.zeros((h, w), bool)
    for c in cuts:
        union |= np.asarray(c.split()[3]) > 10
    ys, xs = np.where(union)
    x0 = max(0, xs.min() - 6); x1 = min(w, xs.max() + 7)
    y0 = max(0, ys.min() - 6); y1 = min(h, ys.max() + 7)
    x1 -= (x1 - x0) % 2; y1 -= (y1 - y0) % 2
    cuts = [c.crop((x0, y0, x1, y1)) for c in cuts]
    w, h = cuts[0].size
    print(f"  cropped    {w}x{h}")

    # Every frame should be whole; report any that is not, loudly.
    for i, c in enumerate(cuts):
        a = np.asarray(c.split()[3]) > 40
        touch = int(a[:2].sum() + a[-2:].sum() + a[:, :2].sum() + a[:, -2:].sum())
        if touch > 900:
            print(f"  ! frame {i} touches the edge ({touch}px) — check the footage")

    # q from a 10-frame sample, then one encode of the set.
    sample = cuts[:: max(1, len(cuts) // 10)]
    q = Q_START
    while q > 54:
        est = sum(len(encode(c, q)) for c in sample) / len(sample) * len(cuts) / 1024
        if est <= BUDGET_KB:
            break
        q -= 4
    blobs = [encode(c, q) for c in cuts]
    total = sum(len(b) for b in blobs) / 1024
    for i, b in enumerate(blobs):
        (OUT / f"f-{i:03d}.webp").write_bytes(b)

    cuts[0].save(OUT / "poster.webp", "WEBP", quality=82, method=4)

    (ROOT / "js" / "hero-manifest.js").write_text(
        "// generated by scripts/build_hero.py — do not edit\n"
        "export const HERO = " + json.dumps({
            "count": len(cuts), "w": w, "h": h,
            "path": "assets/hero/f-", "ext": ".webp",
            "poster": "assets/hero/poster.webp",
        }, indent=1) + ";\n", encoding="utf-8")

    print(f"\n  sequence   {len(cuts)} frames  q={q}  {total:.0f}KB "
          f"({total / len(cuts):.1f}KB avg)")
    print(f"  poster     {(OUT / 'poster.webp').stat().st_size / 1024:.0f}KB")


if __name__ == "__main__":
    main()
