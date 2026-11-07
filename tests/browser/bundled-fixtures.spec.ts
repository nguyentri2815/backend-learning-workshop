import {expect,test} from "@playwright/test";
import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {createHash} from "node:crypto";
import manifest from "../../fixtures.manifest.json" with {type:"json"};
import {startupSource} from "../../src/setup/startup-log-model";
import {commandCases} from "../../src/setup/command-cases";
import cases from "../../src/content/setup/command-case-source.json" with {type:"json"};
import {visiblePracticeTasks,normalizeContext} from "../../src/setup/project-practice-model";

test("bundled lesson snapshots have reviewed hashes without reading any upstream repo",async()=>{
 const root=resolve(import.meta.dirname,'../..');expect(manifest.files.length).toBeGreaterThan(10);
 for(const file of manifest.files){const bytes=Buffer.from((await readFile(resolve(root,file.path),'utf8')).replace(/\r\n/g,'\n'),'utf8');expect(bytes.length).toBe(file.bytes);expect(createHash('sha256').update(bytes).digest('hex')).toBe(file.sha256);expect(file.path).toMatch(/^src\/content\//);}
});

test("portable startup/case evidence stays bounded and legacy J1 maps to the shared Run result",()=>{
 const known=new Set(startupSource.groups.map(group=>group.id));
 for(const data of startupSource.datasets){for(const row of data.rows){expect(row.line).toBeGreaterThanOrEqual(data.from);expect(row.line).toBeLessThanOrEqual(data.to);expect(known.has(row.group)).toBe(true);}if(data.outcome==='failure')expect(data.rows.some(row=>row.milestone==='started')).toBe(false);}
 for(const item of commandCases){for(const id of item.refs)expect(cases.refs).toHaveProperty(id);expect(item.branches.length).toBeGreaterThan(0);}
 expect(commandCases.filter(item=>item.origin==='recorded').map(item=>item.id)).toEqual(['pg-timeout-recorded']);
 expect(visiblePracticeTasks.map(item=>String(item.id)).includes('verify')).toBe(false);
 const legacy=normalizeContext({task:'verify',sim:undefined});expect(legacy.task).toBe('startup');expect(legacy.runSection).toBe('results');
});
