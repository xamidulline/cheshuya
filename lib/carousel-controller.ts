// Shared carousel behaviour for React and the static GitHub Pages site.
// The browser owns touch scrolling; arrow animations temporarily suspend snap.
export function createCardCarousel(viewport: HTMLElement) {
  let frame: number | null = null;
  let restoreFrame: number | null = null;
  let target: number | null = null;
  let velocity = 0;
  let position = viewport.scrollLeft;
  let lastTime = 0;
  let stops: number[] = [];
  let width = viewport.clientWidth;
  let lastScroll = viewport.scrollLeft;
  let pointer: { id: number; x: number; scroll: number; dragging: boolean } | null = null;
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
    if (width === viewport.clientWidth) lastScroll = viewport.scrollLeft;
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
  const animate = (now: number) => {
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
    lastScroll = viewport.scrollLeft;
    if (Math.abs(next - target) < 0.75 && Math.abs(velocity) < 8) {
      viewport.scrollLeft = target;
      lastScroll = viewport.scrollLeft;
      frame = target = null;
      velocity = lastTime = 0;
      restoreSnap();
    } else frame = requestAnimationFrame(animate);
  };
  const goTo = (destination: number) => {
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
  const move = (direction: -1 | 1) => {
    stops = measure();
    const anchor = target ?? viewport.scrollLeft;
    const ordered = direction > 0 ? stops : [...stops].reverse();
    const next = ordered.find(position => direction * (position - anchor) > 1);
    if (next !== undefined) goTo(next);
  };
  const nearestIndex = (positions: number[], anchor: number) =>
    positions.reduce((nearest, position, index) =>
      Math.abs(position - anchor) < Math.abs(positions[nearest] - anchor) ? index : nearest, 0);
  const refresh = () => {
    if (!viewport.clientWidth) return;
    const next = measure();
    if (width === viewport.clientWidth && next.length === stops.length &&
        next.every((position, index) => Math.abs(position - stops[index]) < 1)) return;
    // Browsers may re-snap before ResizeObserver runs. Keep the old geometry anchor.
    const index = nearestIndex(stops, target ?? lastScroll);
    stop();
    pointer = null;
    viewport.removeAttribute("data-dragging");
    stops = next;
    width = viewport.clientWidth;
    if (stops.length) {
      viewport.setAttribute("data-animating", "");
      viewport.scrollLeft = stops[Math.min(index, stops.length - 1)];
      lastScroll = viewport.scrollLeft;
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
  const onPointerDown = (event: PointerEvent) => {
    stop();
    if (event.pointerType === "mouse" && event.button === 0)
      pointer = { id: event.pointerId, x: event.clientX, scroll: viewport.scrollLeft, dragging: false };
  };
  const onPointerMove = (event: PointerEvent) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const delta = event.clientX - pointer.x;
    if (!pointer.dragging && Math.abs(delta) < 5) return;
    pointer.dragging = true;
    viewport.setPointerCapture(event.pointerId);
    viewport.setAttribute("data-dragging", "");
    viewport.scrollLeft = pointer.scroll - delta;
  };
  const onPointerUp = (event: PointerEvent) => {
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
  const onClick = (event: MouseEvent) => {
    if (suppressClick) { event.preventDefault(); event.stopImmediatePropagation(); }
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    move(event.key === "ArrowLeft" ? -1 : 1);
  };
  const onMotion = () => {
    if (motion.matches && target !== null) { viewport.scrollLeft = target; stop(); }
  };
  const onDrag = (event: DragEvent) => event.preventDefault();
  const rememberScroll = () => {
    if (width === viewport.clientWidth) lastScroll = viewport.scrollLeft;
  };
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
  viewport.addEventListener("scroll", rememberScroll, { passive: true });
  motion.addEventListener("change", onMotion);
  return {
    move, refresh,
    goToIndex(index: number) {
      stops = measure();
      const destination = stops[Math.max(0, Math.min(stops.length - 1, index))];
      if (destination !== undefined) goTo(destination);
    },
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
      viewport.removeEventListener("scroll", rememberScroll);
      motion.removeEventListener("change", onMotion);
    },
  };
}

// Detail galleries use the same measured horizontal rail as the home page.
export function createImageGallery(stage: HTMLElement, onChange: (index: number) => void = () => {}) {
  stage.tabIndex = 0;
  stage.setAttribute("aria-label", "Фотографии работ");
  const photos = Array.from(stage.querySelectorAll("img"));
  const carousel = stage.parentElement || stage;
  const controller = createCardCarousel(stage);
  let requested = 0;
  let version = 0;
  let pending = false;
  let syncFrame: number | null = null;
  const loadPhoto = (photo: HTMLImageElement) => {
    if (photo.dataset.gallerySrc && !photo.dataset.galleryLoaded) {
      photo.dataset.galleryLoaded = "true";
      photo.sizes = "(max-width: 700px) calc(100vw - 32px), (max-width: 1112px) calc((100vw - 52px) / 2), 530px";
      if (photo.dataset.gallerySrcset) photo.srcset = photo.dataset.gallerySrcset;
      if (photo.getAttribute('src') !== photo.dataset.gallerySrc) photo.src = photo.dataset.gallerySrc;
    }
    photo.decoding = "async";
    photo.loading = "eager";
  };
  let preloadVersion = 0;
  const prepare = (index: number) => {
    const photo = photos[index];
    if (!photo) return;
    photo.fetchPriority = "high";
    loadPhoto(photo);
    const ticket = ++preloadVersion;
    // The visible image gets the connection first; then warm its two neighbours.
    photo.decode().catch(() => {}).then(() => {
      if (ticket !== preloadVersion) return;
      for (const candidate of [index - 1, index + 1]) {
        if (photos[candidate]) {
          photos[candidate].fetchPriority = "low";
          loadPhoto(photos[candidate]);
        }
      }
    });
  };
  const selectedIndex = () => {
    const left = stage.getBoundingClientRect().left + stage.clientLeft;
    const distances = photos.map(photo => Math.abs(photo.getBoundingClientRect().left - left));
    return distances.reduce((nearest, distance, index) => distance < distances[nearest] ? index : nearest, 0);
  };
  const sync = () => {
    syncFrame = null;
    if (!photos.length || !stage.clientWidth) return;
    const current = selectedIndex();
    prepare(current);
    carousel.style.setProperty("--gallery-height", stage.clientHeight + "px");
    photos.forEach((photo, index) => {
      photo.draggable = false;
      photo.dataset.active = String(index === current);
      photo.setAttribute("aria-hidden", String(index !== current));
    });
    if (!pending && !stage.hasAttribute("data-animating")) requested = current;
    onChange(current);
  };
  const onScroll = () => {
    if (syncFrame === null) syncFrame = requestAnimationFrame(sync);
  };
  const show = (index: number) => {
    if (!photos.length) return;
    requested = Math.max(0, Math.min(photos.length - 1, index));
    const current = requested;
    const ticket = ++version;
    pending = true;
    prepare(current);
    stage.setAttribute("aria-busy", "true");
    const ready = () => {
      if (ticket !== version) return;
      pending = false;
      stage.setAttribute("aria-busy", "false");
      if (photos[current].naturalWidth) controller.goToIndex(current);
    };
    photos[current].decode().then(ready, ready);
  };
  const move = (direction: -1 | 1) => {
    if (!pending && !stage.hasAttribute("data-animating")) requested = selectedIndex();
    show(requested + direction);
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    event.stopPropagation();
    move(event.key === "ArrowLeft" ? -1 : 1);
  };
  const onGesture = () => {
    version++;
    pending = false;
    stage.setAttribute("aria-busy", "false");
    requested = selectedIndex();
  };
  const observer = new ResizeObserver(sync);
  observer.observe(stage);
  carousel.addEventListener("keydown", onKey, true);
  stage.addEventListener("pointerdown", onGesture, { capture: true, passive: true });
  stage.addEventListener("wheel", onGesture, { passive: true });
  stage.addEventListener("scroll", onScroll, { passive: true });
  sync();
  return {
    move, show,
    destroy() {
      version++;
      preloadVersion++;
      if (syncFrame !== null) cancelAnimationFrame(syncFrame);
      observer.disconnect();
      controller.destroy();
      carousel.removeEventListener("keydown", onKey, true);
      stage.removeEventListener("pointerdown", onGesture, true);
      stage.removeEventListener("wheel", onGesture);
      stage.removeEventListener("scroll", onScroll);
      carousel.style.removeProperty("--gallery-height");
    },
  };
}
