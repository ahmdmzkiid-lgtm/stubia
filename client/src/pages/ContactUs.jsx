import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PageWrapper from '../components/layout/PageWrapper';

export default function ContactUs() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simulasi pengiriman - ganti dengan API endpoint yang sebenarnya
      console.log('Sending message:', formData);
      
      // Jika ada backend endpoint, gunakan ini:
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });

      // Simulasi delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const mainContent = (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      {/* Contact Information */}
      <div className="lg:col-span-1">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Informasi Kontak</h2>
        
        <div className="space-y-8">
          {/* Email */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-[#0050cb]/10 border border-[#0050cb] text-[#0050cb] font-bold text-lg">
                @
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Email</h3>
              <p className="text-gray-600">eduzetsupport@gmail.com</p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-[#0050cb]/10 border border-[#0050cb] text-[#0050cb] font-bold text-lg">
                +
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Telepon</h3>
              <p className="text-gray-600">085183147625</p>
              <p className="text-gray-600 text-sm">Senin - Jumat: 09:00 - 18:00 WIB</p>
            </div>
          </div>

          {/* Address */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-[#0050cb]/10 border border-[#0050cb] text-[#0050cb] font-bold text-lg">
                A
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Alamat</h3>
              <p className="text-gray-600">
                Jakarta, Indonesia
              </p>
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ikuti Kami</h3>
          <div className="flex gap-4">
            <a href="#" className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-gray-100 hover:bg-[#0050cb] hover:text-white transition text-sm font-semibold">
              f
            </a>
            <a href="#" className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-gray-100 hover:bg-[#0050cb] hover:text-white transition text-sm font-semibold">
              X
            </a>
            <a href="#" className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-gray-100 hover:bg-[#0050cb] hover:text-white transition text-sm font-semibold">
              in
            </a>
            <a href="#" className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-gray-100 hover:bg-[#0050cb] hover:text-white transition text-sm font-semibold">
              ig
            </a>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="lg:col-span-2">
        <div className="bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Kirim Pesan</h2>

          {submitted && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-semibold">Pesan Anda telah terkirim!</p>
              <p className="text-green-700 text-sm">Kami akan segera merespon pesan Anda.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Masukkan nama Anda"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050cb] focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Masukkan email Anda"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050cb] focus:border-transparent"
              />
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-semibold text-gray-900 mb-2">
                Subjek
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="Masukkan subjek pesan"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050cb] focus:border-transparent"
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-gray-900 mb-2">
                Pesan
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="6"
                placeholder="Ketikkan pesan Anda di sini..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050cb] focus:border-transparent resize-none"
              ></textarea>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0050cb] text-white font-semibold py-3 rounded-lg hover:bg-[#0050cb]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Mengirim...' : 'Kirim Pesan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const faqContent = (
    <div className="mt-20 pt-12 border-t border-gray-200">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Pertanyaan yang Sering Diajukan</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Berapa jam kerja customer service?</h3>
          <p className="text-gray-600">
            Tim customer service kami siap membantu Anda dari Senin hingga Jumat pukul 09:00 - 18:00 WIB. 
            Untuk kebutuhan mendesak lainnya, silakan kirim email dan kami akan merespon secepatnya.
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Berapa lama waktu respons?</h3>
          <p className="text-gray-600">
            Kami biasanya merespons email dalam waktu 24 jam kerja. Untuk pertanyaan urgent, 
            hubungi kami melalui telepon pada jam kerja.
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Bagaimana cara melaporkan masalah?</h3>
          <p className="text-gray-600">
            Anda dapat melaporkan masalah teknis melalui email eduzetsupport@gmail.com dengan detail lengkap 
            tentang masalah yang Anda hadapi.
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Apakah ada WhatsApp Business?</h3>
          <p className="text-gray-600">
            Kami sedang mengembangkan saluran WhatsApp Business. Untuk saat ini, silakan gunakan email 
            atau formulir kontak di atas.
          </p>
        </div>
      </div>
    </div>
  );

  const backLink = (
    <div className="py-8 border-t border-gray-200 mt-20">
      <Link 
        to={user ? "/dashboard" : "/"} 
        className="text-[#0050cb] hover:text-[#0050cb]/80 font-semibold"
      >
        {user ? "← Kembali ke Dashboard" : "← Kembali ke Beranda"}
      </Link>
    </div>
  );

  if (user) {
    return (
      <PageWrapper>
        <div className="max-w-6xl mx-auto py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-12">
            <h1 className="text-3xl font-bold text-[#191b24] mb-8">Hubungi Kami</h1>
            {mainContent}
            {faqContent}
            {backLink}
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0050cb] to-[#0050cb]/80 py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Hubungi Kami
          </h1>
          <p className="text-white/90 text-lg">
            Kami siap membantu Anda. Hubungi kami dengan pertanyaan atau masukan Anda.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-12">
          {mainContent}
          {faqContent}
          {backLink}
        </div>
      </div>
    </div>
  );
}
