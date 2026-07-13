import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { skdService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import StudentNavbar from '../../components/layout/StudentNavbar';
import Footer from '../../components/Footer';

const SUBJECT_COLOR = {
  TWK: { primary: '#e65100', light: '#fff3e0', badge: 'bg-orange-100 text-orange-700' },
  TIU: { primary: '#1565c0', light: '#e3f2fd', badge: 'bg-blue-100 text-blue-700' },
  TKP: { primary: '#2e7d32', light: '#e8f5e9', badge: 'bg-green-100 text-green-700' },
};

const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
};

export default function SKDLatihan() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [questionCount, setQuestionCount] = useState(20);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [subjectId]);

  async function fetchData() {
    setLoading(true);
    try {
      const [subRes, topicRes] = await Promise.all([
        skdService.getSubjects(),
        skdService.getTopics(subjectId),
      ]);
      const subjects = subRes.data?.data || [];
      const found = subjects.find((s) => s.id === subjectId);
      setSubject(found || null);
      setTopics(topicRes.data?.data || []);
    } catch {
      toast.error('Gagal memuat data');
      navigate('/skd');
    } finally {
      setLoading(false);
    }
  }

  async function handleStartLatihan(topicIdOrNull) {
    setStarting(true);
    try {
      const res = await skdService.startLatihan({
        subject_id: subjectId,
        topic_id: topicIdOrNull || null,
        question_count: questionCount,
      });
      const { questions, subject: subjectData } = res.data?.data || {};
      navigate(`/skd/latihan/${subjectId}/session`, {
        state: { questions, subject: subjectData, subjectId, topicId: topicIdOrNull, questionCount },
      });
    } catch (err) {
      const msg = err.response?.data?.error || 'Gagal memuat soal. Pastikan soal sudah tersedia.';
      toast.error(msg);
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#0050cb]/20 border-t-[#0050cb] rounded-full animate-spin" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#424656] mb-4">Subtes tidak ditemukan</p>
          <Link to="/skd" className="text-[#0050cb] font-bold hover:underline">Kembali ke SKD</Link>
        </div>
      </div>
    );
  }

  const color = SUBJECT_COLOR[subject.name] || SUBJECT_COLOR.TWK;
  const isTkp = subject.is_tkp;

  return (
    <div className="min-h-screen bg-[#faf8ff] flex flex-col">
      <StudentNavbar user={user} isAdmin={isAdmin} onLogout={() => { logout(); navigate('/'); }} />

      <main className="flex-grow max-w-[900px] mx-auto w-full px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[13px] text-[#727687] mb-6">
          <Link to="/skd" className="hover:text-[#0050cb] transition-colors">SKD CPNS</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-[#191b24] font-medium">Latihan {subject.name}</span>
        </div>

        {/* Subject Header */}
        <div className="rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-xl"
          style={{ background: `linear-gradient(135deg, ${color.primary} 0%, ${color.primary}cc 100%)` }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-[22px] font-black">
                {subject.name}
              </div>
              <div>
                <div className="text-[12px] font-bold uppercase tracking-wider opacity-70 mb-1">Latihan Soal SKD</div>
                <h1 className="text-[24px] sm:text-[28px] font-black leading-tight">{subject.full_name}</h1>
              </div>
            </div>
            <p className="text-white/80 text-[14px] leading-relaxed max-w-xl">{subject.description}</p>

            <div className="flex flex-wrap gap-4 mt-5">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                <div className="text-[11px] opacity-70 mb-0.5">Passing Grade</div>
                <div className="text-[18px] font-black">{subject.passing_grade}</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                <div className="text-[11px] opacity-70 mb-0.5">Penilaian</div>
                <div className="text-[18px] font-black">{isTkp ? '1–5 poin' : '+5 / 0'}</div>
              </div>
              {isTkp && (
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                  <div className="text-[11px] opacity-70 mb-0.5">Tidak ada pengurangan nilai</div>
                  <div className="text-[14px] font-bold">✓</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Packages */}
        {topics.length > 0 && (
          <div>
            <h2 className="text-[20px] font-bold text-[#191b24] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: color.primary }}>quiz</span>
              Pilih Paket Latihan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  onClick={() => handleStartLatihan(topic.id)}
                  className="bg-white rounded-2xl border border-[#c2c6d8]/40 p-5 cursor-pointer hover:shadow-lg hover:border-[#0050cb]/30 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: color.light, color: color.primary }}>
                      <span className="material-symbols-outlined text-[20px]">{topic.icon || 'quiz'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] font-bold text-[#191b24] group-hover:text-[#0050cb] transition-colors mb-1">
                        {topic.title}
                      </h3>
                      {topic.description && (
                        <p className="text-[12px] text-[#727687] line-clamp-2 mb-2">{topic.description}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        {topic.difficulty_level && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[topic.difficulty_level?.toLowerCase()] || 'bg-gray-100 text-gray-600'}`}>
                            {topic.difficulty_level}
                          </span>
                        )}
                        {topic.actual_question_count > 0 && (
                          <span className="text-[11px] text-[#727687]">{topic.actual_question_count} soal</span>
                        )}
                        {topic.is_popular && (
                          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Populer</span>
                        )}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[#c2c6d8] group-hover:text-[#0050cb] group-hover:translate-x-1 transition-all shrink-0">
                      arrow_forward
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {topics.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#c2c6d8]/40">
            <span className="material-symbols-outlined text-[48px] text-[#c2c6d8] block mb-3">quiz</span>
            <p className="text-[15px] font-semibold text-[#424656] mb-1">Belum ada paket latihan tersedia</p>
            <p className="text-[13px] text-[#727687]">Silakan hubungi administrator atau kembali lagi nanti.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
