import React from "react";
import { Award, CheckCircle2, ArrowRight, Activity, ShieldCheck, Gauge } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMission, C } from "../context/MissionContext";
import { Panel, SectionLabel, StatCard } from "../components/common/CommonUI";

export function MissionRecovery() {
  const { currentScenario } = useMission();
  const a = currentScenario.availability;
  const r = currentScenario.resources;
  const bestPlan = currentScenario.plans.find((p) => p.best);

  const curveData = [
    { stage: "Normal (T-0)", health: a.before },
    { stage: "Failure (T+0)", health: a.during },
    { stage: "Optimization (T+5)", health: a.during + 12 },
    { stage: "Recovery (T+9)", health: a.after - 4 },
    { stage: "Stabilized (T+11)", health: a.after },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Header Banner */}
      <Panel style={{ border: `1px solid ${C.green}44`, background: "rgba(56,217,147,0.04)" }}>
        <SectionLabel
          eyebrow="PAGE 7: MISSION RECOVERY & AFTERMATH PROOF"
          title="Empirical Proof of Restored Mission Resilience"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          <StatCard icon={Activity} label="Health Improvement" value={`+${a.recoveredDelta}`} suffix="%" color={C.green} />
          <StatCard icon={CheckCircle2} label="Tasks Recovered" value={bestPlan.critRecovered} color={C.green} />
          <StatCard icon={ShieldCheck} label="Critical Preserved" value={100} suffix="%" color={C.green} />
          <StatCard icon={Gauge} label="Resources Saved" value={r.after.overall} suffix="%" color={C.cyan} />
          <StatCard icon={Award} label="Recovery Effectiveness" value={currentScenario.backup.successRate} suffix="%" color={C.purple} />
          <StatCard icon={Activity} label="Recovery Time" value={currentScenario.recoveryTime.total} suffix=" min" color={C.textHi} />
        </div>
      </Panel>

      {/* MISSION HEALTH RECOVERY CURVE */}
      <Panel>
        <SectionLabel eyebrow="MISSION HEALTH RECOVERY CURVE" title="Real-Time Availability Restoration Curve" />
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={curveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRecovery" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.green} stopOpacity={0.5}/>
                  <stop offset="95%" stopColor={C.green} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.hairline} />
              <XAxis dataKey="stage" tick={{ fontSize: 10, fill: C.textLo }} />
              <YAxis tick={{ fontSize: 10, fill: C.textLo }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: C.bgPanelSolid, border: `1px solid ${C.hairline}`, fontSize: 11 }} />
              <Area type="monotone" dataKey="health" stroke={C.green} strokeWidth={2} fillOpacity={1} fill="url(#colorRecovery)" name="Mission Health (%)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* MISSION STATE TRANSITION DIAGRAM */}
      <Panel>
        <SectionLabel eyebrow="MISSION STATE TRANSITION FLOW" title="State Progression: NORMAL → DEGRADED → RECOVERY → STABILIZED" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl p-4 flex flex-col justify-between" style={{ background: "rgba(57,199,240,0.06)", border: `1px solid ${C.cyan}44` }}>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase mb-1" style={{ color: C.cyan }}>STAGE 01 — NORMAL</div>
              <div className="text-2xl font-bold font-mono" style={{ color: C.cyan }}>{a.before}%</div>
              <div className="text-xs font-mono mb-3" style={{ color: C.textMid }}>Nominal Baseline Operations</div>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between"><span style={{ color: C.textLo }}>Active Tasks:</span><span>24/24</span></div>
                <div className="flex justify-between"><span style={{ color: C.textLo }}>Resource Avail:</span><span>{r.before.overall}%</span></div>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4 flex flex-col justify-between" style={{ background: "rgba(241,76,90,0.08)", border: `1px solid ${C.red}44` }}>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase mb-1" style={{ color: C.red }}>STAGE 02 — DEGRADED</div>
              <div className="text-2xl font-bold font-mono" style={{ color: C.red }}>{a.during}%</div>
              <div className="text-xs font-mono mb-3" style={{ color: C.red }}>System Capacity Dropped</div>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between"><span style={{ color: C.textLo }}>Tasks at Risk:</span><span style={{ color: C.red }}>{currentScenario.impact.tasksAtRiskCount}</span></div>
                <div className="flex justify-between"><span style={{ color: C.textLo }}>Resource Avail:</span><span style={{ color: C.red }}>{r.during.overall}%</span></div>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4 flex flex-col justify-between" style={{ background: "rgba(177,140,255,0.08)", border: `1px solid ${C.purple}44` }}>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase mb-1" style={{ color: C.purple }}>STAGE 03 — RECOVERY</div>
              <div className="text-2xl font-bold font-mono" style={{ color: C.purple }}>{a.after}%</div>
              <div className="text-xs font-mono mb-3" style={{ color: C.purple }}>Surviving Capacity Reallocated</div>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between"><span style={{ color: C.textLo }}>Tasks Recovered:</span><span style={{ color: C.green }}>{bestPlan.critRecovered}</span></div>
                <div className="flex justify-between"><span style={{ color: C.textLo }}>Selected Plan:</span><span>Plan {bestPlan.key}</span></div>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4 flex flex-col justify-between" style={{ background: "rgba(56,217,147,0.08)", border: `1px solid ${C.green}44` }}>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase mb-1" style={{ color: C.green }}>STAGE 04 — STABILIZED</div>
              <div className="text-2xl font-bold font-mono" style={{ color: C.green }}>{a.after}%</div>
              <div className="text-xs font-mono mb-3" style={{ color: C.green }}>Mission Continuity Restored</div>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between"><span style={{ color: C.textLo }}>Health Delta:</span><span style={{ color: C.green, fontWeight: 700 }}>+{a.recoveredDelta}%</span></div>
                <div className="flex justify-between"><span style={{ color: C.textLo }}>Critical Preserved:</span><span style={{ color: C.green }}>100%</span></div>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
