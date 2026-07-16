import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import toast from 'react-hot-toast';

const TryoutDashboard = () => {
  const [selectedPackage, setSelectedPackage] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async (pkgId) => {
    setLoading(true);
    try {
      const res = await adminService.getTryoutDashboardStats({ package_id: pkgId });
      setData(res.data?.data || null);
    } catch (err) {
      toast.error('Gagal memuat statistik dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedPackage);
  }, [selectedPackage]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#0050cb] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[14px] text-slate-500 mt-4 font-semibold">Memuat statistik dashboard...</p>
      </div>
    );
  }

  const { summary = {}, packages = [], trend = [], subtests = [], distribution = [], leaderboard = [] } = data || {};

  // Custom SVG Area Chart for Trend
  const renderTrendChart = () => {
    if (trend.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
          Belum ada data partisipasi
        </div>
      );
    }

    const maxCount = Math.max(...trend.map(t => t.count), 5);
    const height = 200;
    const width = 500;
    const padding = 40;

    const points = trend.map((t, i) => {
      const x = padding + (i * (width - padding * 2)) / Math.max(1, trend.length - 1);
      const y = height - padding - (t.count * (height - padding * 2)) / maxCount;
      return { x, y, label: t.date, val: t.count };
    });

    const pathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const areaD = points.length > 0 
      ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : '';

    return (
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0050cb" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0050cb" stopOpacity="0.00" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00c1fd" />
              <stop offset="100%" stopColor="#0050cb" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
            const y = padding + p * (height - padding * 2);
            const val = Math.round(maxCount * (1 - p));
            return (
              <g key={idx}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
                <text x={padding - 10} y={y + 4} textAnchor="end" className="text-[10px] font-bold fill-slate-400">{val}</text>
              </g>
            );
          })}

          {/* Gradient Area */}
          {areaD && <path d={areaD} fill="url(#areaGrad)" />}

          {/* Line path */}
          {pathD && <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

          {/* Points */}
          {points.map((p, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="#0050cb" strokeWidth="2.5" className="transition-all hover:r-7" />
              {/* Tooltip / value */}
              <text x={p.x} y={p.y - 12} textAnchor="middle" className="text-[10px] font-extrabold fill-[#0050cb] opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1 py-0.5 rounded shadow-sm">{p.val}</text>
              {/* X Axis Label */}
              <text x={p.x} y={height - 12} textAnchor="middle" className="text-[10px] font-bold fill-slate-400">{p.label}</text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  // Custom SVG Bar Chart for Score Distribution
  const renderDistributionChart = () => {
    if (distribution.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
          Belum ada data distribusi skor
        </div>
      );
    }

    const maxCount = Math.max(...distribution.map(d => d.count), 5);
    const height = 200;
    const width = 500;
    const padding = 40;
    const barWidth = (width - padding * 2) / distribution.length - 12;

    return (
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00c1fd" />
              <stop offset="100%" stopColor="#0050cb" />
            </linearGradient>
          </defs>

          {/* Y Axis Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
            const y = padding + p * (height - padding * 2);
            const val = Math.round(maxCount * (1 - p));
            return (
              <g key={idx}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
                <text x={padding - 10} y={y + 4} textAnchor="end" className="text-[10px] font-bold fill-slate-400">{val}</text>
              </g>
            );
          })}

          {/* Bars */}
          {distribution.map((d, i) => {
            const x = padding + i * ((width - padding * 2) / distribution.length) + 6;
            const barHeight = (d.count * (height - padding * 2)) / maxCount;
            const y = height - padding - barHeight;

            return (
              <g key={i} className="group cursor-pointer">
                {/* Rounded Bar */}
                <rect 
                  x={x} 
                  y={y} 
                  width={barWidth} 
                  height={Math.max(barHeight, 2)} 
                  rx="6" 
                  fill="url(#barGrad)" 
                  className="transition-all hover:opacity-85"
                />
                {/* Value on Hover */}
                <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" className="text-[10px] font-extrabold fill-[#0050cb] opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.count}
                </text>
                {/* X Axis Label */}
                <text x={x + barWidth / 2} y={height - 12} textAnchor="middle" className="text-[10px] font-bold fill-slate-400">
                  {d.range}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header and Dropdown Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] sm:text-[36px] font-bold text-[#191b24] leading-tight">
            Analisis UTBK Tryout
          </h1>
          <p className="text-[14px] text-[#727687] mt-1">
            Ringkasan data, grafik tren keikutsertaan, rata-rata subtes, dan sebaran skor siswa.
          </p>
        </div>

        {/* Dropdown Filter */}
        <div className="w-full md:w-72 shrink-0">
          <div className="relative">
            <select
              value={selectedPackage}
              onChange={(e) => setSelectedPackage(e.target.value)}
              className="w-full appearance-none bg-white border border-[#c2c6d8]/40 text-[#191b24] font-bold rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0050cb] pr-10 shadow-sm cursor-pointer"
            >
              <option value="all">Semua Paket Tryout</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.title}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#727687]">
              <span className="material-symbols-outlined">expand_more</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {[
          { label: 'Total Siswa Terdaftar', value: summary.totalStudents, icon: 'group', color: '#0050cb', bg: '#dae1ff' },
          { label: 'Siswa Aktif Hari Ini', value: summary.activeStudentsToday, icon: 'bolt', color: '#ffb300', bg: '#fff2d0' },
          { label: 'Sesi Ujian Berjalan', value: summary.runningTryouts, icon: 'progress_activity', color: '#0088cc', bg: '#d0f0ff' },
          { label: 'Sesi Ujian Selesai', value: summary.completedTryouts, icon: 'check_circle', color: '#0b6b3a', bg: '#e8fff4' },
          { label: 'Rata-rata Skor UTBK', value: summary.averageScore ? `${summary.averageScore} / 1000` : '-', icon: 'analytics', color: '#7c3aed', bg: '#f3e8ff' },
        ].map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform" style={{ backgroundColor: card.bg, color: card.color }}>
                <span className="material-symbols-outlined text-[20px]">{card.icon}</span>
              </div>
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-400 mb-1 leading-normal uppercase tracking-wider">{card.label}</p>
              <h3 className="text-[22px] sm:text-[24px] font-extrabold text-[#191b24]">
                {loading ? '...' : typeof card.value === 'number' ? card.value.toLocaleString('id-ID') : card.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Span: Participation Trend and Score Distribution */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trend Chart Box */}
          <div className="bg-white p-6 sm:p-8 rounded-[24px] border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-[16px] sm:text-[18px] font-extrabold text-[#191b24]">Tren Partisipasi</h3>
                <p className="text-[12px] text-[#727687]">Banyaknya ujian dikerjakan dalam 7 hari terakhir.</p>
              </div>
            </div>
            {renderTrendChart()}
          </div>

          {/* Distribution Chart Box */}
          <div className="bg-white p-6 sm:p-8 rounded-[24px] border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-[16px] sm:text-[18px] font-extrabold text-[#191b24]">Distribusi Skor UTBK</h3>
                <p className="text-[12px] text-[#727687]">Sebaran perolehan nilai akhir siswa.</p>
              </div>
            </div>
            {renderDistributionChart()}
          </div>
        </div>

        {/* Right Span: Subtest Averages */}
        <div className="bg-white p-6 sm:p-8 rounded-[24px] border border-slate-200 shadow-sm h-full flex flex-col">
          <div className="mb-6">
            <h3 className="text-[16px] sm:text-[18px] font-extrabold text-[#191b24]">Rata-rata Skor per Subtes</h3>
            <p className="text-[12px] text-[#727687]">Performa subtes berdasarkan rata-rata nilai IRT.</p>
          </div>

          {subtests.length === 0 ? (
            <div className="flex-grow flex items-center justify-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs py-12">
              Belum ada data rata-rata subtes
            </div>
          ) : (
            <div className="space-y-6 flex-grow overflow-y-auto pr-1">
              {subtests
                .sort((a, b) => b.avg - a.avg)
                .map((sub, idx) => {
                  const percentage = Math.min(100, Math.round((sub.avg / 1000) * 100));
                  
                  // Color codes for subtests based on average score
                  const getSubtestColor = (score) => {
                    if (score >= 700) return 'bg-emerald-500';
                    if (score >= 550) return 'bg-[#0050cb]';
                    if (score >= 400) return 'bg-amber-500';
                    return 'bg-rose-500';
                  };

                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] font-extrabold text-[#191b24] truncate max-w-[190px]">{sub.name}</span>
                        <span className="text-[12px] font-extrabold text-[#0050cb] bg-[#e2f0fd] px-2 py-0.5 rounded-md">{sub.avg}</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${getSubtestColor(sub.avg)}`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="bg-white p-6 sm:p-8 rounded-[24px] border border-slate-200 shadow-sm">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-[16px] sm:text-[18px] font-extrabold text-[#191b24]">Papan Peringkat (Leaderboard)</h3>
            <p className="text-[12px] text-[#727687]">Daftar 10 besar peserta dengan nilai IRT tertinggi.</p>
          </div>
        </div>

        {selectedPackage === 'all' ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
              <span className="material-symbols-outlined text-[24px]">leaderboard</span>
            </div>
            <h4 className="text-[14px] font-bold text-[#191b24] mb-1">Pilih Paket Tryout</h4>
            <p className="text-[12px] text-[#727687] max-w-sm">
              Silakan pilih paket tryout tertentu pada dropdown di kanan atas untuk memuat daftar peringkat peserta.
            </p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
              <span className="material-symbols-outlined text-[24px]">inbox</span>
            </div>
            <h4 className="text-[14px] font-bold text-[#191b24] mb-1">Belum Ada Sesi Selesai</h4>
            <p className="text-[12px] text-[#727687] max-w-sm">
              Belum ada siswa yang menyelesaikan tryout untuk paket ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-4 text-center w-16">Peringkat</th>
                  <th className="py-4 px-4">Nama Siswa</th>
                  <th className="py-4 px-4">Email</th>
                  <th className="py-4 px-4">Skor Akhir</th>
                  <th className="py-4 px-4 text-right">Tanggal Selesai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leaderboard.map((student) => {
                  const getRankBadge = (rank) => {
                    if (rank === 1) return 'bg-amber-100 text-amber-700 border border-amber-200 font-extrabold';
                    if (rank === 2) return 'bg-slate-100 text-slate-700 border border-slate-200 font-extrabold';
                    if (rank === 3) return 'bg-orange-100 text-orange-700 border border-orange-200 font-extrabold';
                    return 'bg-slate-50 text-slate-600 font-medium';
                  };

                  return (
                    <tr key={student.user_id} className="hover:bg-slate-50/50 transition-colors text-[13px]">
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] ${getRankBadge(student.rank)}`}>
                          {student.rank}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold text-[#191b24]">{student.name}</td>
                      <td className="py-4 px-4 text-[#727687]">{student.email}</td>
                      <td className="py-4 px-4">
                        <span className="font-extrabold text-[#0050cb] bg-[#e2f0fd] px-2.5 py-1 rounded-lg">
                          {student.score}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-slate-400">
                        {new Date(student.submitted_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).replace(',', '')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TryoutDashboard;
