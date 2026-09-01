import { el, money, haptic } from '../util.js';
import { icon } from '../icons.js';
import { byslug, PRODUCTS } from '../data.js';
import { SIZES, ADDONS, BRAND } from '../config.js';
import { photo, productCard, footer, toast, sheet } from '../ui.js';
import { currentRoute, go, back } from '../router.js';
import { addToBag, isFav, toggleFav, state } from '../store.js';

export default function item() {
  const { slug } = currentRoute().params;
  const p = byslug(slug);
  if (!p) { go('/shop', { replace: true }); return el('div'); }

  const inStock = state.stock[p.slug];
  let size = p.sizes ? 'm' : null;
  const addons = new Set();
  let cardText = '';

  const price = () => {
    const base = p.price * (size ? SIZES.find((s) => s.id === size).mult : 1);
    const extra = [...addons].reduce((n, a) => n + (ADDONS.find((x) => x.id === a)?.price || 0), 0);
    return Math.round(base + extra);
  };

  const v = el('div', { class: 'view' });

  /* ---------------------------------------------------------- the photo */
  v.append(el('button', {
    class: 'item__back', type: 'button', 'aria-label': 'Back',
    html: icon('back'), onclick: () => back('/shop'),
  }));

  v.append(el('div', { class: 'item__gal' },
    photo(p.photo, { eager: true, alt: `${p.name} — ${p.short}`, sizes: '100vw' }),
  ));

  const wrap = el('div', { class: 'wrap wrap--tight' });

  /* ----------------------------------------------------------- the head */
  const head = el('header', { class: 'item__head' });
  head.append(el('div', { class: 'eyebrow', text: p.meaning }));
  head.append(el('h1', { text: p.name }));
  head.append(el('div', { class: 'muted', style: { fontSize: '13.5px' }, text: p.short }));
  const priceEl = el('div', { class: 'item__price', text: money(price()) });
  head.append(priceEl);
  if (!inStock) {
    head.append(el('div', {
      class: 'tiny', style: { color: '#B3261E', marginTop: '4px' },
      text: 'Out of stock today — call the atelier to arrange it.',
    }));
  }
  head.append(el('p', { class: 'item__desc', text: p.desc }));
  wrap.append(head);

  const fav = el('button', {
    class: 'btn btn--ghost btn--sm mt',
    type: 'button',
    'aria-pressed': isFav(p.slug) ? 'true' : 'false',
    onclick: () => {
      const on = toggleFav(p.slug);
      fav.setAttribute('aria-pressed', on ? 'true' : 'false');
      fav.querySelector('svg').style.fill = on ? 'currentColor' : 'none';
      fav.lastChild.textContent = on ? 'Kept' : 'Keep';
      haptic();
    },
  }, el('span', { html: icon('heart'), style: { display: 'contents' } }),
     el('span', { text: isFav(p.slug) ? 'Kept' : 'Keep' }));
  if (isFav(p.slug)) fav.querySelector('svg').style.fill = 'currentColor';
  wrap.append(fav);

  /* ---------------------------------------------------------- the sizes */
  if (p.sizes) {
    const sect = el('div', { class: 'panel mt-l' },
      el('div', { class: 'panel__t', text: 'Size' }),
      el('div', { class: 'panel__s', text: 'The same mix, at a different count of stems.' }),
    );
    const opts = el('div', { class: 'opts' });
    SIZES.forEach((s) => {
      const o = el('button', {
        class: 'opt' + (s.id === size ? ' is-on' : ''), type: 'button',
        onclick: () => {
          size = s.id;
          [...opts.children].forEach((c, i) => c.classList.toggle('is-on', SIZES[i].id === size));
          refresh();
          haptic();
        },
      },
        el('span', { class: 'opt__ck', html: icon('check') }),
        el('span', { class: 'opt__t', text: s.name }),
        el('span', { class: 'opt__s', text: s.sub }),
        el('span', {
          class: 'opt__s', style: { fontWeight: '600', color: 'var(--ink-2)' },
          text: money(Math.round(p.price * s.mult)),
        }),
      );
      opts.append(o);
    });
    sect.append(opts);
    wrap.append(sect);
  }

  /* --------------------------------------------------------- the addons */
  const addSect = el('div', { class: 'panel' },
    el('div', { class: 'panel__t', text: 'With your order' }),
    el('div', { class: 'panel__s', text: 'Optional — take any of them.' }),
  );
  const addRows = el('div', { class: 'rows' });
  ADDONS.forEach((a) => {
    const box = el('span', { class: 'sw__box' });
    const row = el('button', {
      class: 'sw', type: 'button', style: { width: '100%' },
      'aria-pressed': 'false',
      onclick: () => {
        const on = addons.has(a.id);
        if (on) addons.delete(a.id); else addons.add(a.id);
        box.classList.toggle('is-on', !on);
        row.setAttribute('aria-pressed', String(!on));
        if (a.id === 'card' && !on) askCard();
        refresh();
        haptic();
      },
    },
      el('span', { style: { textAlign: 'start' } },
        el('span', { class: 'sw__t', style: { display: 'block' }, text: a.name }),
        el('span', { class: 'sw__s', style: { display: 'block' },
          text: a.price ? `${a.sub} · ${money(a.price)}` : `${a.sub} · free` }),
      ),
      box,
    );
    addRows.append(row);
  });
  addSect.append(addRows);
  wrap.append(addSect);

  const cardNote = el('div', { class: 'tiny muted', style: { marginTop: '10px' } });

  function askCard() {
    sheet((close) => {
      const box = el('div', {});
      box.append(el('h2', {
        id: 'sheet-title', style: { fontSize: '18px', fontWeight: '600', marginBottom: '4px' },
        text: 'The card',
      }));
      box.append(el('p', { class: 'muted tiny', style: { marginBottom: '16px' },
        text: 'Written in a fine hand on a KAYA card. Sign it, or leave it unsigned.' }));
      const ta = el('textarea', {
        class: 'inp', maxlength: '240', placeholder: 'e.g. Happy birthday — with love, Sara',
      });
      ta.value = cardText;
      box.append(ta);
      box.append(el('button', {
        class: 'btn btn--full mt', type: 'button', text: 'Save the message',
        onclick: () => { cardText = ta.value.trim(); refresh(); close(); },
      }));
      return box;
    });
  }
  wrap.append(cardNote);

  /* ----------------------------------------------------------- the facts */
  const facts = el('div', { class: 'panel mt' },
    el('div', { class: 'panel__t', text: 'Composition' }),
  );
  const list = el('div', { class: 'rows' });
  p.stems.forEach((s) => list.append(el('div', { class: 'row' },
    el('div', { class: 'row__ic', html: icon('leaf') }),
    el('div', { class: 'row__b' }, el('div', { class: 'row__t', text: s.n })),
    el('div', { class: 'row__e', text: s.c }),
  )));
  facts.append(list);
  facts.append(el('hr', { class: 'hr', style: { margin: '14px 0' } }));
  facts.append(el('dl', { class: 'kv' },
    el('dt', { text: 'Size' }), el('dd', { text: p.dims })));
  facts.append(el('div', { class: 'note mt' },
    el('span', { html: icon('leaf'), style: { display: 'contents' } }),
    el('span', { text: p.care })));
  wrap.append(facts);

  wrap.append(el('div', { class: 'panel' },
    el('div', { class: 'rows' },
      el('div', { class: 'row' },
        el('div', { class: 'row__ic', html: icon('clock') }),
        el('div', { class: 'row__b' },
          el('div', { class: 'row__t', text: 'Lead time' }),
          el('div', { class: 'row__s', style: { whiteSpace: 'normal' }, text: p.lead })),
      ),
      el('a', { class: 'row row--btn', href: 'tel:' + BRAND.phones[0] },
        el('div', { class: 'row__ic', html: icon('phone') }),
        el('div', { class: 'row__b' },
          el('div', { class: 'row__t', text: 'Questions?' }),
          el('div', { class: 'row__s', text: 'Call the atelier' })),
        el('div', { class: 'row__e', html: icon('chev') }),
      ),
    ),
  ));

  /* ------------------------------------------------------------ related */
  const others = PRODUCTS.filter((x) => x.slug !== p.slug).slice(0, 4);
  if (others.length) {
    wrap.append(el('div', { class: 'sect' },
      el('h2', { class: 'display',
        style: { fontSize: '20px', fontWeight: '600', marginBottom: '14px' },
        text: 'Other pieces' }),
      el('div', { class: 'rail' }, ...others.map((o) => productCard(o, {
        sizes: '(min-width:1000px) 240px, 42vw' }))),
    ));
  }

  v.append(wrap);
  v.append(footer());

  /* ------------------------------------------------------------- the dock */
  const dockPrice = el('b', { text: money(price()) });
  const cta = el('button', {
    class: 'btn', type: 'button',
    onclick: () => {
      addToBag({
        slug: p.slug, name: p.name, photo: p.photo,
        size, addons: [...addons], note: cardText,
        price: price(),
      });
      haptic(12);
      toast(`${p.name} added to the bag`);
    },
  }, el('span', { html: icon('bag'), style: { display: 'contents' } }), 'Add to bag');

  if (!inStock) {
    cta.disabled = true;
    cta.lastChild.textContent = 'Out of stock';
  }

  const dock = el('div', { class: 'dock' },
    el('div', { class: 'dock__in' },
      el('div', { class: 'dock__price' },
        el('span', { text: p.sizes ? SIZES.find((s) => s.id === size).name : 'Price' }),
        dockPrice),
      cta,
    ),
  );
  v.append(dock);

  function refresh() {
    priceEl.textContent = money(price());
    dockPrice.textContent = money(price());
    if (p.sizes) {
      dock.querySelector('.dock__price span').textContent =
        SIZES.find((s) => s.id === size).name;
    }
    cardNote.textContent = addons.has('card') && cardText
      ? `Card: “${cardText}”`
      : (addons.has('card') ? 'The card has no message yet — tap “Handwritten card”.' : '');
  }
  refresh();

  return v;
}
