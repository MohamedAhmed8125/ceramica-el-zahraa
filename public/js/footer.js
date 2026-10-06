/* ====== عدّل البيانات هنا فقط ====== */
/* ====== عدّل البيانات هنا فقط ====== */
/* ====== عدّل البيانات هنا فقط ====== */
const FOOTER_CONFIG = {
  phones: ['01016735850', '0225172841'],      // أرقام التليفون
  email: 'ceramica.elzahraa@gmail.com',       // الإيميل        // الإيميل (لسه وهمي)
  address: {
    ar: 'زهراء المعادي - شارع الخمسين - الشطر 13 (بجوار البنك الأهلي)',
    en: 'Zahraa El-Maadi - 50th Street - Sector 13 (next to National Bank of Egypt)'
  },
  social: {                                   // سيب الرابط '' عشان الأيقونة تختفي
    whatsapp: 'https://wa.me/201016735850',
    facebook: 'https://www.facebook.com/CeramicaAlZahraa',
    instagram: 'https://www.instagram.com/ceramicaalzahraa/',
    tiktok: '',
    youtube: ''
  },
  mapLink: 'https://maps.app.goo.gl/hQicznhBrN7zd9Go9',          // زرار "افتح في خرائط جوجل"
  mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3456.371726432161!2d31.315016475172474!3d29.968745274961744!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x145839a84c9a2c99%3A0x624e2915b98fef6a!2sCiramica%20Elzahraa!5e0!3m2!1sen!2seg!4v1791205347671!5m2!1sen!2seg',                                                   // رابط الخريطة المدمجة (اختياري، الشرح تحت)
  mapQuery: 'سيراميكا الزهراء، شارع الخمسين، المعادي، القاهرة',    // البحث الاحتياطي لو mapEmbed فاضي
  payments: ['Visa', 'Mastercard']
};
/* ================================== */

// الكمبيوتر: يفتح كتابة رسالة في Gmail | الموبايل: mailto (يفتح تطبيق الإيميل)
function mailHref(email) {
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  return mobile
    ? `mailto:${email}`
    : `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;
}

(function () {
  const C = FOOTER_CONFIG;
  document.querySelectorAll('.whatsapp').forEach(a => { if (C.social.whatsapp) a.href = C.social.whatsapp; });
  const mount = document.getElementById('site-footer');
  if (!mount) return;

  // تحميل الأيقونات وملف الستايل تلقائياً
  ['https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css', 'css/footer.css']
    .forEach(href => {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = href;
      document.head.appendChild(l);
    });

  const icons = { whatsapp: 'fa-whatsapp', facebook: 'fa-facebook-f', instagram: 'fa-instagram', tiktok: 'fa-tiktok', youtube: 'fa-youtube' };

  function render() {
    const phones = C.phones.map(p => `<a href="tel:${p}" dir="ltr">${p}</a>`).join(' - ');
    const social = Object.entries(C.social)
      .filter(([, url]) => url)
      .map(([k, url]) => `<a href="${url}" target="_blank" rel="noopener" aria-label="${k}"><i class="fa-brands ${icons[k]}"></i></a>`)
      .join('');
    const pay = C.payments.map(p => `<span>${p}</span>`).join('');

    mount.innerHTML = `
    <footer class="footer">
      <div class="footer__help">
        <div class="container footer__help-row">
          <div class="footer__help-text">
            <h2>${t('footerHelpTitle')}</h2>
            <p>${t('footerHelpText')}</p>
          </div>
          <div class="contact">
            <i class="fa-solid fa-phone"></i>
            <div><small>${t('callUs')}</small><strong>${phones}</strong></div>
          </div>
          <div class="contact">
            <i class="fa-regular fa-envelope"></i>
            <div><small>${t('emailUs')}</small><strong><a href="${mailHref(C.email)}" target="_blank" rel="noopener">${C.email}</a></strong></div>
          </div>
            <a class="contact" href="${C.mapLink}" target="_blank" rel="noopener">
            <i class="fa-solid fa-location-dot"></i>
            <div><small>${t('addressLabel')}</small><strong>${C.address[lang]}</strong></div>
          </a>
          </div>
        </div>
      </div>

      <div class="container footer__grid">
                <div class="footer__brand">
          <img src="assets/images/logo.png" alt="Ceramica El-Zahraa">
          <p>${t('tagline')}</p>
        </div>

        <nav>
          <h3>${t('custService')}</h3>
          <ul>
            <li><a href="about.html">${t('navAbout')}</a></li>
            <li><a href="contact.html">${t('contactUs')}</a></li>
          </ul>
        </nav>

        <nav>
          <h3>${t('shopByCat')}</h3>
          <ul>
            <li><a href="#">${t('navCeramic')}</a></li>
            <li><a href="#">${t('navPorcelain')}</a></li>
            <li><a href="#">${t('navSanitary')}</a></li>
            <li><a href="#">${t('navMixers')}</a></li>
            <li><a href="#">${t('navAccessories')}</a></li>
            <li><a href="#">${t('navOffers')}</a></li>
          </ul>
        </nav>

        <div class="footer__social">
          <h3>${t('followUs')}</h3>
          <div class="social">${social}</div>
          <div class="pay">${pay}</div>
        </div>
      </div>

      <div class="container footer__bottom">
        <button type="button" class="footer__lang" data-lang="${lang === 'ar' ? 'en' : 'ar'}">
          <i class="fa-solid fa-globe"></i> ${lang === 'ar' ? 'English' : 'عربي'}
        </button>
        <p>© ${new Date().getFullYear()} ${t('taglineName')} – ${t('rights')}</p>
      </div>
    </footer>`;
  }

  document.addEventListener('langchange', render);
  render();
})();