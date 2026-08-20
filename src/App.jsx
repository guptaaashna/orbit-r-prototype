import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Satellite, AlertTriangle, Activity, Zap, CheckCircle2,
  Gauge, Download, X, Info, Sparkles, RefreshCw, Target, Layers,
  Clock, ArrowRight, Star, ShieldAlert, Radio, ListChecks, FileText,
  RotateCcw, TowerControl, Play, Cpu, BatteryCharging, Server, Shield,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts";
import { SCENARIOS } from "./data/scenarioData";

/* =========================================================================
   ORBIT-R — Operational Resilience & Backup Intelligence for Space Missions
   SIH 2026 Round 2 — 3 Core Capability Pillars:
   1. FAILURE PROPAGATION ("How far will it spread?")
   2. RECOVERY OPTIMIZATION ("What is the best plan?")
   3. RECOVERY MEASUREMENT ("How much did we save?")
   ========================================================================= */

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

/* ---------------- GRAPH NODES GEOMETRY ---------------- */
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

const centerOf = (type, id) => {
  if (type === "sat") { const n = SATELLITES.find((s) => s.id === id); return { x: n.x, y: Y_SAT }; }
  if (type === "link") { const n = LINKS.find((s) => s.id === id); return { x: n.x, y: Y_LINK }; }
  if (type === "gs") { const n = GROUND.find((s) => s.id === id); return { x: n.x, y: Y_GS }; }
  if (type === "task") { const n = TASKS.find((s) => s.id === id); return { x: n.x, y: Y_TASK }; }
};

const SEV = { ok: 0, recovered: 1, warning: 2, critical: 3 };
function combine(a, b) { return SEV[a] >= SEV[b] ? a : b; }

const DEMO_STAGES = [
  "NORMAL MISSION", "PREDICTIVE MONITORING", "FAILURE PREDICTION", "FAILURE CONFIRMED",
  "PROPAGATION ANALYSIS", "IMPACT CALCULATED", "RESOURCE & BACKUP", "RECOVERY OPTIMIZATION",
  "RECOVERY EXECUTION", "STABILIZED"
];

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
  const [scenarioId, setScenarioId] = useState("comm");
  const [phase, setPhase] = useState("nominal"); // nominal | predictive | predicted | failed | plans | executing | stabilized
  const [demoMode, setDemoMode] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [execIdx, setExecIdx] = useState(-1);
  const [toasts, setToasts] = useState([]);
  const [health, setHealth] = useState([{ t: "T-0", v: 100 }]);

  const currentScenario = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];

  const timers = useRef([]);
  const predRef = useRef(null);
  const graphRef = useRef(null);
  const optimizerRef = useRef(null);
  const execRef = useRef(null);
  const stableRef = useRef(null);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => clearTimers(), []);

  const push = useCallback((msg, kind = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, kind }]);
    const tm = setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
    timers.current.push(tm);
  }, []);

  const scrollTo = (ref) => {
    const tm = setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
    timers.current.push(tm);
  };

  /* --- Scenario Switch Handler --- */
  const handleSelectScenario = (id) => {
    if (phase !== "nominal" && phase !== "predictive" && phase !== "predicted") {
      resetAll();
    }
    setScenarioId(id);
    const s = SCENARIOS.find((sc) => sc.id === id);
    push(`Switched to ${s.name}`, "info");
  };

  /* --- Interactive Workflow Handlers --- */
  const analyzeRisk = () => {
    setPhase("predictive");
    push(`Predictive Monitoring Active — Scanning ${currentScenario.targetComponent}`, "warning");
    const tm = setTimeout(() => {
      setPhase("predicted");
      push(`HIGH RISK: ${currentScenario.predictive.probability}% Failure Probability predicted for ${currentScenario.targetId}`, "critical");
    }, 1200);
    timers.current.push(tm);
    scrollTo(predRef);
  };

  const injectFailure = () => {
    setPhase("failed");
    const failureHealthVal = Math.round(currentScenario.availability.during);
    setHealth((h) => [...h, { t: "FAILURE", v: failureHealthVal }]);
    push(`FAILURE CONFIRMED — ${currentScenario.targetComponent}`, "critical");
    timers.current.push(setTimeout(() => push(currentScenario.impact.propagationNotice, "warning"), 900));
    timers.current.push(setTimeout(() => push(`${currentScenario.impact.tasksAtRiskCount} tasks at risk — ${currentScenario.impact.criticalTasksAtRiskCount} critical`, "warning"), 1800));
    scrollTo(graphRef);
  };

  const generatePlans = () => {
    setPhase("plans");
    push("3 recovery plans generated & scored by Decision Engine", "info");
    scrollTo(optimizerRef);
  };

  const executeBestPlan = () => {
    setPhase("executing");
    setExecIdx(0);
    const bestPlan = currentScenario.plans.find((p) => p.best);
    push(`Executing Plan ${bestPlan.key} — ${bestPlan.name}`, "purple");
    scrollTo(execRef);
    currentScenario.execSteps.forEach((_, i) => {
      const tm = setTimeout(() => {
        setExecIdx(i);
        if (i === currentScenario.execSteps.length - 1) {
          const tm2 = setTimeout(() => stabilize(), 750);
          timers.current.push(tm2);
        }
      }, 550 * (i + 1));
      timers.current.push(tm);
    });
  };

  const stabilize = () => {
    setPhase("stabilized");
    const stableHealthVal = Math.round(currentScenario.availability.after);
    setHealth((h) => [...h, { t: "RECOVERY", v: stableHealthVal }]);
    push(`MISSION STABILIZED — ${currentScenario.availability.after}% Mission Availability restored`, "success");
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
    at(800, () => { setDemoStep(1); analyzeRisk(); });
    at(2500, () => { setDemoStep(2); });
    at(4000, () => { setDemoStep(3); injectFailure(); });
    at(5500, () => { setDemoStep(4); });
    at(7000, () => { setDemoStep(5); });
    at(8500, () => { setDemoStep(6); });
    at(10000, () => { setDemoStep(7); generatePlans(); });
    at(11800, () => { setDemoStep(8); executeBestPlan(); });
    at(11800 + 550 * currentScenario.execSteps.length + 1200, () => { setDemoStep(9); });
  };

  const exportReport = () => {
    const s = currentScenario;
    const bestPlan = s.plans.find((p) => p.best);
    const body = `ORBIT-R MISSION RESILIENCE REPORT
==================================================
Mission: EO-MISSION-01 | SIH 2026 Round 2 Evaluation
Generated: ${new Date().toLocaleString()}
Selected Scenario: ${s.name}
Target Component: ${s.targetComponent}

1. PREDICTIVE TELEMETRY:
- Failure Probability: ${s.predictive.probability}%
- Prediction Confidence: ${s.predictive.confidence}%
- Estimated Failure Window: ${s.predictive.window}
- Anomaly Score: ${s.predictive.anomalyScore}
- Risk Level: ${s.predictive.riskLevel}

2. PILLAR 1 — FAILURE PROPAGATION:
- Failed Component: ${s.impact.failedNode}
- Directly Affected Components: ${s.impact.directImpactCount}
- Indirectly Affected Components: ${s.impact.indirectImpactCount}
- Mission Tasks at Risk: ${s.impact.tasksAtRiskCount} (Critical: ${s.impact.criticalTasksAtRiskCount})
- Mission Value at Risk: ${s.impact.missionValueAtRisk}%

3. PILLAR 2 — RECOVERY OPTIMIZATION:
- Selected Plan: Plan ${bestPlan.key} — ${bestPlan.name}
- Optimization Score: ${bestPlan.score}
- Mission Value Retained: ${bestPlan.value}%
- Recovery Time: ${s.recoveryTime.total} min
- Primary → Backup Pair: ${s.backup.primary} → ${s.backup.backup}
- Backup Readiness: ${s.backup.readiness}% | Success Rate: ${s.backup.successRate}%

4. PILLAR 3 — RECOVERY MEASUREMENT:
- Mission Availability: Before ${s.availability.before}% | During ${s.availability.during}% | After ${s.availability.after}% (Delta: +${s.availability.recoveredDelta}%)
- Data Loss: ${s.dataIntegrity.lossPercentage}% (${s.dataIntegrity.lostGB} GB / ${s.dataIntegrity.generatedGB} GB)
- Failure Detection Accuracy: ${s.metrics.detectionAccuracy}% | Prediction Accuracy: ${s.metrics.predictionAccuracy}% | False Alarm Rate: ${s.metrics.falseAlarmRate}%

Status: MISSION STABILIZED
Note: Target component remains failed. Recovery achieved through surviving resources,
failover, and decision optimization. Prototype simulation data.
-- ORBIT-R Resilience Engine --
`;
    const blob = new Blob([body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `orbitr_${s.id}_mission_report.txt`; a.click();
    URL.revokeObjectURL(url);
    push("Mission report exported", "info");
  };

  const isPostFailure = ["failed", "plans", "executing", "stabilized"].includes(phase);
  const showPredictive = ["predictive", "predicted", "failed", "plans", "executing", "stabilized"].includes(phase);
  const showOptimizer = ["plans", "executing", "stabilized"].includes(phase);
  const showExec = ["executing", "stabilized"].includes(phase);
  const showStable = phase === "stabilized";

  return (
    <div className="min-h-screen w-full font-sans relative" style={{ background: C.bg, color: C.textHi }}>
      <BackgroundGrid />
      <ToastStack toasts={toasts} />
      <TopBar
        scenarioId={scenarioId} setScenarioId={handleSelectScenario}
        phase={phase} demoMode={demoMode} demoStep={demoStep}
        onRunDemo={runDemo} onReset={resetAll}
      />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 pb-28 pt-6 space-y-7 relative z-10">
        <StorylineStepper phase={phase} demoStep={demoStep} demoMode={demoMode} />

        {/* SECTION 1: MISSION CONTROL OVERVIEW */}
        <MissionControl
          scenario={currentScenario} phase={phase}
          onAnalyzeRisk={analyzeRisk} onInjectFailure={injectFailure}
        />

        {/* SECTION 2: PREDICTIVE HEALTH MONITORING */}
        <div ref={predRef}>
          {showPredictive && <PredictiveHealthMonitoring scenario={currentScenario} phase={phase} />}
        </div>

        {/* SECTION 3 & 4: PILLAR 1 — FAILURE PROPAGATION */}
        <div ref={graphRef}>
          <DependencyGraphPanel scenario={currentScenario} phase={phase} />
        </div>

        {/* SECTION 5: IMPACT ANALYSIS & RESOURCE/BACKUP */}
        {isPostFailure && (
          <>
            <ImpactAnalysisPanel scenario={currentScenario} phase={phase} health={health} />

            {/* SECTION 6: PILLAR 2 — RESOURCE & BACKUP ANALYSIS */}
            <div className="grid lg:grid-cols-2 gap-5">
              <ResourceUtilizationPanel scenario={currentScenario} />
              <BackupRedundancyPanel scenario={currentScenario} />
            </div>
          </>
        )}

        {/* SECTION 7: PILLAR 2 — RECOVERY OPTIMIZER */}
        <div ref={optimizerRef}>
          {isPostFailure && (
            <RecoveryOptimizer scenario={currentScenario} phase={phase} onGenerate={generatePlans} onExecute={executeBestPlan} />
          )}
        </div>

        {/* SECTION 8: EXECUTION TIMELINE & RECOVERY TIME */}
        <div ref={execRef}>
          {showExec && <TimelineAndRecoveryTimePanel scenario={currentScenario} execIdx={execIdx} phase={phase} />}
        </div>

        {/* SECTION 9: PILLAR 3 — RECOVERY MEASUREMENT & OUTCOME */}
        <div ref={stableRef}>
          {showStable && (
            <>
              <MissionOutcomeSummary scenario={currentScenario} />
              <div className="grid lg:grid-cols-2 gap-5">
                <DataIntegrityAvailabilityPanel scenario={currentScenario} />
                <DetectionMetricsPanel scenario={currentScenario} />
              </div>
              <ScenarioComparisonPanel currentId={scenarioId} />
              <MissionReportPanel scenario={currentScenario} onExport={exportReport} />
            </>
          )}
        </div>
      </main>

      <style>{`
        @keyframes dashflow { to { stroke-dashoffset: -24; } }
        @keyframes ripple { 0% { r: 8; opacity: .9; } 100% { r: 60; opacity: 0; } }
        @keyframes fadeSlideUp { from { opacity:0; transform: translateY(14px);} to {opacity:1; transform: translateY(0);} }
        @keyframes pulseGlow { 0%,100% { filter: drop-shadow(0 0 2px currentColor);} 50% { filter: drop-shadow(0 0 9px currentColor);} }
        @keyframes toastIn { from { opacity:0; transform: translateX(24px);} to {opacity:1; transform: translateX(0);} }
        .fade-in { animation: fadeSlideUp .5s ease both; }
        .edge-live { stroke-dasharray: 6 6; animation: dashflow 1s linear infinite; }
        .node-pulse { animation: pulseGlow 1.6s ease-in-out infinite; }
        * { scrollbar-width: thin; scrollbar-color: rgba(57,199,240,0.3) transparent; }
      `}</style>
    </div>
  );
}

/* ============================ SHARED COMPONENTS ============================ */

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
  const s = STATUS_STYLE[status] || STATUS_STYLE.ok;
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
        <div className="text-xs tracking-[0.2em] font-mono mb-1 flex items-center gap-2" style={{ color: C.cyan }}>
          {eyebrow}
        </div>
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

/* ================================ TOP BAR ================================= */

function TopBar({ scenarioId, setScenarioId, phase, demoMode, demoStep, onRunDemo, onReset }) {
  const phaseLabel = {
    nominal: "NOMINAL MISSION", predictive: "PREDICTIVE MONITORING", predicted: "FAILURE PREDICTED",
    failed: "FAILURE DETECTED", plans: "OPTIMIZING RECOVERY", executing: "EXECUTING RECOVERY", stabilized: "MISSION STABILIZED",
  }[phase];
  const phaseColor = {
    nominal: C.cyan, predictive: C.amber, predicted: C.amber, failed: C.red, plans: C.purple, executing: C.purple, stabilized: C.green,
  }[phase];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md" style={{ background: "rgba(5,8,16,0.85)", borderBottom: `1px solid ${C.hairline}` }}>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg grid place-items-center" style={{ border: `1px solid ${C.cyanDim}`, background: "rgba(57,199,240,0.08)" }}>
            <Satellite size={18} color={C.cyan} />
          </div>
          <div>
            <div className="text-sm font-bold tracking-wide leading-none" style={{ color: C.textHi }}>ORBIT-R</div>
            <div className="text-[11px] font-mono leading-none mt-1" style={{ color: C.textLo }}>Operational Resilience Engine · SIH 2026</div>
          </div>
          <div className="hidden lg:flex items-center gap-2 ml-4 pl-4" style={{ borderLeft: `1px solid ${C.hairline}` }}>
            <span className="w-2 h-2 rounded-full node-pulse" style={{ background: phaseColor, color: phaseColor }} />
            <span className="text-xs font-mono tracking-wider font-semibold" style={{ color: phaseColor }}>{phaseLabel}</span>
          </div>
        </div>

        {/* Scenario Switcher Dropdown */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 rounded-xl p-1" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.hairline}` }}>
            {SCENARIOS.map((sc) => {
              const active = sc.id === scenarioId;
              return (
                <button
                  key={sc.id}
                  onClick={() => setScenarioId(sc.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
                  style={{
                    background: active ? "rgba(57,199,240,0.14)" : "transparent",
                    color: active ? C.cyan : C.textMid,
                    border: `1px solid ${active ? C.cyanDim : "transparent"}`,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? C.cyan : C.textLo }} />
                  {sc.shortName}
                </button>
              );
            })}
          </div>

          {phase !== "nominal" && (
            <button onClick={onReset} className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition hover:opacity-80"
              style={{ border: `1px solid ${C.hairline}`, color: C.textMid }}>
              <RotateCcw size={13} /> Reset Mission
            </button>
          )}
          <button onClick={onRunDemo} className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg transition hover:brightness-110"
            style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: "#04121C" }}>
            <Play size={13} fill="#04121C" /> Run Scenario Demo
          </button>
        </div>
      </div>
    </header>
  );
}

/* ========================== STORYLINE STEPPER ============================ */

function StorylineStepper({ phase, demoStep, demoMode }) {
  const getActiveIdx = () => {
    if (demoMode) return demoStep;
    if (phase === "nominal") return 0;
    if (phase === "predictive") return 1;
    if (phase === "predicted") return 2;
    if (phase === "failed") return 4;
    if (phase === "plans") return 7;
    if (phase === "executing") return 8;
    if (phase === "stabilized") return 9;
    return 0;
  };
  const activeIdx = getActiveIdx();

  return (
    <Panel className="py-3 px-4">
      <div className="flex items-center justify-between text-[10px] font-mono tracking-wider mb-2" style={{ color: C.textLo }}>
        <span>NARRATIVE WORKFLOW: PREDICT → FAILURE → PROPAGATE → OPTIMIZE → RECOVER → MEASURE</span>
        <span style={{ color: C.cyan }}>STAGE {activeIdx + 1}/10: {DEMO_STAGES[activeIdx]}</span>
      </div>
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
        {DEMO_STAGES.map((st, i) => {
          const done = i < activeIdx;
          const current = i === activeIdx;
          return (
            <div key={st} className="flex flex-col gap-1">
              <div className="h-1.5 rounded-full transition-all duration-500" style={{
                background: current ? C.cyan : done ? C.green : "rgba(255,255,255,0.06)",
                boxShadow: current ? `0 0 10px ${C.cyan}` : "none",
              }} />
              <div className="text-[9px] font-mono truncate" style={{ color: current ? C.cyan : done ? C.textMid : C.textLo }}>
                {st.split(" ")[0]}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ============================ MISSION CONTROL ============================= */

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

function MissionControl({ scenario, phase, onAnalyzeRisk, onInjectFailure }) {
  const isPost = ["failed", "plans", "executing", "stabilized"].includes(phase);
  const healthVal = phase === "stabilized" ? scenario.availability.after : isPost ? scenario.availability.during : 100;
  const healthColor = healthVal >= 90 ? C.green : healthVal >= 70 ? C.cyan : healthVal >= 50 ? C.amber : C.red;

  const resourceVal = phase === "stabilized" ? scenario.resources.after.overall : isPost ? scenario.resources.during.overall : scenario.resources.before.overall;

  return (
    <Panel className="fade-in">
      <SectionLabel
        eyebrow="1. MISSION STATUS OVERVIEW"
        title={`ORBIT-R Control · Active: ${scenario.name}`}
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={onAnalyzeRisk}
              disabled={phase !== "nominal"}
              className="flex items-center gap-2 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110"
              style={{ background: `linear-gradient(135deg, ${C.amber}, #D98822)`, color: "#0c0802" }}
            >
              <Activity size={15} /> Analyze Risk
            </button>
            <button
              onClick={onInjectFailure}
              disabled={phase !== "nominal" && phase !== "predictive" && phase !== "predicted"}
              className="flex items-center gap-2 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110"
              style={{ background: `linear-gradient(135deg, ${C.red}, #C22C3B)`, color: "#fff", boxShadow: phase === "predicted" ? `0 0 22px rgba(241,76,90,0.4)` : "none" }}
            >
              <AlertTriangle size={15} /> Inject Failure
            </button>
          </div>
        }
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard icon={Activity} label="Mission Health" value={healthVal} suffix="%" color={healthColor} />
        <StatCard icon={ListChecks} label="Active Tasks" value={isPost && phase !== "stabilized" ? 24 - scenario.impact.tasksAtRiskCount : 24} suffix={`/24`} color={C.textHi} />
        <StatCard icon={Satellite} label="Satellites" value={scenario.type === "Compute" && isPost ? 3 : 4} suffix="/4" color={C.textHi} />
        <StatCard icon={TowerControl} label="Ground Stations" value={scenario.type === "Communication" && isPost ? 2 : 3} suffix="/3" color={C.textHi} />
        <StatCard icon={Radio} label="Comm Links" value={scenario.type === "Communication" && isPost ? 7 : 8} suffix="/8" color={C.textHi} />
        <StatCard icon={Gauge} label="Resource Avail." value={resourceVal} suffix="%" color={C.textHi} />
        <StatCard icon={ShieldAlert} label="Critical Tasks" value={isPost && phase !== "stabilized" ? 10 - scenario.impact.criticalTasksAtRiskCount : 10} suffix="" color={C.textHi} />
        <StatCard icon={Target} label="Mission State" value={
          phase === "nominal" ? "NOMINAL" : phase === "stabilized" ? "STABLE" : phase === "predictive" || phase === "predicted" ? "MONITORING" : "DEGRADED"
        } color={phase === "stabilized" ? C.green : phase === "nominal" ? C.cyan : C.amber} />
      </div>
    </Panel>
  );
}

/* ===================== PREDICTIVE HEALTH MONITORING ======================= */

function PredictiveHealthMonitoring({ scenario, phase }) {
  const p = scenario.predictive;

  return (
    <Panel className="fade-in" style={{ border: `1px solid ${C.amber}44`, background: "rgba(240,169,62,0.04)" }}>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Activity size={16} color={C.amber} />
          <span className="text-xs font-mono tracking-widest font-semibold" style={{ color: C.amber }}>2. PREDICTIVE HEALTH MONITORING</span>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${C.hairline}`, color: C.textMid }}>
          PROTOTYPE SIMULATION DATA
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
          <div className="text-[10px] font-mono uppercase" style={{ color: C.textLo }}>Failure Probability</div>
          <div className="text-2xl font-bold font-mono" style={{ color: C.amber }}>{p.probability}%</div>
          <div className="text-[10px] font-mono" style={{ color: C.textLo }}>Risk Threshold: &gt;75%</div>
        </div>
        <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
          <div className="text-[10px] font-mono uppercase" style={{ color: C.textLo }}>Prediction Confidence</div>
          <div className="text-2xl font-bold font-mono" style={{ color: C.cyan }}>{p.confidence}%</div>
          <div className="text-[10px] font-mono" style={{ color: C.textLo }}>ML Telemetry Confidence</div>
        </div>
        <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
          <div className="text-[10px] font-mono uppercase" style={{ color: C.textLo }}>Est. Failure Window</div>
          <div className="text-2xl font-bold font-mono" style={{ color: C.purple }}>{p.window}</div>
          <div className="text-[10px] font-mono" style={{ color: C.textLo }}>Time to Breakdown</div>
        </div>
        <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
          <div className="text-[10px] font-mono uppercase" style={{ color: C.textLo }}>Anomaly Score</div>
          <div className="text-2xl font-bold font-mono" style={{ color: C.amber }}>{p.anomalyScore}</div>
          <div className="text-[10px] font-mono" style={{ color: C.textLo }}>Normalized (0.0 - 1.0)</div>
        </div>
        <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
          <div className="text-[10px] font-mono uppercase" style={{ color: C.textLo }}>Risk Level</div>
          <div className="text-2xl font-bold font-mono" style={{ color: C.red }}>{p.riskLevel}</div>
          <div className="text-[10px] font-mono" style={{ color: C.red }}>ACTION SUGGESTED</div>
        </div>
      </div>

      <div className="rounded-lg p-3 flex items-start gap-2 text-xs font-mono" style={{ background: "rgba(240,169,62,0.1)", border: `1px solid ${C.amber}44`, color: C.textHi }}>
        <AlertTriangle size={15} color={C.amber} className="mt-0.5 shrink-0" />
        <div>
          <span style={{ color: C.amber, fontWeight: 700 }}>TELEMETRY ANOMALY DETECTED ({scenario.targetId}):</span> {p.telemetryNotice}
        </div>
      </div>
    </Panel>
  );
}

/* ==================== DEPENDENCY & PROPAGATION GRAPH ===================== */

function NodeBox({ x, y, w, h, status, label, sub, Icon, live }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.ok;
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
  const s = STATUS_STYLE[status] || STATUS_STYLE.ok;
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

function DependencyGraphPanel({ scenario, phase }) {
  const failed = ["failed", "plans", "executing", "stabilized"].includes(phase);
  const stabilized = phase === "stabilized";

  const nodeMap = stabilized ? scenario.graphRecoveredNodes : scenario.graphNodes;
  const activeNodes = failed ? nodeMap : { sats: {}, links: {}, gs: {}, tasks: {} };

  const getStatus = (cat, id) => activeNodes[cat]?.[id] || "ok";

  return (
    <Panel className="fade-in overflow-hidden">
      <SectionLabel
        eyebrow="PILLAR 1: FAILURE PROPAGATION — 'How far will the failure spread?'"
        title="Mission Dependency & Failure Cascade Network"
        right={
          <div className="flex items-center gap-3 text-[10.5px] font-mono flex-wrap">
            <LegendDot color={C.red} label="Failed Node" />
            <LegendDot color={C.amber} label="Direct / Indirect Impact" />
            <LegendDot color={C.red} label="Critical Task at Risk" />
            <LegendDot color={C.cyan} label="Safe / Unaffected" />
            <LegendDot color={C.purple} label="Recovered / Alternate Path" />
          </div>
        }
      />

      {failed && (
        <div className="mb-4 flex items-center gap-2 text-xs font-mono flex-wrap" style={{ color: C.textMid }}>
          <span className="px-2 py-1 rounded font-bold" style={{ background: "rgba(241,76,90,0.15)", color: C.red }}>
            FAILED: {scenario.impact.failedNode}
          </span>
          <ArrowRight size={12} />
          <span className="px-2 py-1 rounded" style={{ background: "rgba(240,169,62,0.15)", color: C.amber }}>
            DIRECT: {scenario.impact.directNodes.join(", ")}
          </span>
          <ArrowRight size={12} />
          <span className="px-2 py-1 rounded" style={{ background: "rgba(240,169,62,0.15)", color: C.amber }}>
            INDIRECT: {scenario.impact.indirectNodes.join(", ")}
          </span>
          {stabilized && (
            <>
              <ArrowRight size={12} />
              <span className="px-2 py-1 rounded font-bold" style={{ background: "rgba(177,140,255,0.18)", color: C.purple }}>
                BACKUP ACTIVE ({scenario.backup.backup.split("&")[0]})
              </span>
            </>
          )}
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

          {/* Row Headers */}
          <text x="16" y={Y_SAT - 26} fontSize="10" fontFamily="ui-monospace, monospace" fill={C.textLo} letterSpacing="2">SATELLITES</text>
          <text x="16" y={Y_LINK - 26} fontSize="10" fontFamily="ui-monospace, monospace" fill={C.textLo} letterSpacing="2">COMM. LINKS</text>
          <text x="16" y={Y_GS - 26} fontSize="10" fontFamily="ui-monospace, monospace" fill={C.textLo} letterSpacing="2">GROUND STATIONS</text>
          <text x="16" y={Y_TASK - 26} fontSize="10" fontFamily="ui-monospace, monospace" fill={C.textLo} letterSpacing="2">MISSION TASKS</text>

          {/* Edges */}
          {LINKS.map((l) => {
            const a = centerOf("sat", l.sat), b = centerOf("link", l.id), c = centerOf("gs", l.gs);
            const st1 = combine(getStatus("sats", l.sat), getStatus("links", l.id));
            const st2 = combine(getStatus("links", l.id), getStatus("gs", l.gs));
            return (
              <g key={l.id}>
                <EdgePath x1={a.x} y1={a.y + 20} x2={b.x} y2={b.y - 16} status={st1} />
                <EdgePath x1={b.x} y1={b.y + 16} x2={c.x} y2={c.y - 20} status={st2} />
              </g>
            );
          })}

          {TASKS.map((t) => {
            const from = t.from.startsWith("SAT") ? centerOf("sat", t.from) : centerOf("gs", t.from);
            const to = centerOf("task", t.id);
            const fromStatus = t.from.startsWith("SAT") ? getStatus("sats", t.from) : getStatus("gs", t.from);
            const st = combine(fromStatus, getStatus("tasks", t.id));
            return <EdgePath key={"e" + t.id} x1={from.x} y1={from.y + 20} x2={to.x} y2={to.y - 15} status={st} dashed={t.from.startsWith("SAT")} />;
          })}

          {/* Scenario Specific Backup Reroute Lines when Stabilized */}
          {stabilized && scenario.id === "comm" && (
            <g>
              <EdgePath x1={centerOf("sat", "SAT-02").x} y1={centerOf("sat", "SAT-02").y + 20}
                x2={centerOf("gs", "GS-01").x} y2={centerOf("gs", "GS-01").y - 20} status="recovered" />
              <text x={(centerOf("sat", "SAT-02").x + centerOf("gs", "GS-01").x) / 2} y={(Y_SAT + Y_GS) / 2 - 4}
                fontSize="9" fontFamily="ui-monospace, monospace" fill={C.purple} textAnchor="middle">ALT ROUTE VIA C06</text>
            </g>
          )}

          {stabilized && scenario.id === "power" && (
            <g>
              <EdgePath x1={centerOf("sat", "SAT-03").x} y1={centerOf("sat", "SAT-03").y + 20}
                x2={centerOf("sat", "SAT-02").x} y2={centerOf("sat", "SAT-02").y + 20} status="recovered" />
              <text x={(centerOf("sat", "SAT-03").x + centerOf("sat", "SAT-02").x) / 2} y={Y_SAT + 32}
                fontSize="9" fontFamily="ui-monospace, monospace" fill={C.purple} textAnchor="middle">BATTERY & POWER TRANSFER</text>
            </g>
          )}

          {stabilized && scenario.id === "obc" && (
            <g>
              <EdgePath x1={centerOf("sat", "SAT-01").x} y1={centerOf("sat", "SAT-01").y + 20}
                x2={centerOf("sat", "SAT-03").x} y2={centerOf("sat", "SAT-03").y + 20} status="recovered" />
              <text x={(centerOf("sat", "SAT-01").x + centerOf("sat", "SAT-03").x) / 2} y={Y_SAT + 32}
                fontSize="9" fontFamily="ui-monospace, monospace" fill={C.purple} textAnchor="middle">CORE B & COMPUTE MIGRATION</text>
            </g>
          )}

          {/* Nodes */}
          {SATELLITES.map((s) => (
            <NodeBox key={s.id} x={s.x} y={Y_SAT} w={96} h={44} status={getStatus("sats", s.id)} label={s.id} Icon={Satellite}
              live={getStatus("sats", s.id) !== "ok"} />
          ))}
          {LINKS.map((l) => (
            <NodeBox key={l.id} x={l.x} y={Y_LINK} w={62} h={34} status={getStatus("links", l.id)} label={l.id}
              live={getStatus("links", l.id) !== "ok"} />
          ))}
          {GROUND.map((g) => (
            <NodeBox key={g.id} x={g.x} y={Y_GS} w={96} h={44} status={getStatus("gs", g.id)} label={g.id} Icon={TowerControl}
              live={getStatus("gs", g.id) !== "ok"} />
          ))}
          {TASKS.map((t) => (
            <NodeBox key={t.id} x={t.x} y={Y_TASK} w={58} h={30} status={getStatus("tasks", t.id)} label={t.id}
              live={getStatus("tasks", t.id) === "critical"} />
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

/* ============================ IMPACT ANALYSIS PANEL ============================ */

function ImpactAnalysisPanel({ scenario, phase, health }) {
  const stabilized = phase === "stabilized";
  const imp = scenario.impact;
  return (
    <Panel className="fade-in">
      <SectionLabel eyebrow="IMPACT PROPAGATION SUMMARY" title={`Failure Propagation Breakdown — ${scenario.targetComponent}`} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <MiniStat label="Directly Affected" value={imp.directImpactCount} unit="components" color={C.amber} />
        <MiniStat label="Indirectly Affected" value={imp.indirectImpactCount} unit="components" color={C.amber} />
        <MiniStat label="Critical Tasks at Risk" value={imp.criticalTasksAtRiskCount} unit="critical tasks" color={C.red} />
        <MiniStat label="Mission Value at Risk" value={`${imp.missionValueAtRisk}%`} unit="capacity drop" color={C.red} />
      </div>

      <div className="rounded-lg p-3 text-xs font-mono" style={{ background: "rgba(241,76,90,0.08)", border: `1px solid ${C.red}44`, color: C.textHi }}>
        <span style={{ color: C.red, fontWeight: 700 }}>ORBIT-R PROPAGATION ENGINE:</span> Identified local fault on {scenario.targetId} cascading into {imp.directImpactCount + imp.indirectImpactCount} components with {imp.missionValueAtRisk}% mission capability at risk.
      </div>
    </Panel>
  );
}

function MiniStat({ label, value, unit, color = C.textHi }) {
  return (
    <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
      <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: C.textLo }}>{label}</div>
      <div className="text-xl font-bold font-mono" style={{ color }}>{value}</div>
      <div className="text-[10px]" style={{ color: C.textLo }}>{unit}</div>
    </div>
  );
}

/* ======================= RESOURCE UTILIZATION ANALYSIS ====================== */

function ResourceUtilizationPanel({ scenario }) {
  const r = scenario.resources;

  const chartData = [
    { key: "Bandwidth", before: r.before.bandwidth, during: r.during.bandwidth, after: r.after.bandwidth },
    { key: "Computing", before: r.before.compute, during: r.during.compute, after: r.after.compute },
    { key: "Power", before: r.before.power, during: r.during.power, after: r.after.power },
    { key: "Ground", before: r.before.ground, during: r.during.ground, after: r.after.ground },
    { key: "Satellite", before: r.before.satellite, during: r.during.satellite, after: r.after.satellite },
  ];

  return (
    <Panel className="fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gauge size={15} color={C.cyan} />
          <span className="text-xs font-mono tracking-widest font-semibold" style={{ color: C.cyan }}>RESOURCE ALLOCATION ANALYSIS</span>
        </div>
        <div className="text-[10px] font-mono" style={{ color: C.textLo }}>Before / During / After</div>
      </div>

      <div style={{ height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={C.hairline} />
            <XAxis dataKey="key" tick={{ fontSize: 8.5, fill: C.textLo }} axisLine={{ stroke: C.hairline }} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: C.textLo }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: C.bgPanelSolid, border: `1px solid ${C.hairline}`, fontSize: 11 }} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="before" fill={C.cyan} name="Before" radius={[3, 3, 0, 0]} />
            <Bar dataKey="during" fill={C.red} name="During" radius={[3, 3, 0, 0]} />
            <Bar dataKey="after" fill={C.green} name="After" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-lg p-2.5" style={{ background: "rgba(57,199,240,0.08)", border: `1px solid rgba(57,199,240,0.28)` }}>
        <Info size={13} color={C.cyan} className="mt-0.5 shrink-0" />
        <div className="text-[11px]" style={{ color: C.textMid }}>
          Overall resource availability: <span style={{ color: C.cyan, fontWeight: 700 }}>{r.before.overall}% → {r.during.overall}% → {r.after.overall}%</span>. Surviving capacity re-allocated.
        </div>
      </div>
    </Panel>
  );
}

/* ====================== BACKUP & REDUNDANCY ANALYSIS ======================= */

function BackupRedundancyPanel({ scenario }) {
  const b = scenario.backup;
  return (
    <Panel className="fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Layers size={15} color={C.purple} />
        <span className="text-xs font-mono tracking-widest font-semibold" style={{ color: C.purple }}>BACKUP & REDUNDANCY RELATIONSHIPS</span>
      </div>

      <div className="rounded-xl p-3 mb-3" style={{ background: "rgba(177,140,255,0.08)", border: `1px solid rgba(177,140,255,0.25)` }}>
        <div className="text-[10px] font-mono" style={{ color: C.textLo }}>PRIMARY → BACKUP PAIR</div>
        <div className="text-xs font-bold font-mono mt-1" style={{ color: C.textHi }}>{b.primary}</div>
        <div className="text-xs font-bold font-mono" style={{ color: C.purple }}>↓ {b.backup}</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
          <div className="text-[9.5px] font-mono uppercase" style={{ color: C.textLo }}>Backup Readiness</div>
          <div className="text-lg font-bold font-mono" style={{ color: C.green }}>{b.readiness}%</div>
        </div>
        <div className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
          <div className="text-[9.5px] font-mono uppercase" style={{ color: C.textLo }}>Backup Success Rate</div>
          <div className="text-lg font-bold font-mono" style={{ color: C.cyan }}>{b.successRate}%</div>
        </div>
        <div className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
          <div className="text-[9.5px] font-mono uppercase" style={{ color: C.textLo }}>Switchover Time</div>
          <div className="text-lg font-bold font-mono" style={{ color: C.purple }}>{b.switchoverTime}</div>
        </div>
        <div className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
          <div className="text-[9.5px] font-mono uppercase" style={{ color: C.textLo }}>Backup Capacity</div>
          <div className="text-lg font-bold font-mono" style={{ color: C.textHi }}>{b.capacity}%</div>
        </div>
      </div>
    </Panel>
  );
}

/* ============================ RECOVERY OPTIMIZER ============================ */

function RecoveryOptimizer({ scenario, phase, onGenerate, onExecute }) {
  const plansReady = phase !== "failed";
  return (
    <Panel className="fade-in">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={15} color={C.purple} />
        <span className="text-xs font-mono tracking-widest font-semibold" style={{ color: C.purple }}>
          PILLAR 2: RECOVERY OPTIMIZATION — "What is the best way to keep the mission running?"
        </span>
      </div>
      <SectionLabel
        eyebrow=""
        title="Recovery Strategy Decision Engine"
        right={!plansReady ? (
          <button onClick={onGenerate} className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition hover:brightness-110"
            style={{ background: `linear-gradient(135deg, ${C.purple}, #8B5FE8)`, color: "#0b0716" }}>
            <Sparkles size={15} /> Generate Recovery Plans
          </button>
        ) : phase === "plans" ? (
          <button onClick={onExecute} className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition hover:brightness-110"
            style={{ background: `linear-gradient(135deg, ${C.green}, #1EAF77)`, color: "#04140C" }}>
            <CheckCircle2 size={15} /> Execute Best Plan
          </button>
        ) : null}
      />

      {/* Optimization Score Weights Bar */}
      <div className="mb-4 p-3 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs font-mono"
        style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
        <span style={{ color: C.textLo }}>WEIGHTED CONSTRAINT SCORE FORMULA:</span>
        <span style={{ color: C.purple }}>Mission Value (40%)</span>
        <span style={{ color: C.cyan }}>Resource Efficiency (25%)</span>
        <span style={{ color: C.amber }}>Recovery Time (20%)</span>
        <span style={{ color: C.green }}>Operational Risk (15%)</span>
      </div>

      {!plansReady && (
        <div className="text-sm py-6 text-center" style={{ color: C.textLo }}>
          Awaiting operator command — generate feasible recovery alternatives from surviving satellite & ground resources.
        </div>
      )}

      {plansReady && (
        <div className="grid md:grid-cols-3 gap-4 mt-2">
          {scenario.plans.map((p) => (
            <div key={p.key} className="relative rounded-xl p-4 fade-in flex flex-col justify-between" style={{
              background: p.best ? "rgba(177,140,255,0.08)" : "rgba(255,255,255,0.02)",
              border: `1.5px solid ${p.best ? C.purple : C.hairline}`,
              boxShadow: p.best ? `0 0 26px rgba(177,140,255,0.25)` : "none",
            }}>
              {p.best && (
                <div className="absolute -top-3 left-4 flex items-center gap-1 text-[10.5px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: C.purple, color: "#0b0716" }}>
                  <Star size={11} fill="#0b0716" /> RECOMMENDED PLAN
                </div>
              )}
              <div>
                <div className="text-[10px] font-mono tracking-wider mt-1" style={{ color: C.textLo }}>PLAN {p.key}</div>
                <div className="text-sm font-bold mb-3" style={{ color: C.textHi }}>{p.name}</div>
                <div className="space-y-1.5 text-xs font-mono">
                  <Row k="Mission value retained" v={`${p.value}%`} color={p.best ? C.purple : C.textHi} />
                  <Row k="Critical tasks recovered" v={p.critRecovered} />
                  <Row k="Operational Risk" v={p.risk} />
                  <Row k="Resource Cost" v={p.cost} />
                  <Row k="Recovery Time" v={p.time} />
                  <Row k="Optimization Score" v={p.score} color={p.best ? C.purple : C.textHi} bold />
                </div>
              </div>

              {p.best && p.whyRationale && (
                <div className="mt-3 pt-3 space-y-1" style={{ borderTop: `1px solid rgba(177,140,255,0.25)` }}>
                  <div className="text-[10px] font-mono font-bold uppercase mb-1" style={{ color: C.purple }}>WHY THIS PLAN?</div>
                  {p.whyRationale.map((r) => (
                    <div key={r} className="flex items-start gap-1.5 text-[11px]" style={{ color: C.textMid }}>
                      <CheckCircle2 size={11} color={C.purple} className="mt-0.5 shrink-0" /> {r}
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

/* ==================== TIMELINE & RECOVERY TIME BREAKDOWN ==================== */

function TimelineAndRecoveryTimePanel({ scenario, execIdx, phase }) {
  const rt = scenario.recoveryTime;
  const bestPlan = scenario.plans.find((p) => p.best);

  return (
    <Panel className="fade-in">
      <SectionLabel eyebrow="RECOVERY TIMELINE & EXECUTION" title={`Total Recovery Time: ${rt.total} min`} />

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        {/* Component times breakdown */}
        <div className="lg:col-span-1 rounded-xl p-4 flex flex-col justify-between" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
          <div className="text-xs font-mono font-semibold mb-2" style={{ color: C.green }}>RECOVERY TIME BREAKDOWN</div>
          <div className="space-y-2 text-xs font-mono">
            <Row k="Detection" v={`${rt.detection} min`} />
            <Row k="Impact Analysis" v={`${rt.impactAnalysis} min`} />
            <Row k="Optimization" v={`${rt.optimization} min`} />
            <Row k="Backup Activation" v={`${rt.backupActivation} min`} />
            <Row k="Stabilization" v={`${rt.stabilization} min`} />
            <div className="pt-2 flex justify-between font-bold" style={{ borderTop: `1px solid ${C.hairline}`, color: C.green }}>
              <span>Total Recovery Time</span>
              <span>{rt.total} min</span>
            </div>
          </div>
        </div>

        {/* Milestone Timeline */}
        <div className="lg:col-span-2 rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
          <div className="text-xs font-mono font-semibold mb-3" style={{ color: C.cyan }}>SCENARIO MILESTONE CHRONOLOGY</div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] font-mono">
            {scenario.timeline.map((tl, i) => (
              <div key={i} className="p-2 rounded" style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${C.hairline}` }}>
                <div className="font-bold" style={{ color: tl.status === "critical" ? C.red : tl.status === "success" ? C.green : C.cyan }}>{tl.time}</div>
                <div className="truncate font-semibold mt-0.5" style={{ color: C.textHi }}>{tl.title}</div>
                <div className="text-[9px] mt-1 line-clamp-2" style={{ color: C.textLo }}>{tl.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Execution step progress */}
      <div className="rounded-xl p-4" style={{ background: "rgba(56,217,147,0.04)", border: `1px solid ${C.green}44` }}>
        <div className="flex items-center gap-2 mb-3">
          <Clock size={15} color={C.green} />
          <span className="text-xs font-mono tracking-widest font-semibold" style={{ color: C.green }}>
            EXECUTING PLAN {bestPlan.key}: {bestPlan.name.toUpperCase()}
          </span>
        </div>
        <div className="space-y-1.5">
          {scenario.execSteps.map((s, i) => {
            const done = i <= execIdx || phase === "stabilized";
            const active = i === execIdx && phase === "executing";
            return (
              <div key={s} className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-mono" style={{
                background: active ? "rgba(56,217,147,0.08)" : "transparent",
              }}>
                {done ? <CheckCircle2 size={14} color={C.green} /> : <span className="w-3.5 h-3.5 rounded-full inline-block" style={{ border: `1.5px solid ${C.hairline}` }} />}
                <span style={{ color: done ? C.textHi : C.textLo }}>{s}</span>
                {active && <RefreshCw size={11} color={C.green} className="ml-auto animate-spin" />}
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

/* ============================ MISSION OUTCOME SUMMARY ============================ */

function MissionOutcomeSummary({ scenario }) {
  const b = scenario.backup;
  const a = scenario.availability;
  const bestPlan = scenario.plans.find((p) => p.best);

  return (
    <Panel className="fade-in" style={{ border: `1px solid rgba(56,217,147,0.4)`, background: "rgba(56,217,147,0.06)" }}>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={20} color={C.green} />
          <span className="text-base font-mono tracking-widest font-bold" style={{ color: C.green }}>
            PILLAR 3: RECOVERY MEASUREMENT — MISSION STABILIZED
          </span>
        </div>
        <span className="text-xs font-mono px-3 py-1 rounded-full font-bold" style={{ background: C.green, color: "#04140C" }}>
          STATUS: MISSION STABILIZED
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
        <MiniOutcomeStat label="Mission Availability" value={`${a.after}%`} sub={`During: ${a.during}%`} color={C.green} />
        <MiniOutcomeStat label="Value Retained" value={`${bestPlan.value}%`} sub="Target: >90%" color={C.purple} />
        <MiniOutcomeStat label="Data Loss" value={`${scenario.dataIntegrity.lossPercentage}%`} sub={`${scenario.dataIntegrity.lostGB} GB`} color={C.amber} />
        <MiniOutcomeStat label="Recovery Time" value={`${scenario.recoveryTime.total} min`} sub="Target: <20m" color={C.cyan} />
        <MiniOutcomeStat label="Backup Success" value={`${b.successRate}%`} sub={`Ready: ${b.readiness}%`} color={C.green} />
        <MiniOutcomeStat label="Resource Avail." value={`${scenario.resources.after.overall}%`} sub={`During: ${scenario.resources.during.overall}%`} color={C.textHi} />
        <MiniOutcomeStat label="Critical Tasks" value={`${bestPlan.critRecovered}`} sub="100% Preserved" color={C.green} />
      </div>

      <div className="rounded-xl p-3 text-xs font-mono flex items-center justify-between flex-wrap gap-2" style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${C.hairline}` }}>
        <span style={{ color: C.textMid }}>CAPABILITY PRESERVATION PROOF:</span>
        <span style={{ color: C.cyan }}>BEFORE: {a.before}% Availability</span>
        <span style={{ color: C.red }}>→ DURING: {a.during}%</span>
        <span style={{ color: C.green, fontWeight: 700 }}>→ AFTER RECOVERY: {a.after}% (+{a.recoveredDelta}%)</span>
      </div>
    </Panel>
  );
}

function MiniOutcomeStat({ label, value, sub, color }) {
  return (
    <div className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.hairline}` }}>
      <div className="text-[9.5px] font-mono uppercase" style={{ color: C.textLo }}>{label}</div>
      <div className="text-lg font-bold font-mono" style={{ color }}>{value}</div>
      <div className="text-[9.5px] font-mono" style={{ color: C.textLo }}>{sub}</div>
    </div>
  );
}

/* ================= DATA INTEGRITY & MISSION AVAILABILITY ================== */

function DataIntegrityAvailabilityPanel({ scenario }) {
  const d = scenario.dataIntegrity;
  const a = scenario.availability;

  return (
    <Panel className="fade-in">
      <SectionLabel eyebrow="RECOVERY MEASUREMENT" title="Data Integrity & Mission Availability" />
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Data Integrity */}
        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
          <div className="text-xs font-mono font-semibold mb-3 flex items-center justify-between" style={{ color: C.cyan }}>
            <span>DATA INTEGRITY METRICS</span>
            <span>DATA LOSS: {d.lossPercentage}%</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div><span style={{ color: C.textLo }}>Generated:</span> <span className="font-bold">{d.generatedGB} GB</span></div>
            <div><span style={{ color: C.textLo }}>Preserved:</span> <span className="font-bold" style={{ color: C.green }}>{d.preservedGB} GB</span></div>
            <div><span style={{ color: C.textLo }}>Data Lost:</span> <span className="font-bold" style={{ color: C.red }}>{d.lostGB} GB</span></div>
            <div><span style={{ color: C.textLo }}>Backup Recovery:</span> <span className="font-bold" style={{ color: C.purple }}>{d.recoveryPercentage}%</span></div>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden mt-3" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full" style={{ width: `${d.recoveryPercentage}%`, background: C.green }} />
          </div>
        </div>

        {/* Mission Availability */}
        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
          <div className="text-xs font-mono font-semibold mb-3 flex items-center justify-between" style={{ color: C.purple }}>
            <span>MISSION AVAILABILITY</span>
            <span style={{ color: C.green }}>RECOVERED: +{a.recoveredDelta}%</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="p-2 rounded" style={{ background: "rgba(57,199,240,0.08)" }}>
              <div className="text-[10px]" style={{ color: C.textLo }}>BEFORE</div>
              <div className="text-lg font-bold" style={{ color: C.cyan }}>{a.before}%</div>
            </div>
            <div className="p-2 rounded" style={{ background: "rgba(241,76,90,0.08)" }}>
              <div className="text-[10px]" style={{ color: C.textLo }}>DURING</div>
              <div className="text-lg font-bold" style={{ color: C.red }}>{a.during}%</div>
            </div>
            <div className="p-2 rounded" style={{ background: "rgba(56,217,147,0.08)" }}>
              <div className="text-[10px]" style={{ color: C.textLo }}>AFTER</div>
              <div className="text-lg font-bold" style={{ color: C.green }}>{a.after}%</div>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ==================== DETECTION METRICS & CONFUSION MATRIX ===================== */

function DetectionMetricsPanel({ scenario }) {
  const m = scenario.metrics;
  const cm = m.confusionMatrix;

  return (
    <Panel className="fade-in">
      <SectionLabel eyebrow="MODEL EVALUATION" title="Detection & Prediction Performance" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <MetricCard
          title="Failure Detection Accuracy"
          value={`${m.detectionAccuracy}%`}
          formula="Correctly detected failures / Total actual failures × 100"
          color={C.green}
        />
        <MetricCard
          title="Failure Prediction Accuracy"
          value={`${m.predictionAccuracy}%`}
          formula="Correct predictions / Total predictions × 100"
          color={C.cyan}
        />
        <MetricCard
          title="False Alarm Rate"
          value={`${m.falseAlarmRate}%`}
          formula="False alarms / Total alerts × 100"
          color={C.amber}
        />
      </div>

      {/* Visual Confusion Matrix */}
      <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
        <div className="text-xs font-mono font-semibold mb-2 flex items-center justify-between" style={{ color: C.textHi }}>
          <span>CONFUSION MATRIX</span>
          <span className="text-[10px]" style={{ color: C.textLo }}>N = {cm.tp + cm.fp + cm.fn + cm.tn}</span>
        </div>

        <div className="grid grid-cols-3 text-center text-[10px] font-mono gap-1">
          <div className="py-1"></div>
          <div className="py-1 font-bold" style={{ color: C.textLo }}>ACTUAL FAIL</div>
          <div className="py-1 font-bold" style={{ color: C.textLo }}>ACTUAL NORM</div>

          <div className="py-2 text-right pr-1 font-bold" style={{ color: C.textLo }}>PRED FAIL</div>
          <div className="py-2 rounded font-bold text-sm" style={{ background: "rgba(56,217,147,0.15)", color: C.green }}>
            TP: {cm.tp}
          </div>
          <div className="py-2 rounded font-bold text-sm" style={{ background: "rgba(240,169,62,0.15)", color: C.amber }}>
            FP: {cm.fp}
          </div>

          <div className="py-2 text-right pr-1 font-bold" style={{ color: C.textLo }}>PRED NORM</div>
          <div className="py-2 rounded font-bold text-sm" style={{ background: "rgba(241,76,90,0.15)", color: C.red }}>
            FN: {cm.fn}
          </div>
          <div className="py-2 rounded font-bold text-sm" style={{ background: "rgba(57,199,240,0.15)", color: C.cyan }}>
            TN: {cm.tn}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function MetricCard({ title, value, formula, color }) {
  return (
    <div className="rounded-xl p-3 flex flex-col justify-between" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
      <div>
        <div className="text-[11px] font-mono mb-1" style={{ color: C.textLo }}>{title}</div>
        <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
      </div>
      <div className="mt-2 text-[9.5px] font-mono rounded p-1.5" style={{ background: "rgba(0,0,0,0.3)", color: C.textLo }}>
        {formula}
      </div>
    </div>
  );
}

/* ========================= SCENARIO COMPARISON MATRIX ========================= */

function ScenarioComparisonPanel({ currentId }) {
  return (
    <Panel className="fade-in">
      <SectionLabel eyebrow="MULTI-SCENARIO PROOF" title="Scenario Comparison Matrix" />
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono text-left">
          <thead>
            <tr style={{ color: C.textLo, borderBottom: `1px solid ${C.hairline}` }}>
              <th className="py-2">SCENARIO</th>
              <th className="py-2">TARGET</th>
              <th className="py-2">IMPACT</th>
              <th className="py-2">RECOVERY</th>
              <th className="py-2">DATA LOSS</th>
              <th className="py-2">AVAILABILITY</th>
            </tr>
          </thead>
          <tbody>
            {SCENARIOS.map((sc) => {
              const active = sc.id === currentId;
              return (
                <tr key={sc.id} style={{
                  borderBottom: `1px solid ${C.hairline}`,
                  background: active ? "rgba(57,199,240,0.06)" : "transparent",
                }}>
                  <td className="py-2.5 font-bold" style={{ color: active ? C.cyan : C.textHi }}>
                    {sc.shortName} {active && " (Active)"}
                  </td>
                  <td className="py-2.5" style={{ color: C.textMid }}>{sc.targetId}</td>
                  <td className="py-2.5" style={{ color: sc.severity === "CRITICAL" ? C.red : C.amber }}>{sc.severity}</td>
                  <td className="py-2.5" style={{ color: C.purple }}>{sc.recoveryTime.total} min</td>
                  <td className="py-2.5" style={{ color: C.amber }}>{sc.dataIntegrity.lossPercentage}%</td>
                  <td className="py-2.5 font-bold" style={{ color: C.green }}>{sc.availability.after}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ============================ MISSION REPORT PANEL ============================ */

function MissionReportPanel({ scenario, onExport }) {
  const bestPlan = scenario.plans.find((p) => p.best);
  const fields = [
    ["Scenario", scenario.name],
    ["Target Component", scenario.targetComponent],
    ["Failure Propagation", `${scenario.impact.directImpactCount + scenario.impact.indirectImpactCount} components affected (${scenario.impact.missionValueAtRisk}% value at risk)`],
    ["Tasks at Risk", `${scenario.impact.tasksAtRiskCount} (${scenario.impact.criticalTasksAtRiskCount} critical)`],
    ["Selected Recovery Plan", `Plan ${bestPlan.key} — ${bestPlan.name}`],
    ["Optimization Score", bestPlan.score],
    ["Recovery Time", `${scenario.recoveryTime.total} min`],
    ["Mission Availability", `Before: ${scenario.availability.before}% → After: ${scenario.availability.after}%`],
    ["Data Loss", `${scenario.dataIntegrity.lossPercentage}% (${scenario.dataIntegrity.lostGB} GB)`],
    ["Outcome", "Mission Stabilized"],
  ];

  return (
    <Panel className="fade-in">
      <SectionLabel
        eyebrow="EXECUTIVE SUMMARY"
        title="Mission Resilience Report"
        right={
          <button onClick={onExport} className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition hover:brightness-110"
            style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: "#04121C" }}>
            <Download size={15} /> Export Mission Report
          </button>
        }
      />
      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-xs">
        {fields.map(([k, v]) => (
          <div key={k} className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${C.hairline}` }}>
            <span style={{ color: C.textLo }}>{k}</span>
            <span className="font-mono font-semibold" style={{ color: k === "Outcome" ? C.green : C.textHi }}>{v}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-start gap-2 text-[11px] rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", color: C.textLo }}>
        <FileText size={13} className="mt-0.5 shrink-0" />
        Component {scenario.targetId} remains degraded/failed. Mission resilience restored via surviving resources, redundant failover paths, and decision optimization. Prototype simulation data.
      </div>
    </Panel>
  );
}
