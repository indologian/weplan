export const metadata = {
  title: "Kebijakan Privasi | Weplan",
};

export default function KebijakanPrivasiPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 prose dark:prose-invert">
      <h1>Kebijakan Privasi</h1>
      <p>Pembaruan Terakhir: {new Date().toLocaleDateString('id-ID')}</p>
      
      <h2>1. Informasi yang Kami Kumpulkan</h2>
      <p>
        Kami mengumpulkan informasi pendaftaran (email, nama) serta data yang Anda masukkan ke dalam undangan (nama mempelai, foto, lokasi, dan detail acara).
      </p>

      <h2>2. Penggunaan Data</h2>
      <p>
        Data yang diunggah hanya digunakan untuk keperluan rendering undangan digital Anda. Kami tidak akan pernah menjual atau mendistribusikan data tamu Anda kepada pihak ketiga.
      </p>

      <h2>3. Keamanan</h2>
      <p>
        Weplan menggunakan enkripsi standar industri dan perlindungan Turnstile untuk mengamankan data transaksi serta memitigasi serangan brute-force terhadap akses undangan privat Anda.
      </p>
    </div>
  );
}
