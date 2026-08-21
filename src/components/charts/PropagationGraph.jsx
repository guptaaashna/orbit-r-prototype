import React from "react";
import { Satellite, TowerControl, ArrowRight } from "lucide-react";
import { useMission, C, STATUS_STYLE } from "../../context/MissionContext";
import { Panel, SectionLabel } from "../common/CommonUI";

const SATELLITES = [
  { id: "SAT-01", x: 130 },
  { id: "SAT-02", x: 410 },
  { id: "SAT-03", x: 690 },
  { id: "SAT-04", x: 970 },
];
const LINKS = [
  { id: "C01", x: 90, sat: "SAT-01", gs: "GS-01" },
  { id: "C02", x: 230, sat: "SAT-01", gs: "GS-02" },
  { id: "C03", x: 370, sat: "SAT-02", gs: "GS-01" },
  { id: "C04", x: 510, sat: "SAT-02", gs: "GS-03" },
  { id: "C05", x: 650, sat: "SAT-03", gs: "GS-02" },
  { id: "C06", x: 790, sat: "SAT-03", gs: "GS-01" },
  { id: "C07", x: 930, sat: "SAT-04", gs: "GS-03" },
  { id: "C08", x: 1070, sat: "SAT-04", gs: "GS-02" },
];
const GROUND = [
  { id: "GS-01", x: 230 },
  { id: "GS-02", x: 650 },
  { id: "GS-03", x: 990 },
];
const TASKS = [
  { id: "T02", x: 100, from: "GS-01" },
  { id: "T07", x: 220, from: "GS-01" },
  { id: "T11", x: 340, from: "GS-01" },
  { id: "T14", x: 430, from: "SAT-02" },
  { id: "T04", x: 560, from: "GS-02" },
  { id: "T09", x: 650, from: "GS-02" },
  { id: "T18", x: 740, from: "GS-02" },
  { id: "T21", x: 990, from: "GS-03" },
];

const Y_SAT = 46, Y_LINK = 178, Y_GS = 312, Y_TASK = 452;

const centerOf = (type, id) => {
  if (type === "sat") { const n = SATELLITES.find((s) => s.id === id); return { x: n.x, y: Y_SAT }; }
  if (type === "link") { const n = LINKS.find((s) => s.id === id); return { x: n.x, y: Y_LINK }; }
  if (type === "gs") { const n = GROUND.find((s) => s.id === id); return { x: n.x, y: Y_GS }; }
  if (type === "task") { const n = TASKS.find((s) => s.id === id); return { x: n.x, y: Y_TASK }; }
};

const SEV = { ok: 0, recovered: 1, warning: 2, critical: 3 };
function combine(a, b) { return SEV[a] >= SEV[b] ? a : b; }

function NodeBox({ x, y, w, h, status, label, sub, Icon, live }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.ok;
  return (
    <g transform={`translate(${x - w / 2}, ${y - h / 2})`} style={{ transition: "all .5s ease" }}>
      <rect width={w} height={h} rx={10} fill={s.fill} stroke={s.stroke} strokeWidth={1.4}
        className={live ? "node-pulse" : ""} style={{ color: s.stroke, transition: "all .5s ease" }} />
      {Icon && <Icon x={10} y={h / 2 - 8} width={16} height={16} color={s.stroke} />}
      <text x={Icon ? 32 : w / 2} y={h / 2 - (sub ? 3 : -4)} textAnchor={Icon ? "start" : "middle"}
        fontSize="12" fontWeight="700" fontFamily="ui-monospace, monospace" fill={s.text}>{label}</text>
      {sub && <text x={Icon ? 32 : w / 2} y={h / 2 + 12} textAnchor={Icon ? "start" : "middle"}
        fontSize="9" fontFamily="ui-monospace, monospace" fill={C.textLo}>{sub}</text>}
    </g>
  );
}

function EdgePath({ x1, y1, x2, y2, status, dashed }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.ok;
  const midY = (y1 + y2) / 2;
  const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  const live = status !== "ok";
  return (
    <path d={d} fill="none" stroke={s.stroke} strokeWidth={status === "critical" ? 2.2 : 1.4}
      strokeDasharray={dashed ? "5 5" : status === "ok" ? "0" : "6 6"}
      className={live && !dashed ? "edge-live" : ""}
      style={{ opacity: status === "ok" ? 0.55 : 0.95, transition: "all .5s ease" }} />
  );
}

export function PropagationGraph() {
  const { currentScenario, phase } = useMission();

  const failed = ["failed", "plans", "executing", "stabilized"].includes(phase);
  const stabilized = phase === "stabilized";

  const nodeMap = stabilized ? currentScenario.graphRecoveredNodes : currentScenario.graphNodes;
  const activeNodes = failed ? nodeMap : { sats: {}, links: {}, gs: {}, tasks: {} };

  const getStatus = (cat, id) => activeNodes[cat]?.[id] || "ok";

  return (
    <Panel className="fade-in overflow-hidden">
      <SectionLabel
        eyebrow="PILLAR 1: FAILURE PROPAGATION — 'How far will the failure spread?'"
        title="Mission Dependency & Failure Cascade Network"
        right={
          <div className="flex items-center gap-3 text-[10.5px] font-mono flex-wrap">
            <LegendDot color={C.red} label="Failed Node" />
            <LegendDot color={C.amber} label="Direct / Indirect Impact" />
            <LegendDot color={C.red} label="Critical Task at Risk" />
            <LegendDot color={C.cyan} label="Safe / Unaffected" />
            <LegendDot color={C.purple} label="Recovered / Alternate Path" />
          </div>
        }
      />

      {failed && (
        <div className="mb-4 flex items-center gap-2 text-xs font-mono flex-wrap" style={{ color: C.textMid }}>
          <span className="px-2 py-1 rounded font-bold" style={{ background: "rgba(241,76,90,0.15)", color: C.red }}>
            FAILED: {currentScenario.impact.failedNode}
          </span>
          <ArrowRight size={12} />
          <span className="px-2 py-1 rounded" style={{ background: "rgba(240,169,62,0.15)", color: C.amber }}>
            DIRECT: {currentScenario.impact.directNodes.join(", ")}
          </span>
          <ArrowRight size={12} />
          <span className="px-2 py-1 rounded" style={{ background: "rgba(240,169,62,0.15)", color: C.amber }}>
            INDIRECT: {currentScenario.impact.indirectNodes.join(", ")}
          </span>
          {stabilized && (
            <>
              <ArrowRight size={12} />
              <span className="px-2 py-1 rounded font-bold" style={{ background: "rgba(177,140,255,0.18)", color: C.purple }}>
                BACKUP ACTIVE ({currentScenario.backup.backup.split("&")[0]})
              </span>
            </>
          )}
        </div>
      )}

      <div className="relative rounded-xl overflow-x-auto" style={{ border: `1px solid ${C.hairline}`, background: "rgba(255,255,255,0.015)" }}>
        <svg viewBox="0 0 1160 520" className="w-full min-w-[750px]" style={{ minHeight: 340 }}>
          <defs>
            <pattern id="dotgrid" width="26" height="26" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="rgba(120,160,210,0.10)" />
            </pattern>
          </defs>
          <rect width="1160" height="520" fill="url(#dotgrid)" />

          {/* Row Headers */}
          <text x="16" y={Y_SAT - 26} fontSize="10" fontFamily="ui-monospace, monospace" fill={C.textLo} letterSpacing="2">SATELLITES</text>
          <text x="16" y={Y_LINK - 26} fontSize="10" fontFamily="ui-monospace, monospace" fill={C.textLo} letterSpacing="2">COMM. LINKS</text>
          <text x="16" y={Y_GS - 26} fontSize="10" fontFamily="ui-monospace, monospace" fill={C.textLo} letterSpacing="2">GROUND STATIONS</text>
          <text x="16" y={Y_TASK - 26} fontSize="10" fontFamily="ui-monospace, monospace" fill={C.textLo} letterSpacing="2">MISSION TASKS</text>

          {/* Edges */}
          {LINKS.map((l) => {
            const a = centerOf("sat", l.sat), b = centerOf("link", l.id), c = centerOf("gs", l.gs);
            const st1 = combine(getStatus("sats", l.sat), getStatus("links", l.id));
            const st2 = combine(getStatus("links", l.id), getStatus("gs", l.gs));
            return (
              <g key={l.id}>
                <EdgePath x1={a.x} y1={a.y + 20} x2={b.x} y2={b.y - 16} status={st1} />
                <EdgePath x1={b.x} y1={b.y + 16} x2={c.x} y2={c.y - 20} status={st2} />
              </g>
            );
          })}

          {TASKS.map((t) => {
            const from = t.from.startsWith("SAT") ? centerOf("sat", t.from) : centerOf("gs", t.from);
            const to = centerOf("task", t.id);
            const fromStatus = t.from.startsWith("SAT") ? getStatus("sats", t.from) : getStatus("gs", t.from);
            const st = combine(fromStatus, getStatus("tasks", t.id));
            return <EdgePath key={"e" + t.id} x1={from.x} y1={from.y + 20} x2={to.x} y2={to.y - 15} status={st} dashed={t.from.startsWith("SAT")} />;
          })}

          {/* Backup Reroute Lines when Stabilized */}
          {stabilized && currentScenario.id === "comm" && (
            <g>
              <EdgePath x1={centerOf("sat", "SAT-02").x} y1={centerOf("sat", "SAT-02").y + 20}
                x2={centerOf("gs", "GS-01").x} y2={centerOf("gs", "GS-01").y - 20} status="recovered" />
              <text x={(centerOf("sat", "SAT-02").x + centerOf("gs", "GS-01").x) / 2} y={(Y_SAT + Y_GS) / 2 - 4}
                fontSize="9" fontFamily="ui-monospace, monospace" fill={C.purple} textAnchor="middle">ALT ROUTE VIA C06</text>
            </g>
          )}

          {stabilized && currentScenario.id === "power" && (
            <g>
              <EdgePath x1={centerOf("sat", "SAT-03").x} y1={centerOf("sat", "SAT-03").y + 20}
                x2={centerOf("sat", "SAT-02").x} y2={centerOf("sat", "SAT-02").y + 20} status="recovered" />
              <text x={(centerOf("sat", "SAT-03").x + centerOf("sat", "SAT-02").x) / 2} y={Y_SAT + 32}
                fontSize="9" fontFamily="ui-monospace, monospace" fill={C.purple} textAnchor="middle">BATTERY & POWER TRANSFER</text>
            </g>
          )}

          {stabilized && currentScenario.id === "obc" && (
            <g>
              <EdgePath x1={centerOf("sat", "SAT-01").x} y1={centerOf("sat", "SAT-01").y + 20}
                x2={centerOf("sat", "SAT-03").x} y2={centerOf("sat", "SAT-03").y + 20} status="recovered" />
              <text x={(centerOf("sat", "SAT-01").x + centerOf("sat", "SAT-03").x) / 2} y={Y_SAT + 32}
                fontSize="9" fontFamily="ui-monospace, monospace" fill={C.purple} textAnchor="middle">CORE B & COMPUTE MIGRATION</text>
            </g>
          )}

          {/* Nodes */}
          {SATELLITES.map((s) => (
            <NodeBox key={s.id} x={s.x} y={Y_SAT} w={96} h={44} status={getStatus("sats", s.id)} label={s.id} Icon={Satellite}
              live={getStatus("sats", s.id) !== "ok"} />
          ))}
          {LINKS.map((l) => (
            <NodeBox key={l.id} x={l.x} y={Y_LINK} w={62} h={34} status={getStatus("links", l.id)} label={l.id}
              live={getStatus("links", l.id) !== "ok"} />
          ))}
          {GROUND.map((g) => (
            <NodeBox key={g.id} x={g.x} y={Y_GS} w={96} h={44} status={getStatus("gs", g.id)} label={g.id} Icon={TowerControl}
              live={getStatus("gs", g.id) !== "ok"} />
          ))}
          {TASKS.map((t) => (
            <NodeBox key={t.id} x={t.x} y={Y_TASK} w={58} h={30} status={getStatus("tasks", t.id)} label={t.id}
              live={getStatus("tasks", t.id) === "critical"} />
          ))}
        </svg>
      </div>
    </Panel>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1.5" style={{ color: C.textMid }}>
      <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} /> {label}
    </span>
  );
}
