#!/usr/bin/env python3
"""Turn the client's phone-sized photos into the app's image set.

Everything the client sent is a 1179px-wide screenshot off Instagram. That is
the ceiling: nothing here can be displayed larger than 1179 CSS px without
showing the upscale, and the layout is built to respect it.

Out of each source come three widths (400 / 760 / 1140) in WebP, so a card on a
phone pulls ~30KB instead of ~350KB, plus a 24px blurred placeholder inlined as
a data URI so a card never opens as a white hole.

Also writes the PWA icon set from the traced mark, and the social card.

    python3 scripts/build_assets.py

Pillow only.
"""

import base64
import io
import json
import pathlib
import subprocess

from PIL import Image, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "scripts" / "src"
PHOTOS = ROOT / "assets" / "photos"
ICONS = ROOT / "assets" / "icons"
BRAND = ROOT / "assets" / "brand"

WIDTHS = (400, 760, 1140)
QUALITY = 82
ICON_SIZES = (128, 144, 152, 167, 180, 192, 256, 384, 512, 1024)

# source stem -> (slug, focal point as a fraction of height for object-position)
SOURCES = {
    "p-red":           ("hezar-rose", 0.42),
    "p-purple":        ("arghavan",   0.45),
    "p-amber-vase":    ("aftab",      0.42),
    "p-pink":          ("sahar",      0.48),
    "p-violet":        ("banafsheh",  0.52),
    "p-blue":          ("nilgoon",    0.50),
    "p-amber-closeup": ("shahd",      0.45),
}


def blur_uri(im, w=24):
    """A 24px blur as a data URI. Inlined into the CSS custom property on each
    card so the colour is on screen in the first paint, before any photo has
    been asked for."""
    h = max(1, round(im.height * w / im.width))
    small = im.resize((w, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.6))
    buf = io.BytesIO()
    small.save(buf, "WEBP", quality=52, method=6)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()


def build_photos():
    PHOTOS.mkdir(parents=True, exist_ok=True)
    meta = {}
    for stem, (slug, focal) in SOURCES.items():
        path = SRC / f"{stem}.png"
        if not path.exists():
            print(f"  ! missing {path.name}")
            continue
        im = Image.open(path).convert("RGB")
        widths = [w for w in WIDTHS if w <= im.width] or [im.width]
        if im.width not in widths and im.width < max(WIDTHS):
            widths.append(im.width)
        wrote = []
        for w in widths:
            h = round(im.height * w / im.width)
            out = PHOTOS / f"{slug}-{w}.webp"
            im.resize((w, h), Image.LANCZOS).save(out, "WEBP", quality=QUALITY, method=6)
            wrote.append((w, out.stat().st_size))
        meta[slug] = {
            "w": im.width,
            "h": im.height,
            "ratio": round(im.width / im.height, 4),
            "focal": focal,
            "widths": [w for w, _ in wrote],
            "blur": blur_uri(im),
        }
        kb = sum(s for _, s in wrote) / 1024
        print(f"  {slug:12s} {im.width}x{im.height}  "
              f"{'/'.join(str(w) for w, _ in wrote)}  {kb:.0f}KB")
    return meta


def render_svg(svg_path, out_path, size, bg, fg, pad=0.18, radius=None):
    """Chrome is the only rasteriser on this machine that gets SVG right."""
    svg = svg_path.read_text(encoding="utf-8").replace(
        'fill="currentColor"', f'fill="{fg}"')
    inner = round(size * (1 - pad * 2))
    r = "" if radius is None else f"border-radius:{radius}px;"
    html = (
        f'<html><body style="margin:0">'
        f'<div style="width:{size}px;height:{size}px;background:{bg};{r}'
        f'display:flex;align-items:center;justify-content:center">'
        f'<div style="width:{inner}px">{svg}</div></div></body></html>'
    )
    tmp = ROOT / "scripts" / "_icon.html"
    tmp.write_text(html, encoding="utf-8")
    subprocess.run([
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "--headless", "--disable-gpu", "--hide-scrollbars",
        f"--screenshot={out_path}", f"--window-size={size},{size}",
        "--default-background-color=00000000", str(tmp),
    ], check=True, capture_output=True)
    tmp.unlink(missing_ok=True)


def build_icons():
    ICONS.mkdir(parents=True, exist_ok=True)
    mark = BRAND / "mark.svg"
    word = BRAND / "wordmark.svg"

    # Maskable and Apple icons need their own ground — iOS composites the home
    # screen icon on nothing and a transparent PNG comes out black.
    for size in ICON_SIZES:
        render_svg(mark, ICONS / f"icon-{size}.png", size, "#ffffff", "#0B0B0C", pad=0.26)
    render_svg(mark, ICONS / "apple-touch-icon.png", 180, "#ffffff", "#0B0B0C", pad=0.24)
    # Maskable: Android crops to a circle inscribed in 80% of the canvas.
    render_svg(mark, ICONS / "maskable-512.png", 512, "#ffffff", "#0B0B0C", pad=0.34)
    render_svg(mark, ICONS / "favicon-64.png", 64, "#ffffff", "#0B0B0C", pad=0.22)
    print(f"  icons        {len(ICON_SIZES) + 3} files")

    # Splash / OG groundwork: the wordmark on white, wide.
    svg = word.read_text(encoding="utf-8").replace('fill="currentColor"', 'fill="#0B0B0C"')
    html = (
        '<html><body style="margin:0">'
        '<div style="width:1200px;height:630px;background:#FBFAF8;display:flex;'
        'flex-direction:column;align-items:center;justify-content:center;gap:34px">'
        f'<div style="width:520px">{svg}</div>'
        '<div style="font:400 25px/1 -apple-system,Helvetica,Arial;letter-spacing:.42em;'
        'color:#6C6C70;padding-left:.42em">TABRIZ &nbsp;·&nbsp; VALIASR</div>'
        '</div></body></html>'
    )
    tmp = ROOT / "scripts" / "_og.html"
    tmp.write_text(html, encoding="utf-8")
    subprocess.run([
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "--headless", "--disable-gpu", "--hide-scrollbars",
        f"--screenshot={BRAND / 'og.png'}", "--window-size=1200,630", str(tmp),
    ], check=True, capture_output=True)
    tmp.unlink(missing_ok=True)
    Image.open(BRAND / "og.png").convert("RGB").save(
        BRAND / "og.jpg", "JPEG", quality=88, optimize=True)
    (BRAND / "og.png").unlink(missing_ok=True)
    print("  og.jpg       1200x630")


def main():
    print("photos")
    meta = build_photos()
    print("icons")
    build_icons()
    (ROOT / "js" / "photos.js").write_text(
        "// generated by scripts/build_assets.py — do not edit\n"
        "export const PHOTOS = " + json.dumps(meta, ensure_ascii=False, indent=1) + ";\n",
        encoding="utf-8")
    print(f"\njs/photos.js  {len(meta)} entries")


if __name__ == "__main__":
    main()
