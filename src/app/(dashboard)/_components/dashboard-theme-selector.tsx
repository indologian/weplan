"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/shared/lib/utils";

const themes = [
  { value: "light", label: "Terang", icon: Sun },
  { value: "dark", label: "Gelap", icon: Moon },
  { value: "system", label: "Sistem", icon: Monitor },
] as const;

export function DashboardThemeSelector() {
  const { theme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  return (
    <fieldset className="space-y-2" disabled={!mounted}>
      <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Tampilan
      </legend>
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
        {themes.map(({ value, label, icon: Icon }) => {
          const selected = mounted && theme === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              onClick={() => setTheme(value)}
              className={cn(
                "inline-flex min-h-11 flex-col items-center justify-center gap-1 rounded-md px-1 text-[0.6875rem] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected && "bg-background text-foreground shadow-sm",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
