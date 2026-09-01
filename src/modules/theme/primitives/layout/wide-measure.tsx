import React from "react";
import { cn } from "@/shared/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
};

export function WideMeasure({ children, className, as: Component = "div" }: Props) {
  return (
    <Component className={cn("w-full max-w-[768px] mx-auto px-6", className)}>
      {children}
    </Component>
  );
}
