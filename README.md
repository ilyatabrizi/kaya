# KAYA — Tabriz, Valiasr

An English, installable web app for KAYA flower atelier: the shelf, the piece,
the bespoke brief, the bag, delivery, the customer's account, and the shop's
own order board.

**Live:** https://ilyatabrizi.github.io/kaya/
**Instagram:** [@kaya_flwr](https://instagram.com/kaya_flwr)
**Studio passcode:** `5292` — K‑A‑Y‑A on a phone keypad

---

## Run it

```bash
python3 serve.py          # http://localhost:8111
python3 e2e.py            # the check suite against the running preview
```

Static files, no build step, no runtime dependencies. Only the asset pipeline
needs Python (Pillow, numpy, imageio-ffmpeg, rembg) and the system Chrome.

```bash
python3 scripts/trace_logo.py     # the client's logo PNG  -> vector
python3 scripts/fetch_fonts.py    # Inter + Playfair, subset and self-hosted
python3 scripts/build_assets.py   # photos -> responsive WebP, icons, OG card
python3 scripts/build_hero.py     # the clip -> the transparent cutout sequence
```

---

## The design

White paper, black ink, and **the flowers carry every colour in the app**.
Nothing in the interface is tinted — no brand hue, no accent, no coloured
button. The only saturated pixels on any screen belong to a photograph, which
is the whole point of a florist's shop.

| | |
|---|---|
| Page | `#FBFAF9` — the warm wall the cards hang on |
| Card | `#FFFFFF`, hairline edge, soft shadow |
| Ink | `#0B0B0C` — type, and every filled control |
| Wash | `#F2F0ED` — chips, inactive fills, round row icons |
| Glass | `rgba(255,255,255,.72)` + `blur(26px) saturate(190%)` |
| Interface | Inter (variable, self-hosted, 25KB) |
| Display | Playfair Display — the closest face to the wordmark's own Didone letterforms |

The navigation is a floating glass pill: five tabs, one pill that slides
between them rather than blinking, and a badge that only exists when the bag
does. A second glass bar takes over at the top once the hero has finished.

Fonts are **self-hosted deliberately** — Google Fonts is slow-to-unreachable
from Iran, and this has to open on the client's phone in Tabriz on the first
try. The **PWA icon is the complete KAYA wordmark**, not an abbreviation.

## The hero

Not a video. The arrangement itself — the flowers and the KAYA urn, and
nothing else — floats on the white page in front of a giant wordmark, and the
scroll drives it: the object turns, the letters lift away, and then the page
dives into the blooms until petal texture fills the screen. The caption lands
on the way out.

Under it is Higgsfield footage of the client's own arrangement (Seedance 2.0,
a slow arc around the piece), **matted frame by frame** into a transparent
WebP sequence and drawn to a canvas:

* **isnet-general-use** does the matting. Alone it dissolves the subject the
  moment the blooms touch the frame edge; **padding each frame with a blurred
  stretch of its own background** before matting — and cropping back — keeps
  the subject bounded and holds the matte through the whole clip.
* A **1-2-1 temporal blend on the alpha channel** stops fine spikes
  shimmering between independently-matted frames.
* The manifest records the last frame whose silhouette is fully inside the
  frame (`safe`). The floating phase scrubs `0..safe`; past it the blooms
  would clip the frame edge — which is exactly when the dive has already
  zoomed the view inside the object, so the clipped edges are off-screen and
  the natively-closer late frames carry the descent.
* Frames load **coarsest first** — the ends, then midpoints, subdividing — so
  the scrub responds within a few hundred KB and every later arrival only
  refines it.

If no frame ever loads, the poster stands. Under `prefers-reduced-motion`
there is no sticky section and no canvas: the object, the name, the caption.

## The logo

The only master was a 2172×724 RGBA export with a transparent ground — every
RGB channel zero, so a luma threshold reads the whole canvas as ink.
`trace_logo.py` uses the alpha channel instead, walks each letter's boundary as
a crack path and simplifies with Douglas-Peucker with straight segments at a
tight tolerance: this is Didone type, and rounding the corners (the first
attempt) turned both A counters into blobs. 5KB, one `<path>` per letter.

## Map

```
index.html            the shell — boot mark, glass bars, sheet, toast
css/app.css           the whole design system, one file
js/
  app.js              boot, routes, the chrome around the views
  router.js           hash routing (GitHub Pages has no rewrites)
  store.js            state + localStorage, and the seeded demo orders
  hero.js             the floating-cutout scrub
  ui.js               photo, card, sheet, toast, footer
  data.js             the catalogue and the bespoke options
  config.js           everything the client owns and might change
  views/              home, shop, item, custom, bag, checkout, orders,
                      account, about, crm
assets/
  brand/  fonts/  photos/  hero/  icons/
scripts/              the asset pipeline + its sources
```

## What is real and what is placeholder

**Real** — the seven photographs, the logo, both phone numbers, the Instagram
handle, and Tabriz / Valiasr.

**Placeholder, pending the client's own numbers:**

* All prices, and the size multipliers (Petite / Classic ×1.45 / Grand ×2.1)
* Stem counts and dimensions in each piece's Composition panel
* Delivery fees, zones and the free-delivery threshold
* Opening hours
* The seven piece names — Persian words (Hezar, Sahar, Banafsheh, Arghavan,
  Aftab, Nilgoon, Shahd), chosen to fit the photographs, glossed in English

Change them in `js/config.js` and `js/data.js`. Nothing else needs touching.

## What the preview does not have

No server. The bag, the profile, the orders and the shop's board all live in
`localStorage` on the device that made them — so the client can place an order
on his phone and watch it appear on his own board, but two phones do not see
each other. Every write goes through one `save()`, so a real backend is one
file's worth of work rather than a rewrite.

No payment gateway. Checkout offers card-to-card, a payment link, or cash on
delivery, and takes no card details anywhere — which is what a shop this size
actually does, and a preview that faked a gateway would be found out the first
time it was clicked.

## Tests

`e2e.py` drives a real mobile Chrome through the whole app: the cutout hero
(frames advance with scroll, forwards and backwards, the dive zooms, and it is
provably not a `<video>`), the shelf, filtering and sorting, size-dependent
pricing, the six-step bespoke brief with its validation, the bag, checkout
validation, the order and its tracker, the profile, the studio passcode and
board, stock toggling reaching the shop, the manifest and service worker,
English-only rendering (a Persian-glyph scan on every main screen), grid
integrity at four widths, and a full pass under `prefers-reduced-motion`.
Screenshots land in `scripts/shots/`.
