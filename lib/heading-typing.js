// Character reveals preserve the full heading's layout and accessible name.
export function mountHeadingTyping(root) {
  if (!root) return () => {};
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const played = new Set();
  const records = new Map();
  const keyFor = heading => {
    const section = heading.closest("section[id], .street-feature, .inside-intro");
    return (section?.id || section?.className || heading.parentElement?.id || "home") + ":" + heading.tagName;
  };
  const restore = (heading, record) => {
    clearTimeout(record.timer);
    if (record.visual?.parentNode === heading) heading.textContent = record.text;
    if (record.label === null) heading.removeAttribute("aria-label");
    else heading.setAttribute("aria-label", record.label);
    heading.classList.remove("heading-type-pending", "heading-type-running");
    record.visual = null;
  };
  const finish = (heading, record) => {
    played.add(record.key);
    restore(heading, record);
    observer.unobserve(heading);
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const heading = entry.target, record = records.get(heading);
      if (!record || played.has(record.key)) { observer.unobserve(heading); continue; }
      played.add(record.key);
      if (motion.matches || !record.visual) { finish(heading, record); continue; }
      heading.classList.remove("heading-type-pending");
      heading.classList.add("heading-type-running");
      record.visual.addEventListener("animationend", event => {
        if (event.target === record.visual?.lastElementChild) finish(heading, record);
      });
      record.timer = setTimeout(() => finish(heading, record), record.duration + 150);
    }
  }, { threshold: 0.15 });
  const scan = () => {
    for (const [heading, record] of records) {
      if (!root.contains(heading)) { observer.unobserve(heading); restore(heading, record); records.delete(heading); }
    }
    for (const heading of root.querySelectorAll("h1, h2")) {
      const previous = records.get(heading);
      const text = heading.textContent || "";
      if (previous?.text === text) continue;
      if (previous) restore(heading, previous);
      const key = keyFor(heading);
      const record = { key, text, label: heading.getAttribute("aria-label"), visual: null, timer: null, duration: 0 };
      records.set(heading, record);
      if (!text.trim() || motion.matches || played.has(key)) {
        if (motion.matches) played.add(key);
        continue;
      }
      const letters = Array.from(text);
      const step = Math.min(45, Math.max(18, 700 / letters.length));
      const visual = document.createElement("span");
      visual.setAttribute("aria-hidden", "true");
      visual.className = "heading-type-visual";
      visual.style.setProperty("--typing-step", step + "ms");
      letters.forEach((letter, index) => {
        const span = document.createElement("span");
        span.className = "heading-type-char";
        span.style.setProperty("--letter-index", String(index));
        span.textContent = letter;
        visual.append(span);
      });
      record.visual = visual;
      record.duration = (letters.length - 1) * step + 1;
      heading.setAttribute("aria-label", text);
      heading.classList.add("heading-type-pending");
      heading.replaceChildren(visual);
      observer.observe(heading);
    }
  };
  const changes = new MutationObserver(scan);
  scan();
  changes.observe(root, { childList: true, subtree: true, characterData: true });
  const reduce = () => {
    if (motion.matches) for (const [heading, record] of records) finish(heading, record);
  };
  motion.addEventListener("change", reduce);
  return () => {
    changes.disconnect();
    observer.disconnect();
    motion.removeEventListener("change", reduce);
    for (const [heading, record] of records) restore(heading, record);
    records.clear();
  };
}
