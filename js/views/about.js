import { el, prettyPhone, telHref } from '../util.js';
import { icon } from '../icons.js';
import { BRAND, DELIVERY } from '../config.js';
import { pageHead, footer, note, brandEl, photo } from '../ui.js';
import { heroLoop } from '../hero.js';

export default function about() {
  const v = el('div', { class: 'view page' });
  const wrap = el('div', { class: 'wrap wrap--tight' });

  wrap.append(pageHead('کایا',
    'آتلیه گل‌آرایی در تبریز. باکس و گلدان، دسته‌گل، استند تبریک و سفارش اختصاصی.'));

  wrap.append(el('div', {
    style: { borderRadius: '26px', overflow: 'hidden', marginBottom: '24px' },
  }, heroLoop()));

  wrap.append(el('p', {
    style: { fontSize: '15px', lineHeight: '2', color: 'var(--ink-2)' },
    text: 'کایا با یک قاعده ساده کار می‌کند: آنچه در عکس می‌بینید، همان است که تحویل می‌گیرید. هر ترکیب همان روز و با گل تازه چیده می‌شود، و اگر گلی از ترکیب در بازار نباشد، قبل از آماده‌سازی به شما می‌گوییم و جایگزین را با هم انتخاب می‌کنیم.',
  }));

  wrap.append(el('div', { class: 'panel mt-l' },
    el('div', { class: 'panel__t', text: 'آتلیه' }),
    el('div', { class: 'rows' },
      row('pin', 'آدرس', BRAND.address),
      ...BRAND.hours.map((h) => row('clock', h.d, h.h)),
    ),
  ));

  wrap.append(el('div', { class: 'panel' },
    el('div', { class: 'panel__t', text: 'تماس' }),
    el('div', { class: 'rows' },
      ...BRAND.phones.map((p) => el('a', { class: 'row row--btn', href: telHref(p) },
        el('div', { class: 'row__ic', html: icon('phone') }),
        el('div', { class: 'row__b' },
          el('div', { class: 'row__t', text: 'تماس تلفنی' }),
          el('div', { class: 'row__s', dir: 'ltr', style: { textAlign: 'start' },
            text: prettyPhone(p) })),
        el('div', { class: 'row__e', html: icon('chev') }))),
      el('a', {
        class: 'row row--btn', href: BRAND.instagramUrl, target: '_blank', rel: 'noopener',
      },
        el('div', { class: 'row__ic', html: icon('ig') }),
        el('div', { class: 'row__b' },
          el('div', { class: 'row__t', text: 'اینستاگرام' }),
          el('div', { class: 'row__s', dir: 'ltr', style: { textAlign: 'start' },
            text: '@' + BRAND.instagram })),
        el('div', { class: 'row__e', html: icon('chev') })),
    ),
  ));

  wrap.append(el('div', { class: 'panel' },
    el('div', { class: 'panel__t', text: 'ارسال' }),
    el('div', { class: 'rows' },
      ...DELIVERY.zones.map((z) => el('div', { class: 'row' },
        el('div', { class: 'row__ic', html: icon(z.id === 'pickup' ? 'pin' : 'truck') }),
        el('div', { class: 'row__b' },
          el('div', { class: 'row__t', text: z.name }),
          el('div', { class: 'row__s', style: { whiteSpace: 'normal' },
            text: `${z.sub} · ${z.eta}` })),
        el('div', { class: 'row__e',
          text: z.fee ? prettyMoney(z.fee) : 'رایگان' }),
      )),
    ),
    el('div', { class: 'note mt' },
      el('span', { html: icon('truck'), style: { display: 'contents' } }),
      el('span', { text: `ارسال سفارش‌های بالای ${prettyMoney(DELIVERY.freeOver)} تومان در تبریز رایگان است.` })),
  ));

  wrap.append(el('div', { class: 'panel' },
    el('div', { class: 'panel__t', text: 'پرسش‌های پرتکرار' }),
    faq('چقدر طول می‌کشد تا برسد؟',
      'در مرکز تبریز معمولاً کمتر از دو ساعت و در سایر مناطق دو تا چهار ساعت. برای قطعه‌های بزرگ مثل «هزار رز» یک روز قبل هماهنگ کنید.'),
    faq('می‌توانم زمان مشخصی برای تحویل بدهم؟',
      'بله. در مرحله تحویل، تاریخ و یکی از چهار بازه زمانی را انتخاب می‌کنید. قبل از حرکت پیک با گیرنده تماس گرفته می‌شود.'),
    faq('اگر گیرنده خانه نباشد چه می‌شود؟',
      'گل را برنمی‌گردانیم و بدون هماهنگی هم پشت در نمی‌گذاریم. پیک تماس می‌گیرد و اگر لازم شد، همان روز دوباره می‌رود.'),
    faq('پرداخت چطور است؟',
      'کارت به کارت، لینک پرداخت، یا هنگام تحویل. هیچ اطلاعات کارتی در سایت وارد نمی‌شود.'),
    faq('می‌شود ترکیب دلخواه خودم را سفارش بدهم؟',
      'بله. صفحه «سفارش اختصاصی» یک فرم شش قدمی است؛ بعد از ثبت، کایا تماس می‌گیرد و قیمت نهایی را می‌گوید.'),
  ));

  wrap.append(el('div', { class: 'center', style: { padding: '30px 0 6px' } },
    brandEl('word', ''),
    el('p', { class: 'tiny muted', style: { marginTop: '14px' },
      text: `${BRAND.city}، ${BRAND.area}` }),
  ));
  wrap.lastChild.firstChild.style.width = '104px';
  wrap.lastChild.firstChild.style.margin = '0 auto';

  v.append(wrap, footer());
  return v;
}

function row(ic, t, s) {
  return el('div', { class: 'row' },
    el('div', { class: 'row__ic', html: icon(ic) }),
    el('div', { class: 'row__b' },
      el('div', { class: 'row__t', text: t }),
      el('div', { class: 'row__s', style: { whiteSpace: 'normal' }, text: s })),
  );
}

function faq(q, a) {
  const body = el('div', {
    style: { fontSize: '13px', color: 'var(--muted)', lineHeight: '1.9',
             overflow: 'hidden', height: '0', transition: 'height .34s cubic-bezier(.22,.61,.36,1)' },
  }, el('p', { style: { padding: '2px 0 12px' }, text: a }));

  let open = false;
  const head = el('button', {
    class: 'row row--btn', type: 'button', 'aria-expanded': 'false',
    style: { width: '100%' },
    onclick: () => {
      open = !open;
      head.setAttribute('aria-expanded', String(open));
      body.style.height = open ? `${body.scrollHeight}px` : '0';
      head.querySelector('.faq-chev').style.transform = open ? 'rotate(180deg)' : '';
    },
  },
    el('div', { class: 'row__b' },
      el('div', { class: 'row__t', style: { whiteSpace: 'normal' }, text: q })),
    el('div', { class: 'row__e faq-chev', html: icon('down'),
      style: { transition: 'transform .3s' } }),
  );
  return el('div', { style: { borderBottom: '1px solid var(--line-2)' } }, head, body);
}

const prettyMoney = (n) => Math.round(n).toLocaleString('en-US');
