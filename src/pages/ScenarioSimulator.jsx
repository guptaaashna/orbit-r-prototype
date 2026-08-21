import React from "react";
import { Sliders, Play, Radio, Zap, Cpu, ArrowRight, CheckCircle2 } from "lucide-react";
import { useMission, C } from "../context/MissionContext";
import { Panel, SectionLabel } from "../components/common/CommonUI";
import { SCENARIOS } from "../data/scenarioData";

export function ScenarioSimulator() {
  const { scenarioId, setScenarioId, runDemo } = useMission();

  const iconFor = (type) => {
    if (type === "Communication") return Radio;
    if (type === "Power") return Zap;
    return Cpu;
  };

  const scenarioComparison = [
    { name: "Comm Link Failure", severity: "CRITICAL", prop: "High (SAT-02 & GS-01)", recov: "Easy (Alternative C06)", diffColor: C.green },
    { name: "Power Failure", severity: "HIGH", prop: "Very High (SAT-03 Bus)", recov: "Medium (Battery Aux)", diffColor: C.amber },
    { name: "OBC Computer Failure", severity: "CRITICAL", prop: "Extreme (SAT-01 C&DH)", recov: "Hard (Core B Boot)", diffColor: C.red },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Header Panel */}
      <Panel style={{ border: `1px solid ${C.cyan}44`, background: "rgba(57,199,240,0.04)" }}>
        <SectionLabel
          eyebrow="PAGE 8: SCENARIO SIMULATOR SUITE"
          title="Spacecraft Fault Injection & Multi-Scenario Testing Engine"
        />
        <p className="text-xs font-mono mb-4" style={{ color: C.textMid }}>
          Select a satellite operational failure scenario to inject into the Orbit-R engine. Each scenario uses mathematical models for predictive telemetry, failure propagation cascades, and multi-resource recovery.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={runDemo}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition hover:brightness-110 cursor-pointer shadow-lg"
            style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: "#04121C" }}
          >
            <Play size={14} fill="#04121C" /> Run Guided Scenario
          </button>
        </div>
      </Panel>

      {/* 3 Scenario Cards with Visual Diagrams */}
      <div className="grid md:grid-cols-3 gap-6">
        {SCENARIOS.map((sc) => {
          const active = sc.id === scenarioId;
          const Icon = iconFor(sc.type);
          return (
            <Panel
              key={sc.id}
              className="flex flex-col justify-between transition-all duration-300 hover:border-opacity-70"
              style={{
                background: active ? "rgba(57,199,240,0.08)" : C.bgPanel,
                border: `1.5px solid ${active ? C.cyan : C.hairline}`,
                boxShadow: active ? `0 0 24px rgba(57,199,240,0.2)` : "none",
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg grid place-items-center" style={{ background: `${sc.severity === "CRITICAL" ? C.red : C.amber}15`, border: `1px solid ${sc.severity === "CRITICAL" ? C.red : C.amber}44` }}>
                    <Icon size={18} color={sc.severity === "CRITICAL" ? C.red : C.amber} />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold" style={{ background: "rgba(255,255,255,0.06)", color: sc.severity === "CRITICAL" ? C.red : C.amber }}>
                    {sc.severity} SEVERITY
                  </span>
                </div>

                <div className="text-[10px] font-mono tracking-wider" style={{ color: C.textLo }}>SCENARIO 0{sc.id === "comm" ? 1 : sc.id === "power" ? 2 : 3}</div>
                <h3 className="text-sm font-bold mb-2" style={{ color: C.textHi }}>{sc.shortName}</h3>
                <p className="text-xs mb-3" style={{ color: C.textMid }}>{sc.description}</p>

                {/* Subsystem Visual Tree */}
                <div className="rounded-lg p-2.5 my-3 font-mono text-[10px] space-y-1" style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${C.hairline}` }}>
                  <div className="text-[9px] font-bold uppercase" style={{ color: C.cyan }}>SUBSYSTEM FAULT MODEL:</div>
                  {sc.id === "comm" && (
                    <div className="text-slate-300">TRANS ── C03 ── ✖ DOWNLINK ── GS-01</div>
                  )}
                  {sc.id === "power" && (
                    <div className="text-slate-300">SOLAR ── ⚡ BUS DROP ── PAYLOAD SHED</div>
                  )}
                  {sc.id === "obc" && (
                    <div className="text-slate-300">CORE A ── ⚡ LOCKUP ── FAILOVER CORE B</div>
                  )}
                </div>

                <div className="space-y-1.5 text-xs font-mono pt-2" style={{ borderTop: `1px solid ${C.hairline}` }}>
                  <div className="flex justify-between">
                    <span style={{ color: C.textLo }}>Target Component:</span>
                    <span style={{ color: C.textHi, fontWeight: 700 }}>{sc.targetId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: C.textLo }}>Failure Probability:</span>
                    <span style={{ color: C.amber, fontWeight: 700 }}>{sc.predictive.probability}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: C.textLo }}>Tasks at Risk:</span>
                    <span style={{ color: C.red, fontWeight: 700 }}>{sc.impact.tasksAtRiskCount} Tasks</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: C.textLo }}>Est. Recovery Time:</span>
                    <span style={{ color: C.purple, fontWeight: 700 }}>{sc.recoveryTime.total} min</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3" style={{ borderTop: `1px solid ${C.hairline}` }}>
                <button
                  onClick={() => setScenarioId(sc.id)}
                  className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-xl transition cursor-pointer"
                  style={{
                    background: active ? `linear-gradient(135deg, ${C.cyan}, ${C.blue})` : "rgba(255,255,255,0.04)",
                    color: active ? "#04121C" : C.textHi,
                    border: `1px solid ${active ? C.cyan : C.hairline}`,
                  }}
                >
                  {active ? <CheckCircle2 size={14} /> : <Play size={14} />}
                  {active ? "ACTIVE SCENARIO" : "RUN SCENARIO"}
                </button>
              </div>
            </Panel>
          );
        })}
      </div>

      {/* Scenario Comparison Table */}
      <Panel>
        <SectionLabel eyebrow="SCENARIO COMPARISON MATRIX" title="Failure & Recovery Complexity Comparison" />
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead>
              <tr style={{ color: C.textLo, borderBottom: `1px solid ${C.hairline}` }}>
                <th className="py-2.5 px-3">SCENARIO</th>
                <th className="py-2.5 px-3">SEVERITY</th>
                <th className="py-2.5 px-3">PROPAGATION SCOPE</th>
                <th className="py-2.5 px-3">RECOVERY DIFFICULTY</th>
              </tr>
            </thead>
            <tbody>
              {scenarioComparison.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${C.hairline}` }}>
                  <td className="py-3 px-3 font-bold" style={{ color: C.textHi }}>{row.name}</td>
                  <td className="py-3 px-3 font-bold" style={{ color: row.severity === "CRITICAL" ? C.red : C.amber }}>{row.severity}</td>
                  <td className="py-3 px-3" style={{ color: C.amber }}>{row.prop}</td>
                  <td className="py-3 px-3 font-bold" style={{ color: row.diffColor }}>{row.recov}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
