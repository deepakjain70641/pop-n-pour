import { useEffect, useMemo, useState } from 'react';
import { Download, Search, Trash2, Copy, Cake, QrCode, KeyRound } from 'lucide-react';
import { supabase } from '../supabase';
import { inr, cls, fmtTime } from '../ui';
import { CATEGORIES, catName, itemsOf } from '../menu';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const STATUS_CLS = { new: 'bg-[#FADCDF]', preparing: 'bg-[#FCEBD2]', ready: 'bg-[#E6F2EC]', completed: 'bg-[#1F3B2C] text-[#FBF5EA]', cancelled: 'bg-[#EEE]' };
const TABS = [['dashboard', 'Dashboard'], ['orders', 'Orders'], ['customers', 'Customers'], ['promos', 'Promo codes'], ['menu', 'Menu & prices'], ['settings', 'Settings']];

function downloadCSV(name, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const blob = new Blob(['﻿' + rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  URL.revokeObjectURL(a.href);
}

export default function ManagementMIS() {
  const [tab, setTab] = useState('dashboard');
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const start = new Date(`${from}T00:00:00`).toISOString();
      const end = new Date(new Date(`${to}T00:00:00`).getTime() + 86400000).toISOString();
      const { data, error: err } = await supabase.from('orders').select('*')
        .gte('created_at', start).lt('created_at', end).order('created_at', { ascending: false });
      if (cancelled) return;
      if (err) setError(err.message); else { setError(''); setOrders(data); }
    })();
    return () => { cancelled = true; };
  }, [from, to]);

  const stats = useMemo(() => {
    const done = orders.filter((o) => o.status === 'completed');
    const revenue = done.reduce((s, o) => s + Number(o.total), 0);
    const items = {}; const cats = {}; const hours = Array(24).fill(0); const reasons = {};
    done.forEach((o) => {
      hours[new Date(o.created_at).getHours()] += Number(o.total);
      o.items.forEach((it) => {
        const k = `${it.name}${it.size === 'L' ? ' (L)' : ''}`;
        items[k] = (items[k] || 0) + it.qty;
        const c = catName(it.cat || 'Other');
        cats[c] = (cats[c] || 0) + Number(it.line_total || 0);
      });
    });
    orders.filter((o) => o.status === 'cancelled').forEach((o) => { const r = o.cancel_reason || 'No reason'; reasons[r] = (reasons[r] || 0) + 1; });
    return {
      revenue, count: done.length, avg: done.length ? revenue / done.length : 0,
      discount: done.reduce((s, o) => s + Number(o.discount), 0),
      rewards: done.filter((o) => o.reward_redeemed).length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
      open: orders.filter((o) => ['new', 'preparing', 'ready'].includes(o.status)).length,
      top: Object.entries(items).sort((a, b) => b[1] - a[1]).slice(0, 8),
      cats: Object.entries(cats).sort((a, b) => b[1] - a[1]),
      reasons: Object.entries(reasons).sort((a, b) => b[1] - a[1]),
      hours,
    };
  }, [orders]);

  const exportCSV = () => downloadCSV(`pop-and-pour-orders-${from}-to-${to}.csv`, [
    ['Order No', 'Date', 'Time', 'Customer', 'Phone', 'Items', 'Subtotal', 'Discount', 'Promo', 'Free soda', 'Total', 'Status', 'Cancel reason'],
    ...orders.map((o) => [
      o.order_no, new Date(o.created_at).toLocaleDateString('en-IN'), fmtTime(o.created_at), o.customer_name || '', o.customer_phone || '',
      o.items.map((it) => `${it.qty}x ${it.name}${it.size === 'L' ? ' (L)' : ''}`).join('; '),
      o.subtotal, o.discount, o.promo_code || '', o.reward_redeemed ? 'Y' : '', o.total, o.status, o.cancel_reason || '',
    ]),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-2xl border border-[#F2DED5] bg-[#FFFDF8] p-1">
          {TABS.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`rounded-xl px-3 py-2 text-xs font-bold ${tab === id ? 'bg-[#1F3B2C] text-[#FBF5EA]' : 'hover:bg-[#FADCDF]'}`}>{label}</button>
          ))}
        </div>
        {(tab === 'dashboard' || tab === 'orders') && (
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className={cls.input + ' w-auto'} />
            <span>to</span>
            <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={cls.input + ' w-auto'} />
            <button onClick={exportCSV} className={cls.btnGhost} title="Download orders CSV"><Download className="h-4 w-4" /></button>
          </div>
        )}
      </div>
      {error && <p className="text-xs font-bold text-[#C0392B]">{error}</p>}

      {tab === 'dashboard' && <Dashboard s={stats} from={from} to={to} />}
      {tab === 'orders' && <OrdersTable orders={orders} />}
      {tab === 'customers' && <CustomersTab />}
      {tab === 'promos' && <PromosTab />}
      {tab === 'menu' && <MenuTab />}
      {tab === 'settings' && <SettingsTab />}
    </div>
  );
}

const Kpi = ({ label, value }) => (
  <div className={`${cls.card} p-4`}><p className={cls.label}>{label}</p><p className="font-serif text-2xl font-bold">{value}</p></div>
);

function Dashboard({ s, from, to }) {
  const max = Math.max(...s.hours, 1);
  const [copied, setCopied] = useState(false);
  const summary = () => [
    `Pop & Pour — ${from === to ? from : `${from} to ${to}`}`,
    `Sales: ${inr(s.revenue)} (${s.count} orders, avg ${inr(s.avg)})`,
    `Discounts: ${inr(s.discount)} · Free sodas: ${s.rewards} · Cancelled: ${s.cancelled}`,
    `Cash/UPI to tally: ${inr(s.revenue)}`,
    `Top: ${s.top.slice(0, 5).map(([n, q]) => `${n} ×${q}`).join(', ') || '—'}`,
  ].join('\n');
  const copy = async () => { await navigator.clipboard.writeText(summary()); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Revenue" value={inr(s.revenue)} />
        <Kpi label="Orders" value={s.count} />
        <Kpi label="Avg ticket" value={inr(s.avg)} />
        <Kpi label="Discounts" value={inr(s.discount)} />
        <Kpi label="Open now" value={s.open} />
        <Kpi label="Cancelled" value={s.cancelled} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className={`${cls.card} p-4 lg:col-span-2`}>
          <p className={cls.label}>Revenue by hour</p>
          <div className="flex h-40 gap-1">
            {s.hours.slice(8, 24).map((v, i) => (
              <div key={i} className="flex h-full flex-1 flex-col" title={`${i + 8}:00 · ${inr(v)}`}>
                <div className="flex flex-1 items-end"><div className="w-full rounded-t-md bg-[#E8744F]" style={{ height: `${(v / max) * 100}%`, minHeight: v ? 2 : 0 }} /></div>
                <span className="text-center text-[10px] text-[#6B6259]">{i + 8}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={`${cls.card} p-4`}>
          <p className={cls.label}>Top drinks</p>
          {s.top.length === 0 && <p className="text-xs text-[#6B6259]">No completed orders in range.</p>}
          <ol className="space-y-1.5 text-sm">
            {s.top.map(([name, qty]) => <li key={name} className="flex justify-between"><span>{name}</span><b>{qty}</b></li>)}
          </ol>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className={`${cls.card} p-4 lg:col-span-2`}>
          <p className={cls.label}>Sales by series</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {s.cats.map(([name, amt]) => (
              <div key={name} className="flex justify-between rounded-xl bg-[#F4EBE1] px-3 py-2 text-sm"><span>{name}</span><b>{inr(amt)}</b></div>
            ))}
          </div>
        </div>
        <div className={`${cls.card} p-4`}>
          <p className={cls.label}>Day close</p>
          <pre className="whitespace-pre-wrap font-sans text-xs text-[#1F3B2C]">{summary()}</pre>
          <button onClick={copy} className={`${cls.btnGhost} mt-3 flex items-center gap-1`}><Copy className="h-3.5 w-3.5" />{copied ? 'Copied!' : 'Copy for WhatsApp'}</button>
          {s.reasons.length > 0 && (
            <div className="mt-4">
              <p className={cls.label}>Cancel reasons</p>
              {s.reasons.map(([r, n]) => <p key={r} className="flex justify-between text-xs"><span>{r}</span><b>{n}</b></p>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OrdersTable({ orders }) {
  return (
    <div className={`${cls.card} overflow-x-auto`}>
      <table className="w-full text-sm">
        <thead className="bg-[#F4EBE1] text-left text-xs uppercase tracking-wider text-[#6B6259]">
          <tr><th className="p-3">#</th><th className="p-3">Time</th><th className="p-3">Customer</th><th className="p-3">Items</th><th className="p-3 text-right">Total</th><th className="p-3">Status</th></tr>
        </thead>
        <tbody className="divide-y divide-[#F2DED5]">
          {orders.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-xs text-[#6B6259]">No orders in this range.</td></tr>}
          {orders.map((o) => (
            <tr key={o.id}>
              <td className="p-3 font-bold">{o.order_no}</td>
              <td className="p-3">{new Date(o.created_at).toLocaleDateString('en-IN')} {fmtTime(o.created_at)}</td>
              <td className="p-3">{o.customer_name || 'Guest'}{o.customer_phone ? <span className="block text-xs text-[#6B6259]">{o.customer_phone}</span> : null}</td>
              <td className="p-3 text-xs">{o.items.map((it) => `${it.qty}× ${it.name}${it.size === 'L' ? ' (L)' : ''}`).join(', ')}</td>
              <td className="p-3 text-right font-bold">{inr(o.total)}{Number(o.discount) > 0 && <span className="block text-xs font-normal text-[#6B6259]">−{inr(o.discount)}</span>}</td>
              <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_CLS[o.status]}`}>{o.status}</span>{o.cancel_reason && <span className="block text-[11px] text-[#6B6259]">{o.cancel_reason}</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const daysToBirthday = (iso) => {
  if (!iso) return null;
  const [, m, d] = iso.split('-').map(Number);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  let next = new Date(now.getFullYear(), m - 1, d);
  if (next < now) next = new Date(now.getFullYear() + 1, m - 1, d);
  return Math.round((next - now) / 86400000);
};

function CustomersTab() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    supabase.from('customers').select('id,name,phone,stamps,birthday,created_at').order('created_at', { ascending: false })
      .then(({ data, error: err }) => { if (err) setError(err.message); else setRows(data); });
  }, []);
  const list = rows.filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(q.toLowerCase()));
  const bdays = rows.map((c) => ({ ...c, days: daysToBirthday(c.birthday) })).filter((c) => c.days != null && c.days <= 30).sort((a, b) => a.days - b.days);
  const csv = () => downloadCSV(`pop-and-pour-customers-${today()}.csv`,
    [['Name', 'Mobile', 'Stamps', 'Birthday', 'Joined'], ...rows.map((c) => [c.name, c.phone, c.stamps, c.birthday || '', new Date(c.created_at).toLocaleDateString('en-IN')])]);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-[#6B6259]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or phone" className={`${cls.input} pl-9`} />
        </div>
        <button onClick={csv} className={`${cls.btnGhost} flex items-center gap-1`}><Download className="h-4 w-4" /> Download all ({rows.length})</button>
      </div>
      {error && <p className="text-xs font-bold text-[#C0392B]">{error}</p>}
      {bdays.length > 0 && (
        <div className={`${cls.card} p-4`}>
          <p className={`${cls.label} flex items-center gap-1`}><Cake className="h-4 w-4 text-[#E8744F]" /> Birthdays in the next 30 days</p>
          <div className="flex flex-wrap gap-2">
            {bdays.map((c) => (
              <a key={c.id} target="_blank" rel="noreferrer" className="rounded-full bg-[#FADCDF] px-3 py-1 text-xs font-bold hover:bg-[#F5C9CE]"
                href={`https://wa.me/91${c.phone}?text=${encodeURIComponent(`Happy birthday ${c.name}! 🎂 Pop & Pour has a free drink waiting for you this week — show this message at the counter.`)}`}>
                {c.name} · {c.days === 0 ? 'today 🎉' : `in ${c.days}d`}
              </a>
            ))}
          </div>
        </div>
      )}
      <div className={`${cls.card} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead className="bg-[#F4EBE1] text-left text-xs uppercase tracking-wider text-[#6B6259]">
            <tr><th className="p-3">Name</th><th className="p-3">Mobile</th><th className="p-3 text-right">Stamps</th><th className="p-3">Birthday</th><th className="p-3">Joined</th></tr>
          </thead>
          <tbody className="divide-y divide-[#F2DED5]">
            {list.map((c) => (
              <tr key={c.id}><td className="p-3 font-bold">{c.name}</td><td className="p-3">{c.phone}</td><td className="p-3 text-right">{c.stamps}</td><td className="p-3">{c.birthday ? new Date(c.birthday).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</td><td className="p-3">{new Date(c.created_at).toLocaleDateString('en-IN')}</td></tr>
            ))}
            {list.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-xs text-[#6B6259]">No customers yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[#6B6259]">PINs are stored hashed and cannot be viewed.</p>
    </div>
  );
}

function PromosTab() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ code: '', type: 'percent', value: '', min_order: '' });
  const [error, setError] = useState('');
  const load = () => supabase.from('promos').select('*').order('created_at', { ascending: false })
    .then(({ data, error: err }) => { if (err) setError(err.message); else setRows(data); });
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    const value = Number(form.value);
    if (!form.code.trim() || !(value > 0)) return setError('Code and a positive value are required');
    if (form.type === 'percent' && value > 100) return setError('Percent cannot exceed 100');
    const { error: err } = await supabase.from('promos').insert({ code: form.code.trim().toUpperCase(), type: form.type, value, min_order: Number(form.min_order) || 0 });
    if (err) return setError(err.message);
    setError(''); setForm({ code: '', type: 'percent', value: '', min_order: '' }); load();
  };
  const toggle = async (p) => { await supabase.from('promos').update({ active: !p.active }).eq('code', p.code); load(); };
  const remove = async (p) => { if (window.confirm(`Delete ${p.code}?`)) { await supabase.from('promos').delete().eq('code', p.code); load(); } };
  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-4">
      <form onSubmit={add} className={`${cls.card} grid gap-3 p-4 sm:grid-cols-5`}>
        <div><label className={cls.label}>Code</label><input value={form.code} onChange={f('code')} placeholder="WELCOME10" className={cls.input} /></div>
        <div><label className={cls.label}>Type</label>
          <select value={form.type} onChange={f('type')} className={cls.input}><option value="percent">% off</option><option value="flat">₹ off</option></select></div>
        <div><label className={cls.label}>Value</label><input type="number" min="1" value={form.value} onChange={f('value')} className={cls.input} /></div>
        <div><label className={cls.label}>Min order ₹</label><input type="number" min="0" value={form.min_order} onChange={f('min_order')} className={cls.input} /></div>
        <div className="flex items-end"><button type="submit" className={`${cls.btn} w-full`}>Add code</button></div>
        {error && <p className="text-xs font-bold text-[#C0392B] sm:col-span-5">{error}</p>}
      </form>
      <div className={`${cls.card} divide-y divide-[#F2DED5]`}>
        {rows.length === 0 && <p className="p-6 text-center text-xs text-[#6B6259]">No promo codes yet.</p>}
        {rows.map((p) => (
          <div key={p.code} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
            <div>
              <b>{p.code}</b> · {p.type === 'percent' ? `${Number(p.value)}% off` : `${inr(p.value)} off`}
              {Number(p.min_order) > 0 && <span className="text-xs text-[#6B6259]"> · min {inr(p.min_order)}</span>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggle(p)} className={`rounded-full px-3 py-1 text-xs font-bold ${p.active ? 'bg-[#E6F2EC]' : 'bg-[#EEE] text-[#6B6259]'}`}>{p.active ? 'Active' : 'Paused'}</button>
              <button onClick={() => remove(p)} className="rounded-lg bg-[#FADCDF] p-1.5"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MenuTab() {
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState('');
  const load = () => supabase.from('menu_items').select('*').order('sort').then(({ data, error }) => { if (error) setMsg(error.message); else setRows(data); });
  useEffect(() => { load(); }, []);
  const edit = (id, k, v) => setRows((r) => r.map((m) => (m.id === id ? { ...m, [k]: v, dirty: true } : m)));
  const save = async (m) => {
    const { error } = await supabase.from('menu_items').update({ name: m.name, descr: m.descr, price_r: Number(m.price_r), price_l: m.price_l === '' || m.price_l == null ? null : Number(m.price_l), sold_out: m.sold_out }).eq('id', m.id);
    setMsg(error ? error.message : `${m.name} saved`); if (!error) load();
  };
  const groups = [{ id: 'addon', name: 'Add-ons' }, ...CATEGORIES];
  return (
    <div className="space-y-4">
      <p className="text-xs text-[#6B6259]">Edit a price or name, then press Save on that row. Changes show on the kiosk within a minute.</p>
      {msg && <p className="text-xs font-bold">{msg}</p>}
      {groups.map((g) => (
        <div key={g.id} className={`${cls.card} overflow-x-auto`}>
          <div className="bg-[#F4EBE1] px-3 py-2 text-xs font-black uppercase tracking-widest">{g.name}</div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-[#F2DED5]">
              {itemsOf(rows, g.id).map((m) => (
                <tr key={m.id}>
                  <td className="p-2"><input value={m.name} onChange={(e) => edit(m.id, 'name', e.target.value)} className={`${cls.input} min-w-36`} /></td>
                  <td className="p-2"><input value={m.descr || ''} onChange={(e) => edit(m.id, 'descr', e.target.value)} className={`${cls.input} min-w-44`} placeholder="Description" /></td>
                  <td className="p-2"><label className={cls.label}>₹ {g.id === 'addon' ? 'Add' : 'R'}</label><input type="number" min="0" value={m.price_r} onChange={(e) => edit(m.id, 'price_r', e.target.value)} className={`${cls.input} w-24`} /></td>
                  <td className="p-2">{g.id !== 'addon' && <><label className={cls.label}>₹ L</label><input type="number" min="0" value={m.price_l ?? ''} onChange={(e) => edit(m.id, 'price_l', e.target.value)} className={`${cls.input} w-24`} placeholder="—" /></>}</td>
                  <td className="p-2 text-xs font-bold"><label className="flex items-center gap-1"><input type="checkbox" checked={m.sold_out} onChange={(e) => edit(m.id, 'sold_out', e.target.checked)} />Sold out</label></td>
                  <td className="p-2"><button disabled={!m.dirty} onClick={() => save(m)} className={cls.btn}>Save</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function SettingsTab() {
  const [pin, setPin] = useState('');
  const [msg, setMsg] = useState('');
  const site = window.location.origin;
  const savePin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.rpc('set_barista_pin', { p_pin: pin });
    setMsg(error ? error.message : 'Barista PIN updated'); if (!error) setPin('');
  };
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form onSubmit={savePin} className={`${cls.card} space-y-3 p-4`}>
        <h3 className="flex items-center gap-2 text-sm font-black"><KeyRound className="h-4 w-4" /> Barista PIN</h3>
        <p className="text-xs text-[#6B6259]">Staff open the Barista screen with this PIN. Default is 1234 — change it now. 4–6 digits.</p>
        <div className="flex gap-2">
          <input inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} className={`${cls.input} max-w-40`} placeholder="New PIN" />
          <button type="submit" disabled={pin.length < 4} className={cls.btn}>Save PIN</button>
        </div>
        {msg && <p className="text-xs font-bold">{msg}</p>}
      </form>
      <div className={`${cls.card} space-y-3 p-4`}>
        <h3 className="flex items-center gap-2 text-sm font-black"><QrCode className="h-4 w-4" /> QR poster for tables & counter</h3>
        <p className="text-xs text-[#6B6259]">Customers scan to order from their phone while they queue. Print on A4.</p>
        <a href="/poster.html" target="_blank" rel="noreferrer" className={`${cls.btn} inline-block`}>Open printable poster</a>
        <p className="text-[11px] text-[#6B6259]">Links to {site}</p>
      </div>
    </div>
  );
}
