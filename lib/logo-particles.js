/** Animate only the existing small fragments; the source image keeps its layout and scroll transforms. */
export function createLogoParticles(image, options = {}) {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const abort = new AbortController();
  let template = null, loading = null, layer = null, svg = null, particles = [];
  let frame = null, sequence = 0, disposed = false, savedStyle = null;
  let held = false, pointerId = null, heldKey = null, previousTime = 0;
  let scale = 0, scaleVelocity = 0;
  const eligible = () => !disposed && !motion.matches
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
    layer?.remove();
    layer = svg = null;
    particles = [];
    scale = scaleVelocity = previousTime = 0;
    restoreImage();
  };
  const release = () => {
    held = false;
    heldKey = null;
    const captured = pointerId;
    pointerId = null;
    if (captured !== null && image.hasPointerCapture?.(captured)) image.releasePointerCapture(captured);
  };
  const stop = () => { sequence++; release(); clear(); };
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
    if (!held && settled) {
      // Keep the same SVG surface at rest: swapping back to a rasterized <img>
      // here can change edge rendering and produce a visible final twitch.
      scale = scaleVelocity = previousTime = 0;
      svg.style.removeProperty("transform");
      particles.forEach(part => {
        part.progress = part.velocity = 0;
        part.path.style.removeProperty("transform");
      });
      return;
    }
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
    pointerId = event.pointerId;
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
    if (!layer || frame !== null) return;
    // The header updates its scroll geometry in the preceding animation frame callback.
    frame = requestAnimationFrame(time => {
      frame = null;
      if (!eligible()) { stop(); return; }
      if (held) { follow(time); return; }
      position();
    });
  };
  const blur = () => { release(); syncIdle(); };
  const prefetch = () => { syncIdle(); if (eligible()) load().catch(() => {}); };
  const reduce = () => { if (motion.matches) stop(); };
  const hidden = () => { if (document.hidden) stop(); };
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
  document.addEventListener("visibilitychange", hidden);
  window.addEventListener("pagehide", stop);
  return {
    hold, release, isInteractive: eligible, stop,
    destroy() {
      disposed = true;
      stop();
      abort.abort();
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
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", stop);
    },
  };
}
