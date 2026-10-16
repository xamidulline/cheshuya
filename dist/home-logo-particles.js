// Keep the optional animation out of the initial image/font loading path.
const image = document.querySelector(".logo-stage img");
const header = document.querySelector(".archive-header");
const stage = image?.closest(".logo-stage");
if (image && header && stage) {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const canPlay = () => !motion.matches && !header.classList.contains("is-compact") && image.getBoundingClientRect().width >= 100;
  const near = event => {
    const rect = image.getBoundingClientRect(), bounds = stage.getBoundingClientRect();
    return event.clientX >= rect.left - 10 && event.clientX <= rect.right + 10
      && event.clientY >= Math.max(bounds.top, rect.top - 10) && event.clientY <= Math.min(bounds.bottom, rect.bottom + 10);
  };
  let controller = null, pending = null, pressed = false, pointer = null, key = null;
  const detach = () => {
    if (!controller || pressed) return;
    stage.removeEventListener("pointermove", hover);
    stage.removeEventListener("pointerdown", down);
    image.removeEventListener("focus", prepare);
    image.removeEventListener("keydown", keyDown);
    image.removeEventListener("contextmenu", contextMenu);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", up);
    window.removeEventListener("keyup", keyUp);
    window.removeEventListener("blur", release);
    image.removeEventListener("blur", release);
    document.removeEventListener("visibilitychange", hidden);
  };
  const prepare = () => {
    if (controller || !canPlay()) return;
    if (!pending) pending = import("./logo-particles.js?v=logo-final-2").then(({ createLogoParticles }) => {
      controller = createLogoParticles(image, {
        assetUrl: new URL("./media/cheshuya-figma-logo.svg", import.meta.url).href,
        canPlay: () => !header.classList.contains("is-compact"),
      });
      if (pressed && canPlay()) controller.hold();
      detach();
    }).catch(() => { pending = null; release(); });
  };
  const release = () => {
    pressed = false; key = null;
    const captured = pointer; pointer = null;
    if (captured !== null && image.hasPointerCapture(captured)) image.releasePointerCapture(captured);
    controller?.release();
    detach();
  };
  const down = event => {
    if (controller || !canPlay() || !near(event) || !event.isPrimary || event.button !== 0 || pressed) return;
    event.preventDefault();
    pressed = true; pointer = event.pointerId;
    image.focus({ preventScroll: true });
    image.setPointerCapture(pointer);
    prepare();
  };
  const up = event => { if (event.pointerId === pointer) release(); };
  const keyDown = event => {
    if (controller || !canPlay() || !["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    if (event.repeat || pressed) return;
    pressed = true; key = event.key; prepare();
  };
  const keyUp = event => { if (event.key === key) release(); };
  const hover = event => { if (canPlay() && near(event)) prepare(); };
  const hidden = () => { if (document.hidden) release(); };
  const contextMenu = event => { if (pressed && canPlay()) event.preventDefault(); };
  stage.addEventListener("pointermove", hover, { passive: true });
  stage.addEventListener("pointerdown", down);
  image.addEventListener("focus", prepare);
  image.addEventListener("keydown", keyDown);
  image.addEventListener("contextmenu", contextMenu);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", release);
  image.addEventListener("blur", release);
  document.addEventListener("visibilitychange", hidden);
  window.CheshuyaLogo = { handles: source => source === image && canPlay() };
}
