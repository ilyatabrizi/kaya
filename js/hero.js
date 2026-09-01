// The scroll-scrubbed hero.
//
// A portrait window hung on a white wall. Scrolling drives the video's
// currentTime rather than the page: the camera pushes into the arrangement,
// match-cuts into the petals, and drifts back out until the KAYA ribbon lands
// on the last frame. At the same time the window grows out of its frame and
// takes the whole viewport, and the wordmark hands itself off to the top bar.
//
// Three things make the seek survive a phone:
//
//   * The file is encoded for it — keyframe every 8 frames, no B-frames, so a
//     seek decodes at most seven frames to land exactly where it was asked.
//   * Seeks are issued at most one at a time. Setting currentTime while a seek
//     is in flight queues work the decoder cannot drop, which is what makes
//     naive scrub implementations fall apart under a fast flick.
//   * The target is chased, not jumped to. The scroll position sets a target
//     time; a rAF loop eases the video toward it. That smooths the 16fps grid
//     into something continuous and hides any seek that arrives late.
//
// If the video cannot play at all — a locked-down browser, Data Saver, a
// decode failure — the poster stays up and every other part of the animation
// still runs. The hero degrades to a still photograph, which is a perfectly
// good hero.

import { el, clamp, range, easeOut, lerp, reduceMotion } from './util.js';
import { HERO } from './hero-manifest.js';
import { brandEl } from './ui.js';
import { icon } from './icons.js';

const SCROLL_VH = 3.2;          // how much scroll the whole scrub takes

// Run fn once, on whichever of the next animation frame or the next timer
// arrives first. rAF alone is not enough: a hidden tab never fires one.
function once(fn) {
  let done = false;
  const run = () => { if (done) return; done = true; fn({}); };
  requestAnimationFrame(run);
  setTimeout(run, 60);
}

export function heroSection() {
  const sect = el('section', { class: 'hero', style: { height: `${SCROLL_VH * 100}svh` } });
  const stage = el('div', { class: 'hero__stage' });

  const win = el('div', { class: 'hero__win' });
  const poster = el('img', {
    class: 'hero__poster', src: HERO.poster, alt: 'گل‌آرایی کایا',
    width: HERO.w, height: HERO.h, fetchpriority: 'high', decoding: 'async',
  });
  const vid = el('video', {
    class: 'hero__vid', src: HERO.src, muted: true, playsinline: true,
    preload: 'auto', tabindex: '-1', 'aria-hidden': 'true',
  });
  vid.muted = true;                 // the attribute alone is not enough on iOS
  vid.defaultMuted = true;
  vid.playsInline = true;
  win.append(poster, vid);

  const word = brandEl('word', 'hero__word');
  word.setAttribute('aria-hidden', 'true');

  const cap = el('div', { class: 'hero__cap' },
    el('h1', { text: 'گل، همان‌طور که باید باشد' }),
    el('p', { text: 'آتلیه گل‌آرایی کایا — تبریز، ولیعصر' }),
  );

  // No label. A word here would have to be either a Latin loan or a verb that
  // means the wrong thing in Persian; the line says it without either.
  const cue = el('div', { class: 'hero__cue' }, el('i', {}));

  // Source order is wordmark, window, caption: the still (reduced-motion)
  // hero renders them in flow in that order, and the animated one positions
  // all three absolutely, so the order costs nothing there.
  stage.append(word, win, cap, cue);
  sect.append(stage);

  // h1 for the document outline; the visible one is inside .hero__cap.
  sect.prepend(el('h1', { class: 'sr', text: 'کایا — آتلیه گل‌آرایی، تبریز' }));

  // Set up on the next frame, so the section is in the document and can be
  // measured — but not *only* on the next frame: a background or hidden tab
  // freezes rAF indefinitely, and the hero would sit at zero size until the
  // tab was looked at. A timer runs the same setup if rAF has not.
  once((n) => drive({ ...n, sect, stage, win, poster, vid, word, cap, cue }));
  return sect;
}

function drive(nodes) {
  const { sect, win, poster, vid, word, cap, cue } = nodes;
  const still = reduceMotion();

  /* --------------------------------------------------------- the window */
  // Framed size: a portrait print, comfortably inside the viewport. Full size:
  // the viewport itself, cropped to cover. Everything in between is a lerp.
  let framed = { w: 0, h: 0 }, full = { w: 0, h: 0 }, ratio = HERO.w / HERO.h;

  function measure() {
    const vw = window.innerWidth;
    const vh = stageHeight();
    // Leave room for the wordmark above and the caption below.
    const maxH = vh - (vw < 640 ? 268 : 250);
    const maxW = vw < 640 ? vw * 0.72 : Math.min(vw * 0.34, 430);
    let h = Math.min(maxH, maxW / ratio);
    let w = h * ratio;
    if (w > maxW) { w = maxW; h = w / ratio; }
    framed = { w, h };
    // Cover the viewport at the end.
    const coverH = Math.max(vh, vw / ratio);
    full = { w: Math.max(vw, vh * ratio), h: coverH };
  }

  const stageHeight = () => nodes.stage.getBoundingClientRect().height || window.innerHeight;

  /* ------------------------------------------------------- reduced motion */
  // A photograph, framed, with its caption under it. No sticky section to
  // scroll through, no video, nothing that moves on its own. Scrubbing is
  // direct manipulation rather than animation, but the growing window and the
  // fading caption are not — and half a hero is worse than a still one.
  //
  // This has to happen before any of the playback wiring below: onReady()
  // schedules the poster's fade-out, and a poster that fades out over a video
  // that was then removed leaves an empty grey box.
  measure();
  if (still) {
    sect.style.height = 'auto';
    nodes.stage.style.position = 'static';
    nodes.stage.style.padding = '26px 0 40px';
    win.style.width = `${Math.round(framed.w)}px`;
    win.style.height = `${Math.round(framed.h)}px`;
    win.style.borderRadius = '26px';
    poster.classList.remove('is-gone');
    cap.style.position = 'static';
    cap.style.opacity = '1';
    cap.style.marginTop = '26px';
    cue.remove();
    word.style.position = 'static';
    word.style.transform = 'none';
    word.style.margin = '0 auto 26px';
    vid.remove();
    return;
  }

  /* ------------------------------------------------------------ playback */
  let ready = false;
  let seeking = false;
  let target = 0;      // where the scroll says we should be
  let shown = 0;       // where the video actually is
  const dur = () => (Number.isFinite(vid.duration) && vid.duration > 0
    ? vid.duration : HERO.duration);

  function onReady() {
    if (ready) return;
    ready = true;
    vid.classList.add('is-on');
    // Hold the poster one beat behind the video so the swap never flashes.
    setTimeout(() => poster.classList.add('is-gone'), 220);
    try { vid.currentTime = target; } catch { /* not seekable yet */ }
  }
  vid.addEventListener('loadeddata', onReady, { once: true });
  vid.addEventListener('canplay', onReady, { once: true });
  // A cached or local file can be ready before these listeners exist, and then
  // neither event ever fires again — leaving the poster up over a video that
  // has been decoded and waiting the whole time.
  if (vid.readyState >= 2) onReady();
  vid.addEventListener('seeked', () => { seeking = false; });
  vid.addEventListener('error', () => { ready = false; });

  // Safari will not fetch a preload=auto video until it has a reason. A muted
  // play() then pause() gives it one, and doubles as the gesture unlock.
  const nudge = () => {
    const p = vid.play();
    if (p && p.then) p.then(() => vid.pause()).catch(() => { /* fine */ });
    else { try { vid.pause(); } catch { /* fine */ } };
  };
  nudge();
  ['pointerdown', 'touchstart', 'keydown'].forEach((ev) =>
    addEventListener(ev, nudge, { once: true, passive: true }));

  /* -------------------------------------------------------------- frame */
  let progress = 0;
  let raf = 0;
  let dirty = true;

  function readScroll() {
    const box = sect.getBoundingClientRect();
    const total = box.height - stageHeight();
    progress = total > 0 ? clamp(-box.top / total, 0, 1) : 0;
    dirty = true;
    if (!raf) raf = requestAnimationFrame(paint);
  }

  function paint() {
    raf = 0;
    const p = progress;

    /* the window */
    // Grows a little through the scrub, then takes the viewport at the end.
    const grow = easeOut(range(p, 0, 0.30));
    const open = easeOut(range(p, 0.74, 1));
    const w = lerp(lerp(framed.w * 0.9, framed.w, grow), full.w, open);
    const h = lerp(lerp(framed.h * 0.9, framed.h, grow), full.h, open);
    win.style.width = `${Math.round(w)}px`;
    win.style.height = `${Math.round(h)}px`;
    win.style.borderRadius = `${Math.round(lerp(26, 0, open))}px`;
    win.style.boxShadow = open > 0.9 ? 'none' : '';

    /* the wordmark */
    // Rides the top edge of the window, so it keeps its distance as the window
    // grows, and lifts away once the scrub is under way — by the time the top
    // bar slides in, the hero has already handed the name over.
    const gap = window.innerWidth < 640 ? 30 : 38;
    const top = (stageHeight() - h) / 2 - gap;
    const wOut = easeOut(range(p, 0.02, 0.32));
    word.style.bottom = `${Math.round(stageHeight() - top)}px`;
    word.style.opacity = String(1 - wOut);
    word.style.transform =
      `translateX(-50%) translateY(${lerp(0, -26, wOut)}px) scale(${lerp(1, 0.88, wOut)})`;

    /* the caption */
    // Fades in on the reveal, not before — it is the payoff, not a label.
    const cIn = easeOut(range(p, 0.62, 0.88));
    const cOut = range(p, 0.97, 1);
    cap.style.opacity = String(cIn * (1 - cOut));
    cap.style.transform = `translateY(${lerp(16, 0, cIn)}px)`;
    // White type once the photo is behind it.
    cap.style.color = open > 0.35 ? '#fff' : '';
    cap.style.textShadow = open > 0.35 ? '0 1px 26px rgba(0,0,0,.42)' : 'none';

    /* the cue */
    cue.style.opacity = String(1 - range(p, 0, 0.06));

    /* the scrub */
    target = clamp(p, 0, 1) * dur() * 0.998;
    if (ready) chase();
    if (dirty) { dirty = false; }
  }

  // Ease the video toward the target instead of snapping to it. One seek in
  // flight at a time; anything closer than a frame is left alone.
  let chasing = 0;
  function chase() {
    if (chasing) return;
    const step = () => {
      chasing = 0;
      if (!ready) return;
      const now = Number.isFinite(vid.currentTime) ? vid.currentTime : shown;
      const d = target - now;
      if (Math.abs(d) < 1 / HERO.fps / 2) return;
      if (seeking) { chasing = requestAnimationFrame(step); return; }
      // Big jumps land in one go; small ones glide.
      shown = Math.abs(d) > 0.5 ? target : now + d * 0.34;
      seeking = true;
      try { vid.currentTime = clamp(shown, 0, dur()); }
      catch { seeking = false; }
      chasing = requestAnimationFrame(step);
    };
    chasing = requestAnimationFrame(step);
  }

  /* ------------------------------------------------------------- wiring */
  paint();
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', () => { measure(); readScroll(); }, { passive: true });
  if (window.visualViewport) {
    visualViewport.addEventListener('resize', () => { measure(); readScroll(); });
  }
  readScroll();

  // Stop paying for decode work while the hero is off screen.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => {
      for (const e of es) {
        if (!e.isIntersecting && chasing) { cancelAnimationFrame(chasing); chasing = 0; }
      }
    }, { rootMargin: '200px' }).observe(sect);
  }
}

/* --------------------------------------------------------------- credits */
// Used on the about page: the same footage, playing rather than scrubbed.
export function heroLoop() {
  const win = el('div', { class: 'hero__win', style: {
    position: 'relative', width: '100%', aspectRatio: `${HERO.w}/${HERO.h}`,
    borderRadius: '26px',
  } });
  const poster = el('img', { class: 'hero__poster', src: HERO.tail, alt: '' });
  win.append(poster);
  if (!reduceMotion()) {
    const v = el('video', {
      class: 'hero__vid is-on', src: HERO.src, muted: true, loop: true,
      playsinline: true, preload: 'none', 'aria-hidden': 'true',
    });
    v.muted = true; v.playsInline = true;
    win.append(v);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => {
        for (const e of es) {
          if (e.isIntersecting) { v.preload = 'auto'; v.play().catch(() => {}); }
          else v.pause();
        }
      }, { threshold: 0.25 }).observe(win);
    }
  }
  return win;
}

export { icon };
