#!/usr/bin/env python3
"""End-to-end checks for the KAYA PWA.

    python3 serve.py &                                   # or another shell
    python3 e2e.py                                       # local preview
    python3 e2e.py https://ilyatabrizi.github.io/kaya/   # the deployed build

Drives a real mobile browser through every screen and every action a customer
takes — hero scrub, shop, item, custom brief, bag, checkout, order, profile,
CRM — and fails loudly on anything broken.

The hero gets its own section because it is the part that cannot be checked by
reading the DOM alone: it has to be scrolled, and the video has to actually
seek. A hidden tab freezes requestAnimationFrame, so this runs a real visible
browser rather than an automation pane.

Screenshots land in scripts/shots/.
"""
from __future__ import annotations

import pathlib
import sys

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8111/").rstrip("/") + "/"
SHOTS = pathlib.Path(__file__).resolve().parent / "scripts" / "shots"
PHONE = {"width": 390, "height": 844}

PASS: list[str] = []
FAIL: list[str] = []


def check(name, cond, detail=""):
    (PASS if cond else FAIL).append(name if cond else f"{name}  →  {detail}")


def settle(page, ms=320):
    page.wait_for_timeout(ms)


def goto(page, hash_path, ms=560):
    page.evaluate("h => { location.hash = h; }", hash_path)
    settle(page, ms)


def shot(page, name):
    SHOTS.mkdir(parents=True, exist_ok=True)
    page.screenshot(path=str(SHOTS / f"{name}.png"))


# ------------------------------------------------------------------- hero
def test_hero(page):
    page.goto(BASE, wait_until="load")
    page.wait_for_timeout(1800)          # boot screen + first paint

    check("boot screen clears",
          page.evaluate("!document.getElementById('boot')"), "boot still in DOM")

    win = page.evaluate("""() => {
      const w = document.querySelector('.hero__win');
      return w ? { w: w.getBoundingClientRect().width|0,
                   h: w.getBoundingClientRect().height|0 } : null; }""")
    check("hero window is laid out", win and win["w"] > 120 and win["h"] > 200, str(win))

    check("hero video decoded",
          page.evaluate("() => { const v=document.querySelector('.hero__vid');"
                        "return !!v && v.readyState >= 2 && v.duration > 5; }"),
          "video not ready")
    check("poster hands over to video",
          page.evaluate("() => document.querySelector('.hero__vid')"
                        ".classList.contains('is-on')"), "video never revealed")

    shot(page, "01-hero-top")

    # Scroll the whole sticky section and sample the scrub at each stop.
    samples = page.evaluate("""async () => {
      const sect = document.querySelector('.hero');
      const v = document.querySelector('.hero__vid');
      const win = document.querySelector('.hero__win');
      const total = sect.getBoundingClientRect().height - innerHeight;
      const out = [];
      for (const f of [0, .25, .5, .75, 1]) {
        scrollTo(0, Math.round(total * f));
        await new Promise(r => setTimeout(r, 700));
        out.push({ f, t: +v.currentTime.toFixed(2),
                   w: win.getBoundingClientRect().width|0,
                   h: win.getBoundingClientRect().height|0,
                   cap: +(document.querySelector('.hero__cap').style.opacity || 0),
                   word: +(document.querySelector('.hero__word').style.opacity || 1) });
      }
      return out;
    }""")

    times = [s["t"] for s in samples]
    check("scrub advances with scroll",
          all(times[i] < times[i + 1] for i in range(len(times) - 1)),
          f"currentTime did not increase: {times}")
    check("scrub covers the whole clip",
          times[0] < 0.6 and times[-1] > 9.0, f"range {times[0]}..{times[-1]}")

    widths = [s["w"] for s in samples]
    check("window opens to full bleed",
          widths[-1] >= PHONE["width"] - 2 and widths[0] < widths[-1],
          f"widths {widths}")
    check("wordmark clears as the scrub starts",
          samples[0]["word"] > 0.9 and samples[2]["word"] < 0.1,
          f"word opacity {[s['word'] for s in samples]}")
    check("caption arrives on the reveal",
          samples[0]["cap"] < 0.05 and samples[-2]["cap"] > 0.5,
          f"cap opacity {[s['cap'] for s in samples]}")

    page.evaluate("scrollTo(0, document.querySelector('.hero')"
                  ".getBoundingClientRect().height - innerHeight)")
    settle(page, 900)
    shot(page, "02-hero-reveal")

    # Scrubbing backwards must work as well as forwards.
    back = page.evaluate("""async () => {
      const v = document.querySelector('.hero__vid');
      scrollTo(0, 0);
      await new Promise(r => setTimeout(r, 900));
      return +v.currentTime.toFixed(2);
    }""")
    check("scrub runs backwards", back < 1.0, f"currentTime {back} after scrolling home")

    check("top bar takes over after the hero",
          page.evaluate("""async () => {
            scrollTo(0, innerHeight * 2.6);
            await new Promise(r => setTimeout(r, 500));
            return document.getElementById('topbar').classList.contains('is-on');
          }"""), "topbar never appeared")
    page.evaluate("scrollTo(0,0)")
    settle(page)


# ------------------------------------------------------------------- home
def test_home(page):
    goto(page, "/")
    settle(page, 700)
    check("home renders product cards",
          page.locator(".card").count() >= 6,
          f"{page.locator('.card').count()} cards")
    check("tab bar is present", page.locator(".tabbar .tab").count() == 5)
    check("footer carries both phone numbers",
          page.locator('.foot a[href^="tel:"]').count() >= 2)
    check("instagram handle is right",
          page.locator('a[href*="instagram.com/kaya_flwr"]').count() >= 1)

    page.evaluate("scrollTo(0, document.querySelector('.hero').getBoundingClientRect().height + 200)")
    settle(page, 500)
    shot(page, "03-home-shelf")


# ------------------------------------------------------------------- shop
def test_shop(page):
    goto(page, "/shop")
    n_all = page.locator(".card").count()
    check("shop lists every piece", n_all == 7, f"{n_all} cards")

    page.locator(".chips .chip", has_text="دسته‌گل").first.click()
    settle(page)
    n_bq = page.locator(".card").count()
    check("category filter narrows the list", 0 < n_bq < n_all, f"{n_bq} of {n_all}")

    page.locator(".chips .chip", has_text="همه").first.click()
    settle(page)
    page.select_option("select.inp", "low")
    settle(page)
    prices = page.evaluate("""() => [...document.querySelectorAll('.card__price')]
        .map(n => Number(n.textContent.replace(/[^\\d]/g,'')))""")
    check("cheapest-first sort works", prices == sorted(prices), str(prices))

    page.select_option("select.inp", "curated")
    settle(page)
    shot(page, "04-shop")


# ------------------------------------------------------------------- item
def test_item(page):
    goto(page, "/p/aftab")
    check("item page titles the piece",
          "آفتاب" in page.locator(".item__head h1").inner_text())
    check("item shows a price", page.locator(".item__price").count() == 1)
    check("item lists the stems", page.locator(".panel .row__t").count() >= 4)

    base = page.locator(".dock__price b").inner_text()
    page.locator(".opt", has_text="بزرگ").first.click()
    settle(page)
    big = page.locator(".dock__price b").inner_text()
    check("size changes the price", base != big, f"{base} vs {big}")

    n0 = int(page.evaluate("() => JSON.parse(localStorage.getItem('kaya.v1')||'{}').bag?.length||0"))
    page.locator(".dock .btn").click()
    settle(page, 500)
    n1 = int(page.evaluate("() => JSON.parse(localStorage.getItem('kaya.v1')).bag.length"))
    check("add to bag writes a line", n1 == n0 + 1, f"{n0} -> {n1}")
    check("bag badge shows the count",
          page.evaluate("() => { const d=document.querySelector('.tab__dot');"
                        "return !d.hidden && d.textContent === '1'; }"), "badge wrong")

    page.evaluate("scrollTo(0,0)")
    settle(page, 300)
    shot(page, "05-item")


# ----------------------------------------------------------------- custom
def test_custom(page):
    goto(page, "/custom")
    check("custom starts on step 1",
          page.locator(".steps i.is-on").count() == 1)
    check("next is blocked until a choice is made",
          page.locator("button.btn:not(.btn--ghost)").last.is_disabled(),
          "next was enabled with nothing picked")

    def pick_and_next(text):
        page.locator(".opt", has_text=text).first.click()
        settle(page, 200)
        page.locator("button.btn:not(.btn--ghost)").last.click()
        settle(page, 380)

    pick_and_next("تولد")
    pick_and_next("دسته‌گل")
    pick_and_next("صورتی")
    page.locator(".opt", has_text="رز").first.click()
    settle(page, 160)
    page.locator("button.btn:not(.btn--ghost)").last.click()   # flowers -> budget
    settle(page, 380)
    check("budget step shows a figure", page.locator(".rng").count() == 1)
    page.locator("button.btn:not(.btn--ghost)").last.click()   # budget -> details
    settle(page, 420)

    check("summary reflects the picks",
          "تولد" in page.locator(".panel").last.inner_text(), "occasion missing")

    page.locator("input.inp").first.fill("سارا مهدوی")
    page.locator('input[type="tel"]').first.fill("0912")
    settle(page, 220)
    check("bad phone blocks submission",
          page.locator("button.btn:not(.btn--ghost)").last.is_disabled(),
          "submit enabled on a 4-digit phone")

    page.locator('input[type="tel"]').first.fill("09141234567")
    settle(page, 260)
    check("valid phone unblocks submission",
          not page.locator("button.btn:not(.btn--ghost)").last.is_disabled())

    shot(page, "06-custom")
    page.locator("button.btn:not(.btn--ghost)").last.click()
    settle(page, 700)
    check("custom brief lands in the bag",
          page.evaluate("() => JSON.parse(localStorage.getItem('kaya.v1')).bag"
                        ".some(l => l.custom && l.brief && l.brief.occasion)"),
          "no custom line with a brief")
    check("custom brief redirects to the bag", "#/bag" in page.url, page.url)


# -------------------------------------------------------- bag + checkout
def test_checkout(page):
    goto(page, "/bag")
    check("bag lists the lines", page.locator(".line").count() >= 2,
          f"{page.locator('.line').count()} lines")
    total_before = page.locator(".kv--total dd").inner_text()

    page.locator(".qty button").first.click()      # minus on the first line
    settle(page, 400)
    check("quantity control changes the total",
          page.locator(".kv--total dd").inner_text() != total_before
          or page.locator(".line").count() == 1, "total unchanged")

    shot(page, "07-bag")
    goto(page, "/checkout", ms=700)

    check("checkout offers all delivery zones", page.locator(".row--btn").count() >= 3)
    check("submit blocked before details", page.locator(".btn--lg").is_disabled(),
          "submit enabled with an empty form")

    page.locator(".chips .chip").nth(1).click()          # a delivery day
    settle(page, 160)

    fields = page.locator("textarea.inp")
    fields.first.fill("تبریز، خیابان ولیعصر، کوچه گلها، پلاک ۱۲")
    inputs = page.locator('input.inp')
    # recipient name, recipient phone, unit, buyer name, buyer phone
    page.locator('.panel', has_text="گیرنده").locator('input.inp').nth(0).fill("الهام رستمی")
    page.locator('.panel', has_text="گیرنده").locator('input[type="tel"]').first.fill("09355550187")
    page.locator('.panel', has_text="شما").locator('input.inp').first.fill("سارا مهدوی")
    page.locator('.panel', has_text="شما").locator('input[type="tel"]').first.fill("09145550132")
    settle(page, 400)
    check("submit unblocks once the form is valid",
          not page.locator(".btn--lg").is_disabled(), "still disabled")

    shot(page, "08-checkout")
    page.locator(".btn--lg").click()
    settle(page, 900)
    check("order lands on its own page", "#/order/" in page.url, page.url)
    check("bag empties after ordering",
          page.evaluate("() => JSON.parse(localStorage.getItem('kaya.v1')).bag.length") == 0)
    check("order confirmation shows a tracker",
          page.locator(".steps i.is-done").count() >= 1)
    shot(page, "09-order")


# ---------------------------------------------------------------- account
def test_account(page):
    goto(page, "/account")
    check("profile shows the saved name",
          "سارا" in page.locator(".page__head h1, h1").first.inner_text(),
          page.locator("h1").first.inner_text())
    check("profile counts orders", page.locator(".stat").count() == 4)
    goto(page, "/orders")
    check("order history lists the order", page.locator(".row--btn").count() >= 1)
    shot(page, "10-account")


# -------------------------------------------------------------------- crm
def test_crm(page):
    goto(page, "/crm", ms=700)
    check("crm is locked by default", page.locator(".pin input").count() == 4,
          "no passcode screen")

    cells = page.locator(".pin input")
    for i, d in enumerate("1111"):
        cells.nth(i).fill(d)
    settle(page, 420)
    check("wrong passcode is refused", page.locator(".pin input").count() == 4,
          "wrong pin unlocked the panel")

    cells = page.locator(".pin input")
    for i, d in enumerate("5292"):
        cells.nth(i).fill(d)
    settle(page, 800)
    check("right passcode unlocks the panel", page.locator(".tabs").count() == 1,
          "panel did not open")
    check("crm shows the day's figures", page.locator(".stat").count() == 4)
    check("crm board lists orders", page.locator(".ord").count() >= 1,
          f"{page.locator('.ord').count()} order cards")

    shot(page, "11-crm")

    page.locator(".tabs button", has_text="جدید").click()
    settle(page, 400)
    n_new = page.locator(".ord").count()
    check("new column has the fresh order", n_new >= 1, f"{n_new}")

    adv = page.locator(".ord .chip").first
    label = adv.inner_text()
    adv.click()
    settle(page, 500)
    check("status advances off the new column",
          page.locator(".ord").count() == n_new - 1,
          f"still {page.locator('.ord').count()} in new")

    page.locator(".tabs button", has_text="مشتری").click()
    settle(page, 400)
    check("crm derives a customer list", page.locator(".row--btn").count() >= 1)

    page.locator(".tabs button", has_text="موجودی").click()
    settle(page, 400)
    check("stock toggles exist for every piece", page.locator(".sw").count() == 7,
          f"{page.locator('.sw').count()} toggles")
    page.locator(".sw").first.click()
    settle(page, 400)
    goto(page, "/shop")
    check("an out-of-stock piece is marked in the shop",
          page.locator(".card__tag", has_text="موجود نیست").count() >= 1,
          "no out-of-stock badge")
    shot(page, "12-crm-stock")


# ------------------------------------------------------------------- pwa
def test_pwa(page):
    goto(page, "/")
    m = page.evaluate("""async () => {
      const r = await fetch('manifest.webmanifest');
      const j = await r.json();
      return { name: j.short_name, display: j.display, icons: j.icons.length,
               maskable: j.icons.some(i => i.purpose === 'maskable'),
               start: j.start_url, dir: j.dir, lang: j.lang,
               shortcuts: (j.shortcuts||[]).length };
    }""")
    check("manifest names the app KAYA", m["name"] == "KAYA", str(m["name"]))
    check("manifest is standalone", m["display"] == "standalone")
    check("manifest is RTL Persian", m["dir"] == "rtl" and m["lang"] == "fa")
    check("manifest ships a full icon set", m["icons"] >= 10, str(m["icons"]))
    check("manifest has a maskable icon", m["maskable"])
    check("manifest declares shortcuts", m["shortcuts"] == 3)
    check("service worker registers",
          page.evaluate("() => navigator.serviceWorker.getRegistrations()"
                        ".then(r => r.length > 0)"), "no registration")
    check("apple touch icon is linked",
          page.locator('link[rel="apple-touch-icon"]').count() == 1)
    check("app title is set for iOS",
          page.get_attribute('meta[name="apple-mobile-web-app-title"]', 'content') == 'KAYA')


# ------------------------------------------------------------------ rtl
def test_rtl_and_type(page):
    goto(page, "/")
    check("document is RTL Persian",
          page.get_attribute("html", "dir") == "rtl"
          and page.get_attribute("html", "lang") == "fa")
    check("body renders in IRANYekanX",
          "YekanX" in page.evaluate("() => getComputedStyle(document.body).fontFamily"))
    check("no page-level horizontal scroll",
          page.evaluate("() => document.documentElement.scrollWidth <= innerWidth + 1"),
          page.evaluate("() => document.documentElement.scrollWidth + ' vs ' + innerWidth"))
    # Latin phone numbers and handles must not be reordered by bidi.
    goto(page, "/about")
    check("phone numbers are isolated LTR",
          page.locator('[dir="ltr"]').count() >= 2)
    check("about page answers the common questions",
          page.locator(".row--btn[aria-expanded]").count() >= 5)
    shot(page, "13-about")


GRID_HOLES = """() => {
  // Group the cards by the row they landed on. Every row but the last must be
  // full — a full-width card sitting mid-grid leaves the row before it short,
  // which is a hole, not a layout.
  const g = document.querySelector('.grid');
  if (!g) return 'no grid';
  const cols = getComputedStyle(g).gridTemplateColumns.split(' ').length;
  const rows = new Map();
  for (const c of g.children) {
    const b = c.getBoundingClientRect();
    const key = Math.round(b.top);
    rows.set(key, (rows.get(key) || 0) + (c.classList.contains('card--wide') ? cols : 1));
  }
  const counts = [...rows.entries()].sort((a, b) => a[0] - b[0]).map(e => e[1]);
  const short = counts.slice(0, -1).filter(n => n !== cols);
  return short.length ? `cols=${cols} rows=${counts}` : '';
}"""


def check_grid(page, label):
    holes = page.evaluate(GRID_HOLES)
    check(f"{label} grid has no holes", holes == "", holes)


def test_desktop(page):
    for w in (1280, 900, 700):
        page.set_viewport_size({"width": w, "height": 900})
        goto(page, "/", ms=800)
        page.evaluate("scrollTo(0, document.querySelector('.hero')"
                      ".getBoundingClientRect().height + 300)")
        settle(page, 400)
        check_grid(page, f"home @{w}")
        goto(page, "/shop", ms=600)
        check_grid(page, f"shop @{w}")
    page.set_viewport_size(PHONE)
    goto(page, "/", ms=700)
    page.evaluate("scrollTo(0, document.querySelector('.hero')"
                  ".getBoundingClientRect().height + 300)")
    settle(page, 400)
    check_grid(page, "home @390")

    page.set_viewport_size({"width": 1280, "height": 860})
    goto(page, "/", ms=900)
    check("desktop shows the top nav links",
          page.locator(".topbar__links a").count() == 3)
    page.evaluate("scrollTo(0, document.querySelector('.hero').getBoundingClientRect().height + 300)")
    settle(page, 600)
    check("desktop grid is four across",
          page.evaluate("""() => {
            const g = document.querySelector('.grid');
            return getComputedStyle(g).gridTemplateColumns.split(' ').length === 4; }"""),
          page.evaluate("() => getComputedStyle(document.querySelector('.grid')).gridTemplateColumns"))
    check("no horizontal scroll on desktop",
          page.evaluate("() => document.documentElement.scrollWidth <= innerWidth + 1"))
    shot(page, "14-desktop")
    page.set_viewport_size(PHONE)


# ------------------------------------------------------------------- run
def main():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        sys.exit("needs playwright:  pip install playwright && playwright install chrome")

    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel="chrome")
        ctx = browser.new_context(
            viewport=PHONE, device_scale_factor=2, is_mobile=True,
            has_touch=True, locale="fa-IR", reduced_motion="no-preference",
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
                       "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile Safari/604.1",
        )
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

        for fn in (test_hero, test_home, test_shop, test_item, test_custom,
                   test_checkout, test_account, test_crm, test_pwa,
                   test_rtl_and_type, test_desktop):
            try:
                fn(page)
            except Exception as exc:                       # noqa: BLE001
                FAIL.append(f"{fn.__name__} threw  →  {type(exc).__name__}: {exc}")

        check("no javascript errors anywhere",
              not errors, "; ".join(errors[:3]))

        # A second pass with reduced motion asked for: the hero must become a
        # still photograph rather than a half-working animation.
        rm = browser.new_context(viewport=PHONE, device_scale_factor=2,
                                 locale="fa-IR", reduced_motion="reduce")
        rp = rm.new_page()
        try:
            rp.goto(BASE, wait_until="load")
            rp.wait_for_timeout(1700)
            check("reduced motion drops the scroll-jacking",
                  rp.evaluate("() => document.querySelector('.hero')"
                              ".getBoundingClientRect().height < innerHeight * 1.6"),
                  rp.evaluate("() => document.querySelector('.hero')"
                              ".getBoundingClientRect().height + ' vs ' + innerHeight"))
            check("reduced motion removes the video",
                  rp.evaluate("() => !document.querySelector('.hero__vid')"),
                  "video still present")
            check("reduced motion still shows the caption",
                  rp.evaluate("() => +document.querySelector('.hero__cap')"
                              ".style.opacity === 1"), "caption hidden")
            check("reduced motion still reaches the shop",
                  rp.evaluate("() => document.querySelectorAll('.card').length >= 6"))
            shot(rp, "15-reduced-motion")
        except Exception as exc:                           # noqa: BLE001
            FAIL.append(f"reduced-motion pass threw  →  {type(exc).__name__}: {exc}")
        rm.close()
        browser.close()

    for line in PASS:
        print(f"  ok    {line}")
    for line in FAIL:
        print(f"  FAIL  {line}")
    print(f"\n{len(PASS)} passed, {len(FAIL)} failed")
    sys.exit(1 if FAIL else 0)


if __name__ == "__main__":
    main()
