// The catalogue.
//
// Seven pieces, one per photograph the client sent. Nothing here is
// illustrated with a photo that is not of that piece — a florist's customer
// buys the picture, and a stock image on a flower shop reads as a lie.
// Prices are placeholders until the client gives his own.

export const CATS = [
  { id: 'all', name: 'همه' },
  { id: 'stand', name: 'استند تبریک' },
  { id: 'vase', name: 'باکس و گلدان' },
  { id: 'bouquet', name: 'دسته‌گل' },
];

export const PRODUCTS = [
  {
    slug: 'hezar-rose',
    name: 'هزار رز',
    lat: 'Hezar Rose',
    cat: 'stand',
    price: 24000000,
    tag: 'امضای کایا',
    photo: 'hezar-rose',
    short: 'گنبد رز سرخ، گلدان سرامیک کایا',
    desc: 'گنبدی از رز سرخ هلندی، دانه به دانه هم‌قد چیده شده تا سطحی یکدست بسازد، روی گلدان سرامیک سفید کایا با لوگوی طلایی. این قطعه برای لحظه‌ای ساخته می‌شود که قرار است کسی از جا بلند شود — افتتاحیه، خواستگاری، سالگردی که یادش می‌ماند.',
    stems: [
      { n: 'رز سرخ هلندی', c: 'حدود ۵۰۰ شاخه' },
      { n: 'گلدان سرامیک کایا', c: 'سفید، لوگوی طلایی' },
    ],
    dims: 'ارتفاع حدود ۱۱۰ سانتی‌متر · قطر گنبد ۷۰ سانتی‌متر',
    care: 'دور از تابش مستقیم آفتاب و کولر نگه دارید. رز سرخ در دمای خنک تا ده روز شاداب می‌ماند.',
    lead: 'سفارش این قطعه ۲۴ ساعت قبل ثبت شود.',
    sizes: false,
  },
  {
    slug: 'sahar',
    name: 'سحر',
    lat: 'Sahar',
    cat: 'stand',
    price: 8600000,
    photo: 'sahar',
    short: 'رز صورتی، کاسه سنگی کایا',
    desc: 'رز صورتی و مویز، در کاسه سنگی مشکی با لوگوی طلایی، با ریبون‌های ساتن و کارت‌های کایا. حجمی که از در ورودی دیده می‌شود و رنگی که به هیچ لباسی نمی‌خورد جز روشنی صبح.',
    stems: [
      { n: 'رز صورتی', c: '۶۰ شاخه' },
      { n: 'رز لَوندر', c: '۲۵ شاخه' },
      { n: 'اکالیپتوس و برگ سبز', c: 'به تناسب' },
      { n: 'کاسه سنگی کایا', c: 'مشکی مات' },
    ],
    dims: 'ارتفاع حدود ۸۰ سانتی‌متر · عرض ۷۵ سانتی‌متر',
    care: 'هر دو روز آب گلدان عوض شود؛ انتهای ساقه‌ها را یک سانت کج ببرید.',
    lead: 'تحویل همان روز، در صورت ثبت تا ساعت ۱۵.',
    sizes: true,
  },
  {
    slug: 'banafsheh',
    name: 'بنفشه',
    lat: 'Banafsheh',
    cat: 'stand',
    price: 6400000,
    photo: 'banafsheh',
    short: 'استند افتتاحیه، پالت رنگارنگ',
    desc: 'استند سفید کایا با ترکیبی از گلایول، لیسیانتوس بنفش، آنتوریوم و رز نارنجی. برای افتتاحیه و تبریک کاری ساخته شده: از دور دیده می‌شود، نام شما روی کارت می‌نشیند و ریبون بنفش امضای این ترکیب است.',
    stems: [
      { n: 'گلایول بنفش و صورتی', c: '۱۸ شاخه' },
      { n: 'لیسیانتوس بنفش', c: '۲۰ شاخه' },
      { n: 'آنتوریوم', c: '۶ شاخه' },
      { n: 'رز نارنجی و شب‌بو', c: 'به تناسب' },
      { n: 'استند چوبی سفید کایا', c: 'قابل بازگشت' },
    ],
    dims: 'ارتفاع کل با استند حدود ۱۵۰ سانتی‌متر',
    care: 'مخزن استند را روزانه پر کنید. گلایول در آب تازه تا یک هفته باز می‌شود.',
    lead: 'برای افتتاحیه، ۱۲ ساعت قبل هماهنگ کنید.',
    sizes: true,
  },
  {
    slug: 'arghavan',
    name: 'ارغوان',
    lat: 'Arghavan',
    cat: 'vase',
    price: 4800000,
    tag: 'پرفروش',
    photo: 'arghavan',
    short: 'آنتوریوم بنفش، کاسه پایه‌دار',
    desc: 'آنتوریوم بنفش براق کنار لیسیانتوس، رز سفید و لیمونیوم، در کاسه پایه‌دار سفید روی پایه برنجی. قطعه‌ای برای کنسول ورودی یا میز مدیریت — از هر زاویه پر است و از هیچ زاویه‌ای شلوغ نیست.',
    stems: [
      { n: 'آنتوریوم بنفش', c: '۷ شاخه' },
      { n: 'لیسیانتوس بنفش و سفید', c: '۲۴ شاخه' },
      { n: 'رز سفید', c: '۱۲ شاخه' },
      { n: 'لیمونیوم', c: 'به تناسب' },
      { n: 'کاسه پایه برنجی', c: 'همراه قطعه' },
    ],
    dims: 'ارتفاع حدود ۵۵ سانتی‌متر · عرض ۶۵ سانتی‌متر',
    care: 'آنتوریوم به آب کم و نور غیرمستقیم نیاز دارد؛ برگ‌ها را با دستمال نمدار پاک کنید.',
    lead: 'تحویل همان روز.',
    sizes: true,
  },
  {
    slug: 'aftab',
    name: 'آفتاب',
    lat: 'Aftab',
    cat: 'vase',
    price: 3900000,
    photo: 'aftab',
    short: 'لیلیوم نارنجی، گلدان سرامیک کایا',
    desc: 'لیلیوم و گلایول نارنجی با آنتوریوم و رز هلویی، در گلدان سرامیک سفید کایا. وقتی غنچه‌های لیلیوم باز شوند حجم قطعه یک‌سوم بیشتر می‌شود — این ترکیب برای همان هفته دوم چیده شده است.',
    stems: [
      { n: 'لیلیوم نارنجی', c: '۹ شاخه' },
      { n: 'گلایول', c: '۱۵ شاخه' },
      { n: 'آنتوریوم هلویی', c: '۵ شاخه' },
      { n: 'رز مینیاتوری و هورتانسیا', c: 'به تناسب' },
      { n: 'گلدان سرامیک کایا', c: 'لوگوی طلایی' },
    ],
    dims: 'ارتفاع حدود ۹۰ سانتی‌متر · عرض ۷۰ سانتی‌متر',
    care: 'پرچم‌های لیلیوم را بعد از باز شدن جدا کنید تا گرده روی گلبرگ لک نیندازد.',
    lead: 'تحویل همان روز.',
    sizes: true,
  },
  {
    slug: 'nilgoon',
    name: 'نیلگون',
    lat: 'Nilgoon',
    cat: 'bouquet',
    price: 2650000,
    photo: 'nilgoon',
    short: 'رز آبی و آنتوریوم مشکی',
    desc: 'رز آبی و ارکیده، آنتوریوم مشکی و رز نارنجی، در کاغذ مشکی مات. تندترین ترکیب کایا و تنها قطعه‌ای که رنگ سرد را جلو می‌اندازد. برای کسی که گل معمولی دوست ندارد.',
    stems: [
      { n: 'رز آبی', c: '۱۵ شاخه' },
      { n: 'آنتوریوم مشکی', c: '۹ شاخه' },
      { n: 'رز نارنجی', c: '۱۲ شاخه' },
      { n: 'رز هلویی و اکالیپتوس', c: 'به تناسب' },
    ],
    dims: 'قطر دسته حدود ۵۰ سانتی‌متر',
    care: 'رنگ رز آبی خوراکی و پایدار است؛ با آب تماس مستقیم ندهید.',
    lead: 'تحویل همان روز.',
    sizes: true,
  },
  {
    slug: 'shahd',
    name: 'شهد',
    lat: 'Shahd',
    cat: 'bouquet',
    price: 1980000,
    photo: 'shahd',
    short: 'لیلیوم و رز، پالت کهربایی',
    desc: 'لیلیوم هلویی، رز کرم و شب‌بو در پالتی که از نارنجی شروع می‌شود و به صورتی کهنه می‌رسد. سبک‌ترین قطعه کایا و آنکه بیشتر از همه بو دارد.',
    stems: [
      { n: 'لیلیوم هلویی', c: '۷ شاخه' },
      { n: 'رز کرم و هلویی', c: '۱۸ شاخه' },
      { n: 'شب‌بو', c: '۱۰ شاخه' },
      { n: 'رز مینیاتوری', c: 'به تناسب' },
    ],
    dims: 'قطر دسته حدود ۴۵ سانتی‌متر',
    care: 'در گلدان بلند و آب تا نیمه ساقه بگذارید.',
    lead: 'تحویل همان روز.',
    sizes: true,
  },
];

export const byslug = (s) => PRODUCTS.find((p) => p.slug === s);

/* ------------------------------------------------------- the custom brief */
// The custom page walks these six steps. Each answer is a plain id so the
// order that comes out the other end is readable by whoever picks up the
// phone at the shop.

export const OCCASIONS = [
  { id: 'birthday', name: 'تولد' },
  { id: 'anniv', name: 'سالگرد' },
  { id: 'opening', name: 'افتتاحیه' },
  { id: 'congrats', name: 'تبریک' },
  { id: 'love', name: 'عاشقانه' },
  { id: 'thanks', name: 'تشکر' },
  { id: 'sympathy', name: 'تسلیت' },
  { id: 'none', name: 'بدون مناسبت' },
];

export const FORMS = [
  { id: 'bouquet', name: 'دسته‌گل', sub: 'کاغذ و ریبون' },
  { id: 'box', name: 'باکس', sub: 'جعبه مقوایی کایا' },
  { id: 'vase', name: 'گلدان', sub: 'سرامیک یا شیشه' },
  { id: 'stand', name: 'استند', sub: 'برای افتتاحیه' },
  { id: 'basket', name: 'سبد', sub: 'دسته‌دار، برای هدیه' },
  { id: 'dome', name: 'گنبد رز', sub: 'قطعه امضا' },
];

export const PALETTES = [
  { id: 'white', name: 'سفید و سبز', hex: ['#FFFFFF', '#EDEFE8', '#9FB08C'] },
  { id: 'pink', name: 'صورتی', hex: ['#F6D9DF', '#E8A0B4', '#C4718B'] },
  { id: 'red', name: 'سرخ', hex: ['#C1121F', '#8B0E18', '#F0C8C0'] },
  { id: 'amber', name: 'نارنجی و کهربایی', hex: ['#F2A65A', '#E2703A', '#F6D8B8'] },
  { id: 'purple', name: 'بنفش', hex: ['#7B4A9E', '#4E2B6B', '#C9A9DE'] },
  { id: 'blue', name: 'آبی', hex: ['#2E6FBF', '#123A6B', '#BBD3EC'] },
  { id: 'mixed', name: 'رنگارنگ', hex: ['#E2703A', '#7B4A9E', '#F2C14E'] },
  { id: 'mono', name: 'تک‌رنگ سفید', hex: ['#FFFFFF', '#F4F2EE', '#DFDBD4'] },
];

export const FLOWERS = [
  { id: 'rose', name: 'رز' },
  { id: 'lily', name: 'لیلیوم' },
  { id: 'anthurium', name: 'آنتوریوم' },
  { id: 'lisianthus', name: 'لیسیانتوس' },
  { id: 'gladiolus', name: 'گلایول' },
  { id: 'orchid', name: 'ارکیده' },
  { id: 'hydrangea', name: 'هورتانسیا' },
  { id: 'gerbera', name: 'ژربرا' },
  { id: 'tuberose', name: 'مریم' },
  { id: 'stock', name: 'شب‌بو' },
  { id: 'chrys', name: 'داوودی' },
  { id: 'eucalyptus', name: 'اکالیپتوس' },
];

// Budget rail for the custom brief. The step is coarse on purpose: the shop
// quotes the real number back after reading the brief.
export const BUDGETS = [
  1500000, 2500000, 3500000, 5000000, 7000000, 10000000, 15000000, 25000000,
];

export const WRAPS = [
  { id: 'black', name: 'مشکی مات', hex: '#141416' },
  { id: 'cream', name: 'کرم', hex: '#EFE7DA' },
  { id: 'white', name: 'سفید', hex: '#FFFFFF' },
  { id: 'kraft', name: 'کرافت', hex: '#C9A883' },
  { id: 'navy', name: 'سرمه‌ای', hex: '#1E2B45' },
];
