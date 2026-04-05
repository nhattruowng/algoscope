import { cn } from "@/lib/cn";

export function Badge({ value, tone = "default" }: { value: string; tone?: "default" | "success" | "warning" | "danger" }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
        tone === "default" && "border-line bg-panelAlt text-muted",
        tone === "success" && "border-success/30 bg-success/10 text-success",
        tone === "warning" && "border-warning/30 bg-warning/10 text-warning",
        tone === "danger" && "border-danger/30 bg-danger/10 text-danger",
      )}
    >
      {value}
    </span>
  );
}

