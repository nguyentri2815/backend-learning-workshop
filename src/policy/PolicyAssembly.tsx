import {lazy, Suspense, useEffect, useRef} from 'react';
import type {ComponentProps} from 'react';
import {ReactFlow, Background, Controls, MarkerType, Position, BaseEdge, EdgeLabelRenderer} from '@xyflow/react';
import type {EdgeProps} from '@xyflow/react';
import {Group, Panel, Separator} from 'react-resizable-panels';
import {BookOpen, GitCompare, Search, Play, Network, X} from 'lucide-react';
import {assemblySteps, assemblyQuestions, components, mechanismNotes, stepDetails} from '../content/policy/assembly';
import sources from '../content/policy/assembly-source.json';
import {LearningSteps} from '../components/LearningSteps';
import {LearningTechnicalReference} from './LearningTechnicalReference';
import {PolicyAssemblyLearning} from './PolicyAssemblyLearning';
import {diffRows} from '../workshop/source';
import './policy-assembly.css';

type SourceKey = keyof typeof sources;
type Source = typeof sources[SourceKey];
const evidenceModes = ['source', 'compare', 'calls', 'ide'];
const CodeBlock = lazy(() => import('../workshop/CodeBlock').then(module => ({default: module.CodeBlock})));
function SourceCode(props: ComponentProps<typeof CodeBlock>) {
  return <Suspense fallback={<p>Đang tô sáng source…</p>}><CodeBlock {...props}/></Suspense>;
}

// Keep return and non-adjacent relationships in side gutters, away from the component cards.
function ResponsibilityEdge({sourceX, sourceY, targetX, targetY, markerEnd, style, label, data}: EdgeProps) {
  const detour = Number(data?.detour ?? 0);
  const routeX = sourceX + detour * 230;
  const middleY = (sourceY + targetY) / 2;
  const path = detour
    ? `M ${sourceX + detour * 150} ${sourceY - 60} H ${routeX} V ${targetY + 60} H ${targetX + detour * 150}`
    : `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
  return <>
    <BaseEdge path={path} markerEnd={markerEnd} style={style}/>
    <EdgeLabelRenderer><div className={`assembly-edge-label ${detour ? 'is-side' : ''}`}
      style={{transform: `translate(-50%, -50%) translate(${detour ? routeX : sourceX}px, ${middleY}px)`}}>{label}</div></EdgeLabelRenderer>
  </>;
}
const edgeTypes = {responsibility: ResponsibilityEdge};

function SourceMetadata({source}: {source: Source}) {
  return <p className="assembly-source-meta">
    <code>{source.path}</code><br/>
    {source.symbol} · <strong>L{source.line}</strong><br/>
    {source.modified ? 'Bản làm việc có thay đổi' : 'Bản làm việc khớp commit'} · HEAD {source.commit.slice(0, 12)} · SHA256 {source.sha256.slice(0, 12)}
  </p>;
}

export function PolicyAssembly({params, update, onRun}: {
  params: URLSearchParams;
  update: (values: Record<string, string | null>) => void;
  onRun: (stage: string, checkpoint: string) => void;
}) {
  const step = assemblySteps.find(s => s.id === (params.get('assemblyStep') ?? params.get('node'))) ?? assemblySteps[0];
  const id = step.nodes.includes(params.get('component') ?? '') ? params.get('component')! : step.nodes[0];
  const component = components[id];
  const context = stepDetails[step.id][id];
  // Explanation state lives in the URL, independently of the simulation's node/at/stop/walk.
  const open = evidenceModes.includes(params.get('assemblyPane') ?? '') ? params.get('assemblyPane')! : '';
  const refs = [...new Set([...(context.refs ?? component.refs), ...component.refs, ...mechanismNotes[id].map(note => note.ref)])];
  const requestedRef = params.get('assemblyRef') ?? '';
  const ref = (open !== 'compare' && refs.includes(requestedRef) ? requestedRef : refs[0]) as SourceKey;
  const source = sources[ref];
  const other = component.comparison ? sources[component.comparison as SourceKey] : undefined;
  const full = params.get('assemblyFull') === '1';
  const rows = full ? source.rows : source.rows.slice(source.from - 1, source.from + 45);
  const evidenceRoot = useRef<HTMLElement>(null);
  const requestedReveal = useRef(false);

  useEffect(() => {
    if (open && requestedReveal.current) {
      evidenceRoot.current?.scrollIntoView({block: 'start', behavior: 'instant'});
      evidenceRoot.current?.focus({preventScroll: true});
    }
    requestedReveal.current = false;
  }, [open, ref]);

  function select(value: string) {
    update({component: value, assemblyRef: null, assemblyPane: null, assemblyFull: null});
  }
  function evidence(mode: string) {
    requestedReveal.current = open !== mode;
    update({assemblyPane: open === mode ? null : mode, assemblyFull: null});
  }

  const nodes = step.nodes.map((key, i) => ({
    id: key,
    position: {x: 150, y: i * 185},
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    data: {label: <><strong>{components[key].name}</strong><small>{components[key].role}</small></>},
    style: {
      width: 300, height: 120, padding: 16, background: key === id ? 'var(--selected)' : 'var(--surface)',
      color: 'var(--text)', border: `${key === id ? 2 : 1}px solid var(--accent-border)`, borderRadius: 5,
    },
  }));
  const edges = step.edges.map(([from, to, label, kind], i) => ({
    id: String(i), source: from, target: to, label, type: 'responsibility',
    data: {detour: Math.abs(step.nodes.indexOf(to) - step.nodes.indexOf(from)) > 1 ? Math.sign(step.nodes.indexOf(to) - step.nodes.indexOf(from)) : 0},
    markerEnd: {type: MarkerType.ArrowClosed, color: 'var(--accent)'},
    style: {stroke: 'var(--accent)', strokeDasharray: kind === 'event' ? '6 4' : undefined},
    labelStyle: {fontSize: 12, fill: 'var(--text)'}, labelBgStyle: {fill: 'var(--surface)'},
  }));

  return <article className="assembly" aria-label="Tư duy lắp ráp">
    <LearningSteps label="Sáu bước tư duy lắp ráp" current={step.id} className="assembly-step-strip"
      items={assemblySteps.map(s => ({id: s.id, title: s.title, complete: false, status: ''}))}
      onSelect={value => update({assemblyStep: value, component: null, assemblyPane: null, assemblyRef: null, assemblyFull: null, assemblyTechnical: null})}/>
    <PolicyAssemblyLearning stepId={step.id} params={params} update={update}/>
    <LearningTechnicalReference open={params.get('assemblyTechnical') === '1' || Boolean(open) || params.has('component')}
      onToggle={event => {
        const expanded = event.currentTarget.open;
        const expected = params.get('assemblyTechnical') === '1' || Boolean(open) || params.has('component');
        if (expanded !== expected) update(expanded ? {assemblyTechnical:'1'} : {assemblyTechnical:null, assemblyPane:null, component:null});
      }}>
    <section className="assembly-reason"><h3>Vì sao cần thiết kế này?</h3><p><strong>{assemblyQuestions[step.id]}</strong></p><p>{step.why}</p></section>
    <label className="assembly-mobile-select">Chọn thành phần
      <select value={id} onChange={e => select(e.target.value)}>
        {step.nodes.map(key => <option key={key} value={key}>{components[key].name}</option>)}
      </select>
    </label>
    <Group className="assembly-layout" orientation="horizontal" id="assembly-panels">
      <Panel className="assembly-map-panel" defaultSize="46%" minSize="28%">
        <section className="assembly-map">
          <h3>Bản đồ thành phần</h3>
          <div className="assembly-canvas" style={{height: step.nodes.length * 185}}>
            <ReactFlow key={step.id} nodes={nodes} edges={edges} edgeTypes={edgeTypes} fitView fitViewOptions={{padding: .16, maxZoom: 1}}
              nodesDraggable={false} nodesConnectable={false} onNodeClick={(_, node) => select(node.id)}
              minZoom={.3} maxZoom={1.5} preventScrolling={false}>
              <Background/><Controls showInteractive={false}/>
            </ReactFlow>
          </div>
          <small>Mũi tên ghi cách kết nối. Lời gọi method thông thường là đồng bộ; nhãn executor chỉ công việc giao cho callback. Nét đứt: quan hệ qua event, chưa nối đủ phía phát; không biểu thị thời gian so với HTTP.</small>
          <nav aria-label="Thành phần trong bước">
            {step.nodes.map(key => <button key={key} aria-pressed={key === id} onClick={() => select(key)}>{components[key].name}</button>)}
          </nav>
        </section>
      </Panel>
      <Separator className="assembly-resize" aria-label="Đổi độ rộng bản đồ và giải thích"/>
      <Panel className="assembly-detail-panel" minSize="35%">
        <section className="assembly-detail" aria-live="polite">
          <span className="eyebrow">VAI TRÒ → CÁCH LẮP → TRIỂN KHAI</span>
          <h3>{component.name}</h3><p className="assembly-role">{component.role}</p>
          <p><strong>Ở bước này:</strong> {context.why}</p>
          <dl>
            <dt>Nhận gì?</dt><dd>{component.input}</dd>
            <dt>Trả gì / tạo ra gì?</dt><dd>{component.output}</dd>
            <dt>Ai gọi / gọi ai?</dt><dd>{component.connections}</dd>
          </dl>
          <div className="assembly-decisions">
            {[['Dùng lại', component.reuse], ['Theo khung', component.frame], ['Theo nghiệp vụ', component.business]]
              .map(([label, text]) => <p key={label}><strong>{label}</strong>{text}</p>)}
          </div>
          <details className="assembly-mechanisms" key={id}>
            <summary>Cơ chế này đến từ đâu?</summary>
            {mechanismNotes[id].map(note => <p key={note.kind}>
              <strong>{note.kind}</strong> · {note.text}{' '}
              <button onClick={() => {
                requestedReveal.current = true;
                update({assemblyPane: 'source', assemblyRef: note.ref, assemblyFull: null});
              }}>Bằng chứng · L{sources[note.ref as SourceKey].line}</button>
            </p>)}
          </details>
          <div className="assembly-actions">
            <button aria-expanded={open === 'source'} onClick={() => evidence('source')}><BookOpen size={15}/>Xem mẫu thật</button>
            <button aria-expanded={open === 'compare'} onClick={() => evidence('compare')}><GitCompare size={15}/>So với mẫu khác</button>
            <button aria-expanded={open === 'calls'} onClick={() => evidence('calls')}><Network size={15}/>Ai gọi / gọi ai</button>
            <button aria-expanded={open === 'ide'} onClick={() => evidence('ide')}><Search size={15}/>Tìm trong IDE</button>
            <button onClick={() => onRun(step.id, context.checkpoint ?? step.checkpoint)}><Play size={15}/>Xem khi chạy</button>
          </div>
          {component.limit && <p className="assembly-limit"><strong>Giới hạn xác minh</strong> {component.limit}</p>}
        </section>
      </Panel>
    </Group>
    {open && <section ref={evidenceRoot} tabIndex={-1} className="assembly-evidence" aria-label="Bằng chứng source">
      <header>
        <h3>{open === 'compare' ? 'Đối chiếu hai mẫu đã đọc' : open === 'ide' ? 'Tự tìm mẫu trong IDE' : open === 'calls' ? 'Theo các điểm kết nối' : 'Mẫu source thật'}</h3>
        <button onClick={() => update({assemblyPane: null})}><X size={15}/>Đóng source</button>
      </header>
      {open === 'ide' ? <>
        <p>Tìm file <code>{source.path}</code> bằng Navigate → File. Tìm symbol <code>{source.symbol}</code>.</p>
        <ol>
          <li>Go to Definition tại lời gọi để tìm khai báo và kiểm tra import đầy đủ.</li>
          <li>Go to Implementation tại repository/interface hoặc lớp nền; không kết luận từ tên method.</li>
          <li>Find Usages tại symbol để tìm nơi gọi và một mẫu gần nhất trong cùng module.</li>
        </ol>
        <p>Đối chiếu <code>{other?.symbol ?? 'các lời gọi trong component này'}</code>. {component.different}</p>
      </> : <>
        {open === 'calls' && <p>{component.connections} Chọn các bằng chứng dưới đây để lần từ nơi gọi tới lớp nền.</p>}
        {open === 'compare' && <>
          <p><strong>Giống:</strong> {component.similar}</p>
          <p><strong>Khác:</strong> {component.different}</p>
          {!other && <p>Chưa có mẫu phù hợp được xác minh; không dựng source thay thế.</p>}
        </>}
        {open !== 'compare' && <label>Bằng chứng
          <select value={ref} onChange={e => update({assemblyRef: e.target.value, assemblyFull: null})}>
            {refs.map(key => <option key={key} value={key}>{sources[key as SourceKey].symbol}</option>)}
          </select>
        </label>}
        <button className="assembly-expand-source" onClick={() => update({assemblyFull: full ? null : '1'})}>
          {full ? 'Đoạn liên quan' : 'Mở toàn bộ file'}
        </button>
        <div className="assembly-source-columns">
          <div><SourceMetadata source={source}/><div className="assembly-code">
            <SourceCode key={`${ref}:${full}`} rows={rows} path={source.path} scrollAnchor={source.line}
              memoryKey={`assembly:${step.id}:${ref}:${full}`}/>
          </div></div>
          {open === 'compare' && other && <div><SourceMetadata source={other}/><div className="assembly-code">
            <SourceCode key={`${component.comparison}:${full}`} rows={full ? other.rows : other.rows.slice(other.from - 1, other.from + 45)} path={other.path} scrollAnchor={other.line}
              memoryKey={`assembly:comparison:${component.comparison}:${full}`}/>
          </div></div>}
        </div>
        {open === 'compare' && other && <details>
          <summary>Diff văn bản hỗ trợ quan sát · khác tên không đồng nghĩa khác kiến trúc</summary>
          <div className="assembly-code"><SourceCode diff
            rows={diffRows(source.path, rows.map(r => r.text).join('\n'), (full ? other.rows : other.rows.slice(other.from - 1, other.from + 45)).map(r => r.text).join('\n'))}
            path={source.path} memoryKey={`assembly:diff:${ref}:${component.comparison}:${full}`}/></div>
        </details>}
      </>}
    </section>}
    <section className="assembly-transfer">
      <h3>Gặp tính năng tương tự, bắt đầu từ đâu?</h3><p>{step.transfer}</p>
      <p>Đầu vào → trách nhiệm → mẫu gần nhất → phần dùng lại → phần nghiệp vụ → đầu ra cho bước sau.</p>
    </section>
    </LearningTechnicalReference>
  </article>;
}
