#!/usr/bin/env python3
"""Cut the arrangement out of the Higgsfield clip, frame by frame, into the
transparent sequence the hero scrubs.

The client's call: the hero must not read as a video. No window, no
photographic background — the arrangement itself, floating on the white page,
turning and closing in as you scroll. So the presentation is a cutout: every
frame of clip A matted against its studio background, cropped, and shipped as
WebP with alpha, drawn to a canvas by the scrubber.

Matting is isnet-general-use (rembg). Two things make it hold up:

  * Padding. The model is trained on bounded subjects; the moment the blooms
    touch the frame edge it starts dissolving them. Extending each frame with
    a blurred stretch of its own background before matting — and cropping the
    matte back — keeps the subject bounded and rescues the whole clip.
  * Temporal smoothing. The matte is computed per frame, so fine spikes
    shimmer. A 1-2-1 blend of each alpha with its neighbours damps it; the
    footage moves slowly enough that nothing smears.

The scrub has two phases and the manifest records the boundary:

  frames [0 .. safe]        the whole silhouette is inside the frame — the
                            floating-object phase
  frames (safe .. count-1]  the blooms clip the frame edges — usable only once
                            the page has zoomed past the object's own bounds,
                            which is exactly when the scrub uses them

Out:
  assets/hero/f-000.webp …   the sequence (RGBA)
  assets/hero/poster.webp    frame 0 — the LCP image
  js/hero-manifest.js        count, size, the safe index

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

CLIP = MEDIA / "clipA.mp4"
T_END = 4.35         # seconds of the clip worth using (later, blooms swallow the frame)
MATTES = 92          # how many frames get matted (and cached) across T_END
FLOAT_N = 40         # frames sampled inside the whole-silhouette range
DIVE_N = 14          # frames sampled after it — the dive moves fast, it needs fewer
WIDTH = 720
BUDGET_KB = 2600
Q_START = 62
PAD = 0.22           # matting context border, fraction of each side
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def decode():
    probe = subprocess.run([FFMPEG, "-i", str(CLIP)], capture_output=True, text=True).stderr
    line = next((l for l in probe.splitlines() if "Stream" in l and "Video:" in l), "")
    m = re.search(r"\b(\d{2,5})x(\d{2,5})\b", line)
    w, h = int(m.group(1)), int(m.group(2))
    ow = WIDTH
    oh = round(h * ow / w) // 2 * 2
    raw = subprocess.run(
        [FFMPEG, "-v", "error", "-t", str(T_END), "-i", str(CLIP),
         "-vf", f"scale={ow}:{oh}:flags=lanczos",
         "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        capture_output=True, check=True).stdout
    stride = ow * oh * 3
    n = len(raw) // stride
    return [Image.frombytes("RGB", (ow, oh), raw[i * stride:(i + 1) * stride])
            for i in range(n)], ow, oh


def matte(im, sess, remove):
    """isnet with the padding trick: bound the subject, matte, crop back."""
    w, h = im.size
    pw, ph = round(w * PAD), round(h * PAD)
    big = im.resize((w + 2 * pw, h + 2 * ph), Image.LANCZOS).filter(
        ImageFilter.GaussianBlur(40))
    big.paste(im, (pw, ph))
    cut = remove(big, session=sess)
    return cut.crop((pw, ph, pw + w, ph + h))


def edge_free(alpha, tol=40, margin=2, allow=800):
    """True while the silhouette is essentially inside the frame.

    `allow` is deliberately loose: at frame 0 one gladiolus tip grazes the
    right edge for ~150px, which no eye reads as clipping — and the thin
    spike contacts stay in the hundreds — while the frame where the mass
    arrives jumps past 3000 border pixels at once."""
    a = alpha > tol
    touching = int(a[:margin].sum() + a[-margin:].sum()
                   + a[:, :margin].sum() + a[:, -margin:].sum())
    return touching <= allow


def encode(im, q):
    # method=4, measured: method=6 spends ~15s a frame inside libwebp's
    # lossless alpha-plane search for ~4% fewer bytes. Not worth 25 minutes.
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=q, method=4)
    return buf.getvalue()


def main():
    from rembg import remove, new_session
    sess = new_session("isnet-general-use")

    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    # The mattes are the expensive part (~8 min); cache them at their own
    # resolution and derive everything else cheaply. 960 wide covers any
    # output width this script will be asked for.
    cache = MEDIA / f"_mattes-{MATTES}x960"
    if cache.exists() and len(list(cache.glob("m-*.png"))) == MATTES:
        pool = [Image.open(cache / f"m-{i:03d}.png").convert("RGBA")
                for i in range(MATTES)]
        print(f"  mattes     {MATTES} frames from cache ({cache.name})")
    else:
        frames, w0, h0 = decode()
        print(f"  decoded    {len(frames)} frames @ {w0}x{h0} from {CLIP.name} (0–{T_END}s)")
        step = (len(frames) - 1) / (MATTES - 1)
        picked = [frames[round(i * step)] for i in range(MATTES)]
        pool = [matte(im, sess, remove) for im in picked]
        cache.mkdir(parents=True, exist_ok=True)
        for i, c in enumerate(pool):
            c.save(cache / f"m-{i:03d}.png")
        print(f"  matted     {len(pool)} frames (isnet, padded; cached)")

    # Where does the whole-silhouette range end? Then sample it densely (the
    # turn is watched closely) and the clipped tail sparsely (the dive is
    # fast). This is what keeps 4+ seconds of footage inside the budget.
    edge_ok = MATTES - 1
    for i, c in enumerate(pool):
        if not edge_free(np.asarray(c.split()[3])):
            edge_ok = max(0, i - 1)
            break
    # The dive stops short of the clip's tail: past ~80% the arrangement fills
    # the frame so completely that the matte keeps patches of studio grey
    # between the blooms, and on white they read as dirt.
    dive_end = min(MATTES - 1, round(MATTES * 0.80))
    fl = [round(i * edge_ok / (FLOAT_N - 1)) for i in range(FLOAT_N)]
    dv = [round(edge_ok + (j + 1) * (dive_end - edge_ok) / DIVE_N)
          for j in range(DIVE_N)]
    idxs = fl + dv
    w, h = pool[0].size
    if WIDTH < w:
        cuts = [pool[i].resize((WIDTH, round(h * WIDTH / w)), Image.LANCZOS)
                for i in idxs]
    else:
        cuts = [pool[i] for i in idxs]
    w, h = cuts[0].size
    print(f"  sampled    {FLOAT_N}+{DIVE_N} of {MATTES} (silhouette holds to {edge_ok})")

    # Temporal 1-2-1 smoothing on alpha, then cleanup. The cleanup is what
    # makes the files small: WebP stores alpha LOSSLESSLY, and this outline —
    # hundreds of petal and stem edges — is the most expensive mask a florist
    # could draw. Matte noise alone ballooned the raw sequence to 21MB; after
    # de-noising, a multi-level feather still cost more than the photograph.
    # So: hard floor, hard ceiling, ONE mid level for the 1px feather, and no
    # colour under fully-transparent pixels.
    alphas = [np.asarray(c.split()[3], dtype=np.uint16) for c in cuts]
    cleaned = []
    for i, c in enumerate(cuts):
        a0 = alphas[max(0, i - 1)]
        a2 = alphas[min(len(alphas) - 1, i + 1)]
        a = ((a0 + 2 * alphas[i] + a2) // 4).astype(np.uint8)
        a[a < 40] = 0
        a[a > 215] = 255
        # A mid-alpha pixel is either the 1px feather around a petal or a
        # patch of faint background haze the matte half-kept. Snapping both to
        # one level amplified the haze into visible grey blobs — so keep the
        # mid level only within a few pixels of solid coverage (the feather)
        # and drop the rest.
        mid = (a > 0) & (a < 255)
        near = np.asarray(Image.fromarray(((a == 255) * 255).astype(np.uint8))
                          .filter(ImageFilter.MaxFilter(7))) > 0
        a[mid & ~near] = 0
        a[mid & near] = 128
        rgba = np.asarray(c.convert("RGBA")).copy()
        rgba[..., 3] = a
        rgba[a == 0] = 0
        cleaned.append(Image.fromarray(rgba, "RGBA"))
    cuts = cleaned

    # Common crop: drop margins that are transparent in every frame.
    union = np.zeros((h, w), bool)
    for c in cuts:
        union |= np.asarray(c.split()[3]) > 10
    ys, xs = np.where(union)
    x0 = max(0, xs.min() - 6); x1 = min(w, xs.max() + 7)
    y0 = max(0, ys.min() - 6); y1 = min(h, ys.max() + 7)
    x1 -= (x1 - x0) % 2; y1 -= (y1 - y0) % 2
    cuts = [c.crop((x0, y0, x1, y1)) for c in cuts]
    cw, ch = cuts[0].size
    print(f"  cropped    {cw}x{ch}")

    # The float/dive boundary is known by construction: the last float frame.
    safe = FLOAT_N - 1

    # Pick q from a 10-frame sample first, then encode the set once — the
    # full-set ladder re-encoded 92 frames per step and took most of an hour.
    sample = cuts[:: max(1, len(cuts) // 10)]
    q = Q_START
    while q > 56:
        est = sum(len(encode(c, q)) for c in sample) / len(sample) * len(cuts) / 1024
        if est <= BUDGET_KB:
            break
        q -= 4
    # Dive frames are shown scaled well past 1x — they carry more quality.
    blobs = [encode(c, q + (10 if i > safe else 0)) for i, c in enumerate(cuts)]
    total = sum(len(b) for b in blobs) / 1024
    for i, b in enumerate(blobs):
        (OUT / f"f-{i:03d}.webp").write_bytes(b)

    cuts[0].save(OUT / "poster.webp", "WEBP", quality=82, method=6)

    (ROOT / "js" / "hero-manifest.js").write_text(
        "// generated by scripts/build_hero.py — do not edit\n"
        "export const HERO = " + json.dumps({
            "count": len(cuts), "w": cw, "h": ch, "safe": safe,
            "path": "assets/hero/f-", "ext": ".webp",
            "poster": "assets/hero/poster.webp",
        }, indent=1) + ";\n", encoding="utf-8")

    print(f"\n  sequence   {len(cuts)} frames  q={q}  {total:.0f}KB "
          f"({total / len(cuts):.1f}KB avg)")
    print(f"  poster     {(OUT / 'poster.webp').stat().st_size / 1024:.0f}KB")


if __name__ == "__main__":
    main()
