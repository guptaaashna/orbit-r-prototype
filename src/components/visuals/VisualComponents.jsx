import React from "react";
import {
  AreaChart, Area, LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell,
} from "recharts";
import { Activity, ShieldAlert, Zap, Cpu, Radio, ArrowRight, CheckCircle2, AlertTriangle, Layers } from "lucide-react";
import { C } from "../../context/MissionContext";
import { Panel, SectionLabel } from "../common/CommonUI";

/* ---------------- 1. SPARKLINE MINI CHARTS ---------------- */
export function SparklineCard({ label, value, unit, data, color = C.cyan, trend }) {
  return (
    <div className="rounded-xl p-3 flex flex-col justify-between" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
      <div className="flex items-center justify-between text-[10px] font-mono" style={{ color: C.textLo }}>
        <span className="uppercase tracking-wider truncate">{label}</span>
        {trend && <span style={{ color: trend.startsWith("+") ? C.amber : C.green }}>{trend}</span>}
      </div>
      <div className="text-xl font-bold font-mono my-1" style={{ color }}>
        {value} <span className="text-[10px] font-normal text-slate-400">{unit}</span>
      </div>
      <div style={{ height: 35 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line type="monotone" dataKey="val" stroke={color} strokeWidth={1.8} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ---------------- 2. CIRCULAR GAUGE / RADIAL METER ---------------- */
export function RadialGauge({ value, max = 100, label, sub, color = C.cyan, size = 110 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = size * 0.38;
  const strokeWidth = size * 0.08;
  const circum = 2 * Math.PI * radius;
  const dashoffset = circum - (pct / 100) * circum;

  return (
    <div className="flex flex-col items-center justify-center p-3">
      <div className="relative grid place-items-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} fill="transparent" />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circum} strokeDashoffset={dashoffset}
            strokeLinecap="round" fill="transparent"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute text-center">
          <div className="text-lg font-bold font-mono leading-none" style={{ color }}>{value}%</div>
          {sub && <div className="text-[9px] font-mono mt-0.5" style={{ color: C.textLo }}>{sub}</div>}
        </div>
      </div>
      {label && <div className="text-xs font-mono font-bold mt-2 uppercase text-center" style={{ color: C.textHi }}>{label}</div>}
    </div>
  );
}

/* ---------------- 3. NETWORK TOPOLOGY MINIMAP ---------------- */
export function NetworkTopologyMinimap({ scenario }) {
  const isComm = scenario.id === "comm";
  const isPower = scenario.id === "power";
  const isObc = scenario.id === "obc";

  return (
    <Panel className="fade-in">
      <SectionLabel eyebrow="SYSTEM ARCHITECTURE VISUALIZER" title="Satellite Constellation & Ground Topology Network" />
      <div className="rounded-xl p-4 overflow-x-auto" style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${C.hairline}` }}>
        <div className="flex items-center justify-around min-w-[600px] text-xs font-mono">
          {/* Satellites Column */}
          <div className="space-y-3 text-center">
            <div className="text-[10px] font-bold tracking-widest text-slate-400 mb-2 uppercase">Satellites</div>
            <div className="px-3 py-1.5 rounded-lg border font-bold" style={{ borderColor: isObc ? C.red : C.cyan, color: isObc ? C.red : C.cyan, background: isObc ? "rgba(241,76,90,0.1)" : "rgba(57,199,240,0.1)" }}>
              SAT-01 {isObc && "⚡ FAULT"}
            </div>
            <div className="px-3 py-1.5 rounded-lg border font-bold" style={{ borderColor: isComm ? C.amber : C.cyan, color: isComm ? C.amber : C.cyan, background: "rgba(57,199,240,0.1)" }}>
              SAT-02 {isComm && "⚠ BUSY"}
            </div>
            <div className="px-3 py-1.5 rounded-lg border font-bold" style={{ borderColor: isPower ? C.red : C.cyan, color: isPower ? C.red : C.cyan, background: isPower ? "rgba(241,76,90,0.1)" : "rgba(57,199,240,0.1)" }}>
              SAT-03 {isPower && "⚡ POWER LOW"}
            </div>
            <div className="px-3 py-1.5 rounded-lg border font-bold" style={{ borderColor: C.cyan, color: C.cyan, background: "rgba(57,199,240,0.1)" }}>
              SAT-04 NOMINAL
            </div>
          </div>

          <ArrowRight size={18} color={C.textLo} />

          {/* Links Column */}
          <div className="space-y-3 text-center">
            <div className="text-[10px] font-bold tracking-widest text-slate-400 mb-2 uppercase">Comm Links</div>
            <div className="px-3 py-1.5 rounded-lg border font-bold" style={{ borderColor: isComm ? C.red : C.cyan, color: isComm ? C.red : C.cyan, background: isComm ? "rgba(241,76,90,0.15)" : "rgba(57,199,240,0.1)" }}>
              C03 {isComm ? "✖ DOWNLINK FAIL" : "ONLINE"}
            </div>
            <div className="px-3 py-1.5 rounded-lg border font-bold" style={{ borderColor: C.purple, color: C.purple, background: "rgba(177,140,255,0.1)" }}>
              C05 REROUTE ACTIVE
            </div>
            <div className="px-3 py-1.5 rounded-lg border font-bold" style={{ borderColor: C.cyan, color: C.cyan, background: "rgba(57,199,240,0.1)" }}>
              C06 BACKUP LINK
            </div>
          </div>

          <ArrowRight size={18} color={C.textLo} />

          {/* Ground Stations Column */}
          <div className="space-y-3 text-center">
            <div className="text-[10px] font-bold tracking-widest text-slate-400 mb-2 uppercase">Ground Stations</div>
            <div className="px-3 py-1.5 rounded-lg border font-bold" style={{ borderColor: isComm ? C.amber : C.cyan, color: isComm ? C.amber : C.cyan, background: "rgba(57,199,240,0.1)" }}>
              GS-01 INGEST
            </div>
            <div className="px-3 py-1.5 rounded-lg border font-bold" style={{ borderColor: C.green, color: C.green, background: "rgba(56,217,147,0.1)" }}>
              GS-02 ONLINE
            </div>
            <div className="px-3 py-1.5 rounded-lg border font-bold" style={{ borderColor: C.green, color: C.green, background: "rgba(56,217,147,0.1)" }}>
              GS-03 BACKUP
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ---------------- 4. BEFORE VS AFTER COMPARISON ---------------- */
export function BeforeAfterComparison({ beforeVal, failureVal, recoveredVal, unit = "%" }) {
  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}>
      <div className="text-xs font-mono font-bold uppercase" style={{ color: C.textHi }}>MISSION STATE TRANSITION PROOF</div>
      <div className="space-y-2 font-mono text-xs">
        <div>
          <div className="flex justify-between mb-1">
            <span style={{ color: C.textLo }}>Nominal Baseline</span>
            <span style={{ color: C.cyan, fontWeight: 700 }}>{beforeVal}{unit}</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden bg-white/5">
            <div className="h-full rounded-full" style={{ width: `${beforeVal}%`, background: C.cyan }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span style={{ color: C.textLo }}>Post-Failure Drop</span>
            <span style={{ color: C.red, fontWeight: 700 }}>{failureVal}{unit}</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden bg-white/5">
            <div className="h-full rounded-full" style={{ width: `${failureVal}%`, background: C.red }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span style={{ color: C.textLo }}>Orbit-R Restored</span>
            <span style={{ color: C.green, fontWeight: 700 }}>{recoveredVal}{unit}</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden bg-white/5">
            <div className="h-full rounded-full" style={{ width: `${recoveredVal}%`, background: C.green }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 5. PERFORMANCE RADAR CHART ---------------- */
export function PerformanceRadar({ score = 94.8 }) {
  const radarData = [
    { subject: "Detection", A: 96.8, fullMark: 100 },
    { subject: "Prediction", A: 91.4, fullMark: 100 },
    { subject: "Propagation", A: 94.2, fullMark: 100 },
    { subject: "Optimization", A: 94.8, fullMark: 100 },
    { subject: "Recovery", A: 98.0, fullMark: 100 },
  ];

  return (
    <Panel className="fade-in">
      <SectionLabel eyebrow="SYSTEM PERFORMANCE RADAR" title={`Overall Resilience Index: ${score} / 100`} />
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid stroke={C.hairline} />
            <PolarAngleAxis dataKey="subject" tick={{ fill: C.cyan, fontSize: 10, fontFamily: "monospace" }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: C.textLo, fontSize: 8 }} />
            <Radar name="Orbit-R Performance" dataKey="A" stroke={C.purple} fill={C.purple} fillOpacity={0.4} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

/* ---------------- 6. DECISION TREE VISUALIZER ---------------- */
export function DecisionTreeDiagram() {
  return (
    <div className="rounded-xl p-4 space-y-3 font-mono text-xs" style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${C.hairline}` }}>
      <div className="font-bold text-xs uppercase" style={{ color: C.purple }}>ORBIT-R AUTOMATED DECISION TREE</div>
      <div className="flex flex-col items-center space-y-2 py-2">
        <div className="px-3 py-1.5 rounded-lg border font-bold text-center" style={{ borderColor: C.red, color: C.red, background: "rgba(241,76,90,0.1)" }}>
          FAILURE CONFIRMED
        </div>
        <div className="w-0.5 h-3" style={{ background: C.hairline }} />
        <div className="px-3 py-1 rounded border text-[11px]" style={{ borderColor: C.amber, color: C.amber }}>
          Surviving Resources Available?
        </div>
        <div className="grid grid-cols-2 gap-8 text-center pt-2">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-emerald-400 block">YES (Primary Path)</span>
            <div className="px-2 py-1 rounded border text-[10px]" style={{ borderColor: C.green, color: C.green, background: "rgba(56,217,147,0.1)" }}>
              Multi-Resource Reroute & Execute
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-amber-400 block">NO (Fallback Path)</span>
            <div className="px-2 py-1 rounded border text-[10px]" style={{ borderColor: C.amber, color: C.amber, background: "rgba(240,169,62,0.1)" }}>
              Shed Non-Critical Payload
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
