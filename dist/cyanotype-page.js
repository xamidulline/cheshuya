(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const cyanotypeNames = [
      '3Zlo6afGt3c', '4fZgpzXQfcE', '5wvXjj3rEZI', 'AZYeIfJK54o', 'CY5UIwCFX20', 'D1cWDhqV32c',
      'GCMmpzFu8cM', 'GIF4GS-d1fo', 'I-hxJI2rWb0', 'MDobQIxSt4s', 'Pcez8msbZL0', 'Vs2tWq9_yGQ',
      'W9jrzIg1Pdc', 'WHCFx0D2GWE', 'al7KcZOECno', 'alOSBlSTCqs', 'atlbHiA7_6Y', 'czdaaxuB2Nk',
      'eFPYBFpvxCo', 'g8MQWCByBUc', 'hOiPGtNX30k', 'hVRYznlZ2co', 'o94VeE3sv-E', 'riDAaRdNTv4',
      'tvtP058PSf8', 'zdYfgFdM__E'
    ];
    const images = cyanotypeNames.map(name => ({
      src: `images/new-site-assets/cyanotypes/${name}-1200.webp`,
      srcset: `images/new-site-assets/cyanotypes/${name}-400.webp 400w, images/new-site-assets/cyanotypes/${name}-600.webp 600w, images/new-site-assets/cyanotypes/${name}-800.webp 800w, images/new-site-assets/cyanotypes/${name}-1200.webp 1200w, images/new-site-assets/cyanotypes/${name}-2000.webp 2000w`
    }));
    const counter = document.querySelector('.counter');
    const carousel = document.querySelector('.zine-carousel');
    const thumbnailsRoot = document.querySelector('.cyanotype-thumbnails');
    if (thumbnailsRoot) {
      thumbnailsRoot.innerHTML = images.map((image, imageIndex) => `<button data-index="${imageIndex}" aria-label="Изображение ${imageIndex + 1}"><img alt="" src="${image.src.replace("-1200.webp", "-192.webp")}" width="62" height="62" decoding="async" loading="lazy"></button>`).join('');
    }
    const thumbnails = [...document.querySelectorAll('.cyanotype-thumbnails button')];
    const gallery = window.CheshuyaCarousel.mountImageGallery(document.querySelector('.zine-slide'), images, index => {
      if (counter) counter.textContent = `${index + 1} / ${images.length}`;
      thumbnails.forEach((button, buttonIndex) => {
        button.classList.toggle('is-active', buttonIndex === index);
        button.setAttribute('aria-pressed', String(buttonIndex === index));
      });
    });
    if (!gallery) return;
    document.querySelector('.prev')?.addEventListener('click', () => gallery.move(-1));
    document.querySelector('.next')?.addEventListener('click', () => gallery.move(1));
    carousel?.setAttribute('tabindex', '0');
    thumbnails.forEach(button => button.addEventListener('click', () => gallery.show(Number(button.dataset.index))));
  });
})();
