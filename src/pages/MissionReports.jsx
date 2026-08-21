import React from "react";
import { Download, FileText, CheckCircle2, ShieldCheck, Activity, Award } from "lucide-react";
import { useMission, C } from "../context/MissionContext";
import { Panel, SectionLabel } from "../components/common/CommonUI";
import { PerformanceRadar, BeforeAfterComparison } from "../components/visuals/VisualComponents";

export function MissionReports() {
  const { currentScenario, exportReport } = useMission();
  const bestPlan = currentScenario.plans.find((p) => p.best);
  const a = currentScenario.availability;

  const resilienceMetrics = [
    { label: "Mission Continuity", val: `${a.after}%`, target: ">90%", color: C.green },
    { label: "Critical Task Preservation", val: "100%", target: "100%", color: C.green },
    { label: "Resource Efficiency", val: `${bestPlan.score}%`, target: ">85%", color: C.cyan },
    { label: "Recovery Effectiveness", val: `${currentScenario.backup.successRate}%`, target: ">95%", color: C.purple },
    { label: "Overall Resilience Index", val: "94.8", target: "Scale 100", color: C.green },
  ];

  const sections = [
    {
      title: "1. MISSION SUMMARY",
      items: [
        ["Active Scenario", currentScenario.name],
        ["Target Component", currentScenario.targetComponent],
        ["Initial Mission Health", `${a.before}%`],
        ["Post-Failure Health", `${a.during}%`],
        ["Final Restored Health", `${a.after}%`],
        ["Current Mission State", "STABILIZED"],
      ],
    },
    {
      title: "2. FAILURE DIAGNOSTIC SUMMARY",
      items: [
        ["Failure Type", currentScenario.type],
        ["Failed Component", currentScenario.targetId],
        ["Root Cause", currentScenario.predictive.telemetryNotice],
        ["Severity", currentScenario.severity],
        ["Prediction Confidence", `${currentScenario.predictive.confidence}%`],
      ],
    },
    {
      title: "3. PROPAGATION SUMMARY",
      items: [
        ["Directly Affected Nodes", currentScenario.impact.directNodes.join(", ")],
        ["Indirectly Affected Nodes", currentScenario.impact.indirectNodes.join(", ")],
        ["Mission Tasks at Risk", `${currentScenario.impact.tasksAtRiskCount} Tasks`],
        ["Critical Dependencies at Risk", `${currentScenario.impact.criticalTasksAtRiskCount} Critical Tasks`],
      ],
    },
    {
      title: "4. RECOVERY OPTIMIZATION SUMMARY",
      items: [
        ["Selected Recovery Strategy", `Plan ${bestPlan.key} — ${bestPlan.name}`],
        ["Optimization Score", bestPlan.score],
        ["Tasks Preserved", bestPlan.critRecovered],
        ["Recovery Switchover Time", currentScenario.backup.switchoverTime],
        ["Data Loss Percentage", `${currentScenario.dataIntegrity.lossPercentage}% (${currentScenario.dataIntegrity.lostGB} GB)`],
      ],
    },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Report Header */}
      <Panel>
        <SectionLabel
          eyebrow="PAGE 10: EXECUTIVE RESILIENCE REPORT"
          title="Official Orbit-R Mission Resilience Assessment"
          right={
            <button
              onClick={exportReport}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition hover:brightness-110 cursor-pointer shadow-lg"
              style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: "#04121C" }}
            >
              <Download size={15} /> Generate Mission Report
            </button>
          }
        />

        {/* 5 Resilience Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {resilienceMetrics.map((m) => (
            <div key={m.label} className="rounded-xl p-3.5" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
              <div className="text-[10px] font-mono uppercase" style={{ color: C.textLo }}>{m.label}</div>
              <div className="text-xl font-bold font-mono my-1" style={{ color: m.color }}>{m.val}</div>
              <div className="text-[10px] font-mono" style={{ color: C.textLo }}>Target: {m.target}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* PERFORMANCE RADAR & BEFORE/AFTER PROOF */}
      <div className="grid lg:grid-cols-2 gap-6">
        <PerformanceRadar score={94.8} />
        <BeforeAfterComparison beforeVal={a.before} failureVal={a.during} recoveredVal={a.after} unit="%" />
      </div>

      {/* 4 Detailed Summary Sections */}
      <Panel>
        <SectionLabel eyebrow="EXECUTIVE ASSESSMENT SECTIONS" title="Detailed Audit & Resilience Summary" />
        <div className="grid md:grid-cols-2 gap-6">
          {sections.map((sec) => (
            <div key={sec.title} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
              <div className="text-xs font-mono font-bold uppercase mb-3" style={{ color: C.cyan }}>{sec.title}</div>
              <div className="space-y-2 text-xs font-mono">
                {sec.items.map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1" style={{ borderBottom: `1px solid ${C.hairline}` }}>
                    <span style={{ color: C.textLo }}>{k}:</span>
                    <span className="font-semibold text-right" style={{ color: k === "Current Mission State" ? C.green : C.textHi }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-start gap-2 text-xs font-mono rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", color: C.textLo, border: `1px solid ${C.hairline}` }}>
          <FileText size={14} className="mt-0.5 shrink-0" color={C.cyan} />
          Target component {currentScenario.targetId} remains degraded/failed. Mission resilience restored via surviving satellite & ground resources, alternate communication failover paths, and multi-attribute decision optimization.
        </div>
      </Panel>
    </div>
  );
}
