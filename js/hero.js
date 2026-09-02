// The hero: the arrangement itself, floating on the page.
//
// Not a video. The orbit footage was matted frame by frame, so what ships is a
// transparent cutout sequence — the flowers and the KAYA urn with no
// background at all, drawn to a canvas over the white page. Scroll drives it:
//
//   1. The object hangs in front of the giant wordmark, breathing slightly.
//   2. Scrolling turns it through a real camera orbit — true parallax, not a
//      CSS trick — while the wordmark lifts away.
//   3. The zoom carries the page into the blooms while the orbit keeps
//      turning underneath it, and the caption lands on the way out.
//
// The zoom is drawn, not CSS-scaled. v2 scaled a ~680px canvas 2.4x with a
// transform, which upscales the *raster* and turns petals to mush no matter
// how good the frames are. Here the canvas is allocated at the viewport's own
// device resolution and every tick draws the current frame into a computed
// rect — so zooming reads deeper into the 1000px source instead of stretching
// pixels that were already spent.
//
// Frames load coarsest-first — the ends, then midpoints, subdividing — so the
// scrub responds within a few hundred KB and every later arrival refines it.
// If nothing ever loads, the poster stands and the page still works.

import { el, clamp, range, easeOut, easeInOut, lerp, reduceMotion } from './util.js';
import { HERO } from './hero-manifest.js';
import { brandEl } from './ui.js';

const SCROLL_VH = 3.0;          // how much scroll the whole move takes
const ZOOM_MAX = 2.0;           // read from the source, not stretched
const CENTER_Y = 0.53;          // where the object hangs in the stage

// Run fn once, on whichever of the next animation frame or the next timer
// arrives first. rAF alone is not enough: a hidden tab never fires one.
function once(fn) {
  let done = false;
  const run = () => { if (done) return; done = true; fn(); };
  requestAnimationFrame(run);
  setTimeout(run, 60);
}

export function heroSection() {
  const sect = el('section', { class: 'hero', style: { height: `${SCROLL_VH * 100}svh` } });
  const stage = el('div', { class: 'hero__stage' });

  const word = brandEl('word', 'hero__word');
  word.setAttribute('aria-hidden', 'true');

  // The box carries the poster and the shadow; the canvas spans the stage.
  const objBox = el('div', { class: 'hero__objbox' });
  const poster = el('img', {
    class: 'hero__posterimg', src: HERO.poster, alt: 'A KAYA arrangement',
    width: HERO.w, height: HERO.h, fetchpriority: 'high', decoding: 'async',
  });
  const shadow = el('div', { class: 'hero__shadow' });
  objBox.append(shadow, poster);
  const canvas = el('canvas', { class: 'hero__obj', 'aria-hidden': 'true' });

  const cap = el('div', { class: 'hero__cap' },
    el('h1', { text: 'Flowers, as they should be.' }),
    el('p', { text: 'KAYA flower atelier — Valiasr, Tabriz' }),
  );
  const cue = el('div', { class: 'hero__cue' }, el('i', {}));

  stage.append(word, objBox, canvas, cap, cue);
  sect.append(stage);
  sect.prepend(el('h1', { class: 'sr', text: 'KAYA — flower atelier, Tabriz' }));

  once(() => drive({ sect, stage, word, objBox, poster, canvas, shadow, cap, cue }));
  return sect;
}

function drive(n) {
  const { sect, stage, word, objBox, poster, canvas, shadow, cap, cue } = n;
  const still = reduceMotion();
  const ratio = HERO.w / HERO.h;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const stageH = () => stage.getBoundingClientRect().height || window.innerHeight;

  /* -------------------------------------------------------------- sizing */
  let w0 = 0, h0 = 0;            // the object's resting display size, CSS px
  function measure() {
    const vw = window.innerWidth;
    const vh = stageH();
    const maxH = vh * (vw < 640 ? 0.62 : 0.68);
    w0 = Math.min(Math.min(vw * 0.88, 500), maxH * ratio);
    h0 = w0 / ratio;
    objBox.style.width = `${Math.round(w0)}px`;
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
  }
  measure();

  /* ------------------------------------------------------ reduced motion */
  // A still photograph of the object, the name above it, the caption under
  // it. No sticky section, no frames, nothing that moves on its own.
  if (still) {
    sect.style.height = 'auto';
    stage.style.position = 'static';
    stage.style.height = 'auto';
    stage.style.display = 'grid';
    stage.style.justifyItems = 'center';
    stage.style.padding = '34px 0 44px';
    word.style.position = 'static';
    word.style.transform = 'none';
    word.style.margin = '0 auto 10px';
    objBox.style.position = 'static';
    objBox.style.transform = 'none';
    canvas.remove();
    cue.remove();
    cap.style.position = 'static';
    cap.style.opacity = '1';
    cap.style.marginTop = '22px';
    return;
  }

  /* -------------------------------------------------------------- frames */
  const frames = new Array(HERO.count).fill(null);
  let loaded = 0;

  // Coarsest-first order: the ends, then midpoints, subdividing.
  const order = [];
  {
    const seen = new Set();
    const push = (i) => { if (!seen.has(i)) { seen.add(i); order.push(i); } };
    push(0); push(HERO.count - 1);
    const q = [[0, HERO.count - 1]];
    while (q.length) {
      const [a, b] = q.shift();
      if (b - a < 2) continue;
      const m = (a + b) >> 1;
      push(m);
      q.push([a, m], [m, b]);
    }
  }

  let inflight = 0;
  function pump() {
    while (inflight < 5 && order.length) {
      const i = order.shift();
      inflight += 1;
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        frames[i] = img;
        loaded += 1;
        inflight -= 1;
        if (loaded === 1) poster.classList.add('is-gone');
        dirty = true;
        pump(); wake();
      };
      img.onerror = () => { inflight -= 1; pump(); };
      img.src = `${HERO.path}${String(i).padStart(3, '0')}${HERO.ext}`;
    }
  }
  pump();

  const nearest = (i) => {
    if (frames[i]) return frames[i];
    for (let d = 1; d < HERO.count; d += 1) {
      if (frames[i - d]) return frames[i - d];
      if (frames[i + d]) return frames[i + d];
    }
    return null;
  };

  /* --------------------------------------------------------------- state */
  let progress = 0;
  let target = 0;        // frame index the scroll asks for
  let shown = 0;         // frame index on screen
  let scaleNow = 1;
  let offYNow = 0;
  let drawnKey = '';
  let dirty = true;
  let running = false;
  let onScreen = true;
  const t0 = performance.now();

  function readScroll() {
    const box = sect.getBoundingClientRect();
    const total = box.height - stageH();
    progress = total > 0 ? clamp(-box.top / total, 0, 1) : 0;
    dirty = true;
    wake();
  }

  function paint() {
    const p = progress;

    /* the wordmark — lifts away as the turn starts */
    const wOut = easeOut(range(p, 0.03, 0.24));
    word.style.opacity = String(1 - wOut);
    word.style.transform =
      `translateX(-50%) translateY(${lerp(0, -30, wOut)}px) scale(${lerp(1, 0.92, wOut)})`;

    /* the orbit runs the whole scroll; the zoom rides on top of its tail */
    const turn = easeInOut(range(p, 0.02, 0.88));
    const zoom = easeInOut(range(p, 0.62, 0.94));
    target = turn * (HERO.count - 1);

    const bob = p < 0.05 && loaded > 0
      ? Math.sin((performance.now() - t0) / 1300) * 5 * (1 - p / 0.05) : 0;
    scaleNow = lerp(0.97, 1, easeOut(range(p, 0, 0.16))) * lerp(1, ZOOM_MAX, zoom);
    offYNow = bob + lerp(0, stageH() * 0.09, zoom);   // aim the dive at the blooms

    /* the poster and shadow ride the layout box, as before */
    objBox.style.transform =
      `translate(-50%,-50%) translateY(${offYNow.toFixed(1)}px) scale(${scaleNow.toFixed(4)})`;
    shadow.style.opacity = String(clamp(1 - zoom * 1.8, 0, 1) * 0.9);
    shadow.style.transform = `translateX(-50%) scaleX(${(1 + bob / 90).toFixed(3)})`;

    /* caption and cue — the caption only ever appears over the petals, so it
       is white with its own scrim; reduced motion never takes this path */
    const cIn = easeOut(range(p, 0.80, 0.95));
    cap.style.opacity = String(cIn);
    cap.style.transform = `translateY(${lerp(14, 0, cIn)}px)`;
    cap.classList.toggle('is-over', p > 0.6);
    cue.style.opacity = String(1 - range(p, 0, 0.05));
  }

  function draw() {
    const i = Math.round(clamp(shown, 0, HERO.count - 1));
    const img = nearest(i);
    if (!img) return;
    // Skip only if literally nothing moved since the last draw.
    const key = `${i}|${scaleNow.toFixed(4)}|${offYNow.toFixed(1)}`;
    if (key === drawnKey && !dirty) return;
    drawnKey = key;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // The zoom is a bigger destination rect at device resolution — the source
    // is read deeper, never stretched after rasterisation.
    const dw = w0 * scaleNow * dpr;
    const dh = h0 * scaleNow * dpr;
    const dx = canvas.width / 2 - dw / 2;
    const dy = stageH() * CENTER_Y * dpr - dh / 2 + offYNow * dpr;
    ctx.drawImage(img, dx, dy, dw, dh);
    canvas.dataset.frame = String(i);
    canvas.dataset.scale = scaleNow.toFixed(2);
  }

  /* ---------------------------------------------------------------- loop */
  function tick() {
    running = false;
    if (!onScreen) return;

    paint();

    const d = target - shown;
    if (Math.abs(d) > 0.35) shown += d * 0.30;
    else shown = target;
    draw();
    dirty = false;

    // Keep breathing at the top; keep chasing while moving.
    if (Math.abs(target - shown) > 0.35 || progress < 0.05) wake();
  }
  function wake() {
    if (!running) { running = true; requestAnimationFrame(tick); }
  }

  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', () => { measure(); dirty = true; readScroll(); },
    { passive: true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => {
      for (const e of es) {
        onScreen = e.isIntersecting;
        if (onScreen) { dirty = true; wake(); }
      }
    }, { rootMargin: '120px' }).observe(sect);
  }
  readScroll();
}
