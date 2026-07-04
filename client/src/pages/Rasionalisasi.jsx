import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { activityService } from '../services/api';
import StudentNavbar from '../components/layout/StudentNavbar';
import Footer from '../components/Footer';
import ChatWidget from '../components/ChatWidget';
import { PTN_DATA, getPtnLogo, SUBTES_SHORT } from '../data/ptnData';
import { getKeketatan } from '../data/peminatData';

// Canonical UTBK subtests ordered exactly as in tryout system
const UTBK_SUBTESTS = [
  { dbName: "Penalaran Umum", label: "Penalaran Umum", shortCode: "PU" },
  { dbName: "Pengetahuan dan Pemahaman Umum", label: "Pengetahuan & Pemahaman Umum", shortCode: "PPU" },
  { dbName: "Pemahaman Bacaan dan Tulisan", label: "Pemahaman Bacaan & Tulisan", shortCode: "PBM" },
  { dbName: "Pengetahuan Kuantitatif", label: "Pengetahuan Kuantitatif", shortCode: "PK" },
  { dbName: "Literasi Bahasa Indonesia", label: "Literasi Bahasa Indonesia", shortCode: "LBI" },
  { dbName: "Literasi Bahasa Inggris", label: "Literasi Bahasa Inggris", shortCode: "LBE" },
  { dbName: "Penalaran Matematika", label: "Penalaran Matematika", shortCode: "PM" }
];

const Rasionalisasi = () => {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  // Subtest scores (0-1000)
  const [scores, setScores] = useState({
    PU: '',
    PPU: '',
    PBM: '',
    PK: '',
    LBI: '',
    LBE: '',
    PM: ''
  });

  const [scoreSource, setScoreSource] = useState('manual'); // 'manual' | 'tryout'
  const [tryoutDate, setTryoutDate] = useState(null);
  const [loadingScores, setLoadingScores] = useState(false);

  // Prodi Choices State
  const [choices, setChoices] = useState([
    { ptnId: '', ptnSearch: '', showPtnDropdown: false, prodiName: '', prodiSearch: '', showProdiDropdown: false },
    { ptnId: '', ptnSearch: '', showPtnDropdown: false, prodiName: '', prodiSearch: '', showProdiDropdown: false }
  ]);

  const [activeChoicesCount, setActiveChoicesCount] = useState(2); // Can be 2, 3, or 4
  const [analyzed, setAnalyzed] = useState(false);
  const [results, setResults] = useState([]);
  const [alternatives, setAlternatives] = useState([]);

  const resultsRef = useRef(null);

  // Check premium access
  const isPremiumUser = user?.current_plan === 'premium' || user?.current_plan === 'sultan';

  // Handle auto-fetching scores
  const fetchBestTryoutScores = async () => {
    setLoadingScores(true);
    try {
      const res = await activityService.getMyBestScores();
      if (res.data?.success && res.data.data) {
        const data = res.data.data;
        const apiScores = data.scores || {};
        
        // Map database subject names to our short codes
        setScores({
          PU: apiScores["Penalaran Umum"] || '',
          PPU: apiScores["Pengetahuan dan Pemahaman Umum"] || '',
          PBM: apiScores["Pemahaman Bacaan dan Tulisan"] || '',
          PK: apiScores["Pengetahuan Kuantitatif"] || '',
          LBI: apiScores["Literasi Bahasa Indonesia"] || '',
          LBE: apiScores["Literasi Bahasa Inggris"] || '',
          PM: apiScores["Penalaran Matematika"] || ''
        });
        setTryoutDate(data.date);
        setScoreSource('tryout');
      } else {
        alert("Belum ada data tryout UTBK yang disubmit. Silakan isi skor secara manual.");
        setScoreSource('manual');
      }
    } catch (err) {
      console.error("Gagal memuat skor tryout:", err);
      alert("Terjadi kesalahan saat memuat skor tryout.");
    } finally {
      setLoadingScores(false);
    }
  };

  const handleScoreSourceChange = (source) => {
    if (source === 'tryout') {
      fetchBestTryoutScores();
    } else {
      setScoreSource('manual');
      setTryoutDate(null);
      setScores({
        PU: '',
        PPU: '',
        PBM: '',
        PK: '',
        LBI: '',
        LBE: '',
        PM: ''
      });
    }
  };

  const handleScoreChange = (code, val) => {
    if (val === '') {
      setScores(prev => ({ ...prev, [code]: '' }));
      return;
    }
    const num = parseInt(val, 10);
    if (isNaN(num)) return;
    const clamped = Math.max(0, Math.min(1000, num));
    setScores(prev => ({ ...prev, [code]: clamped }));
  };

  // Autocomplete lists
  const getFilteredPtnList = (searchStr) => {
    if (!searchStr.trim()) return PTN_DATA;
    const q = searchStr.toLowerCase();
    return PTN_DATA.filter(p => p.nama.toLowerCase().includes(q) || p.singkatan.toLowerCase().includes(q));
  };

  const getPtnObj = (ptnId) => {
    return PTN_DATA.find(p => p.id === ptnId);
  };

  const getFilteredProdiList = (ptnId, searchStr, enforceVokasi = false) => {
    const ptn = getPtnObj(ptnId);
    if (!ptn) return [];
    let list = ptn.prodi || [];
    
    if (enforceVokasi) {
      list = list.filter(p => p.jenjang === 'D3' || p.jenjang === 'D4');
    }
    
    if (!searchStr.trim()) return list;
    const q = searchStr.toLowerCase();
    return list.filter(p => p.nama.toLowerCase().includes(q));
  };

  // Add more choice slots (max 4)
  const addChoiceSlot = () => {
    if (activeChoicesCount < 4) {
      setChoices(prev => [
        ...prev,
        { ptnId: '', ptnSearch: '', showPtnDropdown: false, prodiName: '', prodiSearch: '', showProdiDropdown: false }
      ]);
      setActiveChoicesCount(prev => prev + 1);
    }
  };

  // Remove choices slots
  const removeChoiceSlot = (index) => {
    if (activeChoicesCount > 2) {
      setChoices(prev => prev.filter((_, i) => i !== index));
      setActiveChoicesCount(prev => prev - 1);
    }
  };

  // Update choice fields
  const updateChoice = (index, field, value) => {
    setChoices(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      
      // If changing PTN, reset the program study selection fields
      if (field === 'ptnId') {
        const ptn = PTN_DATA.find(p => p.id === value);
        copy[index].ptnSearch = ptn ? `${ptn.nama} (${ptn.singkatan})` : '';
        copy[index].prodiName = '';
        copy[index].prodiSearch = '';
        copy[index].showPtnDropdown = false;
      }
      if (field === 'prodiName') {
        copy[index].prodiSearch = value;
        copy[index].showProdiDropdown = false;
      }
      return copy;
    });
  };

  // Calculate Average score of inputs
  const averageScore = useMemo(() => {
    const vals = Object.values(scores).map(v => parseInt(v, 10)).filter(v => !isNaN(v));
    if (vals.length === 0) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [scores]);

  // Main Rationalization Engine
  const runAnalysis = () => {
    // 1. Validation
    const emptyScoreCodes = Object.keys(scores).filter(k => scores[k] === '');
    if (emptyScoreCodes.length > 0) {
      alert("Mohon lengkapi semua 7 nilai subtes terlebih dahulu.");
      return;
    }

    const requiredIncomplete = choices.slice(0, 2).some(c => !c.ptnId || !c.prodiName);
    if (requiredIncomplete) {
      alert("Mohon tentukan pilihan Program Studi 1 & 2 terlebih dahulu.");
      return;
    }

    // Parse scores
    const numScores = {};
    Object.keys(scores).forEach(k => {
      numScores[k] = parseInt(scores[k], 10) || 0;
    });

    const parsedResults = [];
    const riskyChoices = [];

    // Analyze each choice
    choices.forEach((choice, index) => {
      if (!choice.ptnId || !choice.prodiName) return;

      const ptn = getPtnObj(choice.ptnId);
      const prodi = ptn.prodi.find(p => p.nama === choice.prodiName);
      if (!prodi) return;

      // Calculate weighted score
      // Priority weights: 22%, 20%, 18%
      // Remainder (4 subtests): 10% each
      const prioritySubtests = prodi.subtes || [];
      const weights = {};
      
      // Determine priority indices
      prioritySubtests.forEach((subName, i) => {
        // Map priority subtest name from ptnData to db subtest name
        const subCode = UTBK_SUBTESTS.find(s => 
          s.label.toLowerCase().replace(/&/g, 'dan') === subName.toLowerCase().replace(/&/g, 'dan')
        )?.shortCode;

        if (subCode) {
          weights[subCode] = i === 0 ? 0.22 : i === 1 ? 0.20 : 0.18;
        }
      });

      // Assign remaining weights
      let allocatedWeight = Object.values(weights).reduce((a, b) => a + b, 0);
      const remainingWeight = (1.0 - allocatedWeight) / (7 - Object.keys(weights).length);

      UTBK_SUBTESTS.forEach(s => {
        if (!weights[s.shortCode]) {
          weights[s.shortCode] = remainingWeight;
        }
      });

      // Weighted calculation
      let weightedScore = 0;
      UTBK_SUBTESTS.forEach(s => {
        weightedScore += numScores[s.shortCode] * weights[s.shortCode];
      });
      weightedScore = Math.round(weightedScore);

      // Base opportunity calculation
      const passingGrade = prodi.skor || 600;
      const diff = weightedScore - passingGrade;
      
      let basePeluang = 50;
      if (diff >= 80) basePeluang = 97;
      else if (diff >= 50) basePeluang = 92;
      else if (diff >= 30) basePeluang = 83;
      else if (diff >= 15) basePeluang = 72;
      else if (diff >= 0) basePeluang = 58;
      else if (diff >= -10) basePeluang = 45;
      else if (diff >= -25) basePeluang = 32;
      else if (diff >= -40) basePeluang = 20;
      else if (diff >= -60) basePeluang = 10;
      else basePeluang = 5;

      // Competition adjustments
      const comp = getKeketatan(ptn.id, prodi.nama, prodi.daya_tampung);
      let adjustment = 1.0;
      if (comp.ratio < 3.0) adjustment = 0.85;
      else if (comp.ratio < 5.0) adjustment = 0.90;
      else if (comp.ratio < 10.0) adjustment = 0.95;
      else if (comp.ratio < 20.0) adjustment = 1.00;
      else adjustment = 1.05;

      const finalPeluang = Math.max(5, Math.min(95, Math.round(basePeluang * adjustment)));

      let status = 'Rentan';
      let statusColor = 'text-red-600 bg-red-50 border-red-200';
      if (finalPeluang >= 70) {
        status = 'Aman';
        statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
      } else if (finalPeluang >= 40) {
        status = 'Bersaing';
        statusColor = 'text-amber-600 bg-amber-50 border-amber-200';
      }

      parsedResults.push({
        choiceIndex: index + 1,
        ptn,
        prodi,
        weightedScore,
        passingGrade,
        diff,
        keketatan: comp,
        peluang: finalPeluang,
        status,
        statusColor,
        prioritySubtests
      });

      if (status === 'Rentan' || status === 'Bersaing') {
        riskyChoices.push({ ptn, prodi, weightedScore, index: index + 1 });
      }
    });

    // 4. Find Alternative Recommendations
    const allAlternatives = [];
    riskyChoices.forEach(risky => {
      const candidates = [];
      const keyWords = risky.prodi.nama.toLowerCase().split(' ');
      
      // Search program studies with matching name keywords across other universities
      PTN_DATA.forEach(ptn => {
        if (ptn.id === risky.ptn.id) return; // Recommend different PTNs
        
        ptn.prodi.forEach(p => {
          // Exclude exact matches in same university
          const isFuzzyMatch = keyWords.some(word => word.length > 3 && p.nama.toLowerCase().includes(word));
          if (!isFuzzyMatch) return;

          // Compute opportunity for this candidate
          const pg = p.skor || 600;
          const scoreDiff = risky.weightedScore - pg;

          let basePel = 50;
          if (scoreDiff >= 50) basePel = 92;
          else if (scoreDiff >= 30) basePel = 83;
          else if (scoreDiff >= 15) basePel = 72;
          else if (scoreDiff >= 0) basePel = 58;
          else if (scoreDiff >= -10) basePel = 45;
          else return; // Skip if too low probability

          const comp = getKeketatan(ptn.id, p.nama, p.daya_tampung);
          let adjustment = 1.0;
          if (comp.ratio < 3.0) adjustment = 0.85;
          else if (comp.ratio < 10.0) adjustment = 0.95;
          else adjustment = 1.05;

          const finalP = Math.max(5, Math.min(95, Math.round(basePel * adjustment)));
          if (finalP >= 55) {
            candidates.push({
              ptn,
              prodi: p,
              peluang: finalP,
              passingGrade: pg,
              keketatan: comp,
              forChoiceIndex: risky.index,
              originalProdi: risky.prodi.nama
            });
          }
        });
      });

      // Sort candidate alternatives by opportunity chance
      candidates.sort((a, b) => b.peluang - a.peluang);
      allAlternatives.push(...candidates.slice(0, 3));
    });

    setResults(parsedResults);
    setAlternatives(allAlternatives);
    setAnalyzed(true);

    // Smooth scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0050cb]"></div>
      </div>
    );
  }

  // Premium lock overlay
  if (!isPremiumUser) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-[#faf8ff] via-[#f3f4fc] to-[#edf0fa] text-[#191b24] font-sans flex flex-col justify-between">
        <StudentNavbar user={user} isAdmin={user?.role === 'admin'} onLogout={() => { logout(); navigate('/'); }} />
        
        <main className="max-w-md mx-auto px-6 py-20 flex-grow flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mb-8 border border-amber-500/20">
            <span className="material-symbols-outlined text-amber-600 text-4xl">lock</span>
          </div>
          
          <h1 className="text-3xl font-extrabold text-[#111c2d] mb-4">Fitur Khusus Premium</h1>
          <p className="text-sm font-medium text-[#727687] leading-relaxed mb-8">
            Halaman Rasionalisasi UTBK didukung oleh perhitungan algoritma bobot subtest SNBT, daya tampung kuota, rasio keketatan persaingan, dan rekomendasi alternatif. Fitur ini hanya dapat diakses oleh pemegang paket **Premium** dan **Sultan**.
          </p>

          <Link
            to="/paket-belajar"
            className="w-full py-4 bg-gradient-to-r from-[#0050cb] to-[#003da1] text-white rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all"
          >
            Upgrade ke Premium Sekarang
          </Link>
          
          <Link
            to="/dashboard"
            className="text-xs font-semibold text-[#727687] hover:text-[#0050cb] mt-4 transition-colors"
          >
            Kembali ke Dashboard
          </Link>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#faf8ff] via-[#f3f4fc] to-[#edf0fa] text-[#191b24] font-sans flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-input {
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .custom-input:focus {
          border-color: #0050cb;
          box-shadow: 0 0 0 3px rgba(0, 80, 203, 0.1);
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.6);
        }
        .circular-progress {
          transform: rotate(-90deg);
          transform-origin: 50% 50%;
          transition: stroke-dashoffset 0.8s ease-out;
        }
      `}} />
      
      <StudentNavbar user={user} isAdmin={user?.role === 'admin'} onLogout={() => { logout(); navigate('/'); }} />
      
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 flex-grow w-full space-y-8">
        {/* Header */}
        <section className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0050cb]/10 text-[#0050cb] text-[11px] font-bold mb-4">
            <span className="material-symbols-outlined text-[15px]">insights</span>
            Rasionalisasi SNBT
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#111c2d] mb-3">Analisis Rasionalisasi PTN</h1>
          <p className="text-sm font-medium text-[#727687] max-w-2xl leading-relaxed">
            Gunakan kalkulator rasionalisasi berbasis pembobotan subtes untuk mengukur peluang kelulusan program studi tujuanmu.
          </p>
        </section>

        {/* ── Section A: Input Nilai Tryout ── */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-[#111c2d]">1. Input Nilai Tryout UTBK</h2>
              <p className="text-xs text-[#727687] mt-0.5">Masukkan skor dari subtes tryout terakhirmu (skala 0 - 1000)</p>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-center">
              <button
                onClick={() => handleScoreSourceChange('tryout')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  scoreSource === 'tryout' ? 'bg-white text-[#0050cb] shadow-sm' : 'text-[#727687]'
                }`}
                disabled={loadingScores}
              >
                {loadingScores ? 'Memuat...' : 'Ambil dari Tryout'}
              </button>
              <button
                onClick={() => handleScoreSourceChange('manual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  scoreSource === 'manual' ? 'bg-white text-[#0050cb] shadow-sm' : 'text-[#727687]'
                }`}
              >
                Input Manual
              </button>
            </div>
          </div>

          {tryoutDate && (
            <div className="mb-6 p-3.5 bg-blue-50/70 border border-blue-100 text-blue-800 text-xs rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>Skor auto-fill berhasil dimuat dari data Tryout terbaikmu pada tanggal <b>{new Date(tryoutDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</b>.</span>
            </div>
          )}

          {/* Subtest Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {UTBK_SUBTESTS.map(sub => {
              const shortInfo = SUBTES_SHORT[sub.label] || { color: 'bg-slate-100 text-slate-700', icon: 'menu_book' };
              return (
                <div key={sub.shortCode} className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${shortInfo.color}`}>
                      {sub.shortCode}
                    </span>
                    <span className="text-[11px] font-semibold text-[#424656] truncate max-w-[130px]">{sub.label}</span>
                  </div>
                  <input
                    type="number"
                    value={scores[sub.shortCode]}
                    onChange={(e) => handleScoreChange(sub.shortCode, e.target.value)}
                    placeholder="0"
                    min="0"
                    max="1000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold custom-input bg-slate-50/50"
                  />
                </div>
              );
            })}
            
            {/* Average Display */}
            <div className="flex flex-col justify-end p-2.5 bg-slate-50 border border-dashed border-slate-200 rounded-2xl h-[66px]">
              <span className="text-[10px] font-bold text-[#727687] uppercase tracking-wider">Rata-Rata Nilai</span>
              <span className="text-xl font-black text-[#0050cb] mt-0.5">{averageScore} <span className="text-xs font-semibold text-[#727687]">/1000</span></span>
            </div>
          </div>
        </section>

        {/* ── Section B: Pilihan Program Studi ── */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#111c2d]">2. Pilihan Universitas & Program Studi</h2>
            <p className="text-xs text-[#727687] mt-0.5">Tentukan 2-4 pilihan program studi (pilihan 3 & 4 harus menyertakan rumpun Vokasi D3/D4)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {choices.map((choice, index) => {
              const selectedPtn = getPtnObj(choice.ptnId);
              const selectedProdi = selectedPtn?.prodi.find(p => p.nama === choice.prodiName);
              const isVokasiOption = index >= 2;

              return (
                <div key={index} className="p-5 rounded-2xl border border-slate-100 bg-[#fafbfe]/80 relative group">
                  {/* Delete Option Slot */}
                  {isVokasiOption && (
                    <button
                      onClick={() => removeChoiceSlot(index)}
                      className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-200/50 text-slate-500 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  )}
                  
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-6 h-6 rounded-full bg-[#0050cb] text-white text-[11px] font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <h3 className="text-xs font-bold text-[#424656] uppercase tracking-wider">
                      Pilihan {index + 1} {isVokasiOption && <span className="text-[10px] text-[#0050cb] font-semibold">(Vokasi)</span>}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {/* PTN Selector */}
                    <div className="relative">
                      <label className="block text-[10px] font-bold text-[#727687] uppercase tracking-wider mb-1.5">Pilih Perguruan Tinggi Negeri</label>
                      <input
                        type="text"
                        value={choice.ptnSearch}
                        onFocus={() => updateChoice(index, 'showPtnDropdown', true)}
                        onChange={(e) => {
                          updateChoice(index, 'ptnSearch', e.target.value);
                          updateChoice(index, 'showPtnDropdown', true);
                        }}
                        placeholder="Ketik nama universitas / PTN..."
                        className="w-full pl-3.5 pr-10 py-3 rounded-xl border border-slate-200 text-sm font-semibold custom-input bg-white"
                      />
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                        school
                      </span>

                      {choice.showPtnDropdown && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => updateChoice(index, 'showPtnDropdown', false)} />
                          <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl border border-slate-100 shadow-xl z-50 max-h-52 overflow-y-auto py-2">
                            {getFilteredPtnList(choice.ptnSearch).map(ptn => (
                              <button
                                key={ptn.id}
                                onClick={() => updateChoice(index, 'ptnId', ptn.id)}
                                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                              >
                                <img src={getPtnLogo(ptn.id, ptn.logo)} alt={ptn.singkatan} className="w-6 h-6 rounded-full object-contain bg-slate-50" />
                                <div>
                                  <p className="text-xs font-bold text-[#191b24]">{ptn.nama}</p>
                                  <p className="text-[10px] text-[#727687]">{ptn.lokasi}</p>
                                </div>
                              </button>
                            ))}
                            {getFilteredPtnList(choice.ptnSearch).length === 0 && (
                              <p className="text-xs text-[#727687] px-4 py-2 text-center">PTN tidak ditemukan</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Prodi Selector */}
                    <div className="relative">
                      <label className="block text-[10px] font-bold text-[#727687] uppercase tracking-wider mb-1.5">Pilih Program Studi</label>
                      <input
                        type="text"
                        value={choice.prodiSearch}
                        disabled={!choice.ptnId}
                        onFocus={() => updateChoice(index, 'showProdiDropdown', true)}
                        onChange={(e) => {
                          updateChoice(index, 'prodiSearch', e.target.value);
                          updateChoice(index, 'showProdiDropdown', true);
                        }}
                        placeholder={choice.ptnId ? "Ketik nama program studi..." : "Pilih Perguruan Tinggi terlebih dahulu"}
                        className="w-full pl-3.5 pr-10 py-3 rounded-xl border border-slate-200 text-sm font-semibold custom-input bg-white disabled:bg-slate-100 disabled:text-slate-400"
                      />
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                        category
                      </span>

                      {choice.showProdiDropdown && choice.ptnId && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => updateChoice(index, 'showProdiDropdown', false)} />
                          <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl border border-slate-100 shadow-xl z-50 max-h-52 overflow-y-auto py-2">
                            {getFilteredProdiList(choice.ptnId, choice.prodiSearch, isVokasiOption).map(p => (
                              <button
                                key={p.nama}
                                onClick={() => updateChoice(index, 'prodiName', p.nama)}
                                className="w-full text-left px-5 py-3 hover:bg-slate-50 flex items-center justify-between transition-colors border-b border-slate-50 last:border-0"
                              >
                                <div>
                                  <span className="text-xs font-bold text-[#191b24]">{p.nama}</span>
                                  <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{p.jenjang}</span>
                                </div>
                                <span className="text-[10px] font-bold text-[#727687]">Cut-off: {p.skor}</span>
                              </button>
                            ))}
                            {getFilteredProdiList(choice.ptnId, choice.prodiSearch, isVokasiOption).length === 0 && (
                              <p className="text-xs text-[#727687] px-4 py-2 text-center">Program studi tidak ditemukan</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {selectedProdi && (
                    <div className="mt-4 pt-3.5 border-t border-slate-200/50 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                        Kuota: {selectedProdi.daya_tampung} Kursi
                      </span>
                      <span className="inline-flex items-center text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                        Skor Kelulusan: {selectedProdi.skor}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-2">
            {activeChoicesCount < 4 ? (
              <button
                onClick={addChoiceSlot}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#0050cb] hover:opacity-80 transition-all bg-[#0050cb]/5 px-4 py-3 rounded-xl w-full sm:w-auto"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Tambah Pilihan Vokasi (3 & 4)
              </button>
            ) : <div />}

            <button
              onClick={runAnalysis}
              className="px-8 py-3.5 bg-[#0050cb] text-white rounded-2xl text-xs font-black shadow-lg hover:shadow-xl hover:translate-y-[-1px] transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <span className="material-symbols-outlined text-[18px]">insights</span>
              Mulai Analisis Peluang
            </button>
          </div>
        </section>

        {/* ── Section C: Analisis Hasil Peluang ── */}
        {analyzed && (
          <section ref={resultsRef} className="space-y-6 pt-4">
            <h2 className="text-xl font-black text-[#111c2d]">3. Hasil Analisis Rasionalisasi</h2>
            
            <div className="grid grid-cols-1 gap-6">
              {results.map((res) => {
                const circumference = 2 * Math.PI * 40;
                const strokeDash = circumference - (res.peluang / 100) * circumference;
                
                // Color themes depending on status
                const themeMap = {
                  Aman: { border: 'border-emerald-100', bg: 'from-emerald-50/20 to-transparent', ring: '#10b981', ringBg: '#10b98115', text: 'text-emerald-700' },
                  Bersaing: { border: 'border-amber-100', bg: 'from-amber-50/20 to-transparent', ring: '#f59e0b', ringBg: '#f59e0b15', text: 'text-amber-700' },
                  Rentan: { border: 'border-red-100', bg: 'from-red-50/20 to-transparent', ring: '#ef4444', ringBg: '#ef444415', text: 'text-red-700' }
                };
                const theme = themeMap[res.status];

                return (
                  <div key={res.choiceIndex} className={`bg-white border rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-center shadow-[0_8px_30px_rgba(0,0,0,0.01)] ${theme.border}`}>
                    
                    {/* Peluang Chart */}
                    <div className="relative shrink-0 flex items-center justify-center w-36 h-36">
                      <svg width="120" height="120" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke={theme.ringBg} strokeWidth="8" />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={theme.ring}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDash}
                          className="circular-progress"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-slate-800">{res.peluang}%</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peluang</span>
                      </div>
                    </div>

                    {/* Content details */}
                    <div className="flex-grow w-full space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0050cb]/10 text-[#0050cb]">
                              Pilihan {res.choiceIndex}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${res.statusColor}`}>
                              {res.status}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-[#111c2d] flex items-center gap-2">
                            <img src={getPtnLogo(res.ptn.id, res.ptn.logo)} alt={res.ptn.singkatan} className="w-6 h-6 rounded-full object-contain bg-slate-50" />
                            {res.prodi.nama}
                          </h3>
                          <p className="text-xs font-semibold text-[#727687] mt-0.5">{res.ptn.nama}</p>
                        </div>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                        <div>
                          <p className="text-[9px] font-bold text-[#727687] uppercase tracking-wider">Skor Kamu (Weighted)</p>
                          <p className="text-base font-black text-slate-800 mt-0.5">{res.weightedScore}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-[#727687] uppercase tracking-wider">Cut-off Kelulusan</p>
                          <p className="text-base font-black text-slate-800 mt-0.5">{res.passingGrade}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-[#727687] uppercase tracking-wider">Keketatan Prodi</p>
                          <p className="text-xs font-bold mt-1 text-slate-700">{res.keketatan.ratio}% ({res.keketatan.label})</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-[#727687] uppercase tracking-wider">Peminat / Kuota</p>
                          <p className="text-xs font-bold mt-1 text-slate-700">{res.keketatan.peminat} / {res.prodi.daya_tampung}</p>
                        </div>
                      </div>

                      {/* Subtest details */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-[#727687] uppercase tracking-wider">Pembobotan Subtes Prioritas</p>
                        <div className="flex flex-wrap gap-2">
                          {res.prioritySubtests.map((sub, i) => {
                            const shortInfo = SUBTES_SHORT[sub] || { color: 'bg-slate-100 text-slate-700', label: 'SUB' };
                            return (
                              <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${shortInfo.color}`}>
                                <span className="font-extrabold">{shortInfo.label}</span>
                                <span className="opacity-60">|</span>
                                <span>Weight: {i === 0 ? '22%' : i === 1 ? '20%' : '18%'}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Section D: Rekomendasi Alternatif ── */}
        {analyzed && alternatives.length > 0 && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#111c2d]">4. Rekomendasi Program Studi Alternatif</h2>
              <p className="text-xs text-[#727687] mt-0.5">Saran program studi sejenis yang memiliki rasio keketatan lebih rendah dan peluang kelulusan lebih aman berdasarkan nilaimu</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {alternatives.map((alt, index) => (
                <div key={index} className="p-4 rounded-2xl border border-slate-100 bg-[#fafbfe]/80 flex flex-col justify-between h-44 hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform"></div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <img src={getPtnLogo(alt.ptn.id, alt.ptn.logo)} alt={alt.ptn.singkatan} className="w-5.5 h-5.5 rounded-full object-contain bg-slate-50" />
                      <span className="text-[10px] font-black text-slate-500 uppercase">{alt.ptn.singkatan}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 ml-auto border border-emerald-100">
                        {alt.peluang}% Lolos
                      </span>
                    </div>
                    
                    <h4 className="text-sm font-bold text-[#111c2d] truncate">{alt.prodi.nama}</h4>
                    <p className="text-[10px] font-semibold text-[#727687]">{alt.ptn.nama}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between text-[10px] font-bold text-[#727687]">
                    <span>Passing: {alt.passingGrade}</span>
                    <span>Kuota: {alt.prodi.daya_tampung}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
      <ChatWidget />
    </div>
  );
};

export default Rasionalisasi;
