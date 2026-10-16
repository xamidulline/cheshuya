/** Animate only the existing small fragments; the source image keeps its layout and scroll transforms. */
export function createLogoParticles(image, options = {}) {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const abort = new AbortController();
  let template = null, loading = null, layer = null, svg = null, particles = [];
  let animations = [], frame = null, sequence = 0, disposed = false, savedStyle = null;
  const eligible = () => !disposed && !motion.matches && typeof image.animate === "function"
    && image.isConnected && image.getBoundingClientRect().width >= 100 && (options.canPlay?.() ?? true);
  const restoreImage = () => {
    if (!savedStyle) return;
    const { opacity, opacityPriority, transition, transitionPriority } = savedStyle;
    if (opacity) image.style.setProperty("opacity", opacity, opacityPriority); else image.style.removeProperty("opacity");
    // Flush the restored opacity while opacity transitions are suspended to avoid a closing flash.
    image.getBoundingClientRect();
    if (transition) image.style.setProperty("transition-property", transition, transitionPriority);
    else image.style.removeProperty("transition-property");
    savedStyle = null;
  };
  const clear = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    animations.forEach(animation => animation.cancel());
    animations = [];
    layer?.remove();
    layer = svg = null;
    particles = [];
    restoreImage();
  };
  const stop = () => { sequence++; clear(); };
  const load = () => {
    if (template) return Promise.resolve(template);
    if (!loading) {
      const url = options.assetUrl || image.currentSrc || image.src;
      loading = fetch(url, { signal: abort.signal, cache: "force-cache" }).then(response => {
        if (!response.ok) throw new Error("Logo unavailable");
        return response.text();
      }).then(markup => {
        const documentSvg = new DOMParser().parseFromString(markup, "image/svg+xml");
        const original = documentSvg.querySelector("svg");
        if (!original || documentSvg.querySelector("parsererror")) throw new Error("Invalid logo");
        const clean = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        clean.setAttribute("viewBox", original.getAttribute("viewBox") || "0 0 208.828 282.016");
        clean.setAttribute("preserveAspectRatio", "xMidYMid meet");
        clean.setAttribute("aria-hidden", "true");
        clean.style.cssText = "display:block;width:100%;height:100%;overflow:visible";
        original.querySelectorAll("path").forEach(path => {
          const copy = document.createElementNS("http://www.w3.org/2000/svg", "path");
          copy.setAttribute("d", path.getAttribute("d") || "");
          copy.setAttribute("fill", path.getAttribute("fill") || "black");
          clean.append(copy);
        });
        template = clean;
        return clean;
      }).catch(error => { loading = null; throw error; });
    }
    return loading;
  };
  const position = () => {
    if (!layer || !svg) return;
    const rect = image.getBoundingClientRect();
    Object.assign(layer.style, { left: rect.left + "px", top: rect.top + "px", width: rect.width + "px", height: rect.height + "px" });
    svg.style.filter = getComputedStyle(image).filter;
    layer.style.outline = image.matches(":focus-visible") ? "2px solid var(--text)" : "none";
  };
  const follow = () => {
    frame = null;
    if (!eligible()) { stop(); return; }
    position();
    frame = requestAnimationFrame(follow);
  };
  const mount = original => {
    layer = document.createElement("div");
    layer.className = "logo-particles-layer";
    layer.setAttribute("aria-hidden", "true");
    layer.style.cssText = "position:fixed;z-index:32;pointer-events:none;outline-offset:5px";
    svg = original.cloneNode(true);
    layer.append(svg);
    document.body.append(layer);
    particles = [...svg.querySelectorAll("path")].map(path => {
      const box = path.getBBox();
      return { path, x: box.x + box.width / 2, y: box.y + box.height / 2, width: box.width, height: box.height };
    }).filter(part => part.width < 15 && part.height < 15);
    if (!particles.length) { clear(); return false; }
    savedStyle = {
      opacity: image.style.getPropertyValue("opacity"), opacityPriority: image.style.getPropertyPriority("opacity"),
      transition: image.style.getPropertyValue("transition-property"), transitionPriority: image.style.getPropertyPriority("transition-property"),
    };
    image.style.setProperty("transition-property", "transform", "important");
    image.style.setProperty("opacity", "0", "important");
    position();
    return true;
  };
  const play = () => {
    if (!eligible()) return false;
    const request = ++sequence;
    load().then(original => {
      if (request !== sequence || !eligible()) return;
      if (!layer && !mount(original)) return;
      const current = particles.map(({ path }) => getComputedStyle(path).transform);
      animations.forEach(animation => animation.cancel());
      animations = particles.map(({ path, x, y }, index) => {
        const dx = 104.414 - x, dy = 183 - y, turn = index % 2 ? 1 : -1;
        path.style.transformBox = "fill-box";
        path.style.transformOrigin = "center";
        return path.animate([
          { transform: current[index] === "none" ? "translate(0px,0px) scale(1)" : current[index], offset: 0, easing: "cubic-bezier(.2,.7,.2,1)" },
          { transform: `translate(${-dx * .06}px,${-dy * .06}px) rotate(${turn * -4}deg) scale(1.06)`, offset: .14, easing: "cubic-bezier(.3,0,.15,1)" },
          { transform: `translate(${dx * .96}px,${dy * .96}px) rotate(${turn * 13}deg) scale(.72)`, offset: .53, easing: "ease-out" },
          { transform: `translate(${dx}px,${dy}px) rotate(${turn * 7}deg) scale(.72)`, offset: .68, easing: "cubic-bezier(.15,.8,.25,1)" },
          { transform: "translate(0px,0px) rotate(0deg) scale(1)", offset: 1 },
        ], { duration: 1250, delay: index * 18, fill: "both" });
      });
      if (frame === null) frame = requestAnimationFrame(follow);
      Promise.all(animations.map(animation => animation.finished.catch(() => {}))).then(() => {
        if (request === sequence) clear();
      });
    }).catch(() => { if (request === sequence) clear(); });
    return true;
  };
  const prefetch = () => { if (eligible()) load().catch(() => {}); };
  const reduce = () => { if (motion.matches) stop(); };
  const hidden = () => { if (document.hidden) stop(); };
  image.addEventListener("pointerenter", prefetch);
  image.addEventListener("focus", prefetch);
  motion.addEventListener("change", reduce);
  document.addEventListener("visibilitychange", hidden);
  window.addEventListener("pagehide", stop);
  return {
    play, stop,
    destroy() {
      disposed = true;
      stop();
      abort.abort();
      image.removeEventListener("pointerenter", prefetch);
      image.removeEventListener("focus", prefetch);
      motion.removeEventListener("change", reduce);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", stop);
    },
  };
}
