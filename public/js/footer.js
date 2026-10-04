/* ====== عدّل البيانات هنا فقط ====== */
const FOOTER_CONFIG = {
  phones: ['01000000000', '01100000000'],     // أرقام التليفون
  email: 'info@ceramica-elzahraa.com',        // الإيميل
  social: {                                   // سيب الرابط '' عشان الأيقونة تختفي
    whatsapp: 'https://wa.me/201000000000',
    facebook: '',
    instagram: '',
    tiktok: '',
    youtube: ''
  },
  payments: ['Visa', 'Mastercard']            // وسائل الدفع (غيّرها حسب الفعلي)
};
/* ================================== */

(function () {
  const C = FOOTER_CONFIG;
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
            <div><small>${t('emailUs')}</small><strong><a href="mailto:${C.email}">${C.email}</a></strong></div>
          </div>
        </div>
      </div>

      <div class="container footer__grid">
        <div class="footer__brand">
          <img src="assets/images/logo.png" alt="Ceramica El-Zahraa">
          <h3>${t('newsletterTitle')}</h3>
          <p>${t('newsletterText')}</p>
          <form class="newsletter" id="newsletterForm">
            <input type="email" required placeholder="${t('newsletterPlaceholder')}" aria-label="email">
            <button type="submit">${t('subscribe')}</button>
          </form>
        </div>

        <nav>
          <h3>${t('custService')}</h3>
          <ul>
            <li><a href="about.html">${t('navAbout')}</a></li>
            <li><a href="#">${t('terms')}</a></li>
            <li><a href="#">${t('contactUs')}</a></li>
            <li><a href="#">${t('blog')}</a></li>
            <li><a href="#">${t('faq')}</a></li>
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

    // TODO: اربط الاشتراك بالسيرفر (لسه مش بيحفظ الإيميل)
    mount.querySelector('#newsletterForm').addEventListener('submit', e => e.preventDefault());
  }

  document.addEventListener('langchange', render);
  render();
})();