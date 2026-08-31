"use client";

const STEPS = [
  { id: 1, label: "Profil & Doa" },
  { id: 2, label: "Detail Acara" },
  { id: 3, label: "Cerita & Galeri" },
  { id: 4, label: "Pengaturan Lanjutan" },
];

export function EditorStepNavigation({ currentStep, onChange }: { currentStep: number, onChange: (step: number) => void }) {
  return (
    <div className="w-full overflow-hidden mb-6">
      <div className="w-full overflow-x-auto pb-4 -mb-4 hide-scrollbar">
        <nav className="flex items-center gap-2" aria-label="Tabs">
          {STEPS.map((step) => {
            const isActive = currentStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => onChange(step.id)}
                className={`
                  relative whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                  ${isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                `}
                aria-current={isActive ? "page" : undefined}
              >
                {step.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
