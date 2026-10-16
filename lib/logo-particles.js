/** Animate only the existing small fragments; the source image keeps its layout and scroll transforms. */
export function createLogoParticles(image, options = {}) {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const abort = new AbortController();
  let template = null, loading = null, layer = null, svg = null, particles = [];
  let frame = null, sequence = 0, disposed = false, savedStyle = null;
  let held = false, pointerId = null, heldKey = null, previousTime = 0;
  let scale = 0, scaleVelocity = 0, layoutFrame = null;
  let insets = { left: 0, top: 0, right: 0, bottom: 0 };
  const hitArea = document.createElement("span");
  hitArea.className = "logo-hit-area";
  hitArea.setAttribute("aria-hidden", "true");
  hitArea.style.cssText = "display:none;position:fixed;z-index:33;cursor:pointer;touch-action:pan-y;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none";
  (image.parentElement || document.body).append(hitArea);
  const eligible = () => !disposed && !motion.matches
    && image.isConnected && image.getBoundingClientRect().width >= 100 && (options.canPlay?.() ?? true);
  const positionHitArea = () => {
    const rect = image.getBoundingClientRect();
    if (!eligible() || rect.bottom <= 0 || rect.top >= innerHeight) {
      hitArea.style.display = "none";
      return;
    }
    const stage = image.closest(".logo-stage")?.getBoundingClientRect();
    const top = Math.max(0, stage?.top ?? 0, rect.top - 10);
    const bottom = Math.min(innerHeight, stage?.bottom ?? innerHeight, rect.bottom + 10);
    Object.assign(hitArea.style, { display: bottom > top ? "block" : "none",
      left: Math.max(0, rect.left - 10) + "px", top: top + "px",
      width: Math.min(innerWidth, rect.right + 10) - Math.max(0, rect.left - 10) + "px",
      height: Math.max(0, bottom - top) + "px" });
  };
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
    layer?.remove();
    layer = svg = null;
    particles = [];
    scale = scaleVelocity = previousTime = 0;
    restoreImage();
  };
  const release = () => {
    const wasHeld = held;
    held = false;
    heldKey = null;
    const captured = pointerId;
    pointerId = null;
    if (captured !== null && image.hasPointerCapture?.(captured)) image.releasePointerCapture(captured);
    if (wasHeld && layer && frame === null) frame = requestAnimationFrame(follow);
  };
  const stop = () => { sequence++; release(); clear(); positionHitArea(); };
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
  const appearance = () => {
    if (!layer || !svg) return;
    svg.style.filter = getComputedStyle(image).filter;
    layer.style.outline = image.matches(":focus-visible") ? "2px solid var(--text)" : "none";
  };
  const position = () => {
    if (!layer || !svg) return;
    const rect = image.getBoundingClientRect();
    // The original image has invisible padding for its header hit target.
    // Match its content box, so the animated SVG has exactly the same visible size.
    Object.assign(layer.style, { left: rect.left + insets.left + "px", top: rect.top + insets.top + "px", width: rect.width - insets.left - insets.right + "px", height: rect.height - insets.top - insets.bottom + "px" });
  };
  // A critically damped spring keeps both position and velocity when a hold is reversed.
  const advance = (value, velocity, target, speed, dt) => {
    const offset = value - target, change = velocity + speed * offset;
    const decay = Math.exp(-speed * dt);
    return [target + (offset + change * dt) * decay, (velocity - speed * change * dt) * decay];
  };
  const follow = time => {
    frame = null;
    if (!eligible()) { stop(); return; }
    const dt = previousTime ? Math.max((time - previousTime) / 1000, 0) : 0;
    previousTime = time;
    const target = held ? 1 : 0;
    [scale, scaleVelocity] = advance(scale, scaleVelocity, target, 6, dt);
    svg.style.transform = `scale(${1 + .018 * scale})`;
    let settled = Math.abs(scale - target) < .0002 && Math.abs(scaleVelocity) < .001;
    particles.forEach((part, index) => {
      [part.progress, part.velocity] = advance(part.progress, part.velocity, target, (held ? 4.5 : 5.5) + index * .12, dt);
      const progress = part.progress, turn = index % 2 ? 1 : -1;
      part.path.style.transform = `translate(${(104.414 - part.x) * progress}px,${(183 - part.y) * progress}px) rotate(${turn * 7 * progress}deg) scale(${1 - .28 * progress})`;
      settled = settled && Math.abs(progress - target) < .0002 && Math.abs(part.velocity) < .001;
    });
    position();
    if (settled) {
      // Keep the same SVG surface at rest: swapping back to a rasterized <img>
      // here can change edge rendering and produce a visible final twitch.
      scale = target;
      scaleVelocity = previousTime = 0;
      if (!held) svg.style.removeProperty("transform");
      particles.forEach(part => {
        part.progress = target;
        part.velocity = 0;
        if (!held) part.path.style.removeProperty("transform");
      });
      return;
    }
    frame = requestAnimationFrame(follow);
  };
  const mount = original => {
    const style = getComputedStyle(image);
    const inset = (padding, border) => (parseFloat(padding) || 0) + (parseFloat(border) || 0);
    insets = {
      left: inset(style.paddingLeft, style.borderLeftWidth), top: inset(style.paddingTop, style.borderTopWidth),
      right: inset(style.paddingRight, style.borderRightWidth), bottom: inset(style.paddingBottom, style.borderBottomWidth),
    };
    layer = document.createElement("div");
    layer.className = "logo-particles-layer";
    layer.setAttribute("aria-hidden", "true");
    layer.style.cssText = "position:fixed;z-index:32;pointer-events:none;outline-offset:5px";
    svg = original.cloneNode(true);
    layer.append(svg);
    document.body.append(layer);
    particles = [...svg.querySelectorAll("path")].map(path => {
      const box = path.getBBox();
      return { path, x: box.x + box.width / 2, y: box.y + box.height / 2, width: box.width, height: box.height, progress: 0, velocity: 0 };
    }).filter(part => part.width < 15 && part.height < 15);
    particles.forEach(({ path }) => {
      path.style.transformBox = "fill-box";
      path.style.transformOrigin = "center";
    });
    svg.style.transformOrigin = "center";
    if (!particles.length) { clear(); return false; }
    savedStyle = {
      opacity: image.style.getPropertyValue("opacity"), opacityPriority: image.style.getPropertyPriority("opacity"),
      transition: image.style.getPropertyValue("transition-property"), transitionPriority: image.style.getPropertyPriority("transition-property"),
    };
    image.style.setProperty("transition-property", "transform", "important");
    image.style.setProperty("opacity", "0", "important");
    position();
    appearance();
    return true;
  };
  const hold = () => {
    if (!eligible()) return false;
    held = true;
    const request = sequence;
    load().then(original => {
      if (request !== sequence || !held || !eligible()) return;
      if (!layer && !mount(original)) return;
      if (frame === null) frame = requestAnimationFrame(follow);
    }).catch(() => { if (request === sequence) stop(); });
    return true;
  };
  const pointerDown = event => {
    if (!event.isPrimary || event.button !== 0 || pointerId !== null || !hold()) return;
    // Keep focus on the accessible image when pressing its invisible extension.
    // Vertical touch scrolling remains controlled by touch-action: pan-y.
    event.preventDefault();
    pointerId = event.pointerId;
    image.focus({ preventScroll: true });
    image.setPointerCapture?.(pointerId);
  };
  const pointerEnd = event => { if (event.pointerId === pointerId) release(); };
  const keyDown = event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (!eligible()) return;
    event.preventDefault();
    if (!event.repeat && heldKey === null && hold()) heldKey = event.key;
  };
  const keyUp = event => { if (event.key === heldKey) { event.preventDefault(); release(); } };
  const preventNative = event => { if (eligible()) event.preventDefault(); };
  const syncIdle = () => {
    if (disposed || layoutFrame !== null) return;
    layoutFrame = requestAnimationFrame(() => {
      layoutFrame = null;
      positionHitArea();
      if (!layer) return;
      if (!eligible()) { stop(); return; }
      position();
      appearance();
    });
  };
  const themeObserver = new MutationObserver(syncIdle);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const blur = () => { release(); syncIdle(); };
  const prefetch = () => { syncIdle(); if (eligible()) load().catch(() => {}); };
  const reduce = () => { if (motion.matches) stop(); };
  const hidden = () => { if (document.hidden) stop(); };
  hitArea.addEventListener("pointerdown", pointerDown);
  hitArea.addEventListener("pointerenter", prefetch);
  hitArea.addEventListener("contextmenu", preventNative);
  image.addEventListener("pointerdown", pointerDown);
  window.addEventListener("pointerup", pointerEnd);
  window.addEventListener("pointercancel", pointerEnd);
  image.addEventListener("lostpointercapture", pointerEnd);
  image.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  image.addEventListener("blur", blur);
  window.addEventListener("scroll", syncIdle, { passive: true });
  window.addEventListener("resize", syncIdle);
  image.addEventListener("dragstart", preventNative);
  image.addEventListener("contextmenu", preventNative);
  window.addEventListener("blur", stop);
  image.addEventListener("pointerenter", prefetch);
  image.addEventListener("focus", prefetch);
  motion.addEventListener("change", reduce);
  motion.addEventListener("change", syncIdle);
  document.addEventListener("visibilitychange", hidden);
  window.addEventListener("pagehide", stop);
  syncIdle();
  return {
    hold, release, isInteractive: eligible, stop,
    destroy() {
      disposed = true;
      stop();
      abort.abort();
      themeObserver.disconnect();
      if (layoutFrame !== null) cancelAnimationFrame(layoutFrame);
      hitArea.remove();
      image.removeEventListener("pointerdown", pointerDown);
      window.removeEventListener("pointerup", pointerEnd);
      window.removeEventListener("pointercancel", pointerEnd);
      image.removeEventListener("lostpointercapture", pointerEnd);
      image.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      image.removeEventListener("blur", blur);
      window.removeEventListener("scroll", syncIdle);
      window.removeEventListener("resize", syncIdle);
      image.removeEventListener("dragstart", preventNative);
      image.removeEventListener("contextmenu", preventNative);
      window.removeEventListener("blur", stop);
      image.removeEventListener("pointerenter", prefetch);
      image.removeEventListener("focus", prefetch);
      motion.removeEventListener("change", reduce);
      motion.removeEventListener("change", syncIdle);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", stop);
    },
  };
}
