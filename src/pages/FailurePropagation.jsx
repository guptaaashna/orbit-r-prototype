import React from "react";
import { GitFork, AlertTriangle, ArrowRight, ShieldAlert, Layers } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useMission, C } from "../context/MissionContext";
import { Panel, SectionLabel, StatCard } from "../components/common/CommonUI";
import { PropagationGraph } from "../components/charts/PropagationGraph";
import { RadialGauge } from "../components/visuals/VisualComponents";

export function FailurePropagation() {
  const { currentScenario, phase } = useMission();
  const imp = currentScenario.impact;

  const distributionData = [
    { name: "Direct Impact", value: imp.directImpactCount, color: C.red },
    { name: "Indirect Cascade", value: imp.indirectImpactCount, color: C.amber },
    { name: "Critical Objectives", value: imp.criticalTasksAtRiskCount, color: C.red },
    { name: "Recoverable Tasks", value: imp.tasksAtRiskCount - imp.criticalTasksAtRiskCount, color: C.purple },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Header Banner */}
      <Panel style={{ border: `1px solid ${C.amber}44`, background: "rgba(240,169,62,0.04)" }}>
        <SectionLabel
          eyebrow="PAGE 3: FAILURE PROPAGATION & DEPENDENCY NETWORK"
          title="How Does One Failure Propagate Through an Interconnected Space Mission?"
        />

        <div className="grid lg:grid-cols-4 gap-4 items-center mb-4">
          <div className="lg:col-span-1 rounded-xl p-3 flex flex-col items-center justify-center" style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${C.hairline}` }}>
            <RadialGauge value={92} max={100} label="CRITICALITY SCORE" sub="High Cascade Risk" color={C.red} size={110} />
          </div>

          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={ShieldAlert} label="Failed Node" value={imp.failedNode} color={C.red} />
            <StatCard icon={GitFork} label="Directly Affected" value={imp.directImpactCount} suffix=" Nodes" color={C.amber} />
            <StatCard icon={GitFork} label="Indirectly Affected" value={imp.indirectImpactCount} suffix=" Nodes" color={C.amber} />
            <StatCard icon={AlertTriangle} label="Critical Tasks" value={imp.criticalTasksAtRiskCount} suffix=" Critical" color={C.red} />
          </div>
        </div>

        {/* Cascade Flow Header */}
        <div className="rounded-xl p-3 flex items-center justify-between flex-wrap gap-2 text-xs font-mono" style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${C.hairline}` }}>
          <span style={{ color: C.textLo }}>CASCADE FLOW PATH:</span>
          <span style={{ color: C.red, fontWeight: 700 }}>{imp.failedNode}</span>
          <ArrowRight size={12} color={C.amber} />
          <span style={{ color: C.amber }}>{imp.directNodes.join(" & ")}</span>
          <ArrowRight size={12} color={C.amber} />
          <span style={{ color: C.amber }}>{imp.indirectNodes.slice(0, 3).join(", ")}</span>
          <ArrowRight size={12} color={C.red} />
          <span style={{ color: C.red, fontWeight: 700 }}>Critical Objectives ({imp.criticalNodes.join(", ")})</span>
        </div>
      </Panel>

      {/* Hero Interactive Propagation Graph */}
      <PropagationGraph />

      {/* Impact Distribution & Rationale Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Panel className="lg:col-span-1">
          <SectionLabel eyebrow="IMPACT DISTRIBUTION" title="Node Risk Breakdown" />
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4}>
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: C.bgPanelSolid, border: `1px solid ${C.hairline}`, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 text-[11px] font-mono mt-2">
            {distributionData.map((d, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="flex items-center gap-1.5" style={{ color: C.textMid }}>
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: d.color }} /> {d.name}
                </span>
                <span className="font-bold" style={{ color: C.textHi }}>{d.value}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="lg:col-span-2">
          <SectionLabel eyebrow="PROPAGATION CASCADE RATIONALE" title="The Cascading Failure Problem" />
          <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "rgba(240,169,62,0.08)", border: `1px solid ${C.amber}33` }}>
            <AlertTriangle size={18} color={C.amber} className="mt-0.5 shrink-0" />
            <div className="space-y-1 text-xs font-mono">
              <div className="font-bold" style={{ color: C.amber }}>CASCADE SUMMARY:</div>
              <p style={{ color: C.textHi }}>{imp.propagationNotice}</p>
              <p style={{ color: C.textMid }}>
                Space mission architectures rely on tight coupling between satellites, transponders, and ground stations. Orbit-R's graph traversal engine maps these dependencies instantly upon fault detection.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
