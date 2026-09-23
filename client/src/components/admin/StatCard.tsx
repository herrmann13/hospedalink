import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  icon: Icon;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            accent ? "bg-accent-soft text-accent" : "bg-brand-50 text-brand",
          )}
        >
          <Icon size={18} weight="regular" />
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-ink">{value}</div>
    </div>
  );
}
