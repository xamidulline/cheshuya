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
  const navigation = performance.getEntriesByType("navigation")[0];
  const freshEntry = navigation?.type !== "back_forward";
  const startAtTop = () => {
    if (location.hash) return;
    if (tabs[0]) select(tabs[0]);
    scrollTo({ top: 0, left: 0, behavior: "instant" });
  };
  const openHash = () => {
    if (!location.hash) return startAtTop();
    let target;
    try { target = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    openSection(target);
  };
  addEventListener("hashchange", openHash);
  addEventListener("pageshow", event => {
    if (!event.persisted && freshEntry && !location.hash) startAtTop();
  });
  if (location.hash) openHash();
  else if (freshEntry) startAtTop();
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
    ['.street-feature p', 'Searching for new places and structures beyond familiar routes. The work begins with getting to know the space and its particular features. The drawing is created on site, without a preliminary sketch, and changes in response to the surface and surrounding conditions.'],
    ['#cyanotype .section-description', "Working with memories through cyanotype. Each print turns out slightly different because of chance and the particularities of the process. These changes echo the way memories lose some details and acquire others over time."],
    ['#zines h2', 'Printed editions'], ['#cyanotype h2', 'Cyanotype'], ['#merch h2', 'Merch'],
    ['#merch .section-description', 'The print refers to a street work made in Kazan in 2020.'],
    ['#objects .section-description', 'Working with different materials and combinations of techniques. Their properties and methods of processing become the basis for experimentation and improvisation. Form emerges during the work, and the finished objects can exist in different spaces and contexts.'],
    ['#drawings .section-description', 'Graphics and painting: series of works on paper, canvas and wood.'],
    ['#exhibitions h2', 'Exhibitions'], ['#objects h2', 'Objects'], ['#drawings h2', 'Drawings'],
    ['#zines .section-heading a', 'All zines'], ['#cyanotype .section-heading a', 'All prints'],
    ['#exhibitions .section-heading a', 'All exhibitions'], ['#objects .section-heading a', 'All objects'], ['#drawings .section-heading a', 'All drawings'],
    ['.static-menu p:first-of-type', 'Work in context'], ['.static-menu p:last-of-type', 'Work with material'],
    ...Object.entries({zines:'Printed editions',cyanotype:'Cyanotype',merch:'Merch',exhibitions:'Exhibitions',objects:'Objects',drawings:'Drawings'}).map(([key,label]) => ['.static-menu [data-target="'+key+'"]',label]),
  ].flatMap(([selector,en]) => [...document.querySelectorAll(selector)].map(node => ({node,ru:node.textContent,en})));
  const applyLocale = locale => {
    const english = locale === "en";
    translations.forEach(({node,ru,en}) => { node.textContent = english ? en : ru; });
  };
  document.addEventListener("cheshuya:locale", event => applyLocale(event.detail));
  applyLocale(window.CheshuyaLocale?.get() || "ru");
})();
