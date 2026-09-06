export function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="border-l border-line pl-4">
      <div className="eyebrow">{label}</div>
      <div className="mt-1 font-serif text-3xl leading-none">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-4">{hint}</div>}
    </div>
  );
}
