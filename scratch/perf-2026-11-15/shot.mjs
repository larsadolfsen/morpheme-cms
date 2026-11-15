import { chromium } from '/home/user/morpheme-cms/node_modules/playwright/index.mjs';
import { serveBuilt, openEditor } from '/home/user/morpheme-cms/scripts/built-site.mjs';
const tag=process.argv[2];
const { server, site } = await serveBuilt(process.cwd() + '/dist');
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
for (const [name,w,h,m] of [['phone',375,812,true],['desktop',1280,800,false]]) {
 const e = await b.newPage({ viewport: { width: w, height: h }, isMobile: m, hasTouch: m });
 await openEditor(e, site);
 await e.evaluate(()=>location.hash='#src/content/pages/blocks.md'); await e.waitForSelector('.ProseMirror .site-block-card',{timeout:60000});
 await e.waitForTimeout(2500);
 for (const y of [0,3000,9000]) { await e.evaluate(y=>{const s=[...document.querySelectorAll('*')].find(el=>el.scrollHeight>el.clientHeight+500&&/auto|scroll/.test(getComputedStyle(el).overflowY))||document.scrollingElement; s.scrollTop=y},y); await e.waitForTimeout(800); await e.screenshot({path:`/tmp/claude-0/shots/${tag}-${name}-${y}.png`}); }
}
await b.close(); server.close();
