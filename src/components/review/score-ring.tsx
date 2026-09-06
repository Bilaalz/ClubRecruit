/** SVG ring for the 0–100 overall score. Stroke in ink, track in cream-3. */
export function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Overall score ${pct} out of 100`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--cream-3)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--ink)"
        strokeWidth={stroke}
        strokeLinecap="butt"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="fill-ink font-serif" fontSize={size * 0.3}>
        {pct}
      </text>
    </svg>
  );
}
