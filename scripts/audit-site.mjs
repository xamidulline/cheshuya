import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
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
  await page.goto(origin+"/"+path,{waitUntil:"load",timeout:90000});
  await wait(4000);
  const data=await page.evaluate(()=>({
    ...window.auditVitals,
    bytes:performance.getEntriesByType("resource").reduce((s,r)=>s+r.encodedBodySize,0),
    resources:performance.getEntriesByType("resource").length,
    fcp:performance.getEntriesByName("first-contentful-paint")[0]?.startTime,
    dcl:performance.getEntriesByType("navigation")[0].domContentLoadedEventEnd,
    overflow:document.documentElement.scrollWidth>innerWidth,
    images:[...document.images].map(i=>({src:i.currentSrc.replace(location.origin,""),loaded:i.complete&&i.naturalWidth>0,loading:i.loading,alt:i.hasAttribute("alt")})),
    emptyLinks:[...document.querySelectorAll("a:not([href])")].map(a=>a.textContent),
    unlabeledButtons:[...document.querySelectorAll("button")].filter(b=>!b.getAttribute("aria-label")&&!b.textContent.trim()).length,
    blockingScripts:[...document.querySelectorAll("head script[src]:not([defer]):not([type=module])")].map(s=>s.getAttribute("src")),
  }));
  if(path==="index.html"){
    await page.locator(".language-button").click();await wait(100);
    data.english=await page.locator("html").getAttribute("lang");
    await page.locator(".header-controls button:last-child").click();
    await page.keyboard.press("Escape");await wait(300);
    data.menuEscape=await page.locator(".static-menu").evaluate(e=>e.hidden);
  }else{
    await page.locator(".catalog-burger,.zine-burger").click();
    await page.locator(".zine-menu-close").click();await wait(300);
    data.menuClosed=await page.locator(".zine-menu").evaluate(e=>e.hidden);
  }
  data.errors=errors;data.failed=failed;data.requests=requests;
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
      console.log("AUDIT_LINKS",name,JSON.stringify(broken));
      await context.close();
    }finally{await new Promise(done=>server.close(done));}
  }
  await writeFile("site-audit.json",JSON.stringify(results,null,2));
  if(process.env.AUDIT_ASSERT==="true"){
    for(const [path,data] of Object.entries(results.after)){
      if(path==="brokenLinks")continue;
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
