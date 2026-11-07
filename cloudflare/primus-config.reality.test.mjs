import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const code=await readFile(new URL('./primus-config.js',import.meta.url),'utf8');
const builder=await readFile(new URL('../builder/app.js',import.meta.url),'utf8');
function helper(source){
 const start=source.indexOf('function realityProviderOverrideLines(');
 const end=source.indexOf('\n}',start)+2;
 return vm.runInNewContext('('+source.slice(start,end)+')');
}
const local=helper(builder),remote=helper(code);
for(const prefix of ['', '🛟 ']){
 assert.equal(JSON.stringify(local(prefix)),JSON.stringify(remote(prefix)),'local and remote compatibility overrides must match');
 const text=local(prefix).join('\n');
 assert.match(text,/select\(\.type == "vless" and \.\["reality-opts"\] != null\)/,'modify REALITY VLESS only');
 assert.match(text,/support-x25519mlkem768"\]\) = true/);
 assert.match(text,/client-fingerprint"\]\) = "chrome"/);
}
const worker=(await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)).default;
const files={};for(const path of ['mihomo/template.yaml','loon/template.lcf','VERSION.json'])files[path]=await readFile(new URL('../'+path,import.meta.url),'utf8');
const originalFetch=globalThis.fetch;
globalThis.fetch=async url=>{
 const path=Object.keys(files).find(p=>String(url).endsWith('/main/'+p));assert.ok(path);return new Response(files[path]);
};
const modern={version:3,sources:Object.fromEntries(['airport','self','backup'].map(k=>[k,{enabled:true,url:'https://example.com/'+k}])),daily_sources:['self'],daily_regions:['US'],ai_sources:['self'],emby:{targets:[]}};
const legacy={self_url:'https://example.com/self',airport_a_url:'https://example.com/airport',backup_url:'https://example.com/backup'};
try{
 for(const record of [modern,legacy]){
  const env={MIHOMO_KV:{get:async()=>JSON.stringify(record)}};
  const res=await worker.fetch(new Request('https://example.com/mihomo/test'),env);assert.equal(res.status,200);
  const yaml=await res.text();
  const providerPart=yaml.split(/^proxy-providers:/m)[1].split(/^rule-providers:/m)[0];
  const count=(providerPart.match(/    type: http/g)||[]).length;
  assert.equal((providerPart.match(/support-x25519mlkem768/g)||[]).length,count,'every provider including legacy must carry compatibility');
  if(!record.self_url)assert.match(providerPart,/additional-prefix: "🛟 "/,'modern backup prefix retained');
 }
 const env={MIHOMO_KV:{put:async()=>assert.fail('empty choices must not be saved')}};
 for(const kind of ['mihomo','loon']){
  const r=await worker.fetch(new Request('https://example.com/api/'+kind,{method:'POST',body:'{}'}),env);assert.equal(r.status,400);
 }
 console.log('PASS: REALITY overrides, local/remote parity, modern/legacy providers, empty-choice validation');
}finally{globalThis.fetch=originalFetch;}
