import { useEffect, useSyncExternalStore } from "react";
import { generatePatients, type Patient, type Status } from "./mockData";

type Listener = () => void;

function statusFromRisk(r: number): Status {
  if (r >= 80) return "Critical";
  if (r >= 60) return "High Risk";
  if (r >= 35) return "Monitor";
  return "Stable";
}

function genReasons(p: Patient): string[] {
  const r: string[] = [];
  if (p.spo2 < 92) r.push(`SpO₂ at ${p.spo2}% — below safe threshold (94%)`);
  else if (p.spo2 < 95) r.push(`SpO₂ trending down (${p.spo2}%) over last 20 min`);
  if (p.heartRate > 110) r.push(`Heart rate elevated to ${p.heartRate} bpm`);
  else if (p.heartRate < 55) r.push(`Bradycardia: HR ${p.heartRate} bpm`);
  if (p.bpSys < 95) r.push(`Systolic BP dropping (${p.bpSys} mmHg)`);
  else if (p.bpSys > 160) r.push(`Hypertensive reading: ${p.bpSys} mmHg`);
  if (p.temperature > 38.5) r.push(`Fever: ${p.temperature.toFixed(1)}°C`);
  if (r.length === 0) r.push("All vitals within stable range");
  return r;
}

class Store {
  patients: Patient[] = generatePatients();
  totalNurses = 24;
  private listeners = new Set<Listener>();

  subscribe = (l: Listener) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };
  private emit() { this.listeners.forEach(l => l()); }

  getSnapshot = () => this.patients;

  tick() {
    this.patients = this.patients.map(p => {
      const driftSpo2 = (Math.random() - 0.5) * 2;
      const driftHr = (Math.random() - 0.5) * 6;
      const driftBp = (Math.random() - 0.5) * 4;
      const driftTemp = (Math.random() - 0.5) * 0.3;

      const spo2 = Math.round(Math.max(80, Math.min(100, p.spo2 + driftSpo2)));
      const heartRate = Math.round(Math.max(45, Math.min(160, p.heartRate + driftHr)));
      const bpSys = Math.round(Math.max(75, Math.min(180, p.bpSys + driftBp)));
      const temperature = Number(Math.max(35, Math.min(40.5, p.temperature + driftTemp)).toFixed(1));

      // Risk model (explainable, simple)
      let risk = 10;
      if (spo2 < 92) risk += (92 - spo2) * 8;
      else if (spo2 < 95) risk += (95 - spo2) * 4;
      if (heartRate > 110) risk += (heartRate - 110) * 1.5;
      if (heartRate < 55) risk += (55 - heartRate) * 2;
      if (bpSys < 95) risk += (95 - bpSys) * 1.8;
      if (temperature > 38.5) risk += (temperature - 38.5) * 12;
      // Nurse assignment reduces risk
      if (p.assignedNurse) risk -= 8;
      risk = Math.round(Math.max(5, Math.min(99, risk * 0.55 + p.riskScore * 0.45)));

      const updated: Patient = {
        ...p,
        spo2, heartRate, bpSys, temperature,
        riskScore: risk,
        status: statusFromRisk(risk),
        alert: risk >= 80 || (risk >= 60 && Math.random() > 0.5),
      };
      updated.reasons = genReasons(updated);
      updated.history = [...p.history.slice(1), { t: "now", spo2, hr: heartRate, risk }];
      updated.history = updated.history.map((h, i, arr) => i === arr.length - 1 ? h : { ...h, t: `-${(arr.length - 1 - i) * 5}m` });
      const trend = (risk - p.riskScore);
      updated.predictions = [15, 30, 45, 60].map((t, i) => ({
        t,
        risk: Math.round(Math.max(5, Math.min(99, risk + trend * (i + 1) * 0.6 + (Math.random() - 0.5) * 4))),
      }));
      return updated;
    });
    this.patients.sort((a, b) => b.riskScore - a.riskScore);
    this.emit();
  }

  assignNurse(id: string) {
    this.patients = this.patients.map(p => {
      if (p.id !== id) return p;
      const newRisk = Math.max(15, p.riskScore - 25);
      const updated: Patient = {
        ...p,
        assignedNurse: p.assignedNurse ?? ["N. Patel","S. Khan","R. Mehta","A. Singh","L. Davis"][Math.floor(Math.random()*5)],
        riskScore: newRisk,
        status: statusFromRisk(newRisk),
        alert: false,
        spo2: Math.min(100, p.spo2 + 3),
        heartRate: p.heartRate > 100 ? p.heartRate - 10 : p.heartRate + 2,
      };
      updated.reasons = ["Nurse intervention in progress — vitals stabilizing", ...genReasons(updated).slice(0, 2)];
      updated.history = [...p.history.slice(1), { t: "now", spo2: updated.spo2, hr: updated.heartRate, risk: newRisk }];
      updated.predictions = [15, 30, 45, 60].map((t, i) => ({
        t, risk: Math.round(Math.max(5, newRisk - i * 3 + (Math.random() - 0.5) * 4)),
      }));
      return updated;
    });
    this.patients.sort((a, b) => b.riskScore - a.riskScore);
    this.emit();
  }
}

export const store = new Store();

export function usePatients() {
  // SSR-safe: return the same snapshot on the server
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

export function useRealtime(intervalMs = 3500) {
  useEffect(() => {
    const id = setInterval(() => store.tick(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
