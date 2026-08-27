export const metadata = {
  title: "Syarat dan Ketentuan | Weplan",
};

export default function SyaratKetentuanPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 prose dark:prose-invert">
      <h1>Syarat dan Ketentuan</h1>
      <p>Pembaruan Terakhir: {new Date().toLocaleDateString('id-ID')}</p>
      
      <h2>1. Penerimaan Syarat</h2>
      <p>
        Dengan mengakses dan menggunakan platform Weplan, Anda menyetujui untuk terikat oleh Syarat dan Ketentuan ini.
      </p>

      <h2>2. Penggunaan Layanan</h2>
      <p>
        Layanan Weplan hanya ditujukan untuk keperluan pembuatan undangan digital pernikahan pribadi dan tidak untuk digunakan sebagai sarana SPAM atau pelanggaran hak cipta.
      </p>

      <h2>3. Pembayaran dan Pengembalian Dana</h2>
      <p>
        Pembayaran untuk tema Premium bersifat final. Pengembalian dana (refund) hanya dapat dilakukan dalam kondisi kesalahan teknis sistem pembayaran sesuai dengan kebijakan integrasi kami.
      </p>
    </div>
  );
}
