import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),destination=path.resolve(root,'.verification/portable-check');
if(!destination.startsWith(`${root}${path.sep}`))throw Error('Portable check must stay inside the workshop.');
const paths=[...new Set(execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean))];
for(const file of paths){const target=path.resolve(destination,file);if(!target.startsWith(`${destination}${path.sep}`))throw Error('Path outside portable check');fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.resolve(root,file),target);}
fs.mkdirSync(path.resolve(root,'.verification/publication'),{recursive:true});
fs.writeFileSync('.verification/publication/portable-copy.json',JSON.stringify({root:destination,files:paths.length,excluded:['node_modules','dist','.git','.verification','test-results','playwright-report','.env*'],note:'Uses a fresh nested node_modules and npm cache; tests run against its own build, not the development server.'},null,2)+'\n');
console.log(`Prepared ${paths.length} candidate files inside .verification/portable-check.`);
