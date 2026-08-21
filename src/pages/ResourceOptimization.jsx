import React from "react";
import { Cpu, Gauge, Info, CheckCircle2, ArrowRight, Sparkles, Layers, Sliders } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMission, C } from "../context/MissionContext";
import { Panel, SectionLabel, StatCard } from "../components/common/CommonUI";
import { RadialGauge } from "../components/visuals/VisualComponents";

export function ResourceOptimization() {
  const { currentScenario, phase } = useMission();
  const r = currentScenario.resources;
  const bestPlan = currentScenario.plans.find((p) => p.best);

  const chartData = [
    { key: "Bandwidth", before: r.before.bandwidth, during: r.during.bandwidth, after: r.after.bandwidth },
    { key: "Computing", before: r.before.compute, during: r.during.compute, after: r.after.compute },
    { key: "Power", before: r.before.power, during: r.during.power, after: r.after.power },
    { key: "Ground", before: r.before.ground, during: r.during.ground, after: r.after.ground },
    { key: "Satellite", before: r.before.satellite, during: r.during.satellite, after: r.after.satellite },
  ];

  const allocations = [
    { task: "Task T07 (Downlink)", current: "C03 (Degraded)", recommended: "C05 (SAT-03 ↔ GS-02)", reasoning: "C05 provides sufficient bandwidth and lower failure risk" },
    { task: "Task T12 (Vessel AIS)", current: "GS-02 (Congested)", recommended: "GS-03 (Backup Station)", reasoning: "GS-03 has 48% idle capacity and zero packet drop" },
    { task: "Task T18 (Payload Sync)", current: "S03 Solar Array Primary", recommended: "S04 Aux Battery Transfer", reasoning: "Aux power transfer keeps sensors operating without thermal load" },
    { task: "Task T14 (Weather Radar)", current: "SAT-02 Processing Core", recommended: "SAT-04 Offload Core", reasoning: "SAT-04 aux processor executes compute without frame drops" },
  ];

  const candidateResources = [
    { id: "C04", name: "Backup Link C04", risk: "68% (HIGH)", score: 64.2, status: "REJECTED" },
    { id: "C05", name: "Ku Link C05", risk: "12% (LOW)", score: 94.2, status: "SELECTED BY ORBIT-R", best: true },
    { id: "C06", name: "X-Band C06", risk: "34% (MED)", score: 81.5, status: "REJECTED" },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Header Banner */}
      <Panel style={{ border: `1px solid ${C.cyan}44`, background: "rgba(57,199,240,0.04)" }}>
        <SectionLabel
          eyebrow="PAGE 5: INTELLIGENT RESOURCE OPTIMIZATION ENGINE"
          title="How Does Orbit-R Intelligently Reallocate Remaining Resources?"
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <StatCard icon={Gauge} label="Before Failure Avail." value={r.before.overall} suffix="%" color={C.cyan} />
          <StatCard icon={Gauge} label="During Failure Drop" value={r.during.overall} suffix="%" color={C.red} />
          <StatCard icon={Gauge} label="After Optimization" value={r.after.overall} suffix="%" color={C.green} />
          <StatCard icon={Sparkles} label="Optimization Score" value={bestPlan.score} suffix="" color={C.purple} />
        </div>
      </Panel>

      {/* Resource Utilization Gauges Grid */}
      <Panel>
        <SectionLabel eyebrow="CIRCULAR RESOURCE GAUGES" title="Surviving Resource Capacity Gauges" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <RadialGauge value={r.after.bandwidth} label="Bandwidth Capacity" color={C.cyan} size={100} />
          <RadialGauge value={r.after.compute} label="Computing Slots" color={C.purple} size={100} />
          <RadialGauge value={r.after.power} label="Bus Power Reserve" color={C.green} size={100} />
          <RadialGauge value={r.after.ground} label="Ground Station Load" color={C.cyan} size={100} />
        </div>
      </Panel>

      {/* OPTIMIZATION CANDIDATE DECISION PANEL */}
      <Panel style={{ border: `1px solid ${C.purple}44`, background: "rgba(177,140,255,0.06)" }}>
        <SectionLabel eyebrow="AUTOMATED DECISION ENGINE" title="Candidate Resource Evaluation & Selection Proof" />
        <div className="grid md:grid-cols-3 gap-4">
          {candidateResources.map((cand) => (
            <div key={cand.id} className="rounded-xl p-4 flex flex-col justify-between font-mono text-xs" style={{
              background: cand.best ? "rgba(177,140,255,0.12)" : "rgba(255,255,255,0.02)",
              border: `1.5px solid ${cand.best ? C.purple : C.hairline}`,
            }}>
              <div>
                <div className="text-[10px] uppercase font-bold" style={{ color: C.textLo }}>CANDIDATE RESOURCE</div>
                <div className="text-sm font-bold my-1" style={{ color: C.textHi }}>{cand.name}</div>
                <div className="space-y-1 text-[11px] mt-2">
                  <div className="flex justify-between"><span style={{ color: C.textLo }}>Failure Risk:</span><span style={{ color: cand.best ? C.green : C.red }}>{cand.risk}</span></div>
                  <div className="flex justify-between"><span style={{ color: C.textLo }}>Optimization Score:</span><span style={{ color: cand.best ? C.purple : C.textMid, fontWeight: 800 }}>{cand.score}</span></div>
                </div>
              </div>
              <div className="mt-3 pt-2 text-[10px] font-bold uppercase text-center rounded" style={{
                background: cand.best ? C.purple : "rgba(255,255,255,0.04)",
                color: cand.best ? "#0b0716" : C.textLo,
              }}>
                {cand.status}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* CURRENT VS RECOMMENDED ALLOCATION MATRIX */}
      <Panel>
        <SectionLabel eyebrow="DYNAMIC REALLOCATION MATRIX" title="Current Allocation vs Orbit-R Recommended Allocation" />
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead>
              <tr style={{ color: C.textLo, borderBottom: `1px solid ${C.hairline}` }}>
                <th className="py-2.5 px-3">MISSION TASK</th>
                <th className="py-2.5 px-3">CURRENT ALLOCATION</th>
                <th className="py-2.5 px-3">ORBIT-R RECOMMENDED ALLOCATION</th>
                <th className="py-2.5 px-3">SELECTION REASONING</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((a, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${C.hairline}` }}>
                  <td className="py-3 px-3 font-bold" style={{ color: C.textHi }}>{a.task}</td>
                  <td className="py-3 px-3" style={{ color: C.red }}>{a.current}</td>
                  <td className="py-3 px-3 font-bold" style={{ color: C.green }}>{a.recommended}</td>
                  <td className="py-3 px-3" style={{ color: C.textMid }}>{a.reasoning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
