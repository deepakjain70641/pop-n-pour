import { useEffect, useMemo, useState } from 'react';
import { ShoppingCart, Plus, Minus, Ticket, Award, X, Check, Sparkles } from 'lucide-react';
import { supabase } from '../supabase';
import { CATEGORIES, REWARD, catOf, addonsOf, itemsOf } from '../menu';
import { inr, cls } from '../ui';

const addonPrice = (addons, ids) => ids.reduce((s, id) => s + Number(addons.find((a) => a.id === id)?.price_r || 0), 0);
const addonNames = (addons, ids) => ids.map((id) => addons.find((a) => a.id === id)?.name).filter(Boolean);

export default function CustomerKiosk() {
  const [menu, setMenu] = useState([]);
  const [catId, setCatId] = useState('all');
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [promo, setPromo] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [redeem, setRedeem] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [showLoyalty, setShowLoyalty] = useState(false);
  const [placed, setPlaced] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = () => supabase.from('menu_items').select('*').order('sort').then(({ data }) => data && setMenu(data));
    load();
    const t = setInterval(load, 60000); // picks up sold-out changes
    return () => clearInterval(t);
  }, []);

  const addons = addonsOf(menu);
  const lineTotal = (l) => (l.unit + addonPrice(addons, l.addons)) * l.qty;
  const subtotal = useMemo(() => cart.reduce((s, l) => s + lineTotal(l), 0), [cart, menu]); // eslint-disable-line react-hooks/exhaustive-deps
  const count = cart.reduce((s, l) => s + l.qty, 0);
  const promoDiscount = promo && subtotal >= Number(promo.min_order)
    ? Math.min(subtotal, promo.type === 'percent' ? (subtotal * Number(promo.value)) / 100 : Number(promo.value)) : 0;
  const canRedeem = !!customer && customer.stamps >= REWARD.stamps;
  const freeSoda = Math.min(...cart.filter((l) => l.cat === 'sparkling').map((l) => l.unit), Infinity);
  const rewardDiscount = redeem && canRedeem && Number.isFinite(freeSoda) ? Math.min(freeSoda, subtotal - promoDiscount) : 0;
  const total = Math.max(0, Math.round(subtotal - promoDiscount - rewardDiscount));

  const addToCart = (item, size, ids) => {
    const key = `${item.id}|${size}|${[...ids].sort().join(',')}`;
    setCart((c) => {
      const i = c.findIndex((l) => l.key === key);
      if (i >= 0) return c.map((l, idx) => (idx === i ? { ...l, qty: l.qty + 1 } : l));
      return [...c, { key, id: item.id, name: item.name, cat: item.cat, size, unit: Number(size === 'L' ? item.price_l : item.price_r), addons: ids, qty: 1 }];
    });
  };
  const changeQty = (key, d) => setCart((c) => c.map((l) => (l.key === key ? { ...l, qty: l.qty + d } : l)).filter((l) => l.qty > 0));

  const placeOrder = async () => {
    setBusy(true); setError('');
    const name = customer?.name || guestName.trim() || null;
    const { data, error: err } = await supabase.rpc('place_order', {
      p: {
        customer_id: customer?.id || null, customer_name: name,
        items: cart.map((l) => ({ id: l.id, size: l.size, addons: l.addons, qty: l.qty })),
        promo_code: promo?.code || null, reward_redeemed: rewardDiscount > 0,
      },
    });
    setBusy(false);
    if (err) return setError(err.message);
    const stampsAfter = customer ? customer.stamps + 1 - (rewardDiscount > 0 ? REWARD.stamps : 0) : null;
    setPlaced({ no: data.order_no, total: data.total, name, stampsAfter, usedReward: rewardDiscount > 0 });
    setCart([]); setPromo(null); setRedeem(false); setGuestName(''); setCustomer(null); setCartOpen(false);
  };

  if (placed) {
    const left = placed.stampsAfter == null ? null : REWARD.stamps - placed.stampsAfter;
    return (
      <div className={`${cls.card} anim-pop mx-auto max-w-md p-8 text-center`}>
        <div className="anim-wiggle mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FADCDF]" style={{ animationDelay: '.3s' }}><Check className="h-8 w-8 text-[#E8744F]" /></div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#6B6259]">Order placed</p>
        <h2 className="my-2 font-serif text-6xl font-black">#{placed.no}</h2>
        <p className="text-sm">{placed.name ? `Thanks, ${placed.name}! ` : ''}Please pay <b>{inr(placed.total)}</b> at the counter. We'll call your number when it's ready.</p>
        {left != null && (
          <p className="mt-4 rounded-xl bg-[#FADCDF] p-3 text-sm font-bold">
            {placed.usedReward ? '🎉 Enjoy your free soda! ' : ''}
            {left <= 0 ? `🎁 Your next visit earns ${REWARD.label}!` : `⭐ ${left} more drink${left === 1 ? '' : 's'} to ${REWARD.label}`}
          </p>
        )}
        <button onClick={() => setPlaced(null)} className={`${cls.btn} mt-6 w-full`}>Start a new order</button>
      </div>
    );
  }

  const shown = catId === 'all' ? CATEGORIES : [catOf(catId)];

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[1fr_360px]">
      <section className="min-w-0">
        <div className="anim-up relative mb-5 overflow-hidden rounded-3xl bg-[#1F3B2C] px-5 py-6 text-[#FBF5EA] md:px-10 md:py-9">
          <div className="anim-float absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[#E8744F]/30 blur-2xl" />
          <div className="anim-float absolute -bottom-12 right-24 h-40 w-40 rounded-full bg-[#FADCDF]/30 blur-2xl" style={{ animationDelay: '-2.5s' }} />
          <span className="anim-float absolute right-5 top-4 text-4xl md:right-10 md:text-6xl" style={{ animationDelay: '-1s' }}>🧋</span>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#FADCDF]">Welcome to</p>
          <h2 className="font-serif text-3xl font-black md:text-5xl pr-12">Pop <span className="text-[#E8744F]">&amp;</span> Pour</h2>
          <p className="mt-2 max-w-md text-sm text-[#FBF5EA]/80">Sparkling sodas, milk teas, boba & matcha — made fresh at the counter. Pick your drink, we'll call your number.</p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#FBF5EA]/15 px-3 py-1 text-xs font-bold"><Sparkles className="h-3.5 w-3.5 text-[#E8744F]" /> Every {REWARD.stamps}th drink is on us</p>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {[{ id: 'all', name: 'All drinks', emoji: '✨' }, ...CATEGORIES].map((c) => (
            <button key={c.id} onClick={() => setCatId(c.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${c.id === catId ? 'bg-[#1F3B2C] text-[#FBF5EA]' : 'bg-[#FADCDF] hover:bg-[#F5C9CE]'}`}>
              {c.emoji} {c.name}
            </button>
          ))}
        </div>

        {menu.length === 0 && <p className="py-10 text-center text-sm text-[#6B6259]">Loading menu…</p>}
        {shown.map((c) => (
          <div key={c.id} className="mb-8">
            <div className="mb-3 flex flex-wrap items-baseline gap-3">
              <h2 className={cls.h2}>{c.emoji} {c.name}</h2>
              <span className="text-xs font-bold uppercase tracking-widest text-[#6B6259]">{c.note}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {itemsOf(menu, c.id).map((item, i) => <ItemCard key={item.id} item={item} cat={c} addons={c.addons ? addons : []} onAdd={addToCart} delay={i * 40} />)}
            </div>
          </div>
        ))}
      </section>

      <button key={count} onClick={() => setCartOpen(true)} className={`${cls.btnCoral} ${count ? 'anim-bump' : ''} fixed bottom-4 left-4 right-4 z-30 flex items-center justify-between py-3.5 shadow-xl lg:hidden`}>
        <span className="flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> {count} item{count === 1 ? '' : 's'}</span>
        <span>{inr(total)}</span>
      </button>

      <aside className={`${cartOpen ? 'anim-pop fixed inset-0 z-50 overflow-y-auto bg-[#FBF5EA] p-4' : 'hidden'} lg:static lg:block lg:p-0`}>
        <div className={`${cls.card} space-y-4 p-4 lg:sticky lg:top-24`}>
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl font-bold">Your cup</h3>
            <button onClick={() => setCartOpen(false)} className="lg:hidden"><X className="h-5 w-5" /></button>
          </div>

          {cart.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#6B6259]">Nothing here yet — pick a drink!</p>
          ) : (
            <ul className="divide-y divide-[#F2DED5]">
              {cart.map((l) => (
                <li key={l.key} className="flex items-start justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{l.name}{l.size === 'L' ? ' (L)' : ''}</p>
                    <p className="text-xs text-[#6B6259]">{catOf(l.cat).name}{l.addons.length ? ' · + ' + addonNames(addons, l.addons).join(', ') : ''}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button onClick={() => changeQty(l.key, -1)} className="rounded-lg bg-[#FADCDF] p-1"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-5 text-center text-sm font-bold">{l.qty}</span>
                    <button onClick={() => changeQty(l.key, 1)} className="rounded-lg bg-[#FADCDF] p-1"><Plus className="h-3.5 w-3.5" /></button>
                    <span className="w-14 text-right text-sm font-bold">{inr(lineTotal(l))}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <PromoBox promo={promo} setPromo={setPromo} subtotal={subtotal} />

          {customer ? (
            <div className="rounded-xl bg-[#FADCDF] p-3 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1"><Award className="h-4 w-4 text-[#E8744F]" />{customer.name} · {customer.stamps} stamp{customer.stamps === 1 ? '' : 's'}</span>
                <button onClick={() => { setCustomer(null); setRedeem(false); }}>Sign out</button>
              </div>
              {canRedeem ? (
                <>
                  <label className="mt-2 flex items-center gap-2 font-bold">
                    <input type="checkbox" checked={redeem} onChange={(e) => setRedeem(e.target.checked)} />
                    Use {REWARD.stamps} stamps for {REWARD.label}
                  </label>
                  {redeem && !Number.isFinite(freeSoda) && <p className="mt-1 text-[#C0392B]">Add a Sparkling Soda to your cup to use it.</p>}
                </>
              ) : (
                <p className="mt-1 text-[#6B6259]">{REWARD.stamps - customer.stamps} more to {REWARD.label}. You earn 1 stamp per order.</p>
              )}
            </div>
          ) : (
            <>
              <button onClick={() => setShowLoyalty(true)} className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-[#E8744F] py-2 text-xs font-bold text-[#E8744F]">
                <Award className="h-4 w-4" /> Earn loyalty stamps
              </button>
              <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Name for the order (optional)" className={cls.input} />
            </>
          )}

          <div className="space-y-1 border-t border-[#F2DED5] pt-3 text-sm">
            <Row label="Subtotal" value={inr(subtotal)} />
            {promoDiscount > 0 && <Row label={`Promo ${promo.code}`} value={`− ${inr(promoDiscount)}`} />}
            {rewardDiscount > 0 && <Row label="Free Sparkling Soda" value={`− ${inr(rewardDiscount)}`} />}
            <Row label="Total" value={inr(total)} bold />
          </div>
          {error && <p className="text-xs font-bold text-[#C0392B]">{error}</p>}
          <button disabled={!cart.length || busy} onClick={placeOrder} className={`${cls.btnCoral} w-full`}>
            {busy ? 'Placing…' : `Place order · ${inr(total)}`}
          </button>
          <p className="text-center text-[11px] text-[#6B6259]">Pay by cash or UPI at the counter</p>
        </div>
      </aside>

      {showLoyalty && <LoyaltyModal onClose={() => setShowLoyalty(false)} onDone={(c) => { setCustomer(c); setShowLoyalty(false); }} />}
    </div>
  );
}

const Row = ({ label, value, bold }) => (
  <div className={`flex justify-between ${bold ? 'text-base font-black' : 'text-[#6B6259]'}`}><span>{label}</span><span>{value}</span></div>
);

function ItemCard({ item, cat, addons, onAdd, delay }) {
  const [ids, setIds] = useState([]);
  const toggle = (id) => setIds((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const extra = addonPrice(addons, ids);
  const sizes = [['R', item.price_r], ['L', item.price_l]].filter(([, p]) => p != null);
  return (
    <div className={`${cls.card} anim-up relative flex flex-col gap-3 overflow-hidden p-4 transition hover:-translate-y-0.5 hover:shadow-md ${item.sold_out ? 'opacity-50' : ''}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: cat.color }} />
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-bold leading-tight">{item.name}</h3>
          <p className="text-xs text-[#6B6259]">{item.descr}</p>
        </div>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: cat.color }}>{item.sold_out ? 'Sold out' : cat.name}</span>
      </div>
      {addons.length > 0 && !item.sold_out && (
        <div className="flex flex-wrap gap-1.5">
          {addons.map((a) => (
            <button key={a.id} onClick={() => toggle(a.id)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${ids.includes(a.id) ? 'bg-[#1F3B2C] text-[#FBF5EA]' : 'bg-[#FADCDF]'}`}>
              + {a.name} ₹{Number(a.price_r)}
            </button>
          ))}
        </div>
      )}
      <div className="mt-auto flex gap-2">
        {sizes.map(([size, price]) => (
          <button key={size} disabled={item.sold_out} onClick={() => onAdd(item, size, ids)} className={`${cls.btn} flex flex-1 items-center justify-center gap-1`}>
            <Plus className="h-3.5 w-3.5" />{sizes.length > 1 ? `${size} · ` : ''}{inr(Number(price) + extra)}
          </button>
        ))}
      </div>
    </div>
  );
}

function PromoBox({ promo, setPromo, subtotal }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const apply = async () => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    const { data } = await supabase.from('promos').select('*').eq('code', c).eq('active', true).maybeSingle();
    if (!data) return setMsg('Invalid or expired code');
    if (subtotal < Number(data.min_order)) return setMsg(`Minimum order ${inr(data.min_order)} for this code`);
    setPromo(data); setMsg(''); setCode('');
  };
  if (promo) return (
    <div className="flex items-center justify-between rounded-xl bg-[#E6F2EC] px-3 py-2 text-xs font-bold">
      <span className="flex items-center gap-1"><Ticket className="h-4 w-4" /> {promo.code} applied</span>
      <button onClick={() => setPromo(null)}><X className="h-4 w-4" /></button>
    </div>
  );
  return (
    <div>
      <div className="flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Promo code" className={cls.input} />
        <button onClick={apply} className={cls.btnGhost}>Apply</button>
      </div>
      {msg && <p className="mt-1 text-xs text-[#C0392B]">{msg}</p>}
    </div>
  );
}

function LoyaltyModal({ onClose, onDone }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [birthday, setBirthday] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setError('');
    if (!/^\d{10}$/.test(phone)) return setError('Enter a 10-digit mobile number');
    if (!/^\d{4}$/.test(pin)) return setError('PIN must be 4 digits');
    if (mode === 'register' && !name.trim()) return setError('Enter your name');
    setBusy(true);
    const { data, error: err } = mode === 'login'
      ? await supabase.rpc('customer_login', { p_phone: phone, p_pin: pin })
      : await supabase.rpc('customer_register', { p_name: name.trim(), p_phone: phone, p_pin: pin, p_birthday: birthday || null });
    setBusy(false);
    if (err) return setError(err.message);
    onDone(data);
  };

  const tabCls = (m) => `flex-1 rounded-xl py-2 text-xs font-bold ${mode === m ? 'bg-[#1F3B2C] text-[#FBF5EA]' : 'bg-[#FADCDF]'}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F3B2C]/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className={`${cls.card} anim-pop w-full max-w-sm space-y-4 p-6`}>
        <h3 className="text-center font-serif text-xl font-bold">Loyalty stamps</h3>
        <p className="text-center text-xs text-[#6B6259]">1 stamp per order · {REWARD.stamps} stamps = {REWARD.label}</p>
        <div className="flex gap-2">
          <button type="button" className={tabCls('login')} onClick={() => setMode('login')}>I have an account</button>
          <button type="button" className={tabCls('register')} onClick={() => setMode('register')}>I'm new here</button>
        </div>
        {mode === 'register' && <div><label className={cls.label}>Name</label><input value={name} onChange={(e) => setName(e.target.value)} className={cls.input} /></div>}
        <div><label className={cls.label}>Mobile number</label><input inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} className={cls.input} /></div>
        <div><label className={cls.label}>{mode === 'register' ? 'Create a 4-digit PIN' : '4-digit PIN'}</label><input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} className={cls.input} /></div>
        {mode === 'register' && <div><label className={cls.label}>Birthday (optional · birthday treat 🎂)</label><input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className={cls.input} /></div>}
        {error && <p className="text-xs font-bold text-[#C0392B]">{error}</p>}
        <button type="submit" disabled={busy} className={`${cls.btn} w-full`}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</button>
        <p className="text-center text-[11px] text-[#6B6259]">Forgot your PIN? Ask the barista to reset it.</p>
        <button type="button" onClick={onClose} className="w-full text-xs font-bold text-[#6B6259]">Cancel</button>
      </form>
    </div>
  );
}
