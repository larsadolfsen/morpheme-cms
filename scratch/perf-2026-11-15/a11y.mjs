import { chromium } from '/home/user/morpheme-cms/node_modules/playwright/index.mjs';
import { serveBuilt, openEditor } from '/home/user/morpheme-cms/scripts/built-site.mjs';
import { readFileSync } from 'node:fs';
const { server, site } = await serveBuilt(process.cwd() + '/dist');
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const off = process.argv[2]==='off';
const e = await b.newPage({ viewport: { width: 1280, height: 800 } });
await openEditor(e, site);
await e.evaluate(()=>location.hash='#src/content/pages/blocks.md'); await e.waitForSelector('.ProseMirror .site-block-card',{timeout:60000});
await e.waitForTimeout(2500);
if (off) await e.addStyleTag({content:'.editor-text .ProseMirror > * { content-visibility: visible !important; }'});
await e.waitForTimeout(500);
// 1 keyboard order: tab from the first block through the page
await e.locator('.ProseMirror').first().click();
const seen=[]; 
for (let i=0;i<150;i++){ await e.keyboard.press('Tab'); const d=await e.evaluate(()=>{const a=document.activeElement;return a?(a.tagName+'.'+(a.className||'').toString().slice(0,30)+'|'+(a.getAttribute('aria-label')||a.textContent||'').trim().slice(0,20)):''}); seen.push(d); }
const inPage = seen.filter(s=>/site-block|inline|icon-button|button/.test(s)).length;
// last distinct focus targets
console.log(off?'OFF':'ON','tab stops:',new Set(seen).size,'unique; last:',seen.slice(-3).join(' || '));
// 2 scrollIntoView on the last top-level part
const r = await e.evaluate(async()=>{const pm=document.querySelector('.ProseMirror');const last=pm.lastElementChild;last.scrollIntoView({block:'center',behavior:'instant'});await new Promise(r=>setTimeout(r,800));const sc=[...document.querySelectorAll('*')].find(el=>el.scrollHeight>el.clientHeight+500&&/auto|scroll/.test(getComputedStyle(el).overflowY))||document.scrollingElement;const bb=last.getBoundingClientRect();return {top:Math.round(bb.top),h:Math.round(bb.height),vh:innerHeight,scroller:sc.tagName+'.'+String(sc.className).slice(0,20),scrollTop:Math.round(sc.scrollTop)}});
console.log(off?'OFF':'ON','scrollIntoView last part:',JSON.stringify(r));
// 3 find in page: a string only near the end
const text = await e.evaluate(()=>{const hs=[...document.querySelectorAll('.ProseMirror > h2, .ProseMirror > h1')];return hs[hs.length-1].textContent.trim()});
await e.evaluate(()=>{scrollTo({top:0,behavior:'instant'});document.querySelectorAll('*').forEach(el=>{if(el.scrollTop>0)el.scrollTop=0})}); await e.waitForTimeout(500);
const found = await e.evaluate(t=>window.find(t),text);
const after=await e.evaluate(t=>{const h=[...document.querySelectorAll('.ProseMirror > h2, .ProseMirror > h1')].pop();return Math.round(h.getBoundingClientRect().top)});
console.log(off?'OFF':'ON','find-in-page "'+text+'":',found,'heading top after find:',after);
await b.close(); server.close();
