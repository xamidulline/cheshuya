(() => {
  const exhibitions = [
    { id: 'polya-prisutstviya', title: 'Поля присутствия', year: '2026', place: 'ДНИ, Москва', images: ['media/DSCF3126-Recovered_1.png'] },
    { id: 'uyazvimoe-mesto', title: 'Уязвимое место', year: '2026', place: 'KMSA, Казань', images: ['media/001_IMG_6172-HDR.jpg'] },
    { id: 'portal', title: 'Portal', year: '2024', place: 'Off-site show, Протвино', images: ['media/SAVE_20240924_153051.jpg'] },
    { id: 'black-show', title: 'Black show', year: '2024', place: 'Off-site show, Протвино', images: ['media/CHESHUYA_THE_NOSE_DIVE_PAPER_LASER_PRINTING_13X15_CM__2024_(2).jpg'] },
    { id: 'rusty-box', title: 'Rusty box', year: '2023', place: 'Off-site show, Алматы', images: ['media/001_IMG_6172-HDR.jpg'] },
    { id: 'sleepy-stupor', title: 'Sleeppy stupor', year: '2023', place: 'Off-site show, Алматы', images: ['media/DSCF3126-Recovered_1.png'] },
  ];
  const id = new URLSearchParams(window.location.search).get('id');
  const currentIndex = Math.max(0, exhibitions.findIndex((item) => item.id === id));
  const item = exhibitions[currentIndex];
  const title = document.querySelector('.zine-info h1');
  document.title = `${item.title} — Чешуя`;
  title.textContent = item.title;
  document.querySelector('.zine-meta').textContent = `Выставка · ${item.year}`;
  document.querySelector('.exhibition-place').textContent = item.place;
  document.querySelector('.zine-photo').alt = item.title;
  const gallery = window.CheshuyaCarousel.mountImageGallery(document.querySelector('.zine-slide'), item.images, index => {
    document.querySelector('.counter').textContent = `${index + 1} / ${item.images.length}`;
  });
  document.querySelector('.zine-controls').hidden = item.images.length < 2;
  document.querySelector('.prev')?.addEventListener('click', () => gallery?.move(-1));
  document.querySelector('.next')?.addEventListener('click', () => gallery?.move(1));
  document.querySelector('.zine-carousel')?.setAttribute('tabindex', '0');
  const previous = exhibitions[(currentIndex + exhibitions.length - 1) % exhibitions.length];
  const next = exhibitions[(currentIndex + 1) % exhibitions.length];
  const prevLink = document.querySelector('.exhibition-prev');
  const nextLink = document.querySelector('.exhibition-next');
  prevLink.href = `exhibition.html?id=${previous.id}`;
  nextLink.href = `exhibition.html?id=${next.id}`;
})();
