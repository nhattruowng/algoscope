import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold transition",
        variant === "primary" && "border-accent/30 bg-accent text-bg hover:bg-accent/90",
        variant === "secondary" && "border-line bg-panelAlt text-text hover:border-accent/30",
        variant === "ghost" && "border-transparent bg-transparent text-muted hover:text-text",
        className,
      )}
      {...props}
    />
  );
}

