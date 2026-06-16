import React, { useEffect, useMemo, useRef, useState } from 'react';
import { adminService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const actionBadgeClasses = (action) => {
  if (action === 'user_registered') return 'bg-[#e9edff] text-[#1b3fbf] border border-[#cad4ff]';
  if (action === 'latihan_submit') return 'bg-[#e7f1ff] text-[#0050cb] border border-[#c7dcff]';
  if (action === 'tryout_submit' || action === 'um_tryout_submit') return 'bg-[#e8fff4] text-[#0b6b3a] border border-[#bdf5d9]';
  return 'bg-slate-100 text-slate-700 border border-slate-200';
};

const avatarColors = ['bg-[#1e40af]', 'bg-[#0f766e]', 'bg-[#7c3aed]', 'bg-[#2563eb]', 'bg-[#f97316]', 'bg-[#16a34a]'];

const formatDateTime = (ts) => {
  if (!ts) return '-';
  const d = new Date(ts);
  const date = d.toLocaleDateString('id-ID');
  const time = d.toLocaleTimeString('id-ID', { hour12: false }).replace(/:/g, '.');
  return `${date} ${time}`;
};

const AdminActivity = () => {
  useAuth();
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ action: 'all', q: '' });
  const [status, setStatus] = useState('connecting'); // connecting | connected | reconnecting | offline
  const [loading, setLoading] = useState(true);
  const esRef = useRef(null);
  const reconnectTimer = useRef(null);

  const loadInitial = async (pageToLoad = page) => {
    setLoading(true);
    try {
      const res = await adminService.getActivity({ limit: 20, page: pageToLoad });
      const data = res.data?.data || {};
      setEvents(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
      setPage(data.page || pageToLoad);
    } catch (err) {
      toast.error('Gagal memuat aktivitas');
    } finally {
      setLoading(false);
    }
  };

  const startStream = () => {
    try {
      setStatus('connecting');
      const token = localStorage.getItem('token')?.replace('Bearer ', '') || localStorage.getItem('token');
      const es = adminService.streamActivity(token);
      esRef.current = es;

      es.onopen = () => setStatus('connected');

      es.addEventListener('snapshot', (e) => {
        try {
          const data = JSON.parse(e.data || '[]');
          setEvents(data);
        } catch {}
      });

      es.addEventListener('error', () => {
        setStatus('reconnecting');
        es.close();
        scheduleReconnect();
      });
    } catch (err) {
      setStatus('offline');
      scheduleReconnect();
    }
  };

  const scheduleReconnect = () => {
    if (reconnectTimer.current) return;
    reconnectTimer.current = setTimeout(() => {
      reconnectTimer.current = null;
      startStream();
    }, 4000);
  };

  useEffect(() => {
    loadInitial(1);
    startStream();
    return () => {
      if (esRef.current) esRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, []);

  const actionOptions = useMemo(() => {
    const unique = Array.from(new Set(events.map((e) => e.action).filter(Boolean)));
    return ['all', ...unique];
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (filters.action !== 'all' && ev.action !== filters.action) return false;
      if (filters.q) {
        const q = filters.q.toLowerCase();
        const text = `${ev.name || ''} ${ev.email || ''} ${ev.action || ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [events, filters]);

  const renderAvatar = (name = '') => {
    const initial = name.trim()[0]?.toUpperCase() || 'U';
    const color = avatarColors[initial.charCodeAt(0) % avatarColors.length];
    return <div className={`${color} w-10 h-10 rounded-full text-white flex items-center justify-center font-semibold text-sm`}>{initial}</div>;
  };

  const showingStart = filteredEvents.length > 0 ? (page - 1) * 20 + 1 : 0;
  const showingEnd = (page - 1) * 20 + filteredEvents.length;

  return (
    <div className="min-h-screen bg-[#f2f5ff] text-[#0d1c2e] p-4 md:p-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex text-sm text-slate-500 mb-4">
        <ol className="inline-flex items-center space-x-1 md:space-x-2">
          <li className="inline-flex items-center">
            <span className="inline-flex items-center hover:text-[#00288e] transition-colors">Admin</span>
          </li>
          <li>
            <div className="flex items-center">
              <span className="material-symbols-outlined text-[16px] mx-1">chevron_right</span>
              <span className="text-[#00288e] font-semibold">Activity</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-[28px] md:text-[32px] font-bold text-[#0d1c2e]">User Activity Realtime</h1>
          <span className="bg-[#e8fff4] text-[#0b6b3a] px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#0b6b3a] animate-pulse" />
            {status === 'connected' ? 'Live' : status === 'reconnecting' ? 'Reconnecting...' : status === 'connecting' ? 'Connecting...' : 'Offline'}
          </span>
        </div>
        <p className="text-sm text-[#5b6178]">Pantau login, submit, dan registrasi terbaru secara langsung.</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#d9deef] rounded-xl p-4 md:p-5 mb-6 shadow-sm flex flex-col md:flex-row gap-4 md:items-end">
        <div className="w-full md:w-56">
          <label className="block text-xs font-semibold text-[#5b6178] mb-1">Action</label>
          <div className="relative">
            <select
              value={filters.action}
              onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
              className="w-full appearance-none bg-white border border-[#d9deef] text-[#0d1c2e] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00288e]"
            >
              {actionOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'all' ? 'Semua' : opt}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#5b6178]">
              <span className="material-symbols-outlined">expand_more</span>
            </div>
          </div>
        </div>
        <div className="w-full md:flex-1">
          <label className="block text-xs font-semibold text-[#5b6178] mb-1">Cari</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#5b6178]">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              className="bg-white border border-[#d9deef] text-[#0d1c2e] rounded-lg focus:ring-2 focus:ring-[#00288e] focus:border-[#00288e] block w-full pl-10 px-4 py-2.5 text-sm placeholder-[#8c92a5]"
              placeholder="Nama / email"
              type="text"
            />
          </div>
        </div>
        <button
          onClick={loadInitial}
          className="w-full md:w-auto bg-[#0d1c2e] hover:bg-[#0a1625] text-white text-sm font-semibold py-2.5 px-6 rounded-lg flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">refresh</span>
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#d9deef] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#f5f7ff] border-b border-[#d9deef]">
              <tr className="text-xs font-semibold text-[#5b6178] uppercase tracking-wide">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6e9f4] text-sm text-[#0d1c2e]">
              {loading && (
                <tr>
                  <td className="px-6 py-6 text-sm text-[#5b6178]" colSpan={5}>Memuat aktivitas...</td>
                </tr>
              )}
              {!loading && filteredEvents.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-sm text-[#5b6178]" colSpan={5}>Belum ada aktivitas.</td>
                </tr>
              )}
              {!loading && filteredEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-[#f7f9ff] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {renderAvatar(ev.name)}
                      <div>
                        <div className="font-semibold text-[#0d1c2e] capitalize">{ev.name || 'User'}</div>
                        <div className="text-xs text-[#5b6178]">ID: {ev.user_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[#5b6178]">{ev.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${actionBadgeClasses(ev.action)}`}>
                      {ev.action || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[#5b6178]">{formatDateTime(ev.timestamp)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-[#5b6178] font-mono text-xs">
                    {ev.meta?.latihan_id ? `Latihan: ${String(ev.meta.latihan_id).slice(0, 12)}...` : ev.meta?.package_id ? `Package: ${String(ev.meta.package_id).slice(0, 12)}...` : ev.meta?.score !== undefined ? `Score: ${ev.meta.score}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white px-6 py-4 border-t border-[#d9deef] flex items-center justify-between text-xs text-[#5b6178]">
          <div>
            Showing <span className="font-semibold text-[#0d1c2e]">{showingStart}</span> to <span className="font-semibold text-[#0d1c2e]">{showingEnd}</span> of <span className="font-semibold text-[#0d1c2e]">{total}</span> entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => page > 1 && loadInitial(page - 1)}
              className="px-3 py-1.5 border border-[#d9deef] rounded-md text-[#5b6178] bg-white font-semibold text-xs disabled:opacity-50"
              disabled={page <= 1}
            >
              Previous
            </button>
            <span className="text-[#0d1c2e] font-semibold">{page} / {totalPages}</span>
            <button
              onClick={() => page < totalPages && loadInitial(page + 1)}
              className="px-3 py-1.5 border border-[#d9deef] rounded-md text-[#0d1c2e] bg-white font-semibold text-xs disabled:opacity-50"
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminActivity;
