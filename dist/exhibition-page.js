(() => {
  const exhibitions = window.cheshuyaExhibitions || [];
  const id = new URLSearchParams(window.location.search).get('id');
  const currentIndex = exhibitions.findIndex(item => item.id === id);
  const item = exhibitions[currentIndex];
  if (!item) return;

  document.title = `${item.title} — Чешуя`;
  document.querySelector('.zine-info h1').textContent = item.title;
  document.querySelector('.zine-meta').textContent = `Выставка · ${item.year}`;
  document.querySelector('.exhibition-place').textContent = item.description;
  const firstPhoto = document.querySelector('.zine-photo');
  firstPhoto.alt = item.title;
  firstPhoto.fetchPriority = 'high';
  const images = Array.from({ length: item.count }, (_, index) => {
    const base = `images/${window.cheshuyaExhibitionBase(item, index + 1)}`;
    return {
      src: `${base}-1200.webp`,
      srcset: `${base}-600.webp 600w, ${base}-1200.webp 1200w, ${base}-2000.webp 2000w`,
    };
  });
  const gallery = window.CheshuyaCarousel.mountImageGallery(
    document.querySelector('.zine-slide'), images,
    index => { document.querySelector('.counter').textContent = `${index + 1} / ${item.count}`; },
  );
  document.querySelectorAll('.zine-slide img').forEach((photo, index) => {
    photo.alt = `${item.title} — фото ${index + 1} из ${item.count}`;
  });
  document.querySelector('.zine-controls').hidden = item.count < 2;
  document.querySelector('.prev')?.addEventListener('click', () => gallery?.move(-1));
  document.querySelector('.next')?.addEventListener('click', () => gallery?.move(1));
  document.querySelector('.zine-carousel')?.setAttribute('tabindex', '0');

  const previous = exhibitions[(currentIndex + exhibitions.length - 1) % exhibitions.length];
  const next = exhibitions[(currentIndex + 1) % exhibitions.length];
  document.querySelector('.exhibition-prev').href = `exhibition.html?id=${previous.id}`;
  document.querySelector('.exhibition-next').href = `exhibition.html?id=${next.id}`;
})();
