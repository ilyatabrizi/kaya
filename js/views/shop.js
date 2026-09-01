import { el } from '../util.js';
import { icon } from '../icons.js';
import { PRODUCTS, CATS } from '../data.js';
import { productCard, pageHead, footer, empty } from '../ui.js';
import { currentRoute, go } from '../router.js';
import { state } from '../store.js';

const SORTS = [
  { id: 'curated', name: 'چیدمان کایا' },
  { id: 'low', name: 'ارزان‌ترین' },
  { id: 'high', name: 'گران‌ترین' },
];

export default function shop() {
  const r = currentRoute();
  let cat = r?.q?.c || 'all';
  let sort = 'curated';
  let onlyFavs = r?.q?.fav === '1';

  const v = el('div', { class: 'view page' });
  const wrap = el('div', { class: 'wrap' });

  wrap.append(pageHead(
    onlyFavs ? 'علاقه‌مندی‌ها' : 'گل‌ها',
    onlyFavs
      ? 'قطعه‌هایی که نگه داشته‌اید.'
      : 'هفت قطعه، هر کدام با ترکیب و اندازه مشخص. برای چیزی خارج از این فهرست، سفارش اختصاصی بدهید.',
  ));

  /* --------------------------------------------------------- the filters */
  const chips = el('div', { class: 'chips' });
  CATS.forEach((c) => {
    chips.append(el('button', {
      class: 'chip' + (c.id === cat && !onlyFavs ? ' is-on' : ''),
      type: 'button', text: c.name,
      onclick: () => { cat = c.id; onlyFavs = false; sync(); },
    }));
  });
  chips.append(el('button', {
    class: 'chip' + (onlyFavs ? ' is-on' : ''),
    type: 'button',
    onclick: () => { onlyFavs = !onlyFavs; sync(); },
  }, el('span', { html: icon('heart'), style: { display: 'contents' } }), 'علاقه‌مندی'));
  wrap.append(chips);

  const sortRow = el('div', {
    style: { display: 'flex', gap: '8px', alignItems: 'center',
             margin: '14px 0 18px', flexWrap: 'wrap' },
  });
  const count = el('span', { class: 'tiny muted' });
  const sortSel = el('select', {
    class: 'inp',
    style: { width: 'auto', height: '38px', fontSize: '13px', marginInlineStart: 'auto' },
    'aria-label': 'ترتیب',
    onchange: (e) => { sort = e.target.value; sync(); },
  }, ...SORTS.map((s) => el('option', { value: s.id, text: s.name })));
  sortRow.append(count, sortSel);
  wrap.append(sortRow);

  const grid = el('div', { class: 'grid' });
  wrap.append(grid);

  function sync() {
    [...chips.children].forEach((b, i) => {
      const isFavChip = i === CATS.length;
      b.classList.toggle('is-on', isFavChip ? onlyFavs : (!onlyFavs && CATS[i].id === cat));
    });

    let list = PRODUCTS.slice();
    if (onlyFavs) list = list.filter((p) => state.favs.includes(p.slug));
    else if (cat !== 'all') list = list.filter((p) => p.cat === cat);
    if (sort === 'low') list.sort((a, b) => a.price - b.price);
    if (sort === 'high') list.sort((a, b) => b.price - a.price);

    count.textContent = list.length ? `${list.length} قطعه` : '';
    grid.replaceChildren();

    if (!list.length) {
      grid.append(el('div', { style: { gridColumn: '1/-1' } },
        onlyFavs
          ? empty('heart', 'هنوز چیزی نگه نداشته‌اید',
              'روی قلب گوشه هر قطعه بزنید تا اینجا جمع شود.',
              el('a', { class: 'btn btn--sm mt', href: '#/shop', text: 'دیدن گل‌ها' }))
          : empty('flower', 'در این دسته چیزی نیست',
              'دسته دیگری را ببینید، یا سفارش اختصاصی بدهید.',
              el('a', { class: 'btn btn--sm mt', href: '#/custom', text: 'سفارش اختصاصی' })),
      ));
      return;
    }
    // Uniform, deliberately: filtering and sorting move every card's index, so
    // there is no position a full-width card could hold without leaving a hole
    // in some combination. The featured band lives on the home page.
    list.forEach((p) => grid.append(productCard(p)));
  }

  sync();
  v.append(wrap, footer());
  return v;
}
