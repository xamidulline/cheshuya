import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const types = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css", ".svg":"image/svg+xml", ".webp":"image/webp", ".jpg":"image/jpeg", ".png":"image/png" };
async function serve(dir) {
  const root=resolve(dir);
  const server=createServer(async(req,res)=>{
    try {
      const name=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
      const file=resolve(root,"."+name+(name.endsWith("/")?"index.html":""));
      if(!file.startsWith(root+sep)) throw Error("path");
      const body=await readFile(file);
      res.writeHead(200,{"Content-Type":types[extname(file)]||"application/octet-stream","Cache-Control":"no-store"});res.end(body);
    } catch {res.writeHead(404);res.end("not found");}
  });
  await new Promise(done=>server.listen(0,"127.0.0.1",done));
  return {server,origin:"http://127.0.0.1:"+server.address().port};
}
const browser=await chromium.launch();
const results={};
const wait=ms=>new Promise(done=>setTimeout(done,ms));
async function measure(origin,path) {
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const page=await context.newPage();
  const cdp=await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions",{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750,connectionType:"cellular4g"});
  await cdp.send("Emulation.setCPUThrottlingRate",{rate:4});
  const errors=[],failed=[],requests=[];
  page.on("pageerror",e=>errors.push(e.message));
  page.on("requestfailed",r=>{if(r.failure()?.errorText!=="net::ERR_ABORTED")failed.push({url:r.url(),error:r.failure()?.errorText});});
  page.on("response",r=>{if(r.status()>=400)failed.push({url:r.url(),status:r.status()});});
  page.on("request",r=>requests.push(r.url().replace(origin,"")));
  await page.addInitScript(()=>{
    window.auditVitals={lcp:0,cls:0};
    new PerformanceObserver(list=>{for(const e of list.getEntries())window.auditVitals.lcp=e.startTime;}).observe({type:"largest-contentful-paint",buffered:true});
    new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.auditVitals.cls+=e.value;}).observe({type:"layout-shift",buffered:true});
  });
  await page.goto(origin+"/"+path,{waitUntil:"domcontentloaded",timeout:90000});
  try {
    await page.waitForFunction(() => {
      const image = document.querySelector('.street-feature img, .zine-slide img, .catalog-image img');
      return !image || (image.complete && image.naturalWidth > 0);
    }, null, { timeout: 60000 });
  } catch { errors.push('Primary image did not load within 60 seconds'); }
  await wait(1500);
  const data=await page.evaluate(()=>({
    ...window.auditVitals,
    bytes:performance.getEntriesByType("resource").reduce((s,r)=>s+r.encodedBodySize,0),
    resources:performance.getEntriesByType("resource").length,
    waterfall:performance.getEntriesByType("resource").map(r=>({name:r.name.replace(location.origin,""),start:r.startTime,duration:r.duration,bytes:r.encodedBodySize})),
    fcp:performance.getEntriesByName("first-contentful-paint")[0]?.startTime,
    dcl:performance.getEntriesByType("navigation")[0].domContentLoadedEventEnd,
    overflow:document.documentElement.scrollWidth>innerWidth,
    images:[...document.images].map(i=>({src:i.currentSrc.replace(location.origin,""),loaded:i.complete&&i.naturalWidth>0,loading:i.loading,alt:i.hasAttribute("alt")})),
    emptyLinks:[...document.querySelectorAll("a:not([href])")].map(a=>a.textContent),
    unlabeledButtons:[...document.querySelectorAll("button")].filter(b=>!b.getAttribute("aria-label")&&!b.textContent.trim()).length,
    blockingScripts:[...document.querySelectorAll("head script[src]:not([defer]):not([type=module])")].map(s=>s.getAttribute("src")),
  }));
  try { if(path==="index.html"){
    await page.locator(".language-button").click();await wait(100);
    data.english=await page.locator("html").getAttribute("lang");
    await page.locator(".header-controls button:last-child").click();
    await page.keyboard.press("Escape");await wait(300);
    data.menuEscape=await page.locator(".static-menu").evaluate(e=>e.hidden);
  }else{
    await page.locator(".catalog-burger,.zine-burger").click();
    await page.locator(".zine-menu-close").click({timeout:2500});await wait(300);
    data.menuClosed=await page.locator(".zine-menu").evaluate(e=>e.hidden);
  }
  } catch(error) { errors.push("Interaction failed: " + error.message.split("\n")[0]); }
  data.errors=errors;data.failed=failed;data.requests=requests;
  console.log("AUDIT_SUMMARY", path, JSON.stringify({lcp:data.lcp,cls:data.cls,bytes:data.bytes,resources:data.resources,errors:data.errors}));
  await context.close();return data;
}
try {
  for(const [name,dir] of [["before",process.env.AUDIT_BASE_DIR],["after","dist"]]){
    if(!dir)continue;
    const {server,origin}=await serve(dir);
    try {
      results[name]={};
      for(const path of ["index.html","zine-nedostatochno-pamyati.html","exhibition.html?id=polya-prisutstviya","cyanotype.html","catalog-exhibitions.html"]){
        const data=await measure(origin,path);results[name][path]=data;
        console.log("AUDIT",name,path,JSON.stringify(data));
      }
      const pages=(await readdir(dir)).filter(p=>p.endsWith(".html"));
      const context=await browser.newContext();
      const page=await context.newPage();
      const links=new Set();
      for(const path of pages){
        await page.goto(origin+"/"+path);await wait(150);
        for(const href of await page.locator("a[href]").evaluateAll(nodes=>nodes.map(a=>a.href)))if(href.startsWith(origin))links.add(href);
      }
      const broken=[];
      for(const url of links){const r=await context.request.get(url);if(!r.ok())broken.push({url,status:r.status()});}
      results[name].brokenLinks=broken;
      if(name === "after"){
        const errors=[],badResources=[],accessibility=[],checkedAssets=new Set();
        page.on("pageerror",e=>errors.push(e.message));
        page.on("response",r=>{if(r.status()>=400)badResources.push({url:r.url(),status:r.status()});});
        const paths=pages.filter(p=>p!=="exhibition.html").concat([
          "exhibition.html?id=polya-prisutstviya","exhibition.html?id=uyazvimoe-mesto","exhibition.html?id=portal",
          "exhibition.html?id=black-show","exhibition.html?id=rusty-box","exhibition.html?id=sleepy-stupor",
          "exhibition.html?id=deep-woods-cold-winters","exhibition.html?id=rekviem-po-zhek-artu"
        ]);
        const axeSource=await readFile(require.resolve("axe-core/axe.min.js"),"utf8");
        for(const path of paths){
          await page.setViewportSize({width:390,height:844});
          await page.goto(origin+"/"+path);
          await page.addScriptTag({content:axeSource});
          const violations=await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));
          if(violations.length)accessibility.push({path,violations});
          for(const width of [320,390,768,1440]){
            await page.setViewportSize({width,height:844});
            assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"Overflow "+path+" at "+width);
          }
          for(const asset of await page.locator("img").evaluateAll(nodes=>nodes.flatMap(i=>[i.getAttribute("src"),i.dataset.src,i.dataset.gallerySrc,...(i.getAttribute("srcset")||i.dataset.srcset||i.dataset.gallerySrcset||"").split(",").map(s=>s.trim().split(" ")[0])]).filter(Boolean))){
            const url=new URL(asset,page.url()).href;
            if(checkedAssets.has(url))continue;
            checkedAssets.add(url);
            const response=await context.request.head(url);
            assert.ok(response.ok(),"Missing image variant: "+url);
          }
          if(path==="catalog-objects.html"){
            await page.locator("[data-object-index]").first().click();
            await page.waitForFunction(()=>document.querySelector(".object-lightbox")?.open);
            await page.locator(".object-lightbox-next").click();
            assert.equal(await page.locator(".object-lightbox-counter").textContent(),"2 / 3");
            await page.keyboard.press("Escape");
            await page.waitForFunction(()=>document.body.style.overflow==="");
          }
          if(path==="index.html"){
            await page.locator("#outside-tab").press("ArrowRight");
            assert.equal(await page.locator("#inside").isVisible(),true);
            await page.locator("#inside-tab").press("Home");
            assert.equal(await page.locator("#outside").isVisible(),true);
            await page.locator(".language-button").click();
            assert.equal(await page.locator(".static-menu [data-target=objects]").textContent(),"Objects");
            await page.locator(".language-button").click();
            assert.equal(await page.locator("#zines h2").textContent(),"Печатные издания");
            await page.locator(".header-controls button:last-child").click();
            await page.locator(".static-menu button").last().press("Tab");
            assert.equal(await page.locator(".static-menu-close").evaluate(e=>e===document.activeElement),true);
            await page.keyboard.press("Escape");
            await page.waitForFunction(()=>!document.querySelector("main").inert);
            assert.equal(await page.locator(".header-controls button:last-child").evaluate(e=>e===document.activeElement),true);
            await page.locator(".header-controls button:last-child").click();
            await page.locator(".static-menu [data-target=objects]").click();
            await page.waitForFunction(()=>!document.querySelector("#inside").hidden&&!document.querySelector("main").inert);
            await page.goto(origin+"/index.html#exhibitions");
            assert.equal(await page.locator("#inside").isVisible(),true);
          }
          console.log("PASS page: accessibility, image variants and responsive layout",path);
        }
        await page.goto(origin+"/exhibition.html?id=missing");
        await page.waitForURL("**/catalog-exhibitions.html");
        await page.goto(origin+"/index.html");
        await page.setViewportSize({width:390,height:844});
        await page.screenshot({path:"audit-home-mobile.png",fullPage:true});
        await page.setViewportSize({width:1440,height:1000});
        await page.screenshot({path:"audit-home-desktop.png",fullPage:true});
        results.after.functional={errors,badResources,accessibility,checkedAssets:checkedAssets.size,pages:paths.length};
        console.log("AUDIT_FUNCTIONAL",JSON.stringify(results.after.functional));
        assert.deepEqual(errors,[]);
        assert.deepEqual(badResources,[]);
        assert.deepEqual(accessibility,[],"Accessibility regressions");
      }
      console.log("AUDIT_LINKS",name,JSON.stringify(broken));
      await context.close();
    }finally{await new Promise(done=>server.close(done));}
  }
  await writeFile("site-audit.json",JSON.stringify(results,null,2));
  if(process.env.AUDIT_ASSERT==="true"){
    for(const [path,data] of Object.entries(results.after)){
      if(path==="brokenLinks" || path==="functional")continue;
      assert.deepEqual(data.errors,[],"Browser errors: "+path);
      assert.deepEqual(data.failed,[],"Failed resources: "+path);
      assert.equal(data.overflow,false,"Overflow: "+path);
      assert.deepEqual(data.emptyLinks,[],"Links without destinations: "+path);
      assert.deepEqual(data.blockingScripts,[],"Blocking scripts: "+path);
      if(path==="index.html"){assert.equal(data.english,"en");assert.equal(data.menuEscape,true);}
      else assert.equal(data.menuClosed,true);
    }
    assert.deepEqual(results.after.brokenLinks,[]);
  }
}finally{await browser.close();}
