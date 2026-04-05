import { Activity, Gauge, PlaySquare, Rows2, SearchCode } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { cn } from "@/lib/cn";

const navItems = [
  { to: "/", label: "Dashboard", icon: Gauge },
  { to: "/simulations/new", label: "New Simulation", icon: PlaySquare },
  { to: "/analyze", label: "Analyze Code", icon: SearchCode },
  { to: "/compare-inline", label: "Compare Inline", icon: Rows2 },
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-4 lg:px-6">
        <aside className="hidden w-72 shrink-0 flex-col rounded-[28px] border border-line bg-panel/95 p-5 shadow-glow lg:flex">
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-2xl border border-accent/30 bg-accent/10 p-2 text-accent">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-muted">AlgoScope</div>
              <div className="text-lg font-semibold">Stateless benchmark lab</div>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition",
                    isActive
                      ? "border-accent/30 bg-accent/10 text-text"
                      : "border-transparent bg-transparent text-muted hover:border-line hover:bg-panelAlt hover:text-text",
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto space-y-4">
            <div className="rounded-2xl border border-line bg-panelAlt p-4">
              <div className="section-title mb-2">Stateless MVP+</div>
              <p className="text-sm text-muted">
                Không dùng database, không lưu lịch sử server-side, nhưng có preset catalog, local session history và
                report metadata để mô phỏng workflow công cụ kỹ thuật thực tế hơn.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-panelAlt p-4 text-sm text-muted">
              Python-first, sandbox trực tiếp, insight heuristic và export JSON từ frontend.
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <div className="grid-bg min-h-full rounded-[28px] border border-line/80 bg-bg/80 p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
