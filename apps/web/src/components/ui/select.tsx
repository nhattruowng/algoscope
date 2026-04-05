import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-xl border border-line bg-panelAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent/50",
        props.className,
      )}
      {...props}
    />
  );
}

