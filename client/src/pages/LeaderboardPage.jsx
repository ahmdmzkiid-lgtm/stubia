import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { tryoutService, ujianMandiriService } from '../services/api';

const LeaderboardPage = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);

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
              <img src="/eduzet-brand-light.svg" alt="Eduzet" className="h-8 sm:h-10 md:h-12" />
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

        {/* User Rank Card */}
        {leaderboard?.user_rank && (
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

        {/* Leaderboard Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#c2c6d8]/20 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#0050cb] border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-[#727687] text-[14px]">Memuat data leaderboard...</p>
            </div>
          ) : leaderboard?.leaderboard?.length > 0 ? (
            <div className="divide-y divide-[#c2c6d8]/10">
              {/* Table Header */}
              <div className="hidden sm:grid sm:grid-cols-12 gap-4 p-4 text-[12px] font-bold text-[#727687] uppercase tracking-wider bg-[#faf8ff]">
                <div className="col-span-2 text-center">Peringkat</div>
                <div className="col-span-7">Nama Lengkap</div>
                <div className="col-span-3 text-right">Skor Nasional</div>
              </div>

              {/* Rows */}
              {leaderboard.leaderboard.map((entry) => {
                const isCurrentUser = entry.user_id === user?.id;
                return (
                  <div
                    key={entry.rank}
                    className={`grid grid-cols-12 gap-4 items-center p-4 transition-colors ${
                      isCurrentUser ? 'bg-[#e8eeff]' : 'hover:bg-[#f8f9ff]'
                    }`}
                  >
                    {/* Rank */}
                    <div className="col-span-3 sm:col-span-2 flex justify-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 shadow-sm ${
                        medalColors[entry.rank] || 'bg-[#ecedfa] text-[#424656]'
                      }`}>
                        {entry.rank}
                      </div>
                    </div>

                    {/* Name */}
                    <div className="col-span-6 sm:col-span-7">
                      <p className={`text-[14px] truncate ${isCurrentUser ? 'text-[#0050cb] font-bold' : 'text-[#191b24] font-medium'}`}>
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
                      <span className={`text-[16px] font-extrabold ${isCurrentUser ? 'text-[#0050cb]' : 'text-[#191b24]'}`}>
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
              <h3 className="text-[18px] font-bold text-[#191b24] mb-1">Belum Ada Peserta</h3>
              <p className="text-[#727687] text-[14px]">Menjadi yang pertama untuk masuk ke dalam leaderboard ini!</p>
            </div>
          )}

          {leaderboard?.total_participants > 0 && (
            <div className="p-4 bg-[#faf8ff] border-t border-[#c2c6d8]/10 text-center text-[12px] font-medium text-[#727687]">
              Total {leaderboard.total_participants} peserta terdaftar pada {typeText}.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LeaderboardPage;
