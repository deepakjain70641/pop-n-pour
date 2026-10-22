export const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
export const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
export const minsAgo = (iso) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
export const cls = {
  card: 'bg-[#FFFDF8] border border-[#F2DED5] rounded-2xl shadow-sm',
  btn: 'bg-[#1F3B2C] text-[#FBF5EA] hover:bg-[#2C5340] disabled:opacity-40 rounded-xl px-4 py-2.5 text-sm font-bold transition',
  btnCoral: 'bg-[#E8744F] text-white hover:bg-[#D4623F] disabled:opacity-40 rounded-xl px-4 py-2.5 text-sm font-bold transition',
  btnGhost: 'bg-[#FADCDF] text-[#1F3B2C] hover:bg-[#F5C9CE] rounded-xl px-3 py-2 text-xs font-bold transition',
  input: 'w-full rounded-xl border border-[#F2DED5] bg-white px-3 py-2.5 text-sm text-[#1F3B2C] outline-none focus:border-[#E8744F]',
  label: 'block text-xs font-bold uppercase tracking-wider text-[#6B6259] mb-1',
  h2: 'font-serif text-2xl font-bold text-[#1F3B2C]',
};
