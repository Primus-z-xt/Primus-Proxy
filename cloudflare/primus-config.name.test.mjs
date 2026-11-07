import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const code=await readFile(new URL('./primus-config.js',import.meta.url),'utf8');
const app=await readFile(new URL('../builder/app.js',import.meta.url),'utf8');
const expression=/function normalizeProfileName\(value\) \{[\s\S]*?\n *\}/;
const normalize=vm.runInNewContext('('+code.match(expression)[0]+')');
const localNormalize=vm.runInNewContext('('+app.match(expression)[0]+')');
for(const name of [undefined,'','  ','Primus','我的订阅 🛰️','custom.yaml','../bad\r\nX-Header: injected','CON','x'.repeat(100),'\ud800']){
 const safe=normalize(name);
 assert.equal(localNormalize(name),safe);
 assert.doesNotMatch(safe,/[\u0000-\u001f<>:"/\\|?*]/,'header and filename must be safe');
}
assert.equal(normalize('  '),'Primus');
assert.equal(normalize('custom.yaml'),'custom');
const worker=(await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))).default;
const templates={};for(const p of ['mihomo/template.yaml','loon/template.lcf','VERSION.json'])templates[p]=await readFile(new URL('../'+p,import.meta.url),'utf8');
const oldFetch=globalThis.fetch;globalThis.fetch=async url=>{const p=Object.keys(templates).find(p=>String(url).endsWith('/main/'+p));assert.ok(p);return new Response(templates[p]);};
const records=new Map();const env={MIHOMO_KV:{get:async k=>records.get(k),put:async(k,v)=>records.set(k,v)}};
const modern={version:3,sources:{self:{enabled:true,url:'https://example.com/self'}},daily_sources:['self'],daily_regions:['US'],ai_sources:['self'],emby:{targets:[]}};
const loon={enabled_sources:['self'],daily_sources:['self'],daily_regions:['US'],ai_sources:['self'],emby:{targets:[]}};
const title=r=>Buffer.from(r.headers.get('profile-title').slice(7),'base64').toString('utf8');
try{
 for(const kind of ['mihomo','loon']){
  let baseline;
  for(const name of [undefined,'','Primus','我的订阅 🛰️','../bad\r\nX-Header: injected']){
   const body={...(kind==='mihomo'?modern:loon),profile_name:name};
   const created=await worker.fetch(new Request('https://example.com/api/'+kind,{method:'POST',body:JSON.stringify(body)}),env);assert.equal(created.status,200);
   const result=await created.json(),url=result.subscription_url||result.config_url;
   const get=await worker.fetch(new Request(url),env);assert.equal(get.status,200);
   assert.equal(title(get),normalize(name));
   const disposition=get.headers.get('Content-Disposition');assert.ok(disposition.includes('filename*=UTF-8\'\''));assert.doesNotMatch(disposition,/[\r\n]/);
   const filename=decodeURIComponent(disposition.split("filename*=UTF-8''")[1]);assert.equal(filename,normalize(name)+(kind==='mihomo'?'.yaml':'.lcf'));
   const text=await get.text();if(baseline===undefined)baseline=text;else assert.equal(text,baseline,'naming must not alter nodes or routing');
   if(kind==='loon'){
    assert.equal(decodeURIComponent(new URL(url).pathname.split('/').pop()),normalize(name)+'.lcf');
    const oldUrl=url.slice(0,url.lastIndexOf('/'))+'/Primus-Loon.lcf';assert.equal((await worker.fetch(new Request(oldUrl),env)).status,200,'legacy filename route remains supported');
   }
  }
 }
 records.set('mihomo:legacy',JSON.stringify({self_url:'https://example.com/self'}));
 const legacy=await worker.fetch(new Request('https://example.com/mihomo/legacy'),env);assert.equal(legacy.status,200);assert.equal(title(legacy),'Primus');
 const html=await readFile(new URL('../builder/index.html',import.meta.url),'utf8');assert.match(html,/<input[^>]*id="profile-name"[^>]*value="Primus"/);
 assert.match(app,/name=\$\{encodeURIComponent\(getProfileName\(\)\)\}/);
 assert.match(app,/profile_name: config\.profile_name/,'changing name invalidates a previously generated Loon import');
 console.log('PASS: default/custom/Unicode names, headers, filenames, legacy URLs, unchanged config bodies');
}finally{globalThis.fetch=oldFetch;}
