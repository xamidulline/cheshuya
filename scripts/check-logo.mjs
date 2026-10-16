import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const types = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css", ".svg":"image/svg+xml", ".webp":"image/webp", ".woff2":"font/woff2" };
const root = resolve("dist");
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const file = resolve(root, "." + pathname + (pathname.endsWith("/") ? "index.html" : ""));
    if (!file.startsWith(root + sep)) throw Error("path");
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const origin = "http://127.0.0.1:" + server.address().port;
const browser = await chromium.launch();
const errors = [];
try {
  for (const width of [390, 1440]) for (const colorScheme of ["light", "dark"]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme, hasTouch: true });
    const page = await context.newPage();
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(() => {
      window.logoFrames = [];
      const start = performance.now();
      const sample = () => {
        const image = document.querySelector(".logo-stage img");
        if (image && image.complete && image.naturalWidth && getComputedStyle(image).opacity !== "0") {
          const rect = image.getBoundingClientRect();
          window.logoFrames.push({ x: rect.x, y: rect.y, w: rect.width, h: rect.height });
        }
        if (performance.now() - start < 1100) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    const checkEntry = async () => {
      await page.waitForFunction(() => window.logoFrames?.length > 5);
      await page.waitForTimeout(1200);
      const frames = await page.evaluate(() => window.logoFrames);
      for (const key of ["x", "y", "w", "h"]) {
        const values = frames.map(frame => frame[key]);
        assert.ok(Math.max(...values) - Math.min(...values) <= .5, "Logo moved on entry: " + key);
      }
      assert.equal(await page.locator(".logo-particles-layer").count(), 0, "No auto animation on entry");
      assert.equal(await page.locator(".logo-stage img").evaluate(image => getComputedStyle(image).opacity), "1");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(await page.evaluate(() => performance.getEntriesByType("resource").filter(r => r.initiatorType === "fetch" && r.name.includes("cheshuya-figma-logo")).length), 0, "Effect asset is not fetched on startup");
    };
    await page.goto(origin + "/index.html");
    await checkEntry();
    await page.reload();
    await checkEntry();
    const image = page.locator(".logo-stage img");
    const rect = await image.boundingBox();
    const target = await page.locator(".logo-hit-area").boundingBox();
    assert.ok(target.width >= rect.width + 19, "Larger invisible hit area");
    const x = rect.x - 8, y = rect.y + rect.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.waitForFunction(() => document.querySelector(".logo-particles-layer svg"));
    await page.waitForTimeout(1800);
    const before = await page.locator(".logo-particles-layer svg").evaluate(svg => {
      window.heldLogoSvg = svg;
      return { rect: svg.getBoundingClientRect().toJSON(), transform: svg.style.transform };
    });
    assert.ok(before.transform.includes("scale"), "Holding expands logo slightly");
    await page.mouse.up();
    const samples = await page.evaluate(() => new Promise(done => {
      const frames = [], start = performance.now();
      const tick = () => {
        const svg = document.querySelector(".logo-particles-layer svg");
        const path = [...(svg?.querySelectorAll("path") || [])].find(p => p.style.transformBox);
        const matrix = path ? new DOMMatrix(getComputedStyle(path).transform) : null;
        frames.push({ same: svg === window.heldLogoSvg, distance: matrix ? Math.hypot(matrix.m41, matrix.m42) : 0 });
        if (performance.now() - start < 2300) requestAnimationFrame(tick); else done(frames);
      };
      tick();
    }));
    assert.ok(samples.every(sample => sample.same), "No SVG/image swap during return");
    for (let i = 1; i < samples.length; i++) assert.ok(samples[i].distance <= samples[i - 1].distance + .05, "No final particle jump");
    await page.waitForFunction(() => {
      const svg = document.querySelector(".logo-particles-layer svg");
      return svg && !svg.style.transform && [...svg.querySelectorAll("path")].every(path => !path.style.transform);
    });
    await page.mouse.down(); await page.waitForTimeout(100); await page.mouse.up();
    await page.mouse.down(); await page.waitForTimeout(200); await page.mouse.up();
    await page.waitForTimeout(2300);
    await image.focus();
    await page.keyboard.down("Space"); await page.waitForTimeout(400); await page.keyboard.up("Space");
    await page.waitForTimeout(2300);
    await page.reload();
    await checkEntry();
    await page.evaluate(() => window.scrollTo({ top: 500, behavior: "instant" }));
    await page.waitForFunction(() => document.querySelector(".archive-header").classList.contains("is-compact"));
    assert.equal(await page.locator(".logo-particles-layer").count(), 0);
    assert.equal(await page.locator(".logo-hit-area").isVisible(), false, "Header remains normal home link");
    await image.click();
    await page.waitForFunction(() => scrollY < 1);
    assert.equal(await page.locator(".logo-particles-layer").count(), 0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    assert.equal(await page.locator(".logo-hit-area").isVisible(), false);
    await page.keyboard.down("Space"); await page.keyboard.up("Space");
    assert.equal(await page.locator(".logo-particles-layer").count(), 0);
    console.log("PASS logo: cold/warm reload, hit area, hold/release, repeat, keyboard, compact home, reduced motion", width, colorScheme);
    await context.close();
  }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(origin + "/index.html");
  const cdp = await context.newCDPSession(page);
  await page.locator(".logo-hit-area").waitFor({ state: "visible" });
  const area = await page.locator(".logo-hit-area").boundingBox();
  const x = area.x + 6, y = area.y + area.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
  await page.waitForTimeout(500);
  assert.equal(await page.locator(".logo-particles-layer").count(), 1);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(2300);
  assert.equal(await page.locator(".logo-particles-layer svg").evaluate(svg => svg.style.transform), "");
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
  await page.waitForTimeout(2300);
  assert.equal(await page.locator(".logo-particles-layer svg").evaluate(svg => svg.style.transform), "");
  await context.close();
  assert.deepEqual(errors, []);
  console.log("PASS logo: mobile touch hold, release, cancellation; no browser errors");
} finally {
  await browser.close();
  await new Promise(done => server.close(done));
}
