import { chromium } from '/home/user/morpheme-cms/node_modules/playwright/index.mjs';
import { serveBuilt, openEditor } from '/home/user/morpheme-cms/scripts/built-site.mjs';
const what = process.argv[2];
const { server, site } = await serveBuilt(process.cwd() + '/dist');
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
const e = await ctx.newPage();
const cdp = await ctx.newCDPSession(e);
await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval',{interval:500});
if (what==='load') await cdp.send('Profiler.start');
await openEditor(e, site);
await e.evaluate(()=>location.hash='#src/content/pages/blocks.md'); await e.waitForSelector('.ProseMirror .site-block-card',{timeout:60000});
await e.waitForTimeout(3000);
if (what!=='load') {
  await cdp.send('Profiler.start');
  if (what==='type'){ await e.locator('.ProseMirror').first().click(); await e.keyboard.type('abcdef',{delay:300}); }
  if (what==='sheet'){ await e.locator('button[aria-label="Insert block"]:visible').first().click(); await e.waitForTimeout(1500);}
}
const {profile}=await cdp.send('Profiler.stop');
const self=new Map(); const dt=profile.timeDeltas; const byId=new Map(profile.nodes.map(n=>[n.id,n]));
profile.samples.forEach((id,i)=>{const n=byId.get(id);const k=n.callFrame.functionName+' '+n.callFrame.url.split('/').slice(-1)[0]+':'+n.callFrame.lineNumber+':'+n.callFrame.columnNumber;self.set(k,(self.get(k)||0)+dt[i]/1000)});
console.log(what,[...self].sort((a,b)=>b[1]-a[1]).slice(0,14).map(([k,v])=>Math.round(v)+'ms '+k).join('\n'));
await b.close(); server.close();
