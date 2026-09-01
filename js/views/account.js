import { el, money, prettyPhone, validPhone, haptic } from '../util.js';
import { icon } from '../icons.js';
import { BRAND } from '../config.js';
import { PRODUCTS } from '../data.js';
import {
  pageHead, footer, sheet, toast, productCard,
} from '../ui.js';
import { go } from '../router.js';
import {
  state, saveProfile, removeAddress, resetAll, bagCount,
} from '../store.js';
import { canInstall, promptInstall } from '../install.js';

export default function account() {
  const v = el('div', { class: 'view page' });
  const wrap = el('div', { class: 'wrap wrap--tight' });
  const p = state.profile;

  /* -------------------------------------------------------------- header */
  const head = el('div', {
    style: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '24px' },
  },
    el('div', {
      style: { width: '58px', height: '58px', borderRadius: '999px',
               background: 'var(--wash)', display: 'grid', placeItems: 'center',
               color: 'var(--ink-2)', flex: 'none', fontSize: '20px', fontWeight: '600' },
      text: p.name ? p.name.trim()[0].toUpperCase() : '',
    }),
    el('div', { style: { minWidth: '0' } },
      el('h1', { class: 'display',
        style: { fontSize: '25px', fontWeight: '600', letterSpacing: '-.01em' },
        text: p.name || 'Guest' }),
      el('div', { class: 'muted tiny',
        text: p.phone ? prettyPhone(p.phone) : 'Add your details to track orders' }),
    ),
  );
  if (!p.name) head.firstChild.innerHTML = icon('user');
  wrap.append(head);

  /* --------------------------------------------------------------- stats */
  const mine = state.orders.filter((o) => !o.demo);
  const spend = mine.filter((o) => o.status !== 'cancel')
    .reduce((n, o) => n + o.total, 0);
  wrap.append(el('div', { class: 'stats' },
    stat(String(mine.length), 'orders'),
    stat(String(state.favs.length), 'saved'),
    stat(spend ? money(spend).replace(' Toman', '') : '0', 'Toman spent'),
    stat(String(bagCount()), 'in the bag'),
  ));

  /* ---------------------------------------------------------------- rows */
  const main = el('div', { class: 'panel' }, el('div', { class: 'rows' },
    link('note', 'My orders', mine.length ? `${mine.length} order${mine.length === 1 ? '' : 's'}` : 'none yet', '#/orders'),
    link('heart', 'Favourites', `${state.favs.length} piece${state.favs.length === 1 ? '' : 's'}`, '#/shop?fav=1'),
    btnRow('user', 'My details', p.name || 'not set', editProfile),
    btnRow('pin', 'Addresses', `${p.addresses.length} saved`, editAddresses),
  ));
  wrap.append(main);

  /* ---------------------------------------------------------- favourites */
  if (state.favs.length) {
    const favs = state.favs.map((s) => PRODUCTS.find((x) => x.slug === s)).filter(Boolean);
    wrap.append(el('div', { class: 'sect sect--tight' },
      el('h2', { class: 'display',
        style: { fontSize: '19px', fontWeight: '600', marginBottom: '13px' },
        text: 'Kept' }),
      el('div', { class: 'rail' },
        ...favs.map((f) => productCard(f, { sizes: '(min-width:1000px) 240px, 42vw' }))),
    ));
  }

  /* ---------------------------------------------------------------- shop */
  wrap.append(el('div', { class: 'panel' },
    el('div', { class: 'panel__t', text: 'KAYA' }),
    el('div', { class: 'rows' },
      link('info', 'About, hours & delivery', BRAND.address, '#/about'),
      el('a', { class: 'row row--btn', href: 'tel:' + BRAND.phones[0] },
        el('div', { class: 'row__ic', html: icon('phone') }),
        el('div', { class: 'row__b' },
          el('div', { class: 'row__t', text: 'Call the atelier' }),
          el('div', { class: 'row__s', text: prettyPhone(BRAND.phones[0]) })),
        el('div', { class: 'row__e', html: icon('chev') })),
      el('a', {
        class: 'row row--btn', href: BRAND.instagramUrl, target: '_blank', rel: 'noopener',
      },
        el('div', { class: 'row__ic', html: icon('ig') }),
        el('div', { class: 'row__b' },
          el('div', { class: 'row__t', text: 'Instagram' }),
          el('div', { class: 'row__s', text: '@' + BRAND.instagram })),
        el('div', { class: 'row__e', html: icon('chev') })),
    ),
  ));

  /* ------------------------------------------------------------- install */
  const inst = el('div', { class: 'panel' });
  inst.append(
    el('div', { class: 'panel__t', text: 'Add to your home screen' }),
    el('div', { class: 'panel__s',
      text: 'KAYA opens like an app — no browser bar, one tap from your home screen.' }),
  );
  const instBtn = el('button', {
    class: 'btn btn--full', type: 'button', text: 'Add to home screen',
    onclick: async () => {
      const done = await promptInstall();
      if (!done) howToInstall();
    },
  });
  inst.append(instBtn);
  if (!canInstall()) {
    instBtn.classList.add('btn--ghost');
    instBtn.textContent = 'How to install';
    instBtn.onclick = howToInstall;
  }
  wrap.append(inst);

  /* --------------------------------------------------------------- staff */
  wrap.append(el('div', { class: 'panel' }, el('div', { class: 'rows' },
    link('lock', 'Staff access', 'the studio order board', '#/crm'),
    btnRow('trash', 'Clear this device', 'bag, favourites, orders and details', () => {
      sheet((close) => el('div', {},
        el('h2', { id: 'sheet-title',
          style: { fontSize: '18px', fontWeight: '600', marginBottom: '6px' },
          text: 'Clear everything?' }),
        el('p', { class: 'muted tiny', style: { marginBottom: '18px' },
          text: 'The bag, favourites, addresses and the orders recorded on this device are removed. This cannot be undone.' }),
        el('div', { style: { display: 'flex', gap: '10px' } },
          el('button', { class: 'btn btn--ghost', style: { flex: '1' },
            type: 'button', text: 'Cancel', onclick: close }),
          el('button', { class: 'btn', style: { flex: '1' }, type: 'button', text: 'Clear',
            onclick: () => { resetAll(); close(); toast('Cleared'); go('/'); } }),
        ),
      ));
    }),
  )));

  wrap.append(el('div', { class: 'tiny muted center', style: { marginTop: '22px' } },
    'Your details are stored on this device only.'));

  v.append(wrap, footer());
  return v;

  /* -------------------------------------------------------------- sheets */
  function editProfile() {
    sheet((close) => {
      const box = el('div', {});
      box.append(el('h2', { id: 'sheet-title',
        style: { fontSize: '18px', fontWeight: '600', marginBottom: '16px' },
        text: 'My details' }));
      const name = el('input', { class: 'inp', value: p.name, placeholder: 'Full name' });
      const phone = el('input', {
        class: 'inp', type: 'tel', inputmode: 'numeric',
        value: p.phone, placeholder: '09xx xxx xxxx',
      });
      const err = el('div', { class: 'err', hidden: true, text: 'That doesn’t look like a valid mobile number.' });
      box.append(
        el('div', { class: 'field' }, el('label', { text: 'Name' }), name),
        el('div', { class: 'field' }, el('label', { text: 'Phone' }), phone, err),
        el('button', {
          class: 'btn btn--full mt', type: 'button', text: 'Save',
          onclick: () => {
            const ph = validPhone(phone.value);
            if (phone.value && !ph) { err.hidden = false; return; }
            saveProfile({ name: name.value.trim(), phone: ph || '' });
            toast('Saved'); close(); go('/account');
          },
        }),
      );
      return box;
    });
  }

  function editAddresses() {
    sheet((close) => {
      const box = el('div', {});
      box.append(el('h2', { id: 'sheet-title',
        style: { fontSize: '18px', fontWeight: '600', marginBottom: '14px' },
        text: 'Addresses' }));
      if (!p.addresses.length) {
        box.append(el('p', { class: 'muted tiny', style: { marginBottom: '16px' },
          text: 'Nothing saved yet. You can save an address while placing an order.' }));
      }
      const rows = el('div', { class: 'rows' });
      p.addresses.forEach((a) => {
        rows.append(el('div', { class: 'row' },
          el('div', { class: 'row__ic', html: icon('pin') }),
          el('div', { class: 'row__b' },
            el('div', { class: 'row__t', text: a.label || 'Address' }),
            el('div', { class: 'row__s', text: a.address + (a.unit ? ` — ${a.unit}` : '') })),
          el('button', {
            class: 'row__e', type: 'button', 'aria-label': 'Remove', html: icon('trash'),
            onclick: (e) => {
              removeAddress(a.id);
              e.currentTarget.closest('.row').remove();
              toast('Removed');
            },
          }),
        ));
      });
      box.append(rows);
      box.append(el('button', { class: 'btn btn--full btn--ghost mt', type: 'button',
        text: 'Close', onclick: close }));
      return box;
    });
  }

  function howToInstall() {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    sheet(() => el('div', {},
      el('h2', { id: 'sheet-title',
        style: { fontSize: '18px', fontWeight: '600', marginBottom: '6px' },
        text: 'Add KAYA to your home screen' }),
      el('p', { class: 'muted tiny', style: { marginBottom: '16px' },
        text: ios
          ? 'In Safari, tap the share button at the bottom of the screen, then choose “Add to Home Screen”.'
          : 'In your browser’s menu, choose “Add to Home screen” or “Install app”.' }),
    ));
  }
}

function stat(b, s) {
  return el('div', { class: 'stat' }, el('b', { text: b }), el('span', { text: s }));
}

function link(ic, t, s, href) {
  return el('a', { class: 'row row--btn', href },
    el('div', { class: 'row__ic', html: icon(ic) }),
    el('div', { class: 'row__b' },
      el('div', { class: 'row__t', text: t }),
      el('div', { class: 'row__s', text: s })),
    el('div', { class: 'row__e', html: icon('chev') }),
  );
}

function btnRow(ic, t, s, onclick) {
  return el('button', { class: 'row row--btn', type: 'button', onclick },
    el('div', { class: 'row__ic', html: icon(ic) }),
    el('div', { class: 'row__b' },
      el('div', { class: 'row__t', text: t }),
      el('div', { class: 'row__s', text: s })),
    el('div', { class: 'row__e', html: icon('chev') }),
  );
}
