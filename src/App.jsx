import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Coffee, Lock, CheckCircle, Plus, Minus, Trash2, 
  ChefHat, BarChart3, Package, DollarSign, Layers, AlertTriangle, 
  Volume2, Receipt, Clock, Users, RefreshCw, FileText, TrendingUp
} from 'lucide-react';
import { supabase } from './supabase';

// Web Audio API Chime Synthesizer for kitchen alerts
const playOrderChime = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    console.log("Audio alert playback error / muted");
  }
};

export default function App() {
  const [activeRole, setActiveRole] = useState('customer');
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
    setTargetRole(role);
    setPinInput('');
    setAuthError('');
    setShowPinModal(true);
  };

  const verifyAccess = (e) => {
    e.preventDefault();
    if (targetRole === 'shopkeeper' && pinInput === BARISTA_PIN) {
      setActiveRole('shopkeeper');
      setShowPinModal(false);
    } else if (targetRole === 'owner' && pinInput === OWNER_PASSWORD) {
      setActiveRole('owner');
      setShowPinModal(false);
    } else {
      setAuthError('Access Denied. Invalid Credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 selection:bg-pink-500 selection:text-white">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md shadow-pink-500/20">
              P&P
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-gray-900">Pop & Pour Suite</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Enterprise QSR Operating System</p>
            </div>
          </div>

          <div className="flex items-center bg-gray-100 p-1.5 rounded-2xl gap-1 border border-gray-200">
            <button
              onClick={() => handleRoleSwitch('customer')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeRole === 'customer' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🥤 Customer Kiosk
            </button>
            <button
              onClick={() => handleRoleSwitch('shopkeeper')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeRole === 'shopkeeper' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ChefHat className="w-4 h-4" /> Barista KDS
            </button>
            <button
              onClick={() => handleRoleSwitch('owner')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeRole === 'owner' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Executive MIS
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {activeRole === 'customer' && <CustomerKiosk />}
        {activeRole === 'shopkeeper' && <ShopkeeperKDS />}
        {activeRole === 'owner' && <ExecutiveMIS />}
      </main>

      {/* Security Gate Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100">
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {targetRole === 'owner' ? 'Owner MIS Access' : 'Barista KDS Login'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {targetRole === 'owner' ? 'Enter master password.' : 'Enter 4-digit staff PIN (Default: 2468).'}
              </p>
            </div>

            <form onSubmit={verifyAccess} className="space-y-4">
              <input
                type="password"
                maxLength={targetRole === 'shopkeeper' ? 4 : 50}
                placeholder={targetRole === 'shopkeeper' ? "••••" : "Password"}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center text-2xl tracking-widest py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:outline-none bg-gray-50"
                autoFocus
              />
              {authError && <p className="text-xs text-red-500 text-center font-semibold">{authError}</p>}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-pink-600 text-white font-bold rounded-2xl hover:bg-pink-700 shadow-md text-sm"
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

// =================== 1. CUSTOMER KIOSK & TRACKER ===================
function CustomerKiosk() {
  const [customer, setCustomer] = useState({ name: '', phone: '', tableNo: 'Table 1', orderType: 'Dine-In' });
  const [isIdentified, setIsIdentified] = useState(false);
  
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);

  useEffect(() => {
    async function fetchMenu() {
      const { data } = await supabase.from('items').select('*');
      if (data) setMenu(data);
    }
    fetchMenu();

    const sub = supabase.channel('menu-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => fetchMenu())
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, []);

  useEffect(() => {
    if (!activeOrder) return;
    const sub = supabase.channel('order-status-sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${activeOrder.id}` }, (payload) => {
        setActiveOrder(payload.new);
      }).subscribe();

    return () => supabase.removeChannel(sub);
  }, [activeOrder?.id]);

  const addToCart = (item) => {
    if (item.is_sold_out) return;
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
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

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const totalPayable = subtotal; // GST completely removed
  const cogsTotal = cart.reduce((acc, item) => acc + ((item.cogs || 40) * item.qty), 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    const orderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
    const newOrder = {
      id: orderId,
      customer_name: customer.name,
      phone: customer.phone,
      order_type: customer.orderType,
      table_no: customer.orderType === 'Dine-In' ? customer.tableNo : 'Takeaway',
      items: cart,
      subtotal: subtotal,
      total_payable: totalPayable,
      cogs_total: cogsTotal,
      payment_method: 'UPI Instant',
      payment_status: 'Paid',
      status: 'Placed'
    };

    const { error } = await supabase.from('orders').insert([newOrder]);
    if (error) {
      alert('Order placement failed: ' + error.message);
    } else {
      setActiveOrder(newOrder);
      setCart([]);
    }
  };

  if (!isIdentified) {
    return (
      <div className="max-w-md mx-auto mt-8 bg-white rounded-3xl p-8 border border-gray-200 shadow-xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-3 shadow-lg shadow-pink-500/20">
            🧋
          </div>
          <h2 className="text-2xl font-black text-gray-900">Pop & Pour Kiosk</h2>
          <p className="text-xs text-gray-500 mt-1">Select table and customer info to start ordering.</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (customer.name && customer.phone) setIsIdentified(true); }} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Customer Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Vikram Sharma"
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl text-sm focus:ring-2 focus:ring-pink-500 focus:outline-none bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mobile Number</label>
            <input
              type="tel"
              required
              placeholder="e.g. 9876543210"
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl text-sm focus:ring-2 focus:ring-pink-500 focus:outline-none bg-gray-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Order Channel</label>
              <select
                value={customer.orderType}
                onChange={(e) => setCustomer({ ...customer, orderType: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-2xl text-xs font-bold bg-gray-50"
              >
                <option value="Dine-In">Dine-In</option>
                <option value="Takeaway">Takeaway</option>
              </select>
            </div>

            {customer.orderType === 'Dine-In' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Table Number</label>
                <select
                  value={customer.tableNo}
                  onChange={(e) => setCustomer({ ...customer, tableNo: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-2xl text-xs font-bold bg-gray-50"
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
            className="w-full py-3.5 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold rounded-2xl hover:opacity-95 transition shadow-lg shadow-pink-500/20 text-sm"
          >
            Launch Digital Menu 🍹
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg flex justify-between items-center">
          <div>
            <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              {customer.orderType} • {customer.orderType === 'Dine-In' ? customer.tableNo : 'Takeaway'}
            </span>
            <h2 className="text-2xl font-black mt-2">Signature Craft Drinks 🧋</h2>
            <p className="text-pink-100 text-xs mt-1">Freshly brewed tea and fizzy sodas made live.</p>
          </div>
          <button onClick={() => setIsIdentified(false)} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl font-semibold">
            Change
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {menu.map((item) => (
            <div key={item.id} className={`bg-white rounded-3xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between ${item.is_sold_out ? 'opacity-50 bg-gray-50' : ''}`}>
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-pink-50 text-pink-600 rounded-full">{item.category}</span>
                  {item.is_sold_out ? (
                    <span className="text-xs font-bold px-2.5 py-1 bg-red-100 text-red-600 rounded-xl">SOLD OUT</span>
                  ) : (
                    <span className="text-base font-black text-gray-900">₹{item.price}</span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">{item.name}</h3>
              </div>

              <button
                disabled={item.is_sold_out}
                onClick={() => addToCart(item)}
                className={`mt-4 w-full py-3 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 ${
                  item.is_sold_out 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-900 text-white hover:bg-pink-600 shadow-sm'
                }`}
              >
                <Plus className="w-4 h-4" /> Add to Cup
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm sticky top-24">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-pink-600" /> Order Summary
          </h3>

          {cart.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Coffee className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-3">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900">{item.name}</h4>
                      <p className="text-xs text-gray-500">₹{item.price} × {item.qty}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center font-bold"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="font-bold text-sm">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center font-bold"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2 text-xs text-gray-600">
                <div className="flex justify-between text-base font-black text-gray-900 pt-2">
                  <span>Total Payable</span>
                  <span className="text-pink-600">₹{totalPayable}</span>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  className="w-full bg-pink-600 text-white font-bold py-3.5 rounded-2xl hover:bg-pink-700 transition shadow-lg shadow-pink-500/20 text-sm mt-3"
                >
                  Pay via UPI / Card (₹{totalPayable})
                </button>
              </div>
            </div>
          )}
        </div>

        {activeOrder && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-emerald-900 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 animate-bounce" />
              <h4 className="font-bold text-sm">Live Kitchen Tracker</h4>
            </div>
            <p className="text-xs text-emerald-700 mb-3">Ticket: <span className="font-mono font-bold">{activeOrder.id}</span></p>
            <div className="bg-white rounded-2xl p-4 text-center border border-emerald-100">
              <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide ${
                activeOrder.status === 'Placed' ? 'bg-amber-100 text-amber-800' :
                activeOrder.status === 'Preparing' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                activeOrder.status === 'Ready' ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-900 text-white'
              }`}>
                {activeOrder.status}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =================== 2. BARISTA KDS & INVENTORY ===================
function ShopkeeperKDS() {
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [inventory, setInventory] = useState([]);

  const loadAll = async () => {
    const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (oData) setOrders(oData);

    const { data: mData } = await supabase.from('items').select('*');
    if (mData) setMenu(mData);

    const { data: iData } = await supabase.from('inventory').select('*');
    if (iData) setInventory(iData);
  };

  useEffect(() => {
    loadAll();

    const sub = supabase.channel('kds-erp-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        playOrderChime();
        loadAll();
      })
      .on('postgres_changes', { event: '*', schema: 'public' }, () => loadAll())
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
  };

  const toggleSoldOut = async (itemId, currentState) => {
    await supabase.from('items').update({ is_sold_out: !currentState }).eq('id', itemId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Barista KDS & Stock Operations</h2>
          <p className="text-xs text-gray-500">Live order tickets with automatic recipe inventory management</p>
        </div>
        <button onClick={playOrderChime} className="px-3 py-1.5 bg-pink-50 text-pink-600 rounded-2xl text-xs font-bold border border-pink-100 flex items-center gap-1">
          <Volume2 className="w-4 h-4" /> Sound Test
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-gray-900 text-base">Active Ticket Queue</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.length === 0 ? (
              <div className="col-span-2 bg-white rounded-3xl p-12 text-center border border-gray-200 text-gray-400 font-medium">
                No tickets in queue.
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono font-bold text-xs bg-gray-100 px-2.5 py-1 rounded-xl text-gray-700">{order.id}</span>
                      <span className="text-[10px] font-black px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full uppercase">
                        {order.order_type} ({order.table_no})
                      </span>
                    </div>

                    <p className="text-xs font-bold text-gray-900 mb-3">{order.customer_name} • {order.phone}</p>

                    <div className="space-y-1.5 mb-4 border-t border-b border-gray-50 py-2">
                      {order.items?.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-800 font-medium">• {it.name}</span>
                          <span className="font-bold text-gray-700">x{it.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-bold text-gray-500">Status: <strong className="text-pink-600">{order.status}</strong></span>
                    <div className="flex gap-1">
                      {order.status === 'Placed' && (
                        <button onClick={() => updateOrderStatus(order.id, 'Preparing')} className="px-3 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-bold">Start Prep</button>
                      )}
                      {order.status === 'Preparing' && (
                        <button onClick={() => updateOrderStatus(order.id, 'Ready')} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold">Mark Ready</button>
                      )}
                      {order.status === 'Ready' && (
                        <button onClick={() => updateOrderStatus(order.id, 'Completed')} className="px-3 py-1.5 bg-gray-900 text-white rounded-xl text-xs font-bold">Fulfill</button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Stock Control */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 text-base mb-1 flex items-center gap-2">
              <Package className="w-4 h-4 text-pink-600" /> Live Menu Stock
            </h3>
            <p className="text-xs text-gray-500 mb-4">Toggle item availability on the customer kiosk.</p>

            <div className="space-y-2">
              {menu.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 rounded-2xl border border-gray-100 bg-gray-50">
                  <div>
                    <h4 className="font-bold text-xs text-gray-900">{item.name}</h4>
                    <span className={`text-[10px] font-bold ${item.is_sold_out ? 'text-red-500' : 'text-emerald-600'}`}>
                      {item.is_sold_out ? 'Sold Out' : 'Available'}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleSoldOut(item.id, item.is_sold_out)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                      item.is_sold_out ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'
                    }`}
                  >
                    {item.is_sold_out ? 'Restock' : 'Sold Out'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 text-base mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" /> ERP Material Stock
            </h3>
            <div className="space-y-2.5">
              {inventory.map((inv) => (
                <div key={inv.id} className="flex justify-between items-center text-xs border-b border-gray-100 pb-2">
                  <span className="font-semibold text-gray-700">{inv.ingredient_name}</span>
                  <span className={`font-mono font-bold ${inv.stock_qty < inv.reorder_level ? 'text-red-500' : 'text-gray-900'}`}>
                    {inv.stock_qty} {inv.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =================== 3. EXECUTIVE MIS & PROFIT INTELLIGENCE ===================
function ExecutiveMIS() {
  const [data, setData] = useState({ grossSales: 0, cogsTotal: 0, orderCount: 0 });

  useEffect(() => {
    async function fetchFinancials() {
      const { data: oData } = await supabase.from('orders').select('*');
      if (oData) {
        const gross = oData.reduce((acc, c) => acc + (c.total_payable || 0), 0);
        const cogs = oData.reduce((acc, c) => acc + (c.cogs_total || 0), 0);
        setData({ grossSales: gross, cogsTotal: cogs, orderCount: oData.length });
      }
    }
    fetchFinancials();
  }, []);

  const grossProfit = data.grossSales - data.cogsTotal;
  const profitMargin = data.grossSales > 0 ? ((grossProfit / data.grossSales) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Executive MIS & ERP Ledger</h2>
          <p className="text-xs text-gray-500">Real-time revenue, COGS, and net profit margin analysis</p>
        </div>
        <span className="px-3.5 py-1.5 bg-purple-50 text-purple-700 rounded-2xl text-xs font-bold border border-purple-100">Executive Master Authenticated</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Gross Collection</p>
          <h3 className="text-2xl font-black text-gray-900 mt-1">₹{data.grossSales}</h3>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total COGS (Ingredients)</p>
          <h3 className="text-2xl font-black text-red-600 mt-1">₹{data.cogsTotal}</h3>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Net Gross Profit</p>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">₹{grossProfit}</h3>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Net Profit Margin</p>
          <h3 className="text-2xl font-black text-purple-600 mt-1">{profitMargin}%</h3>
        </div>
      </div>
    </div>
  );
}