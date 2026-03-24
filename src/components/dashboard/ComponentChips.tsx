interface ComponentChipsProps {
  components: string[];
}

export function ComponentChips({ components }: ComponentChipsProps) {
  if (!components || components.length === 0) return null;

  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {components.map((name) => (
        <span
          key={name}
          className="rounded-md border border-border bg-surface-hover/50 px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-wider text-text-secondary"
        >
          {name}
        </span>
      ))}
    </div>
  );
}
