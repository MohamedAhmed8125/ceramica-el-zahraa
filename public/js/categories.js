// عدّل الأقسام هنا. كل عنصر: [عربي, English]
const CATEGORIES = [
  { id: 'ceramic', ar: 'السيراميك والبورسلين', en: 'Ceramic & porcelain', cols: [
    { ar: 'سيراميك أرضيات', en: 'Floor ceramic', items: [
      ['أرضيات كليوباترا', 'Cleopatra floors'], ['أرضيات الجوهرة', 'Gawhara floors'], ['أرضيات بريمو', 'Primo floors'],
      ['أرضيات ريماس', 'Remas floors'], ['أرضيات ليسيكو', 'Lecico floors'], ['أرضيات آرت', 'Art floors'], ['أرضيات إينوفا', 'Enova floors'] ] },
    { ar: 'سيراميك الحوائط', en: 'Wall ceramic', items: [
      ['حوائط الجوهرة', 'Gawhara walls'], ['حوائط كليوباترا', 'Cleopatra walls'], ['حوائط بلاتينو', 'Platino walls'],
      ['حوائط إينوفا', 'Enova walls'], ['حوائط ريماس', 'Remas walls'], ['حوائط بريمو', 'Primo walls'],
      ['حوائط آرت', 'Art walls'], ['حوائط ليسيكو', 'Lecico walls'] ] },
    { ar: 'تسوق بمقاس البلاط', en: 'Shop by tile size', items: [
      ['أرضيات 60×60 سم', 'Floors 60×60 cm'], ['أرضيات 60×120 سم', 'Floors 60×120 cm'], ['أرضيات 50×50 سم', 'Floors 50×50 cm'],
      ['أرضيات 40×40 سم', 'Floors 40×40 cm'], ['حوائط 30×60 سم', 'Walls 30×60 cm'], ['حوائط 30×90 سم', 'Walls 30×90 cm'] ] },
    { ar: 'بورسلين الأرضيات', en: 'Floor porcelain', items: [
      ['بورسلين أرضيات هندي', 'Indian porcelain floors'], ['بورسلين أرضيات إسباني', 'Spanish porcelain floors'], ['بورسلين أرضيات مصري', 'Egyptian porcelain floors'] ] },
    { ar: 'أنواع أخرى', en: 'Other types', items: [['الباركيه', 'Parquet'], ['قطع ليزر', 'Laser-cut pieces']] }
  ] },

  { id: 'mixers', ar: 'خلاطات وأنظمة دفن', en: 'Mixers & concealed systems', cols: [
    { ar: 'خلاطات الحمام', en: 'Bathroom mixers', items: [
      ['خلاطات بانيو', 'Bath mixers'], ['خلاطات حوض', 'Basin mixers'], ['خلاطات دش', 'Shower mixers'], ['خلاط بيديه', 'Bidet mixer'] ] },
    { ar: 'أنظمة الدفن والشاور', en: 'Concealed & shower systems', items: [
      ['شاور بانل', 'Shower panel'], ['شاور سيستم', 'Shower system'], ['أنظمة دفن', 'Concealed systems'], ['خزانات دفن', 'Concealed cisterns'] ] },
    { ar: 'خلاطات المطبخ', en: 'Kitchen mixers', items: [
      ['خلاطات مطبخ حائطي', 'Wall-mounted kitchen mixers'], ['خلاطات مطبخ على الحوض', 'Deck-mounted kitchen mixers'] ] }
  ] },

  { id: 'sanitary', ar: 'صحي', en: 'Sanitary ware', cols: [
    { ar: 'أطقم الحمام', en: 'Bathroom sets', items: [] },
    { ar: 'تواليت', en: 'Toilets', items: [] },
    { ar: 'غطاء تواليت', en: 'Toilet seats', items: [] },
    { ar: 'بانيوهات وكبائن', en: 'Bathtubs & shower cabins', items: [
      ['بانيو بدون جانب', 'Bathtub without side'], ['كبائن شاور', 'Shower cabins'], ['بانيو مع جانب', 'Bathtub with side'], ['جاكوزي', 'Jacuzzi'] ] }
  ] },

  { id: 'basins', ar: 'الأحواض والوحدات', en: 'Basins & units', cols: [
    { ar: 'أحواض المطبخ', en: 'Kitchen sinks', items: [] },
    { ar: 'أحواض حمام', en: 'Bathroom basins', items: [
      ['أحواض فوق الرخامة', 'Countertop basins'], ['حوض استاند', 'Pedestal basin'], ['حوض معلق', 'Wall-hung basin'],
      ['حوض ساقط', 'Undermount basin'], ['أحواض ديكور', 'Decor basins'] ] },
    { ar: 'وحدات التخزين', en: 'Storage units', items: [['وحدات الحمام', 'Bathroom units']] }
  ] },

  { id: 'plumbing', ar: 'مستلزمات سباكة', en: 'Plumbing supplies', cols: [
    { ar: 'لوازم تغذية', en: 'Supply fittings', items: [
      ['التركيبات الصحية', 'Sanitary fittings'], ['خزانات المياه', 'Water tanks'], ['مضخات المياه', 'Water pumps'],
      ['محابس', 'Valves'], ['مجرى شاور', 'Shower drain'], ['طابق', 'Tabaq'] ] },
    { ar: 'لوازم صرف', en: 'Drainage fittings', items: [
      ['مواسير صرف', 'Drain pipes'], ['كوع', 'Elbow'], ['بيبة', 'Pipe'], ['تيه', 'Tee'], ['بوب أب ويست', 'Pop-up waste'] ] }
  ] },

  { id: 'decor', ar: 'ديكور', en: 'Decor', cols: [
    { ar: 'الإكسسوارات والديكور', en: 'Accessories & decor', items: [['مرايات', 'Mirrors'], ['إكسسوارات الحمام', 'Bathroom accessories']] }
  ] }
];