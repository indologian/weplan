import React from "react";
import { cn } from "@/shared/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
};

export function NarrowMeasure({ children, className, as: Component = "div" }: Props) {
  return (
    <Component className={cn("w-full max-w-[480px] mx-auto px-4", className)}>
      {children}
    </Component>
  );
}
