export const metadata = {
  title: "Panduan Persiapan Pernikahan | Weplan",
  description: "Dapatkan checklist dan panduan eksklusif dari Weplan.",
};

export default function LeadMagnetPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 py-24">
      <h1 className="text-4xl font-bold tracking-tight mb-4">Checklist Pernikahan Impian</h1>
      <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
        Jangan sampai ada yang terlewat. Download checklist lengkap 12 bulan persiapan pernikahan secara gratis.
      </p>
      <form className="flex w-full max-w-sm flex-col gap-4 mx-auto">
        <input 
          type="email" 
          placeholder="Masukkan email Anda" 
          className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          required
        />
        <button 
          type="submit"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-11 px-8"
        >
          Kirim ke Email Saya
        </button>
      </form>
    </div>
  );
}
