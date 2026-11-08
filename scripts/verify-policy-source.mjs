// Explicit, read-only source audit. Normal builds and portable tests do not read D:.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const arg=process.argv.indexOf('--root');
if(arg<0||!process.argv[arg+1])throw Error('Use --root <agent-system> explicitly.');
const root=path.resolve(process.argv[arg+1]);
const source=JSON.parse(fs.readFileSync(new URL('../src/content/policy/source.json',import.meta.url),'utf8'));
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
for(const excerpt of source.excerpts){
 const text=fs.readFileSync(path.join(root,excerpt.path),'utf8').replace(/\r\n/g,'\n');
 const rows=text.split('\n').slice(excerpt.from-1,excerpt.to).map((text,i)=>({line:excerpt.from+i,text}));
 if(hash(text)!==excerpt.sha256||JSON.stringify(rows)!==JSON.stringify(excerpt.rows)||hash(rows.map(r=>r.text).join('\n'))!==excerpt.excerptSha256)throw Error(`Source mismatch: ${excerpt.id}`);
}
console.log(`${source.excerpts.length} Policy excerpts match source, line numbers and SHA-256. Read only; no Java/API/DB run.`);
