import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const root = process.argv[process.argv.indexOf('--root') + 1];
if (!process.argv.includes('--root') || !root) throw Error('Use --root <agent-system>');
const base = JSON.parse(fs.readFileSync('src/content/policy/assembly-source.json', 'utf8'));
const keys = ['controller','quoteFunc','func','quoteRepo','repo','command','event','mapping','base','baseController','repositoryBean','repositoryExtension','save','dispatch','applyLoop','jdbcWrite','aggregate','workflow','sync','viewEntity','viewRepository','queryController','search','queryRepository','detail','internalApi','internalController','quoteAggregate'];
const overridePath = 'src/content/policy/session-source.json';
const refresh = process.argv.includes('--refresh');
const overrides = refresh ? {} : JSON.parse(fs.readFileSync(overridePath, 'utf8'));
const records = [];
for (const key of keys) {
  const original = base[key], file = path.join(root, original.path);
  const buffer = fs.readFileSync(file), sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  if (refresh && sha256 !== original.sha256) overrides[key] = {...original, sha256,
    commit:execFileSync('git',['-C',path.join(root,'workspaces/agent-service'),'rev-parse','HEAD'],{encoding:'utf8'}).trim(),
    modified:execFileSync('git',['-C',path.join(root,'workspaces/agent-service'),'status','--porcelain','--',original.path.replace('workspaces/agent-service/','')],{encoding:'utf8'}).trim()!=='', rows:buffer.toString('utf8').replace(/\r\n/g,'\n').replace(/\n$/,'').split('\n').map((text,i)=>({line:i+1,text}))};
  if ((overrides[key] ?? original).sha256 !== sha256) throw Error(`Source drift: ${original.path}`);
  records.push({ref:key,path:original.path,sha256,commit:(overrides[key]??original).commit});
}
if (refresh) fs.writeFileSync(overridePath, JSON.stringify(overrides,null,2)+'\n');
fs.writeFileSync('docs/review/policy-session-source-audit.json',JSON.stringify({reviewedOn:'2026-11-12',files:records},null,2)+'\n');
console.log(`Verified ${records.length} source references; ${Object.keys(overrides).length} refreshed files.`);
