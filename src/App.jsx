import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Coffee, Lock, CheckCircle, Plus, Minus, Trash2, 
  ChefHat, BarChart3, Package, Volume2, Edit3, LogOut, 
  History, RotateCcw, Check, Clock, TrendingUp, AlertCircle, Tag, Ticket
} from 'lucide-react';
import { supabase } from './supabase';

const playOrderChime = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, ctx.currentTime); 
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); 
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    console.log("Audio alert muted");
  }
};

export default function App() {
  const [activeRole, setActiveRole] = useState('customer');
  const [authenticatedRole, setAuthenticatedRole] = useState(
    sessionStorage.getItem('pop_auth_role') || null
  );

  const BARISTA_PIN = "2468";
  const OWNER_PASSWORD = "Admin@PopPour2026";

  const [showPinModal, setShowPinModal] = useState(false);
  const [targetRole, setTargetRole] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState('');

  const handleRoleSwitch = (role) => {
    if (role === 'customer') {
      setActiveRole('customer');
      return;
    }

    if (authenticatedRole === role) {
      setActiveRole(role);
      return;
    }

    setTargetRole(role);
    setPinInput('');
    setAuthError('');
    setShowPinModal(true);
  };

  const verifyAccess = (e) => {
    e.preventDefault();
    if (targetRole === 'shopkeeper' && pinInput === BARISTA_PIN) {
      setAuthenticatedRole('shopkeeper');
      sessionStorage.setItem('pop_auth_role', 'shopkeeper');
      setActiveRole('shopkeeper');
      setShowPinModal(false);
    } else if (targetRole === 'owner' && pinInput === OWNER_PASSWORD) {
      setAuthenticatedRole('owner');
      sessionStorage.setItem('pop_auth_role', 'owner');
      setActiveRole('owner');
      setShowPinModal(false);
    } else {
      setAuthError('Access Denied. Invalid Credentials.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('pop_auth_role');
    setAuthenticatedRole(null);
    setActiveRole('customer');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-pink-500 selection:text-white">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-pink-500/30">
              P&P
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
                Pop & Pour Suite
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Enterprise QSR Operating System</p>
            </div>
          </div>

          <div className="flex items-center bg-slate-800/80 p-1.5 rounded-2xl gap-1 border border-slate-700/60 shadow-inner">
            <button
              onClick={() => handleRoleSwitch('customer')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeRole === 'customer' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              🥤 Customer Kiosk
            </button>
            <button
              onClick={() => handleRoleSwitch('shopkeeper')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeRole === 'shopkeeper' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ChefHat className="w-4 h-4" /> Barista KDS
            </button>
            <button
              onClick={() => handleRoleSwitch('owner')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeRole === 'owner' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Executive MIS
            </button>

            {authenticatedRole && activeRole !== 'customer' && (
              <button
                onClick={handleLogout}
                className="ml-2 px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-red-500/20"
                title="Logout Staff Session"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {activeRole === 'customer' && <CustomerKiosk />}
        {activeRole === 'shopkeeper' && <ShopkeeperKDS />}
        {activeRole === 'owner' && <ExecutiveMIS />}
      </main>

      {showPinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-700 text-slate-100">
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-pink-500/10 text-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-pink-500/20">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">
                {targetRole === 'owner' ? 'Executive Password Required' : 'Barista Staff Access'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {targetRole === 'owner' ? 'Enter master owner password.' : 'Enter 4-digit staff PIN (Default: 2468).'}
              </p>
            </div>

            <form onSubmit={verifyAccess} className="space-y-4">
              <input
                type="password"
                maxLength={targetRole === 'shopkeeper' ? 4 : 50}
                placeholder={targetRole === 'shopkeeper' ? "••••" : "Password"}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center text-2xl tracking-widest py-3 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:outline-none bg-slate-900 text-white"
                autoFocus
              />
              {authError && <p className="text-xs text-red-400 text-center font-semibold">{authError}</p>}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-3 border border-slate-700 text-slate-300 font-semibold rounded-2xl hover:bg-slate-700/50 text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-2xl hover:opacity-90 shadow-lg text-sm transition"
                >
                  Authenticate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =================== 1. CUSTOMER KIOSK & COUPON ENGINE ===================
function CustomerKiosk() {
  const [customer, setCustomer] = useState({ name: '', phone: '', tableNo: 'Table 1', orderType: 'Dine-In' });
  const [isIdentified, setIsIdentified] = useState(false);
  
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [pastOrders, setPastOrders] = useState([]);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    const savedCustomer = localStorage.getItem('pop_customer_info');
    const savedOrderId = localStorage.getItem('pop_active_order_id');

    if (savedCustomer) {
      const parsed = JSON.parse(savedCustomer);
      setCustomer(parsed);
      setIsIdentified(true);
      fetchCustomerHistory(parsed.phone);

      if (savedOrderId) {
        supabase
          .from('orders')
          .select('*')
          .eq('id', savedOrderId)
          .single()
          .then(({ data }) => {
            if (data && data.status !== 'Completed') {
              setActiveOrder(data);
            } else {
              localStorage.removeItem('pop_active_order_id');
            }
          });
      }
    }
  }, []);

  const fetchCustomerHistory = async (phone) => {
    if (!phone) return;
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setPastOrders(data);
  };

  useEffect(() => {
    async function fetchMenu() {
      const { data } = await supabase.from('items').select('*').order('id', { ascending: true });
      if (data) setMenu(data);
    }
    fetchMenu();

    const sub = supabase.channel('customer-menu-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => fetchMenu())
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, []);

  useEffect(() => {
    if (!activeOrder) return;
    const sub = supabase.channel('customer-order-tracker')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${activeOrder.id}` }, (payload) => {
        setActiveOrder(payload.new);
      }).subscribe();

    return () => supabase.removeChannel(sub);
  }, [activeOrder?.id]);

  const handleStartSession = (e) => {
    e.preventDefault();
    if (customer.name && customer.phone) {
      localStorage.setItem('pop_customer_info', JSON.stringify(customer));
      setIsIdentified(true);
      fetchCustomerHistory(customer.phone);
    }
  };

  const addToCart = (item) => {
    if (item.is_sold_out) return;
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
  };

  const reorderPastItems = (pastItems) => {
    setCart(pastItems);
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  // Pricing & Coupon Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      discountAmount = (subtotal * appliedCoupon.discount_value) / 100;
    } else if (appliedCoupon.discount_type === 'flat') {
      discountAmount = appliedCoupon.discount_value;
    }
    if (discountAmount > subtotal) discountAmount = subtotal;
  }

  const totalPayable = subtotal - discountAmount; 
  const cogsTotal = cart.reduce((acc, item) => acc + ((item.cogs || 40) * item.qty), 0);

  const applyCoupon = async () => {
    setCouponError('');
    if (!couponCode.trim()) return;

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.trim().toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !data) {
      setCouponError('Invalid or expired coupon code');
      setAppliedCoupon(null);
    } else if (subtotal < (data.min_order_value || 0)) {
      setCouponError(`Min order value for ${data.code} is ₹${data.min_order_value}`);
      setAppliedCoupon(null);
    } else {
      setAppliedCoupon(data);
      setCouponError('');
    }
  };

  const handlePlaceOrder = async (payMethod) => {
    if (cart.length === 0) return;

    const tokenNum = '#' + Math.floor(100 + Math.random() * 900);
    const orderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
    
    const newOrder = {
      id: orderId,
      token_no: tokenNum,
      customer_name: customer.name,
      phone: customer.phone,
      order_type: customer.orderType,
      table_no: customer.orderType === 'Dine-In' ? customer.tableNo : 'Takeaway',
      items: cart,
      subtotal: subtotal,
      discount_applied: discountAmount,
      coupon_code: appliedCoupon?.code || null,
      total_payable: totalPayable,
      cogs_total: cogsTotal,
      payment_method: payMethod,
      payment_status: 'Unpaid',
      status: 'Placed'
    };

    const { error } = await supabase.from('orders').insert([newOrder]);
    if (error) {
      alert('Order placement failed: ' + error.message);
    } else {
      setActiveOrder(newOrder);
      localStorage.setItem('pop_active_order_id', orderId);
      setCart([]);
      setAppliedCoupon(null);
      setCouponCode('');
      fetchCustomerHistory(customer.phone);
    }
  };

  if (!isIdentified) {
    return (
      <div className="max-w-md mx-auto mt-8 bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-700 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-3 shadow-lg shadow-pink-500/30">
            🧋
          </div>
          <h2 className="text-2xl font-black text-white">Welcome to Pop & Pour</h2>
          <p className="text-xs text-slate-400 mt-1">Enter details to generate your digital order token.</p>
        </div>

        <form onSubmit={handleStartSession} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Your Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Vikram Sharma"
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              className="w-full px-4 py-3 border border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-pink-500 focus:outline-none bg-slate-900 text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Mobile Number</label>
            <input
              type="tel"
              required
              placeholder="e.g. 9876543210"
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              className="w-full px-4 py-3 border border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-pink-500 focus:outline-none bg-slate-900 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Channel</label>
              <select
                value={customer.orderType}
                onChange={(e) => setCustomer({ ...customer, orderType: e.target.value })}
                className="w-full px-3 py-3 border border-slate-700 rounded-2xl text-xs font-bold bg-slate-900 text-white"
              >
                <option value="Dine-In">Dine-In</option>
                <option value="Takeaway">Takeaway</option>
              </select>
            </div>

            {customer.orderType === 'Dine-In' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Table</label>
                <select
                  value={customer.tableNo}
                  onChange={(e) => setCustomer({ ...customer, tableNo: e.target.value })}
                  className="w-full px-3 py-3 border border-slate-700 rounded-2xl text-xs font-bold bg-slate-900 text-white"
                >
                  <option value="Table 1">Table 1</option>
                  <option value="Table 2">Table 2</option>
                  <option value="Table 3">Table 3</option>
                  <option value="Table 4">Table 4</option>
                  <option value="Table 5">Table 5</option>
                </select>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-2xl hover:opacity-95 transition shadow-lg shadow-pink-500/25 text-sm"
          >
            Start Crafting Order 🍹
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl flex justify-between items-center">
          <div>
            <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              {customer.name} • {customer.orderType === 'Dine-In' ? customer.tableNo : 'Takeaway'}
            </span>
            <h2 className="text-2xl font-black mt-2">Craft Beverages Menu 🧋</h2>
            <p className="text-pink-100 text-xs mt-1">Select drinks & apply discount coupons.</p>
          </div>
          <button onClick={() => setIsIdentified(false)} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl font-semibold">
            Change
          </button>
        </div>

        {pastOrders.length > 0 && (
          <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl p-5 border border-slate-700 shadow-sm">
            <h3 className="text-xs font-black text-pink-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <History className="w-4 h-4 text-pink-400" /> Your Favorites Memory
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {pastOrders.map((pOrd) => (
                <div key={pOrd.id} className="min-w-[210px] bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-pink-400">{pOrd.token_no || pOrd.id}</span>
                    <p className="text-xs font-bold text-slate-200 line-clamp-1 mt-1">
                      {pOrd.items?.map(i => `${i.name} (${i.qty})`).join(', ')}
                    </p>
                    <p className="text-xs font-black text-white mt-1">₹{pOrd.total_payable}</p>
                  </div>
                  <button
                    onClick={() => reorderPastItems(pOrd.items)}
                    className="mt-3 py-1.5 bg-pink-500/20 text-pink-300 border border-pink-500/30 rounded-xl text-[11px] font-bold hover:bg-pink-500/30 transition flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Re-order
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {menu.map((item) => (
            <div key={item.id} className={`bg-slate-800/80 backdrop-blur-md rounded-3xl p-5 border border-slate-700/80 shadow-md flex flex-col justify-between transition hover:border-pink-500/50 ${item.is_sold_out ? 'opacity-40 bg-slate-900' : ''}`}>
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-pink-500/10 text-pink-400 rounded-full border border-pink-500/20">{item.category}</span>
                  {item.is_sold_out ? (
                    <span className="text-xs font-bold px-2.5 py-1 bg-red-500/20 text-red-400 rounded-xl">SOLD OUT</span>
                  ) : (
                    <span className="text-base font-black text-white">₹{item.price}</span>
                  )}
                </div>
                <h3 className="font-bold text-white text-base mb-1">{item.name}</h3>
              </div>

              <button
                disabled={item.is_sold_out}
                onClick={() => addToCart(item)}
                className={`mt-4 w-full py-3 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 ${
                  item.is_sold_out 
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 shadow-md'
                }`}
              >
                <Plus className="w-4 h-4" /> Add to Cup
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-700 shadow-xl sticky top-24">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-pink-400" /> Current Tray
          </h3>

          {cart.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Coffee className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Tray is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="divide-y divide-slate-700 max-h-48 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2.5">
                    <div>
                      <h4 className="font-semibold text-xs text-slate-200">{item.name}</h4>
                      <p className="text-[11px] text-slate-400">₹{item.price} × {item.qty}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 bg-slate-700 rounded-lg flex items-center justify-center font-bold text-white text-xs"><Minus className="w-3 h-3" /></button>
                      <span className="font-bold text-xs text-white">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 bg-slate-700 rounded-lg flex items-center justify-center font-bold text-white text-xs"><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Code Input */}
              <div className="pt-2 border-t border-slate-700">
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-pink-400" /> Have a Promo Code?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. WELCOME10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 border border-slate-700 rounded-xl text-xs bg-slate-900 text-white focus:outline-none uppercase"
                  />
                  <button
                    onClick={applyCoupon}
                    className="px-3.5 py-2 bg-pink-500/20 text-pink-300 border border-pink-500/30 rounded-xl text-xs font-bold hover:bg-pink-500/30 transition"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-[10px] text-red-400 font-semibold mt-1">{couponError}</p>}
                {appliedCoupon && (
                  <div className="mt-1.5 flex justify-between items-center bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-emerald-400 text-[11px] font-bold">
                    <span>Coupon {appliedCoupon.code} Applied!</span>
                    <button onClick={() => setAppliedCoupon(null)} className="text-red-400 hover:text-red-300">×</button>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-700 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Discount</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-white pt-1 border-t border-slate-700">
                  <span>Total Payable</span>
                  <span className="text-pink-400">₹{totalPayable}</span>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handlePlaceOrder('UPI Soundbox / QR')}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 rounded-2xl hover:opacity-90 transition shadow-lg shadow-pink-500/20 text-xs"
                  >
                    Generate Token & Pay via UPI (₹{totalPayable})
                  </button>
                  <button
                    onClick={() => handlePlaceOrder('Cash at Counter')}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2.5 rounded-2xl transition text-xs border border-slate-600"
                  >
                    Pay Cash at Counter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {activeOrder && (
          <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-6 text-slate-100 shadow-2xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400">Your Active Order Token</span>
              <span className="text-2xl font-black text-pink-400 bg-pink-500/10 px-3 py-1 rounded-xl border border-pink-500/30">
                {activeOrder.token_no || activeOrder.id}
              </span>
            </div>

            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-700 text-center space-y-2">
              <p className="text-xs font-bold text-amber-400 flex items-center justify-center gap-1">
                <AlertCircle className="w-4 h-4" /> Show Token {activeOrder.token_no} at Counter
              </p>
              <p className="text-[11px] text-slate-400">Mention token while paying on UPI Soundbox or Cash.</p>
              
              <div className="pt-2">
                <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide ${
                  activeOrder.status === 'Placed' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  activeOrder.status === 'Preparing' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse' :
                  activeOrder.status === 'Ready' ? 'bg-emerald-500 text-white font-bold shadow-lg' : 'bg-slate-700 text-slate-300'
                }`}>
                  {activeOrder.payment_status === 'Unpaid' && activeOrder.status === 'Placed' 
                    ? 'Waiting Counter Payment' 
                    : activeOrder.status}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =================== 2. BARISTA KDS ===================
function ShopkeeperKDS() {
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [kdsTab, setKdsTab] = useState('active');

  const loadAll = async () => {
    const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (oData) setOrders(oData);

    const { data: mData } = await supabase.from('items').select('*').order('id', { ascending: true });
    if (mData) setMenu(mData);
  };

  useEffect(() => {
    loadAll();

    const sub = supabase.channel('kds-token-sync')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        playOrderChime();
        loadAll();
      })
      .on('postgres_changes', { event: '*', schema: 'public' }, () => loadAll())
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, []);

  const approveTokenAndPrep = async (orderId) => {
    await supabase.from('orders').update({ payment_status: 'Paid', status: 'Preparing' }).eq('id', orderId);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
  };

  const toggleSoldOut = async (itemId, currentState) => {
    await supabase.from('items').update({ is_sold_out: !currentState }).eq('id', itemId);
  };

  const activeOrders = orders.filter(o => o.status !== 'Completed');
  const completedOrders = orders.filter(o => o.status === 'Completed');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center bg-slate-800/80 backdrop-blur-md p-6 rounded-3xl border border-slate-700 shadow-md gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Barista Kitchen Display (KDS)</h2>
          <p className="text-xs text-slate-400">Approve tokens on payment soundbox & manage beverage queue</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900/80 p-1 rounded-2xl flex border border-slate-700 text-xs font-bold">
            <button
              onClick={() => setKdsTab('active')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                kdsTab === 'active' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" /> Active Queue ({activeOrders.length})
            </button>
            <button
              onClick={() => setKdsTab('completed')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                kdsTab === 'completed' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Check className="w-4 h-4" /> History ({completedOrders.length})
            </button>
          </div>

          <button onClick={playOrderChime} className="px-3 py-2 bg-pink-500/10 text-pink-400 rounded-2xl text-xs font-bold border border-pink-500/20 flex items-center gap-1 hover:bg-pink-500/20">
            <Volume2 className="w-4 h-4" /> Chime Test
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {kdsTab === 'active' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeOrders.length === 0 ? (
                <div className="col-span-2 bg-slate-800/50 rounded-3xl p-12 text-center border border-slate-700 text-slate-500 font-medium">
                  No active pending orders in queue.
                </div>
              ) : (
                activeOrders.map((order) => (
                  <div key={order.id} className={`bg-slate-800/80 backdrop-blur-md rounded-3xl p-5 border shadow-md flex flex-col justify-between ${
                    order.payment_status === 'Unpaid' ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-700'
                  }`}>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-mono font-black text-sm bg-pink-500/20 text-pink-300 border border-pink-500/30 px-3 py-1 rounded-xl">
                          {order.token_no || order.id}
                        </span>
                        <span className="text-[10px] font-black px-2.5 py-1 bg-slate-700 text-slate-300 rounded-full uppercase">
                          {order.order_type} ({order.table_no})
                        </span>
                      </div>

                      <p className="text-xs font-bold text-slate-200 mb-2">{order.customer_name} • {order.phone}</p>

                      <div className="space-y-1.5 mb-4 border-t border-b border-slate-700/60 py-2">
                        {order.items?.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-slate-300 font-medium">• {it.name}</span>
                            <span className="font-bold text-white">x{it.qty}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs">
                        <p className="text-slate-400 font-medium">Bill: <strong className="text-white">₹{order.total_payable}</strong></p>
                        {order.discount_applied > 0 && (
                          <p className="text-[10px] text-emerald-400">Coupon Discount: -₹{order.discount_applied}</p>
                        )}
                      </div>

                      <div className="flex gap-1">
                        {order.payment_status === 'Unpaid' && (
                          <button
                            onClick={() => approveTokenAndPrep(order.id)}
                            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black rounded-xl text-xs shadow-md hover:opacity-90"
                          >
                            Approve Token & Prep
                          </button>
                        )}
                        {order.payment_status === 'Paid' && order.status === 'Preparing' && (
                          <button onClick={() => updateOrderStatus(order.id, 'Ready')} className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">Mark Ready</button>
                        )}
                        {order.status === 'Ready' && (
                          <button onClick={() => updateOrderStatus(order.id, 'Completed')} className="px-3.5 py-2 bg-slate-900 text-white border border-slate-700 rounded-xl text-xs font-bold">Complete</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedOrders.length === 0 ? (
                <div className="col-span-2 bg-slate-800/50 rounded-3xl p-12 text-center border border-slate-700 text-slate-500 font-medium">
                  No completed orders found in history.
                </div>
              ) : (
                completedOrders.map((order) => (
                  <div key={order.id} className="bg-slate-800/40 rounded-3xl p-5 border border-slate-700/60 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-mono font-bold text-xs bg-slate-700 px-2.5 py-1 rounded-xl text-slate-300">{order.token_no || order.id}</span>
                        <span className="text-[10px] font-black px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full uppercase">Fulfilled</span>
                      </div>
                      <p className="text-xs font-bold text-slate-300 mb-2">{order.customer_name} • ₹{order.total_payable}</p>
                      <div className="space-y-1 mb-3">
                        {order.items?.map((it, idx) => (
                          <p key={idx} className="text-xs text-slate-400">• {it.name} x{it.qty}</p>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'Preparing')}
                      className="py-1.5 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-bold transition self-end flex items-center gap-1 border border-slate-600"
                    >
                      <RotateCcw className="w-3 h-3" /> Re-open Ticket
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-700 shadow-md">
            <h3 className="font-bold text-white text-base mb-1 flex items-center gap-2">
              <Package className="w-4 h-4 text-pink-400" /> Menu Stock Control
            </h3>
            <p className="text-xs text-slate-400 mb-4">Toggle drink availability on customer kiosks in real-time.</p>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {menu.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 rounded-2xl border border-slate-700 bg-slate-900/60">
                  <div>
                    <h4 className="font-bold text-xs text-white">{item.name}</h4>
                    <span className={`text-[10px] font-bold ${item.is_sold_out ? 'text-red-400' : 'text-emerald-400'}`}>
                      {item.is_sold_out ? 'Sold Out' : 'Available'}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleSoldOut(item.id, item.is_sold_out)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      item.is_sold_out ? 'bg-emerald-600 text-white' : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                    }`}
                  >
                    {item.is_sold_out ? 'Restock' : 'Sold Out'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =================== 3. EXECUTIVE MIS & COUPON MANAGER ===================
function ExecutiveMIS() {
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [coupons, setCoupons] = useState([]);

  // Date Filtering State
  const [period, setPeriod] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // New Item State
  const [newItem, setNewItem] = useState({ name: '', category: 'Boba Teas', price: '', cogs: '' });

  // New Coupon State
  const [newCoupon, setNewCoupon] = useState({ code: '', discount_type: 'percentage', discount_value: '', min_order_value: '0' });

  const loadData = async () => {
    const { data: oData } = await supabase.from('orders').select('*');
    if (oData) setOrders(oData);

    const { data: mData } = await supabase.from('items').select('*').order('id', { ascending: true });
    if (mData) setMenu(mData);

    const { data: cData } = await supabase.from('coupons').select('*').order('id', { ascending: true });
    if (cData) setCoupons(cData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getFilteredOrders = () => {
    const now = new Date();
    return orders.filter(order => {
      const oDate = new Date(order.created_at);
      if (period === 'today') {
        return oDate.toDateString() === now.toDateString();
      } else if (period === 'yesterday') {
        const yest = new Date(now);
        yest.setDate(now.getDate() - 1);
        return oDate.toDateString() === yest.toDateString();
      } else if (period === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return oDate >= weekAgo;
      } else if (period === 'month') {
        return oDate.getMonth() === now.getMonth() && oDate.getFullYear() === now.getFullYear();
      } else if (period === 'ytd') {
        return oDate.getFullYear() === now.getFullYear();
      } else if (period === 'custom' && startDate && endDate) {
        return oDate >= new Date(startDate) && oDate <= new Date(endDate + 'T23:59:59');
      }
      return true;
    });
  };

  const filteredOrders = getFilteredOrders();
  const grossSales = filteredOrders.reduce((acc, c) => acc + (c.total_payable || 0), 0);
  const cogsTotal = filteredOrders.reduce((acc, c) => acc + (c.cogs_total || 0), 0);
  const grossProfit = grossSales - cogsTotal;
  const netMargin = grossSales > 0 ? ((grossProfit / grossSales) * 100).toFixed(1) : 0;
  const aov = filteredOrders.length > 0 ? (grossSales / filteredOrders.length).toFixed(0) : 0;

  // Add New Item
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return;

    const payload = {
      name: newItem.name,
      category: newItem.category,
      price: Number(newItem.price),
      cogs: Number(newItem.cogs) || 40,
      is_sold_out: false
    };

    const { error } = await supabase.from('items').insert([payload]);
    if (error) {
      alert('Error adding menu item: ' + error.message);
    } else {
      setNewItem({ name: '', category: 'Boba Teas', price: '', cogs: '' });
      loadData();
    }
  };

  const handleUpdatePrice = async (id, currentPrice) => {
    const newPrice = prompt('Enter new price (₹):', currentPrice);
    if (newPrice && !isNaN(newPrice)) {
      await supabase.from('items').update({ price: Number(newPrice) }).eq('id', id);
      loadData();
    }
  };

  const handleDeleteItem = async (id) => {
    if (confirm('Permanently remove this menu item?')) {
      await supabase.from('items').delete().eq('id', id);
      loadData();
    }
  };

  // Add Coupon
  const handleAddCoupon = async (e) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.discount_value) return;

    const payload = {
      code: newCoupon.code.trim().toUpperCase(),
      discount_type: newCoupon.discount_type,
      discount_value: Number(newCoupon.discount_value),
      min_order_value: Number(newCoupon.min_order_value) || 0,
      is_active: true
    };

    const { error } = await supabase.from('coupons').insert([payload]);
    if (error) {
      alert('Error creating coupon: ' + error.message);
    } else {
      setNewCoupon({ code: '', discount_type: 'percentage', discount_value: '', min_order_value: '0' });
      loadData();
    }
  };

  const toggleCouponStatus = async (id, currentStatus) => {
    await supabase.from('coupons').update({ is_active: !currentStatus }).eq('id', id);
    loadData();
  };

  const handleDeleteCoupon = async (id) => {
    if (confirm('Delete this promotional coupon code?')) {
      await supabase.from('coupons').delete().eq('id', id);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-3xl border border-slate-700 shadow-md flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Executive MIS Financial Dashboard</h2>
          <p className="text-xs text-slate-400">Real-time revenue, COGS, margins, and active discount promotions</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-900/80 p-1 rounded-2xl flex border border-slate-700 text-xs font-bold">
            {['today', 'yesterday', 'week', 'month', 'ytd', 'custom'].map((pKey) => (
              <button
                key={pKey}
                onClick={() => setPeriod(pKey)}
                className={`px-3 py-1.5 rounded-xl uppercase tracking-wider transition ${
                  period === pKey ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                {pKey}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-800 text-white px-2 py-1 rounded-xl border border-slate-700 focus:outline-none"
              />
              <span className="text-slate-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-800 text-white px-2 py-1 rounded-xl border border-slate-700 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl p-5 border border-slate-700 shadow-md">
          <p className="text-xs text-slate-400 font-medium flex items-center justify-between">
            Gross Collections <TrendingUp className="w-4 h-4 text-emerald-400" />
          </p>
          <h3 className="text-2xl font-black text-white mt-1">₹{grossSales}</h3>
          <p className="text-[10px] text-slate-500 mt-1">{filteredOrders.length} Orders</p>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl p-5 border border-slate-700 shadow-md">
          <p className="text-xs text-slate-400 font-medium">Raw Ingredient COGS</p>
          <h3 className="text-2xl font-black text-red-400 mt-1">₹{cogsTotal}</h3>
          <p className="text-[10px] text-slate-500 mt-1">Direct Costs</p>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl p-5 border border-slate-700 shadow-md">
          <p className="text-xs text-slate-400 font-medium">Net Gross Profit</p>
          <h3 className="text-2xl font-black text-emerald-400 mt-1">₹{grossProfit}</h3>
          <p className="text-[10px] text-slate-500 mt-1">Sales - COGS</p>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl p-5 border border-slate-700 shadow-md">
          <p className="text-xs text-slate-400 font-medium">Operating Margin</p>
          <h3 className="text-2xl font-black text-purple-400 mt-1">{netMargin}%</h3>
          <p className="text-[10px] text-slate-500 mt-1">Net %</p>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl p-5 border border-slate-700 shadow-md">
          <p className="text-xs text-slate-400 font-medium">Avg Order Value (AOV)</p>
          <h3 className="text-2xl font-black text-pink-400 mt-1">₹{aov}</h3>
          <p className="text-[10px] text-slate-500 mt-1">Per Ticket</p>
        </div>
      </div>

      {/* Coupon Manager & New Coupon Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-700 shadow-md space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Ticket className="w-5 h-5 text-pink-400" /> Promotional Coupon Codes
          </h3>

          <div className="divide-y divide-slate-700/60 max-h-[300px] overflow-y-auto pr-1">
            {coupons.map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2.5 py-0.5 rounded-lg">
                      {c.code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${c.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {c.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Discount: <strong className="text-white">{c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`}</strong> | Min Bill: ₹{c.min_order_value}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleCouponStatus(c.id, c.is_active)}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-bold transition"
                  >
                    {c.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDeleteCoupon(c.id)}
                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition border border-red-500/20"
                    title="Delete Coupon"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Coupon Form */}
        <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-700 shadow-md h-fit">
          <h3 className="font-bold text-white text-base mb-1 flex items-center gap-2">
            <Plus className="w-5 h-5 text-purple-400" /> Create Promo Coupon
          </h3>
          <p className="text-xs text-slate-400 mb-4">Set custom promo codes for customer discounts.</p>

          <form onSubmit={handleAddCoupon} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Coupon Code</label>
              <input
                type="text"
                required
                placeholder="e.g. SUMMER20"
                value={newCoupon.code}
                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 border border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-pink-500 focus:outline-none bg-slate-900 text-white uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Type</label>
                <select
                  value={newCoupon.discount_type}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-700 rounded-xl text-xs font-bold bg-slate-900 text-white"
                >
                  <option value="percentage">% Percentage</option>
                  <option value="flat">₹ Flat Amount</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Discount Value</label>
                <input
                  type="number"
                  required
                  placeholder={newCoupon.discount_type === 'percentage' ? 'e.g. 20 (%)' : 'e.g. 50 (₹)'}
                  value={newCoupon.discount_value}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-pink-500 focus:outline-none bg-slate-900 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Min Bill Amount (₹)</label>
              <input
                type="number"
                placeholder="e.g. 150 (0 for no limit)"
                value={newCoupon.min_order_value}
                onChange={(e) => setNewCoupon({ ...newCoupon, min_order_value: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-pink-500 focus:outline-none bg-slate-900 text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-2xl hover:opacity-90 transition shadow-lg shadow-pink-500/20 text-xs mt-2"
            >
              Issue Coupon Code
            </button>
          </form>
        </div>
      </div>

      {/* Dynamic Menu Catalog Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-700 shadow-md space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-pink-400" /> Active Menu Catalog
          </h3>

          <div className="divide-y divide-slate-700/60 max-h-[350px] overflow-y-auto pr-1">
            {menu.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-white">{item.name}</h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-700 rounded-md text-slate-300">{item.category}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Price: <strong className="text-white">₹{item.price}</strong> | COGS: ₹{item.cogs}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdatePrice(item.id, item.price)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-bold transition"
                  >
                    Edit Price
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition border border-red-500/20"
                    title="Delete Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Beverage Form */}
        <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-700 shadow-md h-fit">
          <h3 className="font-bold text-white text-base mb-1 flex items-center gap-2">
            <Plus className="w-5 h-5 text-purple-400" /> Add New Beverage
          </h3>
          <p className="text-xs text-slate-400 mb-4">Instantly adds drink to live customer menus.</p>

          <form onSubmit={handleAddItem} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Item Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Taro Boba Tea"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-pink-500 focus:outline-none bg-slate-900 text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Category</label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-700 rounded-xl text-xs font-bold bg-slate-900 text-white"
              >
                <option value="Boba Teas">Boba Teas</option>
                <option value="Sparkling Sodas">Sparkling Sodas</option>
                <option value="Fruit Teas">Fruit Teas</option>
                <option value="Snacks & Desserts">Snacks & Desserts</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Price (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 190"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-pink-500 focus:outline-none bg-slate-900 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">COGS (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 45"
                  value={newItem.cogs}
                  onChange={(e) => setNewItem({ ...newItem, cogs: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-pink-500 focus:outline-none bg-slate-900 text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-2xl hover:opacity-90 transition shadow-lg shadow-pink-500/20 text-xs mt-2"
            >
              Add to Live Menu
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}