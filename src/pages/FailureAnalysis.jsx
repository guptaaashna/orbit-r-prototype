import React from "react";
import { ShieldAlert, AlertTriangle, ArrowRight, Activity, Radio, Cpu, Zap, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMission, C } from "../context/MissionContext";
import { Panel, SectionLabel } from "../components/common/CommonUI";
import { RadialGauge } from "../components/visuals/VisualComponents";

export function FailureAnalysis() {
  const { currentScenario, phase } = useMission();
  const imp = currentScenario.impact;
  const p = currentScenario.predictive;
  const isPost = ["failed", "plans", "executing", "stabilized"].includes(phase);

  const rcaSteps = {
    comm: [
      { step: "01", title: "C03 Ku-Band Transponder", desc: "SNR jitter & phase variance threshold exceeded" },
      { step: "02", title: "High Phase Variance", desc: "Carrier phase noise increased by 14 dB" },
      { step: "03", title: "Packet Loss Spike", desc: "Downlink BER caused 42% telemetry packet drop" },
      { step: "04", title: "Communication Degradation", desc: "SAT-02 ↔ GS-01 primary downlink lock lost" },
      { step: "05", title: "Mission Impact", desc: "6 satellite tasks placed at risk (3 critical)" },
    ],
    power: [
      { step: "01", title: "SAT-03 Solar Array 2B", desc: "Thermal fluctuation & motor drive stall" },
      { step: "02", title: "Bus Voltage Drop", desc: "Array output decayed from 28V to 11.4V nominal" },
      { step: "03", title: "Payload Shedding", desc: "Optical sensor instruments forced to standby" },
      { step: "04", title: "Power Degradation", desc: "Satellite power availability reduced by 66%" },
      { step: "05", title: "Mission Impact", desc: "5 payload tasks suspended on SAT-03" },
    ],
    obc: [
      { step: "01", title: "SAT-01 Core A SRAM", desc: "Single Event Upset (SEU) radiation lockup" },
      { step: "02", title: "Watchdog Interrupt", desc: "Hardware CPU heartbeat missed consecutive cycles" },
      { step: "03", title: "C&DH Freeze", desc: "Command and Data Handling task queue halted" },
      { step: "04", title: "Safe Mode Trigger", desc: "Processor Core A auto-isolated into safe mode" },
      { step: "05", title: "Mission Impact", desc: "6 navigation & telemetry tasks suspended" },
    ],
  }[currentScenario.id] || [];

  const anomalyChartData = [
    { time: "10:40:00", baseline: 98, observed: 97, threshold: 75 },
    { time: "10:41:00", baseline: 98, observed: 94, threshold: 75 },
    { time: "10:42:00", baseline: 97, observed: 86, threshold: 75 },
    { time: "10:42:08", baseline: 98, observed: 74, threshold: 75 }, // Anomaly point
    { time: "10:42:19", baseline: 98, observed: isPost ? 22 : 95, threshold: 75 },
  ];

  const componentMatrix = [
    { comp: "C03 Ku-Band Transponder", health: isPost ? "CRITICAL FAULT" : "HEALTHY", val: isPost ? "8.2 dB SNR" : "24.5 dB SNR", color: isPost ? C.red : C.green },
    { comp: "SAT-02 Main Satellite Bus", health: isPost ? "DEGRADED" : "HEALTHY", val: isPost ? "Downlink Interrupted" : "Nominal", color: isPost ? C.amber : C.green },
    { comp: "GS-01 Ingest Antenna", health: isPost ? "WARNING" : "HEALTHY", val: isPost ? "Loss of Ingest" : "Online", color: isPost ? C.amber : C.green },
    { comp: "C05 Alternate Comm Link", health: "HEALTHY / READY", val: "Backup 96% Ready", color: C.purple },
    { comp: "GS-03 Ground Receiver", health: "HEALTHY", val: "Standby Active", color: C.green },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Failure Event Header Panel */}
      <Panel style={{ border: `1px solid ${C.red}44`, background: "rgba(241,76,90,0.04)" }}>
        <SectionLabel
          eyebrow="PAGE 2: FAILURE DIAGNOSTIC & TELEMETRY EVIDENCE"
          title={`Failure Event Analysis — ${currentScenario.targetComponent}`}
        />

        <div className="grid lg:grid-cols-4 gap-4 items-center mb-4">
          {/* Radial Failure Gauge */}
          <div className="lg:col-span-1 rounded-xl p-3 flex flex-col items-center justify-center" style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${C.hairline}` }}>
            <RadialGauge value={p.probability} max={100} label="FAILURE PROBABILITY" sub="75% Action Threshold" color={C.red} size={120} />
          </div>

          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
              <div className="text-[10px] font-mono uppercase" style={{ color: C.textLo }}>Failure ID</div>
              <div className="text-sm font-bold font-mono" style={{ color: C.cyan }}>EVT-{currentScenario.id.toUpperCase()}-01</div>
            </div>
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
              <div className="text-[10px] font-mono uppercase" style={{ color: C.textLo }}>Failed Component</div>
              <div className="text-sm font-bold font-mono" style={{ color: C.red }}>{currentScenario.targetId}</div>
            </div>
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
              <div className="text-[10px] font-mono uppercase" style={{ color: C.textLo }}>Prediction Confidence</div>
              <div className="text-sm font-bold font-mono" style={{ color: C.cyan }}>{p.confidence}%</div>
            </div>
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
              <div className="text-[10px] font-mono uppercase" style={{ color: C.textLo }}>Current Status</div>
              <div className="text-sm font-bold font-mono" style={{ color: phase === "stabilized" ? C.purple : isPost ? C.red : C.cyan }}>
                {phase === "stabilized" ? "ISOLATED" : isPost ? "ACTIVE FAULT" : "NOMINAL"}
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* TELEMETRY ANOMALY CHART */}
      <Panel>
        <SectionLabel
          eyebrow="TELEMETRY ANOMALY BREAKDOWN"
          title="Observed Signal Drift vs Baseline & Operational Threshold"
        />
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={anomalyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorObserved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.red} stopOpacity={0.6}/>
                  <stop offset="95%" stopColor={C.red} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.hairline} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: C.textLo }} />
              <YAxis tick={{ fontSize: 10, fill: C.textLo }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: C.bgPanelSolid, border: `1px solid ${C.hairline}`, fontSize: 11 }} />
              <Area type="monotone" dataKey="observed" stroke={C.red} fillOpacity={1} fill="url(#colorObserved)" name="Observed Telemetry" />
              <Area type="monotone" dataKey="threshold" stroke={C.amber} strokeDasharray="5 5" fillOpacity={0} name="Risk Threshold (75%)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* ROOT CAUSE ANALYSIS & COMPONENT MATRIX */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Panel className="lg:col-span-2 border-l-4" style={{ borderLeftColor: C.amber }}>
          <SectionLabel eyebrow="ROOT CAUSE DIAGNOSTIC CHAIN" title="Causal Fault Sequence" />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs font-mono">
            {rcaSteps.map((s, idx) => (
              <div key={idx} className="relative rounded-xl p-3 flex flex-col justify-between" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
                <div>
                  <div className="text-[9px] font-bold mb-1" style={{ color: C.amber }}>STEP {s.step}</div>
                  <div className="font-bold text-xs mb-1" style={{ color: C.textHi }}>{s.title}</div>
                  <div className="text-[10px]" style={{ color: C.textMid }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Component Health Grid */}
        <Panel>
          <SectionLabel eyebrow="COMPONENT HEALTH MATRIX" title="Subsystem Health Grid" />
          <div className="space-y-2 text-xs font-mono">
            {componentMatrix.map((item, idx) => (
              <div key={idx} className="p-2.5 rounded-lg flex items-center justify-between" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
                <div>
                  <div className="font-bold" style={{ color: C.textHi }}>{item.comp}</div>
                  <div className="text-[10px]" style={{ color: C.textLo }}>{item.val}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: `${item.color}15`, color: item.color }}>
                  {item.health}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
