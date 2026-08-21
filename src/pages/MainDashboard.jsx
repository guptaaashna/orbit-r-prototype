import React, { useRef, useEffect } from "react";
import {
  Satellite, AlertTriangle, Activity, Zap, CheckCircle2,
  Gauge, Download, Info, Sparkles, RefreshCw, Target, Layers,
  Clock, ArrowRight, Star, ShieldAlert, Radio, ListChecks, FileText,
  TowerControl, Cpu,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { SCENARIOS } from "../data/scenarioData";
import { useMission, C, DEMO_STAGES } from "../context/MissionContext";
import { Panel, SectionLabel, StatCard } from "../components/common/CommonUI";
import { PropagationGraph } from "../components/charts/PropagationGraph";
import { SparklineCard, NetworkTopologyMinimap } from "../components/visuals/VisualComponents";

export function MainDashboard() {
  const {
    currentScenario,
    phase,
    demoStep,
    demoMode,
    execIdx,
    health,
    analyzeRisk,
    injectFailure,
    generatePlans,
    executeBestPlan,
    exportReport,
    scenarioId,
  } = useMission();

  const predRef = useRef(null);
  const graphRef = useRef(null);
  const optimizerRef = useRef(null);
  const execRef = useRef(null);
  const stableRef = useRef(null);

  const isPostFailure = ["failed", "plans", "executing", "stabilized"].includes(phase);
  const showPredictive = ["predictive", "predicted", "failed", "plans", "executing", "stabilized"].includes(phase);
  const showExec = ["executing", "stabilized"].includes(phase);
  const showStable = phase === "stabilized";

  // Automatic Page 1 Top-to-Bottom Smooth Scroll Driver during Run Scenario
  useEffect(() => {
    if (!demoMode) return;
    if (demoStep === 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (demoStep === 1 && predRef.current) {
      predRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if ((demoStep === 2 || demoStep === 3) && graphRef.current) {
      graphRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if ((demoStep === 4 || demoStep === 5) && optimizerRef.current) {
      optimizerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (demoStep === 6 && execRef.current) {
      execRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (demoStep >= 7 && stableRef.current) {
      stableRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [demoStep, demoMode, phase]);

  // Mock live sparkline series for telemetry
  const isFail = isPostFailure;
  const snrData = [
    { val: 24 }, { val: 24 }, { val: 22 }, { val: isFail ? 12 : 24 }, { val: isFail ? 8 : 25 }
  ];
  const lossData = [
    { val: 0.1 }, { val: 0.2 }, { val: 0.5 }, { val: isFail ? 28 : 0.2 }, { val: isFail ? 42 : 0.1 }
  ];
  const powerData = [
    { val: 28 }, { val: 28 }, { val: 27 }, { val: scenarioId === "power" && isFail ? 14 : 28 }, { val: scenarioId === "power" && isFail ? 11 : 28 }
  ];
  const cpuData = [
    { val: 45 }, { val: 46 }, { val: 52 }, { val: scenarioId === "obc" && isFail ? 98 : 48 }, { val: scenarioId === "obc" && isFail ? 100 : 45 }
  ];

  return (
    <div className="space-y-7">
      <StorylineStepper phase={phase} demoStep={demoStep} demoMode={demoMode} />

      {/* SECTION 1: MISSION CONTROL OVERVIEW */}
      <MissionControl
        scenario={currentScenario}
        phase={phase}
        onAnalyzeRisk={analyzeRisk}
        onInjectFailure={injectFailure}
      />

      {/* NEW: VISUAL MISSION NETWORK TOPOLOGY MAP */}
      <NetworkTopologyMinimap scenario={currentScenario} />

      {/* SECTION 2: PREDICTIVE HEALTH MONITORING */}
      <div ref={predRef}>
        {showPredictive && <PredictiveHealthMonitoring scenario={currentScenario} phase={phase} snrData={snrData} lossData={lossData} powerData={powerData} cpuData={cpuData} />}
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
          <RecoveryOptimizer
            scenario={currentScenario}
            phase={phase}
            onGenerate={generatePlans}
            onExecute={executeBestPlan}
          />
        )}
      </div>

      {/* SECTION 8: EXECUTION TIMELINE & RECOVERY TIME */}
      <div ref={execRef}>
        {showExec && (
          <TimelineAndRecoveryTimePanel
            scenario={currentScenario}
            execIdx={execIdx}
            phase={phase}
          />
        )}
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
    </div>
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
              className="flex items-center gap-2 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 cursor-pointer"
              style={{ background: `linear-gradient(135deg, ${C.amber}, #D98822)`, color: "#0c0802" }}
            >
              <Activity size={15} /> Analyze Risk
            </button>
            <button
              onClick={onInjectFailure}
              disabled={phase !== "nominal" && phase !== "predictive" && phase !== "predicted"}
              className="flex items-center gap-2 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 cursor-pointer"
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
function PredictiveHealthMonitoring({ scenario, phase, snrData, lossData, powerData, cpuData }) {
  const p = scenario.predictive;
  const isPost = ["failed", "plans", "executing", "stabilized"].includes(phase);

  return (
    <Panel className="fade-in space-y-4" style={{ border: `1px solid ${C.amber}44`, background: "rgba(240,169,62,0.04)" }}>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
        <div className="flex items-center gap-2">
          <Activity size={16} color={C.amber} />
          <span className="text-xs font-mono tracking-widest font-semibold" style={{ color: C.amber }}>2. PREDICTIVE HEALTH MONITORING</span>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${C.hairline}`, color: C.textMid }}>
          REAL-TIME TELEMETRY ANOMALY ENGINE
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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

      {/* NEW: LIVE TELEMETRY SPARKLINE CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SparklineCard label="Signal Noise Ratio (SNR)" value={isPost ? "8.2" : "24.5"} unit="dB" data={snrData} color={isPost ? C.red : C.cyan} trend={isPost ? "-66%" : "NOMINAL"} />
        <SparklineCard label="Packet Loss Rate" value={isPost ? "42.5" : "0.1"} unit="%" data={lossData} color={isPost ? C.red : C.cyan} trend={isPost ? "+42%" : "NOMINAL"} />
        <SparklineCard label="Primary Bus Voltage" value={scenario.id === "power" && isPost ? "11.4" : "28.0"} unit="V" data={powerData} color={scenario.id === "power" && isPost ? C.red : C.green} trend={scenario.id === "power" && isPost ? "-59%" : "NOMINAL"} />
        <SparklineCard label="CPU Heartbeat Load" value={scenario.id === "obc" && isPost ? "100" : "45"} unit="%" data={cpuData} color={scenario.id === "obc" && isPost ? C.red : C.cyan} trend={scenario.id === "obc" && isPost ? "LOCK" : "NOMINAL"} />
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

/* ==================== DEPENDENCY GRAPH PANEL ===================== */
function DependencyGraphPanel({ scenario, phase }) {
  return <PropagationGraph />;
}

/* ============================ IMPACT ANALYSIS PANEL ============================ */
function ImpactAnalysisPanel({ scenario, phase, health }) {
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
          <button onClick={onGenerate} className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition hover:brightness-110 cursor-pointer"
            style={{ background: `linear-gradient(135deg, ${C.purple}, #8B5FE8)`, color: "#0b0716" }}>
            <Sparkles size={15} /> Generate Recovery Plans
          </button>
        ) : phase === "plans" ? (
          <button onClick={onExecute} className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition hover:brightness-110 cursor-pointer"
            style={{ background: `linear-gradient(135deg, ${C.green}, #1EAF77)`, color: "#04140C" }}>
            <CheckCircle2 size={15} /> Execute Best Plan
          </button>
        ) : null}
      />

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
        <MetricCard title="Failure Detection Accuracy" value={`${m.detectionAccuracy}%`} formula="Correctly detected failures / Total actual failures × 100" color={C.green} />
        <MetricCard title="Failure Prediction Accuracy" value={`${m.predictionAccuracy}%`} formula="Correct predictions / Total predictions × 100" color={C.cyan} />
        <MetricCard title="False Alarm Rate" value={`${m.falseAlarmRate}%`} formula="False alarms / Total alerts × 100" color={C.amber} />
      </div>

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
          <div className="py-2 rounded font-bold text-sm" style={{ background: "rgba(56,217,147,0.15)", color: C.green }}>TP: {cm.tp}</div>
          <div className="py-2 rounded font-bold text-sm" style={{ background: "rgba(240,169,62,0.15)", color: C.amber }}>FP: {cm.fp}</div>

          <div className="py-2 text-right pr-1 font-bold" style={{ color: C.textLo }}>PRED NORM</div>
          <div className="py-2 rounded font-bold text-sm" style={{ background: "rgba(241,76,90,0.15)", color: C.red }}>FN: {cm.fn}</div>
          <div className="py-2 rounded font-bold text-sm" style={{ background: "rgba(57,199,240,0.15)", color: C.cyan }}>TN: {cm.tn}</div>
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
          <button onClick={onExport} className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition hover:brightness-110 cursor-pointer"
            style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: "#04121C" }}>
            <Download size={15} /> Export Mission Report
          </button>
        }
      />
      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-xs font-mono">
        {fields.map(([k, v]) => (
          <div key={k} className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${C.hairline}` }}>
            <span style={{ color: C.textLo }}>{k}</span>
            <span className="font-semibold" style={{ color: k === "Outcome" ? C.green : C.textHi }}>{v}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-start gap-2 text-[11px] rounded-lg p-3 font-mono" style={{ background: "rgba(255,255,255,0.02)", color: C.textLo }}>
        <FileText size={13} className="mt-0.5 shrink-0" color={C.cyan} />
        Component {scenario.targetId} remains degraded/failed. Mission resilience restored via surviving resources, redundant failover paths, and decision optimization. Operational simulation data.
      </div>
    </Panel>
  );
}
