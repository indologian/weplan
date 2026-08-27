import { notFound } from "next/navigation";

export default async function DemoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  if (!slug) notFound();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <h1 className="text-3xl font-bold tracking-tight mb-4">Demo Tema: {slug}</h1>
      <p className="text-muted-foreground">
        Halaman demo interaktif akan segera diluncurkan. Anda dapat membuat undangan secara gratis untuk mencobanya sekarang juga.
      </p>
    </div>
  );
}
