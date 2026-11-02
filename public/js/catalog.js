const Pricing = {
  round2: n => Math.round(n * 100) / 100,
  unit(p) { return p.type === 'tile' ? Pricing.round2(p.price * p.tile.perBox) : p.price; }
};

// المنتجات بتتحمّل من السيرفر. وكل الصفحات بتتعامل معاها من الدوال دي بس
const Catalog = {
  _all: null,
  async all() {
    if (this._all) return this._all;
    try {
      const r = await fetch('/api/products');
      const list = (await r.json()).products;
      return Array.isArray(list) ? (this._all = list) : [];
    } catch { return []; }
  },
  async byId(id) { return (await this.all()).find(p => p.id === id) || null; },
  async related(p, n = 4) {
    const all = await this.all();
    const same = all.filter(x => x.cat === p.cat && x.id !== p.id);
    const rest = all.filter(x => x.cat !== p.cat && x.id !== p.id);
    return [...same, ...rest].slice(0, n);
  }
};