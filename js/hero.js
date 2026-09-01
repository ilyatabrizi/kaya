// The hero: the arrangement itself, floating on the page.
//
// Not a video. The Higgsfield footage was matted frame by frame, so what ships
// is a transparent cutout sequence — the flowers and the KAYA urn with no
// background at all, drawn to a canvas over the white page. Scroll drives it:
//
//   1. The object hangs in front of the giant wordmark, breathing slightly.
//   2. Scrolling turns it — the frames are a real camera arc, so the parallax
//      is true 3D, not a CSS trick — while the wordmark lifts away.
//   3. Past the manifest's `safe` frame the blooms would clip the frame edge,
//      which is exactly when the page dives INTO the object: scale climbs
//      until the visible window is inside the flowers, and the late frames —
//      natively closer — carry the descent into petal detail.
//   4. The caption lands on the way out.
//
// Frames load progressively, coarsest first: the ends, then midpoints,
// subdividing until the whole sequence is in. The scrub is usable within a few
// hundred KB; every later arrival only refines it. If nothing ever loads, the
// poster stands and the page still works.

import { el, clamp, range, easeOut, easeInOut, lerp, reduceMotion } from './util.js';
import { HERO } from './hero-manifest.js';
import { brandEl } from './ui.js';

const SCROLL_VH = 3.0;          // how much scroll the whole move takes
const ZOOM_MAX = 2.45;          // on top of the footage's own push-in

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

  const objBox = el('div', { class: 'hero__objbox' });
  const poster = el('img', {
    class: 'hero__posterimg', src: HERO.poster, alt: 'A KAYA arrangement',
    width: HERO.w, height: HERO.h, fetchpriority: 'high', decoding: 'async',
  });
  const canvas = el('canvas', { class: 'hero__obj', 'aria-hidden': 'true' });
  const shadow = el('div', { class: 'hero__shadow' });
  objBox.append(shadow, poster, canvas);

  const cap = el('div', { class: 'hero__cap' },
    el('h1', { text: 'Flowers, as they should be.' }),
    el('p', { text: 'KAYA flower atelier — Valiasr, Tabriz' }),
  );
  const cue = el('div', { class: 'hero__cue' }, el('i', {}));

  stage.append(word, objBox, cap, cue);
  sect.append(stage);
  sect.prepend(el('h1', { class: 'sr', text: 'KAYA — flower atelier, Tabriz' }));

  once(() => drive({ sect, stage, word, objBox, poster, canvas, shadow, cap, cue }));
  return sect;
}

function drive(n) {
  const { sect, stage, word, objBox, poster, canvas, shadow, cap, cue } = n;
  const still = reduceMotion();
  const ratio = HERO.w / HERO.h;
  const stageH = () => stage.getBoundingClientRect().height || window.innerHeight;

  /* -------------------------------------------------------------- sizing */
  function measure() {
    const vw = window.innerWidth;
    const vh = stageH();
    const maxH = vh * (vw < 640 ? 0.62 : 0.68);
    const maxW = Math.min(vw * 0.88, 500);
    const w = Math.min(maxW, maxH * ratio);
    objBox.style.width = `${Math.round(w)}px`;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(w / ratio * dpr);
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
        if (loaded === 1) {
          poster.classList.add('is-gone');
          dirty = true;
        }
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

    /* the frames and the zoom. The zoom leads: past `safe` the frames carry
       edge clipping and it must already be off-screen before they play — so
       the scale ramps first, and the deep frames follow once the viewport is
       inside the object's own bounds. */
    const turn = easeInOut(range(p, 0.02, 0.58));
    const zoom = easeInOut(range(p, 0.56, 0.90));
    const dive = easeInOut(range(p, 0.70, 0.97));
    target = turn * HERO.safe + dive * (HERO.count - 1 - HERO.safe);

    /* the object — idle breath at the top, then the dive */
    const bob = p < 0.05 && loaded > 0
      ? Math.sin((performance.now() - t0) / 1300) * 5 * (1 - p / 0.05) : 0;
    const scale = lerp(0.97, 1, easeOut(range(p, 0, 0.16))) * lerp(1, ZOOM_MAX, zoom);
    const lift = lerp(0, stageH() * 0.09, zoom);   // aim the dive at the blooms
    objBox.style.transform =
      `translate(-50%,-50%) translateY(${(bob + lift).toFixed(1)}px) scale(${scale.toFixed(4)})`;

    /* the shadow — gone once the object stops being an object */
    shadow.style.opacity = String(clamp(1 - zoom * 1.8, 0, 1) * 0.9);
    shadow.style.transform = `translateX(-50%) scaleX(${(1 + bob / 90).toFixed(3)})`;

    /* caption and cue — the caption only ever appears over the petals, so it
       is white with its own scrim; reduced motion never takes this path and
       keeps ink on white */
    const cIn = easeOut(range(p, 0.80, 0.95));
    cap.style.opacity = String(cIn);
    cap.style.transform = `translateY(${lerp(14, 0, cIn)}px)`;
    cap.classList.toggle('is-over', p > 0.6);
    cue.style.opacity = String(1 - range(p, 0, 0.05));

    canvas.dataset.scale = scale.toFixed(2);
  }

  function draw() {
    const i = Math.round(clamp(shown, 0, HERO.count - 1));
    const img = nearest(i);
    if (!img) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Dive frames do not always fill their own corners — the blooms have not
    // reached them yet at that camera distance. The last whole-silhouette
    // frame drawn underneath lends those corners its own texture, so the
    // viewport never shows a bare wedge mid-dive.
    if (i > HERO.safe) {
      const under = nearest(HERO.safe);
      if (under && under !== img) ctx.drawImage(under, 0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.dataset.frame = String(Math.round(shown));
  }

  /* ---------------------------------------------------------------- loop */
  // One rAF loop does everything: chases the target frame, paints the
  // transforms, redraws the canvas when the frame changes, and idles itself
  // to a stop when there is nothing left to move.
  function tick() {
    running = false;
    if (!onScreen) return;

    paint();

    const d = target - shown;
    if (Math.abs(d) > 0.35) {
      shown += d * 0.30;
      draw();
    } else if (Math.round(target) !== Math.round(shown) || dirty) {
      shown = target;
      draw();
    }
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
