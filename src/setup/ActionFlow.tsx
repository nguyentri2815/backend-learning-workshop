import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Background, BackgroundVariant, getViewportForBounds, Handle, MarkerType, Panel, Position, ReactFlow, ReactFlowProvider, useNodesInitialized, useReactFlow } from "@xyflow/react";
import type { Edge, Node, NodeProps, Viewport } from "@xyflow/react";
import { Check, ChevronRight, CircleHelp, Minus, Plus } from "lucide-react";
import { actionSteps } from "../content/setup/action-guide";
import type { ActionStepId } from "../content/setup/action-guide";
import { statusLabels } from "./progress";
import type { StepStatus } from "./progress";
import { guideConnections, guidePositions } from "./flow-layout";
import "@xyflow/react/dist/style.css";

export interface GuideFlowProps {
  selected: ActionStepId;
  next: ActionStepId | null;
  statuses: Record<ActionStepId, StepStatus>;
  counts: Record<ActionStepId, number>;
  onSelect: (id: ActionStepId) => void;
  fitSignal: number;
  focusSignal: number;
}
export function ActionNodeCard({ id, selected, next, status, count }: {
  id: ActionStepId; selected: boolean; next: boolean; status: StepStatus; count: number;
}) {
  const index = actionSteps.findIndex(step => step.id === id);
  const step = actionSteps[index];
  return <div className={`guide-node-card ${status} ${selected ? "is-selected" : ""} ${next ? "is-next" : ""}`}>
    <span className="guide-node-number">{status === "checked" ? <Check size={16} /> : String(index + 1).padStart(2, "0")}</span>
    <div><b>{step.shortTitle}</b><span className="guide-node-status">{status === "needs-info" && <CircleHelp size={12} />}{statusLabels[status]}</span></div>
    <small>{count}/{step.checks.length}</small>
    {selected && <span className="guide-node-hint">Đang xem</span>}
    {!selected && next && <span className="guide-node-hint">Tiếp theo</span>}
  </div>;
}
export function OrderedGuide({ selected, next, statuses, counts, onSelect }: Omit<GuideFlowProps, "fitSignal" | "focusSignal">) {
  return <ol className="guide-ordered-steps" aria-label="Bảy bước chạy dự án">{actionSteps.map(step => <li key={step.id}><button aria-current={selected === step.id ? "step" : undefined} aria-label={`Bước ${actionSteps.indexOf(step)+1}: ${step.title}`} onClick={() => onSelect(step.id)}><ActionNodeCard id={step.id} selected={selected === step.id} next={next === step.id} status={statuses[step.id]} count={counts[step.id]} /><ChevronRight size={15} /></button></li>)}</ol>;
}
export const GRAPH_VIEWPORT_KEY = "backend-learning-workshop.setup-flow-viewport.v1";
const nodeWidth = 235;
const nodeHeight = 88;
const minZoom = 0.45;
const maxZoom = 1.7;
let sessionViewport: Viewport | null = null;

function loadViewport(): Viewport | null {
  if (sessionViewport) return sessionViewport;
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(GRAPH_VIEWPORT_KEY) ?? "null");
    if (value && typeof value === "object" && "x" in value && "y" in value && "zoom" in value &&
      typeof value.x === "number" && Number.isFinite(value.x) && Math.abs(value.x) < 10000 &&
      typeof value.y === "number" && Number.isFinite(value.y) && Math.abs(value.y) < 10000 &&
      typeof value.zoom === "number" && value.zoom >= minZoom && value.zoom <= maxZoom)
      return { x: value.x, y: value.y, zoom: value.zoom };
  } catch { /* The graph works without storage. */ }
  return null;
}
function rememberViewport(viewport: Viewport) {
  sessionViewport = viewport;
  try { sessionStorage.setItem(GRAPH_VIEWPORT_KEY, JSON.stringify(viewport)); } catch { /* Keep this session in memory. */ }
}
const sidePositions = { left: Position.Left, right: Position.Right, top: Position.Top, bottom: Position.Bottom };
type GuideNodeData = {
  actionId: ActionStepId;
  isCurrent: boolean;
  isNext: boolean;
  status: StepStatus;
  count: number;
  incoming: Position;
  outgoing: Position;
  choose: (id: ActionStepId) => void;
};
type GuideNode = Node<GuideNodeData, "action">;
function GuideNodeView({ data }: NodeProps<GuideNode>) {
  const index = actionSteps.findIndex(step => step.id === data.actionId);
  return <>
    <Handle id="in" type="target" position={data.incoming} isConnectable={false} className="guide-flow-handle" />
    <button className="guide-flow-node-button nodrag nopan" onClick={() => data.choose(data.actionId)} aria-label={`Bước ${index+1}: ${actionSteps[index].title}`} aria-current={data.isCurrent ? "step" : undefined}>
      <ActionNodeCard id={data.actionId} selected={data.isCurrent} next={data.isNext} status={data.status} count={data.count} />
    </button>
    <Handle id="out" type="source" position={data.outgoing} isConnectable={false} className="guide-flow-handle" />
  </>;
}
const nodeTypes = { action: GuideNodeView };

function InteractiveFlow({ selected, next, statuses, counts, onSelect, fitSignal, focusSignal }: GuideFlowProps) {
  const flow = useReactFlow<GuideNode>();
  // All seven fixed nodes must have dimensions and handle bounds before placement.
  const nodesReady = useNodesInitialized({ includeHiddenNodes: true });
  const initial = useRef(loadViewport()).current;
  const initialized = useRef(false);
  const [ready, setReady] = useState(false);
  const [viewport, setViewport] = useState<Viewport>(initial ?? { x: 0, y: 0, zoom: 1 });
  const previousFit = useRef(fitSignal);
  const previousFocus = useRef(focusSignal);
  const canvas = useRef<HTMLDivElement>(null);
  const showOverview = useCallback(() => {
    const element = canvas.current;
    if (!element) return Promise.resolve(false);
    const bounds = flow.getNodesBounds(actionSteps.map(step => step.id));
    const target = getViewportForBounds(bounds, element.clientWidth, element.clientHeight, minZoom, 1, 0.1);
    // Set the viewport directly: this graph's controlled nodes are not layout-editable.
    return flow.setViewport(target, { duration: 0 });
  }, [flow]);
  const nodes = useMemo<GuideNode[]>(() => actionSteps.map(step => ({
    id: step.id,
    type: "action",
    position: guidePositions[step.id],
    width: nodeWidth,
    height: nodeHeight,
    draggable: false,
    connectable: false,
    focusable: false,
    data: {
      actionId: step.id,
      isCurrent: selected === step.id,
      isNext: next === step.id,
      status: statuses[step.id],
      count: counts[step.id],
      incoming: sidePositions[guideConnections.find(edge => edge.to === step.id)?.toSide ?? "left"],
      outgoing: sidePositions[guideConnections.find(edge => edge.from === step.id)?.fromSide ?? "bottom"],
      choose: onSelect,
    },
  })), [selected, next, statuses, counts, onSelect]);
  const edges = useMemo<Edge[]>(() => guideConnections.map(connection => ({
    id: `${connection.from}-${connection.to}`,
    source: connection.from,
    target: connection.to,
    sourceHandle: "out",
    targetHandle: "in",
    type: "smoothstep",
    pathOptions: { borderRadius: 16, offset: 20 },
    focusable: false,
    selectable: false,
    markerEnd: { type: MarkerType.ArrowClosed, color: connection.from === selected ? "var(--accent)" : "var(--accent-border)", width: 18, height: 18 },
    style: { stroke: connection.from === selected ? "var(--accent)" : "var(--accent-border)", strokeWidth: connection.from === selected ? 2.1 : 1.7 },
    ariaLabel: `Thứ tự đề xuất: ${actionSteps.find(step => step.id === connection.from)?.shortTitle} đến ${actionSteps.find(step => step.id === connection.to)?.shortTitle}`,
  })), [selected]);

  useEffect(() => {
    if (!nodesReady || !flow.viewportInitialized || initialized.current) return;
    initialized.current = true;
    // Exactly one initial placement; status/content changes never refit the graph.
    void (initial ? flow.setViewport(initial, { duration: 0 }) : showOverview()).then(() => {
      const current = flow.getViewport();
      setViewport(current);
      rememberViewport(current);
      setReady(true);
    });
  }, [nodesReady, flow, initial, showOverview]);
  useEffect(() => {
    if (!ready || fitSignal === previousFit.current) return;
    previousFit.current = fitSignal;
    void showOverview();
  }, [ready, fitSignal, showOverview]);
  useEffect(() => {
    if (!ready || focusSignal === previousFocus.current) return;
    previousFocus.current = focusSignal;
    const position = guidePositions[selected];
    void flow.setCenter(position.x + nodeWidth/2, position.y + nodeHeight/2, { zoom: flow.getViewport().zoom, duration: 0 });
  }, [ready, focusSignal, selected, flow]);

  return <div ref={canvas} className="guide-graph" data-testid="setup-graph" data-ready={ready} data-nodes-ready={nodesReady} data-viewport-ready={flow.viewportInitialized} data-viewport={JSON.stringify(viewport)} aria-label="Graph tương tác bảy bước chạy dự án">
    <ReactFlow<GuideNode> id="setup-action-flow" nodes={nodes} edges={edges} nodeTypes={nodeTypes}
      defaultViewport={initial ?? undefined} minZoom={minZoom} maxZoom={maxZoom}
      nodesDraggable={false} nodesConnectable={false} nodesFocusable={false} edgesFocusable={false}
      elementsSelectable={false} autoPanOnNodeFocus={false} selectNodesOnDrag={false}
      panOnDrag panOnScroll={false} zoomOnScroll zoomOnDoubleClick={false} preventScrolling
      deleteKeyCode={null} onMove={(_, value) => setViewport(value)} onMoveEnd={(_, value) => rememberViewport(value)}
      aria-label="Lộ trình đề xuất từ kiểm tra source đến sẵn sàng làm task">
      <Background variant={BackgroundVariant.Dots} color="var(--line)" gap={20} size={1} />
      <Panel position="bottom-left" className="guide-graph-tools"><div><button type="button" aria-label="Phóng to flow" title="Phóng to" disabled={!ready} onClick={() => void flow.zoomIn({ duration: 0 })}><Plus size={16} /></button><span aria-label="Tỷ lệ zoom">{Math.round(viewport.zoom*100)}%</span><button type="button" aria-label="Thu nhỏ flow" title="Thu nhỏ" disabled={!ready} onClick={() => void flow.zoomOut({ duration: 0 })}><Minus size={16} /></button></div><small>Kéo nền để di chuyển · cuộn để zoom</small></Panel>
    </ReactFlow>
  </div>;
}
export function ActionFlow(props: GuideFlowProps) {
  const [compact, setCompact] = useState(() => window.matchMedia("(max-width: 1100px)").matches);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1100px)");
    const change = () => setCompact(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  return compact ? <OrderedGuide {...props} /> : <ReactFlowProvider><InteractiveFlow {...props} /></ReactFlowProvider>;
}
