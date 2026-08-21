import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShieldAlert,
  GitFork,
  AlertTriangle,
  Cpu,
  Sparkles,
  Award,
  Sliders,
  Clock,
  FileText,
  Menu,
  X,
} from "lucide-react";
import { C, useMission } from "../../context/MissionContext";

const NAV_GROUPS = [
  {
    title: "MISSION",
    items: [
      { path: "/", label: "Mission Overview", icon: LayoutDashboard },
      { path: "/failure-analysis", label: "Failure Analysis", icon: ShieldAlert },
      { path: "/propagation", label: "Propagation", icon: GitFork },
      { path: "/mission-impact", label: "Mission Impact", icon: AlertTriangle },
    ],
  },
  {
    title: "OPTIMIZATION",
    items: [
      { path: "/resource-optimization", label: "Resource Optimization", icon: Cpu },
      { path: "/recovery", label: "Recovery", icon: Sparkles },
      { path: "/mission-recovery", label: "Mission Recovery", icon: Award },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { path: "/scenarios", label: "Scenario Simulator", icon: Sliders },
      { path: "/timeline", label: "Mission Timeline", icon: Clock },
      { path: "/reports", label: "Mission Reports", icon: FileText },
    ],
  },
];

export function Sidebar() {
  const { currentScenario, phase } = useMission();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isPostFailure = ["failed", "plans", "executing", "stabilized"].includes(phase);

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-11 h-11 rounded-full grid place-items-center shadow-xl cursor-pointer"
          style={{ background: C.cyan, color: "#04121C" }}
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container — NO internal scrolling, everything fits viewport */}
      <aside
        className={`fixed lg:sticky top-[61px] left-0 z-40 h-[calc(100vh-61px)] w-60 shrink-0 px-3 py-3 transition-transform duration-300 overflow-hidden flex flex-col justify-between ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          background: "rgba(9,14,26,0.96)",
          borderRight: `1px solid ${C.hairline}`,
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="space-y-3">
          {/* Navigation Section Groups */}
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-0.5">
              <div
                className="text-[9px] font-mono tracking-[0.2em] font-bold uppercase px-2 py-0.5"
                style={{ color: C.textLo }}
              >
                {group.title}
              </div>
              <nav className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/"}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all duration-150 cursor-pointer ${
                          isActive ? "shadow-sm" : "hover:bg-white/5"
                        }`
                      }
                      style={({ isActive }) => ({
                        background: isActive ? "rgba(57,199,240,0.14)" : "transparent",
                        color: isActive ? C.cyan : C.textMid,
                        border: `1px solid ${isActive ? C.cyanDim : "transparent"}`,
                      })}
                    >
                      {({ isActive }) => (
                        <>
                          <Icon size={14} color={isActive ? C.cyan : C.textLo} className="shrink-0" />
                          <span className="truncate leading-none">{item.label}</span>
                          {isActive && (
                            <span
                              className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ background: C.cyan, boxShadow: `0 0 6px ${C.cyan}` }}
                            />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Sidebar Bottom Active Scenario Compact Card */}
        <div className="pt-2 border-t space-y-1 mt-auto" style={{ borderColor: C.hairline }}>
          <div
            className="rounded-lg p-2 space-y-1 text-[10px] font-mono"
            style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.hairline}` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: C.textLo }}>
                ACTIVE SCENARIO
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: phase === "stabilized" ? C.green : isPostFailure ? C.red : C.cyan }}
              />
            </div>
            <div className="font-bold truncate" style={{ color: C.cyan }}>
              {currentScenario.shortName}
            </div>
            <div className="flex items-center justify-between text-[9.5px]">
              <span style={{ color: C.textLo }}>Target: {currentScenario.targetId}</span>
              <span
                className="font-bold"
                style={{ color: currentScenario.severity === "CRITICAL" ? C.red : C.amber }}
              >
                {currentScenario.severity}
              </span>
            </div>
          </div>
          <div className="text-[9px] font-mono text-center" style={{ color: C.textLo }}>
            Orbit-R Operational Engine
          </div>
        </div>
      </aside>
    </>
  );
}
