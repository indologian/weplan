import React from "react";

export function WeddingCanvas({ children }: { children: React.ReactNode }) {
  return (
    <div className="wedding-canvas w-full min-h-screen relative flex justify-center">
      {/* 
        This is the Hybrid Responsive Canvas boundary.
        Mobile: Full width available.
        Desktop: Constrained by theme layout primitives inside (e.g., NarrowMeasure).
      */}
      {children}
    </div>
  );
}
