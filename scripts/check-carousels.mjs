import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)("playwright");
const root = process.cwd();
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg" };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const isStatic = pathname.startsWith("/static/");
    const base = resolve(root, isStatic ? "dist" : "out");
    let relative = pathname.slice(isStatic ? 8 : 10);
    if (!extname(relative)) relative += relative.endsWith("/") ? "index.html" : "/index.html";
    const file = resolve(base, relative);
    if (!file.startsWith(base + sep)) throw new Error("Invalid path");
    const body = await readFile(file);
    response.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const errors = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, hasTouch: true });
const page = await context.newPage();
page.on("pageerror", error => errors.push(error.message));
const sleep = ms => new Promise(done => setTimeout(done, ms));
async function checkOverflow() {
  const size = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  assert.ok(size.document <= size.viewport + 1 && size.body <= size.viewport + 1, `Horizontal overflow: ${JSON.stringify(size)}`);
}
const destinations = rail => rail.evaluate(element => {
  const first = element.children[0]?.getBoundingClientRect().left || 0;
  const max = element.scrollWidth - element.clientWidth;
  return [...new Set(Array.from(element.children, child => Math.min(max, Math.max(0, child.getBoundingClientRect().left - first))))];
});
async function settled(selector, expected) {
  await page.waitForFunction(({ selector, expected }) => {
    const element = document.querySelector(selector);
    return element && !element.hasAttribute("data-animating") && Math.abs(element.scrollLeft - expected) <= 1;
  }, { selector, expected }, { timeout: 5000 });
}
async function resetRail(selector) {
  await page.locator(selector).evaluate(element => {
    element.dispatchEvent(new WheelEvent("wheel"));
    element.scrollTo({ left: 0, behavior: "instant" });
  });
  await settled(selector, 0);
}
const click = selector => page.locator(selector).evaluate(element => element.click());
async function checkRail() {
  const selector = "#cyanotype .rail-scroll";
  const rail = page.locator(selector);
  await page.waitForFunction(() => document.querySelector("#cyanotype .rail-scroll")?.children.length >= 5);
  await resetRail(selector);
  const positions = await destinations(rail);
  assert.ok(positions.length >= 4);
  await click("#cyanotype .rail-next");
  await settled(selector, positions[1]);
  await sleep(250);
  assert.ok(Math.abs(await rail.evaluate(element => element.scrollLeft) - positions[1]) <= 1, "No automatic jump after settling");
  await resetRail(selector);
  await page.evaluate(() => { const b = document.querySelector("#cyanotype .rail-next"); b.click(); b.click(); b.click(); });
  await settled(selector, positions[3]);
  await resetRail(selector);
  await page.evaluate(() => {
    document.querySelector("#cyanotype .rail-next").click();
    document.querySelector("#cyanotype .rail-next").click();
    document.querySelector("#cyanotype .rail-prev").click();
  });
  await settled(selector, positions[1]);
  await resetRail(selector);
  await click("#cyanotype .rail-next");
  await page.setViewportSize({ width: 390, height: 844 });
  await sleep(150);
  const resized = await destinations(rail);
  await settled(selector, resized[1]);
  await checkOverflow();
}
async function checkMerch(otherRatio) {
  const image = page.locator(".merch-section .archive-image").first();
  await image.waitFor();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await sleep(50);
    const box = await image.boundingBox();
    assert.ok(box && Math.abs(box.width / box.height - 0.75) < 0.005, `Merch must be 3:4 at ${width}px`);
    assert.equal(await image.locator("img").evaluate(element => getComputedStyle(element).objectFit), "contain");
    const otherBox = await page.locator("#zines .archive-image").first().boundingBox();
    assert.ok(otherBox && Math.abs(otherBox.width / otherBox.height - otherRatio) < 0.005, "Other card shapes must stay unchanged");
    await checkOverflow();
  }
}
async function touchSwipe(selector) {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
  const box = await element.boundingBox();
  assert.ok(box && box.width > 100 && box.height > 100);
  const cdp = await context.newCDPSession(page);
  const y = Math.min(700, Math.max(120, box.y + Math.min(box.height / 2, 180)));
  const start = box.x + box.width * 0.85, end = box.x + box.width * 0.15;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: start, y }] });
  for (let step = 1; step <= 8; step++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: start + (end - start) * step / 8, y }] });
    await sleep(20);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}
async function checkNativeSwipe() {
  await page.setViewportSize({ width: 390, height: 844 });
  await resetRail("#cyanotype .rail-scroll");
  await touchSwipe("#cyanotype .rail-scroll");
  await page.waitForFunction(() => document.querySelector("#cyanotype .rail-scroll").scrollLeft > 20);
  await sleep(1200);
  const rail = page.locator("#cyanotype .rail-scroll");
  const stops = await destinations(rail);
  const left = await rail.evaluate(element => element.scrollLeft);
  assert.ok(stops.some(stop => Math.abs(stop - left) <= 2), "Native swipe must settle at a card");
  await checkOverflow();
}
async function checkGallery(path) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(origin + path);
  await page.waitForFunction(() => document.querySelector(".zine-slide img[data-active=true]")?.naturalWidth > 0);
  const stage = page.locator(".zine-slide");
  const before = await stage.boundingBox();
  const arrows = await page.locator(".zine-controls").boundingBox();
  const count = await stage.locator("img").count();
  assert.ok(count >= 3);
  await click(".zine-controls button:last-child");
  await page.waitForFunction(() => document.querySelector(".zine-slide img:nth-child(2)")?.dataset.active === "true");
  assert.deepEqual(await stage.boundingBox(), before, "Image changes must not resize the stage");
  assert.deepEqual(await page.locator(".zine-controls").boundingBox(), arrows, "Image changes must not move arrows");
  assert.equal(await stage.locator("img").first().evaluate(element => getComputedStyle(element).objectFit), "contain");
  assert.equal(await stage.evaluate(element => getComputedStyle(element).backgroundColor), "rgb(255, 255, 255)");
  assert.equal(await stage.locator("img").first().evaluate(element => getComputedStyle(element).transitionDuration), "0.35s");
  await page.evaluate(() => {
    const b = document.querySelector(".zine-controls button:last-child");
    b.click(); b.click();
    document.querySelector(".zine-controls button:first-child").click();
  });
  await page.waitForFunction(() => document.querySelector(".zine-slide img:nth-child(3)")?.dataset.active === "true");
  await page.setViewportSize({ width: 390, height: 844 });
  await sleep(100);
  await checkOverflow();
  await touchSwipe(".zine-slide");
  await page.waitForFunction(index => document.querySelectorAll(".zine-slide img")[index]?.dataset.active === "true", 3 % count);
  await sleep(400);
  await checkOverflow();
}
async function checkMixedCards() {
  await page.goto(origin + "/static/index.html");
  await page.evaluate(() => {
    const fixture = document.createElement("div");
    fixture.style.cssText = "width:355px;max-width:100%;position:relative";
    fixture.innerHTML = '<div id="mixed-cards" class="carousel-rail" style="gap:23px">' +
      [137, 249, 183, 211, 307].map(width => `<article style="flex:0 0 ${width}px;height:120px"></article>`).join("") + "</div>";
    document.body.append(fixture);
    window.testCarousel = window.CheshuyaCarousel.createCardCarousel(fixture.firstElementChild);
  });
  const stops = await destinations(page.locator("#mixed-cards"));
  assert.equal(Math.round(stops[1]), 160);
  await page.evaluate(() => window.testCarousel.move(1));
  await settled("#mixed-cards", stops[1]);
  await page.evaluate(() => { window.testCarousel.move(1); window.testCarousel.move(1); });
  await settled("#mixed-cards", stops[3]);
  await page.evaluate(() => window.testCarousel.move(-1));
  await settled("#mixed-cards", stops[2]);
  await page.evaluate(() => window.testCarousel.destroy());
  await checkOverflow();
}

try {
  for (const [home, otherRatio] of [["/static/index.html", 4 / 3], ["/cheshuya/", 1]]) {
    await page.goto(origin + home);
    await checkMerch(otherRatio);
    await checkRail();
    await checkNativeSwipe();
    console.log("PASS home: ratios, card positions, repeated clicks, resize, native swipe, overflow", home);
  }
  await checkMixedCards();
  console.log("PASS unequal card widths and gaps");
  for (const path of [
    "/static/zine-nedostatochno-pamyati.html", "/static/zine-ubezhishche.html", "/static/zine-sloi.html",
    "/static/cyanotype.html", "/cheshuya/zines/nedostatochno-pamyati/",
    "/cheshuya/zines/ubezhishche/", "/cheshuya/zines/sloi/",
  ]) {
    await checkGallery(path);
    console.log("PASS gallery: stable stage and arrows, 350ms fade, contain, rapid clicks, swipe, overflow", path);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(origin + "/static/index.html");
  await page.waitForFunction(() => document.querySelector("#cyanotype .rail-scroll")?.children.length >= 5);
  await resetRail("#cyanotype .rail-scroll");
  const stops = await destinations(page.locator("#cyanotype .rail-scroll"));
  await click("#cyanotype .rail-next");
  await settled("#cyanotype .rail-scroll", stops[1]);
  await page.goto(origin + "/static/zine-sloi.html");
  await page.waitForFunction(() => document.querySelector(".zine-slide img[data-active=true]")?.naturalWidth > 0);
  assert.equal(await page.locator(".zine-slide img").first().evaluate(element => getComputedStyle(element).transitionDuration), "0s");
  await checkOverflow();
  assert.deepEqual(errors, [], "No uncaught browser errors");
  console.log("PASS reduced motion and browser errors");
} finally {
  await context.close();
  await browser.close();
  await new Promise(done => server.close(done));
}
