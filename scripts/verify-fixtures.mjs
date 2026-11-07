import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifestPath=path.join(root,'fixtures.manifest.json');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const content=file=>Buffer.from(fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n'),'utf8');
function list(directory){return fs.readdirSync(path.join(root,directory),{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?list(`${directory}/${entry.name}`):[`${directory}/${entry.name}`]);}
const paths=list('src/content').filter(name=>/\.(json|txt|ts)$/.test(name)).sort();
if(process.argv.includes('--update')){
 const files=paths.map(file=>{const bytes=content(file);return {path:file,bytes:bytes.length,sha256:hash(bytes)};});
 fs.writeFileSync(manifestPath,JSON.stringify({version:1,normalization:'UTF-8 text; CRLF normalized to LF',purpose:'Integrity of the bundled, reviewed lesson snapshots; not verification of upstream repositories or a live backend.',files},null,2)+'\n');
 console.log(`Updated local fixture manifest (${files.length} files).`);
}else{
 const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 if(JSON.stringify(manifest.files.map(f=>f.path))!==JSON.stringify(paths))throw Error('Fixture list changed. Review the change, then npm run fixtures:update.');
 for(const file of manifest.files){const bytes=content(file.path);if(bytes.length!==file.bytes||hash(bytes)!==file.sha256)throw Error(`Bundled fixture changed: ${file.path}`);}
 console.log(`Bundled fixture integrity: ${manifest.files.length} files verified; no external source or service accessed.`);
}
