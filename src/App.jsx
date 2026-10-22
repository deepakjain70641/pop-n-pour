import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Coffee, Lock, Plus, Minus, Trash2, 
  ChefHat, BarChart3, Package, Volume2, Edit3, LogOut, 
  History, RotateCcw, Check, Clock, TrendingUp, AlertCircle, Tag, Ticket,
  Award, Sparkles, Sliders, ShieldCheck, Search, Users, KeyRound, ArrowRight
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
    console.log("Audio muted");
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
    <div className="min-h-screen bg-[#FFF7F8] text-[#0B2B20] font-sans selection:bg-[#E895A5] selection:text-white">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-[#F5D0D7] sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#0B2B20] text-[#F9CBD3] rounded-2xl flex items-center justify-center font-black text-xl shadow-md">
              P&P
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#0B2B20] flex items-center gap-1.5 font-serif">
                Pop & Pour <Sparkles className="w-4 h-4 text-[#E895A5]" />
              </h1>
              <p className="text-[10px] text-[#0B2B20]/70 font-black uppercase tracking-widest">SIP HAPPY • STAY HAPPY ♡</p>
            </div>
          </div>

          <div className="flex items-center bg-[#FFF0F3] p-1.5 rounded-2xl gap-1 border border-[#F5D0D7]">
            <button
              onClick={() => handleRoleSwitch('customer')}
              className={`px-3 md:px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                activeRole === 'customer' ? 'bg-[#0B2B20] text-[#F9CBD3] shadow-sm' : 'text-[#0B2B20] hover:bg-[#FCE1E6]'
              }`}
            >
              🥤 Kiosk
            </button>
            <button
              onClick={() => handleRoleSwitch('shopkeeper')}
              className={`px-3 md:px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                activeRole === 'shopkeeper' ? 'bg-[#0B2B20] text-[#F9CBD3] shadow-sm' : 'text-[#0B2B20] hover:bg-[#FCE1E6]'
              }`}
            >
              <ChefHat className="w-4 h-4" /> Barista
            </button>
            <button
              onClick={() => handleRoleSwitch('owner')}
              className={`px-3 md:px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                activeRole === 'owner' ? 'bg-[#0B2B20] text-[#F9CBD3] shadow-sm' : 'text-[#0B2B20] hover:bg-[#FCE1E6]'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Management
            </button>

            {authenticatedRole && activeRole !== 'customer' && (
              <button
                onClick={handleLogout}
                className="ml-1 px-3 py-2 bg-rose-100 text-rose-800 hover:bg-rose-200 rounded-xl text-xs font-black transition flex items-center gap-1 border border-rose-200"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-3 md:p-6 pb-24 md:pb-6">
        {activeRole === 'customer' && <CustomerKiosk />}
        {activeRole === 'shopkeeper' && <ShopkeeperKDS />}
        {activeRole === 'owner' && <ExecutiveMIS />}
      </main>

      {/* Staff Access Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-[#0B2B20]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFF7F8] rounded-3xl p-6 max-w-sm w-full shadow-2xl border-2 border-[#F5D0D7] text-[#0B2B20]">
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-[#FFF0F3] text-[#0B2B20] rounded-2xl flex items-center justify-center mx-auto mb-3 border border-[#F5D0D7]">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black">
                {targetRole === 'owner' ? 'Management Password' : 'Barista Staff Access'}
              </h3>
              <p className="text-xs text-[#0B2B20]/70 font-bold mt-1">
                {targetRole === 'owner' ? 'Enter owner credentials.' : 'Enter 4-digit PIN (Default: 2468).'}
              </p>
            </div>

            <form onSubmit={verifyAccess} className="space-y-4">
              <input
                type="password"
                maxLength={targetRole === 'shopkeeper' ? 4 : 50}
                placeholder={targetRole === 'shopkeeper' ? "••••" : "Password"}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center text-2xl tracking-widest py-3 border-2 border-[#F5D0D7] rounded-2xl focus:border-[#0B2B20] focus:outline-none bg-white text-[#0B2B20] font-black"
                autoFocus
              />
              {authError && <p className="text-xs text-rose-600 text-center font-bold">{authError}</p>}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-3 border border-[#F5D0D7] text-[#0B2B20] font-bold rounded-2xl hover:bg-[#FFF0F3] text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#0B2B20] text-[#F9CBD3] font-black rounded-2xl hover:bg-[#071D16] shadow-md text-sm transition"
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

// =================== 1. CUSTOMER KIOSK ===================
function CustomerKiosk() {
  const [customer, setCustomer] = useState({ name: '', phone: '', userPin: '', tableNo: 'Table 1', orderType: 'Dine-In' });
  const [isIdentified, setIsIdentified] = useState(false);

  const [pinStep, setPinStep] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [accountError, setAccountError] = useState('');
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [pastOrders, setPastOrders] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');

  const [showMobileTray, setShowMobileTray] = useState(false);
  const [selectedItemForCustom, setSelectedItemForCustom] = useState(null);
  const [customOptions, setCustomOptions] = useState({ size: 'Regular', sugar: '100% Standard', ice: 'Normal Ice', extraBoba: false });

  const [stamps, setStamps] = useState(0);

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
      fetchLoyaltyStamps(parsed.phone);

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

  const fetchLoyaltyStamps = async (phone) => {
    if (!phone) return;
    const { data } = await supabase.from('loyalty_stamps').select('*').eq('phone', phone).single();
    if (data) setStamps(data.stamp_count || 0);
  };

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

  const handleVerifyOrRegisterUser = async (e) => {
    e.preventDefault();
    setAccountError('');

    if (!customer.phone || customer.phone.length < 10) {
      setAccountError('Please enter a valid 10-digit mobile number');
      return;
    }

    setPinStep(true);
  };

  const handleConfirmPin = async (e) => {
    e.preventDefault();
    setAccountError('');

    if (enteredPin.length !== 4) {
      setAccountError('Security PIN must be 4 digits');
      return;
    }

    const { data: existingUser } = await supabase
      .from('loyalty_stamps')
      .select('*')
      .eq('phone', customer.phone)
      .single();

    if (existingUser && existingUser.user_pin) {
      if (existingUser.user_pin !== enteredPin) {
        setAccountError('Incorrect PIN! Please ask counter staff for an instant reset.');
        return;
      }
    } else {
      // Create new customer account record in management database
      await supabase.from('loyalty_stamps').upsert({
        phone: customer.phone,
        customer_name: customer.name,
        user_pin: enteredPin,
        stamp_count: existingUser?.stamp_count || 0
      });
    }

    const updatedCustomer = { ...customer, userPin: enteredPin };
    localStorage.setItem('pop_customer_info', JSON.stringify(updatedCustomer));
    setCustomer(updatedCustomer);
    setIsIdentified(true);
    fetchCustomerHistory(customer.phone);
    fetchLoyaltyStamps(customer.phone);
  };

  const openCustomModal = (item, defaultSize = 'Regular') => {
    setSelectedItemForCustom(item);
    setCustomOptions({
      size: defaultSize,
      sugar: '100% Standard',
      ice: 'Normal Ice',
      extraBoba: false
    });
  };

  const addCustomizedItemToCart = () => {
    if (!selectedItemForCustom) return;
    const item = selectedItemForCustom;
    const isLarge = customOptions.size === 'Large' && item.large_price;
    let basePrice = isLarge ? item.large_price : item.price;
    if (customOptions.extraBoba) basePrice += 30;

    const cartKey = `${item.id}-${customOptions.size}-${customOptions.sugar}-${customOptions.ice}-${customOptions.extraBoba ? 'boba' : 'noboba'}`;

    const existing = cart.find(c => c.cartKey === cartKey);
    if (existing) {
      setCart(cart.map(c => c.cartKey === cartKey ? { ...c, qty: c.qty + 1 } : c));
    } else {
      const displayName = `${item.name} (${customOptions.size}) • ${customOptions.sugar}, ${customOptions.ice}${customOptions.extraBoba ? ' + Chewy Boba' : ''}`;
      setCart([...cart, { ...item, name: displayName, cartKey: cartKey, size: customOptions.size, price: basePrice, qty: 1 }]);
    }

    setSelectedItemForCustom(null);
  };

  const reorderPastItems = (pastItems) => setCart(pastItems);

  const updateQty = (cartKey, delta) => {
    setCart(cart.map(item => {
      if (item.cartKey === cartKey) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  useEffect(() => {
    if (appliedCoupon) {
      if (subtotal < (appliedCoupon.min_order_value || 0)) {
        setAppliedCoupon(null);
        setCouponError(`Coupon ${appliedCoupon.code} unapplied (Requires min order ₹${appliedCoupon.min_order_value})`);
      }
    }
  }, [subtotal, appliedCoupon]);

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
  const cogsTotal = cart.reduce((acc, item) => acc + ((item.cogs || 35) * item.qty), 0);

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

  // Add-ons earn 0 stamps; only drink cups generate loyalty points
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

      const drinkCupsCount = cart
        .filter(item => item.category !== 'Add-Ons')
        .reduce((sum, item) => sum + item.qty, 0);

      const newStamps = (stamps + drinkCupsCount) % 8;
      await supabase.from('loyalty_stamps').upsert({
        phone: customer.phone,
        customer_name: customer.name,
        stamp_count: newStamps
      });
      setStamps(newStamps);

      setCart([]);
      setAppliedCoupon(null);
      setCouponCode('');
      setShowMobileTray(false);
      fetchCustomerHistory(customer.phone);
    }
  };

  const categories = [
    { label: 'All Series', id: 'All' },
    { label: '✨ Sparkling Soda', id: 'Sparkling Soda Series' },
    { label: '🧋 Popping Soda', id: 'Popping Soda Series' },
    { label: '☕ Milk Tea', id: 'Milk Tea Series' },
    { label: '🥤 Milk Boba', id: 'Milk Boba Series' },
    { label: '🍵 Matcha Series', id: 'Matcha Series' },
    { label: '⚡ Sugar Free', id: 'No Added Sugar Specials' },
    { label: '➕ Add-Ons', id: 'Add-Ons' }
  ];

  const filteredMenu = activeCategory === 'All' 
    ? menu 
    : menu.filter(item => item.category === activeCategory);

  if (!isIdentified) {
    return (
      <div className="max-w-md mx-auto mt-4 md:mt-8 bg-[#FFF7F8] rounded-3xl p-6 md:p-8 border-2 border-[#F5D0D7] shadow-xl text-[#0B2B20]">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#0B2B20] text-[#F9CBD3] rounded-3xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg">
            🧋
          </div>
          <h2 className="text-2xl font-black text-[#0B2B20] font-serif">Pop & Pour</h2>
          <p className="text-xs text-[#0B2B20]/70 font-bold mt-1">SIP HAPPY • STAY HAPPY ♡ Secure Login</p>
        </div>

        {!pinStep ? (
          <form onSubmit={handleVerifyOrRegisterUser} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase mb-1 text-[#0B2B20]">Your Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Vikram Sharma"
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-[#F5D0D7] rounded-2xl text-sm focus:border-[#0B2B20] focus:outline-none bg-white text-[#0B2B20] font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase mb-1 text-[#0B2B20]">Mobile Number</label>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="e.g. 9876543210"
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                className="w-full px-4 py-3 border-2 border-[#F5D0D7] rounded-2xl text-sm focus:border-[#0B2B20] focus:outline-none bg-white text-[#0B2B20] font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-black uppercase mb-1 text-[#0B2B20]">Channel</label>
                <select
                  value={customer.orderType}
                  onChange={(e) => setCustomer({ ...customer, orderType: e.target.value })}
                  className="w-full px-3 py-3 border-2 border-[#F5D0D7] rounded-2xl text-xs font-black bg-white text-[#0B2B20]"
                >
                  <option value="Dine-In">Dine-In</option>
                  <option value="Takeaway">Takeaway</option>
                </select>
              </div>

              {customer.orderType === 'Dine-In' && (
                <div>
                  <label className="block text-xs font-black uppercase mb-1 text-[#0B2B20]">Table</label>
                  <select
                    value={customer.tableNo}
                    onChange={(e) => setCustomer({ ...customer, tableNo: e.target.value })}
                    className="w-full px-3 py-3 border-2 border-[#F5D0D7] rounded-2xl text-xs font-black bg-white text-[#0B2B20]"
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

            {accountError && <p className="text-xs text-rose-600 font-bold text-center">{accountError}</p>}

            <button
              type="submit"
              className="w-full py-4 bg-[#0B2B20] text-[#F9CBD3] font-black rounded-2xl hover:bg-[#071D16] transition shadow-lg text-sm tracking-wide flex items-center justify-center gap-2 mt-2"
            >
              Continue to PIN Security <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirmPin} className="space-y-4">
            <div className="p-3 bg-[#FFF0F3] rounded-2xl border border-[#F5D0D7] text-center">
              <ShieldCheck className="w-6 h-6 text-[#0B2B20] mx-auto mb-1" />
              <p className="text-xs font-black text-[#0B2B20]">Account Security PIN</p>
              <p className="text-[10px] text-[#0B2B20]/70 font-bold">Protects account for {customer.phone}</p>
            </div>

            <div>
              <label className="block text-xs font-black uppercase mb-1 text-[#0B2B20] text-center">Enter 4-Digit PIN</label>
              <input
                type="password"
                maxLength={4}
                required
                placeholder="••••"
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                className="w-full text-center text-3xl tracking-widest py-3 border-2 border-[#F5D0D7] rounded-2xl focus:border-[#0B2B20] focus:outline-none bg-white text-[#0B2B20] font-black"
                autoFocus
              />
            </div>

            {accountError && <p className="text-xs text-rose-600 font-bold text-center">{accountError}</p>}

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPinStep(false)}
                  className="flex-1 py-3 border border-[#F5D0D7] text-[#0B2B20] font-bold rounded-2xl text-xs hover:bg-[#FFF0F3]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#0B2B20] text-[#F9CBD3] font-black rounded-2xl hover:bg-[#071D16] shadow-md text-xs"
                >
                  Unlock Account
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowForgotNotice(true)}
                className="text-[11px] text-rose-700 font-bold hover:underline text-center mt-1"
              >
                Forgot PIN? Tap here
              </button>
            </div>
          </form>
        )}

        {showForgotNotice && (
          <div className="fixed inset-0 bg-[#0B2B20]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 border-2 border-[#F5D0D7]">
              <KeyRound className="w-10 h-10 text-[#0B2B20] mx-auto" />
              <h3 className="text-base font-black text-[#0B2B20]">PIN Reset Assistance</h3>
              <p className="text-xs text-[#0B2B20]/80 font-bold">
                For security reasons, please request the Barista at the counter to reset your 4-digit PIN instantly!
              </p>
              <button
                onClick={() => setShowForgotNotice(false)}
                className="w-full py-3 bg-[#0B2B20] text-[#F9CBD3] font-black rounded-2xl text-xs"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-5">
        <div className="bg-[#0B2B20] rounded-3xl p-5 md:p-6 text-[#F9CBD3] shadow-lg flex justify-between items-center relative overflow-hidden">
          <div className="relative z-10">
            <span className="bg-[#F9CBD3]/20 text-[#F9CBD3] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              {customer.name} • {customer.orderType === 'Dine-In' ? customer.tableNo : 'Takeaway'}
            </span>
            <h2 className="text-2xl font-black mt-2 font-serif text-white">Bubbles • Good Mood 🧋</h2>
            <p className="text-[#F9CBD3]/80 text-xs mt-0.5 font-medium">Handcrafted Boba, Matchas & Sodas brewed fresh</p>
          </div>
          <button onClick={() => setIsIdentified(false)} className="text-xs bg-[#F9CBD3]/10 hover:bg-[#F9CBD3]/20 px-3 py-1.5 rounded-xl font-bold backdrop-blur-md z-10 border border-[#F9CBD3]/20 text-[#F9CBD3]">
            Switch User
          </button>
        </div>

        {/* 8-Drink Loyalty Card */}
        <div className="bg-white rounded-3xl p-5 border border-[#F5D0D7] shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#0B2B20]" />
              <h3 className="text-sm font-black text-[#0B2B20] uppercase tracking-wide">8-Drink Loyalty Card</h3>
            </div>
            <p className="text-xs text-[#0B2B20]/70 font-bold mt-1">
              Buy 8 drink cups & unlock 1 FREE Sparkling Soda! (Add-Ons excluded)
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 bg-[#FFF0F3] p-2.5 rounded-2xl border border-[#F5D0D7] justify-center">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((stIndex) => (
              <div
                key={stIndex}
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs border transition ${
                  stIndex <= stamps
                    ? 'bg-[#0B2B20] text-[#F9CBD3] border-[#0B2B20] shadow-md scale-105 animate-pulse'
                    : 'bg-white text-[#E895A5] border-[#F5D0D7]'
                }`}
              >
                {stIndex <= stamps ? '🍹' : stIndex === 8 ? '🎁' : stIndex}
              </div>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none sticky top-16 bg-[#FFF7F8] py-2 z-20">
          {categories.map((cat) => {
            const count = cat.id === 'All' ? menu.length : menu.filter(i => i.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition border flex items-center gap-1.5 ${
                  activeCategory === cat.id 
                    ? 'bg-[#0B2B20] text-[#F9CBD3] border-[#0B2B20] shadow-sm' 
                    : 'bg-white text-[#0B2B20] border-[#F5D0D7] hover:bg-[#FFF0F3]'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  activeCategory === cat.id ? 'bg-white/20 text-[#F9CBD3]' : 'bg-[#FFF0F3] text-[#0B2B20]'
                }`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredMenu.map((item) => (
            <div 
              key={item.id} 
              className={`bg-white rounded-3xl p-5 border border-[#F5D0D7] shadow-xs flex flex-col justify-between transition hover:border-[#0B2B20] hover:shadow-md ${
                item.is_sold_out ? 'opacity-40 bg-pink-50/10' : ''
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-[#FFF0F3] text-[#0B2B20] rounded-full border border-[#F5D0D7] uppercase tracking-wider">
                    {item.category}
                  </span>
                  {item.is_sold_out ? (
                    <span className="text-xs font-bold px-2.5 py-1 bg-rose-100 text-rose-700 rounded-xl">SOLD OUT</span>
                  ) : (
                    <span className="text-base font-black text-[#0B2B20]">
                      ₹{item.price} {item.large_price ? ` / ₹${item.large_price}` : ''}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-[#0B2B20] text-base mb-1 font-serif">{item.name}</h3>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  disabled={item.is_sold_out}
                  onClick={() => openCustomModal(item, 'Regular')}
                  className="flex-1 py-2.5 bg-[#FFF0F3] hover:bg-[#0B2B20] hover:text-[#F9CBD3] text-[#0B2B20] rounded-2xl font-bold text-xs transition border border-[#F5D0D7] flex items-center justify-center gap-1"
                >
                  <Sliders className="w-3.5 h-3.5" /> Customize R
                </button>

                {item.large_price && (
                  <button
                    disabled={item.is_sold_out}
                    onClick={() => openCustomModal(item, 'Large')}
                    className="flex-1 py-2.5 bg-[#0B2B20] hover:bg-[#071D16] text-[#F9CBD3] rounded-2xl font-bold text-xs transition flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Sliders className="w-3.5 h-3.5" /> Customize L
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart & Order Status */}
      <div className="space-y-6">
        <div className={`bg-white rounded-3xl p-6 border border-[#F5D0D7] shadow-md sticky top-24 ${
          showMobileTray ? 'fixed inset-x-3 bottom-16 z-40 max-h-[80vh] overflow-y-auto border-2 border-[#0B2B20]' : 'hidden lg:block'
        }`}>
          <h3 className="text-lg font-black text-[#0B2B20] mb-4 flex items-center justify-between font-serif">
            <span className="flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-[#0B2B20]" /> Current Tray</span>
            {showMobileTray && <button onClick={() => setShowMobileTray(false)} className="text-xs text-rose-600 font-black">Close ✕</button>}
          </h3>

          {cart.length === 0 ? (
            <div className="text-center py-10 text-[#E895A5]">
              <Coffee className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-bold">Your tray is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="divide-y divide-[#FFF0F3] max-h-48 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.cartKey} className="flex justify-between items-center py-2.5">
                    <div>
                      <h4 className="font-extrabold text-xs text-[#0B2B20]">{item.name}</h4>
                      <p className="text-[11px] text-[#0B2B20]/70 font-bold">₹{item.price} × {item.qty}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.cartKey, -1)} className="w-6 h-6 bg-[#FFF0F3] text-[#0B2B20] rounded-lg flex items-center justify-center font-bold text-xs"><Minus className="w-3 h-3" /></button>
                      <span className="font-bold text-xs text-[#0B2B20]">{item.qty}</span>
                      <button onClick={() => updateQty(item.cartKey, 1)} className="w-6 h-6 bg-[#FFF0F3] text-[#0B2B20] rounded-lg flex items-center justify-center font-bold text-xs"><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#F5D0D7] pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-[#0B2B20]/70 font-bold">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-base font-black text-[#0B2B20] pt-1 border-t border-[#F5D0D7]">
                  <span>Total Payable</span>
                  <span className="text-[#0B2B20]">₹{totalPayable}</span>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handlePlaceOrder('UPI Soundbox / QR')}
                    className="w-full bg-[#0B2B20] text-[#F9CBD3] font-black py-3 rounded-2xl hover:bg-[#071D16] transition shadow-lg text-xs tracking-wide"
                  >
                    Generate Token & Pay via UPI (₹{totalPayable})
                  </button>
                  <button
                    onClick={() => handlePlaceOrder('Cash at Counter')}
                    className="w-full bg-[#FFF0F3] hover:bg-[#FCE1E6] text-[#0B2B20] font-bold py-2.5 rounded-2xl transition text-xs border border-[#F5D0D7]"
                  >
                    Pay Cash at Counter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {activeOrder && (
          <div className="bg-white border border-[#F5D0D7] rounded-3xl p-6 text-[#0B2B20] shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#0B2B20]/70">Order Tracker</span>
              <span className="text-2xl font-black text-[#0B2B20] bg-[#FFF0F3] px-3 py-1 rounded-xl border border-[#F5D0D7]">
                {activeOrder.token_no || activeOrder.id}
              </span>
            </div>

            <div className="p-3 bg-[#FFF0F3]/80 rounded-2xl border border-[#F5D0D7] text-center">
              <p className="text-xs font-bold text-amber-900 flex items-center justify-center gap-1">
                <AlertCircle className="w-4 h-4 text-amber-600" /> Present Token {activeOrder.token_no} at Counter
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Drink Customization Modal */}
      {selectedItemForCustom && (
        <div className="fixed inset-0 bg-[#0B2B20]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFF7F8] rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-[#F5D0D7] text-[#0B2B20] space-y-5">
            <div>
              <span className="text-[10px] font-bold px-2.5 py-1 bg-[#FFF0F3] text-[#0B2B20] rounded-full border border-[#F5D0D7] uppercase">
                {selectedItemForCustom.category}
              </span>
              <h3 className="text-xl font-black text-[#0B2B20] font-serif mt-2">{selectedItemForCustom.name}</h3>
              <p className="text-xs text-[#0B2B20]/70 font-medium">Customize sweetness, ice & extra boba for your cup.</p>
            </div>

            {selectedItemForCustom.large_price && (
              <div>
                <label className="block text-xs font-black uppercase mb-1.5 text-[#0B2B20]">Cup Size</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCustomOptions({ ...customOptions, size: 'Regular' })}
                    className={`py-2.5 rounded-2xl text-xs font-bold border transition ${
                      customOptions.size === 'Regular' ? 'bg-[#0B2B20] text-[#F9CBD3] border-[#0B2B20]' : 'bg-white text-[#0B2B20] border-[#F5D0D7]'
                    }`}
                  >
                    Regular (₹{selectedItemForCustom.price})
                  </button>
                  <button
                    onClick={() => setCustomOptions({ ...customOptions, size: 'Large' })}
                    className={`py-2.5 rounded-2xl text-xs font-bold border transition ${
                      customOptions.size === 'Large' ? 'bg-[#0B2B20] text-[#F9CBD3] border-[#0B2B20]' : 'bg-white text-[#0B2B20] border-[#F5D0D7]'
                    }`}
                  >
                    Large (₹{selectedItemForCustom.large_price})
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-black uppercase mb-1.5 text-[#0B2B20]">Sugar Level</label>
              <div className="grid grid-cols-3 gap-2">
                {['0% Sugar Free', '50% Less Sweet', '100% Standard'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setCustomOptions({ ...customOptions, sugar: s })}
                    className={`py-2 rounded-xl text-[11px] font-bold border transition ${
                      customOptions.sugar === s ? 'bg-[#0B2B20] text-[#F9CBD3] border-[#0B2B20]' : 'bg-white text-[#0B2B20] border-[#F5D0D7]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase mb-1.5 text-[#0B2B20]">Ice Preference</label>
              <div className="grid grid-cols-3 gap-2">
                {['No Ice', 'Normal Ice', 'Extra Ice'].map((i) => (
                  <button
                    key={i}
                    onClick={() => setCustomOptions({ ...customOptions, ice: i })}
                    className={`py-2 rounded-xl text-[11px] font-bold border transition ${
                      customOptions.ice === i ? 'bg-[#0B2B20] text-[#F9CBD3] border-[#0B2B20]' : 'bg-white text-[#0B2B20] border-[#F5D0D7]'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#FFF0F3] p-3 rounded-2xl border border-[#F5D0D7] flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-[#0B2B20]">Extra Chewy Tapioca Boba</p>
                <p className="text-[10px] text-[#0B2B20]/70 font-medium">+₹30 (Add-On: Earns 0 Stamps)</p>
              </div>
              <button
                onClick={() => setCustomOptions({ ...customOptions, extraBoba: !customOptions.extraBoba })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  customOptions.extraBoba ? 'bg-[#0B2B20] text-[#F9CBD3] border-[#0B2B20]' : 'bg-white text-[#0B2B20] border-[#F5D0D7]'
                }`}
              >
                {customOptions.extraBoba ? '✓ Added' : '+ Add'}
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedItemForCustom(null)}
                className="flex-1 py-3 border border-[#F5D0D7] text-[#0B2B20] font-bold rounded-2xl hover:bg-[#FFF0F3] text-xs"
              >
                Cancel
              </button>
              <button
                onClick={addCustomizedItemToCart}
                className="flex-1 py-3 bg-[#0B2B20] text-[#F9CBD3] font-black rounded-2xl hover:bg-[#071D16] transition shadow-md text-xs"
              >
                Add Cup to Tray
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =================== 2. BARISTA KDS (With Customer PIN Reset) ===================
function ShopkeeperKDS() {
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [kdsTab, setKdsTab] = useState('active');

  // Customer PIN Reset State
  const [resetPhoneInput, setResetPhoneInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [resetStatus, setResetStatus] = useState('');

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

  const handleResetCustomerPin = async (e) => {
    e.preventDefault();
    setResetStatus('');

    if (resetPhoneInput.length < 10 || newPinInput.length !== 4) {
      setResetStatus('Please enter valid 10-digit Phone & 4-digit PIN');
      return;
    }

    const { error } = await supabase
      .from('loyalty_stamps')
      .update({ user_pin: newPinInput })
      .eq('phone', resetPhoneInput);

    if (error) {
      setResetStatus('Error: Phone number not found');
    } else {
      setResetStatus(`Success! Reset PIN for ${resetPhoneInput} to ${newPinInput}`);
      setResetPhoneInput('');
      setNewPinInput('');
    }
  };

  const activeOrders = orders.filter(o => o.status !== 'Completed');
  const completedOrders = orders.filter(o => o.status === 'Completed');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center bg-white p-6 rounded-3xl border border-[#F5D0D7] shadow-xs gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0B2B20] font-serif">Barista Kitchen Display (KDS)</h2>
          <p className="text-xs text-[#0B2B20]/70 font-bold">Approve tokens & assist customer PIN resets</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#FFF0F3] p-1 rounded-2xl flex border border-[#F5D0D7] text-xs font-bold">
            <button
              onClick={() => setKdsTab('active')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                kdsTab === 'active' ? 'bg-[#0B2B20] text-[#F9CBD3] shadow-xs' : 'text-[#0B2B20]'
              }`}
            >
              <Clock className="w-4 h-4" /> Active Queue ({activeOrders.length})
            </button>
            <button
              onClick={() => setKdsTab('completed')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                kdsTab === 'completed' ? 'bg-[#0B2B20] text-[#F9CBD3] shadow-xs' : 'text-[#0B2B20]'
              }`}
            >
              <Check className="w-4 h-4" /> History ({completedOrders.length})
            </button>
          </div>

          <button onClick={playOrderChime} className="px-3 py-2 bg-[#FFF0F3] text-[#0B2B20] rounded-2xl text-xs font-bold border border-[#F5D0D7] flex items-center gap-1 hover:bg-[#FCE1E6]">
            <Volume2 className="w-4 h-4" /> Chime Test
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {kdsTab === 'active' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeOrders.length === 0 ? (
                <div className="col-span-2 bg-white rounded-3xl p-12 text-center border border-[#F5D0D7] text-[#E895A5] font-bold">
                  No active pending orders in queue.
                </div>
              ) : (
                activeOrders.map((order) => (
                  <div key={order.id} className={`bg-white rounded-3xl p-5 border shadow-xs flex flex-col justify-between ${
                    order.payment_status === 'Unpaid' ? 'border-amber-300 bg-amber-50/20' : 'border-[#F5D0D7]'
                  }`}>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-mono font-black text-sm bg-[#FFF0F3] text-[#0B2B20] border border-[#F5D0D7] px-3 py-1 rounded-xl">
                          {order.token_no || order.id}
                        </span>
                        <span className="text-[10px] font-black px-2.5 py-1 bg-pink-50 text-[#0B2B20] rounded-full uppercase">
                          {order.order_type} ({order.table_no})
                        </span>
                      </div>

                      <p className="text-xs font-bold text-[#0B2B20] mb-2">{order.customer_name} • {order.phone}</p>

                      <div className="space-y-1.5 mb-4 border-t border-b border-[#FFF0F3] py-2">
                        {order.items?.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-[#0B2B20] font-bold">• {it.name}</span>
                            <span className="font-black text-[#0B2B20]">x{it.qty}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs">
                        <p className="text-[#0B2B20]/70 font-bold">Bill: <strong className="text-[#0B2B20]">₹{order.total_payable}</strong></p>
                      </div>

                      <div className="flex gap-1">
                        {order.payment_status === 'Unpaid' && (
                          <button
                            onClick={() => approveTokenAndPrep(order.id)}
                            className="px-3 py-2 bg-amber-500 text-white font-black rounded-xl text-xs shadow-md hover:bg-amber-600"
                          >
                            Approve Token & Prep
                          </button>
                        )}
                        {order.payment_status === 'Paid' && order.status === 'Preparing' && (
                          <button onClick={() => updateOrderStatus(order.id, 'Ready')} className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">Mark Ready</button>
                        )}
                        {order.status === 'Ready' && (
                          <button onClick={() => updateOrderStatus(order.id, 'Completed')} className="px-3 py-2 bg-[#0B2B20] text-white rounded-xl text-xs font-bold">Complete</button>
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
                <div className="col-span-2 bg-white rounded-3xl p-12 text-center border border-[#F5D0D7] text-[#E895A5] font-bold">
                  No completed orders found in history.
                </div>
              ) : (
                completedOrders.map((order) => (
                  <div key={order.id} className="bg-[#FFF7F8] rounded-3xl p-5 border border-[#F5D0D7] flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-mono font-bold text-xs bg-[#FFF0F3] px-2.5 py-1 rounded-xl text-[#0B2B20]">{order.token_no || order.id}</span>
                        <span className="text-[10px] font-black px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full uppercase">Fulfilled</span>
                      </div>
                      <p className="text-xs font-bold text-[#0B2B20] mb-2">{order.customer_name} • ₹{order.total_payable}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Counter Tools: Stock & PIN Reset */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 border border-[#F5D0D7] shadow-xs">
            <h3 className="font-bold text-[#0B2B20] text-sm mb-1 flex items-center gap-2 font-serif">
              <KeyRound className="w-4 h-4 text-[#0B2B20]" /> Customer PIN Override Reset
            </h3>
            <p className="text-[11px] text-[#0B2B20]/70 mb-3 font-bold">Reset forgotten PIN for customer at counter</p>

            <form onSubmit={handleResetCustomerPin} className="space-y-2">
              <input
                type="tel"
                maxLength={10}
                required
                placeholder="Customer Phone No."
                value={resetPhoneInput}
                onChange={(e) => setResetPhoneInput(e.target.value)}
                className="w-full px-3 py-2 border border-[#F5D0D7] rounded-xl text-xs font-bold"
              />
              <input
                type="password"
                maxLength={4}
                required
                placeholder="Set New 4-Digit PIN"
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value)}
                className="w-full px-3 py-2 border border-[#F5D0D7] rounded-xl text-xs font-bold"
              />
              <button
                type="submit"
                className="w-full py-2 bg-[#0B2B20] text-[#F9CBD3] rounded-xl text-xs font-black hover:bg-[#071D16]"
              >
                Reset Customer PIN
              </button>
              {resetStatus && <p className="text-[11px] font-bold text-center text-emerald-700">{resetStatus}</p>}
            </form>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#F5D0D7] shadow-xs">
            <h3 className="font-bold text-[#0B2B20] text-base mb-1 flex items-center gap-2 font-serif">
              <Package className="w-4 h-4 text-[#0B2B20]" /> Menu Stock Control
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {menu.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 rounded-2xl border border-[#F5D0D7] bg-[#FFF7F8]">
                  <div>
                    <h4 className="font-bold text-xs text-[#0B2B20]">{item.name}</h4>
                    <span className={`text-[10px] font-bold ${item.is_sold_out ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {item.is_sold_out ? 'Sold Out' : 'Available'}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleSoldOut(item.id, item.is_sold_out)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      item.is_sold_out ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
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

// =================== 3. EXECUTIVE MIS & SECURE CUSTOMER DATA ===================
function ExecutiveMIS() {
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [customerDatabase, setCustomerDatabase] = useState([]);
  const [searchPhone, setSearchPhone] = useState('');

  const [period, setPeriod] = useState('today');

  const loadData = async () => {
    const { data: oData } = await supabase.from('orders').select('*');
    if (oData) setOrders(oData);

    const { data: mData } = await supabase.from('items').select('*').order('id', { ascending: true });
    if (mData) setMenu(mData);

    const { data: cData } = await supabase.from('coupons').select('*').order('id', { ascending: true });
    if (cData) setCoupons(cData);

    // SECURE Management Access to Customer Database
    const { data: custData } = await supabase.from('loyalty_stamps').select('*').order('created_at', { ascending: false });
    if (custData) setCustomerDatabase(custData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredOrders = orders;
  const grossSales = filteredOrders.reduce((acc, c) => acc + (c.total_payable || 0), 0);
  const cogsTotal = filteredOrders.reduce((acc, c) => acc + (c.cogs_total || 0), 0);
  const grossProfit = grossSales - cogsTotal;

  const filteredCustomerList = customerDatabase.filter(c => 
    c.phone?.includes(searchPhone) || c.customer_name?.toLowerCase().includes(searchPhone.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-[#F5D0D7] shadow-xs flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0B2B20] font-serif">Management & Customer MIS</h2>
          <p className="text-xs text-[#0B2B20]/70 font-bold">Secure customer mobile database & financial tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-[#F5D0D7] shadow-xs">
          <p className="text-xs text-[#0B2B20]/70 font-bold">Gross Revenue</p>
          <h3 className="text-2xl font-black text-[#0B2B20] mt-1">₹{grossSales}</h3>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#F5D0D7] shadow-xs">
          <p className="text-xs text-[#0B2B20]/70 font-bold">Gross Profit</p>
          <h3 className="text-2xl font-black text-emerald-700 mt-1">₹{grossProfit}</h3>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#F5D0D7] shadow-xs">
          <p className="text-xs text-[#0B2B20]/70 font-bold flex items-center gap-1">
            <Users className="w-4 h-4 text-[#0B2B20]" /> Total Registered Customers
          </p>
          <h3 className="text-2xl font-black text-[#0B2B20] mt-1">{customerDatabase.length} Accounts</h3>
        </div>
      </div>

      {/* SECURE CUSTOMER MOBILE DATABASE (MANAGEMENT ONLY) */}
      <div className="bg-white rounded-3xl p-6 border border-[#F5D0D7] shadow-xs space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <h3 className="font-bold text-[#0B2B20] text-base flex items-center gap-2 font-serif">
            <ShieldCheck className="w-5 h-5 text-[#0B2B20]" /> Customer Mobile Database (Protected Management Access)
          </h3>

          <div className="flex items-center gap-2 bg-[#FFF7F8] px-3 py-1.5 rounded-2xl border border-[#F5D0D7]">
            <Search className="w-4 h-4 text-[#0B2B20]" />
            <input
              type="text"
              placeholder="Search Name or Phone..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="bg-transparent text-xs font-bold focus:outline-none text-[#0B2B20]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FFF0F3] border-b border-[#F5D0D7] text-[#0B2B20] font-black uppercase">
                <th className="p-3">Customer Name</th>
                <th className="p-3">Mobile Number</th>
                <th className="p-3">Loyalty Stamps</th>
                <th className="p-3">PIN Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FFF0F3] font-bold text-[#0B2B20]">
              {filteredCustomerList.map((cust) => (
                <tr key={cust.phone} className="hover:bg-[#FFF7F8]">
                  <td className="p-3">{cust.customer_name || 'Valued Customer'}</td>
                  <td className="p-3 font-mono font-black">{cust.phone}</td>
                  <td className="p-3">{cust.stamp_count || 0} Stamps</td>
                  <td className="p-3 font-mono">{cust.user_pin ? '🔒 Active' : 'Unset'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}