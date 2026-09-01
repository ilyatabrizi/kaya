#!/usr/bin/env python3
"""Trace the KAYA wordmark from the client's raster into clean SVG.

The only master the client sent is a screenshot: 2172x724, black serif type on
white, soft JPEG-ish edges. Good enough to look at, useless at 512px for an app
icon or at 20px in a nav bar. This thresholds it, walks every ink boundary as a
crack path, simplifies with Douglas-Peucker, rounds the facets back into curves
and writes vector.

Two files come out:

  wordmark.svg   K A Y A, one <path> per letter so the loader can stagger them.
  mark.svg       the K alone, squared up, for the app icon and the favicon.

    python3 scripts/trace_logo.py

Pure stdlib + Pillow + numpy. No potrace on this machine.
"""

import pathlib
import sys

import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "scripts" / "src" / "logo.png"
OUT = ROOT / "assets" / "brand"

WORK_W = 2400     # trace width — the serif hairlines are thin, resolution matters
LUMA_CUT = 128    # below this = ink
EPSILON = 1.1     # Douglas-Peucker tolerance, in working pixels
MIN_AREA = 400    # drop screenshot speckle

sys.setrecursionlimit(80000)


# ---------------------------------------------------------------- masks
def load_ink(path, width):
    """Ink is whatever is opaque and dark.

    The client's export is RGBA with a transparent ground: every RGB channel is
    zero, so luma alone says the whole canvas is ink. Where an alpha channel
    carries the shape, trust it; where the file is flattened onto white, fall
    back to luma."""
    im = Image.open(path)
    has_alpha = im.mode in ("RGBA", "LA") or "transparency" in im.info
    im = im.convert("RGBA")
    h = round(im.height * width / im.width)
    im = im.resize((width, h), Image.LANCZOS)
    a = np.asarray(im).astype(int)
    alpha = a[..., 3]
    luma = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
    if has_alpha and alpha.min() < 250:
        return alpha > 127, width, h
    return luma < LUMA_CUT, width, h


def components(mask, drop_border=True):
    """4-connected blobs. Anything touching the frame is the screenshot's own
    edge, not the logo."""
    h, w = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    blobs = []
    for sy in range(h):
        row = mask[sy]
        for sx in range(w):
            if not row[sx] or seen[sy][sx]:
                continue
            stack = [(sx, sy)]
            seen[sy][sx] = True
            cells = []
            touches = False
            while stack:
                x, y = stack.pop()
                cells.append((x, y))
                if x == 0 or y == 0 or x == w - 1 or y == h - 1:
                    touches = True
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and mask[ny][nx]:
                        seen[ny][nx] = True
                        stack.append((nx, ny))
            if len(cells) >= MIN_AREA and not (drop_border and touches):
                blobs.append(cells)
    return blobs


# ------------------------------------------------------------- outlines
def trace_outline(cells):
    """Every closed ring bounding a blob — outer edge plus its counters.

    Walks the unit cracks between ink and space, directed so the interior stays
    on one side, then chains them head to tail. Exact where a Moore walk has to
    guess, and a Didone A is all thin diagonal pinches."""
    cellset = set(cells)
    edges = {}
    for x, y in cells:
        if (x, y - 1) not in cellset:
            edges.setdefault((x, y), []).append((x + 1, y))
        if (x + 1, y) not in cellset:
            edges.setdefault((x + 1, y), []).append((x + 1, y + 1))
        if (x, y + 1) not in cellset:
            edges.setdefault((x + 1, y + 1), []).append((x, y + 1))
        if (x - 1, y) not in cellset:
            edges.setdefault((x, y + 1), []).append((x, y))
    rings = []
    while edges:
        start = next(iter(edges))
        ring, node = [start], start
        while True:
            outs = edges.get(node)
            if not outs:
                break
            nxt = outs.pop()
            if not outs:
                del edges[node]
            if nxt == start:
                break
            ring.append(nxt)
            node = nxt
        if len(ring) >= 8:
            rings.append(ring)
    return rings


def _rdp_open(pts, eps):
    if len(pts) < 3:
        return pts
    x1, y1 = pts[0]
    x2, y2 = pts[-1]
    dx, dy = x2 - x1, y2 - y1
    norm = (dx * dx + dy * dy) ** 0.5
    worst, idx = -1.0, 0
    for i in range(1, len(pts) - 1):
        px, py = pts[i]
        dist = (((px - x1) ** 2 + (py - y1) ** 2) ** 0.5 if norm < 1e-9
                else abs(dy * px - dx * py + x2 * y1 - y2 * x1) / norm)
        if dist > worst:
            worst, idx = dist, i
    if worst > eps:
        return _rdp_open(pts[:idx + 1], eps)[:-1] + _rdp_open(pts[idx:], eps)
    return [pts[0], pts[-1]]


def rdp(ring, eps):
    """Douglas-Peucker on a closed ring: split at the two farthest points first,
    or every distance is measured against a zero-length line."""
    if len(ring) < 6:
        return ring
    far = max(range(len(ring)),
              key=lambda i: (ring[i][0] - ring[0][0]) ** 2 + (ring[i][1] - ring[0][1]) ** 2)
    return _rdp_open(ring[:far + 1], eps)[:-1] + _rdp_open(ring[far:] + [ring[0]], eps)[:-1]


def smooth(ring, rounds=1):
    """Chaikin corner cut. Every serif bracket is a curve, and RDP leaves them
    faceted."""
    for _ in range(rounds):
        out = []
        n = len(ring)
        for i in range(n):
            (x0, y0), (x1, y1) = ring[i], ring[(i + 1) % n]
            out.append((x0 * 0.75 + x1 * 0.25, y0 * 0.75 + y1 * 0.25))
            out.append((x0 * 0.25 + x1 * 0.75, y0 * 0.25 + y1 * 0.75))
        ring = out
    return ring


def to_path(rings, scale, ox, oy, prec=1):
    """Straight segments between the simplified points.

    A quadratic through the midpoints is cheaper and reads beautifully on a
    brush-drawn mark, but this is Didone type: the apex of the A, the crossbar
    junctions and every serif bracket are meant to be corners. Rounding them
    turned both counters into blobs. At this tolerance the polygon is already
    sub-pixel on the curves, so lines cost accuracy nowhere and save the
    corners."""
    out = []
    for ring in rings:
        if len(ring) < 3:
            continue
        p = [((x - ox) * scale, (y - oy) * scale) for x, y in ring]
        d = f"M{p[0][0]:.{prec}f} {p[0][1]:.{prec}f}"
        d += "".join(f"L{x:.{prec}f} {y:.{prec}f}" for x, y in p[1:])
        out.append(d + "Z")
    return "".join(out)


def paths_for(blob, scale, ox, oy):
    """One pass of Douglas-Peucker at a tolerance tight enough that the residual
    error is invisible at any size the mark is used."""
    rings = [rdp(ring, EPSILON) for ring in trace_outline(blob)]
    return to_path(rings, scale, ox, oy)


def bbox(cells):
    xs = [x for x, _ in cells]
    ys = [y for _, y in cells]
    return min(xs), min(ys), max(xs) + 1, max(ys) + 1


# ------------------------------------------------------------------ main
def main():
    if not SRC.exists():
        sys.exit(f"missing source: {SRC}")
    OUT.mkdir(parents=True, exist_ok=True)

    ink, w, h = load_ink(SRC, WORK_W)
    blobs = components(ink)
    if not blobs:
        sys.exit("no ink found — check LUMA_CUT")

    # Left to right: K A Y A. The crossbar of an A is attached, so each letter
    # is one blob; if the screenshot ever splits one, the x-gap merge below
    # stitches it back.
    blobs.sort(key=lambda b: bbox(b)[0])
    letters, cur = [], [blobs[0]]
    for b in blobs[1:]:
        if bbox(b)[0] < bbox(cur[-1])[2] - 4:      # overlapping x-range = same letter
            cur.append(b)
        else:
            letters.append([c for blob in cur for c in blob])
            cur = [b]
    letters.append([c for blob in cur for c in blob])

    all_cells = [c for L in letters for c in L]
    x0, y0, x1, y1 = bbox(all_cells)
    bw, bh = x1 - x0, y1 - y0

    # Normalise to a 1000-wide viewBox so CSS sizing is predictable.
    scale = 1000.0 / bw
    vh = round(bh * scale, 1)

    names = "KAYA"
    parts = []
    for i, L in enumerate(letters):
        d = paths_for(L, scale, x0, y0)
        label = names[i] if i < len(names) else f"g{i}"
        parts.append(f'<path id="k-{i}" data-letter="{label}" d="{d}"/>')

    body = "".join(parts)
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 {vh}" '
        f'fill="currentColor" role="img" aria-label="KAYA">{body}</svg>'
    )
    (OUT / "wordmark.svg").write_text(svg, encoding="utf-8")

    # The K alone, centred in a square, for the icon.
    K = letters[0]
    kx0, ky0, kx1, ky1 = bbox(K)
    kw, kh = kx1 - kx0, ky1 - ky0
    side = max(kw, kh)
    ks = 1000.0 / side
    ox = kx0 - (side - kw) / 2
    oy = ky0 - (side - kh) / 2
    kd = paths_for(K, ks, ox, oy)
    mark = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" '
        f'fill="currentColor" role="img" aria-label="KAYA"><path d="{kd}"/></svg>'
    )
    (OUT / "mark.svg").write_text(mark, encoding="utf-8")

    print(f"source     {SRC.name}  {w}x{h} working")
    print(f"letters    {len(letters)}  ({' '.join(names[:len(letters)])})")
    print(f"wordmark   assets/brand/wordmark.svg   viewBox 0 0 1000 {vh}   "
          f"{len(svg)/1024:.1f}KB")
    print(f"mark       assets/brand/mark.svg       {len(mark)/1024:.1f}KB")


if __name__ == "__main__":
    main()
