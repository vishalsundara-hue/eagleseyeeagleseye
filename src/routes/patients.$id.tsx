import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Activity, Droplet, Thermometer, Wind, Sparkles, UserPlus, AlertTriangle, Siren, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { RiskRing } from "@/components/RiskRing";
import { usePatients, store, NURSES } from "@/lib/store";
import { STATUS_COLORS } from "@/lib/mockData";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from "recharts";

const CRITICAL_WEBHOOK_URL = "https://vishalvishal.app.n8n.cloud/webhook/critical-alert";
const CHARGE_NURSE_PHONE = "919000000099";
const DOCTOR_PHONE = "919000000100";

export const Route = createFileRoute("/patients/$id")({
  head: () => ({ meta: [{ title: "Patient · EaglesEye AI" }] }),
  component: PatientDetails,
});

function Vital({ icon, label, value, unit, warn }: { icon: React.ReactNode; label: string; value: string | number; unit?: string; warn?: boolean }) {
  return (
    <div className={`glass rounded-xl p-4 ${warn ? "ring-1 ring-rose-400/40" : ""}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${warn ? "text-rose-700" : "text-foreground"}`}>{value}<span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span></div>
    </div>
  );
}

const tooltipStyle = {
  contentStyle: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 },
  labelStyle: { color: "#94a3b8" },
};

function PatientDetails() {
  const { id } = Route.useParams();
  const patients = usePatients();
  const navigate = useNavigate();
  const p = patients.find(x => x.id === id);
  const [sending, setSending] = useState(false);

  async function sendCriticalAlert() {
    if (!p) return;
    const assigned = NURSES.find(n => n.name === p.assignedNurse);
    const backup = NURSES.find(n => n.ward === p.ward && n.name !== assigned?.name)
      ?? NURSES.find(n => n.name !== assigned?.name);
    const body = {
      patient_name: p.name,
      assigned_nurse: {
        name: assigned?.name ?? NURSES[0].name,
        phone: assigned?.phone ?? NURSES[0].phone,
      },
      backup_nurse: {
        name: backup?.name ?? NURSES[1].name,
        phone: backup?.phone ?? NURSES[1].phone,
      },
      charge_nurse: { phone: CHARGE_NURSE_PHONE },
      doctor: { phone: DOCTOR_PHONE },
      risk_score: p.riskScore,
      condition: p.diagnosis,
      priority: "Critical",
      bed: `${p.ward} · Room ${p.room}`,
      // legacy flat fields for backwards compatibility
      patient: p.name,
      nurse1: assigned?.phone ?? NURSES[0].phone,
      nurse2: backup?.phone ?? NURSES[1].phone,
    };
    setSending(true);
    console.log("Sending webhook...", body);
    try {
      const response = await fetch(CRITICAL_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      console.log("Webhook success", response);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      toast.success("Emergency alert sent successfully.");
    } catch (error) {
      console.error("Webhook failed", error);
      toast.error("Failed to send emergency alert.");
    } finally {
      setSending(false);
    }
  }



  if (!p) {
    return (
      <AppShell>
        <div className="glass rounded-lg p-10 text-center">
          <h2 className="text-xl font-semibold">Patient not found</h2>
          <Link to="/" className="inline-flex items-center gap-2 mt-4 text-primary"><ArrowLeft className="size-4" /> Back to dashboard</Link>
        </div>
      </AppShell>
    );
  }

  const predData = [{ t: "now", risk: p.riskScore }, ...p.predictions.map(x => ({ t: `+${x.t}m`, risk: x.risk }))];

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <button onClick={() => navigate({ to: "/" })} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="size-3.5" /> Dashboard
            </button>
            <div className="flex items-center gap-4 flex-wrap">
              <RiskRing score={p.riskScore} size={64} />
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold truncate">{p.name}</h1>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {p.id} · {p.age}{p.gender} · {p.ward} · Room {p.room}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Diagnosis: <span className="text-foreground/80">{p.diagnosis}</span> · Day {p.admittedDays}</div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs border ${STATUS_COLORS[p.status]}`}>{p.status}</span>
            </div>
          </div>
          <div className="shrink-0 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => { void sendCriticalAlert(); }}
              disabled={sending}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 text-foreground font-semibold text-sm hover:shadow-lg hover:shadow-rose-500/40 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Siren className="size-4" />}
              {sending ? "Sending…" : "Critical Alert"}
            </button>
            <button
              onClick={() => store.assignNurse(p.id)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 text-primary-foreground font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/30 transition"
            >
              <UserPlus className="size-4" /> Assign Nurse
            </button>
          </div>

        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Vital icon={<Wind className="size-4" />} label="SpO₂" value={p.spo2} unit="%" warn={p.spo2 < 92} />
          <Vital icon={<Activity className="size-4" />} label="Heart Rate" value={p.heartRate} unit="bpm" warn={p.heartRate > 110 || p.heartRate < 55} />
          <Vital icon={<Droplet className="size-4" />} label="Blood Pressure" value={`${p.bpSys}/${p.bpDia}`} unit="mmHg" warn={p.bpSys < 95 || p.bpSys > 160} />
          <Vital icon={<Thermometer className="size-4" />} label="Temperature" value={p.temperature.toFixed(1)} unit="°C" warn={p.temperature > 38.5} />
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="glass rounded-lg p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="size-4 text-primary" />
              <h3 className="font-semibold">AI Analysis</h3>
              <span className="ml-auto text-xs text-muted-foreground">Confidence 92%</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl font-bold tabular-nums text-foreground">{p.riskScore}<span className="text-base text-muted-foreground font-normal">% risk</span></div>
              <span className={`px-2 py-1 rounded-full text-xs border ${STATUS_COLORS[p.status]}`}>{p.status}</span>
            </div>
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Why this score?</div>
              {p.reasons.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-foreground/80 bg-white/[0.03] rounded-lg px-3 py-2 border border-border">
                  <span className="mt-1 size-1.5 rounded-full bg-cyan-300 shrink-0" />{r}
                </div>
              ))}
            </div>
            {p.assignedNurse && (
              <div className="mt-4 text-xs text-emerald-700 flex items-center gap-2">
                <UserPlus className="size-3.5" /> Nurse {p.assignedNurse} assigned · response in progress
              </div>
            )}
          </div>

          <div className="glass rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="size-4 text-amber-700" />
              <h3 className="font-semibold">Risk Forecast</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {p.predictions.map(pr => {
                const delta = pr.risk - p.riskScore;
                const tone = pr.risk >= 80 ? "text-rose-700" : pr.risk >= 60 ? "text-amber-700" : "text-emerald-700";
                return (
                  <div key={pr.t} className="rounded-xl border border-border bg-white/[0.03] p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">+{pr.t} min</div>
                    <div className={`text-xl font-bold tabular-nums ${tone}`}>{pr.risk}%</div>
                    <div className="text-[11px] text-muted-foreground">{delta >= 0 ? "+" : ""}{delta} pts</div>
                  </div>
                );
              })}
            </div>
            <div className="text-[11px] text-muted-foreground mt-3">Predictions based on vitals trajectory &amp; cohort patterns.</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <ChartCard title="SpO₂ Trend (last 60 min)" color="oklch(0.52 0.13 230)" data={p.history} dataKey="spo2" domain={[80, 100]} unit="%" />
          <ChartCard title="Heart Rate Trend" color="oklch(0.55 0.18 28)" data={p.history} dataKey="hr" domain={[40, 160]} unit="bpm" />
          <RiskTrendCard data={[...p.history, ...p.predictions.map(pr => ({ t: `+${pr.t}m`, risk: pr.risk, spo2: 0, hr: 0 }))]} now={p.history.length - 1} />
        </div>
      </div>
    </AppShell>
  );
}

function ChartCard({ title, color, data, dataKey, domain, unit }: any) {
  return (
    <div className="glass rounded-lg p-5">
      <h3 className="font-semibold text-sm mb-2">{title}</h3>
      <div className="h-44">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#eef2f6" vertical={false} />
            <XAxis dataKey="t" tick={{ fill: "#64748b", fontSize: 10 }} />
            <YAxis domain={domain} tick={{ fill: "#64748b", fontSize: 10 }} />
            <Tooltip {...tooltipStyle} formatter={(v: any) => [`${v}${unit}`, title]} />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RiskTrendCard({ data }: { data: any[]; now: number }) {
  return (
    <div className="glass rounded-lg p-5">
      <h3 className="font-semibold text-sm mb-2">Risk Trajectory (history → forecast)</h3>
      <div className="h-44">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="riskG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.55 0.18 28)" stopOpacity={0.6} />
                <stop offset="100%" stopColor="oklch(0.55 0.18 28)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#eef2f6" vertical={false} />
            <XAxis dataKey="t" tick={{ fill: "#64748b", fontSize: 10 }} />
            <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
            <Tooltip {...tooltipStyle} formatter={(v: any) => [`${v}%`, "Risk"]} />
            <Area type="monotone" dataKey="risk" stroke="oklch(0.55 0.18 28)" strokeWidth={2.5} fill="url(#riskG)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
