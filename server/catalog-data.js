const BASE = [
  { id: 't1', cat: 'ceramic', brand: 'Cleopatra', type: 'tile', price: 285, old: 320, stock: 120, tone: '#cdbfa8',
    name: { ar: 'أرضيات كليوباترا جراند', en: 'Cleopatra Grand floor tiles' },
    tile: { size: '60×120', finish: { ar: 'لامع', en: 'Glossy' }, perBox: 1.44, pcs: 2 } },
  { id: 't2', cat: 'ceramic', brand: 'Gawhara', type: 'tile', price: 210, old: 0, stock: 200, tone: '#a9a39a',
    name: { ar: 'أرضيات الجوهرة ستون', en: 'Gawhara Stone floor tiles' },
    tile: { size: '60×60', finish: { ar: 'مطفي', en: 'Matte' }, perBox: 1.44, pcs: 4 } },
  { id: 't3', cat: 'ceramic', brand: 'Remas', type: 'tile', price: 175, old: 195, stock: 3, tone: '#e4dccf',
    name: { ar: 'حوائط ريماس مودرن', en: 'Remas Modern wall tiles' },
    tile: { size: '30×60', finish: { ar: 'لامع', en: 'Glossy' }, perBox: 1.62, pcs: 9 } },
  { id: 't4', cat: 'ceramic', brand: 'Lecico', type: 'tile', price: 150, old: 0, stock: 90, tone: '#b7aa94',
    name: { ar: 'أرضيات ليسيكو كلاسيك', en: 'Lecico Classic floor tiles' },
    tile: { size: '40×40', finish: { ar: 'مطفي', en: 'Matte' }, perBox: 1.76, pcs: 11 } },
  { id: 't5', cat: 'ceramic', brand: 'Iberia', type: 'tile', price: 520, old: 585, stock: 40, tone: '#8f8a84',
    name: { ar: 'بورسلين أرضيات إسباني', en: 'Spanish porcelain floor tiles' },
    tile: { size: '60×120', finish: { ar: 'مطفي', en: 'Matte' }, perBox: 1.44, pcs: 2 } },

  { id: 's1', cat: 'sanitary', brand: 'Grohe', type: 'item', price: 8900, old: 9800, stock: 5, tone: '#e9e9e9',
    name: { ar: 'مرحاض معلق أبيض', en: 'White wall-hung toilet' },
    specs: [[{ ar: 'اللون', en: 'Color' }, { ar: 'أبيض', en: 'White' }]] },
  { id: 's2', cat: 'mixers', brand: 'Grohe', type: 'item', price: 3100, old: 3500, stock: 14, tone: '#d5d9dc',
    name: { ar: 'خلاط حوض كروم', en: 'Chrome basin mixer' },
    specs: [[{ ar: 'التشطيب', en: 'Finish' }, { ar: 'كروم', en: 'Chrome' }]] },
  { id: 's3', cat: 'mixers', brand: 'Grohe', type: 'item', price: 5400, old: 6100, stock: 9, tone: '#cfd3d6',
    name: { ar: 'مجموعة شاور كاملة', en: 'Complete shower set' } },
  { id: 's4', cat: 'basins', brand: 'Grohe', type: 'item', price: 2600, old: 0, stock: 12, tone: '#efefef',
    name: { ar: 'حوض معلق', en: 'Wall-hung basin' } },
  { id: 's5', cat: 'mixers', brand: 'Grohe', type: 'item', price: 4200, old: 5300, stock: 1, tone: '#2b2b2b',
    name: { ar: 'شطاف أسود مطفي', en: 'Matte black bidet spray' } }
];

// القسم الفرعي لكل منتج من الأساسيين (بيربط المنتج بصفحة القسم الفرعي)
const SUBS = {
  t1: 'cleopatra-floors', t2: 'gawhara-floors', t3: 'remas-walls', t4: 'lecico-floors', t5: 'spanish-porcelain-floors',
  s1: 'toilets', s2: 'basin-mixers', s3: 'shower-system', s4: 'wall-hung-basin', s5: 'bidet-mixer'
};
BASE.forEach(p => {
  p.sub = SUBS[p.id];
  if (p.type === 'tile') p.use = p.sub.includes('walls') ? 'wall' : 'floor';
});

/* ===== منتجات تجريبية إضافية عشان الفلاتر وتقسيم الصفحات يبانوا ===== */
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const TONES = ['#cdbfa8', '#a9a39a', '#e4dccf', '#b7aa94', '#8f8a84', '#d9cbb4', '#e8e1d6', '#c2b8a6'];
const SIZES = [
  { size: '60×60', perBox: 1.44, pcs: 4 }, { size: '60×120', perBox: 1.44, pcs: 2 },
  { size: '50×50', perBox: 1.5, pcs: 6 }, { size: '40×40', perBox: 1.76, pcs: 11 },
  { size: '30×60', perBox: 1.62, pcs: 9 }, { size: '30×90', perBox: 1.62, pcs: 6 }
];
const SZ = Object.fromEntries(SIZES.map(s => [s.size, s]));
const FLOOR_SIZES = ['60×60', '60×120', '50×50', '40×40'].map(s => SZ[s]);
const WALL_SIZES = ['30×60', '30×90'].map(s => SZ[s]);
const FINISH = [{ ar: 'لامع', en: 'Glossy' }, { ar: 'مطفي', en: 'Matte' }];
const FLOOR_BRANDS = [['Cleopatra', 'كليوباترا'], ['Gawhara', 'الجوهرة'], ['Primo', 'بريمو'], ['Remas', 'ريماس'], ['Lecico', 'ليسيكو'], ['Art', 'آرت'], ['Enova', 'إينوفا']];
const WALL_BRANDS = [['Gawhara', 'الجوهرة'], ['Cleopatra', 'كليوباترا'], ['Platino', 'بلاتينو'], ['Enova', 'إينوفا'], ['Remas', 'ريماس'], ['Primo', 'بريمو'], ['Art', 'آرت'], ['Lecico', 'ليسيكو']];

let n = 0;
const more = [];

function addTile({ use, brand, sz, finish, sub, nameAr, nameEn, mult = 1 }) {
  n++;
  const price = Math.round((130 + ((n * 37) % 260)) * mult);
  more.push({
    id: `g${n}`, cat: 'ceramic', sub, use, brand, type: 'tile', price,
    old: n % 3 === 0 ? Math.round(price * 1.15) : 0,
    stock: n % 9 === 0 ? 0 : (n % 11 === 0 ? 2 : 20 + ((n * 17) % 150)),
    tone: TONES[n % TONES.length],
    name: { ar: nameAr, en: nameEn },
    tile: { size: sz.size, finish, perBox: sz.perBox, pcs: sz.pcs }
  });
}

FLOOR_BRANDS.forEach(([b, bAr], i) => [0, 1].forEach(k => {
  const sz = FLOOR_SIZES[(i + k) % FLOOR_SIZES.length];
  const finish = FINISH[(i + k) % 2];
  addTile({ use: 'floor', brand: b, sz, finish, sub: `${slug(b)}-floors`,
    nameAr: `أرضيات ${bAr} ${sz.size} ${finish.ar}`, nameEn: `${b} ${sz.size} ${finish.en} floor tiles` });
}));

WALL_BRANDS.forEach(([b, bAr], i) => [0, 1].forEach(k => {
  const sz = WALL_SIZES[(i + k) % WALL_SIZES.length];
  const finish = FINISH[(i + k + 1) % 2];
  addTile({ use: 'wall', brand: b, sz, finish, sub: `${slug(b)}-walls`,
    nameAr: `حوائط ${bAr} ${sz.size} ${finish.ar}`, nameEn: `${b} ${sz.size} ${finish.en} wall tiles` });
}));

[['Indian', 'هندي', 'Kerala'], ['Spanish', 'إسباني', 'Iberia'], ['Egyptian', 'مصري', 'Nile']].forEach(([o, oAr, brand], i) =>
  [SZ['60×120'], SZ['60×60']].forEach((sz, k) => {
    const finish = FINISH[(i + k) % 2];
    addTile({ use: 'floor', brand, sz, finish, sub: `${slug(o)}-porcelain-floors`, mult: 2,
      nameAr: `بورسلين أرضيات ${oAr} ${sz.size} ${finish.ar}`, nameEn: `${o} porcelain floor tiles ${sz.size} ${finish.en}` });
  }));

// [القسم, القسم الفرعي, الماركة, عربي, English, السعر, السعر القديم, المخزون, اللون]
const ITEMS = [
  ['sanitary', 'toilets', 'Nile', 'مرحاض أرضي سيراميك', 'Floor-standing toilet', 4800, 5400, 10, '#ececec'],
  ['sanitary', 'toilets', 'Aqua', 'مرحاض ذكي بغطاء هادئ', 'Soft-close smart toilet', 12900, 0, 4, '#f2f2f2'],
  ['sanitary', 'bathtub-without-side', 'Aqua', 'بانيو حر الوقوف 170 سم', 'Freestanding bathtub 170 cm', 25048, 27800, 3, '#f4f4f4'],
  ['sanitary', 'shower-cabins', 'Sahara', 'كابينة شاور زجاج 90×90', 'Glass shower cabin 90×90', 9800, 0, 6, '#dfe7ea'],
  ['sanitary', 'jacuzzi', 'Sahara', 'جاكوزي زاوية', 'Corner jacuzzi', 38500, 42000, 2, '#eef2f3'],
  ['mixers', 'bath-mixers', 'Grohe', 'خلاط بانيو كروم', 'Chrome bath mixer', 3600, 0, 11, '#d5d9dc'],
  ['mixers', 'shower-mixers', 'Grohe', 'خلاط دش أسود مطفي', 'Matte black shower mixer', 4100, 4700, 8, '#2b2b2b'],
  ['mixers', 'shower-panel', 'Sahara', 'شاور بانل ستانلس', 'Stainless shower panel', 7400, 0, 5, '#cfd3d6'],
  ['mixers', 'wall-mounted-kitchen-mixers', 'Grohe', 'خلاط مطبخ حائطي', 'Wall-mounted kitchen mixer', 2900, 3300, 9, '#d8dcde'],
  ['mixers', 'deck-mounted-kitchen-mixers', 'Grohe', 'خلاط مطبخ دوّار', 'Swivel kitchen mixer', 3300, 0, 13, '#cdd1d4'],
  ['basins', 'countertop-basins', 'Nile', 'حوض فوق الرخامة دائري', 'Round countertop basin', 1850, 0, 15, '#f0f0f0'],
  ['basins', 'pedestal-basin', 'Nile', 'حوض استاند', 'Pedestal basin', 2200, 2500, 7, '#efefef'],
  ['basins', 'bathroom-units', 'Sahara', 'وحدة حمام 80 سم مع حوض', 'Bathroom unit 80 cm with basin', 6900, 0, 5, '#cdbfa8'],
  ['basins', 'kitchen-sinks', 'Aqua', 'حوض مطبخ ستانلس مزدوج', 'Double stainless kitchen sink', 4300, 4900, 6, '#c8ccce'],
  ['plumbing', 'water-pumps', 'Luna', 'مضخة مياه 1 حصان', '1 HP water pump', 5200, 0, 8, '#9aa3a8'],
  ['plumbing', 'valves', 'Sahara', 'محبس كروم نصف بوصة', 'Chrome valve 1/2 inch', 180, 0, 120, '#d5d9dc'],
  ['plumbing', 'drain-pipes', 'Sahara', 'ماسورة صرف 110 مم', 'Drain pipe 110 mm', 95, 0, 300, '#bdbdbd'],
  ['decor', 'mirrors', 'Sahara', 'مراية حمام مضيئة', 'Lit bathroom mirror', 2100, 2400, 10, '#cfe0e6'],
  ['decor', 'bathroom-accessories', 'Grohe', 'طقم إكسسوارات حمام ذهبي', 'Gold bathroom accessories set', 1900, 2100, 12, '#d4a62a']
];
ITEMS.forEach(([cat, sub, brand, ar, en, price, old, stock, tone], i) =>
  more.push({ id: `x${i + 1}`, cat, sub, brand, type: 'item', price, old, stock, tone, name: { ar, en } }));

module.exports = [...BASE, ...more];