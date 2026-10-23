import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, RefreshCw, Clock, Award, Ticket, MessageCircle, Ban } from 'lucide-react';
import { supabase } from '../supabase';
import { inr, cls, fmtTime, minsAgo } from '../ui';
import { CATEGORIES, catName, itemsOf } from '../menu';

const COLUMNS = [
  { status: 'new', title: 'New · collect payment', color: 'bg-[#FADCDF]' },
  { status: 'preparing', title: 'Preparing', color: 'bg-[#FCEBD2]' },
  { status: 'ready', title: 'Ready', color: 'bg-[#E6F2EC]' },
];
const CANCEL_REASONS = ['Customer left', 'Wrong order', 'Out of stock', 'Duplicate', 'Other'];

function chime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.35);
  } catch { /* audio blocked */ }
}

export default function BaristaKDS() {
  const [orders, setOrders] = useState([]);
  const [sound, setSound] = useState(true);
  const [error, setError] = useState('');
  const soundRef = useRef(true);
  const seen = useRef(null);
  useEffect(() => { soundRef.current = sound; }, [sound]);

  const load = async () => {
    const { data, error: err } = await supabase.from('orders').select('*')
      .in('status', ['new', 'preparing', 'ready']).order('created_at');
    if (err) return setError(err.message);
    setError('');
    if (seen.current && soundRef.current && data.some((o) => o.status === 'new' && !seen.current.has(o.id))) chime();
    seen.current = new Set(data.map((o) => o.id));
    setOrders(data);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = async (id, patch) => {
    const { error: err } = await supabase.from('orders').update(patch).eq('id', id);
    if (err) setError(err.message); else load();
  };
  const complete = async (id) => {
    const { error: err } = await supabase.rpc('complete_order', { p_order_id: id });
    if (err) setError(err.message); else load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={cls.h2}>Orders · {orders.length} open</h2>
        <div className="flex gap-2">
          <button onClick={() => setSound((s) => !s)} className={cls.btnGhost}>{sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</button>
          <button onClick={load} className={cls.btnGhost}><RefreshCw className="h-4 w-4" /></button>
        </div>
      </div>
      {error && <p className="text-xs font-bold text-[#C0392B]">{error}</p>}

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const list = orders.filter((o) => o.status === col.status);
          return (
            <div key={col.status} className="space-y-3">
              <div className={`${col.color} rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest`}>{col.title} · {list.length}</div>
              {list.length === 0 && <p className="py-6 text-center text-xs text-[#6B6259]">—</p>}
              {list.map((o) => (
                <OrderCard key={o.id} o={o}
                  onStart={() => update(o.id, { status: 'preparing', paid_at: new Date().toISOString() })}
                  onReady={() => update(o.id, { status: 'ready' })}
                  onComplete={() => complete(o.id)}
                  onCancel={(reason) => update(o.id, { status: 'cancelled', cancel_reason: reason })} />
              ))}
            </div>
          );
        })}
      </div>

      <SoldOutPanel />
    </div>
  );
}

function OrderCard({ o, onStart, onReady, onComplete, onCancel }) {
  const age = minsAgo(o.created_at);
  const [cancelling, setCancelling] = useState(false);
  const wa = o.customer_phone
    ? `https://wa.me/91${o.customer_phone}?text=${encodeURIComponent(`Hi ${o.customer_name || ''}! Your Pop & Pour order #${o.order_no} is ready 🥤 Please collect it at the counter.`)}`
    : null;
  return (
    <div className={`${cls.card} anim-up p-3`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-serif text-2xl font-bold leading-none">#{o.order_no}</p>
          <p className="mt-1 text-xs text-[#6B6259]">{o.customer_name || 'Guest'} · {fmtTime(o.created_at)}</p>
        </div>
        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${age >= 10 ? 'bg-[#FADCDF] text-[#C0392B]' : 'bg-[#F4EBE1]'}`}>
          <Clock className="h-3 w-3" />{age}m
        </span>
      </div>
      <ul className="my-3 space-y-1.5 text-sm">
        {o.items.map((it, i) => (
          <li key={i}>
            <b>{it.qty}×</b> {it.name}{it.size === 'L' ? ' (L)' : ''}
            <span className="text-xs text-[#6B6259]"> · {catName(it.cat)}{it.addons?.length ? ' · + ' + it.addons.join(', ') : ''}</span>
          </li>
        ))}
      </ul>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold">
        <span className={o.paid_at ? 'rounded-full bg-[#E6F2EC] px-2 py-0.5' : 'text-[#C0392B]'}>{o.paid_at ? 'Paid' : 'Collect'} {inr(o.total)}</span>
        {o.promo_code && <span className="flex items-center gap-1 rounded-full bg-[#E6F2EC] px-2 py-0.5"><Ticket className="h-3 w-3" />{o.promo_code}</span>}
        {o.reward_redeemed && <span className="flex items-center gap-1 rounded-full bg-[#FADCDF] px-2 py-0.5"><Award className="h-3 w-3" />Free soda</span>}
        {o.customer_id && !o.reward_redeemed && <span className="rounded-full bg-[#F4EBE1] px-2 py-0.5">Loyalty</span>}
      </div>
      {cancelling ? (
        <select autoFocus className={cls.input} defaultValue="" onBlur={() => setCancelling(false)}
          onChange={(e) => { if (e.target.value) onCancel(e.target.value); }}>
          <option value="" disabled>Why cancel #{o.order_no}?</option>
          {CANCEL_REASONS.map((r) => <option key={r}>{r}</option>)}
        </select>
      ) : (
        <div className="flex gap-2">
          {o.status === 'new' && <button onClick={onStart} className={`${cls.btnCoral} flex-1`}>Paid · Start</button>}
          {o.status === 'preparing' && <button onClick={onReady} className={`${cls.btn} flex-1`}>Ready</button>}
          {o.status === 'ready' && <button onClick={onComplete} className={`${cls.btn} flex-1`}>Handed over</button>}
          {o.status === 'ready' && wa && <a href={wa} target="_blank" rel="noreferrer" title="WhatsApp customer" className="flex items-center rounded-xl bg-[#25D366] px-3 text-white"><MessageCircle className="h-4 w-4" /></a>}
          <button onClick={() => setCancelling(true)} className={cls.btnGhost} title="Cancel"><Ban className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
}

function SoldOutPanel() {
  const [menu, setMenu] = useState([]);
  const load = () => supabase.from('menu_items').select('id,cat,name,sold_out').neq('cat', 'addon').order('sort').then(({ data }) => data && setMenu(data));
  useEffect(() => { load(); }, []);
  const toggle = async (m) => { await supabase.rpc('set_sold_out', { p_id: m.id, p_sold_out: !m.sold_out }); load(); };
  const out = menu.filter((m) => m.sold_out).length;
  return (
    <details className={`${cls.card} p-4`}>
      <summary className="cursor-pointer text-sm font-black">Sold out today · {out ? `${out} item${out === 1 ? '' : 's'} off` : 'all available'}</summary>
      <p className="mt-1 text-xs text-[#6B6259]">Tap a drink to mark it sold out / back on. Hidden from ordering instantly.</p>
      {CATEGORIES.map((c) => (
        <div key={c.id} className="mt-3">
          <p className={cls.label}>{c.name}</p>
          <div className="flex flex-wrap gap-1.5">
            {itemsOf(menu, c.id).map((m) => (
              <button key={m.id} onClick={() => toggle(m)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${m.sold_out ? 'bg-[#1F3B2C] text-[#FBF5EA] line-through' : 'bg-[#E6F2EC]'}`}>{m.name}</button>
            ))}
          </div>
        </div>
      ))}
    </details>
  );
}
