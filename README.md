# KAYA — Tabriz, Valiasr

A Persian, right-to-left, installable web app for KAYA flower atelier: the
shelf, the piece, the bespoke brief, the bag, delivery, the customer's account,
and the shop's own order board.

**Live:** https://ilyatabrizi.github.io/kaya/
**Instagram:** [@kaya_flwr](https://instagram.com/kaya_flwr)
**Studio passcode:** `5292` — K‑A‑Y‑A on a phone keypad

---

## Run it

```bash
python3 serve.py          # http://localhost:8111
python3 e2e.py            # 82 checks against the running preview
```

Static files, no build step, no runtime dependencies. Only the asset pipeline
needs Python (Pillow, numpy, imageio-ffmpeg) and the system Chrome.

```bash
python3 scripts/trace_logo.py     # the client's logo PNG  -> vector
python3 scripts/build_assets.py   # photos -> responsive WebP, icons, OG card
python3 scripts/build_hero.py     # the two clips -> the scrub video
```

`serve.py` answers Range requests. That is not decoration: without a `206` the
browser reports the hero video as unseekable and the scrub silently sits on
frame zero. GitHub Pages serves ranges; the dev server now matches it.

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
| Type | IRANYekanXFaNum, self-hosted, 300–800 |
| Eyebrow | a system serif in wide Latin caps — the one gesture borrowed from the logo, and it costs no font file |

The navigation is a floating glass pill: five tabs, one pill that slides
between them rather than blinking, and a badge that only exists when the bag
does. A second glass bar takes over at the top once the hero has finished.

Fonts are **self-hosted deliberately** — Google Fonts is slow-to-unreachable
from Iran, and this has to open on the client's phone in Tabriz on the first
try.

## The hero

Two clips generated from the client's own photographs with Higgsfield
(Seedance 2.0, image-to-video):

* **A** — the arrangement in the white KAYA vase. The camera arcs left and
  pushes in until the front blooms fill the frame.
* **B** — macro, inside the petals. The camera drifts back out until the KAYA
  ribbon lands on the last frame.

They are cut together as a match cut — A ends inside the blooms, B starts
there — and the join is invisible. Scrolling drives the video's `currentTime`;
the window grows out of its frame and takes the viewport; the wordmark hands
the name over to the top bar; the caption arrives on the reveal.

**It is a video, not a frame sequence.** The first build shipped 96 WebP frames
on the theory that seeking is unreliable on iOS. Measured, that theory cost
4.3MB — the footage is dense floral macro with no flat areas and WebP could not
get below ~45KB a frame, and 96 frames already stepped visibly under a finger.
The same twelve seconds as H.264 is **1.69MB and carries 189 frames**, because
inter-frame prediction is exactly what dense similar frames reward.

It is encoded for seeking rather than for playback: a keyframe every 8 frames
so any seek decodes at most seven, no B-frames so a seek lands on the frame it
was asked for, 16fps because the scrubber sets the pace and not the clock, and
`faststart` so it serves before it has all arrived. Seeks are issued one at a
time — queueing them is what makes naive scrubbers fall apart under a flick —
and the target is chased rather than jumped to.

If the video cannot play at all, the poster stays and every other part of the
animation still runs. Under `prefers-reduced-motion` there is no sticky
section, no video and no scrub: a framed photograph with its caption.

## The logo

The only master was a 2172×724 RGBA export with a transparent ground — every
RGB channel zero, so a luma threshold reads the whole canvas as ink.
`trace_logo.py` uses the alpha channel instead, walks each letter's boundary as
a crack path and simplifies with Douglas-Peucker at a tolerance tight enough
that the residual error is invisible at any size.

The first pass rounded the outlines with Chaikin, which is right for a
brush-drawn mark and wrong for Didone type: it turned both A counters into
blobs. Straight segments at a tight tolerance keep the apex, the crossbars and
every serif bracket. 5KB for the wordmark, one `<path>` per letter.

## Map

```
index.html            the shell — boot mark, glass bars, sheet, toast
css/app.css           the whole design system, one file
js/
  app.js              boot, routes, the chrome around the views
  router.js           hash routing (GitHub Pages has no rewrites)
  store.js            state + localStorage, and the seeded demo orders
  hero.js             the scroll scrub
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
handle, the address, and every word of Persian copy about how the shop works.

**Placeholder, pending the client's own numbers:**

* All prices, and the size multipliers (small / medium ×1.45 / large ×2.1)
* Stem counts and dimensions in each piece's "ترکیب" panel
* Delivery fees, zones and the free-delivery threshold
* Opening hours
* The seven piece names — Persian names chosen to fit the photographs

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

`e2e.py` drives a real mobile Chrome through 82 checks: the hero scrub forwards
and backwards, the shelf, filtering and sorting, size-dependent pricing, the
six-step bespoke brief with its validation, the bag, checkout validation, the
order and its tracker, the profile, the studio passcode and board, stock
toggling reaching the shop, the manifest and service worker, RTL and font
loading, grid integrity at four widths, and a full pass under
`prefers-reduced-motion`. Screenshots land in `scripts/shots/`.
