import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Radar, BarChart3, Stethoscope, ChevronsRight, ChevronsLeft, Search } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useRealtime, usePatients } from "@/lib/store";
import { AlertsPanel } from "./AlertsPanel";

const nav = [
  { to: "/mission-control", label: "Command Center", icon: Radar },
  { to: "/", label: "Patients", icon: LayoutDashboard },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

function isActive(to: string, pathname: string) {
  return to === "/" ? pathname === "/" || pathname.startsWith("/patients") : pathname.startsWith(to);
}

export function AppShell({ children }: { children: ReactNode }) {
  useRealtime(3500);
  const patients = usePatients();
  const pathname = useRouterState({ select: s => s.location.pathname });
  const [expanded, setExpanded] = useState(false);

  const critical = patients.filter(p => p.status === "Critical").length;
  const current = nav.find(n => isActive(n.to, pathname))?.label ?? "Patients";

  return (
    <div className="min-h-screen flex">
      {/* Icon rail */}
      <aside
        className={[
          "hidden md:flex shrink-0 flex-col bg-card border-r border-border sticky top-0 h-screen z-40 transition-[width] duration-200",
          expanded ? "w-60" : "w-[68px]",
        ].join(" ")}
      >
        <div className={["h-14 flex items-center border-b border-border", expanded ? "px-4 gap-3" : "justify-center"].join(" ")}>
          <div className="size-9 rounded-lg grid place-items-center bg-primary text-primary-foreground shrink-0">
            <Stethoscope className="size-[18px]" strokeWidth={2.25} />
          </div>
          {expanded && <span className="font-semibold tracking-tight">EaglesEye</span>}
        </div>

        <nav className="flex flex-col gap-1 py-3">
          {nav.map(n => {
            const active = isActive(n.to, pathname);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                aria-label={n.label}
                className={[
                  "group relative flex items-center h-11 transition-colors",
                  expanded ? "px-5 gap-3" : "justify-center",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted",
                ].join(" ")}
              >
                {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-primary" />}
                <Icon className="size-5 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
                {expanded ? (
                  <span className={["text-sm", active ? "font-medium" : ""].join(" ")}>{n.label}</span>
                ) : (
                  <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                    {n.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-border py-2">
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            aria-label={expanded ? "Collapse navigation" : "Expand navigation"}
            className={["group relative flex items-center w-full h-11 text-muted-foreground hover:text-foreground hover:bg-muted", expanded ? "px-5 gap-3" : "justify-center"].join(" ")}
          >
            {expanded ? <ChevronsLeft className="size-5" strokeWidth={1.75} /> : <ChevronsRight className="size-5" strokeWidth={1.75} />}
            {expanded ? (
              <span className="text-sm">Collapse</span>
            ) : (
              <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background opacity-0 group-hover:opacity-100 transition-opacity">Expand</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col pb-16 md:pb-0">
        <header className="sticky top-0 z-30 bg-card border-b border-border h-14 px-4 sm:px-6 flex items-center gap-4">
          <div className="flex items-center gap-2 md:hidden">
            <div className="size-8 rounded-lg grid place-items-center bg-primary text-primary-foreground">
              <Stethoscope className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="font-semibold tracking-tight">EaglesEye</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium truncate">{current}</span>
          </div>
          <select aria-label="Ward" className="hidden sm:block h-8 px-2 rounded-md border border-input bg-card text-xs font-medium outline-none focus:border-primary">
            <option>ICU — A</option>
            <option>ICU — B</option>
            <option>Cardiac</option>
            <option>General</option>
          </select>
          <div className="ml-auto flex items-center gap-3 text-xs">
            <div className="hidden lg:flex items-center gap-2 h-8 w-64 px-2.5 rounded-md border border-input bg-muted">
              <Search className="size-3.5 text-muted-foreground" />
              <input aria-label="Search" placeholder="Search patients, alerts..." className="flex-1 bg-transparent outline-none text-xs" />
            </div>
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border">
              <span className="live-dot" /> <span className="text-emerald-700 font-semibold tracking-wide">LIVE</span>
            </span>
            {critical > 0 && <span className="hidden sm:inline text-rose-700 font-medium">{critical} critical</span>}
            <AlertsPanel />
            <span className="hidden md:flex items-center gap-2 pl-3 border-l border-border">
              <span className="size-7 rounded-full bg-accent text-accent-foreground grid place-items-center text-[11px] font-semibold">DK</span>
              <span className="text-foreground font-medium">Dr. Kumar</span>
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 anim-slide-up">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-card border-t border-border flex">
        {nav.map(n => {
          const active = isActive(n.to, pathname);
          const Icon = n.icon;
          return (
            <Link key={n.to} to={n.to} className={["relative flex-1 flex flex-col items-center justify-center gap-1 text-[10px]", active ? "text-primary font-medium" : "text-muted-foreground"].join(" ")}>
              {active && <span className="absolute top-0 inset-x-6 h-[2px] bg-primary" />}
              <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
