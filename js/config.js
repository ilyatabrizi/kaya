// Everything the client owns and might change, in one file.
// Prices, hours and the catalogue copy are placeholders pending the client's
// own numbers — see README, "What is real and what is placeholder".

export const BRAND = {
  name: 'KAYA',
  fa: 'کایا',
  tagline: 'آتلیه گل‌آرایی',
  city: 'تبریز',
  area: 'ولیعصر',
  address: 'تبریز، خیابان ولیعصر',
  instagram: 'kaya_flwr',
  instagramUrl: 'https://instagram.com/kaya_flwr',
  // Two lines. The first is the one that rings during the day.
  phones: ['09308805590', '09142163696'],
  hours: [
    { d: 'شنبه تا چهارشنبه', h: '۹:۰۰ تا ۲۱:۰۰' },
    { d: 'پنجشنبه و جمعه', h: '۹:۰۰ تا ۲۲:۰۰' },
  ],
  // Staff-only panel. K‑A‑Y‑A on a phone keypad.
  crmPin: '5292',
};

export const DELIVERY = {
  // Tabriz only, for now.
  zones: [
    { id: 'central', name: 'مرکز تبریز', sub: 'ولیعصر، ائل‌گلی، آبرسان، ارم', fee: 90000, eta: 'کمتر از ۲ ساعت' },
    { id: 'wide', name: 'سایر مناطق تبریز', sub: 'خارج از محدوده مرکزی', fee: 150000, eta: '۲ تا ۴ ساعت' },
    { id: 'pickup', name: 'تحویل حضوری', sub: 'دریافت از آتلیه، ولیعصر', fee: 0, eta: 'هماهنگی تلفنی' },
  ],
  slots: ['۹ تا ۱۲', '۱۲ تا ۱۵', '۱۵ تا ۱۸', '۱۸ تا ۲۱'],
  freeOver: 5000000,
};

export const ADDONS = [
  { id: 'card', name: 'کارت دست‌نویس', sub: 'با خط خوش، متن دلخواه شما', price: 0 },
  { id: 'ribbon', name: 'ریبون چاپی کایا', sub: 'نام یا پیام روی ریبون ساتن', price: 180000 },
  { id: 'vase', name: 'ارتقا به گلدان سرامیک کایا', sub: 'گلدان سفید با لوگوی طلایی', price: 1200000 },
  { id: 'choc', name: 'جعبه شکلات', sub: 'شکلات تلخ، ۱۲ عددی', price: 850000 },
];

export const SIZES = [
  { id: 's', name: 'کوچک', sub: 'مناسب میز و کنسول', mult: 1 },
  { id: 'm', name: 'متوسط', sub: 'پیشنهاد کایا', mult: 1.45 },
  { id: 'l', name: 'بزرگ', sub: 'حجم دو برابر، برای فضای باز', mult: 2.1 },
];
