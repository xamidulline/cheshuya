(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const tabs = [...document.querySelectorAll('.static-tabs [data-tab]')];
  const panels = [...document.querySelectorAll('.tab-content')];
  const timers = new WeakMap();
  const select = tab => {
    const next = document.getElementById(tab.dataset.tab);
    if (!next) return;
    const changed = next.hidden;
    tabs.forEach(item => {
      const active = item === tab;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });
    panels.forEach(panel => { panel.hidden = panel !== next; });
    if (changed && !reduced.matches) {
      clearTimeout(timers.get(next));
      next.classList.remove('tab-enter-left', 'tab-enter-right');
      void next.offsetWidth;
      next.classList.add(tab.dataset.tab === 'inside' ? 'tab-enter-right' : 'tab-enter-left');
      timers.set(next, setTimeout(() => next.classList.remove('tab-enter-left', 'tab-enter-right'), 360));
    }
  };
  tabs.forEach((tab,index) => {
    tab.addEventListener('pointerdown', event => { if (event.button === 0) select(tab); });
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', event => {
      const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      const target = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      select(tabs[target]); tabs[target].focus();
    });
  });
  const openSection = target => {
    const section = document.getElementById(target);
    if (!section) return;
    const tab = section.closest('.tab-content')?.id || target;
    const trigger = tabs.find(item => item.dataset.tab === tab);
    if (trigger) select(trigger);
    requestAnimationFrame(() => section.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' }));
  };
  window.CheshuyaHome = { openSection };
  const openHash = () => { if (location.hash) openSection(decodeURIComponent(location.hash.slice(1))); };
  addEventListener('hashchange', openHash);
  openHash();
  document.querySelectorAll('.rail').forEach(rail => {
    const viewport = rail.querySelector('.rail-scroll');
    const controller = window.CheshuyaCarousel.createCardCarousel(viewport);
    rail.querySelector('.rail-prev')?.addEventListener('click', () => controller.move(-1));
    rail.querySelector('.rail-next')?.addEventListener('click', () => controller.move(1));
  });
  const translations = [
    ['.static-tabs [data-tab="outside"]', 'work in context'],
    ['.static-tabs [data-tab="inside"]', 'work with material'],
    ['.street-feature h1', 'Street drawing'],
    ['.street-feature p', 'Searching for new places and structures to draw on. The work adapts to the found space: its surfaces, construction and surrounding conditions. The drawing is made on site, without a preliminary sketch.'],
    ['#zines h2', 'Printed editions'], ['#cyanotype h2', 'Cyanotype'], ['#merch h2', 'Merch'],
    ['#merch .section-description', 'The print refers to a street work made in Kazan in 2020.'],
    ['.inside-intro h1', 'Exploring forms'],
    ['.inside-intro p, #objects .section-description', 'Experiments with metal, ceramics, wood and other materials. The work combines techniques, studies material properties and leaves room for improvisation.'],
    ['#drawings .section-description', 'Graphics and painting: series of works on paper, canvas and wood.'],
    ['#exhibitions h2', 'Exhibitions'], ['#objects h2', 'Objects'], ['#drawings h2', 'Drawings'],
    ['.section-heading a', 'view'],
    ['.static-menu p:first-of-type', 'Work in context'], ['.static-menu p:last-of-type', 'Work with material'],
    ...Object.entries({zines:'Printed editions',cyanotype:'Cyanotype',merch:'Merch',exhibitions:'Exhibitions',objects:'Objects',drawings:'Drawings'}).map(([key,label]) => ['.static-menu [data-target="'+key+'"]',label]),
  ].flatMap(([selector,en]) => [...document.querySelectorAll(selector)].map(node => ({node,ru:node.textContent,en})));
  let english = false;
  document.querySelector('.language-button').addEventListener('click', event => {
    english = !english;
    document.documentElement.lang = english ? 'en' : 'ru';
    event.currentTarget.textContent = english ? 'Ru' : 'En';
    translations.forEach(({node,ru,en}) => { node.textContent = english ? en : ru; });
  });
})();
