// Shared with lib/carousel-controller.ts. Keep the two implementations in sync.
(() => {
// Shared carousel behaviour for React and the static GitHub Pages site.
// The browser owns touch scrolling; arrow animations temporarily suspend snap.
function createCardCarousel(viewport) {
  let frame = null;
  let restoreFrame = null;
  let target = null;
  let velocity = 0;
  let position = viewport.scrollLeft;
  let lastTime = 0;
  let stops = [];
  let width = viewport.clientWidth;
  let pointer = null;
  let suppressClick = false;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const measure = () => {
    const left = viewport.getBoundingClientRect().left + viewport.clientLeft;
    const padding = parseFloat(getComputedStyle(viewport).scrollPaddingLeft) || 0;
    const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    return Array.from(viewport.children, child => Math.max(0, Math.min(max,
      child.getBoundingClientRect().left - left + viewport.scrollLeft - padding,
    )));
  };
  const stop = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    if (restoreFrame !== null) cancelAnimationFrame(restoreFrame);
    frame = restoreFrame = target = null;
    velocity = lastTime = 0;
    viewport.removeAttribute("data-animating");
  };
  const restoreSnap = () => {
    restoreFrame = requestAnimationFrame(() => {
      restoreFrame = null;
      viewport.removeAttribute("data-animating");
    });
  };
  const animate = (now) => {
    if (target === null) return;
    const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.064) : 1 / 60;
    lastTime = now;
    // Critically damped motion: retarget without resetting velocity on each click.
    const omega = 28;
    const offset = position - target;
    const term = (velocity + omega * offset) * dt;
    const decay = Math.exp(-omega * dt);
    velocity = (velocity - omega * term) * decay;
    const next = target + (offset + term) * decay;
    position = next;
    viewport.scrollLeft = next;
    if (Math.abs(next - target) < 0.75 && Math.abs(velocity) < 8) {
      viewport.scrollLeft = target;
      frame = target = null;
      velocity = lastTime = 0;
      restoreSnap();
    } else frame = requestAnimationFrame(animate);
  };
  const goTo = (destination) => {
    if (restoreFrame !== null) cancelAnimationFrame(restoreFrame);
    restoreFrame = null;
    if (frame === null) { lastTime = 0; position = viewport.scrollLeft; }
    target = destination;
    viewport.setAttribute("data-animating", "");
    if (motion.matches) {
      viewport.scrollLeft = destination;
      stop();
    } else if (frame === null) frame = requestAnimationFrame(animate);
  };
  const move = (direction) => {
    stops = measure();
    const anchor = target ?? viewport.scrollLeft;
    const ordered = direction > 0 ? stops : [...stops].reverse();
    const next = ordered.find(position => direction * (position - anchor) > 1);
    if (next !== undefined) goTo(next);
  };
  const nearestIndex = (positions, anchor) =>
    positions.reduce((nearest, position, index) =>
      Math.abs(position - anchor) < Math.abs(positions[nearest] - anchor) ? index : nearest, 0);
  const refresh = () => {
    if (!viewport.clientWidth) return;
    const next = measure();
    if (width === viewport.clientWidth && next.length === stops.length &&
        next.every((position, index) => Math.abs(position - stops[index]) < 1)) return;
    const index = nearestIndex(stops, target ?? viewport.scrollLeft);
    stop();
    pointer = null;
    viewport.removeAttribute("data-dragging");
    stops = next;
    width = viewport.clientWidth;
    if (stops.length) {
      viewport.setAttribute("data-animating", "");
      viewport.scrollLeft = stops[Math.min(index, stops.length - 1)];
      restoreSnap();
    }
  };
  const observer = new ResizeObserver(refresh);
  const observeCards = () => {
    observer.disconnect();
    observer.observe(viewport);
    Array.from(viewport.children).forEach(child => observer.observe(child));
    refresh();
  };
  const mutation = new MutationObserver(observeCards);
  mutation.observe(viewport, { childList: true });
  stops = measure();
  observeCards();
  const onPointerDown = (event) => {
    stop();
    if (event.pointerType === "mouse" && event.button === 0)
      pointer = { id: event.pointerId, x: event.clientX, scroll: viewport.scrollLeft, dragging: false };
  };
  const onPointerMove = (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const delta = event.clientX - pointer.x;
    if (!pointer.dragging && Math.abs(delta) < 5) return;
    pointer.dragging = true;
    viewport.setPointerCapture(event.pointerId);
    viewport.setAttribute("data-dragging", "");
    viewport.scrollLeft = pointer.scroll - delta;
  };
  const onPointerUp = (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dragged = pointer.dragging;
    if (dragged) viewport.setAttribute("data-animating", "");
    pointer = null;
    viewport.removeAttribute("data-dragging");
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    if (dragged) {
      suppressClick = true;
      window.setTimeout(() => { suppressClick = false; }, 0);
      stops = measure();
      if (stops.length) goTo(stops[nearestIndex(stops, viewport.scrollLeft)]);
    }
  };
  const onClick = (event) => {
    if (suppressClick) { event.preventDefault(); event.stopImmediatePropagation(); }
  };
  const onKey = (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    move(event.key === "ArrowLeft" ? -1 : 1);
  };
  const onMotion = () => {
    if (motion.matches && target !== null) { viewport.scrollLeft = target; stop(); }
  };
  const onDrag = (event) => event.preventDefault();
  viewport.addEventListener("pointerdown", onPointerDown, { passive: true });
  viewport.addEventListener("pointermove", onPointerMove, { passive: true });
  viewport.addEventListener("pointerup", onPointerUp);
  viewport.addEventListener("pointercancel", onPointerUp);
  viewport.addEventListener("lostpointercapture", onPointerUp);
  viewport.addEventListener("touchstart", stop, { passive: true });
  viewport.addEventListener("wheel", stop, { passive: true });
  viewport.addEventListener("keydown", onKey);
  viewport.addEventListener("click", onClick, true);
  viewport.addEventListener("dragstart", onDrag);
  motion.addEventListener("change", onMotion);
  return {
    move, refresh,
    destroy() {
      observer.disconnect();
      mutation.disconnect();
      stop();
      viewport.removeAttribute("data-dragging");
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", onPointerUp);
      viewport.removeEventListener("pointercancel", onPointerUp);
      viewport.removeEventListener("lostpointercapture", onPointerUp);
      viewport.removeEventListener("touchstart", stop);
      viewport.removeEventListener("wheel", stop);
      viewport.removeEventListener("keydown", onKey);
      viewport.removeEventListener("click", onClick, true);
      viewport.removeEventListener("dragstart", onDrag);
      motion.removeEventListener("change", onMotion);
    },
  };
}

// All photos share one fixed stage. Decode the requested photo before fading it in.
function createImageGallery(stage, onChange = () => {}) {
  const photos = Array.from(stage.querySelectorAll("img"));
  const carousel = stage.parentElement || stage;
  let requested = 0;
  let version = 0;
  let pointer = null;
  photos.forEach((photo, index) => {
    photo.draggable = false;
    photo.dataset.active = String(index === 0);
    photo.setAttribute("aria-hidden", String(index !== 0));
  });
  const loadPhoto = (photo) => {
    if (photo.dataset.gallerySrc && !photo.dataset.galleryLoaded) {
      photo.dataset.galleryLoaded = "true";
      photo.sizes = "(max-width: 700px) 100vw, 600px";
      if (photo.dataset.gallerySrcset) photo.srcset = photo.dataset.gallerySrcset;
      photo.src = photo.dataset.gallerySrc;
    }
    photo.loading = "eager";
  };
  const show = (index) => {
    if (!photos.length) return;
    requested = (index + photos.length) % photos.length;
    const current = requested;
    const ticket = ++version;
    const image = photos[current];
    loadPhoto(image);
    stage.setAttribute("aria-busy", "true");
    const reveal = () => {
      if (ticket !== version) return;
      stage.setAttribute("aria-busy", "false");
      if (!image.naturalWidth) return;
      photos.forEach((photo, photoIndex) => {
        photo.dataset.active = String(photoIndex === current);
        photo.setAttribute("aria-hidden", String(photoIndex !== current));
      });
      onChange(current);
      // Warm just the next photo instead of downloading an entire long gallery.
      const next = photos[(current + 1) % photos.length];
      if (next) loadPhoto(next);
    };
    image.decode().then(reveal, reveal);
  };
  const move = (direction) => show(requested + direction);
  const onKey = (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    move(event.key === "ArrowLeft" ? -1 : 1);
  };
  const onDown = (event) => {
    if (event.pointerType === "mouse" || !event.isPrimary) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    stage.setPointerCapture(event.pointerId);
  };
  const onUp = (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
    pointer = null;
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? -1 : 1);
  };
  const reset = () => { pointer = null; };
  carousel.addEventListener("keydown", onKey);
  stage.addEventListener("pointerdown", onDown, { passive: true });
  stage.addEventListener("pointerup", onUp);
  stage.addEventListener("pointercancel", reset);
  stage.addEventListener("lostpointercapture", reset);
  show(0);
  return {
    move, show,
    destroy() {
      version++;
      carousel.removeEventListener("keydown", onKey);
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointerup", onUp);
      stage.removeEventListener("pointercancel", reset);
      stage.removeEventListener("lostpointercapture", reset);
    },
  };
}


function mountImageGallery(stage, sources, onChange) {
  if (!stage || !sources.length) return null;
  const original = stage.querySelector("img");
  const photos = sources.map((source, index) => {
    const image = index === 0 && original ? original : document.createElement("img");
    const src = typeof source === "string" ? source : source.src;
    let srcset = typeof source === "string" ? "" : source.srcset || "";
    if (!srcset && src.startsWith("media/")) {
      const name = decodeURIComponent(src.slice(6)).replace(/\.[^.]+$/, "").split("/").map(encodeURIComponent).join("/");
      srcset = [600, 1200, 2000].map(width => `images/${name}-${width}.webp ${width}w`).join(", ");
    }
    image.className = "zine-photo";
    image.alt = original?.alt || "Работа Чешуи";
    image.dataset.responsive = "true";
    image.dataset.gallerySrc = src;
    image.dataset.gallerySrcset = srcset;
    return image;
  });
  stage.replaceChildren(...photos);
  return createImageGallery(stage, onChange);
}

window.CheshuyaCarousel = { createCardCarousel, createImageGallery, mountImageGallery };
})();
