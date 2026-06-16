import React from 'react';
import { useNavigate } from 'react-router-dom';

const NationalLeaderboardCard = ({
  leaderboard,
  loading,
  currentUserId,
  title = "Peringkat Nasional",
  typeText = "tryout ini", // e.g., "tryout ini", "latihan ini"
  type,
  id,
  topicId
}) => {
  const navigate = useNavigate();
  const medalColors = {
    1: 'bg-[#FFD700] text-[#7A6200]',
    2: 'bg-[#C0C0C0] text-[#555]',
    3: 'bg-[#CD7F32] text-white',
  };

  const handleViewFullLeaderboard = () => {
    if (!type || !id) return;
    let url = `/leaderboard/${type}/${id}`;
    if (topicId) {
      url += `?topicId=${topicId}`;
    }
    navigate(url);
  };

  return (
    <div 
      className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-[#c2c6d8]/20 max-h-[calc(100vh-140px)] overflow-y-auto"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#c2c6d8 transparent'
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-[14px] font-medium text-[#424656] uppercase tracking-widest">{title}</p>
        <span className="material-symbols-outlined text-[#0050cb] text-[20px]">leaderboard</span>
      </div>

      {/* User's own rank */}
      {leaderboard?.user_rank && (
        <div className="bg-gradient-to-r from-[#0050cb] to-[#003da6] text-white rounded-xl p-3.5 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider opacity-80 mb-0.5">Peringkatmu</p>
              <p className="text-[24px] font-bold leading-tight">#{leaderboard.user_rank.rank}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider opacity-80 mb-0.5">Dari</p>
              <p className="text-[18px] font-bold">{leaderboard.user_rank.total_participants} peserta</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#0050cb] border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-[13px] text-[#727687]">Memuat peringkat...</span>
        </div>
      ) : leaderboard?.leaderboard?.length > 0 ? (
        <div className="space-y-2">
          {leaderboard.leaderboard.slice(0, 3).map((entry) => {
            const isCurrentUser = entry.user_id === currentUserId;
            return (
              <div
                key={entry.rank}
                className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                  isCurrentUser
                    ? 'bg-[#e8eeff] border border-[#0050cb]/30'
                    : 'hover:bg-[#f8f9ff]'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${
                  medalColors[entry.rank] || 'bg-[#ecedfa] text-[#424656]'
                }`}>
                  {entry.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-medium truncate ${isCurrentUser ? 'text-[#0050cb] font-bold' : 'text-[#191b24]'}`}>
                    {isCurrentUser ? `${entry.name} (Kamu)` : entry.name}
                  </p>
                </div>
                <span className="text-[14px] font-bold text-[#191b24] shrink-0">{entry.score}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-[40px] text-[#c2c6d8] mb-2">group_off</span>
          <p className="text-[13px] text-[#727687]">Belum ada data peringkat</p>
        </div>
      )}

      {leaderboard && leaderboard.total_participants > 0 && (
        <p className="text-center text-[11px] text-[#727687] mt-3">
          Total {leaderboard.total_participants} peserta pada {typeText}
        </p>
      )}

      {type && id && (
        <button
          onClick={handleViewFullLeaderboard}
          className="w-full mt-4 py-2.5 bg-gradient-to-r from-[#0050cb] to-[#003da6] text-white hover:shadow-md rounded-xl font-bold text-[13px] transition-all flex items-center justify-center gap-1.5"
        >
          <span>Lihat Leaderboard</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      )}
    </div>
  );
};

export default NationalLeaderboardCard;
