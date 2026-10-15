(() => {
  const images = [...document.querySelectorAll('img[data-src]')];
  if (!images.length) return;
  let activated = false;
  const events = ['pointerdown', 'touchstart', 'keydown', 'scroll'];
  const activate = () => {
    if (activated) return;
    activated = true;
    clearTimeout(fallback);
    events.forEach(name => window.removeEventListener(name, activate));
    for (const image of images) {
      if (image.dataset.srcset) image.srcset = image.dataset.srcset;
      image.src = image.dataset.src;
      delete image.dataset.src;
      delete image.dataset.srcset;
    }
  };
  const fallback = setTimeout(activate, 4000);
  events.forEach(name => window.addEventListener(name, activate, { once: true, passive: true }));
  const lead = document.querySelector('.street-feature img');
  if (lead) lead.decode().then(activate, activate); else activate();
})();
