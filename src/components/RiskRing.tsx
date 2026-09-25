export function RiskRing({ score, size = 56 }: { score: number; size?: number }) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color =
    score >= 80 ? "oklch(0.52 0.19 25)" :
    score >= 60 ? "oklch(0.7 0.16 70)" :
    score >= 35 ? "oklch(0.55 0.13 235)" :
    "oklch(0.58 0.14 150)";
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="#e8edf2" strokeWidth={stroke} fill="none" />
        <circle
          cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.4s" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-xs font-bold tabular-nums" style={{ color }}>
        {score}
      </div>
    </div>
  );
}
