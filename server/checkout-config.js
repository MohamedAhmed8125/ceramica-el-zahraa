module.exports = {
  // مناطق التوصيل المتاحة دلوقتي. ضيف محافظات هنا لما توسّعوا
  governorates: [
    { id: 'cairo', ar: 'القاهرة', en: 'Cairo' },
    { id: 'giza', ar: 'الجيزة', en: 'Giza' }
  ],
  // تكلفة التوصيل بالجنيه. لو null: بتتحدد بالتليفون عند تأكيد الطلب
  shippingFee: null,
  // خيار الاستلام من المعرض (false لو عايز تقفله)
  pickup: true,
  // رقم التحويل على إنستاباي
  instapayNumber: '01006666083'
};