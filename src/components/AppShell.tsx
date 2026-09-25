import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, LayoutDashboard, Radar, BarChart3, Stethoscope } from "lucide-react";
import { type ReactNode } from "react";
import { useRealtime, usePatients } from "@/lib/store";
import { AlertsPanel } from "./AlertsPanel";


const nav = [
  { to: "/", label: "Patients", icon: LayoutDashboard },
  { to: "/mission-control", label: "Command Center", icon: Radar },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function AppShell({ children }: { children: ReactNode }) {
  useRealtime(3500);
  const patients = usePatients();
  const pathname = useRouterState({ select: s => s.location.pathname });

  const critical = patients.filter(p => p.status === "Critical").length;
  const alerts = patients.filter(p => p.alert).length;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col glass-strong border-r border-border p-4 gap-2 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-xl grid place-items-center bg-primary text-primary-foreground ">
            <Stethoscope className="size-5" />
          </div>
          <div>
            <div className="font-bold tracking-tight text-base leading-tight">EaglesEye</div>
            <div className="text-[11px] text-primary/80 uppercase tracking-widest">AI · v1.0</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map(n => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={[
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition",
                  active
                    ? "bg-accent text-accent-foreground font-medium border-l-2 border-primary rounded-l-none"
                    : "text-foreground/80 hover:bg-muted hover:text-foreground",
                ].join(" ")}
              >
                <Icon className="size-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto glass rounded-xl p-4 space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="live-dot" />
            <span className="text-emerald-700 font-medium">Live Telemetry</span>
          </div>
          <div className="flex justify-between text-muted-foreground"><span>Patients</span><span className="text-foreground">{patients.length}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Critical</span><span className="text-rose-700">{critical}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Active Alerts</span><span className="text-amber-700">{alerts}</span></div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 glass-strong border-b border-border px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="lg:hidden flex items-center gap-2">
            <div className="size-8 rounded-lg grid place-items-center bg-primary text-primary-foreground">
              <Stethoscope className="size-4" />
            </div>
            <span className="font-bold">EaglesEye AI</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="size-4 text-primary" />
            <span className="font-medium text-foreground">ICU — A</span>
            <span>· St. Aurora General</span>
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs">
            <input aria-label="Search" placeholder="Search patients, alerts..." className="hidden md:block w-64 h-8 px-3 rounded-md border border-input bg-muted text-xs outline-none focus:border-primary" />
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border">
              <span className="live-dot" /> <span className="text-emerald-700 font-semibold tracking-wide">LIVE</span>
            </span>
            <AlertsPanel />
            <span className="hidden md:flex items-center gap-2 pl-3 border-l border-border">
              <span className="size-7 rounded-full bg-accent text-accent-foreground grid place-items-center text-[11px] font-semibold">DK</span>
              <span className="text-foreground font-medium">Dr. Kumar</span>
            </span>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="lg:hidden flex gap-1 px-3 py-2 overflow-x-auto glass-strong border-b border-border">
          {nav.map(n => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link key={n.to} to={n.to} className={[
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap",
                active ? "bg-accent text-accent-foreground border border-primary/30" : "text-foreground/80 bg-muted",
              ].join(" ")}>
                <Icon className="size-3.5" /> {n.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-4 sm:p-6 anim-slide-up">{children}</main>
      </div>
    </div>
  );
}
