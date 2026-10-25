// بيانات تجريبية. لما الـ database توصل بنغيّر الدوال اللي في الآخر بس
const CATALOG = [
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

// كل الصفحات بتتعامل مع المنتجات من الدوال دي بس
const Catalog = {
  async all() { return CATALOG; },
  async byId(id) { return CATALOG.find(p => p.id === id) || null; },
  async related(p, n = 4) {
    const same = CATALOG.filter(x => x.cat === p.cat && x.id !== p.id);
    const rest = CATALOG.filter(x => x.cat !== p.cat && x.id !== p.id);
    return [...same, ...rest].slice(0, n);
  }
};