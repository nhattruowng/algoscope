import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-line bg-panelAlt px-3 py-2 text-sm text-text outline-none transition placeholder:text-muted focus:border-accent/50",
        props.className,
      )}
      {...props}
    />
  );
}

