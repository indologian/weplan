import React from "react";
import { cn } from "@/shared/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
};

export function Breakout({ children, className, as: Component = "div" }: Props) {
  return (
    <Component className={cn("w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </Component>
  );
}
