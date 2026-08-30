"use client";

const STEPS = [
  { id: 1, label: "Profil & Doa" },
  { id: 2, label: "Detail Acara" },
  { id: 3, label: "Cerita & Galeri" },
  { id: 4, label: "Pengaturan Lanjutan" },
];

export function EditorStepNavigation({ currentStep, onChange }: { currentStep: number, onChange: (step: number) => void }) {
  return (
    <div className="w-full">
      {/* Desktop / Tablet Tab Navigation */}
      <div className="hidden sm:block border-b border-muted">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {STEPS.map((step) => {
            const isActive = currentStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => onChange(step.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }
                `}
              >
                {step.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="sm:hidden mt-2">
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-input bg-background py-2 pl-3 pr-10 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
          value={currentStep}
          onChange={(e) => onChange(Number(e.target.value))}
        >
          {STEPS.map((step) => (
            <option key={step.id} value={step.id}>
              {step.id}. {step.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
