import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
        className,
      )}
      {...props}
    />
  );
}
