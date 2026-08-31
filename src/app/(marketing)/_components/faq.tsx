export function FAQ() {
  return (
    <section className="py-24 border-t">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight">Tanya Jawab</h2>
            <p className="text-muted-foreground text-lg">
              Temukan jawaban untuk pertanyaan yang sering diajukan mengenai platform Weplan.
            </p>
          </div>
          
          <div className="lg:col-span-7 flex items-center justify-center rounded-2xl border border-dashed p-12 bg-muted/10">
            <div className="text-sm text-muted-foreground text-center">
              (Daftar FAQ akan segera ditambahkan)
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
