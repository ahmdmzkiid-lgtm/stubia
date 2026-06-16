import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PageWrapper from '../components/layout/PageWrapper';

export default function PrivacyPolicy() {
  const { user } = useAuth();
  const content = (
    <div className="prose prose-lg max-w-none">
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Pendahuluan</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          EduZET ("kami", "kami", atau "perusahaan") berkomitmen untuk melindungi privasi Anda. 
          Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, mengungkapkan, 
          dan melindungi informasi Anda ketika Anda menggunakan platform kami.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Informasi yang Kami Kumpulkan</h2>
        <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Informasi yang Anda Berikan</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>Nama lengkap dan email</li>
          <li>Nomor telepon dan alamat</li>
          <li>Informasi pembayaran (diproses melalui payment gateway aman)</li>
          <li>Foto profil dan biodata</li>
          <li>Preferensi akademik dan pilihan jurusan</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Informasi yang Dikumpulkan Secara Otomatis</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Alamat IP dan informasi perangkat</li>
          <li>Cookie dan data pelacakan web</li>
          <li>Riwayat penggunaan dan aktivitas</li>
          <li>Lokasi geografis (dengan izin Anda)</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Penggunaan Informasi</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Kami menggunakan informasi Anda untuk:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Menyediakan dan meningkatkan layanan kami</li>
          <li>Memproses transaksi dan pembayaran</li>
          <li>Mengirim notifikasi dan pembaruan</li>
          <li>Personalisasi pengalaman belajar Anda</li>
          <li>Melakukan riset dan analitik</li>
          <li>Memastikan keamanan dan mencegah penipuan</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Perlindungan Data</h2>
        <p className="text-gray-700 leading-relaxed">
          Kami menggunakan enkripsi SSL/TLS dan standar keamanan industri untuk melindungi data Anda. 
          Informasi sensitif disimpan dalam database terenkripsi yang aman dan hanya dapat diakses 
          oleh staf yang berwenang dengan akses terbatas.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Berbagi Informasi</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Kami tidak menjual atau menyewakan data pribadi Anda. Kami hanya membagikan informasi dengan:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Penyedia layanan yang dipercaya untuk membantu operasi kami</li>
          <li>Mitra institusi pendidikan untuk keperluan pendaftaran</li>
          <li>Otoritas hukum jika diwajibkan oleh peraturan</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Hak Anda</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Anda memiliki hak untuk:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Mengakses data pribadi Anda</li>
          <li>Meminta koreksi data yang salah</li>
          <li>Meminta penghapusan data</li>
          <li>Membatasi penggunaan data</li>
          <li>Membatalkan langganan komunikasi pemasaran</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Kontak Kami</h2>
        <p className="text-gray-700 leading-relaxed">
          Untuk pertanyaan tentang kebijakan privasi ini, silakan hubungi kami di:
        </p>
        <div className="bg-gray-50 p-6 rounded-lg mt-4">
          <p className="text-gray-800"><strong>Email:</strong> eduzetsupport@gmail.com</p>
          <p className="text-gray-800"><strong>Alamat:</strong> Jakarta, Indonesia</p>
          <p className="text-gray-800"><strong>Telepon:</strong> 085183147625</p>
        </div>
      </section>

      <section className="mb-12">
        <p className="text-gray-600 text-sm">
          Kebijakan privasi ini terakhir diperbarui pada: {new Date().toLocaleDateString('id-ID')}
        </p>
      </section>

      {/* Back Link */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <Link 
          to={user ? "/dashboard" : "/"} 
          className="text-[#0050cb] hover:text-[#0050cb]/80 font-semibold inline-flex items-center gap-2"
        >
          {user ? "← Kembali ke Dashboard" : "← Kembali ke Beranda"}
        </Link>
      </div>
    </div>
  );

  if (user) {
    return (
      <PageWrapper>
        <div className="max-w-4xl mx-auto py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-12">
            <h1 className="text-3xl font-bold text-[#191b24] mb-8">Kebijakan Privasi</h1>
            {content}
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0050cb] to-[#0050cb]/80 py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Kebijakan Privasi
          </h1>
          <p className="text-white/90 text-lg">
            Kami berkomitmen melindungi privasi dan data Anda
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-12">
          {content}
        </div>
      </div>
    </div>
  );
}
