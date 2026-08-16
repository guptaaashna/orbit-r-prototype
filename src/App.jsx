import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Satellite, RadioTower, AlertTriangle, Activity, Zap, CheckCircle2,
  XCircle, TrendingUp, Play, Gauge, ChevronRight, Download, X, Info,
  Sparkles, RefreshCw, Target, Layers, Clock, ArrowRight, Star,
  ShieldAlert, Radio, ListChecks, FileText, RotateCcw, TowerControl,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

/* =========================================================================
   ORBIT-R — Operational Resilience & Backup Intelligence for Space Missions
   Mission-control prototype. Single scenario: EO-MISSION-01 / C03 failure.
   ========================================================================= */

/* ---------------------------- design tokens ---------------------------- */
const C = {
  bg: "#050810",
  bgPanel: "rgba(13,20,34,0.72)",
  bgPanelSolid: "#0b1220",
  hairline: "rgba(120,160,210,0.14)",
  cyan: "#39C7F0",
  cyanDim: "rgba(57,199,240,0.35)",
  blue: "#5B8DEF",
  amber: "#F0A93E",
  red: "#F14C5A",
  green: "#38D993",
  purple: "#B18CFF",
  textHi: "#EAF2FB",
  textMid: "#9FB4CC",
  textLo: "#5E7089",
};

const STATUS_STYLE = {
  ok: { stroke: C.cyan, fill: "rgba(57,199,240,0.08)", text: C.cyan, glow: "0 0 0 rgba(0,0,0,0)" },
  warning: { stroke: C.amber, fill: "rgba(240,169,62,0.12)", text: C.amber, glow: `0 0 14px rgba(240,169,62,0.35)` },
  critical: { stroke: C.red, fill: "rgba(241,76,90,0.14)", text: C.red, glow: `0 0 18px rgba(241,76,90,0.45)` },
  recovered: { stroke: C.purple, fill: "rgba(177,140,255,0.12)", text: C.purple, glow: `0 0 14px rgba(177,140,255,0.35)` },
};

/* ------------------------------ scenario -------------------------------- */
const SATELLITES = [
  { id: "SAT-01", x: 130 },
  { id: "SAT-02", x: 410 },
  { id: "SAT-03", x: 690 },
  { id: "SAT-04", x: 970 },
];
const LINKS = [
  { id: "C01", x: 90, sat: "SAT-01", gs: "GS-01" },
  { id: "C02", x: 230, sat: "SAT-01", gs: "GS-02" },
  { id: "C03", x: 370, sat: "SAT-02", gs: "GS-01" },
  { id: "C04", x: 510, sat: "SAT-02", gs: "GS-03" },
  { id: "C05", x: 650, sat: "SAT-03", gs: "GS-02" },
  { id: "C06", x: 790, sat: "SAT-03", gs: "GS-01" },
  { id: "C07", x: 930, sat: "SAT-04", gs: "GS-03" },
  { id: "C08", x: 1070, sat: "SAT-04", gs: "GS-02" },
];
const GROUND = [
  { id: "GS-01", x: 230 },
  { id: "GS-02", x: 650 },
  { id: "GS-03", x: 990 },
];
const TASKS = [
  { id: "T02", x: 100, from: "GS-01" },
  { id: "T07", x: 220, from: "GS-01" },
  { id: "T11", x: 340, from: "GS-01" },
  { id: "T14", x: 430, from: "SAT-02" },
  { id: "T04", x: 560, from: "GS-02" },
  { id: "T09", x: 650, from: "GS-02" },
  { id: "T18", x: 740, from: "GS-02" },
  { id: "T21", x: 990, from: "GS-03" },
];

const Y_SAT = 46, Y_LINK = 178, Y_GS = 312, Y_TASK = 452;
const FAILED_LINK = "C03";
const IMPACT_SAT = "SAT-02";
const IMPACT_GS = "GS-01";
const CRITICAL_TASKS = ["T07", "T11"];
const AT_RISK_TASKS = ["T02", "T07", "T11", "T14", "T09", "T18"];

const centerOf = (type, id) => {
  if (type === "sat") { const n = SATELLITES.find((s) => s.id === id); return { x: n.x, y: Y_SAT }; }
  if (type === "link") { const n = LINKS.find((s) => s.id === id); return { x: n.x, y: Y_LINK }; }
  if (type === "gs") { const n = GROUND.find((s) => s.id === id); return { x: n.x, y: Y_GS }; }
  if (type === "task") { const n = TASKS.find((s) => s.id === id); return { x: n.x, y: Y_TASK }; }
};

function isPostFailure(phase) { return ["failed", "plans", "executing", "stabilized"].includes(phase); }

function satStatus(id, phase) {
  if (id !== IMPACT_SAT || !isPostFailure(phase)) return "ok";
  return phase === "stabilized" ? "recovered" : "warning";
}
function gsStatus(id, phase) {
  if (id !== IMPACT_GS || !isPostFailure(phase)) return "ok";
  return phase === "stabilized" ? "recovered" : "warning";
}
function linkStatus(id, phase) {
  if (id !== FAILED_LINK || !isPostFailure(phase)) return "ok";
  return "critical"; // stays failed forever, even after recovery
}
function taskStatus(id, phase) {
  if (!isPostFailure(phase)) return "ok";
  if (phase === "stabilized") return AT_RISK_TASKS.includes(id) ? "recovered" : "ok";
  if (CRITICAL_TASKS.includes(id)) return "critical";
  if (AT_RISK_TASKS.includes(id)) return "warning";
  return "ok";
}
const SEV = { ok: 0, recovered: 1, warning: 2, critical: 3 };
function combine(a, b) { return SEV[a] >= SEV[b] ? a : b; }

/* ------------------------------- metrics --------------------------------- */
const NOMINAL_M = { health: 100, sats: 4, gsCount: 3, links: 8, active: 24, critical: 10, resources: 91 };
const FAILED_M = { health: 58, sats: 3, gsCount: 2, links: 7, active: 15, critical: 6, resources: 62 };
const RECOVERED_M = { health: 94, sats: 4, gsCount: 3, links: 7, active: 22, critical: 10, resources: 78 };
function metricsFor(phase) {
  if (phase === "stabilized") return RECOVERED_M;
  if (isPostFailure(phase)) return FAILED_M;
  return NOMINAL_M;
}

const RESOURCE_ROWS = [
  { key: "Bandwidth", value: 62 },
  { key: "Computing", value: 71 },
  { key: "Power", value: 84 },
  { key: "Ground Capacity", value: 55 },
  { key: "Satellite Capacity", value: 68 },
];
const CRITICALITY_ROWS = [
  { id: "SAT-02", score: 0.94 },
  { id: "GS-01", score: 0.87 },
  { id: "C03", score: 0.82 },
  { id: "SAT-01", score: 0.61 },
];
const PLANS = [
  { key: "A", name: "Communication Reroute", value: 91, critRecovered: "5/6", risk: "Low", cost: "Medium", time: "8 min", score: 91.4 },
  { key: "B", name: "Task Reprioritization", value: 82, critRecovered: "4/6", risk: "Medium", cost: "Low", time: "5 min", score: 82.7 },
  { key: "C", name: "Multi-Resource Reallocation", value: 94, critRecovered: "6/6", risk: "Low", cost: "High", time: "11 min", score: 94.2, best: true },
];
const EXEC_STEPS = [
  "Rerouting communication",
  "Reallocating bandwidth",
  "Reassigning satellite capacity",
  "Updating ground-station workload",
  "Reprioritizing tasks",
  "Validating dependencies",
  "Verifying mission continuity",
];
const DEMO_LABELS = ["NOMINAL", "FAILURE", "PROPAGATION", "IMPACT", "RESOURCE ANALYSIS", "RECOVERY PLANS", "BEST PLAN", "EXECUTION", "STABILIZED"];

/* ------------------------------- utilities -------------------------------- */
function useCountUp(target, duration = 650) {
  const [val, setVal] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const start = prev.current;
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(start + (target - start) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

/* ================================ APP ==================================== */
export default function App() {
  const [phase, setPhase] = useState("nominal");
  const [failureKind, setFailureKind] = useState("link");
  const [demoMode, setDemoMode] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [execIdx, setExecIdx] = useState(-1);
  const [toasts, setToasts] = useState([]);
  const [health, setHealth] = useState([{ t: "T-0", v: 100 }]);
  const timers = useRef([]);
  const graphRef = useRef(null);
  const optimizerRef = useRef(null);
  const execRef = useRef(null);
  const stableRef = useRef(null);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => clearTimers(), []);

  const push = useCallback((msg, kind = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, kind }]);
    const tm = setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
    timers.current.push(tm);
  }, []);

  const scrollTo = (ref) => {
    const tm = setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
    timers.current.push(tm);
  };

  /* --- handlers --- */
  const openInjector = () => setPhase("injector");
  const closeInjector = () => setPhase("nominal");

  const injectFailure = () => {
    setPhase("failed");
    setHealth((h) => [...h, { t: "FAILURE", v: 58 }]);
    push("FAILURE DETECTED — C03 Communication Link", "critical");
    timers.current.push(setTimeout(() => push("Cascade: SAT-02 / GS-01 dependency impact", "warning"), 900));
    timers.current.push(setTimeout(() => push("6 mission tasks at risk — 2 critical", "warning"), 1900));
    scrollTo(graphRef);
  };

  const generatePlans = () => {
    setPhase("plans");
    push("3 recovery plans generated", "info");
    scrollTo(optimizerRef);
  };

  const executeBestPlan = () => {
    setPhase("executing");
    setExecIdx(0);
    push("Executing Plan C — Multi-Resource Reallocation", "purple");
    scrollTo(execRef);
    EXEC_STEPS.forEach((_, i) => {
      const tm = setTimeout(() => {
        setExecIdx(i);
        if (i === EXEC_STEPS.length - 1) {
          const tm2 = setTimeout(() => stabilize(), 750);
          timers.current.push(tm2);
        }
      }, 520 * (i + 1));
      timers.current.push(tm);
    });
  };

  const stabilize = () => {
    setPhase("stabilized");
    setHealth((h) => [...h, { t: "RECOVERY", v: 94 }]);
    push("MISSION STABILIZED — 94% mission value retained", "success");
    scrollTo(stableRef);
  };

  const resetAll = () => {
    clearTimers();
    setPhase("nominal");
    setExecIdx(-1);
    setHealth([{ t: "T-0", v: 100 }]);
    setDemoMode(false);
    setDemoStep(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const runDemo = () => {
    clearTimers();
    setPhase("nominal");
    setExecIdx(-1);
    setHealth([{ t: "T-0", v: 100 }]);
    setDemoMode(true);
    setDemoStep(0);
    const at = (ms, fn) => timers.current.push(setTimeout(fn, ms));
    at(900, () => { setDemoStep(1); openInjector(); });
    at(2400, () => injectFailure());
    at(3600, () => setDemoStep(2));
    at(5200, () => setDemoStep(3));
    at(6800, () => setDemoStep(4));
    at(8400, () => { setDemoStep(5); generatePlans(); });
    at(9800, () => setDemoStep(6));
    at(11400, () => { setDemoStep(7); executeBestPlan(); });
    at(11400 + 520 * EXEC_STEPS.length + 1300, () => setDemoStep(8));
  };

  const exportReport = () => {
    const body = `ORBIT-R MISSION REPORT
Mission: EO-MISSION-01
Generated: ${new Date().toLocaleString()}

Failure: C03 Communication Link
Propagation: 7 affected components (2 direct, 5 indirect)
Mission Tasks at Risk: 6
Critical Tasks at Risk: 2

Selected Plan: Multi-Resource Reallocation (Plan C)
Recovery Score: 94.2
Mission Value Retained: 94%
Critical Tasks Recovered: 6/6
Recovery Time: 11 min

Mission Health: 100% -> 58% -> 94%
Active Tasks: 24 -> 15 -> 22
Critical Tasks: 10 -> 6 -> 10
Resource Availability: 91% -> 62% -> 78%

Outcome: Mission Stabilized
Note: C03 remains failed. Recovery was achieved through surviving
resources and alternate routing, not component repair.

-- ORBIT-R Optimization / Decision Engine --
`;
    const blob = new Blob([body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "orbitr_mission_report.txt"; a.click();
    URL.revokeObjectURL(url);
    push("Mission report exported", "info");
  };

  const m = metricsFor(phase);
  const showPostFailure = isPostFailure(phase);
  const showOptimizer = ["plans", "executing", "stabilized"].includes(phase);
  const showExec = ["executing", "stabilized"].includes(phase);
  const showStable = phase === "stabilized";

  return (
    <div className="min-h-screen w-full font-sans relative" style={{ background: C.bg, color: C.textHi }}>
      <BackgroundGrid />
      <ToastStack toasts={toasts} />
      <TopBar
        phase={phase} demoMode={demoMode} demoStep={demoStep}
        onRunDemo={runDemo} onReset={resetAll}
      />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 pb-28 pt-6 space-y-7 relative z-10">
        <MissionControl metrics={m} phase={phase} onSimulate={openInjector} />

        <div ref={graphRef}>
          <DependencyGraphPanel phase={phase} />
        </div>

        {showPostFailure && (
          <div className="grid lg:grid-cols-3 gap-5">
            <PropagationPanel phase={phase} health={health} />
            <CriticalityPanel />
            <ResourcePanel />
          </div>
        )}

        <div ref={optimizerRef}>
          {isPostFailure(phase) && (
            <RecoveryOptimizer phase={phase} onGenerate={generatePlans} onExecute={executeBestPlan} />
          )}
        </div>

        <div ref={execRef}>
          {showExec && <ExecutionTimeline execIdx={execIdx} phase={phase} />}
        </div>

        <div ref={stableRef}>
          {showStable && (
            <>
              <StabilizedBanner />
              <ComparisonTable phase={phase} />
              <MissionReportPanel onExport={exportReport} />
            </>
          )}
        </div>
      </main>

      <FailureInjector
        open={phase === "injector"}
        kind={failureKind} setKind={setFailureKind}
        onInject={injectFailure} onClose={closeInjector}
      />

      <style>{`
        @keyframes dashflow { to { stroke-dashoffset: -24; } }
        @keyframes ripple { 0% { r: 8; opacity: .9; } 100% { r: 60; opacity: 0; } }
        @keyframes fadeSlideUp { from { opacity:0; transform: translateY(14px);} to {opacity:1; transform: translateY(0);} }
        @keyframes pulseGlow { 0%,100% { filter: drop-shadow(0 0 2px currentColor);} 50% { filter: drop-shadow(0 0 9px currentColor);} }
        @keyframes toastIn { from { opacity:0; transform: translateX(24px);} to {opacity:1; transform: translateX(0);} }
        @keyframes scan { 0% { transform: translateY(-100%);} 100% { transform: translateY(100%);} }
        @keyframes countPulse { 0% { transform: scale(1);} 40% { transform: scale(1.06);} 100% { transform: scale(1);} }
        .fade-in { animation: fadeSlideUp .5s ease both; }
        .edge-live { stroke-dasharray: 6 6; animation: dashflow 1s linear infinite; }
        .node-pulse { animation: pulseGlow 1.6s ease-in-out infinite; }
        * { scrollbar-width: thin; scrollbar-color: rgba(57,199,240,0.3) transparent; }
      `}</style>
    </div>
  );
}

/* ============================ shared bits ================================ */

function BackgroundGrid() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(${C.hairline} 1px, transparent 1px), linear-gradient(90deg, ${C.hairline} 1px, transparent 1px)`,
        backgroundSize: "42px 42px",
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
      }} />
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse 60% 40% at 50% -10%, rgba(57,199,240,0.10), transparent 60%)`,
      }} />
    </div>
  );
}

function StatusDot({ status }) {
  const s = STATUS_STYLE[status];
  return <span className="inline-block w-2 h-2 rounded-full" style={{ background: s.stroke, boxShadow: s.glow }} />;
}

function ToastStack({ toasts }) {
  const colorFor = (kind) => ({
    critical: C.red, warning: C.amber, success: C.green, purple: C.purple, info: C.cyan,
  }[kind] || C.cyan);
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-[92vw] sm:w-80">
      {toasts.map((t) => (
        <div key={t.id} className="rounded-lg px-4 py-3 text-sm backdrop-blur-md"
          style={{
            background: C.bgPanel, border: `1px solid ${colorFor(t.kind)}55`,
            color: C.textHi, animation: "toastIn .3s ease both",
            boxShadow: `0 8px 24px rgba(0,0,0,0.4)`,
          }}>
          <div className="flex items-start gap-2">
            <span className="mt-1"><StatusDot status={t.kind === "success" ? "recovered" : t.kind === "critical" ? "critical" : t.kind === "warning" ? "warning" : "ok"} /></span>
            <span style={{ color: C.textHi }}>{t.msg}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionLabel({ eyebrow, title, right }) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
      <div>
        <div className="text-xs tracking-[0.2em] font-mono mb-1" style={{ color: C.cyan }}>{eyebrow}</div>
        <h2 className="text-lg sm:text-xl font-semibold tracking-tight" style={{ color: C.textHi }}>{title}</h2>
      </div>
      {right}
    </div>
  );
}

function Panel({ children, className = "", style = {} }) {
  return (
    <div className={`rounded-2xl p-5 backdrop-blur-md ${className}`}
      style={{ background: C.bgPanel, border: `1px solid ${C.hairline}`, ...style }}>
      {children}
    </div>
  );
}

/* ================================ top bar ================================= */

function TopBar({ phase, demoMode, demoStep, onRunDemo, onReset }) {
  const phaseLabel = {
    nominal: "NOMINAL", injector: "FAILURE INJECTION", failed: "FAILURE DETECTED",
    plans: "OPTIMIZING RECOVERY", executing: "EXECUTING RECOVERY", stabilized: "MISSION STABILIZED",
  }[phase];
  const phaseColor = {
    nominal: C.cyan, injector: C.amber, failed: C.red, plans: C.purple, executing: C.purple, stabilized: C.green,
  }[phase];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md" style={{ background: "rgba(5,8,16,0.82)", borderBottom: `1px solid ${C.hairline}` }}>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg grid place-items-center" style={{ border: `1px solid ${C.cyanDim}`, background: "rgba(57,199,240,0.08)" }}>
            <Satellite size={18} color={C.cyan} />
          </div>
          <div>
            <div className="text-sm font-bold tracking-wide leading-none" style={{ color: C.textHi }}>ORBIT-R</div>
            <div className="text-[11px] font-mono leading-none mt-1" style={{ color: C.textLo }}>EO-MISSION-01 · SIH26_70</div>
          </div>
          <div className="hidden sm:flex items-center gap-2 ml-4 pl-4" style={{ borderLeft: `1px solid ${C.hairline}` }}>
            <span className="w-1.5 h-1.5 rounded-full node-pulse" style={{ background: phaseColor, color: phaseColor }} />
            <span className="text-xs font-mono tracking-wider" style={{ color: phaseColor }}>{phaseLabel}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {demoMode && (
            <div className="hidden md:flex items-center gap-2 text-[11px] font-mono px-3 py-1.5 rounded-full" style={{ border: `1px solid ${C.cyanDim}`, color: C.cyan }}>
              STEP {demoStep + 1}/9 — {DEMO_LABELS[demoStep]}
            </div>
          )}
          {phase !== "nominal" && (
            <button onClick={onReset} className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition hover:opacity-80"
              style={{ border: `1px solid ${C.hairline}`, color: C.textMid }}>
              <RotateCcw size={13} /> Reset
            </button>
          )}
          <button onClick={onRunDemo} className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg transition hover:brightness-110"
            style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: "#04121C" }}>
            <Play size={13} fill="#04121C" /> Run Live Demo
          </button>
        </div>
      </div>
    </header>
  );
}

/* ============================ mission control ============================= */

function StatCard({ icon: Icon, label, value, suffix = "", color = C.cyan, sub }) {
  const disp = useCountUp(typeof value === "number" ? value : 0);
  return (
    <div className="rounded-xl px-4 py-3 flex flex-col gap-1.5" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
      <div className="flex items-center gap-1.5" style={{ color: C.textLo }}>
        <Icon size={13} />
        <span className="text-[10.5px] font-mono tracking-wider uppercase">{label}</span>
      </div>
      <div className="text-2xl font-bold font-mono leading-none" style={{ color }}>
        {typeof value === "number" ? Math.round(disp) : value}{suffix}
      </div>
      {sub && <div className="text-[10.5px] font-mono" style={{ color: C.textLo }}>{sub}</div>}
    </div>
  );
}

function MissionControl({ metrics, phase, onSimulate }) {
  const healthColor = metrics.health >= 90 ? C.green : metrics.health >= 70 ? C.cyan : metrics.health >= 50 ? C.amber : C.red;
  return (
    <Panel className="fade-in">
      <SectionLabel
        eyebrow="MISSION CONTROL"
        title="ORBIT-R · Earth Observation Mission"
        right={
          <button
            onClick={onSimulate}
            disabled={phase !== "nominal"}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110"
            style={{ background: `linear-gradient(135deg, ${C.red}, #C22C3B)`, color: "#fff", boxShadow: phase === "nominal" ? `0 0 22px rgba(241,76,90,0.35)` : "none" }}
          >
            <AlertTriangle size={16} /> Simulate Failure
          </button>
        }
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard icon={Activity} label="Mission Health" value={metrics.health} suffix="%" color={healthColor} />
        <StatCard icon={ListChecks} label="Active Tasks" value={metrics.active} suffix={`/24`} color={C.textHi} />
        <StatCard icon={Satellite} label="Satellites" value={metrics.sats} suffix="/4" color={C.textHi} />
        <StatCard icon={TowerControl} label="Ground Stations" value={metrics.gsCount} suffix="/3" color={C.textHi} />
        <StatCard icon={Radio} label="Comm Links" value={metrics.links} suffix="/8" color={C.textHi} />
        <StatCard icon={Gauge} label="Resource Avail." value={metrics.resources} suffix="%" color={C.textHi} />
        <StatCard icon={ShieldAlert} label="Critical Tasks" value={metrics.critical} suffix="" color={C.textHi} />
        <StatCard icon={Target} label="Mission State" value={
          phase === "nominal" ? "NOMINAL" : phase === "stabilized" ? "STABLE" : phase === "injector" ? "STANDBY" : "DEGRADED"
        } color={phase === "stabilized" ? C.green : phase === "nominal" ? C.cyan : C.amber} />
      </div>
    </Panel>
  );
}

/* ============================ failure injector ============================ */

function FailureInjector({ open, kind, setKind, onInject, onClose }) {
  if (!open) return null;
  const options = [
    { id: "sat", label: "Satellite Failure", icon: Satellite },
    { id: "link", label: "Communication-Link Failure", icon: Radio },
    { id: "gs", label: "Ground-Station Failure", icon: TowerControl },
    { id: "resource", label: "Resource Degradation", icon: Gauge },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(2,4,9,0.72)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-lg rounded-2xl p-6 fade-in relative" style={{ background: C.bgPanelSolid, border: `1px solid ${C.hairline}`, boxShadow: "0 24px 64px rgba(0,0,0,0.55)" }}>
        <button onClick={onClose} className="absolute top-4 right-4 opacity-60 hover:opacity-100"><X size={18} color={C.textMid} /></button>
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={18} color={C.amber} />
          <div className="text-xs font-mono tracking-widest" style={{ color: C.amber }}>FAILURE INJECTION SIMULATOR</div>
        </div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: C.textHi }}>Choose a scenario</h3>

        <div className="grid grid-cols-2 gap-2 mb-5">
          {options.map((o) => {
            const active = kind === o.id;
            return (
              <button key={o.id} onClick={() => setKind(o.id)}
                className="flex items-center gap-2 text-left text-xs font-medium px-3 py-2.5 rounded-lg transition"
                style={{
                  border: `1px solid ${active ? C.cyanDim : C.hairline}`,
                  background: active ? "rgba(57,199,240,0.08)" : "transparent",
                  color: active ? C.cyan : C.textMid,
                }}>
                <o.icon size={14} /> {o.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(241,76,90,0.07)", border: `1px solid rgba(241,76,90,0.3)` }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono tracking-wider" style={{ color: C.textLo }}>DEFAULT DEMO SCENARIO</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: C.red, color: "#fff" }}>CRITICAL</span>
          </div>
          <div className="text-base font-semibold" style={{ color: C.textHi }}>Communication Link C03 Failure</div>
          <div className="text-xs mt-1" style={{ color: C.textMid }}>SAT-02 ↔ GS-01 primary downlink. Selected as the jury demo path — full injector supports all four failure modes in the production build.</div>
        </div>

        <button onClick={onInject} className="w-full flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-xl transition hover:brightness-110"
          style={{ background: `linear-gradient(135deg, ${C.red}, #C22C3B)`, color: "#fff" }}>
          <Zap size={16} /> Inject Failure
        </button>
      </div>
    </div>
  );
}

/* ============================ dependency graph ============================ */

function NodeBox({ x, y, w, h, status, label, sub, Icon, live }) {
  const s = STATUS_STYLE[status];
  return (
    <g transform={`translate(${x - w / 2}, ${y - h / 2})`} style={{ transition: "all .5s ease" }}>
      <rect width={w} height={h} rx={10} fill={s.fill} stroke={s.stroke} strokeWidth={1.4}
        className={live ? "node-pulse" : ""} style={{ color: s.stroke, transition: "all .5s ease" }} />
      {Icon && <Icon x={10} y={h / 2 - 8} width={16} height={16} color={s.stroke} />}
      <text x={Icon ? 32 : w / 2} y={h / 2 - (sub ? 3 : -4)} textAnchor={Icon ? "start" : "middle"}
        fontSize="12" fontWeight="700" fontFamily="ui-monospace, monospace" fill={s.text}>{label}</text>
      {sub && <text x={Icon ? 32 : w / 2} y={h / 2 + 12} textAnchor={Icon ? "start" : "middle"}
        fontSize="9" fontFamily="ui-monospace, monospace" fill={C.textLo}>{sub}</text>}
    </g>
  );
}

function EdgePath({ x1, y1, x2, y2, status, dashed }) {
  const s = STATUS_STYLE[status];
  const midY = (y1 + y2) / 2;
  const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  const live = status !== "ok";
  return (
    <path d={d} fill="none" stroke={s.stroke} strokeWidth={status === "critical" ? 2.2 : 1.4}
      strokeDasharray={dashed ? "5 5" : status === "ok" ? "0" : "6 6"}
      className={live && !dashed ? "edge-live" : ""}
      style={{ opacity: status === "ok" ? 0.55 : 0.95, transition: "all .5s ease" }} />
  );
}

function DependencyGraphPanel({ phase }) {
  const failed = isPostFailure(phase);
  const stabilized = phase === "stabilized";

  const nodeStatus = {
    sat: Object.fromEntries(SATELLITES.map((s) => [s.id, satStatus(s.id, phase)])),
    link: Object.fromEntries(LINKS.map((l) => [l.id, linkStatus(l.id, phase)])),
    gs: Object.fromEntries(GROUND.map((g) => [g.id, gsStatus(g.id, phase)])),
    task: Object.fromEntries(TASKS.map((t) => [t.id, taskStatus(t.id, phase)])),
  };

  return (
    <Panel className="fade-in overflow-hidden">
      <SectionLabel
        eyebrow="MISSION DEPENDENCY GRAPH"
        title="Satellites → Comm Links → Ground Stations → Mission Tasks"
        right={
          <div className="flex items-center gap-3 text-[10.5px] font-mono flex-wrap">
            <LegendDot color={C.cyan} label="Nominal" />
            <LegendDot color={C.amber} label="Impacted" />
            <LegendDot color={C.red} label="Failed" />
            <LegendDot color={C.purple} label="Recovered / Rerouted" />
          </div>
        }
      />

      {failed && (
        <div className="mb-4 flex items-center gap-2 text-xs font-mono flex-wrap" style={{ color: C.textMid }}>
          <span className="px-2 py-1 rounded" style={{ background: "rgba(241,76,90,0.15)", color: C.red }}>C03 FAILED</span>
          <ArrowRight size={12} />
          <span className="px-2 py-1 rounded" style={{ background: "rgba(240,169,62,0.15)", color: C.amber }}>SAT-02 / GS-01 DEPENDENCY IMPACT</span>
          <ArrowRight size={12} />
          <span className="px-2 py-1 rounded" style={{ background: "rgba(240,169,62,0.15)", color: C.amber }}>T07 / T11 / T14 AT RISK</span>
          {stabilized && (<><ArrowRight size={12} /><span className="px-2 py-1 rounded" style={{ background: "rgba(177,140,255,0.18)", color: C.purple }}>ALTERNATE PATH ACTIVE</span></>)}
        </div>
      )}

      <div className="relative rounded-xl" style={{ border: `1px solid ${C.hairline}`, background: "rgba(255,255,255,0.015)" }}>
        <svg viewBox="0 0 1160 520" className="w-full" style={{ minHeight: 320 }}>
          <defs>
            <pattern id="dotgrid" width="26" height="26" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="rgba(120,160,210,0.10)" />
            </pattern>
          </defs>
          <rect width="1160" height="520" fill="url(#dotgrid)" />

          {/* row labels */}
          <text x="16" y={Y_SAT - 26} fontSize="10" fontFamily="ui-monospace, monospace" fill={C.textLo} letterSpacing="2">SATELLITES</text>
          <text x="16" y={Y_LINK - 26} fontSize="10" fontFamily="ui-monospace, monospace" fill={C.textLo} letterSpacing="2">COMM. LINKS</text>
          <text x="16" y={Y_GS - 26} fontSize="10" fontFamily="ui-monospace, monospace" fill={C.textLo} letterSpacing="2">GROUND STATIONS</text>
          <text x="16" y={Y_TASK - 26} fontSize="10" fontFamily="ui-monospace, monospace" fill={C.textLo} letterSpacing="2">MISSION TASKS</text>

          {/* edges: sat -> link -> gs */}
          {LINKS.map((l) => {
            const a = centerOf("sat", l.sat), b = centerOf("link", l.id), c = centerOf("gs", l.gs);
            const st1 = combine(nodeStatus.sat[l.sat], nodeStatus.link[l.id]);
            const st2 = combine(nodeStatus.link[l.id], nodeStatus.gs[l.gs]);
            return (
              <g key={l.id}>
                <EdgePath x1={a.x} y1={a.y + 20} x2={b.x} y2={b.y - 16} status={st1} />
                <EdgePath x1={b.x} y1={b.y + 16} x2={c.x} y2={c.y - 20} status={st2} />
              </g>
            );
          })}

          {/* edges: gs -> task, sat -> task (direct) */}
          {TASKS.map((t) => {
            const from = t.from.startsWith("SAT") ? centerOf("sat", t.from) : centerOf("gs", t.from);
            const to = centerOf("task", t.id);
            const fromStatus = t.from.startsWith("SAT") ? nodeStatus.sat[t.from] : nodeStatus.gs[t.from];
            const st = combine(fromStatus, nodeStatus.task[t.id]);
            return <EdgePath key={"e" + t.id} x1={from.x} y1={from.y + (t.from.startsWith("SAT") ? 20 : 20)} x2={to.x} y2={to.y - 15} status={st} dashed={t.from.startsWith("SAT")} />;
          })}

          {/* reroute path — only visible once stabilized */}
          {stabilized && (
            <EdgePath x1={centerOf("sat", "SAT-02").x} y1={centerOf("sat", "SAT-02").y + 20}
              x2={centerOf("gs", "GS-01").x} y2={centerOf("gs", "GS-01").y - 20}
              status="recovered" />
          )}
          {stabilized && (
            <text x={(centerOf("sat", "SAT-02").x + centerOf("gs", "GS-01").x) / 2} y={(Y_SAT + Y_GS) / 2 - 4}
              fontSize="9" fontFamily="ui-monospace, monospace" fill={C.purple} textAnchor="middle">ALT ROUTE VIA C06</text>
          )}

          {/* failure ripple */}
          {failed && !stabilized && (
            <g key={phase}>
              <circle cx={centerOf("link", "C03").x} cy={centerOf("link", "C03").y} r={8} fill="none" stroke={C.red} strokeWidth="2"
                style={{ animation: "ripple 1.8s ease-out infinite" }} />
            </g>
          )}

          {/* nodes */}
          {SATELLITES.map((s) => (
            <NodeBox key={s.id} x={s.x} y={Y_SAT} w={96} h={44} status={nodeStatus.sat[s.id]} label={s.id} Icon={Satellite}
              live={nodeStatus.sat[s.id] !== "ok"} />
          ))}
          {LINKS.map((l) => (
            <NodeBox key={l.id} x={l.x} y={Y_LINK} w={62} h={34} status={nodeStatus.link[l.id]} label={l.id}
              live={nodeStatus.link[l.id] !== "ok"} />
          ))}
          {GROUND.map((g) => (
            <NodeBox key={g.id} x={g.x} y={Y_GS} w={96} h={44} status={nodeStatus.gs[g.id]} label={g.id} Icon={TowerControl}
              live={nodeStatus.gs[g.id] !== "ok"} />
          ))}
          {TASKS.map((t) => (
            <NodeBox key={t.id} x={t.x} y={Y_TASK} w={58} h={30} status={nodeStatus.task[t.id]} label={t.id}
              live={nodeStatus.task[t.id] === "critical"} />
          ))}
        </svg>
      </div>
    </Panel>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1.5" style={{ color: C.textMid }}>
      <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} /> {label}
    </span>
  );
}

/* ============================ propagation panel ============================ */

function PropagationPanel({ phase, health }) {
  const stabilized = phase === "stabilized";
  return (
    <Panel className="fade-in lg:col-span-1">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={15} color={C.amber} />
        <span className="text-xs font-mono tracking-widest" style={{ color: C.amber }}>FAILURE DETECTED</span>
      </div>
      <div className="text-sm font-semibold mb-4" style={{ color: C.textHi }}>C03 Communication Link</div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <MiniStat label="Direct Impact" value="2" unit="components" />
        <MiniStat label="Indirect Impact" value="5" unit="components" />
        <MiniStat label="Tasks at Risk" value="6" unit="mission tasks" color={C.amber} />
        <MiniStat label="Critical at Risk" value="2" unit="critical tasks" color={C.red} />
      </div>

      <div className="text-[10.5px] font-mono mb-2 flex items-center justify-between" style={{ color: C.textLo }}>
        <span>MISSION HEALTH</span>
        <span style={{ color: stabilized ? C.green : C.red }}>
          100% → 58%{stabilized ? " → 94%" : ""}
        </span>
      </div>
      <div style={{ height: 90 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={health}>
            <defs>
              <linearGradient id="healthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.cyan} stopOpacity={0.5} />
                <stop offset="100%" stopColor={C.cyan} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="t" tick={{ fontSize: 9, fill: C.textLo }} axisLine={{ stroke: C.hairline }} tickLine={false} />
            <YAxis hide domain={[0, 100]} />
            <Tooltip contentStyle={{ background: C.bgPanelSolid, border: `1px solid ${C.hairline}`, fontSize: 11 }} labelStyle={{ color: C.textMid }} />
            <Area type="monotone" dataKey="v" stroke={C.cyan} strokeWidth={2} fill="url(#healthFill)" isAnimationActive />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function MiniStat({ label, value, unit, color = C.textHi }) {
  return (
    <div className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
      <div className="text-[9.5px] font-mono uppercase tracking-wider" style={{ color: C.textLo }}>{label}</div>
      <div className="text-lg font-bold font-mono" style={{ color }}>{value}</div>
      <div className="text-[9.5px]" style={{ color: C.textLo }}>{unit}</div>
    </div>
  );
}

/* ============================ criticality panel ============================ */

function CriticalityPanel() {
  const max = CRITICALITY_ROWS[0].score;
  return (
    <Panel className="fade-in lg:col-span-1">
      <div className="flex items-center gap-2 mb-1">
        <Layers size={15} color={C.purple} />
        <span className="text-xs font-mono tracking-widest" style={{ color: C.purple }}>COMPONENT CRITICALITY</span>
      </div>
      <div className="flex items-center gap-1 mb-4 group relative">
        <Info size={11} color={C.textLo} />
        <span className="text-[10.5px]" style={{ color: C.textLo }}>Higher = greater mission impact if unavailable</span>
      </div>
      <div className="space-y-3">
        {CRITICALITY_ROWS.map((r) => (
          <div key={r.id}>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span style={{ color: C.textHi }}>{r.id}</span>
              <span style={{ color: C.textMid }}>{r.score.toFixed(2)}</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full" style={{
                width: `${(r.score / max) * 100}%`,
                background: r.id === "C03" ? C.red : r.id === "SAT-02" || r.id === "GS-01" ? C.amber : C.cyan,
                transition: "width 1s ease",
              }} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ============================ resource panel ============================ */

function ResourcePanel() {
  return (
    <Panel className="fade-in lg:col-span-1">
      <div className="flex items-center gap-2 mb-4">
        <Gauge size={15} color={C.cyan} />
        <span className="text-xs font-mono tracking-widest" style={{ color: C.cyan }}>SURVIVING RESOURCES</span>
      </div>
      <div style={{ height: 130 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={RESOURCE_ROWS} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={C.hairline} />
            <XAxis dataKey="key" tick={{ fontSize: 8.5, fill: C.textLo }} axisLine={{ stroke: C.hairline }} tickLine={false} interval={0}
              tickFormatter={(v) => v.split(" ")[0]} />
            <YAxis tick={{ fontSize: 9, fill: C.textLo }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: C.bgPanelSolid, border: `1px solid ${C.hairline}`, fontSize: 11 }} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {RESOURCE_ROWS.map((r, i) => (
                <Cell key={i} fill={r.value < 60 ? C.red : r.value < 75 ? C.amber : C.cyan} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex items-start gap-2 rounded-lg p-2.5" style={{ background: "rgba(240,169,62,0.08)", border: `1px solid rgba(240,169,62,0.28)` }}>
        <AlertTriangle size={13} color={C.amber} className="mt-0.5 shrink-0" />
        <div className="text-[11px]" style={{ color: C.textMid }}>
          <span style={{ color: C.amber, fontWeight: 700 }}>GS-01 utilization: 92%</span> — near capacity. Full rerouting through this station alone isn't feasible.
        </div>
      </div>
    </Panel>
  );
}

/* ============================ recovery optimizer ============================ */

function RecoveryOptimizer({ phase, onGenerate, onExecute }) {
  const plansReady = phase !== "failed";
  return (
    <Panel className="fade-in">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={15} color={C.purple} />
        <span className="text-xs font-mono tracking-widest" style={{ color: C.purple }}>ORBIT-R DECISION ENGINE</span>
      </div>
      <SectionLabel
        eyebrow=""
        title="Recovery Optimizer"
        right={!plansReady ? (
          <button onClick={onGenerate} className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition hover:brightness-110"
            style={{ background: `linear-gradient(135deg, ${C.purple}, #8B5FE8)`, color: "#0b0716" }}>
            <Sparkles size={16} /> Generate Recovery Plans
          </button>
        ) : phase === "plans" ? (
          <button onClick={onExecute} className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition hover:brightness-110"
            style={{ background: `linear-gradient(135deg, ${C.green}, #1EAF77)`, color: "#04140C" }}>
            <CheckCircle2 size={16} /> Execute Best Plan
          </button>
        ) : null}
      />

      {!plansReady && (
        <div className="text-sm py-6 text-center" style={{ color: C.textLo }}>
          Awaiting operator command — generate feasible recovery alternatives from surviving resources.
        </div>
      )}

      {plansReady && (
        <div className="grid md:grid-cols-3 gap-4 mt-2">
          {PLANS.map((p) => (
            <div key={p.key} className="relative rounded-xl p-4 fade-in" style={{
              background: p.best ? "rgba(177,140,255,0.08)" : "rgba(255,255,255,0.02)",
              border: `1.5px solid ${p.best ? C.purple : C.hairline}`,
              boxShadow: p.best ? `0 0 26px rgba(177,140,255,0.25)` : "none",
            }}>
              {p.best && (
                <div className="absolute -top-3 left-4 flex items-center gap-1 text-[10.5px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: C.purple, color: "#0b0716" }}>
                  <Star size={11} fill="#0b0716" /> BEST FEASIBLE PLAN
                </div>
              )}
              <div className="text-[10px] font-mono tracking-wider mt-1" style={{ color: C.textLo }}>PLAN {p.key}</div>
              <div className="text-sm font-bold mb-3" style={{ color: C.textHi }}>{p.name}</div>
              <div className="space-y-1.5 text-xs font-mono">
                <Row k="Mission value retained" v={`${p.value}%`} color={p.best ? C.purple : C.textHi} />
                <Row k="Critical tasks recovered" v={p.critRecovered} />
                <Row k="Risk" v={p.risk} />
                <Row k="Resource cost" v={p.cost} />
                <Row k="Recovery time" v={p.time} />
                <Row k="Score" v={p.score} color={p.best ? C.purple : C.textHi} bold />
              </div>
              {p.best && (
                <div className="mt-3 pt-3 space-y-1" style={{ borderTop: `1px solid rgba(177,140,255,0.25)` }}>
                  {["Highest mission value retained", "All critical tasks recovered", "Satisfies resource constraints", "Acceptable recovery time", "Low operational risk"].map((r) => (
                    <div key={r} className="flex items-center gap-1.5 text-[11px]" style={{ color: C.textMid }}>
                      <CheckCircle2 size={11} color={C.purple} /> {r}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function Row({ k, v, color = C.textMid, bold }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: C.textLo }}>{k}</span>
      <span style={{ color, fontWeight: bold ? 800 : 500 }}>{v}</span>
    </div>
  );
}

/* ============================ execution timeline ============================ */

function ExecutionTimeline({ execIdx, phase }) {
  return (
    <Panel className="fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={15} color={C.green} />
        <span className="text-xs font-mono tracking-widest" style={{ color: C.green }}>EXECUTING — PLAN C: MULTI-RESOURCE REALLOCATION</span>
      </div>
      <div className="space-y-2">
        {EXEC_STEPS.map((s, i) => {
          const done = i <= execIdx || phase === "stabilized";
          const active = i === execIdx && phase === "executing";
          return (
            <div key={s} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{
              background: active ? "rgba(56,217,147,0.08)" : "transparent",
              transition: "all .4s ease",
            }}>
              {done ? <CheckCircle2 size={16} color={C.green} /> : <span className="w-4 h-4 rounded-full inline-block" style={{ border: `1.5px solid ${C.hairline}` }} />}
              <span className="text-sm font-mono" style={{ color: done ? C.textHi : C.textLo }}>{s}</span>
              {active && <RefreshCw size={12} color={C.green} className="ml-auto animate-spin" />}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ============================ stabilized banner ============================ */

function StabilizedBanner() {
  return (
    <Panel className="fade-in" style={{ border: `1px solid rgba(56,217,147,0.35)`, background: "rgba(56,217,147,0.06)" }}>
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 size={18} color={C.green} />
        <span className="text-sm font-mono tracking-widest" style={{ color: C.green }}>MISSION STABILIZED</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <BigStat label="Mission Health" trail="100% → 58% →" value={94} suffix="%" color={C.green} />
        <BigStat label="Active Tasks" trail="15 →" value={22} suffix="" color={C.textHi} />
        <BigStat label="Critical Tasks" trail="6 →" value={10} suffix="" color={C.textHi} />
        <BigStat label="Mission Value Retained" trail="" value={94} suffix="%" color={C.purple} />
      </div>
    </Panel>
  );
}

function BigStat({ label, trail, value, suffix, color }) {
  const disp = useCountUp(value, 900);
  return (
    <div>
      <div className="text-[10.5px] font-mono uppercase tracking-wider mb-1" style={{ color: C.textLo }}>{label}</div>
      <div className="text-2xl font-bold font-mono" style={{ color }}>
        {trail && <span className="text-sm mr-1" style={{ color: C.textLo }}>{trail}</span>}
        {Math.round(disp)}{suffix}
      </div>
    </div>
  );
}

/* ============================ comparison table ============================ */

function ComparisonTable() {
  const rows = [
    { k: "Mission Health", before: "100%", failure: "58%", after: "94%" },
    { k: "Active Tasks", before: "24", failure: "15", after: "22" },
    { k: "Critical Tasks", before: "10", failure: "6", after: "10" },
    { k: "Resources", before: "91%", failure: "62%", after: "78%" },
  ];
  return (
    <Panel className="fade-in">
      <SectionLabel eyebrow="MISSION TIMELINE" title="Before / During / After ORBIT-R" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr style={{ color: C.textLo }}>
              <th className="text-left py-2 font-normal text-xs">METRIC</th>
              <th className="text-right py-2 font-normal text-xs">BEFORE</th>
              <th className="text-right py-2 font-normal text-xs">FAILURE</th>
              <th className="text-right py-2 font-normal text-xs" style={{ color: C.purple }}>ORBIT-R RECOVERY</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.k} style={{ borderTop: `1px solid ${C.hairline}` }}>
                <td className="py-2.5" style={{ color: C.textHi }}>{r.k}</td>
                <td className="py-2.5 text-right" style={{ color: C.textMid }}>{r.before}</td>
                <td className="py-2.5 text-right" style={{ color: C.red }}>{r.failure}</td>
                <td className="py-2.5 text-right font-bold" style={{ color: C.green }}>{r.after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ============================ mission report ============================ */

function MissionReportPanel({ onExport }) {
  const fields = [
    ["Failure", "C03 Communication Link"],
    ["Propagation", "7 affected components"],
    ["Critical Tasks at Risk", "2"],
    ["Selected Plan", "Multi-Resource Reallocation"],
    ["Recovery Score", "94.2"],
    ["Mission Value Retained", "94%"],
    ["Outcome", "Mission Stabilized"],
  ];
  return (
    <Panel className="fade-in">
      <SectionLabel
        eyebrow="SUMMARY"
        title="Mission Report"
        right={
          <button onClick={onExport} className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition hover:brightness-110"
            style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: "#04121C" }}>
            <Download size={16} /> Export Mission Report
          </button>
        }
      />
      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
        {fields.map(([k, v]) => (
          <div key={k} className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${C.hairline}` }}>
            <span style={{ color: C.textLo }}>{k}</span>
            <span className="font-mono font-semibold" style={{ color: k === "Outcome" ? C.green : C.textHi }}>{v}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-start gap-2 text-[11.5px] rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", color: C.textLo }}>
        <FileText size={13} className="mt-0.5 shrink-0" />
        C03 remains failed. Mission continuity was restored through surviving resources and alternate routing — not component repair. Labeled ORBIT-R Optimization / Decision Engine; not presented as a live AI model.
      </div>
    </Panel>
  );
}
