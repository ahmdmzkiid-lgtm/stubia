import React, { useState, useEffect } from 'react';
import { adminService, todoService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function ManageTodos() {
  const { user } = useAuth();
  const [todos, setTodos] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'all' | 'pending' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState(''); // '' = semua, '2026-01' format
  const [filterPerson, setFilterPerson] = useState(''); // '' = semua, user id

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [todosRes, adminsRes] = await Promise.all([
        todoService.list(),
        adminService.getUsers({ role: 'admin', limit: 100 }),
      ]);
      setTodos(todosRes.data?.data || []);
      setAdmins(adminsRes.data?.data?.users || []);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil data tugas atau admin.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setTitle('');
    setDescription('');
    setAssignedTo('');
    setDueDate('');
    setShowModal(true);
  };

  const handleOpenEditModal = (todo) => {
    setIsEditing(true);
    setEditingId(todo.id);
    setTitle(todo.title);
    setDescription(todo.description || '');
    setAssignedTo(todo.assigned_to || '');
    // Format date YYYY-MM-DD for input value
    const formattedDate = todo.due_date ? new Date(todo.due_date).toISOString().split('T')[0] : '';
    setDueDate(formattedDate);
    setShowModal(true);
  };

  const handleSaveTodo = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Judul tugas wajib diisi.');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      assigned_to: assignedTo || null,
      due_date: dueDate || null,
    };

    try {
      if (isEditing) {
        const res = await todoService.update(editingId, payload);
        if (res.data?.success) {
          toast.success('Tugas berhasil diperbarui.');
          setTodos(prev => prev.map(t => t.id === editingId ? { ...t, ...res.data.data } : t));
          // Refresh list to pull joined table fields (assigned_name, etc.)
          await todoService.list().then(res => setTodos(res.data?.data || []));
        }
      } else {
        const res = await todoService.create(payload);
        if (res.data?.success) {
          toast.success('Tugas baru berhasil dibuat.');
          setTodos(prev => [res.data.data, ...prev]);
          // Refresh list to pull joined table fields
          await todoService.list().then(res => setTodos(res.data?.data || []));
        }
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan tugas.');
    }
  };

  const handleDeleteTodo = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tugas ini?')) return;
    try {
      const res = await todoService.delete(id);
      if (res.data?.success) {
        toast.success('Tugas berhasil dihapus.');
        setTodos(prev => prev.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus tugas.');
    }
  };

  const handleToggleStatus = async (todo) => {
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
    try {
      const res = await todoService.update(todo.id, { status: newStatus });
      if (res.data?.success) {
        toast.success(newStatus === 'completed' ? 'Tugas diselesaikan!' : 'Tugas dibuka kembali.');
        setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, status: newStatus } : t));
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperbarui status tugas.');
    }
  };

  // Filter Logic
  const filteredTodos = todos.filter(todo => {
    const matchesTab = activeTab === 'all' 
      || (activeTab === 'pending' && todo.status === 'pending')
      || (activeTab === 'completed' && todo.status === 'completed');

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = todo.title?.toLowerCase().includes(searchLower)
      || todo.description?.toLowerCase().includes(searchLower)
      || todo.assigned_name?.toLowerCase().includes(searchLower)
      || todo.creator_name?.toLowerCase().includes(searchLower);

    // Month filter
    let matchesMonth = true;
    if (filterMonth) {
      const dateStr = todo.due_date || todo.created_at;
      if (dateStr) {
        const d = new Date(dateStr);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        matchesMonth = ym === filterMonth;
      } else {
        matchesMonth = false;
      }
    }

    // Person filter (matches assigned_to OR created_by)
    let matchesPerson = true;
    if (filterPerson) {
      matchesPerson = todo.assigned_to === filterPerson || todo.created_by === filterPerson;
    }

    return matchesTab && matchesSearch && matchesMonth && matchesPerson;
  });

  // Stats Counters
  const totalCount = todos.length;
  const pendingCount = todos.filter(t => t.status === 'pending').length;
  const completedCount = todos.filter(t => t.status === 'completed').length;
  
  const isOverdue = (todo) => {
    if (todo.status === 'completed' || !todo.due_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(todo.due_date);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };
  const overdueCount = todos.filter(isOverdue).length;

  const formatDate = (dateString) => {
    if (!dateString) return 'Tidak ada';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-8 min-h-screen pb-16">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[28px] lg:text-[32px] font-bold text-[#191b24] tracking-tight">Todo List Admin</h2>
          <p className="text-[14px] text-[#424656] mt-1 font-medium">Kelola, delegasikan, dan pantau tugas harian untuk tim admin.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0050cb] text-[#191b24] font-bold text-[14px] border-2 border-[#0050cb] hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.97] transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">add_task</span>
          Tambah Tugas
        </button>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tugas', value: totalCount, icon: 'assignment', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Sedang Berjalan', value: pendingCount, icon: 'hourglass_empty', color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Selesai', value: completedCount, icon: 'check_circle', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Terlambat', value: overdueCount, icon: 'warning', color: 'text-rose-600', bg: 'bg-rose-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-[#c2c6d8]/30 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[12px] font-bold text-[#727687] uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-[24px] lg:text-[28px] font-bold text-[#191b24] mt-1">{loading ? '...' : stat.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <span className="material-symbols-outlined text-[24px]">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-3xl border border-[#c2c6d8]/30 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar: Tabs & Search */}
        <div className="p-6 border-b border-[#c2c6d8]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-slate-100/70 rounded-xl self-start">
            {[
              { id: 'pending', label: 'Berjalan', icon: 'pending_actions' },
              { id: 'completed', label: 'Selesai', icon: 'task_alt' },
              { id: 'all', label: 'Semua', icon: 'checklist' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold tracking-wide transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-[#0050cb] shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Box */}
            <div className="flex items-center bg-[#f2f3ff] rounded-xl px-4 py-2.5 w-full sm:w-64 border border-[#c2c6d8]/30 focus-within:border-[#0050cb] transition-all">
              <span className="material-symbols-outlined text-[#727687] text-[20px]">search</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-[14px] w-full placeholder:text-[#727687] outline-none ml-2"
                placeholder="Cari tugas..."
                type="text"
              />
            </div>

            {/* Month Filter */}
            <div className="relative">
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="bg-white border border-[#c2c6d8]/50 rounded-xl px-4 py-2.5 text-[13px] text-[#424656] font-medium focus:outline-none focus:border-[#0050cb] transition-colors min-w-[160px]"
              />
              {filterMonth && (
                <button
                  type="button"
                  onClick={() => setFilterMonth('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-300 transition-colors"
                  title="Reset filter bulan"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>

            {/* Person Filter */}
            <select
              value={filterPerson}
              onChange={(e) => setFilterPerson(e.target.value)}
              className="bg-white border border-[#c2c6d8]/50 rounded-xl px-4 py-2.5 text-[13px] text-[#424656] font-medium focus:outline-none focus:border-[#0050cb] transition-colors min-w-[170px]"
            >
              <option value="">Semua Admin</option>
              {admins.map(admin => (
                <option key={admin.id} value={admin.id}>
                  {admin.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Task List */}
        <div className="divide-y divide-[#c2c6d8]/10">
          {loading ? (
            <div className="p-12 text-center text-[#727687]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0050cb] mx-auto mb-4"></div>
              <p className="text-[14px]">Memuat daftar tugas...</p>
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="p-16 text-center text-slate-400">
              <span className="material-symbols-outlined text-[64px] block mb-4 opacity-40">assignment_turned_in</span>
              <h4 className="text-[16px] font-bold text-slate-600 mb-1">Tidak ada tugas ditemukan</h4>
              <p className="text-[13px]">Cobalah mengganti filter pencarian atau buat tugas baru.</p>
            </div>
          ) : (
            filteredTodos.map((todo) => {
              const overdue = isOverdue(todo);
              return (
                <div 
                  key={todo.id} 
                  className={`p-6 flex items-start gap-4 hover:bg-slate-50/50 transition-colors ${
                    todo.status === 'completed' ? 'bg-slate-50/30' : ''
                  }`}
                >
                  {/* Status Toggle Box */}
                  <button
                    onClick={() => handleToggleStatus(todo)}
                    className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center border transition-all ${
                      todo.status === 'completed'
                        ? 'bg-[#00c1fd]/10 border-[#00c1fd] text-[#00c1fd]'
                        : 'border-[#c2c6d8] hover:border-[#0050cb] hover:bg-slate-50'
                    }`}
                  >
                    {todo.status === 'completed' && (
                      <span className="material-symbols-outlined text-[16px] font-extrabold">check</span>
                    )}
                  </button>

                  {/* Task details */}
                  <div className="flex-grow space-y-2 min-w-0">
                    <div className="flex items-start gap-3 justify-between flex-wrap sm:flex-nowrap">
                      <div>
                        <h4 
                          className={`text-[16px] font-bold text-[#191b24] tracking-tight leading-snug break-words ${
                            todo.status === 'completed' ? 'line-through text-slate-400 font-medium' : ''
                          }`}
                        >
                          {todo.title}
                        </h4>
                        {todo.description && (
                          <p className={`text-[13px] mt-1 text-[#424656] leading-relaxed whitespace-pre-wrap break-words ${
                            todo.status === 'completed' ? 'text-slate-400' : ''
                          }`}>
                            {todo.description}
                          </p>
                        )}
                      </div>

                      {/* Right-side quick badges */}
                      <div className="flex items-center gap-2 shrink-0 self-start">
                        {overdue && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-bold">
                            <span className="material-symbols-outlined text-[12px]">warning</span>
                            Terlambat
                          </span>
                        )}
                        {todo.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[11px] font-bold">
                            <span className="material-symbols-outlined text-[12px]">done_all</span>
                            Selesai
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata Footer */}
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-1.5 text-[11px] text-[#727687] font-medium">
                      {/* Creator */}
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">person_outline</span>
                        Dibuat oleh: <strong className="text-slate-700 font-bold">{todo.creator_name || 'System'}</strong>
                      </span>

                      {/* Assignee */}
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">assignment_ind</span>
                        Penerima: <strong className="text-[#0050cb] font-bold">{todo.assigned_name || 'Tidak ada'}</strong>
                      </span>

                      {/* Due Date */}
                      <span className={`inline-flex items-center gap-1 ${overdue ? 'text-rose-600 font-bold' : ''}`}>
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        Batas waktu: <strong className={overdue ? 'text-rose-600' : 'text-slate-700 font-bold'}>{formatDate(todo.due_date)}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Actions Dropdown / Icons */}
                  <div className="flex items-center gap-1 shrink-0 self-center">
                    <button
                      onClick={() => handleOpenEditModal(todo)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-[#727687] hover:text-[#0050cb] hover:bg-slate-100 transition-colors"
                      title="Edit Tugas"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-[#727687] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Hapus Tugas"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden border border-[#c2c6d8]/20 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-[#c2c6d8]/20 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
              <h3 className="text-[18px] font-bold text-[#191b24] tracking-tight">
                {isEditing ? 'Ubah Informasi Tugas' : 'Tambah Tugas Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#727687] hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveTodo} className="p-6 space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-[#424656] uppercase tracking-wider">Judul Tugas *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-55 border border-[#c2c6d8] rounded-xl px-4 py-3 text-[14px] placeholder:text-slate-400 focus:outline-none focus:border-[#0050cb] transition-colors"
                  placeholder="e.g. Update materi tryout Saintek"
                  type="text"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-[#424656] uppercase tracking-wider">Deskripsi Lengkap</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-55 border border-[#c2c6d8] rounded-xl px-4 py-3 text-[14px] placeholder:text-slate-400 focus:outline-none focus:border-[#0050cb] transition-colors h-28 resize-none"
                  placeholder="Jelaskan instruksi atau info tambahan tugas ini..."
                />
              </div>

              {/* Grid: Assignee & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Assignee */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#424656] uppercase tracking-wider">Ditugaskan Kepada</label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full bg-white border border-[#c2c6d8] rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-[#0050cb] transition-colors"
                  >
                    <option value="">-- Pilih Admin --</option>
                    {admins.map(admin => (
                      <option key={admin.id} value={admin.id}>
                        {admin.name} ({admin.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due Date */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#424656] uppercase tracking-wider">Batas Waktu (*Due Date*)</label>
                  <input
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-55 border border-[#c2c6d8] rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-[#0050cb] transition-colors"
                    type="date"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#c2c6d8]/20 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-[#c2c6d8] text-[#424656] hover:bg-slate-50 font-bold text-[14px] rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0050cb] text-[#191b24] font-bold text-[14px] rounded-xl border-2 border-[#0050cb] hover:shadow-lg hover:shadow-blue-500/10 transition-all active:scale-[0.98]"
                >
                  {isEditing ? 'Simpan Perubahan' : 'Simpan Tugas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
