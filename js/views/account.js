import { el, money, prettyPhone, validPhone, relative, haptic } from '../util.js';
import { icon } from '../icons.js';
import { BRAND } from '../config.js';
import { PRODUCTS } from '../data.js';
import {
  pageHead, footer, empty, sheet, toast, productCard, note, brandEl,
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
      text: p.name ? p.name.trim()[0] : '',
    }),
    el('div', { style: { minWidth: '0' } },
      el('h1', { style: { fontSize: '23px', fontWeight: '600', letterSpacing: '-.02em' },
        text: p.name || 'مهمان' }),
      el('div', { class: 'muted tiny', dir: p.phone ? 'ltr' : 'rtl',
        style: { textAlign: 'start' },
        text: p.phone ? prettyPhone(p.phone) : 'برای پیگیری سفارش، مشخصاتتان را وارد کنید' }),
    ),
  );
  if (!p.name) head.firstChild.innerHTML = icon('user');
  wrap.append(head);

  /* --------------------------------------------------------------- stats */
  const mine = state.orders.filter((o) => !o.demo);
  const spend = mine.filter((o) => o.status !== 'cancel')
    .reduce((n, o) => n + o.total, 0);
  wrap.append(el('div', { class: 'stats' },
    stat(String(mine.length), 'سفارش'),
    stat(String(state.favs.length), 'علاقه‌مندی'),
    stat(spend ? money(spend).replace(' تومان', '') : '0', 'تومان خرید'),
    stat(String(bagCount()), 'در سبد'),
  ));

  /* ---------------------------------------------------------------- rows */
  const main = el('div', { class: 'panel' }, el('div', { class: 'rows' },
    link('note', 'سفارش‌های من', mine.length ? `${mine.length} سفارش` : 'هنوز خالی', '#/orders'),
    link('heart', 'علاقه‌مندی‌ها', `${state.favs.length} قطعه`, '#/shop?fav=1'),
    btnRow('user', 'مشخصات من', p.name || 'وارد نشده', editProfile),
    btnRow('pin', 'آدرس‌ها', `${p.addresses.length} آدرس ذخیره‌شده`, editAddresses),
  ));
  wrap.append(main);

  /* -------------------------------------------------------------- favours */
  if (state.favs.length) {
    const favs = state.favs.map((s) => PRODUCTS.find((x) => x.slug === s)).filter(Boolean);
    wrap.append(el('div', { class: 'sect sect--tight' },
      el('h2', { style: { fontSize: '17px', fontWeight: '600', marginBottom: '13px' },
        text: 'نگه داشته‌اید' }),
      el('div', { class: 'rail' },
        ...favs.map((f) => productCard(f, { sizes: '(min-width:1000px) 240px, 42vw' }))),
    ));
  }

  /* --------------------------------------------------------------- shop */
  wrap.append(el('div', { class: 'panel' },
    el('div', { class: 'panel__t', text: 'کایا' }),
    el('div', { class: 'rows' },
      link('info', 'درباره و ساعت کار', BRAND.address, '#/about'),
      el('a', { class: 'row row--btn', href: 'tel:' + BRAND.phones[0] },
        el('div', { class: 'row__ic', html: icon('phone') }),
        el('div', { class: 'row__b' },
          el('div', { class: 'row__t', text: 'تماس با آتلیه' }),
          el('div', { class: 'row__s', dir: 'ltr', text: prettyPhone(BRAND.phones[0]) })),
        el('div', { class: 'row__e', html: icon('chev') })),
      el('a', {
        class: 'row row--btn', href: BRAND.instagramUrl, target: '_blank', rel: 'noopener',
      },
        el('div', { class: 'row__ic', html: icon('ig') }),
        el('div', { class: 'row__b' },
          el('div', { class: 'row__t', text: 'اینستاگرام' }),
          el('div', { class: 'row__s', dir: 'ltr', text: '@' + BRAND.instagram })),
        el('div', { class: 'row__e', html: icon('chev') })),
    ),
  ));

  /* ------------------------------------------------------------- install */
  const inst = el('div', { class: 'panel' });
  inst.append(
    el('div', { class: 'panel__t', text: 'نصب روی صفحه اصلی' }),
    el('div', { class: 'panel__s',
      text: 'کایا مثل یک اپ باز می‌شود — بدون نوار مرورگر و با دسترسی سریع‌تر.' }),
  );
  const instBtn = el('button', {
    class: 'btn btn--full', type: 'button', text: 'افزودن به صفحه اصلی',
    onclick: async () => {
      const done = await promptInstall();
      if (!done) howToInstall();
    },
  });
  inst.append(instBtn);
  if (!canInstall()) {
    instBtn.classList.add('btn--ghost');
    instBtn.textContent = 'راهنمای نصب';
    instBtn.onclick = howToInstall;
  }
  wrap.append(inst);

  /* --------------------------------------------------------------- staff */
  wrap.append(el('div', { class: 'panel' }, el('div', { class: 'rows' },
    link('lock', 'ورود کارکنان', 'پنل مدیریت سفارش‌ها', '#/crm'),
    btnRow('trash', 'پاک کردن اطلاعات این دستگاه', 'سبد، علاقه‌مندی‌ها و سفارش‌ها', () => {
      sheet((close) => el('div', {},
        el('h2', { id: 'sheet-title',
          style: { fontSize: '18px', fontWeight: '600', marginBottom: '6px' },
          text: 'همه‌چیز پاک شود؟' }),
        el('p', { class: 'muted tiny', style: { marginBottom: '18px' },
          text: 'سبد، علاقه‌مندی‌ها، آدرس‌ها و سفارش‌های ثبت‌شده روی این دستگاه حذف می‌شوند. این کار برگشت ندارد.' }),
        el('div', { style: { display: 'flex', gap: '10px' } },
          el('button', { class: 'btn btn--ghost', style: { flex: '1' },
            type: 'button', text: 'انصراف', onclick: close }),
          el('button', { class: 'btn', style: { flex: '1' }, type: 'button', text: 'پاک کن',
            onclick: () => { resetAll(); close(); toast('پاک شد'); go('/'); } }),
        ),
      ));
    }),
  )));

  wrap.append(el('div', { class: 'tiny muted center', style: { marginTop: '22px' } },
    'اطلاعات شما فقط روی همین دستگاه ذخیره می‌شود.'));

  v.append(wrap, footer());
  return v;

  /* ------------------------------------------------------------- sheets */
  function editProfile() {
    sheet((close) => {
      const box = el('div', {});
      box.append(el('h2', { id: 'sheet-title',
        style: { fontSize: '18px', fontWeight: '600', marginBottom: '16px' },
        text: 'مشخصات من' }));
      const name = el('input', { class: 'inp', value: p.name, placeholder: 'نام و نام خانوادگی' });
      const phone = el('input', {
        class: 'inp', type: 'tel', dir: 'ltr', inputmode: 'numeric',
        value: p.phone, placeholder: '09xxxxxxxxx',
      });
      const err = el('div', { class: 'err', hidden: true, text: 'شماره موبایل معتبر نیست.' });
      box.append(
        el('div', { class: 'field' }, el('label', { text: 'نام' }), name),
        el('div', { class: 'field' }, el('label', { text: 'شماره تماس' }), phone, err),
        el('button', {
          class: 'btn btn--full mt', type: 'button', text: 'ذخیره',
          onclick: () => {
            const ph = validPhone(phone.value);
            if (phone.value && !ph) { err.hidden = false; return; }
            saveProfile({ name: name.value.trim(), phone: ph || '' });
            toast('ذخیره شد'); close(); go('/account');
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
        text: 'آدرس‌ها' }));
      if (!p.addresses.length) {
        box.append(el('p', { class: 'muted tiny', style: { marginBottom: '16px' },
          text: 'هنوز آدرسی ذخیره نشده. موقع ثبت سفارش می‌توانید آدرس را ذخیره کنید.' }));
      }
      const rows = el('div', { class: 'rows' });
      p.addresses.forEach((a) => {
        rows.append(el('div', { class: 'row' },
          el('div', { class: 'row__ic', html: icon('pin') }),
          el('div', { class: 'row__b' },
            el('div', { class: 'row__t', text: a.label || 'آدرس' }),
            el('div', { class: 'row__s', text: a.address + (a.unit ? ` — ${a.unit}` : '') })),
          el('button', {
            class: 'row__e', type: 'button', 'aria-label': 'حذف', html: icon('trash'),
            onclick: (e) => {
              removeAddress(a.id);
              e.currentTarget.closest('.row').remove();
              toast('حذف شد');
            },
          }),
        ));
      });
      box.append(rows);
      box.append(el('button', { class: 'btn btn--full btn--ghost mt', type: 'button',
        text: 'بستن', onclick: close }));
      return box;
    });
  }

  function howToInstall() {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    sheet(() => el('div', {},
      el('h2', { id: 'sheet-title',
        style: { fontSize: '18px', fontWeight: '600', marginBottom: '6px' },
        text: 'افزودن کایا به صفحه اصلی' }),
      el('p', { class: 'muted tiny', style: { marginBottom: '16px' },
        text: ios
          ? 'در سافاری، دکمه اشتراک‌گذاری پایین صفحه را بزنید، بعد «Add to Home Screen» را انتخاب کنید.'
          : 'در منوی مرورگر، گزینه «افزودن به صفحه اصلی» یا «Install app» را انتخاب کنید.' }),
      note('بعد از نصب، کایا با آیکون خودش و بدون نوار مرورگر باز می‌شود.', 'install'),
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
