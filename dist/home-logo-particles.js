import { createLogoParticles } from "./logo-particles.js";
const image = document.querySelector(".logo-stage img");
const header = document.querySelector(".archive-header");
if (image && header) {
  const controller = createLogoParticles(image, {
    assetUrl: new URL("./media/cheshuya-figma-logo.svg", import.meta.url).href,
    canPlay: () => !header.classList.contains("is-compact"),
  });
  window.CheshuyaLogo = { play: source => source === image && controller.play() };
}
