// Delivery, recipient, payment choice, done.
//
// No card is taken. An Iranian florist this size settles by card-to-card or on
// delivery, and a preview that pretends to hold a gateway would be a lie the
// client would find out about the first time he clicked it.

import { el, money, haptic, validPhone, faWeek, faShort, scrollTop } from '../util.js';
import { icon } from '../icons.js';
import { DELIVERY, BRAND } from '../config.js';
import { pageHead, footer, note, toast, brandEl } from '../ui.js';
import { go } from '../router.js';
import {
  state, bagTotal, clearBag, placeOrder, saveProfile, addAddress,
} from '../store.js';

const PAY = [
  { id: 'card', name: 'کارت به کارت', sub: 'شماره کارت بعد از ثبت پیامک می‌شود' },
  { id: 'cash', name: 'پرداخت هنگام تحویل', sub: 'نقدی یا کارتخوان همراه پیک' },
  { id: 'link', name: 'لینک پرداخت', sub: 'لینک درگاه برای شما فرستاده می‌شود' },
];

export default function checkout() {
  if (!state.bag.length) { go('/bag', { replace: true }); return el('div'); }

  const f = {
    zone: 'central',
    date: nextDays()[0].value,
    slot: DELIVERY.slots[2],
    buyerName: state.profile.name || '',
    buyerPhone: state.profile.phone || '',
    forSelf: false,
    recName: '', recPhone: '', address: '', unit: '',
    anon: false,
    pay: 'card',
    saveAddr: true,
  };

  const v = el('div', { class: 'view page' });
  const wrap = el('div', { class: 'wrap wrap--tight' });
  wrap.append(pageHead('تحویل', 'کجا، کِی، و به دست چه کسی.'));

  /* ------------------------------------------------------------- زمان */
  const zonePanel = el('div', { class: 'panel' },
    el('div', { class: 'panel__t', text: 'نحوه دریافت' }));
  const zoneRows = el('div', { class: 'rows' });
  DELIVERY.zones.forEach((z) => {
    const b = el('button', {
      class: 'row row--btn', type: 'button',
      onclick: () => { f.zone = z.id; syncZones(); haptic(); paintTotals(); },
    },
      el('div', { class: 'row__ic', html: icon(z.id === 'pickup' ? 'pin' : 'truck') }),
      el('div', { class: 'row__b' },
        el('div', { class: 'row__t', text: z.name }),
        el('div', { class: 'row__s', text: `${z.sub} · ${z.eta}` })),
      el('div', { class: 'row__e' },
        el('span', { text: z.fee ? money(z.fee) : 'رایگان' }),
        el('span', { class: 'zone-tick', html: icon('check') })),
    );
    zoneRows.append(b);
  });
  zonePanel.append(zoneRows);
  wrap.append(zonePanel);
  function syncZones() {
    [...zoneRows.children].forEach((r, i) => {
      const on = DELIVERY.zones[i].id === f.zone;
      r.classList.toggle('is-on', on);
      r.querySelector('.zone-tick').style.opacity = on ? '1' : '0';
    });
    addrPanel.hidden = f.zone === 'pickup';
  }

  /* ------------------------------------------------------------- تاریخ */
  const datePanel = el('div', { class: 'panel' },
    el('div', { class: 'panel__t', text: 'زمان تحویل' }),
    el('div', { class: 'panel__s', text: 'تا ۷ روز آینده. برای امروز، تا ساعت ۱۵ ثبت کنید.' }),
  );
  const dayChips = el('div', { class: 'chips',
    style: { paddingInline: '0', marginInline: '0' } });
  nextDays().forEach((d) => {
    dayChips.append(el('button', {
      class: 'chip chip--sq' + (d.value === f.date ? ' is-on' : ''),
      type: 'button',
      onclick: (e) => {
        f.date = d.value;
        [...dayChips.children].forEach((c) => c.classList.remove('is-on'));
        e.currentTarget.classList.add('is-on');
        haptic();
      },
    }, el('span', { style: { display: 'grid', lineHeight: '1.35', textAlign: 'center' } },
        el('span', { style: { fontSize: '11px', opacity: '.7' }, text: d.week }),
        el('span', { style: { fontSize: '12.5px', fontWeight: '600' }, text: d.label }))));
  });
  datePanel.append(dayChips);

  const slotChips = el('div', { class: 'chips',
    style: { paddingInline: '0', marginInline: '0', marginTop: '10px' } });
  DELIVERY.slots.forEach((s) => {
    slotChips.append(el('button', {
      class: 'chip' + (s === f.slot ? ' is-on' : ''), type: 'button', text: s,
      onclick: (e) => {
        f.slot = s;
        [...slotChips.children].forEach((c) => c.classList.remove('is-on'));
        e.currentTarget.classList.add('is-on');
        haptic();
      },
    }));
  });
  datePanel.append(slotChips);
  wrap.append(datePanel);

  /* ------------------------------------------------------------ گیرنده */
  const addrPanel = el('div', { class: 'panel' },
    el('div', { class: 'panel__t', text: 'گیرنده' }),
    el('div', { class: 'panel__s', text: 'قبل از حرکت پیک با گیرنده تماس می‌گیریم.' }),
  );

  const selfSw = swRow('گیرنده خودم هستم', 'آدرس و شماره خودتان استفاده می‌شود', (on) => {
    f.forSelf = on;
    recWrap.hidden = on;
    validate();
  });
  addrPanel.append(selfSw);

  const recWrap = el('div', {});
  const recName = inp({ placeholder: 'نام گیرنده', autocomplete: 'name' },
    (e) => { f.recName = e.target.value; validate(); });
  const recPhone = inp({
    placeholder: '09xxxxxxxxx', type: 'tel', dir: 'ltr', inputmode: 'numeric',
  }, (e) => { f.recPhone = e.target.value; validate(); });
  const recPhoneErr = el('div', { class: 'err', hidden: true, text: 'شماره موبایل معتبر نیست.' });
  recWrap.append(
    field('نام گیرنده', recName),
    field('شماره گیرنده', recPhone, null, recPhoneErr),
  );
  addrPanel.append(recWrap);

  const address = el('textarea', {
    class: 'inp', placeholder: 'تبریز، خیابان …، کوچه …، پلاک …',
    oninput: (e) => { f.address = e.target.value; validate(); },
  });
  const unit = inp({ placeholder: 'واحد / طبقه / زنگ (اختیاری)' },
    (e) => { f.unit = e.target.value; });
  addrPanel.append(field('آدرس', address), field('جزئیات', unit));

  if (state.profile.addresses.length) {
    const saved = el('div', { class: 'chips',
      style: { paddingInline: '0', marginInline: '0', marginBottom: '14px' } });
    state.profile.addresses.slice(0, 4).forEach((a) => {
      saved.append(el('button', {
        class: 'chip', type: 'button', text: a.label || a.address.slice(0, 22),
        onclick: () => {
          address.value = a.address; f.address = a.address;
          unit.value = a.unit || ''; f.unit = a.unit || '';
          toast('آدرس ذخیره‌شده وارد شد'); validate();
        },
      }));
    });
    addrPanel.insertBefore(saved, recWrap);
  }

  addrPanel.append(swRow('این آدرس را ذخیره کن', 'برای سفارش‌های بعدی', (on) => {
    f.saveAddr = on;
  }, true));
  addrPanel.append(swRow('فرستنده ناشناس بماند', 'نام شما روی کارت نوشته نمی‌شود', (on) => {
    f.anon = on;
  }));
  wrap.append(addrPanel);

  /* ---------------------------------------------------------- سفارش‌دهنده */
  const buyerPanel = el('div', { class: 'panel' },
    el('div', { class: 'panel__t', text: 'شما' }),
    el('div', { class: 'panel__s', text: 'برای هماهنگی سفارش و ارسال فاکتور.' }),
  );
  const bName = inp({ placeholder: 'نام و نام خانوادگی', autocomplete: 'name',
    value: f.buyerName }, (e) => { f.buyerName = e.target.value; validate(); });
  const bPhone = inp({
    placeholder: '09xxxxxxxxx', type: 'tel', dir: 'ltr', inputmode: 'numeric',
    autocomplete: 'tel', value: f.buyerPhone,
  }, (e) => { f.buyerPhone = e.target.value; validate(); });
  const bPhoneErr = el('div', { class: 'err', hidden: true, text: 'شماره موبایل معتبر نیست.' });
  buyerPanel.append(field('نام', bName), field('شماره تماس', bPhone, null, bPhoneErr));
  wrap.append(buyerPanel);

  /* ------------------------------------------------------------ پرداخت */
  const payPanel = el('div', { class: 'panel' },
    el('div', { class: 'panel__t', text: 'پرداخت' }));
  const payRows = el('div', { class: 'rows' });
  PAY.forEach((p) => {
    payRows.append(el('button', {
      class: 'row row--btn', type: 'button',
      onclick: () => { f.pay = p.id; syncPay(); haptic(); },
    },
      el('div', { class: 'row__ic', html: icon(p.id === 'cash' ? 'truck' : 'note') }),
      el('div', { class: 'row__b' },
        el('div', { class: 'row__t', text: p.name }),
        el('div', { class: 'row__s', style: { whiteSpace: 'normal' }, text: p.sub })),
      el('div', { class: 'row__e' }, el('span', { class: 'pay-tick', html: icon('check') })),
    ));
  });
  payPanel.append(payRows);
  wrap.append(payPanel);
  function syncPay() {
    [...payRows.children].forEach((r, i) => {
      r.querySelector('.pay-tick').style.opacity = PAY[i].id === f.pay ? '1' : '0';
    });
  }

  /* ------------------------------------------------------------ جمع کل */
  const totals = el('div', { class: 'panel' });
  wrap.append(totals);
  function paintTotals() {
    const sub = bagTotal();
    const zone = DELIVERY.zones.find((z) => z.id === f.zone);
    const free = sub >= DELIVERY.freeOver && zone.id !== 'pickup';
    const fee = free ? 0 : zone.fee;
    totals.replaceChildren(el('dl', {},
      kv('جمع اقلام', money(sub)),
      kv('کرایه ارسال', fee ? money(fee) : (zone.id === 'pickup' ? '—' : 'رایگان')),
      el('div', { class: 'kv kv--total' },
        el('dt', { text: 'قابل پرداخت' }), el('dd', { text: money(sub + fee) })),
    ));
    return sub + fee;
  }

  wrap.append(note('اگر گلی از ترکیب در دسترس نباشد، قبل از آماده‌سازی با شما تماس می‌گیریم و جایگزین را می‌گوییم.', 'info'));

  const submit = el('button', {
    class: 'btn btn--full btn--lg mt-l', type: 'button', text: 'ثبت سفارش',
    onclick: place,
  });
  wrap.append(submit);
  wrap.append(el('div', { class: 'tiny muted center mt' },
    'با ثبت سفارش، تماس آتلیه برای هماهنگی را می‌پذیرید.'));

  v.append(wrap, footer());

  /* --------------------------------------------------------------- glue */
  function inp(attrs, oninput) {
    return el('input', { class: 'inp', ...attrs, oninput });
  }
  function field(labelText, input, hint, err) {
    const lid = 'f' + Math.random().toString(36).slice(2, 7);
    input.id = lid;
    const box = el('div', { class: 'field' },
      el('label', { for: lid, text: labelText }), input);
    if (hint) box.append(el('div', { class: 'field__hint', text: hint }));
    if (err) box.append(err);
    return box;
  }
  function swRow(t, s, onToggle, initial = false) {
    const box = el('span', { class: 'sw__box' + (initial ? ' is-on' : '') });
    let on = initial;
    return el('button', {
      class: 'sw', type: 'button', style: { width: '100%' },
      'aria-pressed': String(initial),
      onclick: (e) => {
        on = !on;
        box.classList.toggle('is-on', on);
        e.currentTarget.setAttribute('aria-pressed', String(on));
        haptic();
        onToggle(on);
      },
    },
      el('span', { style: { textAlign: 'start' } },
        el('span', { class: 'sw__t', style: { display: 'block' }, text: t }),
        el('span', { class: 'sw__s', style: { display: 'block' }, text: s })),
      box);
  }
  const kv = (k, val) => el('div', { class: 'kv' },
    el('dt', { text: k }), el('dd', { text: val }));

  function validate() {
    const buyerOk = f.buyerName.trim().length > 1 && !!validPhone(f.buyerPhone);
    bPhoneErr.hidden = !(f.buyerPhone.length > 3 && !validPhone(f.buyerPhone));
    bPhone.setAttribute('aria-invalid', bPhoneErr.hidden ? 'false' : 'true');

    let recOk = true;
    if (f.zone !== 'pickup') {
      recOk = f.address.trim().length > 8;
      if (!f.forSelf) {
        const ph = validPhone(f.recPhone);
        recPhoneErr.hidden = !(f.recPhone.length > 3 && !ph);
        recPhone.setAttribute('aria-invalid', recPhoneErr.hidden ? 'false' : 'true');
        recOk = recOk && f.recName.trim().length > 1 && !!ph;
      }
    }
    submit.disabled = !(buyerOk && recOk);
  }

  function place() {
    const zone = DELIVERY.zones.find((z) => z.id === f.zone);
    const sub = bagTotal();
    const free = sub >= DELIVERY.freeOver && zone.id !== 'pickup';
    const fee = free ? 0 : zone.fee;

    saveProfile({ name: f.buyerName.trim(), phone: validPhone(f.buyerPhone) });
    if (f.saveAddr && f.address.trim() && f.zone !== 'pickup') {
      addAddress({ label: f.address.trim().slice(0, 20), address: f.address.trim(), unit: f.unit });
    }

    const order = placeOrder({
      buyer: { name: f.buyerName.trim(), phone: validPhone(f.buyerPhone) },
      recipient: f.zone === 'pickup'
        ? { name: 'تحویل حضوری', phone: validPhone(f.buyerPhone), address: BRAND.address }
        : {
            name: f.forSelf ? f.buyerName.trim() : f.recName.trim(),
            phone: f.forSelf ? validPhone(f.buyerPhone) : validPhone(f.recPhone),
            address: f.address.trim() + (f.unit ? ` — ${f.unit}` : ''),
          },
      items: state.bag.map((l) => ({
        slug: l.slug, name: l.name, size: l.size, qty: l.qty, price: l.price,
        addons: l.addons, note: l.note, brief: l.brief || null,
      })),
      delivery: { zone: f.zone, date: f.date, slot: f.slot, fee },
      pay: f.pay, anon: f.anon,
      total: sub + fee,
    });

    clearBag();
    haptic(18);
    go(`/order/${order.id}`);
  }

  syncZones(); syncPay(); paintTotals(); validate();
  recWrap.hidden = f.forSelf;
  return v;
}

/* --------------------------------------------------------------- helpers */
function nextDays(n = 7) {
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(12, 0, 0, 0);
    out.push({
      value: d.getTime(),
      week: i === 0 ? 'امروز' : i === 1 ? 'فردا' : faWeek(d),
      label: faShort(d),
    });
  }
  return out;
}
