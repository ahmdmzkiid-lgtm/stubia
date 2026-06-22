import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { subjectService } from '../services/api';
import toast from 'react-hot-toast';
import ChatWidget from '../components/ChatWidget';
import Footer from '../components/Footer';
import StudentNavbar from '../components/layout/StudentNavbar';

const SUBJECT_ORDER = [
  'penalaran umum',
  'pengetahuan dan pemahaman umum',
  'pemahaman bacaan dan tulisan',
  'pengetahuan kuantitatif',
  'literasi bahasa indonesia',
  'literasi bahasa inggris',
  'penalaran matematika',
];

const PLAN_RANK = { gratis: 0, premium_um: 0, premium: 1, sultan: 2, utbk_3m: 1, utbk_6m: 1, utbk_9m: 1, utbk_12m: 1, utbk_to_5x: 1, utbk_to_8x: 1, utbk_to_10x: 1 };

export default function LatihanSoal() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await subjectService.list();
      setSubjects(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  function formatTimeAgo(date) {
    if (!date) return 'Baru saja';
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} hari lalu`;
    if (hours > 0) return `${hours} jam lalu`;
    return 'Baru saja';
  }



  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#191b24]">
      <StudentNavbar user={user} isAdmin={isAdmin} onLogout={handleLogout} />

      <main className="pt-0">
        {/* Hero */}
        <section className="px-4 sm:px-6 lg:px-10 max-w-[1440px] mx-auto pt-10 sm:pt-16 pb-8">
          <h1 className="text-[32px] sm:text-[40px] lg:text-[56px] font-bold text-[#0050cb] mb-4 leading-tight tracking-tight">
            Eksplorasi Topik Belajar
          </h1>
          <p className="text-[16px] sm:text-[18px] text-[#424656] max-w-2xl leading-relaxed">
            Pilih kategori belajar untuk memulai latihan soal mandiri. Setiap kategori disusun untuk persiapan UTBK.
          </p>
        </section>

        {/* Recent Activity - akan muncul setelah user kerjakan sesuatu */}
        {recentActivity.length > 0 && (
          <section className="px-6 lg:px-10 max-w-[1440px] mx-auto pb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[20px] font-bold text-[#191b24]">Aktivitas Terakhir</h2>
              <Link to="/riwayat" className="text-[14px] font-medium text-[#0050cb] hover:underline">Lihat Semua</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentActivity.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl p-5 border border-[#c2c6d8]/30 hover:shadow-lg hover:border-[#0050cb]/30 cursor-pointer transition-all" onClick={() => navigate(`/latihan/${item.id}`)}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${item.bg || 'bg-[#dae1ff]'}`}>
                      <span className={`material-symbols-outlined text-[24px] ${item.color || 'text-[#0050cb]'}`}>
                        {item.icon || 'school'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#dae1ff] text-[#0050cb]">
                          {item.type || 'Latihan'}
                        </span>
                        <span className="text-[10px] text-[#727687]">
                          {formatTimeAgo(item.updatedAt)}
                        </span>
                      </div>
                      <h4 className="text-[14px] font-bold text-[#191b24] truncate">{item.name}</h4>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[12px] text-[#424656]">
                          {item.progress || 0}% progres
                        </span>
                        {item.score && (
                          <span className="text-[12px] font-bold text-[#0050cb]">
                            Skor: {item.score}
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-[#e1e2ee]/50 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div
                          className="h-full bg-[#0050cb] rounded-full transition-all"
                          style={{ width: `${item.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-[20px] font-bold ${(item.progress || 0) >= 100 ? 'text-[#006688]' : 'text-[#424656]'}`}>
                        {item.progress || 0}%
                      </span>
                      {(item.progress || 0) >= 100 && (
                        <span className="material-symbols-outlined text-[16px] text-[#006688] block">check_circle</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Topics Grid */}
        <section className="px-6 lg:px-10 max-w-[1440px] mx-auto pb-24">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-[#e1e2ee]/50 animate-pulse rounded-[24px]"></div>
              ))}
            </div>
          ) : (
            <SubjectGrid subjects={subjects} user={user} navigate={navigate} />
          )}
          {subjects.length === 0 && !loading && (
            <div className="text-center py-20 text-[#727687]">
              <span className="material-symbols-outlined text-[64px] block mb-4">sentiment_neutral</span>
              <p>Belum ada topik tersedia.</p>
            </div>
          )}
        </section>


      </main>

      <Footer />
      <ChatWidget />
    </div>
  );
}

function SubjectGrid({ subjects, user, navigate }) {
  const userPlan = user?.current_plan || 'gratis';
  const userRank = PLAN_RANK[userPlan] ?? 0;

  const sortedSubjects = useMemo(() => {
    const getSubjectOrder = (s) => {
      const name = (s.title || s.name || '').toLowerCase();
      const idx = SUBJECT_ORDER.findIndex(o => name.includes(o));
      return idx >= 0 ? idx : 999;
    };

    return [...subjects]
      .filter(s => s.is_active !== false)
      .sort((a, b) => {
        const planA = PLAN_RANK[a.required_plan || 'gratis'] ?? 0;
        const planB = PLAN_RANK[b.required_plan || 'gratis'] ?? 0;
        if (planA !== planB) return planA - planB;
        return getSubjectOrder(a) - getSubjectOrder(b);
      });
  }, [subjects]);

  const gratisSubjects = sortedSubjects.filter(s => (s.required_plan || 'gratis') === 'gratis');
  const premiumSubjects = sortedSubjects.filter(s => (s.required_plan || 'gratis') === 'premium');
  const sultanSubjects = sortedSubjects.filter(s => (s.required_plan || 'gratis') === 'sultan');

  const handleClick = (subject) => {
    const reqPlan = subject.required_plan || 'gratis';
    const reqRank = PLAN_RANK[reqPlan] ?? 0;
    if (subject.is_active === false) {
      toast.error('Latihan sedang non-aktif.');
      return;
    }
    if (reqRank > userRank) {
      toast.error(`Latihan ini khusus paket ${reqPlan === 'sultan' ? 'Sultan' : 'Premium'}. Upgrade paketmu di halaman Harga.`);
      return;
    }
    navigate(`/latihan/${subject.id}`);
  };

  const renderCard = (subject) => {
    const reqPlan = subject.required_plan || 'gratis';
    const reqRank = PLAN_RANK[reqPlan] ?? 0;
    const isLocked = reqRank > userRank;

    return (
      <div
        key={subject.id}
        onClick={() => handleClick(subject)}
        className={`relative bg-white border rounded-[16px] p-4 transition-all duration-200 flex flex-col justify-between ${
          isLocked
            ? 'border-[#c2c6d8]/50 opacity-75 cursor-not-allowed'
            : 'border-[#c2c6d8]/30 hover:shadow-lg cursor-pointer group'
        }`}
      >
        {isLocked && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
            <span className="material-symbols-outlined text-[12px] text-gray-500">lock</span>
            <span className="text-[9px] font-bold text-gray-500 uppercase">
              {reqPlan === 'sultan' ? 'Sultan' : 'Premium'}
            </span>
          </div>
        )}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`p-2 rounded-lg ${isLocked ? 'grayscale opacity-60' : ''}`}
              style={{
                backgroundColor: subject.bg_color || '#dae1ff',
                color: subject.icon_color || '#0050cb'
              }}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isLocked ? 'lock' : (subject.icon || 'calculate')}
              </span>
            </div>
          </div>
          <h3 className="text-[14px] font-bold text-[#191b24] mb-1 leading-tight">{subject.title || subject.name}</h3>
          <p className="text-[12px] text-[#424656] leading-relaxed">
            {subject.description || 'Tidak ada deskripsi'}
          </p>
        </div>
        <div className="mt-3 pt-3 border-t border-[#c2c6d8]/20 flex items-center justify-between">
          {isLocked ? (
            <>
              <span className="text-[12px] font-bold text-gray-400">Terkunci</span>
              <span className="material-symbols-outlined text-[16px] text-gray-400">lock</span>
            </>
          ) : (
            <>
              <span className="text-[12px] font-bold text-[#0050cb]">Mulai</span>
              <span className="material-symbols-outlined text-[16px] text-[#0050cb] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {gratisSubjects.length > 0 && (
        <div>
          <h2 className="text-[16px] font-bold text-[#191b24] mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0050cb]">lock_open</span>
            Gratis
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {gratisSubjects.map(renderCard)}
          </div>
        </div>
      )}
      {premiumSubjects.length > 0 && (
        <div>
          <h2 className="text-[16px] font-bold text-[#191b24] mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">diamond</span>
            Premium
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {premiumSubjects.map(renderCard)}
          </div>
        </div>
      )}
      {sultanSubjects.length > 0 && (
        <div>
          <h2 className="text-[16px] font-bold text-[#191b24] mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-yellow-600">star</span>
            Sultan
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {sultanSubjects.map(renderCard)}
          </div>
        </div>
      )}
    </div>
  );
}
