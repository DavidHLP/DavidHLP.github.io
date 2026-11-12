import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const rev='07cee2baf9cee227807dcd68004c5f2493e5ac52',root=new URL(`../migration/fuwari/${rev}/`,import.meta.url);
const m=JSON.parse(await readFile(new URL('manifest.json',root),'utf8')),r=JSON.parse(await readFile(new URL('redaction-report.json',root),'utf8'));
assert.equal(m.sourceCommit,rev);assert.equal(m.files.length,147);assert.equal(m.omittedFiles.length,8);assert.equal(m.files.filter(f=>f.path.endsWith('.md')).length,61);
const omitted=new Set(m.omittedFiles.map(f=>f.sha256));
for(const f of m.files){
 assert(!f.path.startsWith('/')&&!f.path.split('/').includes('..'));const b=await readFile(new URL(f.path,root));assert.equal(b.length,f.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256,f.path);assert.equal(createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex'),f.gitBlob,f.path);assert(!omitted.has(f.sha256));
 if(f.redactions){assert.match(f.sourceSha256,/^[0-9a-f]{64}$/);assert.match(f.sourceGitBlob,/^[0-9a-f]{40}$/);assert.notEqual(f.sha256,f.sourceSha256);}
 if(f.path.endsWith('.md')){const s=b.toString('utf8');assert(!/-----BEGIN [^-]*PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16}/.test(s));for(const x of s.matchAll(/(?<![\w.])(?:\d{1,3}\.){3}\d{1,3}(?![\w.])/g))assert(['127.0.0.1','0.0.0.0','192.0.2.10'].includes(x[0]),f.path);for(const x of s.matchAll(/\.set(?:Password|Token|Secret|ApiKey)\s*\(\s*["']([^"']*)["']/gi))assert.equal(x[1],'REDACTED_SET_YOUR_OWN_SECRET',f.path);for(const l of s.split('\n'))if(/^\s*(?:auth\.token|password|api[_-]?key|secret[_-]?key|access[_-]?token)\s*[:=]|^\s*- NACOS_AUTH_TOKEN=/i.test(l))assert(l.includes('REDACTED_SET_YOUR_OWN_SECRET'),f.path);}
}
assert.equal(r.sourceCommit,rev);assert.deepEqual(r.changes,m.files.filter(f=>f.redactions).map(f=>({path:f.path,reasons:f.redactions,sourceSha256:f.sourceSha256,publishedSha256:f.sha256})));assert.deepEqual(r.omittedScreenshots,m.omittedFiles.map(f=>({path:f.path,sourceSha256:f.sha256,reason:f.reason})));for(const f of m.omittedFiles)await assert.rejects(readFile(new URL(f.path,root)),{code:'ENOENT'});
async function list(dir,p=''){let out=[];for(const e of await readdir(dir,{withFileTypes:true})){if(e.isDirectory())out.push(...await list(new URL(e.name+'/',dir),p+e.name+'/'));else{assert(e.isFile());out.push(p+e.name);}}return out;}
assert.deepEqual((await list(root)).sort(),[...m.files.map(f=>f.path),'README.md','manifest.json','redaction-report.json'].sort());
for(const p of ['content/blog/legacy/information/en/kb-index.md','content/blog/legacy/information/ja/kb-index.md','content/blog/legacy/information/zh-cn/kb-index.md','public/archives/RHINE-LAB-X-1003.txt','public/archives/RHINE-LAB-X-1009.txt','public/archives/RHINE-LAB-X-1015.txt']){const s=await readFile(new URL('../'+p,import.meta.url),'utf8');assert(!s.includes('github.com/DavidHLP/Fuwari/'));assert.equal(s.split('DavidHLP.github.io/tree/main/migration/fuwari/'+rev).length-1,8);}
console.log('Verified 61 sanitized articles, 85 assets, 8 omissions, source/publication hashes and active links.');
