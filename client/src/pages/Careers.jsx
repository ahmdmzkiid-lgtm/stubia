import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PageWrapper from '../components/layout/PageWrapper';

export default function Careers() {
  const { user } = useAuth();
  const [showComingModal, setShowComingModal] = useState(true);

  const careers = [
    {
      id: 1,
      title: 'Frontend Developer',
      department: 'Engineering',
      location: 'Jakarta, Indonesia',
      type: 'Full-time',
      description: 'Mengembangkan interface yang intuitif dan responsif untuk platform EduZET',
    },
    {
      id: 2,
      title: 'Backend Developer',
      department: 'Engineering',
      location: 'Jakarta, Indonesia',
      type: 'Full-time',
      description: 'Membangun API dan sistem backend yang scalable dan efisien',
    },
    {
      id: 3,
      title: 'Content Creator - Pembahasan Soal',
      department: 'Content',
      location: 'Remote',
      type: 'Full-time',
      description: 'Membuat pembahasan soal UTBK yang komprehensif dan mudah dipahami',
    },
    {
      id: 4,
      title: 'UI/UX Designer',
      department: 'Design',
      location: 'Jakarta, Indonesia',
      type: 'Full-time',
      description: 'Mendesain pengalaman pengguna yang menarik dan fungsional',
    },
    {
      id: 5,
      title: 'Product Manager',
      department: 'Product',
      location: 'Jakarta, Indonesia',
      type: 'Full-time',
      description: 'Memimpin pengembangan produk dan strategi platform EduZET',
    },
    {
      id: 6,
      title: 'Community Manager',
      department: 'Marketing',
      location: 'Jakarta, Indonesia',
      type: 'Full-time',
      description: 'Membangun dan memelihara komunitas pengguna EduZET yang aktif',
    },
  ];

  const mainContent = (
    <div>
      {/* About Section */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Tentang EduZET</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              EduZET adalah platform pembelajaran UTBK terdepan di Indonesia yang membantu ribuan siswa mencapai impian mereka untuk masuk ke universitas ternama.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              Kami berkomitmen untuk menyediakan pengalaman belajar terbaik dengan teknologi terkini dan konten berkualitas tinggi.
            </p>
          </div>
          <div>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              Di EduZET, kami percaya bahwa setiap anggota tim memiliki peran penting dalam kesuksesan siswa kami. Kami memberikan ruang bagi Anda untuk berinovasi dan berkembang.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Nilai Kami</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-3">🎓 Fokus pada Siswa</h3>
            <p className="text-gray-700">
              Setiap keputusan yang kami ambil selalu didasarkan pada dampak positif bagi pengalaman belajar siswa kami.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-3">🚀 Inovasi Berkelanjutan</h3>
            <p className="text-gray-700">
              Kami terus memperbarui cara belajar, teknologi yang digunakan, dan konten materi untuk menjadi yang terbaik.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-3">💼 Budaya Kerja</h3>
            <p className="text-gray-700">
              Tim yang kolaboratif, inovatif, dan saling mendukung untuk menciptakan produk yang luar biasa.
            </p>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-12">Lowongan Terbuka</h2>
        <p className="text-gray-600 text-center mb-12 text-lg">
          Saat ini belum ada lowongan yang tersedia. Silakan periksa kembali di kemudian hari atau hubungi kami untuk informasi lebih lanjut.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {careers.map((job) => (
            <div
              key={job.id}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition cursor-not-allowed opacity-60"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h3>
              <div className="flex gap-4 mb-4">
                <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded">
                  {job.department}
                </span>
                <span className="inline-block bg-gray-100 text-gray-800 text-sm font-semibold px-3 py-1 rounded">
                  {job.type}
                </span>
              </div>
              <p className="text-gray-600 mb-3">{job.location}</p>
              <p className="text-gray-700 mb-4">{job.description}</p>
              <button
                disabled
                className="w-full bg-gray-300 text-gray-500 font-semibold py-2 rounded-lg cursor-not-allowed"
              >
                Lowongan Ditutup
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-gradient-to-r from-[#0050cb] to-[#0050cb]/80 rounded-lg p-12 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Dapatkan Notifikasi Lowongan Terbaru</h2>
        <p className="text-white/90 mb-8">
          Daftarkan email Anda untuk menerima notifikasi ketika kami membuka lowongan baru
        </p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Masukkan email Anda"
            className="flex-1 px-4 py-3 rounded-lg focus:outline-none text-[14px]"
          />
          <button className="bg-white text-[#0050cb] font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition text-[14px]">
            Daftar
          </button>
        </div>
      </section>

      {/* Contact */}
      <section className="mt-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Hubungi Kami</h2>
        <p className="text-gray-700 mb-6 text-lg">
          Memiliki pertanyaan tentang karir di EduZET? Jangan ragu untuk menghubungi kami:
        </p>
        <div className="bg-gray-50 p-8 rounded-lg">
          <p className="text-gray-800 mb-2"><strong>Email:</strong> careers@eduzet.com</p>
          <p className="text-gray-800 mb-2"><strong>Telepon:</strong> 085183147625</p>
          <p className="text-gray-800"><strong>Alamat:</strong> Jakarta, Indonesia</p>
        </div>
      </section>

      {/* Footer Link */}
      <div className="py-8 border-t border-gray-200 mt-20">
        <Link 
          to={user ? "/dashboard" : "/"} 
          className="text-[#0050cb] hover:text-[#0050cb]/80 font-semibold"
        >
          {user ? "← Kembali ke Dashboard" : "← Kembali ke Beranda"}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Modal */}
      {showComingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 animate-bounce-in">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Lowongan Belum Dibuka</h2>
              <p className="text-gray-600 mb-2 text-lg">
                Terima kasih atas minat Anda bergabung dengan tim EduZET!
              </p>
              <p className="text-gray-600 mb-8">
                Saat ini kami belum membuka lowongan pekerjaan. Namun, kami akan segera mengumumkan posisi terbaru. Silakan periksa kembali di halaman ini atau hubungi kami untuk informasi lebih lanjut.
              </p>
              <button
                onClick={() => setShowComingModal(false)}
                className="bg-[#0050cb] text-white font-semibold py-3 px-8 rounded-lg hover:bg-[#0050cb]/90 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {user ? (
        <PageWrapper>
          <div className="max-w-6xl mx-auto py-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-12 animate-fade-in">
              <h1 className="text-3xl font-bold text-[#191b24] mb-8">Karir di Eduzet</h1>
              {mainContent}
            </div>
          </div>
        </PageWrapper>
      ) : (
        <>
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0050cb] to-[#0050cb]/80 py-16">
            <div className="max-w-6xl mx-auto px-4 md:px-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Bergabunglah dengan Tim EduZET
              </h1>
              <p className="text-white/90 text-lg">
                Kami mencari talenta terbaik untuk membangun masa depan pendidikan Indonesia
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-12">
              {mainContent}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
