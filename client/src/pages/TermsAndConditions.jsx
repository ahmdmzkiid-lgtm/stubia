import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PageWrapper from '../components/layout/PageWrapper';

export default function TermsAndConditions() {
  const { user } = useAuth();
  const content = (
    <div className="prose prose-lg max-w-none">
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Penerimaan Syarat</h2>
        <p className="text-gray-700 leading-relaxed">
          Dengan mengakses dan menggunakan platform Stubia, Anda menerima dan setuju untuk terikat 
          oleh syarat dan ketentuan ini. Jika Anda tidak setuju dengan bagian mana pun dari syarat 
          ini, mohon hentikan penggunaan platform kami.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Lisensi Penggunaan</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Stubia memberikan Anda lisensi terbatas, non-eksklusif, non-dapat dialihkan, dan dapat 
          dibatalkan untuk mengakses dan menggunakan platform kami untuk tujuan pendidikan pribadi Anda.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Anda tidak boleh:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mt-4">
          <li>Mereproduksi, mendistribusikan, atau mengirimkan konten</li>
          <li>Memodifikasi atau mengubah platform kami</li>
          <li>Melakukan reverse engineering atau hacking</li>
          <li>Menggunakan bot atau skrip otomatis</li>
          <li>Melakukan aktivitas yang dapat merusak sistem kami</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Akun Pengguna</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Saat membuat akun, Anda bertanggung jawab untuk:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Memberikan informasi yang akurat dan lengkap</li>
          <li>Menjaga kerahasiaan kata sandi</li>
          <li>Semua aktivitas yang terjadi di akun Anda</li>
          <li>Memberitahu kami segera jika akun Anda dikompromikan</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Konten Pengguna</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Anda mempertahankan semua hak atas konten yang Anda unggah. Dengan mengunggah konten, 
          Anda memberikan Stubia lisensi global, royalti-gratis untuk menggunakan, menyimpan, 
          dan menampilkan konten untuk keperluan platform kami.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Anda berjanji bahwa konten Anda:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mt-4">
          <li>Tidak melanggar hak siapa pun</li>
          <li>Tidak mengandung materi yang melanggar hukum</li>
          <li>Tidak mengandung malware atau virus</li>
          <li>Tidak mengganggu operasi platform</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Hak Kekayaan Intelektual</h2>
        <p className="text-gray-700 leading-relaxed">
          Semua konten di platform Stubia, termasuk teks, grafik, logo, dan materi pembelajaran, 
          adalah milik Stubia atau pemberi lisensi kami. Konten dilindungi oleh undang-undang hak cipta 
          dan tidak dapat direproduksi tanpa izin tertulis.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Pembayaran dan Langganan</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Jika Anda membeli langganan atau produk premium:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Anda setuju membayar harga yang ditampilkan</li>
          <li>Pembayaran diproses dengan aman melalui payment gateway</li>
          <li>Langganan otomatis diperbaharui kecuali Anda membatalkannya</li>
          <li>Tidak ada pengembalian dana untuk layanan digital yang sudah diberikan</li>
          <li>Kami berhak mengubah harga dengan notifikasi 30 hari</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Pembatasan Tanggung Jawab</h2>
        <p className="text-gray-700 leading-relaxed">
          Sejauh diizinkan oleh hukum, Stubia tidak bertanggung jawab atas kerusakan tidak langsung, 
          insidental, khusus, atau konsekuen yang timbul dari penggunaan platform kami, bahkan jika 
          kami telah diberitahu tentang kemungkinan kerusakan tersebut.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Penghentian Layanan</h2>
        <p className="text-gray-700 leading-relaxed">
          Kami berhak untuk menghentikan atau menangguhkan akun Anda jika:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Anda melanggar syarat dan ketentuan ini</li>
          <li>Anda menggunakan platform untuk aktivitas ilegal</li>
          <li>Anda melakukan pelecehan atau ancaman terhadap pengguna lain</li>
          <li>Anda membahayakan keamanan platform</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Perubahan Syarat</h2>
        <p className="text-gray-700 leading-relaxed">
          Kami berhak mengubah syarat ini kapan saja. Perubahan akan berlaku segera setelah 
          diposting di platform. Penggunaan berkelanjutan Anda berarti penerimaan terhadap perubahan.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Hukum yang Berlaku</h2>
        <p className="text-gray-700 leading-relaxed">
          Syarat dan ketentuan ini diatur oleh hukum Republik Indonesia. Setiap perselisihan akan 
          diselesaikan melalui pengadilan yang berwenang di Jakarta, Indonesia.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Kontak untuk Pertanyaan</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Jika Anda memiliki pertanyaan tentang syarat ini, silakan hubungi kami:
        </p>
        <div className="bg-gray-50 p-6 rounded-lg mt-4">
          <p className="text-gray-800"><strong>Email:</strong> stubiasupport@gmail.com</p>
          <p className="text-gray-800"><strong>Alamat:</strong> Jakarta, Indonesia</p>
          <p className="text-gray-800"><strong>Telepon:</strong> 085183147625</p>
        </div>
      </section>

      <section className="mb-12">
        <p className="text-gray-600 text-sm">
          Syarat dan ketentuan ini terakhir diperbarui pada: {new Date().toLocaleDateString('id-ID')}
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
            <h1 className="text-3xl font-bold text-[#191b24] mb-8">Syarat dan Ketentuan</h1>
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
            Syarat dan Ketentuan
          </h1>
          <p className="text-white/90 text-lg">
            Ketentuan penggunaan layanan Stubia
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
