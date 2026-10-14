(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const images = window.ZINE_IMAGES || [];
    const carousel = document.querySelector('.zine-carousel');
    const counter = document.querySelector('.counter');
    const gallery = window.CheshuyaCarousel.mountImageGallery(
      document.querySelector('.zine-slide'), images,
      index => { if (counter) counter.textContent = `${index + 1} / ${images.length}`; },
    );
    if (!gallery) return;
    document.querySelector('.prev')?.setAttribute('aria-label', 'Предыдущее изображение');
    document.querySelector('.next')?.setAttribute('aria-label', 'Следующее изображение');
    document.querySelector('.prev')?.addEventListener('click', () => gallery.move(-1));
    document.querySelector('.next')?.addEventListener('click', () => gallery.move(1));
    if (images.length < 2) document.querySelector('.zine-controls')?.setAttribute('hidden', '');
    carousel?.setAttribute('tabindex', '0');
    carousel?.setAttribute('aria-label', 'Галерея изображений');
    document.querySelector('.zine-language')?.addEventListener('click', event => {
      event.currentTarget.textContent = event.currentTarget.textContent === 'En' ? 'Ru' : 'En';
    });
    document.querySelector('.zine-burger')?.addEventListener('click', () => location.href = 'index.html');
  });
})();
