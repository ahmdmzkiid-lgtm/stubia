import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

// ─── Avatar Initials ─────────────────────────────────────────────────────────
const Avatar = ({ name, size = 'md' }) => {
  const initials = name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
  const colors = ['bg-primary', 'bg-secondary', 'bg-[#a33200]', 'bg-[#006688]'];
  const color = colors[initials.charCodeAt(0) % colors.length];
  const sizeClass = size === 'lg' ? 'w-14 h-14 text-base' : 'w-12 h-12 text-sm';
  return (
    <div className={`${sizeClass} ${color} rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
};

// ─── Role Badge ───────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  if (role === 'admin') {
    return <span className="px-4 py-1.5 rounded-full bg-[#ffdbd0] text-[#832600] font-label-sm text-label-sm">Admin</span>;
  }
  if (role === 'question_writer') {
    return <span className="px-4 py-1.5 rounded-full bg-purple-100 text-purple-800 font-label-sm text-label-sm">Question Writer</span>;
  }
  if (role === 'quality_assurance') {
    return <span className="px-4 py-1.5 rounded-full bg-orange-100 text-orange-800 font-label-sm text-label-sm">QA</span>;
  }
  if (role === 'article_writer') {
    return <span className="px-4 py-1.5 rounded-full bg-teal-100 text-teal-800 font-label-sm text-label-sm">Article Writer</span>;
  }
  return <span className="px-4 py-1.5 rounded-full bg-[#c2e8ff] text-[#004d67] font-label-sm text-label-sm">Student</span>;
};

// ─── Plan Badge ───────────────────────────────────────────────────────────────
const PlanBadge = ({ plan }) => {
  if (plan === 'sultan') {
    return <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 font-label-sm text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> Sultan</span>;
  }
  if (plan === 'premium') {
    return <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-label-sm text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span> Premium</span>;
  }
  if (plan === 'premium_um') {
    return <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-800 font-label-sm text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>target</span> Premium UM</span>;
  }
  return <span className="px-3 py-1 rounded-full bg-[#dcfce7] text-[#166534] font-label-sm text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit"><span className="material-symbols-outlined text-[14px]">person</span> Gratis</span>;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, students: 0, admins: 0 });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'student' | 'admin'
  const [planFilter, setPlanFilter] = useState('all'); // 'all' | 'sultan' | 'premium' | 'gratis'
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [detailUser, setDetailUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editRole, setEditRole] = useState('student');
  const [updatingRole, setUpdatingRole] = useState(false);
  const [confirmRoleChange, setConfirmRoleChange] = useState(null);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (activeTab !== 'all') params.role = activeTab;
      if (planFilter !== 'all') params.plan = planFilter;
      if (search) params.search = search;
      const res = await adminService.getUsers(params);
      setUsers(res.data.data.users);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error('Gagal memuat daftar pengguna. Periksa koneksi server.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, planFilter, search]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  // Fetch stats once
  useEffect(() => {
    adminService.getStats().then(res => {
      setStats(res.data.data.users);
    }).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingRole(true);
    try {
      await adminService.updateUserRole(userId, newRole);
      toast.success('Role berhasil diubah');
      fetchUsers(pagination.page);
    } catch (err) {
      toast.error('Gagal mengubah role pengguna. Periksa koneksi server.');
      console.error(err);
    } finally {
      setUpdatingRole(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return 'Hari ini';
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 30) return `${diffDays} hari lalu`;
    return date.toLocaleDateString('id-ID');
  };

  return (
    <div className="animate-fade-in text-on-surface">

      {/* Breadcrumb + Title */}
      <div className="mb-6 sm:mb-10">
        <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm mb-2">
          <span>Dashboard</span>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-primary font-bold">User Management</span>
        </div>
        <h2 className="text-[28px] sm:text-[32px] font-bold text-on-surface leading-tight">System User Management</h2>
      </div>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8 sm:mb-16">
        {/* Sultan Students */}
        <div className="bg-surface p-5 sm:p-8 rounded-xl sm:rounded-2xl border border-outline-variant hover:border-yellow-400 transition-all shadow-sm flex flex-col justify-between group">
          <div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-yellow-100 rounded-xl flex items-center justify-center mb-4 sm:mb-6 text-yellow-700 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[28px] sm:text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
            <p className="font-label-md text-label-md text-on-surface-variant mb-1">Sultan Students</p>
            <p className="text-[36px] sm:text-[48px] font-bold leading-none text-on-surface">{stats.sultanStudents?.toLocaleString('id-ID') || '0'}</p>
          </div>
          <p className="font-label-sm text-label-sm text-yellow-700 mt-4 sm:mt-6 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">verified</span> Paket Sultan Aktif
          </p>
        </div>

        {/* Premium Students */}
        <div className="bg-surface p-5 sm:p-8 rounded-xl sm:rounded-2xl border border-outline-variant hover:border-blue-400 transition-all shadow-sm flex flex-col justify-between group">
          <div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 sm:mb-6 text-blue-700 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[28px] sm:text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
            </div>
            <p className="font-label-md text-label-md text-on-surface-variant mb-1">Premium Students</p>
            <p className="text-[36px] sm:text-[48px] font-bold leading-none text-on-surface">{stats.premiumStudents?.toLocaleString('id-ID') || '0'}</p>
          </div>
          <p className="font-label-sm text-label-sm text-blue-700 mt-4 sm:mt-6 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">verified</span> Paket Premium Aktif
          </p>
        </div>

        {/* Premium UM Students */}
        <div className="bg-surface p-5 sm:p-8 rounded-xl sm:rounded-2xl border border-outline-variant hover:border-teal-400 transition-all shadow-sm flex flex-col justify-between group">
          <div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-teal-100 rounded-xl flex items-center justify-center mb-4 sm:mb-6 text-teal-700 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[28px] sm:text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>target</span>
            </div>
            <p className="font-label-md text-label-md text-on-surface-variant mb-1">Premium UM Students</p>
            <p className="text-[36px] sm:text-[48px] font-bold leading-none text-on-surface">{stats.premiumUmStudents?.toLocaleString('id-ID') || '0'}</p>
          </div>
          <p className="font-label-sm text-label-sm text-teal-700 mt-4 sm:mt-6 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">verified</span> Paket Premium UM Aktif
          </p>
        </div>

        {/* Active Students */}
        <div className="bg-surface p-5 sm:p-8 rounded-xl sm:rounded-2xl border border-outline-variant hover:border-primary transition-all shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#00c1fd]/20 rounded-xl flex items-center justify-center mb-4 sm:mb-6 text-[#006688]">
              <span className="material-symbols-outlined text-[28px] sm:text-[32px]">person_add</span>
            </div>
            <p className="font-label-md text-label-md text-on-surface-variant mb-1">Active Students</p>
            <p className="text-[36px] sm:text-[48px] font-bold leading-none text-on-surface">{stats.students?.toLocaleString('id-ID') || '—'}</p>
          </div>
          <p className="font-label-sm text-label-sm text-secondary mt-4 sm:mt-6 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">arrow_upward</span> Platform UTBK
          </p>
        </div>

        {/* Staff Admins */}
        <div className="bg-surface p-5 sm:p-8 rounded-xl sm:rounded-2xl border border-outline-variant hover:border-primary transition-all shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#ffdbd0] rounded-xl flex items-center justify-center mb-4 sm:mb-6 text-[#832600]">
              <span className="material-symbols-outlined text-[28px] sm:text-[32px]">admin_panel_settings</span>
            </div>
            <p className="font-label-md text-label-md text-on-surface-variant mb-1">Staff Admins</p>
            <p className="text-[36px] sm:text-[48px] font-bold leading-none text-on-surface">{stats.admins || '—'}</p>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-4 sm:mt-6">Stable system access</p>
        </div>
      </section>

      {/* Table Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        {/* Tab Filter */}
        <div className="flex gap-2 p-1 bg-surface-container-low rounded-xl w-full xl:w-auto overflow-x-auto whitespace-nowrap">
          {[
            { key: 'all', label: 'All Users' },
            { key: 'student', label: 'Students' },
            { key: 'admin', label: 'Admins' },
            { key: 'question_writer', label: 'Question Writers' },
            { key: 'quality_assurance', label: 'QA Staff' },
            { key: 'article_writer', label: 'Article Writers' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 sm:px-8 py-2 rounded-lg font-label-md text-label-md transition-all flex-1 sm:flex-initial text-center ${
                activeTab === tab.key
                  ? 'bg-white shadow-sm text-primary font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <form onSubmit={handleSearch} className="relative flex-grow sm:flex-grow-0">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Cari pengguna..."
              className="pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-label-md outline-none focus:ring-2 focus:ring-primary w-full sm:w-48"
            />
          </form>

          {/* Filters Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-5 py-2 border rounded-xl font-label-md text-label-md transition-all ${
                planFilter !== 'all'
                  ? 'bg-primary/10 border-primary text-primary font-bold shadow-sm'
                  : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
              Filters
              {planFilter !== 'all' && (
                <span className="ml-1 px-2 py-0.5 text-[10px] bg-primary text-on-primary rounded-full font-bold leading-none">
                  1
                </span>
              )}
            </button>
            {showFilters && (
              <>
                {/* Backdrop to close dropdown on click outside */}
                <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)} />
                
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-outline-variant shadow-lg p-4 z-50 animate-fade-in text-left">
                  <div className="flex justify-between items-center mb-3">
                    <p className="font-bold text-label-md text-on-surface">Filter Pengguna</p>
                    {planFilter !== 'all' && (
                      <button
                        type="button"
                        onClick={() => {
                          setPlanFilter('all');
                          setShowFilters(false);
                        }}
                        className="text-primary text-[12px] font-bold hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Paket Subscription</label>
                      <select
                        value={planFilter}
                        onChange={e => {
                          setPlanFilter(e.target.value);
                          setShowFilters(false);
                        }}
                        className="w-full bg-surface-container-low border border-[#c2c6d8]/30 rounded-xl px-3 py-2 text-label-md text-on-surface outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer"
                      >
                        <option value="all">Semua Paket</option>
                        <option value="sultan">Sultan</option>
                        <option value="premium">Premium</option>
                        <option value="premium_um">Premium UM</option>
                        <option value="gratis">Gratis</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <button className="flex items-center justify-center gap-2 px-6 py-2 bg-primary text-on-primary rounded-xl font-label-md text-label-md hover:shadow-md active:scale-95 transition-all flex-grow sm:flex-grow-0">
            <span className="material-symbols-outlined text-[20px]">add</span>
            Invite User
          </button>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden mb-16">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                <th className="px-8 py-5">Name</th>
                <th className="px-8 py-5">Email Address</th>
                <th className="px-8 py-5">Role</th>
                <th className="px-8 py-5">Plan</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Joined</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-8 py-5" colSpan={7}>
                      <div className="h-12 bg-surface-container-low rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-outline text-5xl">person_search</span>
                      <p className="font-body-md text-on-surface-variant">Tidak ada pengguna ditemukan</p>
                    </div>
                  </td>
                </tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-surface-container-lowest transition-colors group">
                  {/* Name */}
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm flex-shrink-0">
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-label-md text-label-md text-on-surface font-bold">{u.name}</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">{u.role === 'admin' ? 'Administrator' : 'Student'}</p>
                      </div>
                    </div>
                  </td>
                  {/* Email */}
                  <td className="px-8 py-5 font-body-md text-body-md text-on-surface-variant">{u.email}</td>
                  {/* Role */}
                  <td className="px-8 py-5">
                    <RoleBadge role={u.role} />
                  </td>
                  {/* Plan */}
                  <td className="px-8 py-5">
                    <PlanBadge plan={u.current_plan || 'gratis'} />
                  </td>
                  {/* Status */}
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                      <span className="font-label-md text-label-md text-secondary">Active</span>
                    </div>
                  </td>
                  {/* Joined */}
                  <td className="px-8 py-5 font-label-sm text-label-sm text-on-surface-variant">
                    {formatDate(u.created_at)}
                  </td>
                  {/* Actions */}
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Toggle Role */}
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => {
                            const newRole = u.role === 'admin' ? 'student' : 'admin';
                            const roleName = newRole === 'admin' ? 'Admin' : 'Student';
                            setConfirmRoleChange({ userId: u.id, userName: u.name, newRole, roleName });
                          }}
                          className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-full transition-colors"
                          title={u.role === 'admin' ? 'Set as Student' : 'Set as Admin'}
                        >
                          <span className="material-symbols-outlined">manage_accounts</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditUser(u);
                          setEditRole(u.role || 'student');
                        }}
                        className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-full transition-colors"
                        title="Edit Role"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        onClick={() => setDetailUser(u)}
                        className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-full transition-colors"
                        title="Lihat Detail"
                      >
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                      <button
                        onClick={() => { navigator.clipboard.writeText(u.id); toast.success('ID User disalin'); }}
                        className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-full transition-colors"
                        title="Salin ID"
                      >
                        <span className="material-symbols-outlined">content_copy</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-8 py-5 bg-surface-container-low flex justify-between items-center border-t border-outline-variant">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Showing {((pagination.page - 1) * 10) + 1}–{Math.min(pagination.page * 10, pagination.total)} of {pagination.total?.toLocaleString('id-ID')} users
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchUsers(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => fetchUsers(p)}
                className={`w-10 h-10 flex items-center justify-center rounded-lg font-label-md text-label-md transition-colors ${
                  pagination.page === p
                    ? 'bg-primary text-on-primary'
                    : 'hover:bg-surface-container-high'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => fetchUsers(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Registrations */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Recent Registrations</h3>
            <p className="text-on-surface-variant text-body-md">Pengguna terbaru yang bergabung ke platform</p>
          </div>
          <button className="text-primary font-bold font-label-md text-label-md hover:underline flex items-center gap-1">
            View all registrations
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {users.slice(0, 3).map(u => (
            <div key={u.id} className="bg-surface rounded-2xl p-6 border border-outline-variant shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className="flex items-start justify-between mb-5">
                <Avatar name={u.name} size="lg" />
                <span
                  className="material-symbols-outlined text-secondary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
              </div>
              <p className="font-label-md text-label-md text-on-surface font-bold">{u.name}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-6 capitalize">{u.role}</p>
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
                <p className="font-label-sm text-label-sm text-secondary font-bold">Verified</p>
                <button className="text-primary font-label-sm text-label-sm hover:underline">View Profile</button>
              </div>
            </div>
          ))}

          {/* Add New User Card */}
          <div className="bg-surface-container-low rounded-2xl p-6 border border-dashed border-outline flex flex-col items-center justify-center group cursor-pointer hover:bg-surface-container transition-all text-center">
            <div className="w-14 h-14 bg-surface-container-high rounded-full flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
              <span className="material-symbols-outlined text-[32px] text-outline group-hover:text-on-primary transition-colors">person_add</span>
            </div>
            <p className="font-label-md text-label-md text-on-surface font-bold mb-1">Add New User</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Invite manually or via Excel</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-outline-variant/30">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="font-label-md text-label-md text-primary font-bold">Stubia Pro</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">© 2026 UTBK Learning Systems. All rights reserved.</p>
          </div>
          <div className="flex gap-8">
            <span className="text-on-surface-variant hover:text-primary font-label-sm text-label-sm cursor-pointer transition-colors">Help Center</span>
            <span className="text-on-surface-variant hover:text-primary font-label-sm text-label-sm cursor-pointer transition-colors">Privacy Policy</span>
            <span className="text-on-surface-variant hover:text-primary font-label-sm text-label-sm cursor-pointer transition-colors">System Status</span>
          </div>
        </div>
      </footer>

      {/* Detail Modal */}
      {detailUser && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4" onClick={() => setDetailUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-[20px] font-bold text-[#191b24]">Detail Pengguna</h3>
                <p className="text-[13px] text-[#727687]">Lihat informasi ringkas user.</p>
              </div>
              <button onClick={() => setDetailUser(null)} className="w-10 h-10 rounded-full hover:bg-[#ecedfa] flex items-center justify-center text-[#424656]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                  {detailUser.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-[#191b24]">{detailUser.name}</p>
                  <p className="text-[13px] text-[#727687]">{detailUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px] text-[#424656]">
                <div className="p-3 bg-[#f7f8fb] rounded-xl">
                  <p className="text-[#727687] text-[12px]">Role</p>
                  <p className="font-semibold capitalize">{detailUser.role}</p>
                </div>
                <div className="p-3 bg-[#f7f8fb] rounded-xl">
                  <p className="text-[#727687] text-[12px]">Plan</p>
                  <p className="font-semibold capitalize">{detailUser.current_plan || 'gratis'}</p>
                </div>
                <div className="p-3 bg-[#f7f8fb] rounded-xl">
                  <p className="text-[#727687] text-[12px]">Bergabung</p>
                  <p className="font-semibold">{detailUser.created_at ? new Date(detailUser.created_at).toLocaleString('id-ID') : '—'}</p>
                </div>
                <div className="p-3 bg-[#f7f8fb] rounded-xl">
                  <p className="text-[#727687] text-[12px]">Status</p>
                  <p className="font-semibold text-secondary">Aktif</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDetailUser(null)}
                className="px-5 py-2 rounded-xl border border-[#c2c6d8] text-[#424656] hover:bg-[#ecedfa] font-semibold text-[13px]"
              >
                Tutup
              </button>
              {detailUser.id !== currentUser?.id && (
                <button
                  onClick={() => {
                    setEditUser(detailUser);
                    setEditRole(detailUser.role || 'student');
                    setDetailUser(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#0050cb] text-white hover:bg-[#003da6] font-semibold text-[13px]"
                >
                  Edit Role
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editUser && (
        <div className="fixed inset-0 z-[130] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4" onClick={() => !updatingRole && setEditUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-[20px] font-bold text-[#191b24]">Ubah Role</h3>
                <p className="text-[13px] text-[#727687]">Pilih role baru untuk pengguna ini.</p>
              </div>
              <button onClick={() => !updatingRole && setEditUser(null)} className="w-10 h-10 rounded-full hover:bg-[#ecedfa] flex items-center justify-center text-[#424656]" disabled={updatingRole}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-[#f7f8fb] rounded-xl text-[14px] text-[#191b24]">
                <p className="font-semibold">{editUser.name}</p>
                <p className="text-[12px] text-[#727687]">{editUser.email}</p>
              </div>
              <div className="flex flex-col gap-2 text-[13px] text-[#424656]">
                <label className="font-semibold text-[#191b24]">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="border border-[#c2c6d8] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0050cb]"
                  disabled={updatingRole}
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                  <option value="question_writer">Question Writer</option>
                  <option value="quality_assurance">Quality Assurance</option>
                  <option value="article_writer">Article Writer</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => !updatingRole && setEditUser(null)}
                className="px-5 py-2 rounded-xl border border-[#c2c6d8] text-[#424656] hover:bg-[#ecedfa] font-semibold text-[13px]"
                disabled={updatingRole}
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  if (editUser.id === currentUser?.id) {
                    toast.error('Tidak bisa mengubah role akun sendiri.');
                    return;
                  }
                  await handleRoleChange(editUser.id, editRole);
                  setEditUser(null);
                }}
                className="px-5 py-2 rounded-xl bg-[#0050cb] text-white hover:bg-[#003da6] font-semibold text-[13px] disabled:opacity-60"
                disabled={updatingRole}
              >
                {updatingRole ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Role Change Confirmation Modal */}
      {confirmRoleChange && (
        <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4" onClick={() => setConfirmRoleChange(null)}>
          <div className="bg-white rounded-[24px] shadow-2xl max-w-sm w-full p-6 text-center animate-[fadeInScale_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[28px] text-amber-500">warning</span>
            </div>
            
            <h3 className="text-lg font-bold text-[#191b24] mb-2">Konfirmasi Ubah Role</h3>
            <p className="text-[13px] text-[#727687] leading-relaxed mb-6">
              Apakah Anda yakin ingin mengubah role pengguna <strong>{confirmRoleChange.userName}</strong> menjadi <strong>{confirmRoleChange.roleName}</strong>?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRoleChange(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-[#424656] hover:bg-slate-50 font-bold text-[13px] transition-all"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  const { userId, newRole } = confirmRoleChange;
                  setConfirmRoleChange(null);
                  await handleRoleChange(userId, newRole);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[13px] transition-all shadow-lg shadow-amber-500/10"
              >
                Ya, Ubah
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
