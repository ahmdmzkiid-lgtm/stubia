import React, { useState, useEffect } from 'react';
import { adminService, todoService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function CMSTeam() {
  const { user } = useAuth();
  const [todos, setTodos] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [activeTab, setActiveTab] = useState('all'); // all, pending, review, completed
  const [search, setSearch] = useState('');
  const [filterPerson, setFilterPerson] = useState('');

  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    due_date: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [todosRes, adminsRes] = await Promise.all([
        todoService.list(),
        adminService.getUsers({ role: 'admin', limit: 100 })
      ]);
      setTodos(todosRes.data?.data || []);
      setAdmins(adminsRes.data?.data?.users || []);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat data pekerjaan tim');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (todo = null) => {
    if (todo) {
      setCurrentId(todo.id);
      setFormData({
        title: todo.title,
        description: todo.description || '',
        assigned_to: todo.assigned_to || '',
        due_date: todo.due_date ? new Date(todo.due_date).toISOString().split('T')[0] : ''
      });
    } else {
      setCurrentId(null);
      setFormData({
        title: '',
        description: '',
        assigned_to: '',
        due_date: ''
      });
    }
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Judul pekerjaan wajib diisi!');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      assigned_to: formData.assigned_to || null,
      due_date: formData.due_date || null
    };

    try {
      if (currentId) {
        await todoService.update(currentId, payload);
        toast.success('Pekerjaan berhasil diperbarui');
      } else {
        await todoService.create(payload);
        toast.success('Pekerjaan baru berhasil dibuat');
      }
      handleCloseModal();
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan pekerjaan');
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus pekerjaan "${title}"?`)) {
      try {
        await todoService.delete(id);
        toast.success('Pekerjaan berhasil dihapus');
        fetchData();
      } catch (err) {
        console.error(err);
        toast.error('Gagal menghapus pekerjaan');
      }
    }
  };

  // Status transition triggers
  const handleUpdateStatus = async (id, newStatus, message) => {
    try {
      await todoService.update(id, { status: newStatus });
      toast.success(message);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperbarui status pekerjaan');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Tidak ada batas waktu';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('id-ID', options);
  };

  const isOverdue = (todo) => {
    if (todo.status === 'completed' || !todo.due_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(todo.due_date);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  // Filter logic
  const filteredTodos = todos.filter(todo => {
    const matchesTab = activeTab === 'all' || todo.status === activeTab;
    const matchesSearch = todo.title.toLowerCase().includes(search.toLowerCase()) ||
                          (todo.description && todo.description.toLowerCase().includes(search.toLowerCase())) ||
                          (todo.assigned_name && todo.assigned_name.toLowerCase().includes(search.toLowerCase()));
    const matchesPerson = !filterPerson || todo.assigned_to === filterPerson;
    return matchesTab && matchesSearch && matchesPerson;
  });

  // Count states
  const totalCount = todos.length;
  const pendingCount = todos.filter(t => t.status === 'pending' || !t.status).length;
  const reviewCount = todos.filter(t => t.status === 'review').length;
  const completedCount = todos.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#191b24]">Manajemen Pekerjaan Tim</h1>
          <p className="text-[#424656] text-sm">Delegasikan pekerjaan, pantau progres review, dan ACC pekerjaan staf.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0050cb] hover:bg-[#0050cb]/95 text-white font-semibold text-sm shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">add_task</span>
          <span>Buat Pekerjaan</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Semua Pekerjaan', count: totalCount, color: 'text-blue-600', bg: 'bg-blue-50/50' },
          { label: 'Sedang Berjalan', count: pendingCount, color: 'text-amber-600', bg: 'bg-amber-50/50' },
          { label: 'Butuh Review', count: reviewCount, color: 'text-blue-700', bg: 'bg-indigo-50/50' },
          { label: 'Selesai / ACC', count: completedCount, color: 'text-green-600', bg: 'bg-green-50/50' },
        ].map((card, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-[#c2c6d8]/30 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider">{card.label}</p>
              <h3 className="text-2xl font-extrabold text-[#191b24] mt-1">{loading ? '...' : card.count}</h3>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bg} ${card.color}`}>
              <span className="material-symbols-outlined text-[20px]">
                {idx === 0 ? 'assignment' : idx === 1 ? 'hourglass_empty' : idx === 2 ? 'rate_review' : 'task_alt'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white rounded-3xl border border-[#c2c6d8]/40 p-4 flex flex-col md:flex-row gap-4 items-center">
        
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#727687] text-[20px]">search</span>
          <input
            type="text"
            placeholder="Cari berdasarkan judul pekerjaan atau nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[14px] text-[#191b24] placeholder-slate-400"
          />
        </div>

        {/* Filter Person */}
        <select
          value={filterPerson}
          onChange={(e) => setFilterPerson(e.target.value)}
          className="bg-white border border-[#c2c6d8] rounded-xl px-4 py-3 text-[13px] text-[#424656] font-semibold focus:outline-none focus:border-[#0050cb] w-full md:w-auto min-w-[180px]"
        >
          <option value="">Semua Penerima</option>
          {admins.map(adm => (
            <option key={adm.id} value={adm.id}>{adm.name}</option>
          ))}
        </select>

        {/* Tabs for Filter */}
        <div className="flex gap-1.5 p-1 bg-[#f2f3ff] border border-[#c2c6d8]/30 rounded-xl w-full md:w-auto">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'pending', label: 'Berjalan' },
            { id: 'review', label: 'Review' },
            { id: 'completed', label: 'ACC / Selesai' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 md:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-[#0050cb] border border-[#c2c6d8]/20 shadow-sm' 
                  : 'text-[#424656] hover:text-[#0050cb]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      {/* Task Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="w-8 h-8 border-3 border-[#0050cb] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredTodos.length === 0 ? (
        <div className="bg-white border border-[#c2c6d8]/40 rounded-3xl py-16 text-center">
          <span className="material-symbols-outlined text-[48px] text-[#727687] mb-3">checklist</span>
          <h3 className="text-[#191b24] font-bold text-lg">Tidak Ada Pekerjaan</h3>
          <p className="text-[#727687] text-sm max-w-sm mx-auto mt-1">Belum ada pekerjaan tim yang cocok dengan filter atau kata kunci Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTodos.map(todo => {
            const overdue = isOverdue(todo);
            const isAssignedToMe = todo.assigned_to === user?.id;

            return (
              <div 
                key={todo.id} 
                className={`bg-white border rounded-3xl p-6 flex flex-col justify-between hover:shadow-md transition-all relative group ${
                  todo.status === 'completed' 
                    ? 'border-green-200/60 bg-green-50/10' 
                    : todo.status === 'review'
                    ? 'border-indigo-200 bg-indigo-50/10'
                    : 'border-[#c2c6d8]/40'
                }`}
              >
                <div className="space-y-4">
                  {/* Title & Status Badges */}
                  <div className="flex justify-between items-start gap-4">
                    <h3 className={`font-bold text-[#191b24] text-[16px] leading-snug ${todo.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                      {todo.title}
                    </h3>
                    
                    {/* Status Badge */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                      todo.status === 'completed' 
                        ? 'bg-green-50 text-green-700 border-green-200/50' 
                        : todo.status === 'review'
                        ? 'bg-indigo-55 text-indigo-700 border-indigo-200/50'
                        : 'bg-amber-50 text-amber-700 border-amber-200/50'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {todo.status === 'completed' ? 'ACC / Selesai' : todo.status === 'review' ? 'Butuh Review' : 'Sedang Berjalan'}
                    </span>
                  </div>

                  {/* Description */}
                  {todo.description && (
                    <p className={`text-sm text-[#424656] leading-relaxed whitespace-pre-wrap ${todo.status === 'completed' ? 'text-gray-400' : ''}`}>
                      {todo.description}
                    </p>
                  )}

                  {/* Metadata Info */}
                  <div className="grid grid-cols-2 gap-y-2 text-[11.5px] text-[#727687] pt-2 border-t border-[#c2c6d8]/20">
                    <div>
                      <p className="font-semibold text-slate-400">Penerima Pekerjaan</p>
                      <p className="font-bold text-[#0050cb] mt-0.5">{todo.assigned_name || 'Belum ditugaskan'}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-400">Batas Waktu</p>
                      <p className={`font-bold mt-0.5 ${overdue ? 'text-rose-600' : 'text-[#191b24]'}`}>
                        {formatDate(todo.due_date)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-6 pt-4 border-t border-[#c2c6d8]/20 flex items-center justify-between flex-wrap gap-3">
                  
                  {/* Workflow Action Buttons */}
                  <div className="flex gap-2">
                    {/* Worker action: Submit for review */}
                    {(todo.status === 'pending' || !todo.status) && (
                      <button
                        onClick={() => handleUpdateStatus(todo.id, 'review', 'Pekerjaan berhasil diajukan untuk review!')}
                        className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors flex items-center gap-1"
                        title="Ajukan Review untuk Pekerjaan ini"
                      >
                        <span className="material-symbols-outlined text-[15px]">rate_review</span>
                        <span>Ajukan Review</span>
                      </button>
                    )}

                    {/* Admin action: Approve or Reject */}
                    {todo.status === 'review' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(todo.id, 'completed', 'Pekerjaan disetujui (ACC)!')}
                          className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                          title="ACC Pekerjaan ini"
                        >
                          <span className="material-symbols-outlined text-[15px]">check</span>
                          <span>Setujui (ACC)</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(todo.id, 'pending', 'Pekerjaan dikembalikan ke status berjalan.')}
                          className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors flex items-center gap-1"
                          title="Tolak & kembalikan ke proses"
                        >
                          <span className="material-symbols-outlined text-[15px]">replay</span>
                          <span>Kembalikan</span>
                        </button>
                      </>
                    )}

                    {/* Reopen action */}
                    {todo.status === 'completed' && (
                      <button
                        onClick={() => handleUpdateStatus(todo.id, 'pending', 'Pekerjaan dibuka kembali.')}
                        className="px-4 py-2 rounded-xl bg-[#f2f3ff] hover:bg-[#0050cb] hover:text-white text-[#0050cb] text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[15px]">refresh</span>
                        <span>Buka Kembali</span>
                      </button>
                    )}
                  </div>

                  {/* Standard CRUD Edit/Delete */}
                  <div className="flex gap-1.5 ml-auto">
                    <button
                      onClick={() => handleOpenModal(todo)}
                      className="w-8 h-8 rounded-lg bg-[#f2f3ff] hover:bg-[#0050cb] text-[#0050cb] hover:text-white flex items-center justify-center transition-colors"
                      title="Edit Pekerjaan"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(todo.id, todo.title)}
                      className="w-8 h-8 rounded-lg bg-red-50 hover:bg-[#ba1a1a] text-[#ba1a1a] hover:text-white flex items-center justify-center transition-colors"
                      title="Hapus Pekerjaan"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal}></div>
          
          <div className="bg-white border border-[#c2c6d8] rounded-3xl w-full max-w-lg overflow-hidden flex flex-col relative z-10 animate-zoomIn shadow-2xl">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#c2c6d8]/40 flex justify-between items-center bg-[#f2f3ff]/40">
              <h2 className="text-[17px] font-bold text-[#191b24]">
                {currentId ? 'Ubah Informasi Pekerjaan' : 'Buat Pekerjaan Baru'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#f2f3ff] text-[#424656] hover:text-[#0050cb] transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Title */}
              <div>
                <label className="block text-[13px] font-bold text-[#727687] mb-1.5">Judul Pekerjaan / Tugas *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Contoh: Perbarui soal simulasi UTBK Mandiri"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[14px] text-[#191b24]"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[13px] font-bold text-[#727687] mb-1.5">Deskripsi Lengkap Pekerjaan</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Jelaskan detail instruksi atau catatan pekerjaan..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[13.5px] text-[#191b24] resize-none"
                />
              </div>

              {/* Grid Assignee & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Assignee */}
                <div>
                  <label className="block text-[13px] font-bold text-[#727687] mb-1.5">Ditugaskan Kepada</label>
                  <select
                    name="assigned_to"
                    value={formData.assigned_to}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[14px] text-[#191b24]"
                  >
                    <option value="">-- Pilih Staf / Admin --</option>
                    {admins.map(adm => (
                      <option key={adm.id} value={adm.id}>{adm.name}</option>
                    ))}
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-[13px] font-bold text-[#727687] mb-1.5">Batas Waktu (*Due Date*)</label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[14px] text-[#191b24]"
                  />
                </div>

              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-[#c2c6d8]/20 flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl bg-white border border-[#c2c6d8] hover:bg-gray-50 text-[#424656] font-semibold text-sm transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#0050cb] hover:bg-[#0050cb]/95 text-white font-semibold text-sm shadow-sm transition-all"
                >
                  Simpan Pekerjaan
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
