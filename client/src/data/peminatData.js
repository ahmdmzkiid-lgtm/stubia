/**
 * Deterministic generator for applicant data (Peminat) to avoid bloated static database.
 * Derives numbers based on PTN tier, prodi popularity, and capacity.
 */

export function getPeminat(ptnId, prodiNama, dayaTampung = 50) {
  if (!ptnId || !prodiNama) return 500;

  const ptn = ptnId.toLowerCase();
  const prodi = prodiNama.toLowerCase();

  // 1. Base applicant count by category
  let basePeminat = 1000;

  if (prodi.includes('kedokteran') || prodi.includes('dokter')) {
    basePeminat = 3800;
  } else if (
    prodi.includes('komputer') || 
    prodi.includes('artifisial') || 
    prodi.includes('sistem informasi') || 
    prodi.includes('informatika') ||
    prodi.includes('data science')
  ) {
    basePeminat = 2400;
  } else if (
    prodi.includes('hukum') || 
    prodi.includes('manajemen') || 
    prodi.includes('akuntansi') || 
    prodi.includes('psikologi') ||
    prodi.includes('komunikasi')
  ) {
    basePeminat = 2100;
  } else if (
    prodi.includes('ekonomi') || 
    prodi.includes('administrasi') || 
    prodi.includes('hubungan internasional')
  ) {
    basePeminat = 1400;
  } else if (
    prodi.includes('sastra') || 
    prodi.includes('sejarah') || 
    prodi.includes('filsafat') || 
    prodi.includes('arkeologi') ||
    prodi.includes('bahasa')
  ) {
    basePeminat = 450;
  } else if (prodi.includes('teknik') || prodi.includes('sains') || prodi.includes('matematika') || prodi.includes('fisika') || prodi.includes('kimia') || prodi.includes('biologi')) {
    basePeminat = 950;
  }

  // 2. PTN tier multiplier
  let multiplier = 1.0;
  const topTier = ['ui', 'itb', 'ugm', 'unair', 'undip', 'its', 'unpad', 'ipb', 'uns', 'ub'];
  const midTier = ['upnvj', 'upnvy', 'upnvjt', 'usu', 'unhas', 'unesa', 'uny', 'upi', 'unand', 'unsri'];

  if (topTier.includes(ptn)) {
    multiplier = 2.8;
  } else if (midTier.includes(ptn)) {
    multiplier = 1.6;
  } else {
    multiplier = 0.9;
  }

  // 3. Add deterministic variation based on string hash & capacity
  const hash = prodi.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variation = (hash % 40) - 20; // -20% to +20% variation
  const variationMultiplier = 1.0 + (variation / 100);

  // 4. Capacity scaling (more seats generally attract more applicants)
  const capacityFactor = 0.8 + (dayaTampung / 200);

  // Compute final count
  let finalCount = Math.round(basePeminat * multiplier * variationMultiplier * capacityFactor);

  // Enforce realistic bounds
  if (finalCount < 50) finalCount = 50;

  return finalCount;
}

export function getKeketatan(ptnId, prodiNama, dayaTampung) {
  const peminat = getPeminat(ptnId, prodiNama, dayaTampung);
  const dt = dayaTampung || 30;
  const ratio = parseFloat(((dt / peminat) * 100).toFixed(2));

  let label = 'Longgar';
  let badgeColor = 'bg-emerald-100 text-emerald-800';

  if (ratio < 3.0) {
    label = 'Sangat Ketat';
    badgeColor = 'bg-rose-100 text-rose-800 border border-rose-200';
  } else if (ratio < 8.0) {
    label = 'Ketat';
    badgeColor = 'bg-orange-100 text-orange-800 border border-orange-200';
  } else if (ratio < 15.0) {
    label = 'Sedang';
    badgeColor = 'bg-amber-100 text-amber-800 border border-amber-200';
  }

  return {
    peminat,
    ratio,
    label,
    badgeColor
  };
}
