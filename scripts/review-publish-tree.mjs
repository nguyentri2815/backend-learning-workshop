import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=process.cwd();
const staged=process.argv.includes('--staged');
const candidates=execFileSync('git',staged?['ls-files','--cached','-z']:['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const paths=[...new Set(candidates)].sort(),findings=[],inventory=[];
const rules=[
 ['private-key',/-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
 ['github-token',/\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,})\b/],
 ['gitlab-token',/\bglpat-[A-Za-z0-9_-]{12,}\b/],
 ['cloud-key',/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
 ['slack-token',/\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
 ['jwt-literal',/\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/],
 ['url-userinfo',/\b(?:https?|postgres(?:ql)?|redis|amqps?):\/\/[^\s"'/:@]+:[^\s"'@]+@/],
];
const maxTextBytes=8_000_000;
for(const relative of paths){const body=staged?execFileSync('git',['show',`:${relative}`],{maxBuffer:16_000_000}):fs.readFileSync(path.join(root,relative)),binary=body.subarray(0,4096).includes(0),text=!binary&&body.length<=maxTextBytes?body.toString('utf8'):'';
 const info={path:relative,bytes:body.length,sha256:crypto.createHash('sha256').update(body).digest('hex'),binary,absolutePathMentions:0,internalAddressMentions:0,emailMentions:0,credentialCandidates:0};
 if(text){text.split(/\r?\n/).forEach((line,i)=>{for(const [rule,regex]of rules)if(regex.test(line))findings.push({path:relative,line:i+1,rule,severity:'review',value:'suppressed'});
  info.absolutePathMentions+=(line.match(/\b[A-Z]:[\\/]/g)??[]).length;
  info.internalAddressMentions+=(line.match(/\b(?:10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)\b/g)??[]).length;
  info.emailMentions+=(line.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g)??[]).filter(email=>!/@(?:example\.(?:com|org|net)|test\.invalid)$/i.test(email)).length;
  if(/(?:password|passwd|client-secret|api[_-]?key|access[_-]?token)\s*[=:]\s*["']?\S+/i.test(line)&&!/đã che|redact|match|regex|password\|/.test(line))info.credentialCandidates++;
 });}
 inventory.push(info);
}
fs.mkdirSync('.verification/publication',{recursive:true});
const report={root,mode:staged?'git-index':'working-tree',generatedAt:new Date().toISOString(),files:paths.length,bytes:inventory.reduce((n,f)=>n+f.bytes,0),findings,inventory,rightsReview:{required:true,reason:'Public destination; upstream source/configuration/history excerpts need user confirmation independently of redaction.'},notes:'Potential matches are file/line/rule only. No sensitive values are written or printed. This heuristic scan complements manual review; it is not a guarantee.'};
fs.writeFileSync(`.verification/publication/${staged?'index':'tree'}-review.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({files:report.files,bytes:report.bytes,highSignalFindings:findings,internalAddressFiles:inventory.filter(f=>f.internalAddressMentions).map(f=>({path:f.path,count:f.internalAddressMentions})),nonExampleEmailFiles:inventory.filter(f=>f.emailMentions).map(f=>({path:f.path,count:f.emailMentions})),credentialCandidateFiles:inventory.filter(f=>f.credentialCandidates).map(f=>({path:f.path,count:f.credentialCandidates}))},null,2));
