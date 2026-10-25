// السلة بتتحفظ في المتصفح لحد ما نربطها بالسيرفر
const Cart = (() => {
  const KEY = 'zahraa_cart';
  const read = () => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(v) ? v.filter(i => i && typeof i.id === 'string' && i.qty > 0) : [];
    } catch { return []; }
  };
  const write = items => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
    document.dispatchEvent(new Event('cart:change'));
  };
  return {
    get: read,
    count: () => read().length, // عدد المنتجات المختلفة
    add(id, qty) {
      const items = read();
      const it = items.find(i => i.id === id);
      const q = Math.max(1, Math.floor(qty) || 1);
      if (it) it.qty = Math.min(it.qty + q, 9999);
      else items.push({ id, qty: Math.min(q, 9999) });
      write(items);
    },
    set(id, qty) {
      const items = read();
      const it = items.find(i => i.id === id);
      if (!it) return;
      it.qty = Math.max(1, Math.min(Math.floor(qty) || 1, 9999));
      write(items);
    },
    remove(id) { write(read().filter(i => i.id !== id)); },
    clear() { write([]); }
  };
})();