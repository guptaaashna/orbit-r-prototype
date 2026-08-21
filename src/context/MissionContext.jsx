import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SCENARIOS } from "../data/scenarioData";

const MissionContext = createContext();

export const DEMO_STAGES = [
  "NORMAL MISSION",
  "PREDICTIVE MONITORING",
  "FAILURE CONFIRMED",
  "PROPAGATION CASCADE",
  "IMPACT ANALYSIS",
  "RESOURCE & BACKUP",
  "RECOVERY OPTIMIZATION",
  "RECOVERY EXECUTION",
  "MISSION STABILIZED",
];

export const C = {
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

export const STATUS_STYLE = {
  ok: { stroke: C.cyan, fill: "rgba(57,199,240,0.08)", text: C.cyan, glow: "0 0 0 rgba(0,0,0,0)" },
  warning: { stroke: C.amber, fill: "rgba(240,169,62,0.12)", text: C.amber, glow: `0 0 14px rgba(240,169,62,0.35)` },
  critical: { stroke: C.red, fill: "rgba(241,76,90,0.14)", text: C.red, glow: `0 0 18px rgba(241,76,90,0.45)` },
  recovered: { stroke: C.purple, fill: "rgba(177,140,255,0.12)", text: C.purple, glow: `0 0 14px rgba(177,140,255,0.35)` },
};

export function MissionProvider({ children }) {
  const navigate = useNavigate();
  const [scenarioId, setScenarioId] = useState("comm");
  const [phase, setPhase] = useState("nominal"); // nominal | predictive | predicted | failed | plans | executing | stabilized
  const [demoMode, setDemoMode] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [execIdx, setExecIdx] = useState(-1);
  const [toasts, setToasts] = useState([]);
  const [health, setHealth] = useState([{ t: "T-0", v: 100 }]);

  const currentScenario = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];
  const timers = useRef([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const push = useCallback((msg, kind = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, kind }]);
    const tm = setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
    timers.current.push(tm);
  }, []);

  const handleSelectScenario = (id) => {
    if (phase !== "nominal" && phase !== "predictive" && phase !== "predicted") {
      resetAll();
    }
    setScenarioId(id);
    const s = SCENARIOS.find((sc) => sc.id === id);
    push(`Switched to ${s.name}`, "info");
  };

  const analyzeRisk = () => {
    setPhase("predictive");
    push(`Predictive Monitoring Active — Scanning ${currentScenario.targetComponent}`, "warning");
    const tm = setTimeout(() => {
      setPhase("predicted");
      push(`HIGH RISK: ${currentScenario.predictive.probability}% Failure Probability predicted for ${currentScenario.targetId}`, "critical");
    }, 1200);
    timers.current.push(tm);
  };

  const injectFailure = () => {
    setPhase("failed");
    const failureHealthVal = Math.round(currentScenario.availability.during);
    setHealth((h) => [...h, { t: "FAILURE", v: failureHealthVal }]);
    push(`FAILURE CONFIRMED — ${currentScenario.targetComponent}`, "critical");
    timers.current.push(setTimeout(() => push(currentScenario.impact.propagationNotice, "warning"), 900));
    timers.current.push(setTimeout(() => push(`${currentScenario.impact.tasksAtRiskCount} tasks at risk — ${currentScenario.impact.criticalTasksAtRiskCount} critical`, "warning"), 1800));
  };

  const generatePlans = () => {
    setPhase("plans");
    push("3 recovery plans generated & scored by Decision Engine", "info");
  };

  const executeBestPlan = () => {
    setPhase("executing");
    setExecIdx(0);
    const bestPlan = currentScenario.plans.find((p) => p.best);
    push(`Executing Plan ${bestPlan.key} — ${bestPlan.name}`, "purple");

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
  };

  const resetAll = () => {
    clearTimers();
    setPhase("nominal");
    setExecIdx(-1);
    setHealth([{ t: "T-0", v: 100 }]);
    setDemoMode(false);
    setDemoStep(0);
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
    push("Mission state reset to Nominal", "info");
  };

  /* AUTOMATED PAGE 1 TOP-TO-BOTTOM AUTO-SCROLL EXECUTION ENGINE */
  const runDemo = () => {
    clearTimers();
    setPhase("nominal");
    setExecIdx(-1);
    setHealth([{ t: "T-0", v: 100 }]);
    setDemoMode(true);
    setDemoStep(0);

    push("Starting Page 1 Scenario Execution Sequence", "info");

    // Ensure we are on Page 1
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });

    const at = (ms, fn) => timers.current.push(setTimeout(fn, ms));

    // Stage 1: Predictive Health Monitoring (Scroll down to Predictive Panel)
    at(1400, () => {
      setDemoStep(1);
      analyzeRisk();
    });

    // Stage 2: Failure Confirmed (Scroll down to Dependency Graph & Impact)
    at(3800, () => {
      setDemoStep(2);
      injectFailure();
    });

    // Stage 3: Propagation Cascade
    at(6200, () => {
      setDemoStep(3);
    });

    // Stage 4: Impact & Resource Analysis
    at(8600, () => {
      setDemoStep(4);
    });

    // Stage 5: Recovery Optimization (Scroll down to Recovery Optimizer)
    at(11000, () => {
      setDemoStep(5);
      generatePlans();
    });

    // Stage 6: Recovery Execution (Scroll down to Execution Timeline)
    at(13400, () => {
      setDemoStep(6);
      executeBestPlan();
    });

    // Stage 7: Mission Stabilized & Final Report (Scroll down to Bottom Outcome Panel)
    const execDuration = 550 * currentScenario.execSteps.length + 1200;
    at(13400 + execDuration, () => {
      setDemoStep(7);
      push("Scenario Execution Completed — Mission Stabilized", "success");
    });
  };

  const exportReport = () => {
    const s = currentScenario;
    const bestPlan = s.plans.find((p) => p.best);
    const body = `ORBIT-R MISSION RESILIENCE REPORT
==================================================
Mission: EO-MISSION-01 | Operational Resilience Assessment
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
failover, and decision optimization. Operational simulation data.
-- ORBIT-R Resilience Engine --
`;
    const blob = new Blob([body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orbitr_${s.id}_mission_report.txt`;
    a.click();
    URL.revokeObjectURL(url);
    push("Mission report exported", "info");
  };

  return (
    <MissionContext.Provider
      value={{
        scenarioId,
        currentScenario,
        phase,
        demoMode,
        demoStep,
        execIdx,
        toasts,
        health,
        setScenarioId: handleSelectScenario,
        analyzeRisk,
        injectFailure,
        generatePlans,
        executeBestPlan,
        stabilize,
        resetAll,
        runDemo,
        exportReport,
        push,
      }}
    >
      {children}
    </MissionContext.Provider>
  );
}

export function useMission() {
  const context = useContext(MissionContext);
  if (!context) throw new Error("useMission must be used within a MissionProvider");
  return context;
}
