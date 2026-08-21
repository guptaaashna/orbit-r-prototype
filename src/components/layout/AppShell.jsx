import React from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { ToastStack } from "../common/CommonUI";
import { C } from "../../context/MissionContext";

function BackgroundGrid() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${C.hairline} 1px, transparent 1px), linear-gradient(90deg, ${C.hairline} 1px, transparent 1px)`,
          backgroundSize: "42px 42px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% -10%, rgba(57,199,240,0.10), transparent 60%)`,
        }}
      />
    </div>
  );
}

export function AppShell({ children }) {
  return (
    <div className="min-h-screen w-full font-sans relative" style={{ background: C.bg, color: C.textHi }}>
      <BackgroundGrid />
      <ToastStack />
      <TopBar />

      <div className="max-w-[1440px] mx-auto flex items-start gap-6 relative z-10">
        <Sidebar />
        <main className="flex-1 w-full min-w-0 px-4 sm:px-6 py-6 pb-28 space-y-7">
          {children}
        </main>
      </div>

      <style>{`
        @keyframes dashflow { to { stroke-dashoffset: -24; } }
        @keyframes ripple { 0% { r: 8; opacity: .9; } 100% { r: 60; opacity: 0; } }
        @keyframes fadeSlideUp { from { opacity:0; transform: translateY(14px);} to {opacity:1; transform: translateY(0);} }
        @keyframes pulseGlow { 0%,100% { filter: drop-shadow(0 0 2px currentColor);} 50% { filter: drop-shadow(0 0 9px currentColor);} }
        @keyframes toastIn { from { opacity:0; transform: translateX(24px);} to {opacity:1; transform: translateX(0);} }
        .fade-in { animation: fadeSlideUp .5s ease both; }
        .edge-live { stroke-dasharray: 6 6; animation: dashflow 1s linear infinite; }
        .node-pulse { animation: pulseGlow 1.6s ease-in-out infinite; }
        * { scrollbar-width: thin; scrollbar-color: rgba(57,199,240,0.3) transparent; }
      `}</style>
    </div>
  );
}
