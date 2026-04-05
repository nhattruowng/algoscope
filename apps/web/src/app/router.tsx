import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "@/components/layout/app-shell";
import { AnalyzePage } from "@/routes/analyze-page";
import { CompareInlinePage } from "@/routes/compare-inline-page";
import { DashboardPage } from "@/routes/dashboard-page";
import { NewSimulationPage } from "@/routes/new-simulation-page";
import { RunDetailPage } from "@/routes/run-detail-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "simulations/new", element: <NewSimulationPage /> },
      { path: "analyze", element: <AnalyzePage /> },
      { path: "runs/latest", element: <RunDetailPage /> },
      { path: "runs/session/:sessionId", element: <RunDetailPage /> },
      { path: "compare-inline", element: <CompareInlinePage /> },
    ],
  },
]);
