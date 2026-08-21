import React from "react";
import { Satellite, RotateCcw, Play } from "lucide-react";
import { useMission, C } from "../../context/MissionContext";
import { SCENARIOS } from "../../data/scenarioData";

export function TopBar() {
  const { scenarioId, setScenarioId, phase, resetAll, runDemo } = useMission();

  const phaseLabel = {
    nominal: "NOMINAL MISSION",
    predictive: "PREDICTIVE MONITORING",
    predicted: "FAILURE PREDICTED",
    failed: "FAILURE DETECTED",
    plans: "OPTIMIZING RECOVERY",
    executing: "EXECUTING RECOVERY",
    stabilized: "MISSION STABILIZED",
  }[phase];

  const phaseColor = {
    nominal: C.cyan,
    predictive: C.amber,
    predicted: C.amber,
    failed: C.red,
    plans: C.purple,
    executing: C.purple,
    stabilized: C.green,
  }[phase];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md" style={{ background: "rgba(5,8,16,0.92)", borderBottom: `1px solid ${C.hairline}` }}>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg grid place-items-center" style={{ border: `1px solid ${C.cyanDim}`, background: "rgba(57,199,240,0.08)" }}>
            <Satellite size={18} color={C.cyan} />
          </div>
          <div>
            <div className="text-sm font-bold tracking-wide leading-none" style={{ color: C.textHi }}>ORBIT-R</div>
            <div className="text-[11px] font-mono leading-none mt-1" style={{ color: C.textLo }}>Operational Resilience Engine</div>
          </div>
          <div className="hidden lg:flex items-center gap-2 ml-4 pl-4" style={{ borderLeft: `1px solid ${C.hairline}` }}>
            <span className="w-2 h-2 rounded-full node-pulse" style={{ background: phaseColor, color: phaseColor }} />
            <span className="text-xs font-mono tracking-wider font-semibold" style={{ color: phaseColor }}>{phaseLabel}</span>
          </div>
        </div>

        {/* Scenario Switcher Dropdown & Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 rounded-xl p-1" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.hairline}` }}>
            {SCENARIOS.map((sc) => {
              const active = sc.id === scenarioId;
              return (
                <button
                  key={sc.id}
                  onClick={() => setScenarioId(sc.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                  style={{
                    background: active ? "rgba(57,199,240,0.14)" : "transparent",
                    color: active ? C.cyan : C.textMid,
                    border: `1px solid ${active ? C.cyanDim : "transparent"}`,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? C.cyan : C.textLo }} />
                  {sc.shortName}
                </button>
              );
            })}
          </div>

          {phase !== "nominal" && (
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition hover:opacity-80 cursor-pointer"
              style={{ border: `1px solid ${C.hairline}`, color: C.textMid }}
            >
              <RotateCcw size={13} /> Reset Mission
            </button>
          )}

          <button
            onClick={runDemo}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg transition hover:brightness-110 cursor-pointer shadow-lg"
            style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: "#04121C" }}
          >
            <Play size={13} fill="#04121C" /> Run Scenario
          </button>
        </div>
      </div>
    </header>
  );
}
