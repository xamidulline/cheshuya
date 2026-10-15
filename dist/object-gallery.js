(() => {
  const buttons = [...document.querySelectorAll('[data-object-index]')];
  if (!buttons.length) return;
  const descriptions = buttons.map(b => b.querySelector('img').alt);
  const dialog = document.createElement('dialog');
  dialog.className = 'object-lightbox';
  dialog.setAttribute('aria-label', 'Просмотр объектов');
  dialog.innerHTML = '<button class="object-lightbox-close" type="button" aria-label="Закрыть">×</button><div class="object-lightbox-view"><button class="object-lightbox-prev" type="button" aria-label="Предыдущее фото">←</button><img alt="" decoding="async"><button class="object-lightbox-next" type="button" aria-label="Следующее фото">→</button></div><span class="object-lightbox-counter" aria-live="polite"></span>';
  document.body.append(dialog);
  let active = 0, opener, previousOverflow = '';
  const render = () => {
    const base = 'images/new-site-assets/objects/object-0'+(active+1);
    const image = dialog.querySelector('img');
    image.sizes = '(max-width: 700px) calc(100vw - 24px), min(1068px, calc(100vw - 64px))';
    image.srcset = [400, 600, 800, 1200, 2000].map(w => base+'-'+w+'.webp '+w+'w').join(', ');
    image.src = base+'-1200.webp';
    image.alt = descriptions[active];
    dialog.querySelector('.object-lightbox-counter').textContent = (active+1)+' / '+buttons.length;
  };
  const move = direction => { active = (active+direction+buttons.length)%buttons.length; render(); };
  buttons.forEach((button,index) => button.addEventListener('click', () => {
    opener = button; active = index; render();
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    dialog.querySelector('.object-lightbox-close').focus();
  }));
  dialog.querySelector('.object-lightbox-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.object-lightbox-prev').addEventListener('click', () => move(-1));
  dialog.querySelector('.object-lightbox-next').addEventListener('click', () => move(1));
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => { document.body.style.overflow = previousOverflow; opener?.focus(); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); }
  });
  let start = null;
  const view = dialog.querySelector('.object-lightbox-view');
  view.addEventListener('pointerdown', event => { if (!event.target.closest('button')) { start = [event.clientX,event.clientY]; view.setPointerCapture(event.pointerId); } });
  view.addEventListener('pointerup', event => {
    if (!start) return;
    const dx = event.clientX-start[0], dy = event.clientY-start[1]; start = null;
    if (Math.abs(dx)>42 && Math.abs(dx)>Math.abs(dy)) move(dx>0?-1:1);
  });
  view.addEventListener('pointercancel', () => { start = null; });
})();
