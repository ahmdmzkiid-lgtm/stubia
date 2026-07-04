import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { tryoutService, ujianMandiriService } from '../services/api';
import { PTN_DATA, getPtnLogo } from '../data/ptnData';

const LeaderboardPage = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardTab, setLeaderboardTab] = useState('general'); // 'general' | 'major'

  // Extract query params for UTBK Latihan topic_id
  const queryParams = new URLSearchParams(location.search);
  const topicId = queryParams.get('topicId') || '';

  const getPageInfo = () => {
    switch (type) {
      case 'utbk-tryout':
        return { title: 'Peringkat Nasional UTBK Tryout', typeText: 'tryout ini' };
      case 'utbk-latihan':
        return { title: 'Peringkat Nasional UTBK Latihan', typeText: 'latihan ini' };
      case 'um-tryout':
        return { title: 'Peringkat Nasional UM Tryout', typeText: 'tryout ini' };
      case 'um-latihan':
        return { title: 'Peringkat Nasional UM Latihan', typeText: 'latihan ini' };
      default:
        return { title: 'Peringkat Nasional', typeText: 'sesi ini' };
    }
  };

  const { title, typeText } = getPageInfo();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        let res;
        if (type === 'utbk-tryout') {
          res = await tryoutService.getLeaderboard(id, 100);
        } else if (type === 'utbk-latihan') {
          res = await tryoutService.getLatihanLeaderboard(id, topicId, 100);
        } else if (type === 'um-tryout') {
          res = await ujianMandiriService.getTryoutLeaderboard(id, 100);
        } else if (type === 'um-latihan') {
          res = await ujianMandiriService.getLatihanLeaderboard(id, 100);
        }

        if (res?.data?.success) {
          setLeaderboard(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard page:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchLeaderboard();
    }
  }, [type, id, topicId]);

  const medalColors = {
    1: 'bg-[#FFD700] text-[#7A6200]',
    2: 'bg-[#C0C0C0] text-[#555]',
    3: 'bg-[#CD7F32] text-white',
  };

  return (
    <div className="bg-[#faf8ff] text-[#191b24] min-h-screen flex flex-col font-sans">
      {/* TopAppBar */}
      <header className="sticky top-0 z-50 bg-[#faf8ff] shadow-sm h-16 sm:h-20 flex items-center">
        <div className="flex justify-between items-center w-full px-4 sm:px-6 lg:px-10 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-6 lg:gap-12">
            <Link to="/dashboard" className="flex items-center">
              <img src="/stubiabrandicon.png" alt="Stubia" className="h-8 sm:h-10 md:h-12" />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0050cb] text-white flex items-center justify-center font-bold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-[960px] w-full mx-auto px-4 md:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#0050cb] hover:text-[#003fb2] font-semibold text-[14px] transition-colors mb-6"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span>Kembali</span>
        </button>

        {/* Header Section */}
        <div className="bg-gradient-to-br from-[#0066ff] to-[#003da6] rounded-2xl p-6 md:p-8 text-white shadow-lg mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
          <div className="z-10 relative">
            <span className="bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-3 inline-block">
              Leaderboard Nasional
            </span>
            <h1 className="text-[24px] md:text-[32px] font-bold mb-2 leading-tight">
              {title}
            </h1>
            <p className="text-[14px] md:text-[16px] text-white/80">
              Menampilkan peringkat 100 besar dari seluruh peserta nasional.
            </p>
          </div>
        </div>

        {/* Tab Toggle if target PTN/major is set */}
        {type === 'utbk-tryout' && leaderboard?.targetPtn && leaderboard?.targetMajor && (
          <div className="flex gap-2 p-1 bg-[#ecedfa] rounded-xl mb-6 max-w-md">
            <button
              onClick={() => setLeaderboardTab('general')}
              className={`flex-1 py-2 text-center text-[13px] font-bold rounded-lg transition-all ${
                leaderboardTab === 'general'
                  ? 'bg-white text-[#0050cb] shadow-sm'
                  : 'text-[#727687] hover:text-[#191b24]'
              }`}
            >
              Peringkat Nasional
            </button>
            <button
              onClick={() => setLeaderboardTab('major')}
              className={`flex-1 py-2 text-center text-[13px] font-bold rounded-lg transition-all ${
                leaderboardTab === 'major'
                  ? 'bg-[#6d28d9] text-white shadow-sm'
                  : 'text-[#727687] hover:text-[#191b24]'
              }`}
            >
              Peringkat Jurusan
            </button>
          </div>
        )}

        {/* Target Major Info Box */}
        {leaderboardTab === 'major' && leaderboard?.targetPtn && leaderboard?.targetMajor && (() => {
          const ptnEntry = PTN_DATA.find(p => leaderboard.targetPtn?.includes(p.singkatan) || leaderboard.targetPtn?.includes(p.nama));
          const logoUrl = ptnEntry?.id ? getPtnLogo(ptnEntry.id) : null;
          const majorEntry = ptnEntry?.prodi?.find(m => m.nama === leaderboard.targetMajor);
          const targetScore = majorEntry?.skor;
          const userScore = leaderboard?.user_rank?.score || leaderboard?.userMajorRank?.score || 0;
          const passed = targetScore ? userScore >= targetScore : false;

          return (
            <div className="bg-white rounded-xl p-5 border border-[#c2c6d8]/20 mb-6 flex items-start gap-4 shadow-sm">
              {logoUrl ? (
                <img src={logoUrl} alt={ptnEntry?.singkatan || 'Logo'} className="w-14 h-14 object-contain rounded-lg bg-white p-1.5 border border-gray-200 flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-[#ede9fe] flex items-center justify-center text-[#6d28d9] flex-shrink-0">
                  <span className="material-symbols-outlined text-[26px]">school</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-[#727687] font-bold">Universitas Target</p>
                    <p className="text-[15px] font-bold text-[#191b24]">{leaderboard.targetPtn}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-[#727687] font-bold">Program Studi</p>
                    <p className="text-[15px] font-bold text-[#191b24]">{leaderboard.targetMajor}</p>
                  </div>
                </div>
                {targetScore && (
                  <div className={`mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold ${passed ? 'bg-[#e8f5e9] text-[#2e7d32]' : 'bg-[#fef3f2] text-[#ba1a1a]'}`}>
                    <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>{passed ? 'check_circle' : 'cancel'}</span>
                    {passed ? `Skormu melewati target (${targetScore})` : `Target skor: ${targetScore} (kurang ${targetScore - userScore})`}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* User Rank Card */}
        {leaderboardTab === 'general' && leaderboard?.user_rank && (
          <div className="bg-[#e8eeff] border border-[#0050cb]/20 rounded-xl p-5 mb-8 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#0050cb] text-white flex items-center justify-center font-bold text-[18px]">
                #{leaderboard.user_rank.rank}
              </div>
              <div>
                <p className="text-[12px] uppercase font-bold tracking-wider text-[#0050cb]">Peringkat Anda</p>
                <p className="text-[16px] font-bold text-[#191b24]">{user?.name} (Kamu)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[12px] uppercase font-bold tracking-wider text-[#727687]">Skor</p>
              <p className="text-[22px] font-bold text-[#0050cb]">{leaderboard.user_rank.score}</p>
            </div>
          </div>
        )}

        {leaderboardTab === 'major' && leaderboard?.userMajorRank && (
          <div className="bg-[#f3e8ff] border border-[#6d28d9]/20 rounded-xl p-5 mb-8 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#6d28d9] text-white flex items-center justify-center font-bold text-[18px]">
                #{leaderboard.userMajorRank.rank}
              </div>
              <div>
                <p className="text-[12px] uppercase font-bold tracking-wider text-[#6d28d9]">Peringkat Anda (Jurusan)</p>
                <p className="text-[16px] font-bold text-[#191b24]">{user?.name} (Kamu)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[12px] uppercase font-bold tracking-wider text-[#727687]">Skor</p>
              <p className="text-[22px] font-bold text-[#6d28d9]">{leaderboard.userMajorRank.score}</p>
            </div>
          </div>
        )}

        {/* Leaderboard Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#c2c6d8]/20 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#0050cb] border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-[#727687] text-[14px]">Memuat data leaderboard...</p>
            </div>
          ) : (leaderboardTab === 'general' ? leaderboard?.leaderboard : leaderboard?.majorLeaderboard)?.length > 0 ? (
            <div className="divide-y divide-[#c2c6d8]/10">
              {/* Table Header */}
              <div className="hidden sm:grid sm:grid-cols-12 gap-4 p-4 text-[12px] font-bold text-[#727687] uppercase tracking-wider bg-[#faf8ff]">
                <div className="col-span-2 text-center">Peringkat</div>
                <div className="col-span-7">Nama Lengkap</div>
                <div className="col-span-3 text-right">
                  {leaderboardTab === 'general' ? 'Skor Nasional' : 'Skor Jurusan'}
                </div>
              </div>

              {/* Rows */}
              {(leaderboardTab === 'general' ? leaderboard.leaderboard : leaderboard.majorLeaderboard).map((entry) => {
                const isCurrentUser = entry.user_id === user?.id;
                const activeMedalColor = leaderboardTab === 'general'
                  ? medalColors[entry.rank] || 'bg-[#ecedfa] text-[#424656]'
                  : {
                      1: 'bg-[#FFD700] text-[#7A6200]',
                      2: 'bg-[#C0C0C0] text-[#555]',
                      3: 'bg-[#CD7F32] text-white'
                    }[entry.rank] || 'bg-[#f3e8ff] text-[#6d28d9]';

                const textHighlightColor = isCurrentUser
                  ? (leaderboardTab === 'general' ? 'text-[#0050cb]' : 'text-[#6d28d9]')
                  : 'text-[#191b24]';

                return (
                  <div
                    key={entry.rank}
                    className={`grid grid-cols-12 gap-4 items-center p-4 transition-colors ${
                      isCurrentUser
                        ? (leaderboardTab === 'general' ? 'bg-[#e8eeff]' : 'bg-[#f3e8ff]')
                        : 'hover:bg-[#f8f9ff]'
                    }`}
                  >
                    {/* Rank */}
                    <div className="col-span-3 sm:col-span-2 flex justify-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 shadow-sm ${activeMedalColor}`}>
                        {entry.rank}
                      </div>
                    </div>

                    {/* Name */}
                    <div className="col-span-6 sm:col-span-7">
                      <p className={`text-[14px] truncate ${isCurrentUser ? 'font-bold' : 'font-medium'} ${textHighlightColor}`}>
                        {isCurrentUser ? `${entry.name} (Kamu)` : entry.name}
                      </p>
                      <p className="text-[10px] text-[#727687]">
                        Disubmit pada {new Date(entry.submitted_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    {/* Score */}
                    <div className="col-span-3 text-right">
                      <span className={`text-[16px] font-extrabold ${textHighlightColor}`}>
                        {entry.score}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-[64px] text-[#c2c6d8] mb-4">group_off</span>
              <h3 className="text-[18px] font-bold text-[#191b24] mb-1">
                {leaderboardTab === 'general' ? 'Belum Ada Peserta' : 'Belum Ada Peserta Jurusan'}
              </h3>
              <p className="text-[#727687] text-[14px]">
                {leaderboardTab === 'general'
                  ? 'Menjadi yang pertama untuk masuk ke dalam leaderboard ini!'
                  : 'Belum ada peserta lain dengan jurusan yang sama.'}
              </p>
            </div>
          )}

          {leaderboard && (leaderboardTab === 'general' ? leaderboard.total_participants : leaderboard.majorLeaderboard?.length || 0) > 0 && (
            <div className="p-4 bg-[#faf8ff] border-t border-[#c2c6d8]/10 text-center text-[12px] font-medium text-[#727687]">
              {leaderboardTab === 'general'
                ? `Total ${leaderboard.total_participants} peserta terdaftar pada ${typeText}.`
                : `Total ${leaderboard.majorLeaderboard?.length || 0} peserta terdaftar pada jurusan ini.`}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LeaderboardPage;
