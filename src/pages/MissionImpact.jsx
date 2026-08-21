import React from "react";
import { AlertTriangle, ShieldAlert, Activity, CheckCircle2, Clock, ListChecks, Target } from "lucide-react";
import { useMission, C } from "../context/MissionContext";
import { Panel, SectionLabel, StatCard } from "../components/common/CommonUI";
import { BeforeAfterComparison, RadialGauge } from "../components/visuals/VisualComponents";

export function MissionImpact() {
  const { currentScenario, phase } = useMission();
  const imp = currentScenario.impact;
  const a = currentScenario.availability;
  const isPost = ["failed", "plans", "executing", "stabilized"].includes(phase);
  const stabilized = phase === "stabilized";

  const taskTableData = [
    { id: "T02", name: "High-Res EO Downlink", sat: "SAT-01", prio: "CRITICAL", status: isPost && !stabilized ? "AT RISK" : "NORMAL", impact: "High", recovery: "96% (Reroute C06)" },
    { id: "T07", name: "Orbital Telemetry Ingest", sat: "SAT-02", prio: "CRITICAL", status: isPost && !stabilized ? "SUSPENDED" : "RECOVERED", impact: "Critical", recovery: "98% (GS2 Reassign)" },
    { id: "T11", name: "AIS Vessel Tracking", sat: "SAT-02", prio: "CRITICAL", status: isPost && !stabilized ? "SUSPENDED" : "RECOVERED", impact: "Critical", recovery: "94% (Bandwidth Shift)" },
    { id: "T14", name: "SAR Weather Radar", sat: "SAT-02", prio: "HIGH", status: isPost && !stabilized ? "DEGRADED" : "RECOVERED", impact: "Medium", recovery: "92% (Low-Power Sync)" },
    { id: "T09", name: "Thermal Imaging Pass", sat: "SAT-03", prio: "MEDIUM", status: isPost && !stabilized ? "DEGRADED" : "RECOVERED", impact: "Medium", recovery: "90% (SAT-02 Offload)" },
    { id: "T18", name: "Constellation Sync", sat: "SAT-03", prio: "HIGH", status: isPost && !stabilized ? "AT RISK" : "RECOVERED", impact: "High", recovery: "95% (Battery Aux)" },
  ];

  const objectives = [
    { name: "Earth Observation", pct: isPost && !stabilized ? 62 : 100, color: isPost && !stabilized ? C.amber : C.green },
    { name: "Communication Link", pct: isPost && !stabilized ? 54 : 94, color: isPost && !stabilized ? C.red : C.green },
    { name: "Scientific Experiments", pct: isPost && !stabilized ? 78 : 98, color: C.green },
    { name: "Orbital Navigation", pct: 100, color: C.green },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Impact Overview */}
      <Panel style={{ border: `1px solid ${C.red}44`, background: "rgba(241,76,90,0.04)" }}>
        <SectionLabel
          eyebrow="PAGE 4: MISSION IMPACT DASHBOARD"
          title="What Does This Failure Mean for the Mission?"
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
          <StatCard icon={AlertTriangle} label="Tasks Affected" value={isPost ? imp.tasksAtRiskCount : 0} suffix=" Tasks" color={C.amber} />
          <StatCard icon={ShieldAlert} label="Critical Affected" value={isPost ? imp.criticalTasksAtRiskCount : 0} suffix=" Critical" color={C.red} />
          <StatCard icon={Activity} label="Mission Degradation" value={isPost && !stabilized ? Math.round(imp.missionValueAtRisk) : 0} suffix="%" color={C.red} />
          <StatCard icon={Clock} label="Estimated Delay" value={isPost ? Math.round(currentScenario.recoveryTime.total) : 0} suffix=" min" color={C.purple} />
          <StatCard icon={ListChecks} label="Tasks Preserved" value={isPost ? (stabilized ? 24 : 24 - imp.tasksAtRiskCount) : 24} suffix="/24" color={C.green} />
          <StatCard icon={Target} label="Objectives Affected" value={isPost ? 3 : 0} suffix="/4" color={C.amber} />
        </div>
      </Panel>

      {/* Visual Before vs After Failure & Objective Radial Gauges */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <BeforeAfterComparison beforeVal={a.before} failureVal={a.during} recoveredVal={a.after} unit="%" />
        </div>

        <Panel className="lg:col-span-2">
          <SectionLabel eyebrow="OBJECTIVES IMPACT METER" title="Mission Objective Health Indicators" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {objectives.map((obj, i) => (
              <RadialGauge key={i} value={obj.pct} label={obj.name} color={obj.color} size={100} />
            ))}
          </div>
        </Panel>
      </div>

      {/* Affected Tasks Table */}
      <Panel>
        <SectionLabel eyebrow="AFFECTED TASKS MATRIX" title="Task Vulnerability & Recovery Feasibility Matrix" />
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead>
              <tr style={{ color: C.textLo, borderBottom: `1px solid ${C.hairline}` }}>
                <th className="py-2.5 px-3">TASK</th>
                <th className="py-2.5 px-3">SATELLITE</th>
                <th className="py-2.5 px-3">PRIORITY</th>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3">IMPACT</th>
                <th className="py-2.5 px-3">RECOVERY</th>
              </tr>
            </thead>
            <tbody>
              {taskTableData.map((t) => (
                <tr key={t.id} style={{ borderBottom: `1px solid ${C.hairline}`, background: t.status.includes("SUSPENDED") || t.status.includes("AT RISK") ? "rgba(241,76,90,0.06)" : "transparent" }}>
                  <td className="py-3 px-3 font-bold" style={{ color: C.textHi }}>{t.id} — {t.name}</td>
                  <td className="py-3 px-3" style={{ color: C.textMid }}>{t.sat}</td>
                  <td className="py-3 px-3 font-bold" style={{ color: t.prio === "CRITICAL" ? C.red : C.amber }}>{t.prio}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{
                      background: t.status === "RECOVERED" ? "rgba(56,217,147,0.15)" : t.status === "NORMAL" ? "rgba(57,199,240,0.15)" : "rgba(241,76,90,0.15)",
                      color: t.status === "RECOVERED" ? C.green : t.status === "NORMAL" ? C.cyan : C.red,
                    }}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-3" style={{ color: t.impact === "Critical" ? C.red : C.amber }}>{t.impact}</td>
                  <td className="py-3 px-3 font-bold" style={{ color: C.purple }}>{t.recovery}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
