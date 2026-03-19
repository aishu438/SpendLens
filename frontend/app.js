// ── Config ───────────────────────────────────────────────
const API = 'https://spendlens-7qwz.onrender.com/api';

const CATEGORIES = {
  Food:          { emoji: '🍔', color: '#c8f73a' },
  Transport:     { emoji: '🚗', color: '#7c5cfc' },
  Housing:       { emoji: '🏠', color: '#ff9f43' },
  Health:        { emoji: '💊', color: '#54a0ff' },
  Entertainment: { emoji: '🎬', color: '#ff6b6b' },
  Shopping:      { emoji: '🛍️', color: '#feca57' },
  Other:         { emoji: '📦', color: '#a29bfe' },
};

// ── State ────────────────────────────────────────────────
let expenses    = [];
let currentView = 'dashboard';
let token       = localStorage.getItem('sl_token') || null;
let currentUser = JSON.parse(localStorage.getItem('sl_user') || 'null');
let BUDGET      = currentUser?.budget || 3000;

// ── Helpers ──────────────────────────────────────────────
const fmt      = n => '$' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const today    = () => new Date().toISOString().slice(0, 10);
const nowMonth = () => new Date().toISOString().slice(0, 7);
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});
const monthExpenses = m => expenses.filter(e => e.date.startsWith(m));
const totalFor = list => list.reduce((s, e) => s + Number(e.amount), 0);
const byCategory = list => {
  const map = {};
  list.forEach(e => { map[e.category] = (map[e.category] || 0) + Number(e.amount); });
  return map;
};

// ── Screen switching ─────────────────────────────────────
function showAuth() {
  document.getElementById('authScreen').classList.add('show');
  document.getElementById('appShell').classList.remove('show');
}

function showApp() {
  document.getElementById('authScreen').classList.remove('show');
  document.getElementById('appShell').classList.add('show');
  document.getElementById('userNameLabel').textContent = currentUser?.name || '';
  document.getElementById('monthBadge').textContent =
    new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  loadExpenses();
}

// ── Auth tabs ────────────────────────────────────────────
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const form = tab.dataset.form;
    document.getElementById('loginForm').classList.toggle('hidden', form !== 'login');
    document.getElementById('registerForm').classList.toggle('hidden', form !== 'register');
  });
});

// ── Login ────────────────────────────────────────────────
document.getElementById('btnLogin').addEventListener('click', async () => {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl    = document.getElementById('loginError');
  errEl.textContent = '';
  if (!email || !password) { errEl.textContent = 'Please fill all fields.'; return; }
  try {
    const res  = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.message; return; }
    token = data.token;
    currentUser = data.user;
    BUDGET = data.user.budget || 3000;
    localStorage.setItem('sl_token', token);
    localStorage.setItem('sl_user', JSON.stringify(currentUser));
    showApp();
  } catch {
    errEl.textContent = 'Cannot connect to server. Is it running?';
  }
});

// ── Register ─────────────────────────────────────────────
document.getElementById('btnRegister').addEventListener('click', async () => {
  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const errEl    = document.getElementById('registerError');
  errEl.textContent = '';
  if (!name || !email || !password) { errEl.textContent = 'Please fill all fields.'; return; }
  if (password.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; return; }
  try {
    const res  = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.message; return; }
    token = data.token;
    currentUser = data.user;
    BUDGET = data.user.budget || 3000;
    localStorage.setItem('sl_token', token);
    localStorage.setItem('sl_user', JSON.stringify(currentUser));
    showApp();
  } catch {
    errEl.textContent = 'Cannot connect to server. Is it running?';
  }
});

// ── Logout ───────────────────────────────────────────────
document.getElementById('btnLogout').addEventListener('click', () => {
  token = null; currentUser = null; expenses = [];
  localStorage.removeItem('sl_token');
  localStorage.removeItem('sl_user');
  showAuth();
});

// ── Load Expenses ────────────────────────────────────────
async function loadExpenses() {
  try {
    const res  = await fetch(`${API}/expenses?limit=200`, { headers: authHeaders() });
    const data = await res.json();
    if (res.ok) { expenses = data.expenses || []; render(); }
    else if (res.status === 401) { showAuth(); }
  } catch (err) { console.error('Load failed:', err); }
}

// ── Navigation ───────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    const view = item.dataset.view;
    currentView = view;
    document.getElementById('pageTitle').textContent =
      view.charAt(0).toUpperCase() + view.slice(1);
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById('view-' + view).classList.remove('hidden');
    render();
  });
});

// ── Modal ────────────────────────────────────────────────
const overlay  = document.getElementById('modalOverlay');
document.getElementById('openModal').addEventListener('click', () => {
  document.getElementById('expDate').value = today();
  overlay.classList.remove('hidden');
});
document.getElementById('closeModal').addEventListener('click', () => overlay.classList.add('hidden'));
overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.add('hidden'); });

document.getElementById('saveExpense').addEventListener('click', async () => {
  const saveBtn = document.getElementById('saveExpense');
  const desc    = document.getElementById('expDesc').value.trim();
  const amount  = parseFloat(document.getElementById('expAmount').value);
  const date    = document.getElementById('expDate').value;
  const cat     = document.getElementById('expCategory').value;
  const note    = document.getElementById('expNote').value.trim();

  if (!desc || isNaN(amount) || amount <= 0 || !date) {
    saveBtn.style.outline = '2px solid #ff5f5f';
    setTimeout(() => saveBtn.style.outline = '', 800);
    return;
  }

  saveBtn.textContent = 'Saving…';
  saveBtn.disabled = true;

  try {
    const res  = await fetch(`${API}/expenses`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ desc, amount, date, category: cat, note }),
    });
    const data = await res.json();
    if (res.ok) {
      expenses.unshift(data);
      overlay.classList.add('hidden');
      document.getElementById('expDesc').value   = '';
      document.getElementById('expAmount').value = '';
      document.getElementById('expNote').value   = '';
      render();
    }
  } catch (err) { console.error('Save failed:', err); }

  saveBtn.textContent = 'Save Expense';
  saveBtn.disabled = false;
});

// ── Delete ───────────────────────────────────────────────
async function deleteExpense(id) {
  try {
    const res = await fetch(`${API}/expenses/${id}`, {
      method: 'DELETE', headers: authHeaders(),
    });
    if (res.ok) { expenses = expenses.filter(e => e.id !== id); render(); }
  } catch (err) { console.error('Delete failed:', err); }
}

// ── Render ───────────────────────────────────────────────
function render() {
  renderBudgetRing();
  renderStats();
  if (currentView === 'dashboard') renderDashboard();
  if (currentView === 'expenses')  renderExpenses();
  if (currentView === 'analytics') renderAnalytics();
}

function renderBudgetRing() {
  const spent = totalFor(monthExpenses(nowMonth()));
  const pct   = Math.min(spent / BUDGET, 1);
  const circ  = 213.6;
  const fill  = document.getElementById('budgetRingFill');
  fill.style.strokeDashoffset = circ - pct * circ;
  fill.style.stroke = pct > .9 ? '#ff5f5f' : pct > .7 ? '#feca57' : 'var(--accent)';
  document.getElementById('budgetPct').textContent   = Math.round(pct * 100) + '%';
  document.getElementById('spentLabel').textContent  = fmt(spent);
  document.getElementById('budgetLabel').textContent = fmt(BUDGET);
}

function renderStats() {
  const cur   = monthExpenses(nowMonth());
  const spent = totalFor(cur);
  const days  = new Date().getDate();
  document.getElementById('totalSpent').textContent = fmt(spent);
  document.getElementById('remaining').textContent  = fmt(Math.max(BUDGET - spent, 0));
  document.getElementById('txCount').textContent    = cur.length;
  document.getElementById('avgPerDay').textContent  = fmt(spent / days);
}

function renderDashboard() {
  const cur    = monthExpenses(nowMonth());
  const cats   = byCategory(cur);
  const max    = Math.max(...Object.values(cats), 1);
  const barsEl = document.getElementById('categoryBars');

  barsEl.innerHTML = !Object.keys(cats).length
    ? '<div style="color:var(--muted);font-size:.85rem;padding:12px 0">No expenses this month.</div>'
    : Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => `
        <div class="cat-row">
          <div class="cat-meta">
            <span class="cat-name">${CATEGORIES[cat]?.emoji || ''} ${cat}</span>
            <span class="cat-amt">${fmt(amt)}</span>
          </div>
          <div class="cat-track">
            <div class="cat-bar" style="width:${(amt/max)*100}%;background:${CATEGORIES[cat]?.color || 'var(--accent)'}"></div>
          </div>
        </div>`).join('');

  const recent   = cur.slice(0, 5);
  const recentEl = document.getElementById('recentList');
  recentEl.innerHTML = !recent.length
    ? '<div style="color:var(--muted);font-size:.85rem;padding:12px 0">Nothing yet — add an expense!</div>'
    : recent.map(e => `
        <div class="recent-item">
          <div class="recent-emoji">${CATEGORIES[e.category]?.emoji || '📦'}</div>
          <div class="recent-info">
            <div class="recent-desc">${e.desc}</div>
            <div class="recent-cat">${e.category} · ${e.date}</div>
          </div>
          <div class="recent-amt">${fmt(e.amount)}</div>
        </div>`).join('');
}

function renderExpenses() {
  const cat   = document.getElementById('filterCat').value;
  const month = document.getElementById('filterMonth').value;
  let list    = [...expenses];
  if (cat)   list = list.filter(e => e.category === cat);
  if (month) list = list.filter(e => e.date.startsWith(month));

  const tbody   = document.getElementById('expenseTableBody');
  const emptyEl = document.getElementById('expenseEmpty');

  if (!list.length) {
    tbody.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');
  tbody.innerHTML = list.map(e => `
    <tr>
      <td style="font-family:var(--font-mono);font-size:.8rem;color:var(--muted)">${e.date}</td>
      <td>
        <div style="font-weight:600">${e.desc}</div>
        ${e.note ? `<div style="font-size:.75rem;color:var(--muted)">${e.note}</div>` : ''}
      </td>
      <td><span class="tag">${CATEGORIES[e.category]?.emoji || ''} ${e.category}</span></td>
      <td class="amt-cell" style="color:${CATEGORIES[e.category]?.color || 'var(--accent)'}">${fmt(e.amount)}</td>
      <td><button class="del-btn" onclick="deleteExpense(${e.id})">✕</button></td>
    </tr>`).join('');
}

document.getElementById('filterCat').addEventListener('change', renderExpenses);
document.getElementById('filterMonth').addEventListener('change', renderExpenses);

function renderAnalytics() {
  const cur    = monthExpenses(nowMonth());
  const cats   = byCategory(cur);
  const total  = totalFor(cur) || 1;
  const canvas = document.getElementById('donutChart');
  const ctx    = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cx = 110, cy = 110, r = 80, lineW = 28;
  let angle = -Math.PI / 2;
  const legend  = document.getElementById('donutLegend');
  legend.innerHTML = '';
  const entries = Object.entries(cats).sort((a, b) => b[1] - a[1]);

  if (!entries.length) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = lineW; ctx.strokeStyle = '#2a2a35'; ctx.stroke();
    legend.innerHTML = '<div style="color:var(--muted);font-size:.8rem">No data this month</div>';
  } else {
    entries.forEach(([cat, amt]) => {
      const slice = (amt / total) * Math.PI * 2;
      const color = CATEGORIES[cat]?.color || '#888';
      ctx.beginPath(); ctx.arc(cx, cy, r, angle, angle + slice);
      ctx.lineWidth = lineW; ctx.strokeStyle = color; ctx.lineCap = 'butt'; ctx.stroke();
      angle += slice;
      legend.innerHTML += `
        <div class="legend-item">
          <div class="legend-dot" style="background:${color}"></div>
          <span class="legend-name">${CATEGORIES[cat]?.emoji || ''} ${cat}</span>
          <span class="legend-pct">${Math.round((amt/total)*100)}%</span>
        </div>`;
    });
    ctx.fillStyle = '#0c0c0f';
    ctx.beginPath(); ctx.arc(cx, cy, r - lineW/2 - 2, 0, Math.PI*2); ctx.fill();
  }

  const bc   = document.getElementById('barChart');
  const bctx = bc.getContext('2d');
  bctx.clearRect(0, 0, bc.width, bc.height);
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    days.push({ label: iso.slice(5), val: expenses.filter(e => e.date === iso).reduce((s, e) => s + Number(e.amount), 0) });
  }
  const maxBar = Math.max(...days.map(d => d.val), 1);
  const w = bc.width, h = bc.height;
  const padL=10, padR=10, padT=20, padB=30;
  const chartW = w-padL-padR, chartH = h-padT-padB;
  const bw = (chartW/days.length)*.55, gap = chartW/days.length;
  days.forEach((d, i) => {
    const x = padL + i*gap + gap/2 - bw/2;
    const bh = (d.val/maxBar)*chartH;
    const y  = padT + chartH - bh;
    bctx.fillStyle = '#2a2a35';
    bctx.fillRect(x, padT+chartH, bw, 2);
    if (d.val > 0) {
      bctx.fillStyle = '#c8f73a';
      bctx.beginPath(); bctx.roundRect(x, y, bw, bh, [4,4,0,0]); bctx.fill();
    }
    bctx.fillStyle = '#6b6b80';
    bctx.font = '9px DM Mono, monospace';
    bctx.textAlign = 'center';
    bctx.fillText(d.label, padL + i*gap + gap/2, h-8);
  });
}

// ── Init ─────────────────────────────────────────────────
// Clear any old conflicting localStorage keys
localStorage.removeItem('spendlens_expenses');

if (token) {
  showApp();
} else {
  showAuth();
}
