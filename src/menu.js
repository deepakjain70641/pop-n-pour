// Drinks and prices live in Supabase (table menu_items) — edit them in Management → Menu.
// This file only holds the series (categories) and the reward rule.
export const REWARD = { stamps: 8, label: 'a free Sparkling Soda' }; // also fixed in supabase-v2.sql (place_order / complete_order)

export const CATEGORIES = [
  { id: 'sparkling', name: 'Sparkling Soda', note: 'Without boba', addons: true, color: '#FADCDF', emoji: '🫧' },
  { id: 'popping', name: 'Popping Soda', note: 'With popping boba', addons: false, color: '#FCEBD2', emoji: '🍹' },
  { id: 'milktea', name: 'Milk Tea', note: 'Without boba', addons: true, color: '#EADBCB', emoji: '🧋' },
  { id: 'boba', name: 'Milk Boba', note: 'With chewy boba', addons: false, color: '#E6D9F1', emoji: '🟤' },
  { id: 'matcha', name: 'Matcha', note: 'Without boba', addons: true, color: '#DCEBD3', emoji: '🍵' },
  { id: 'sugarfree', name: 'No Added Sugar', note: 'Sugar-free powder · without boba', addons: true, color: '#E6F2EC', emoji: '🌿' },
];

export const catOf = (id) => CATEGORIES.find((c) => c.id === id) || { id, name: id, color: '#F4EBE1', addons: false };
export const catName = (id) => catOf(id).name;
export const addonsOf = (rows) => rows.filter((r) => r.cat === 'addon');
export const itemsOf = (rows, catId) => rows.filter((r) => r.cat === catId);
