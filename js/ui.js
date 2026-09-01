// Shared pieces every view builds from: the photo element, the product card,
// the bottom sheet, the toast, the footer.

import { el, money, clamp } from './util.js';
import { icon } from './icons.js';
import { PHOTOS } from './photos.js';
import { BRAND } from './config.js';
import { isFav, toggleFav, state } from './store.js';
import { go } from './router.js';

/* ----------------------------------------------------------------- brand */
let WORD = '';
let MARK = '';

export async function loadBrand() {
  const [w, m] = await Promise.all([
    fetch('assets/brand/wordmark.svg').then((r) => r.text()).catch(() => ''),
    fetch('assets/brand/mark.svg').then((r) => r.text()).catch(() => ''),
  ]);
  WORD = w; MARK = m;
  // Anything painted before the fetch landed gets filled in now.
  document.querySelectorAll('[data-brand=word]').forEach((n) => { n.innerHTML = WORD; });
  document.querySelectorAll('[data-brand=mark]').forEach((n) => { n.innerHTML = MARK; });
}

export const wordmark = () => WORD;
export const markmark = () => MARK;

export function brandEl(kind = 'word', cls = '') {
  const n = el('span', { class: cls, data: { brand: kind } });
  n.innerHTML = kind === 'word' ? WORD : MARK;
  return n;
}

/* ----------------------------------------------------------------- photo */
// One <picture>-free responsive image. srcset picks the width; the blurred
// 24px placeholder is the element's own background so there is never a white
// hole, and the file only starts downloading when it is near the viewport.

const io = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries, obs) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const img = e.target;
        obs.unobserve(img);
        img.src = img.dataset.src;
        img.srcset = img.dataset.srcset;
      }
    }, { rootMargin: '400px 0px' })
  : null;

export function photo(slug, { sizes = '(min-width:1000px) 280px, 46vw', eager = false, alt = '' } = {}) {
  const meta = PHOTOS[slug];
  const wrap = el('div', { class: 'ph' });
  if (!meta) return wrap;

  wrap.style.backgroundImage = `url("${meta.blur}")`;
  const img = el('img', {
    alt, width: meta.w, height: meta.h,
    decoding: 'async',
    fetchpriority: eager ? 'high' : 'low',
  });
  const srcset = meta.widths.map((w) => `assets/photos/${slug}-${w}.webp ${w}w`).join(', ');
  const src = `assets/photos/${slug}-${meta.widths[meta.widths.length - 1]}.webp`;

  img.addEventListener('load', () => img.classList.add('is-in'), { once: true });
  if (eager || !io) {
    img.sizes = sizes; img.srcset = srcset; img.src = src;
    img.loading = 'eager';
  } else {
    img.loading = 'lazy';
    img.sizes = sizes;
    img.dataset.src = src; img.dataset.srcset = srcset;
    io.observe(img);
  }
  wrap.append(img);
  return wrap;
}

/* ------------------------------------------------------------------ card */
export function productCard(p, { wide = false, sizes } = {}) {
  const out = !state.stock[p.slug];
  const a = el('a', {
    class: 'card' + (wide ? ' card--wide' : ''),
    href: `#/p/${p.slug}`,
    'aria-label': p.name,
  });

  const ph = photo(p.photo, {
    alt: `${p.name} — ${p.short}`,
    sizes: sizes || (wide ? '100vw' : '(min-width:1000px) 270px, 46vw'),
  });
  a.append(ph);

  if (p.tag || out) {
    a.append(el('span', { class: 'card__tag', text: out ? 'موجود نیست' : p.tag }));
  }

  const fav = el('button', {
    class: 'card__fav' + (isFav(p.slug) ? ' is-on' : ''),
    type: 'button',
    'aria-label': 'افزودن به علاقه‌مندی‌ها',
    'aria-pressed': isFav(p.slug) ? 'true' : 'false',
    html: icon('heart'),
    onclick: (e) => {
      e.preventDefault(); e.stopPropagation();
      const on = toggleFav(p.slug);
      fav.classList.toggle('is-on', on);
      fav.setAttribute('aria-pressed', on ? 'true' : 'false');
      toast(on ? 'به علاقه‌مندی‌ها اضافه شد' : 'از علاقه‌مندی‌ها حذف شد');
    },
  });
  a.append(fav);

  a.append(el('div', { class: 'card__body' },
    el('div', { class: 'card__name', text: p.name }),
    el('div', { class: 'card__sub', text: p.short }),
    el('div', { class: 'card__price', text: money(p.price) }),
  ));
  return a;
}

/* ----------------------------------------------------------------- sheet */
const sheetRoot = document.getElementById('sheet');
let sheetClose = null;

export function sheet(build, { onClose } = {}) {
  const body = sheetRoot.querySelector('.sheet__body');
  body.replaceChildren();
  body.append(build(closeSheet));
  sheetRoot.hidden = false;
  // A frame between unhide and the class, or the transition never runs.
  requestAnimationFrame(() => sheetRoot.classList.add('is-on'));
  document.body.style.overflow = 'hidden';
  sheetClose = onClose || null;

  const esc = (e) => { if (e.key === 'Escape') closeSheet(); };
  document.addEventListener('keydown', esc);
  sheetRoot._esc = esc;

  const focusable = body.querySelector('input,select,textarea,button,[tabindex]');
  if (focusable && window.innerWidth >= 680) focusable.focus({ preventScroll: true });
}

export function closeSheet() {
  if (sheetRoot.hidden) return;
  sheetRoot.classList.remove('is-on');
  document.body.style.overflow = '';
  document.removeEventListener('keydown', sheetRoot._esc || (() => {}));
  setTimeout(() => {
    sheetRoot.hidden = true;
    sheetRoot.querySelector('.sheet__body').replaceChildren();
  }, 460);
  if (sheetClose) { const f = sheetClose; sheetClose = null; f(); }
}

sheetRoot.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) closeSheet();
});

// Drag the panel down to dismiss — the gesture the sheet's shape promises.
(function dragToDismiss() {
  const panel = sheetRoot.querySelector('.sheet__panel');
  let y0 = null, dy = 0;
  panel.addEventListener('touchstart', (e) => {
    const body = sheetRoot.querySelector('.sheet__body');
    // Only from the grip, or from the top of an unscrolled body.
    if (!e.target.closest('.sheet__grip') && body.scrollTop > 0) return;
    y0 = e.touches[0].clientY; dy = 0;
    panel.style.transition = 'none';
  }, { passive: true });
  panel.addEventListener('touchmove', (e) => {
    if (y0 === null) return;
    dy = Math.max(0, e.touches[0].clientY - y0);
    panel.style.transform = `translateY(${dy}px)`;
  }, { passive: true });
  panel.addEventListener('touchend', () => {
    if (y0 === null) return;
    panel.style.transition = '';
    panel.style.transform = '';
    if (dy > 110) closeSheet();
    y0 = null;
  });
})();

/* ----------------------------------------------------------------- toast */
const toastEl = document.getElementById('toast');
let toastT;
export function toast(msg, ms = 2100) {
  toastEl.textContent = msg;
  toastEl.classList.add('is-on');
  clearTimeout(toastT);
  toastT = setTimeout(() => toastEl.classList.remove('is-on'), ms);
}

/* ------------------------------------------------------------- fragments */
export function pageHead(title, sub) {
  return el('header', { class: 'page__head' },
    el('h1', { text: title }),
    sub ? el('p', { text: sub }) : null,
  );
}

export function sectionHead(title, sub, more) {
  const h = el('div', { class: 'sect__head' + (more ? ' sect__head--row' : '') },
    el('div', {},
      el('h2', { text: title }),
      sub ? el('p', { text: sub }) : null,
    ),
  );
  if (more) {
    h.append(el('a', { class: 'sect__more', href: more.href },
      more.text, el('span', { html: icon('chev'), style: { display: 'contents' } })));
  }
  return h;
}

export function empty(iconName, title, text, action) {
  return el('div', { class: 'empty' },
    el('div', { class: 'empty__ic', html: icon(iconName) }),
    el('h3', { text: title }),
    el('p', { text }),
    action || null,
  );
}

export function note(text, iconName = 'info') {
  return el('div', { class: 'note' },
    el('span', { html: icon(iconName), style: { display: 'contents' } }),
    el('span', { text }),
  );
}

export function qtyControl(value, onChange) {
  const b = el('b', { text: String(value) });
  const box = el('div', { class: 'qty' },
    el('button', {
      type: 'button', 'aria-label': 'کم کردن', html: icon('minus'),
      onclick: () => onChange(clamp(Number(b.textContent) - 1, 0, 99)),
    }),
    b,
    el('button', {
      type: 'button', 'aria-label': 'اضافه کردن', html: icon('plus'),
      onclick: () => onChange(clamp(Number(b.textContent) + 1, 0, 99)),
    }),
  );
  return box;
}

/* ---------------------------------------------------------------- footer */
export function footer() {
  const f = el('footer', { class: 'foot' });
  const grid = el('div', { class: 'foot__grid' });

  const about = el('div', {});
  about.append(brandEl('word', 'foot__brand'));
  about.append(el('p', {
    text: `آتلیه گل‌آرایی کایا — ${BRAND.address}. باکس و گلدان، دسته‌گل، استند تبریک و سفارش اختصاصی، با ارسال در تبریز.`,
  }));

  const contact = el('div', {},
    el('h4', { text: 'تماس' }),
    el('ul', {},
      ...BRAND.phones.map((p) => el('li', {},
        el('a', { href: 'tel:' + p, dir: 'ltr', class: 'lat', text: p }))),
      el('li', {}, el('a', {
        href: BRAND.instagramUrl, target: '_blank', rel: 'noopener',
        dir: 'ltr', class: 'lat', text: '@' + BRAND.instagram,
      })),
    ),
  );

  const links = el('div', {},
    el('h4', { text: 'کایا' }),
    el('ul', {},
      el('li', {}, el('a', { href: '#/shop', text: 'گل‌ها' })),
      el('li', {}, el('a', { href: '#/custom', text: 'سفارش اختصاصی' })),
      el('li', {}, el('a', { href: '#/about', text: 'درباره و تماس' })),
      el('li', {}, el('a', { href: '#/orders', text: 'پیگیری سفارش' })),
    ),
  );

  grid.append(about, contact, links);
  f.append(el('div', { class: 'wrap' }, grid,
    el('div', { class: 'foot__legal' },
      el('span', { text: `© ${new Date().getFullYear()} KAYA · تبریز` }),
      el('a', { href: '#/crm', text: 'ورود کارکنان' }),
    ),
  ));
  return f;
}

export { go };
