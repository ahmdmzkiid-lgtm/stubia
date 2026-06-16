import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { battleService } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const BattleLeaderboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { subjectId } = useParams();
  const { user } = useAuth();
  const { subjectName = 'Leaderboard' } = location.state || {};

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (subjectId) {
      fetchLeaderboard();
      // Auto-refresh every 5 seconds
      pollRef.current = setInterval(fetchLeaderboard, 5000);
      return () => clearInterval(pollRef.current);
    }
  }, [subjectId]);

  const fetchLeaderboard = async () => {
    try {
      const res = await battleService.getLeaderboard(subjectId);
      if (res.data.success) {
        setLeaderboard(res.data.data || []);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankDisplay = (rank) => {
    if (rank === 1) return { display: '1', bg: 'bg-yellow-50', border: 'border-yellow-200', textClass: 'text-[#7a6200]' };
    if (rank === 2) return { display: '2', bg: 'bg-gray-50', border: 'border-gray-200', textClass: 'text-[#555]' };
    if (rank === 3) return { display: '3', bg: 'bg-orange-50', border: 'border-orange-200', textClass: 'text-[#cd7f32]' };
    return { display: `${rank}`, bg: '', border: 'border-transparent', textClass: 'text-[#727687]' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-[#0050cb] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-5 text-[#424656] font-medium text-[15px]">Memuat leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8ff]">
      {/* Header */}
      <header className="bg-white border-b border-[#e0e2f0] shadow-sm">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/battle')} className="flex items-center gap-2 text-[#727687] hover:text-[#0050cb] text-[14px] font-medium transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Kembali
          </button>
          <h1 className="text-[18px] font-bold text-[#191b24] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0050cb]">leaderboard</span>
            {subjectName}
          </h1>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-[11px] text-[#c2c6d8] hidden sm:block">
                Auto-refresh
              </span>
            )}
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Live"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[900px] mx-auto px-4 sm:px-6 py-8">
        {/* Scoring Info */}
        <div className="bg-[#e8eeff] border border-[#0050cb]/15 rounded-2xl px-6 py-4 mb-6 flex flex-wrap items-center justify-center gap-6 text-[13px] font-semibold">
          <div className="flex items-center gap-2 text-green-700">
            <span className="material-symbols-outlined text-[16px]">emoji_events</span>
            Menang: +20 poin
          </div>
          <div className="flex items-center gap-2 text-[#0050cb]">
            <span className="material-symbols-outlined text-[16px]">handshake</span>
            Seri: +10 poin
          </div>
          <div className="flex items-center gap-2 text-[#727687]">
            <span className="material-symbols-outlined text-[16px]">sentiment_dissatisfied</span>
            Kalah: 0 poin
          </div>
        </div>

        <div className="bg-white rounded-[24px] shadow-sm border border-[#c2c6d8]/30 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-6 py-4 bg-[#f8f9ff] border-b border-[#e0e2f0] text-[11px] font-bold text-[#727687] uppercase tracking-wider">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Player</div>
            <div className="col-span-2 text-center">Pertandingan</div>
            <div className="col-span-2 text-center">Win Rate</div>
            <div className="col-span-1 text-center">W</div>
            <div className="col-span-1 text-center">L</div>
            <div className="col-span-1 text-right">Poin</div>
          </div>

          {/* Table Rows */}
          {leaderboard.length === 0 ? (
            <div className="p-16 text-center text-[#727687]">
              <span className="material-symbols-outlined text-[56px] text-[#c2c6d8] block mb-3">leaderboard</span>
              <p className="text-[15px] font-medium">Belum ada data leaderboard</p>
              <p className="text-[13px] text-[#c2c6d8] mt-1">Mainkan battle untuk masuk leaderboard!</p>
            </div>
          ) : (
            leaderboard.map((entry, index) => {
              const rank = index + 1;
              const isMe = entry.user_id === user?.id;
              const { display, bg, textClass } = getRankDisplay(rank);

              return (
                <div
                  key={entry.user_id}
                  className={`grid grid-cols-12 gap-2 px-6 py-4 border-b border-[#e0e2f0]/60 items-center transition-colors ${
                    isMe ? 'bg-[#e8eeff]/60' : `${bg} hover:bg-[#f8f9ff]`
                  }`}
                >
                  <div className="col-span-1">
                    <span className={`text-[16px] font-bold ${textClass}`}>
                      {display}
                    </span>
                  </div>
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 ${
                      isMe ? 'bg-[#0050cb] text-white' : 'bg-[#dae1ff] text-[#0050cb]'
                    }`}>
                      {(entry.full_name || entry.username || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-[#191b24] truncate">
                        {entry.full_name || entry.username}
                      </p>
                      {isMe && (
                        <span className="text-[10px] bg-[#0050cb] text-white px-2 py-0.5 rounded-full font-bold">Kamu</span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-[14px] font-medium text-[#424656]">{entry.total_matches}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={`text-[14px] font-bold ${
                      parseFloat(entry.win_rate) >= 60 ? 'text-green-600' :
                      parseFloat(entry.win_rate) >= 40 ? 'text-[#0050cb]' :
                      'text-[#727687]'
                    }`}>{entry.win_rate}%</span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-[14px] font-bold text-green-600">{entry.wins}</span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-[14px] font-medium text-[#ba1a1a]">{entry.losses}</span>
                  </div>
                  <div className="col-span-1 text-right">
                    <span className="text-[16px] font-extrabold text-[#0050cb]">{entry.total_points}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Back to Lobby */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/battle')}
            className="px-8 py-3.5 bg-[#0050cb] text-white rounded-xl font-bold text-[15px] hover:bg-[#003da6] transition-colors"
          >
            Main Lagi
          </button>
        </div>
      </main>
    </div>
  );
};

export default BattleLeaderboard;
