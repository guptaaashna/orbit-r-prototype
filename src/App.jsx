import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MissionProvider } from "./context/MissionContext";
import { AppShell } from "./components/layout/AppShell";

import { MainDashboard } from "./pages/MainDashboard";
import { FailureAnalysis } from "./pages/FailureAnalysis";
import { FailurePropagation } from "./pages/FailurePropagation";
import { MissionImpact } from "./pages/MissionImpact";
import { ResourceOptimization } from "./pages/ResourceOptimization";
import { RecoveryPlanning } from "./pages/RecoveryPlanning";
import { MissionRecovery } from "./pages/MissionRecovery";
import { ScenarioSimulator } from "./pages/ScenarioSimulator";
import { MissionTimeline } from "./pages/MissionTimeline";
import { MissionReports } from "./pages/MissionReports";

export default function App() {
  return (
    <BrowserRouter>
      <MissionProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<MainDashboard />} />
            <Route path="/failure-analysis" element={<FailureAnalysis />} />
            <Route path="/propagation" element={<FailurePropagation />} />
            <Route path="/mission-impact" element={<MissionImpact />} />
            <Route path="/resource-optimization" element={<ResourceOptimization />} />
            <Route path="/recovery" element={<RecoveryPlanning />} />
            <Route path="/mission-recovery" element={<MissionRecovery />} />
            <Route path="/scenarios" element={<ScenarioSimulator />} />
            <Route path="/timeline" element={<MissionTimeline />} />
            <Route path="/reports" element={<MissionReports />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </MissionProvider>
    </BrowserRouter>
  );
}
