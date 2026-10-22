import { useEffect, useState } from 'react';
import { ChefHat, BarChart3, LogOut, Lock, KeyRound } from 'lucide-react';
import { supabase } from './supabase';
import { cls } from './ui';
import CustomerKiosk from './components/CustomerKiosk';
import BaristaKDS from './components/BaristaKDS';
import ManagementMIS from './components/ManagementMIS';

const ACCESS = { barista: ['barista'], owner: ['barista', 'owner'] };
const allowed = (role, target) => !!role && (ACCESS[role] || []).includes(target);

async function fetchStaff(session) {
  if (!session) return null;
  const { data } = await supabase.from('staff').select('role,name').eq('user_id', session.user.id).maybeSingle();
  return data ? { ...data, email: session.user.email } : null;
}

export default function App() {
  const [view, setView] = useState('kiosk');
  const [staff, setStaff] = useState(null);
  const [loginFor, setLoginFor] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => setStaff(await fetchStaff(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => { if (!session) setStaff(null); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const go = (target) => (target === 'kiosk' || allowed(staff?.role, target) ? setView(target) : setLoginFor(target));
  const logout = async () => { await supabase.auth.signOut(); setStaff(null); setView('kiosk'); };
  const current = view === 'kiosk' || allowed(staff?.role, view) ? view : 'kiosk';

  const tab = (id, label, Icon) => (
    <button key={id} onClick={() => go(id)}
      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${current === id ? 'bg-[#1F3B2C] text-[#FBF5EA]' : 'text-[#1F3B2C] hover:bg-[#FADCDF]'}`}>
      {Icon && <Icon className="h-4 w-4" />}{label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#FBF5EA] text-[#1F3B2C]">
      <header className="sticky top-0 z-40 border-b border-[#F2DED5] bg-[#FBF5EA]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <button onClick={() => go('kiosk')} className="flex items-center gap-3 text-left">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FADCDF] font-serif text-lg font-black">P&amp;p</div>
            <div>
              <h1 className="font-serif text-2xl font-black leading-none">Pop <span className="text-[#E8744F]">&amp;</span> Pour</h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6B6259]">Sip happy · Stay happy ♡</p>
            </div>
          </button>
          <div className="flex items-center gap-1 rounded-2xl border border-[#F2DED5] bg-[#FFFDF8] p-1">
            {tab('kiosk', '🥤 Order')}
            {tab('barista', 'Barista', ChefHat)}
            {tab('owner', 'Management', BarChart3)}
            {staff && (
              <button onClick={logout} title={`Sign out ${staff.email || staff.name}`} className="ml-1 rounded-xl bg-[#FADCDF] px-3 py-2 hover:bg-[#F5C9CE]">
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-3 pb-24 md:p-6">
        {current === 'kiosk' && <CustomerKiosk />}
        {current === 'barista' && <BaristaKDS isOwner={staff?.role === 'owner'} />}
        {current === 'owner' && <ManagementMIS />}
      </main>
      {loginFor === 'owner' && <OwnerLogin onClose={() => setLoginFor(null)} onSuccess={(s) => { setStaff(s); setView('owner'); setLoginFor(null); }} />}
      {loginFor === 'barista' && <BaristaPinLogin onClose={() => setLoginFor(null)} onSuccess={(s) => { setStaff(s); setView('barista'); setLoginFor(null); }} />}
    </div>
  );
}

function Modal({ title, Icon, onClose, onSubmit, busy, error, children, submitLabel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F3B2C]/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={onSubmit} onClick={(e) => e.stopPropagation()} className={`${cls.card} anim-pop w-full max-w-sm space-y-4 p-6`}>
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FADCDF]"><Icon className="h-5 w-5" /></div>
          <h3 className="font-serif text-xl font-bold">{title}</h3>
        </div>
        {children}
        {error && <p className="text-xs font-bold text-[#C0392B]">{error}</p>}
        <button type="submit" disabled={busy} className={`${cls.btn} w-full`}>{busy ? 'Please wait…' : submitLabel}</button>
        <button type="button" onClick={onClose} className="w-full text-xs font-bold text-[#6B6259]">Cancel</button>
      </form>
    </div>
  );
}

function OwnerLogin({ onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setBusy(false); return; }
    const s = await fetchStaff(data.session);
    if (!s || s.role !== 'owner') { await supabase.auth.signOut(); setError('This account is not an owner account.'); setBusy(false); return; }
    onSuccess(s);
  };
  return (
    <Modal title="Management sign-in" Icon={Lock} onClose={onClose} onSubmit={submit} busy={busy} error={error} submitLabel="Sign in">
      <div><label className={cls.label}>Email</label><input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} className={cls.input} /></div>
      <div><label className={cls.label}>Password</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={cls.input} /></div>
    </Modal>
  );
}

function BaristaPinLogin({ onClose, onSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    let { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const { data, error: err } = await supabase.auth.signInAnonymously();
      if (err) { setError(err.message.includes('disabled') ? 'Enable "Anonymous sign-ins" in Supabase → Authentication.' : err.message); setBusy(false); return; }
      session = data.session;
    }
    const { error: err } = await supabase.rpc('claim_barista', { p_pin: pin });
    if (err) { setError(err.message); setBusy(false); return; }
    onSuccess(await fetchStaff(session));
  };
  return (
    <Modal title="Barista PIN" Icon={KeyRound} onClose={onClose} onSubmit={submit} busy={busy} error={error} submitLabel="Open counter">
      <input type="password" inputMode="numeric" maxLength={6} required autoFocus value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
        className={`${cls.input} text-center text-2xl tracking-[0.5em]`} placeholder="••••" />
    </Modal>
  );
}
