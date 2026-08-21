import React from "react";
import { Clock, CheckCircle2, AlertTriangle, ArrowRight, Activity, Sparkles } from "lucide-react";
import { useMission, C } from "../context/MissionContext";
import { Panel, SectionLabel } from "../components/common/CommonUI";

export function MissionTimeline() {
  const { currentScenario } = useMission();

  const chronologicalEvents = [
    { time: "10:42:01", title: "Normal Operation", desc: "Nominal telemetry across constellation (100% Availability)", state: "NOMINAL", decision: "Continuous Monitoring", result: "Stable Baseline", status: "cyan" },
    { time: "10:42:08", title: "Telemetry Anomaly Detected", desc: `${currentScenario.targetComponent} SNR jitter logged`, state: "MONITORING", decision: "Increase Sampling Rate", result: "Anomaly Flagged", status: "amber" },
    { time: "10:42:14", title: "Failure Probability Threshold Crossed", desc: `Failure probability raised to ${currentScenario.predictive.probability}% by ML engine`, state: "WARNING", decision: "Notify Flight Controller", result: "Risk Elevated to High", status: "amber" },
    { time: "10:42:19", title: "Failure Confirmed", desc: `Signal lock lost on ${currentScenario.targetId}`, state: "CRITICAL", decision: "Trigger Auto-Isolation", result: "Fault Isolated", status: "critical" },
    { time: "10:42:27", title: "Propagation Analysis Started", desc: `Graph engine identified ${currentScenario.impact.directImpactCount + currentScenario.impact.indirectImpactCount} downstream components`, state: "ANALYZING", decision: "Traverse Dependency Tree", result: "Cascade Scope Defined", status: "amber" },
    { time: "10:42:35", title: "Mission Impact Calculated", desc: `${currentScenario.impact.tasksAtRiskCount} tasks at risk (${currentScenario.impact.criticalTasksAtRiskCount} critical)`, state: "DEGRADED", decision: "Assess Capacity Loss", result: `${currentScenario.impact.missionValueAtRisk}% Value at Risk`, status: "critical" },
    { time: "10:42:44", title: "Resource Optimization Started", desc: "Optimizer evaluating surviving satellite & ground station slots", state: "OPTIMIZING", decision: "Solve Constraint Matrix", result: "3 Candidates Generated", status: "purple" },
    { time: "10:42:52", title: "Recovery Plan Generated", desc: `Plan C (Multi-Resource Failover) selected with score ${currentScenario.plans.find(p=>p.best).score}`, state: "PLAN SELECTED", decision: "Operator Approval", result: "Execution Queued", status: "purple" },
    { time: "10:43:01", title: "Recovery Executed", desc: `Alternate path activated (${currentScenario.backup.backup})`, state: "EXECUTING", decision: "Execute Failover Sequence", result: "Workload Shifted", status: "purple" },
    { time: "10:43:10", title: "Mission Stabilized", desc: `Mission Availability restored to ${currentScenario.availability.after}%`, state: "STABILIZED", decision: "Verify Data Integrity", result: "100% Critical Tasks Preserved", status: "success" },
  ];

  return (
    <div className="space-y-6 fade-in">
      <Panel>
        <SectionLabel
          eyebrow="PAGE 9: CHRONOLOGICAL MISSION EVENT TIMELINE"
          title={`Step-by-Step Orbit-R Operational Sequence — ${currentScenario.shortName}`}
        />

        <p className="text-xs font-mono mb-6" style={{ color: C.textMid }}>
          Detailed chronological log documenting every millisecond decision from predictive anomaly detection to full mission stabilization.
        </p>

        {/* Timeline Log */}
        <div className="relative pl-6 space-y-6 border-l-2" style={{ borderColor: C.cyanDim }}>
          {chronologicalEvents.map((evt, i) => (
            <div key={i} className="relative group">
              <span
                className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 grid place-items-center"
                style={{
                  background: C.bgPanelSolid,
                  borderColor: evt.status === "critical" ? C.red : evt.status === "success" ? C.green : evt.status === "purple" ? C.purple : C.cyan,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{
                  background: evt.status === "critical" ? C.red : evt.status === "success" ? C.green : evt.status === "purple" ? C.purple : C.cyan,
                }} />
              </span>

              <div className="rounded-xl p-4 transition-all duration-300 group-hover:border-opacity-60" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <span className="text-xs font-mono font-bold" style={{
                    color: evt.status === "critical" ? C.red : evt.status === "success" ? C.green : evt.status === "purple" ? C.purple : C.cyan,
                  }}>
                    ⏱ {evt.time} — {evt.title}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold" style={{ background: "rgba(255,255,255,0.04)", color: C.textMid }}>
                    {evt.state}
                  </span>
                </div>

                <p className="text-xs font-mono mb-3" style={{ color: C.textHi }}>{evt.desc}</p>

                <div className="grid sm:grid-cols-2 gap-2 text-[10.5px] font-mono pt-2" style={{ borderTop: `1px solid ${C.hairline}` }}>
                  <div><span style={{ color: C.textLo }}>Decision Made:</span> <span style={{ color: C.textMid }}>{evt.decision}</span></div>
                  <div><span style={{ color: C.textLo }}>Resulting State:</span> <span style={{ color: C.cyan, fontWeight: 700 }}>{evt.result}</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
