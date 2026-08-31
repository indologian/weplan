import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

export const metadata = {
  title: "Panduan Persiapan Pernikahan | Weplan",
  description: "Dapatkan checklist dan panduan eksklusif dari Weplan.",
};

export default function LeadMagnetPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 py-24">
      <div className="max-w-xl mx-auto space-y-8">
        <div>
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium mb-6 bg-background/50">
            Gratis
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">Checklist Pernikahan Impian</h1>
          <p className="text-muted-foreground text-lg">
            Jangan sampai ada yang terlewat. Download checklist lengkap 12 bulan persiapan pernikahan yang disusun oleh para ahli, gratis.
          </p>
        </div>
        
        <form className="flex w-full max-w-sm flex-col gap-3 mx-auto">
          <Input 
            type="email" 
            placeholder="Masukkan email Anda" 
            required
            className="h-12"
          />
          <Button type="submit" size="lg" className="w-full">
            Kirim ke Email Saya
          </Button>
        </form>
      </div>
    </div>
  );
}
