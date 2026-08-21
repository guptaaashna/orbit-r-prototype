import React, { useState, useRef, useEffect } from "react";
import { C, STATUS_STYLE, useMission } from "../../context/MissionContext";

export function useCountUp(target, duration = 650) {
  const [val, setVal] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const start = prev.current;
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(start + (target - start) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

export function StatusDot({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.ok;
  return <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: s.stroke, boxShadow: s.glow }} />;
}

export function Panel({ children, className = "", style = {} }) {
  return (
    <div
      className={`rounded-2xl p-5 backdrop-blur-md ${className}`}
      style={{ background: C.bgPanel, border: `1px solid ${C.hairline}`, ...style }}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ eyebrow, title, right }) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
      <div>
        <div className="text-xs tracking-[0.2em] font-mono mb-1 flex items-center gap-2" style={{ color: C.cyan }}>
          {eyebrow}
        </div>
        <h2 className="text-lg sm:text-xl font-semibold tracking-tight" style={{ color: C.textHi }}>
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, suffix = "", color = C.cyan, sub }) {
  const disp = useCountUp(typeof value === "number" ? value : 0);
  return (
    <div
      className="rounded-xl px-4 py-3 flex flex-col gap-1.5 transition-all duration-300 hover:border-opacity-50"
      style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}
    >
      <div className="flex items-center gap-1.5" style={{ color: C.textLo }}>
        {Icon && <Icon size={13} />}
        <span className="text-[10.5px] font-mono tracking-wider uppercase truncate">{label}</span>
      </div>
      <div className="text-2xl font-bold font-mono leading-none" style={{ color }}>
        {typeof value === "number" ? Math.round(disp) : value}
        {suffix}
      </div>
      {sub && <div className="text-[10.5px] font-mono" style={{ color: C.textLo }}>{sub}</div>}
    </div>
  );
}

export function ToastStack() {
  const { toasts } = useMission();
  const colorFor = (kind) =>
    ({
      critical: C.red,
      warning: C.amber,
      success: C.green,
      purple: C.purple,
      info: C.cyan,
    }[kind] || C.cyan);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-[92vw] sm:w-80 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="rounded-lg px-4 py-3 text-sm backdrop-blur-md pointer-events-auto"
          style={{
            background: C.bgPanel,
            border: `1px solid ${colorFor(t.kind)}55`,
            color: C.textHi,
            animation: "toastIn .3s ease both",
            boxShadow: `0 8px 24px rgba(0,0,0,0.4)`,
          }}
        >
          <div className="flex items-start gap-2">
            <span className="mt-1">
              <StatusDot status={t.kind === "success" ? "recovered" : t.kind === "critical" ? "critical" : t.kind === "warning" ? "warning" : "ok"} />
            </span>
            <span style={{ color: C.textHi }}>{t.msg}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
