(() => {
  const exhibitions = [
    { id: 'polya-prisutstviya', title: 'Поля присутствия', year: '2026', description: 'ДНИ, Москва 2026', count: 30 },
    { id: 'uyazvimoe-mesto', title: 'Уязвимое место', year: '2026', description: 'KMSA, Kazan 2026', count: 12 },
    { id: 'portal', title: 'Portal', year: '2024', description: 'Оff-site show at Protvino, 2024', count: 13 },
    { id: 'black-show', title: 'Black show', year: '2024', description: 'Оff-site show at Protvino, 2024', count: 12 },
    { id: 'rusty-box', title: 'Rusty box', year: '2023', description: 'Оff-site show at Almaty, December 2023', count: 10, extension: 'png' },
    { id: 'sleepy-stupor', title: 'Sleeppy stupor', year: '2023', description: 'Оff-site show at Almaty, 2023', count: 8 },
    { id: 'deep-woods-cold-winters', title: 'Deep Woods Cold Winters', year: '2022', description: 'ISSMAG gallery, Moscow, 2022', count: 9 },
    { id: 'rekviem-po-zhek-artu', title: 'Реквием по ЖЭК-арту', year: '2022', description: 'VMDPNI, Moscow, 2022', count: 9, extension: 'jpg' },
  ];
  const exhibitionBase = (item, index = 1) => `new-site-assets/exhibitions/${item.id}/${String(index).padStart(2, '0')}`;
  window.cheshuyaExhibitions = exhibitions;
  window.cheshuyaExhibitionBase = exhibitionBase;

  const header = document.querySelector('.archive-header, .catalog-header, .zine-header');
  if (!header) return;
  const isHome = header.classList.contains('archive-header');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const behavior = () => motion.matches ? 'instant' : 'smooth';
  if (/iP(hone|ad|od)/.test(navigator.userAgent) && (/Telegram/i.test(navigator.userAgent) || /t\.me\//i.test(document.referrer))) {
    document.documentElement.classList.add('telegram-ios');
  }

  const readPreference = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const savePreference = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  const themeButton = document.createElement("button");
  themeButton.type = "button";
  themeButton.className = "theme-toggle";
  themeButton.innerHTML = "<svg class=\"theme-moon\" viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" aria-hidden=\"true\"><path d=\"M20.8 13A9 9 0 0 1 11 3.2 9 9 0 1 0 20.8 13Z\"/></svg><svg class=\"theme-sun\" viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4\"/></svg>";
  const controls = header.querySelector(".header-controls, .catalog-global-controls, .zine-global-controls");
  if (isHome) controls?.prepend(themeButton);
  const languageButton = header.querySelector(".language-button") || document.createElement("button");
  languageButton.type = "button";
  languageButton.className = "language-button";
  let locale = readPreference("cheshuya-locale") === "en" ? "en" : "ru";
  const savedTheme = readPreference("cheshuya-theme");
  let explicitTheme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : null;
  const systemTheme = matchMedia("(prefers-color-scheme: dark)");
  const syncThemeButton = () => {
    const dark = document.documentElement.dataset.theme === "dark";
    const label = locale === "en" ? (dark ? "Use light theme" : "Use dark theme") : (dark ? "Включить светлую тему" : "Включить тёмную тему");
    themeButton.setAttribute("aria-label", label);
    themeButton.setAttribute("title", label);
    themeButton.setAttribute("aria-pressed", String(dark));
  };
  const applyTheme = theme => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    syncThemeButton();
  };
  themeButton.addEventListener("click", () => {
    explicitTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    savePreference("cheshuya-theme", explicitTheme);
    applyTheme(explicitTheme);
  });
  systemTheme.addEventListener("change", () => { if (!explicitTheme) applyTheme(systemTheme.matches ? "dark" : "light"); });
  syncThemeButton();

  const burger = header.querySelector('.header-controls button:last-child, .catalog-burger, .zine-burger');
  header.querySelector('.catalog-language, .zine-language')?.remove();
  header.querySelector('.catalog-global-controls, .zine-global-controls')?.classList.add('inner-header-controls');
  if (!isHome) {
    const back = header.querySelector('.back-icon');
    const page = location.pathname;
    if (back) back.href = header.classList.contains('catalog-header')
      ? 'index.html#' + (page.includes('exhibitions') ? 'exhibitions' : page.includes('objects') ? 'objects' : page.includes('drawings') ? 'drawings' : 'zines')
      : page.endsWith('exhibition.html') ? 'catalog-exhibitions.html' : page.endsWith('cyanotype.html') ? 'index.html#cyanotype' : 'catalog-prints.html';
    const logo = document.createElement('a');
    logo.className = 'site-home-logo';
    logo.href = 'index.html';
    logo.setAttribute('aria-label', 'На главную');
    logo.innerHTML = '<img src="media/cheshuya-figma-logo.svg" width="30" height="30" alt="Чешуя">';
    header.prepend(logo);
  }
  if (burger) {
    const main = document.querySelector('main');
    const menu = document.createElement('nav');
    menu.id = 'site-menu';
    menu.className = isHome ? 'static-menu' : 'zine-menu';
    menu.hidden = true;
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-modal', 'true');
    menu.setAttribute('aria-label', 'Меню');
    const links = [
      ['zines', 'Печатные издания', 'catalog-prints.html'],
      ['cyanotype', 'Цианотипия', 'cyanotype.html'],
      ['merch', 'Мерч', 'index.html#merch'],
      ['exhibitions', 'Выставки', 'catalog-exhibitions.html'],
      ['objects', 'Объекты', 'catalog-objects.html'],
      ['drawings', 'Рисунки', 'catalog-drawings.html'],
    ];
    const closeClass = isHome ? 'static-menu-close' : 'zine-menu-close';
    menu.innerHTML = '<button type="button" class="' + closeClass + '" aria-label="Закрыть меню">×</button>';
    links.forEach(([target,label,href],index) => {
      if (index === 0 || index === 3) {
        const heading = document.createElement('p');
        heading.textContent = index === 0 ? 'Работа в среде' : 'Работа с материалом';
        menu.append(heading);
      }
      const item = document.createElement(isHome ? 'button' : 'a');
      item.dataset.target = target;
      item.textContent = label;
      if (isHome) item.type = 'button'; else item.href = href;
      menu.append(item);
    });
    const preferences = document.createElement("div");
    preferences.className = "menu-preferences";
    preferences.append(languageButton);
    menu.append(preferences);
    const englishLabels = { zines:"Printed editions", cyanotype:"Cyanotype", merch:"Merch", exhibitions:"Exhibitions", objects:"Objects", drawings:"Drawings" };
    const innerTranslations = [...menu.querySelectorAll("[data-target]")].map(node => ({ node, ru:node.textContent, en:englishLabels[node.dataset.target] }));
    [...menu.querySelectorAll("p")].forEach((node,index) => innerTranslations.push({ node, ru:node.textContent, en:index === 0 ? "Work in context" : "Work with material" }));
    const heading = document.querySelector(".catalog-page h1, .cyanotype-page h1");
    const headingNames = { "Печатные издания":"Printed editions", "Выставки":"Exhibitions", "Объекты":"Objects", "Рисунки":"Drawings", "Цианотипия":"Cyanotype" };
    if (heading && headingNames[heading.textContent]) innerTranslations.push({ node:heading, ru:heading.textContent, en:headingNames[heading.textContent] });
    const applyLocale = () => {
      document.documentElement.lang = locale;
      languageButton.textContent = locale === "ru" ? "En" : "Ru";
      languageButton.setAttribute("aria-label", locale === "ru" ? "Сменить язык" : "Switch language");
      if (!isHome) innerTranslations.forEach(({node,ru,en}) => { node.textContent = locale === "en" ? en : ru; });
      syncThemeButton();
      document.dispatchEvent(new CustomEvent("cheshuya:locale", { detail:locale }));
    };
    languageButton.addEventListener("click", () => {
      locale = locale === "ru" ? "en" : "ru";
      savePreference("cheshuya-locale", locale);
      applyLocale();
    });
    window.CheshuyaLocale = { get: () => locale };
    window.addEventListener("storage", event => {
      if (event.key === "cheshuya-locale" || event.key === null) {
        locale = readPreference("cheshuya-locale") === "en" ? "en" : "ru";
        applyLocale();
      }
      if (event.key === "cheshuya-theme" || event.key === null) {
        const stored = readPreference("cheshuya-theme");
        explicitTheme = stored === "light" || stored === "dark" ? stored : null;
        applyTheme(explicitTheme || (systemTheme.matches ? "dark" : "light"));
      }
    });
    applyLocale();
    const overlay = document.createElement('div');
    overlay.className = isHome ? 'static-menu-overlay' : 'zine-menu-overlay';
    overlay.hidden = true;
    document.body.append(overlay, menu);
    burger.setAttribute('aria-label', 'Открыть меню');
    burger.setAttribute('aria-controls', menu.id);
    burger.setAttribute('aria-expanded', 'false');
    let overflow = '';
    let closing = null;
    const finishClose = (after) => {
      menu.hidden = true;
      menu.classList.remove('is-closing');
      main.inert = false;
      document.body.style.overflow = overflow;
      burger.setAttribute('aria-expanded', 'false');
      burger.focus({ preventScroll: true });
      closing = null;
      if (typeof after === 'function') after();
    };
    const close = (after) => {
      if (menu.hidden || closing !== null) return;
      overlay.hidden = true;
      if (motion.matches) return finishClose(after);
      menu.classList.add('is-closing');
      closing = setTimeout(() => finishClose(after), 240);
    };
    burger.addEventListener('click', () => {
      if (!menu.hidden) return close();
      overflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      main.inert = true;
      menu.hidden = false;
      overlay.hidden = false;
      burger.setAttribute('aria-expanded', 'true');
      menu.querySelector('button').focus();
    });
    menu.querySelector('.' + closeClass).addEventListener('click', () => close());
    overlay.addEventListener('click', () => close());
    menu.querySelectorAll('[data-target]').forEach(item => item.addEventListener('click', event => {
      // Preserve native link behavior for a new tab or modified click.
      if (!isHome && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
      event.preventDefault();
      close(() => {
        if (isHome) window.CheshuyaHome?.openSection(item.dataset.target);
        else location.href = item.href;
      });
    }));
    document.addEventListener('keydown', event => {
      if (menu.hidden) return;
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key === 'Tab') {
        const focusable = [...menu.querySelectorAll('button, a[href]')];
        const first = focusable[0], last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
  }
  if (isHome) {
    const stage = document.querySelector('.logo-stage');
    const logo = stage?.querySelector('img');
    const controls = header.querySelector('.header-controls');
    if (!stage || !logo || !controls) return;
    let center = 0, startSize = 142, headerY = 34.5, frame = null, contentWidth = 83;
    const render = () => {
      frame = null;
      if (motion.matches) {
        logo.classList.remove('home-moving-logo');
        logo.classList.add('home-at-stage');
        controls.style.removeProperty('width');
        return;
      }
      const progress = Math.max(0, Math.min(1, scrollY / 135));
      const size = startSize + (37 - startSize) * progress;
      logo.setAttribute('aria-label', size >= 100 ? (locale === 'en' ? 'Hold to attract logo particles' : 'Зажмите, чтобы притянуть частицы') : (locale === 'en' ? 'Back to top' : 'Наверх'));
      logo.classList.remove('home-at-stage');
      logo.classList.add('home-moving-logo');
      logo.style.top = (center - scrollY + (headerY - center + scrollY) * progress) + 'px';
      logo.style.width = logo.style.height = size + 'px';
      controls.style.width = (83 + (contentWidth - 83) * progress) + 'px';
      controls.style.justifyContent = 'space-between';
      header.classList.toggle('is-compact', progress > .96);
    };
    const measure = () => {
      const rect = stage.getBoundingClientRect(), style = getComputedStyle(stage);
      const top = parseFloat(style.paddingTop) || 0, bottom = parseFloat(style.paddingBottom) || 0;
      center = rect.top + scrollY + top + (rect.height - top - bottom) / 2;
      startSize = matchMedia('(min-width:641px)').matches ? 162 : 142;
      const button = controls.querySelector('button').getBoundingClientRect();
      headerY = button.top + button.height / 2;
      contentWidth = Math.max(83, Math.min(640, innerWidth - 32));
      render();
    };
    addEventListener('scroll', () => { if (frame === null) frame = requestAnimationFrame(render); }, { passive: true });
    addEventListener('resize', measure);
    motion.addEventListener('change', measure);
    const top = () => scrollTo({ top: 0, behavior: behavior() });
    logo.tabIndex = 0;
    logo.setAttribute('role', 'button');
    logo.setAttribute('aria-label', 'Наверх');
    const activateLogo = () => { if (!window.CheshuyaLogo?.handles(logo)) top(); };
    logo.addEventListener('click', activateLogo);
    logo.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activateLogo(); } });
    logo.style.cursor = 'pointer';
    measure();
  }
})();
