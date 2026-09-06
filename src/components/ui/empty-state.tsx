export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-line-soft px-6 py-14 text-center">
      <p className="font-serif text-xl">{title}</p>
      {description && <p className="mt-2 max-w-sm text-sm text-ink-3">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
