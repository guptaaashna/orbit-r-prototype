import React from "react";
import { Sparkles, CheckCircle2, Star, Clock, ShieldAlert, Zap } from "lucide-react";
import { useMission, C } from "../context/MissionContext";
import { Panel, SectionLabel } from "../components/common/CommonUI";
import { DecisionTreeDiagram } from "../components/visuals/VisualComponents";

export function RecoveryPlanning() {
  const { currentScenario, phase, generatePlans, executeBestPlan } = useMission();
  const plansReady = phase !== "failed" && phase !== "nominal" && phase !== "predictive" && phase !== "predicted";
  const bestPlan = currentScenario.plans.find((p) => p.best);

  const strategies = [
    { title: "Strategy 1 — Communication Link Rerouting", risk: "Low (18%)", cost: "Medium (35%)", recovered: "5/6 Tasks", time: "8 min", score: 88.4, plan: currentScenario.plans[0] },
    { title: "Strategy 2 — Ground Station Reassignment", risk: "Medium (25%)", cost: "Low (20%)", recovered: "4/6 Tasks", time: "5 min", score: 82.7, plan: currentScenario.plans[1] },
    { title: "Strategy 3 — Task Reprioritization & Shedding", risk: "Low (15%)", cost: "Low (10%)", recovered: "4/6 Tasks", time: "4 min", score: 78.2 },
    { title: "Strategy 4 — Multi-Resource Failover (Recommended)", risk: "Low (12%)", cost: "High (50%)", recovered: "6/6 Tasks", time: "11 min", score: 94.2, recommended: true },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <Panel>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={15} color={C.purple} />
          <span className="text-xs font-mono tracking-widest font-semibold" style={{ color: C.purple }}>
            PAGE 6: RECOVERY STRATEGY SELECTION ENGINE
          </span>
        </div>
        <SectionLabel
          eyebrow=""
          title="Recovery Strategy Feasibility & Tradeoff Matrix"
          right={
            !plansReady ? (
              <button onClick={generatePlans} className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition hover:brightness-110 cursor-pointer" style={{ background: `linear-gradient(135deg, ${C.purple}, #8B5FE8)`, color: "#0b0716" }}>
                <Sparkles size={15} /> Generate Recovery Plans
              </button>
            ) : phase === "plans" ? (
              <button onClick={executeBestPlan} className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition hover:brightness-110 cursor-pointer shadow-lg" style={{ background: `linear-gradient(135deg, ${C.green}, #1EAF77)`, color: "#04140C" }}>
                <CheckCircle2 size={15} /> Execute Best Plan
              </button>
            ) : null
          }
        />

        {/* 4 Strategy Visual Scoring Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {strategies.map((st, idx) => (
            <div key={idx} className="relative rounded-xl p-4 flex flex-col justify-between" style={{
              background: st.recommended ? "rgba(177,140,255,0.08)" : "rgba(255,255,255,0.02)",
              border: `1.5px solid ${st.recommended ? C.purple : C.hairline}`,
              boxShadow: st.recommended ? `0 0 24px rgba(177,140,255,0.25)` : "none",
            }}>
              {st.recommended && (
                <div className="absolute -top-3 left-4 flex items-center gap-1 text-[10.5px] font-bold px-2.5 py-1 rounded-full" style={{ background: C.purple, color: "#0b0716" }}>
                  <Star size={11} fill="#0b0716" /> RECOMMENDED PLAN
                </div>
              )}
              <div>
                <div className="text-[10px] font-mono tracking-wider mt-1" style={{ color: C.textLo }}>STRATEGY 0{idx + 1}</div>
                <div className="text-xs font-bold mb-3" style={{ color: C.textHi }}>{st.title}</div>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between"><span style={{ color: C.textLo }}>Risk Score:</span><span style={{ color: C.textHi }}>{st.risk}</span></div>
                  <div className="flex justify-between"><span style={{ color: C.textLo }}>Resource Cost:</span><span style={{ color: C.textHi }}>{st.cost}</span></div>
                  <div className="flex justify-between"><span style={{ color: C.textLo }}>Tasks Recovered:</span><span style={{ color: C.green, fontWeight: 700 }}>{st.recovered}</span></div>
                  <div className="flex justify-between"><span style={{ color: C.textLo }}>Recovery Time:</span><span style={{ color: C.purple }}>{st.time}</span></div>
                  <div className="flex justify-between pt-1" style={{ borderTop: `1px solid ${C.hairline}` }}>
                    <span style={{ color: C.textLo }}>Score:</span>
                    <span style={{ color: st.recommended ? C.purple : C.cyan, fontWeight: 800 }}>{st.score}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* RECOVERY DECISION TREE DIAGRAM */}
      <Panel>
        <SectionLabel eyebrow="AUTOMATED RECOVERY TREE" title="Orbit-R Automated Recovery Logic Diagram" />
        <DecisionTreeDiagram />
      </Panel>

      {/* RECOMMENDED PLAN CALLOUT */}
      <Panel style={{ border: `1px solid ${C.purple}44`, background: "rgba(177,140,255,0.06)" }}>
        <SectionLabel eyebrow="ORBIT-R DECISION ENGINE SELECTION" title={`ORBIT-R RECOMMENDED RECOVERY PLAN: ${bestPlan.name.toUpperCase()}`} />
        <div className="space-y-2 text-xs font-mono">
          <div className="font-bold text-sm mb-2" style={{ color: C.purple }}>WHY THIS STRATEGY WAS SELECTED:</div>
          {bestPlan.whyRationale?.map((r, i) => (
            <div key={i} className="flex items-start gap-2" style={{ color: C.textHi }}>
              <CheckCircle2 size={14} color={C.purple} className="mt-0.5 shrink-0" />
              <span>{r}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
