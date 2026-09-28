// ═══════════════════════════════════════════════════════════
//  MOBİL YIKAMA CRM v2 — Tam Özellikli
// ═══════════════════════════════════════════════════════════

// ─── SABİTLER ─────────────────────────────────────────────
const SERVICES = [
  { id: 'koltuk', label: 'Koltuk Yıkama', icon: '🛋️', color: '#3B82F6' },
  { id: 'hali', label: 'Halı Yıkama', icon: '🟫', color: '#8B5CF6' },
  { id: 'araba', label: 'Araç İçi Temizlik', icon: '🚗', color: '#10B981' },
  { id: 'yatak', label: 'Yatak Yıkama', icon: '🛏️', color: '#F59E0B' },
  { id: 'perde', label: 'Perde Yıkama', icon: '🪟', color: '#06B6D4' },
  { id: 'koltuk_hali', label: 'Koltuk + Halı', icon: '✨', color: '#EC4899' },
  { id: 'diger', label: 'Diğer', icon: '🔧', color: '#94A3B8' },
];

const SENSITIVITY = [
  { id: 'yok', label: 'Hassasiyet Yok', color: '#10B981' },
  { id: 'deterjan', label: 'Deterjan Hassasiyeti', color: '#F59E0B' },
  { id: 'leke', label: 'Leke Çıkarıcı Hassas.', color: '#F97316' },
  { id: 'kimyasal', label: 'Kimyasal Hassas.', color: '#EF4444' },
  { id: 'siddetli', label: 'Çok Hassas / Özel', color: '#DC2626' },
];

const EXPENSE_CATS = [
  { id: 'deterjan', label: 'Deterjan / Malzeme', icon: '🧴' },
  { id: 'yakit', label: 'Yakıt', icon: '⛽' },
  { id: 'ekipman', label: 'Ekipman / Alet', icon: '🔧' },
  { id: 'kira', label: 'Kira / Fatura', icon: '🏠' },
  { id: 'personel', label: 'Personel', icon: '👷' },
  { id: 'diger', label: 'Diğer Gider', icon: '📦' },
];

// \u2500\u2500\u2500 VER\u0130TABANI (Firebase'den geliyor - bkz. index.html) \u2500\u2500\u2500\r
// window.DB otomatik olarak Firebase ba\u011flant\u0131s\u0131ndan atanmaktad\u0131r\r

// ─── YARDIMCILAR ──────────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const fmt = n => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(n || 0);
const fmtD = iso => new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDT = iso => new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const fmtTime = iso => new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
const initials = (n = '') => (n.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2)) || '?';
const getSvc = id => SERVICES.find(s => s.id === id) || SERVICES[SERVICES.length - 1];
const getSens = id => SENSITIVITY.find(s => s.id === id) || SENSITIVITY[0];
const getExpCat = id => EXPENSE_CATS.find(e => e.id === id) || EXPENSE_CATS[EXPENSE_CATS.length - 1];
const isToday = iso => new Date(iso).toDateString() === new Date().toDateString();
const escape = s => String(s || '').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, ' ').replace(/\r/g, '');

// ─── DURUM ────────────────────────────────────────────────
let page = 'home';
let apptFilter = 'hepsi';
let finTab = 'income';
let finMonth = 'all'; // 'all' veya 'YYYY-MM'
let searchQ = '';
let detailCustomerId = null;
let detailApptId = null;
let currentGoldPrice = 3000;

async function fetchGoldPrice() {
  try {
    let r;
    try {
      // 1. Try directly (if truncgil has CORS enabled)
      r = await fetch('https://finans.truncgil.com/v3/today.json?_=' + Date.now());
    } catch(err) {
      // 2. Fallback to corsproxy.io
      r = await fetch('https://corsproxy.io/?' + encodeURIComponent('https://finans.truncgil.com/v3/today.json?_=' + Date.now()));
    }
    
    let data;
    try {
      data = await r.json();
    } catch(err) {
      // 3. Fallback to allorigins raw
      const r2 = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://finans.truncgil.com/v3/today.json?_=' + Date.now()));
      data = await r2.json();
    }

    if (data && data['gram-altin'] && data['gram-altin'].Selling) {
      const str = data['gram-altin'].Selling;
      currentGoldPrice = parseFloat(str.split('.').join('').replace(',', '.'));
      
      if (typeof render === 'function') {
        const p = typeof page !== 'undefined' ? page : '';
        if (p === 'home' || p === 'finance') render(); // Re-render to show updated price
      }
    }
  } catch(e) { console.error('Gold fetch error:', e); }
}
fetchGoldPrice();
setInterval(fetchGoldPrice, 60000);

let goldChartInstance = null;
function initGoldChart(goldList) {
  const ctx = document.getElementById('goldChart');
  if (!ctx) return;
  if (goldChartInstance) goldChartInstance.destroy();
  const dates = [...new Set(goldList.map(g => fmtD(g.date)))].reverse();
  let runTotal = 0;
  const sorted = [...goldList].reverse();
  const data = dates.map(d => {
    const dayTxs = sorted.filter(tx => fmtD(tx.date) === d);
    dayTxs.forEach(tx => runTotal += (tx.type === 'add' ? tx.grams : -tx.grams));
    return runTotal;
  });
  goldChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{ label: 'Altın Bakiyesi (Gram)', data: data, borderColor: '#FBBF24', backgroundColor: 'rgba(251,191,36,0.1)', fill: true, tension: 0.3 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  });
}


// ─── BELLEK ÖNBELLEKL (in-memory cache) ────────────────────
// Firestore çağrılarını tekrarlamamak için kısa süreli önbellek
const _cache = {};
const CACHE_TTL = 6000; // 6 saniye

async function cachedGet(key, fetchFn) {
  const now = Date.now();
  if (_cache[key] && (now - _cache[key].ts) < CACHE_TTL) {
    return _cache[key].data;
  }
  const data = await fetchFn();
  _cache[key] = { data, ts: now };
  return data;
}

function invalidateCache(...keys) {
  if (keys.length === 0) { Object.keys(_cache).forEach(k => delete _cache[k]); }
  else keys.forEach(k => delete _cache[k]);
}

// ─── THEME TOGGLE ─────────────────────────────────────────
window.toggleTheme = function() {
  const isLight = document.body.getAttribute('data-theme') === 'light';
  if (isLight) {
    document.body.removeAttribute('data-theme');
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  }
  updateThemeButtons();
}
function updateThemeButtons() {
  const isLight = document.body.getAttribute('data-theme') === 'light';
  document.querySelectorAll('.theme-toggle-btn').forEach(b => {
    b.innerHTML = isLight ? '🌙 Koyu Mod' : '☀️ Açık Mod';
  });
}
if (localStorage.getItem('theme') === 'light') document.body.setAttribute('data-theme', 'light');
setTimeout(updateThemeButtons, 100);


// ─── DESKTOP / MOBILE DETECT ──────────────────────────────
const isDesktop = () => window.innerWidth > 860;

// ─── SIDEBAR CLOCK ────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const timeEl = document.getElementById('sidebarTime');
  const dateEl = document.getElementById('sidebarDate');
  if (timeEl) timeEl.textContent = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  if (dateEl) dateEl.textContent = now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
}
setInterval(updateClock, 1000);

// ─── NAVİGASYON ───────────────────────────────────────────
function navigate(p, opts = {}) {
  page = p;
  searchQ = '';
  apptFilter = 'hepsi';
  if (opts.customerId) detailCustomerId = opts.customerId;
  if (opts.apptId) detailApptId = opts.apptId;

  // Mobile nav
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const navMap = {
    home: 'home', appointments: 'appointments', customers: 'customers', finance: 'finance',
    'customer-detail': 'customers', 'appt-detail': 'appointments'
  };
  const nb = document.getElementById('nav-' + (navMap[p] || p));
  if (nb) nb.classList.add('active');

  // Desktop sidebar nav
  document.querySelectorAll('.sidebar-nav-item').forEach(b => b.classList.remove('active'));
  const snavMap = {
    home: 'home', appointments: 'appointments', customers: 'customers', finance: 'finance',
    'customer-detail': 'customers', 'appt-detail': 'appointments'
  };
  const snb = document.getElementById('snav-' + (snavMap[p] || p));
  if (snb) snb.classList.add('active');

  render();
}

function fabAction() {
  if (page === 'customers') openAddCustomer();
  else if (page === 'finance') finTab === 'income' ? openAddIncome() : openAddExpense();
  else openAddAppointment();
}

// ─── RENDER ───────────────────────────────────────────────
function showLoading(mc) {
  if (mc) mc.innerHTML = `<div class="data-loading"><div class="data-spinner"></div><span>Yükleniyor...</span></div>`;
}

async function render() {
  if (!window.DB) return;
  await updateTopBar();

  if (isDesktop()) {
    const mc = document.getElementById('mainContent');
    if (mc) { mc.scrollTop = 0; showLoading(mc); }
    let html = '';
    switch (page) {
      case 'home': html = await renderHomeDesktop(); break;
      case 'appointments': html = await renderAppointmentsDesktop(); break;
      case 'customers': html = await renderCustomersDesktop(); break;
      case 'finance': html = await renderFinanceDesktop(); break;
      case 'customer-detail': html = await renderCustomerDetailDesktop(detailCustomerId); break;
      case 'appt-detail': html = await renderApptDetailDesktop(detailApptId); break;
    }
    if (mc) mc.innerHTML = html;
  } else {
    const mc = document.getElementById('mainContentMobile');
    if (mc) { mc.scrollTop = 0; showLoading(mc); }
    let html = '';
    switch (page) {
      case 'home': html = await renderHome(); break;
      case 'appointments': html = await renderAppointments(); break;
      case 'customers': html = await renderCustomers(); break;
      case 'finance': html = await renderFinance(); break;
      case 'customer-detail': html = await renderCustomerDetail(detailCustomerId); break;
      case 'appt-detail': html = await renderApptDetail(detailApptId); break;
    }
    if (mc) mc.innerHTML = html;
  }

  // Bekleyen badge — önbellekteki veriyi kullan (ekstra Firestore çağrısı yapmaz)
  try {
    const allAppts = await cachedGet('appointments', () => DB.getAppointments());
    const pending = allAppts.filter(a => a.paymentStatus !== 'odendi').length;
    const badge = document.getElementById('snav-badge-appt');
    if (badge) {
      if (pending > 0) { badge.textContent = pending; badge.style.display = 'block'; }
      else badge.style.display = 'none';
    }
  } catch (e) { }
}


async function updateTopBar() {
  // Mobile topbar
  const actions = document.getElementById('topBarActions');
  const fab = document.getElementById('fabBtn');
  if (actions) {
    if (page === 'home') {
      actions.innerHTML = '';
      if (fab) { fab.classList.remove('hidden'); fab.textContent = '＋'; }
    } else if (page === 'customer-detail') {
      const c = await DB.getCustomerById(detailCustomerId);
      actions.innerHTML = c ? `<button class="top-bar-btn" onclick="openEditCustomer('${c.id}')">✏️ Düzenle</button>` : '';
      if (fab) fab.classList.add('hidden');
    } else if (page === 'appt-detail') {
      actions.innerHTML = '';
      if (fab) fab.classList.add('hidden');
    } else {
      const labels = { appointments: '➕ Randevu', customers: '👤 Müşteri', finance: finTab === 'income' ? '＋ Gelir' : (finTab === 'expense' ? '＋ Gider' : '🪙 Altın') };
      actions.innerHTML = `<button class="top-bar-btn" onclick="fabAction()"><span>${labels[page] || ''}</span></button>`;
      if (fab) fab.classList.add('hidden');
    }
  }

  // Desktop topbar
  const pageTitles = {
    home: ['Genel Bakış', 'Merhaba, hoş geldiniz 👋'],
    appointments: ['Randevular', 'Tüm randevularınız ve işlemleriniz'],
    customers: ['Müşteri Rehberi', 'Kayıtlı müşterileriniz'],
    finance: ['Kasa & Finans', 'Gelir ve gider takibi'],
    'customer-detail': ['Müşteri Detayı', 'İşlem geçmişi ve bilgiler'],
    'appt-detail': ['Randevu Detayı', 'İşlem bilgileri'],
  };
  const titleEl = document.getElementById('desktopPageTitle');
  const subEl = document.getElementById('desktopPageSub');
  const rightEl = document.getElementById('desktopTopbarRight');
  if (titleEl) titleEl.textContent = pageTitles[page]?.[0] || '';
  if (subEl) subEl.textContent = pageTitles[page]?.[1] || '';
  if (rightEl) {
    if (page === 'home') {
      rightEl.innerHTML = `
        <button class="desktop-topbar-btn dtb-primary" onclick="openAddAppointment()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Yeni Randevu
        </button>`;
    } else if (page === 'customer-detail') {
      const c = await DB.getCustomerById(detailCustomerId);
      rightEl.innerHTML = c ? `
        <button class="desktop-topbar-btn dtb-secondary" onclick="navigate('customers')">
          ← Müşterilere Dön
        </button>
        <button class="desktop-topbar-btn dtb-primary" onclick="openEditCustomer('${c.id}')">
          ✏️ Düzenle
        </button>` : '';
    } else if (page === 'appt-detail') {
      rightEl.innerHTML = `
        <button class="desktop-topbar-btn dtb-secondary" onclick="navigate('appointments')">
          ← Randevulara Dön
        </button>`;
    } else if (page === 'appointments') {
      rightEl.innerHTML = `
        <button class="desktop-topbar-btn dtb-primary" onclick="openAddAppointment()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Yeni Randevu
        </button>`;
    } else if (page === 'customers') {
      rightEl.innerHTML = `
        <button class="desktop-topbar-btn dtb-primary" onclick="openAddCustomer()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Müşteri Ekle
        </button>`;
    } else if (page === 'finance') {
      rightEl.innerHTML = `
        <button class="desktop-topbar-btn dtb-secondary" onclick="openAddExpense()">
          − Gider Ekle
        </button>
        <button class="desktop-topbar-btn dtb-primary" onclick="openAddIncome()">
          + Gelir Ekle
        </button>`;
    } else {
      rightEl.innerHTML = '';
    }
  }
}

// ═══════════════════════════════════════════════════════════
//  ANA SAYFA
// ═══════════════════════════════════════════════════════════
async function renderHome() {
  const customers = await cachedGet('customers', () => DB.getCustomers());
  const appointments = await cachedGet('appointments', () => DB.getAppointments());
  const expenses = await cachedGet('expenses', () => DB.getExpenses());
  const now = new Date();

  const monthApps = appointments.filter(a => { const d = new Date(a.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const totalIncome = appointments.filter(a => a.paymentStatus === 'odendi').reduce((s, a) => s + (+a.price || 0), 0);
  const monthIncome = monthApps.filter(a => a.paymentStatus === 'odendi').reduce((s, a) => s + (+a.price || 0), 0);
  const monthExp = expenses.filter(e => { const d = new Date(e.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((s, e) => s + (+e.amount || 0), 0);
  const net = monthIncome - monthExp;
  const todayApps = appointments.filter(a => isToday(a.date)).sort((a, b) => new Date(a.date) - new Date(b.date));
  const pendingRev = appointments.filter(a => a.paymentStatus !== 'odendi').reduce((s, a) => s + (+a.price || 0), 0);

  return `
  <div class="stats-row">
    <div class="stat-card blue" onclick="navigate('finance')">
      <div class="stat-icon-box blue">💰</div>
      <div class="stat-label">Bu Ay Gelir</div>
      <div class="stat-value blue">${fmt(monthIncome)}</div>
    </div>
    <div class="stat-card red" onclick="navigate('finance')">
      <div class="stat-icon-box red">📉</div>
      <div class="stat-label">Bu Ay Gider</div>
      <div class="stat-value red">${fmt(monthExp)}</div>
    </div>
    <div class="stat-card green" onclick="navigate('appointments')">
      <div class="stat-icon-box green">📋</div>
      <div class="stat-label">Bu Ay İşlem</div>
      <div class="stat-value green">${monthApps.length}</div>
    </div>
    <div class="stat-card orange" onclick="navigate('appointments')">
      <div class="stat-icon-box orange">📅</div>
      <div class="stat-label">Bugünkü İşler</div>
      <div class="stat-value orange">${todayApps.length}</div>
    </div>
  </div>

  
  ${(() => {
    // Generate Gold Card for mobile
    // Calculate total gold since we didn't fetch it in renderHome initially, wait we need to fetch it in renderHome!
    // We will do it inline or we have to add the fetch to renderHome.
    return '';
  })()}
  <div class="net-card" id="homeGoldCard">
    <div style="display:flex; justify-content:space-between; align-items:center; width:100%">
      <div>
        <div style="font-size:12px; font-weight:700; color:rgba(255,255,255,0.7); margin-bottom:4px">🪙 BU AY YATIRIM (ALTIN)</div>
        <div style="font-size:24px; font-weight:900; color:#FBBF24" id="homeGoldValue">Yükleniyor...</div>
        <div style="font-size:12px; color:rgba(255,255,255,0.7); margin-top:4px" id="homeGoldSub">Gram ve TL karşılığı</div>
      </div>
      <div style="font-size:32px; background:rgba(251,191,36,0.15); padding:12px; border-radius:12px; border:1px solid rgba(251,191,36,0.3)">📊</div>
    </div>
  </div>
  <div class="net-card">
    <div>
      <div class="net-label">🏆 Net Kazanç (Bu Ay)</div>
      <div class="net-value">${fmt(net)}</div>
      <div class="net-sub">${customers.length} müşteri · Toplam ${fmt(totalIncome)} tahsilat</div>
    </div>
    <div class="net-icon">📊</div>
  </div>

  <div class="action-btns">
    <button class="action-btn primary" onclick="openAddAppointment()">📅 Yeni Randevu Ekle</button>
  </div>
  <div class="action-btns" style="padding-top:8px">
    <button class="action-btn success" onclick="openAddIncome()">＋ Gelir Ekle</button>
    <button class="action-btn danger" onclick="openAddExpense()">－ Gider Ekle</button>
  </div>

  <div class="section">
    <div class="section-header">
      <span class="section-title">⏳ Bekleyen Tahsilat</span>
      <span class="section-link" onclick="navigate('appointments')">Tümünü Gör</span>
    </div>
    ${pendingRev > 0
      ? `<div class="pending-banner">⚠️ Toplam <strong>${fmt(pendingRev)}</strong> tahsilat bekliyor</div>`
      : `<div style="color:var(--success);font-size:13px;font-weight:600;padding:4px 0">✓ Tüm ödemeler tahsil edildi!</div>`}
  </div>

  <div class="section">
    <div class="section-header">
      <span class="section-title">📅 Bugünün Randevuları (${todayApps.length})</span>
      <span class="section-link" onclick="navigate('appointments')">Tümünü Gör</span>
    </div>
    ${todayApps.length === 0
      ? `<div class="empty" style="padding:24px 0"><div class="empty-icon" style="font-size:36px">📭</div><div class="empty-title" style="font-size:13px">Bugün randevu yok</div></div>`
      : todayApps.map(a => todayCard(a)).join('')}
  </div>
  <div style="height:10px"></div>`;
}

function todayCard(a) {
  const svc = getSvc(a.serviceType);
  const sens = getSens(a.sensitivity);
  const paid = a.paymentStatus === 'odendi';
  return `
  <div class="today-card" onclick="navigate('appt-detail',{apptId:'${a.id}'})">
    <div class="today-card-top">
      <div>
        <div class="today-card-name">${a.customerName || '—'}</div>
        <div class="today-card-meta">
          <div class="today-meta-row">🕐 ${fmtTime(a.date)} · ${svc.icon} ${svc.label}</div>
          ${a.customerAddress ? `<div class="today-meta-row">📍 ${a.customerAddress}</div>` : ''}
          ${a.duration ? `<div class="today-meta-row">⏱️ ${a.duration}</div>` : ''}
        </div>
      </div>
      <div class="today-card-right">
        <div class="today-price">${fmt(a.price)}</div>
        <span class="badge ${paid ? 'badge-paid' : 'badge-pending'}" style="margin-top:6px">${paid ? '✓ Ödendi' : 'Bekliyor'}</span>
      </div>
    </div>
    <div class="today-card-bottom">
      ${sens.id !== 'yok' ? `<span class="badge badge-sens">⚠️ ${sens.label}</span>` : ''}
      ${a.notes ? `<span style="font-size:11px;color:var(--text-muted)">📝 ${a.notes.slice(0, 45)}${a.notes.length > 45 ? '…' : ''}</span>` : ''}
      ${!paid ? `<button class="action-btn success" style="padding:7px 14px;font-size:12px;flex:none;margin-left:auto" onclick="event.stopPropagation();markPaid('${a.id}')">✓ Tahsil Et</button>` : ''}
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════
//  RANDEVULAR
// ═══════════════════════════════════════════════════════════
async function renderAppointments() {
  const all = (await cachedGet('appointments', () => DB.getAppointments())).sort((a, b) => new Date(b.date) - new Date(a.date));
  const now = new Date();
  const pendingAmt = all.filter(a => a.paymentStatus !== 'odendi').reduce((s, a) => s + (+a.price || 0), 0);

  const filtered = all.filter(a => {
    if (apptFilter === 'bekliyor') return a.paymentStatus !== 'odendi';
    if (apptFilter === 'odendi') return a.paymentStatus === 'odendi';
    if (apptFilter === 'bugun') return isToday(a.date);
    return true;
  });

  return `
  <div class="page-header">
    <div><div class="page-h-title">📅 Randevular</div><div class="page-h-sub">${all.length} toplam işlem</div></div>
    <button class="top-bar-btn" onclick="openAddAppointment()">➕ Ekle</button>
  </div>
  ${pendingAmt > 0 ? `<div class="pending-banner" style="margin:12px 16px 0">⏳ Bekleyen: <strong>${fmt(pendingAmt)}</strong></div>` : ''}
  <div class="filter-bar" style="padding-top:12px">
    ${[['hepsi', 'Tümü'], ['bugun', '📅 Bugün'], ['bekliyor', '⏳ Bekliyor'], ['odendi', '✓ Ödendi']]
      .map(([id, l]) => `<button class="filter-chip ${apptFilter === id ? 'active' : ''}" onclick="apptFilter='${id}';render()">${l}</button>`).join('')}
  </div>
  <div style="padding:12px 16px 0">
  ${filtered.length === 0
      ? `<div class="empty"><div class="empty-icon">📅</div><div class="empty-title">Bu filtrede randevu yok</div></div>`
      : filtered.map(a => apptCard(a, false)).join('')}
  </div>
  <div style="height:10px"></div>`;
}

function apptCard(a, inDetail) {
  const svc = getSvc(a.serviceType);
  const sens = getSens(a.sensitivity);
  const paid = a.paymentStatus === 'odendi';
  return `
  <div class="appt-item" onclick="navigate('appt-detail',{apptId:'${a.id}'})">
    <div class="appt-item-top">
      <div class="appt-svc-icon" style="background:${svc.color}20">${svc.icon}</div>
      <div class="appt-body">
        <div class="appt-svc">${svc.label}${a.serviceCustom ? ' — ' + a.serviceCustom : ''}</div>
        ${!inDetail ? `<div class="appt-cust">👤 ${a.customerName || '—'}</div>` : ''}
        ${a.customerAddress && !inDetail ? `<div class="appt-date">📍 ${a.customerAddress}</div>` : ''}
        <div class="appt-date">🕐 ${fmtDT(a.date)}${a.duration ? ' · ⏱️ ' + a.duration : ''}</div>
      </div>
      <div class="appt-right">
        <div class="appt-price">${fmt(a.price)}</div>
        <span class="badge ${paid ? 'badge-paid' : 'badge-pending'}" style="margin-top:4px">${paid ? '✓ Ödendi' : '⏳ Bekliyor'}</span>
      </div>
    </div>
    <div class="appt-item-bottom">
      ${sens.id !== 'yok' ? `<span class="badge badge-sens">⚠️ ${sens.label}</span>` : ''}
      ${a.notes ? `<span style="font-size:11px;color:var(--text-muted)">📝 ${a.notes.slice(0, 50)}${a.notes.length > 50 ? '…' : ''}</span>` : ''}
      <div style="margin-left:auto;display:flex;gap:6px">
        ${!paid ? `<button class="action-btn success" style="padding:7px 12px;font-size:11px;flex:none" onclick="event.stopPropagation();markPaid('${a.id}')">✓ Tahsil Et</button>` : ''}
        <button class="action-btn danger" style="padding:7px 10px;font-size:11px;flex:none" onclick="event.stopPropagation();confirmDeleteAppt('${a.id}')">🗑️</button>
      </div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════
//  RANDEVU DETAY
// ═══════════════════════════════════════════════════════════
async function renderApptDetail(id) {
  const a = await DB.getAppointmentById(id);
  if (!a) return `<div class="empty"><div class="empty-title">Bulunamadı</div></div>`;
  const svc = getSvc(a.serviceType);
  const sens = getSens(a.sensitivity);
  const paid = a.paymentStatus === 'odendi';

  return `
  <div class="page-header">
    <button class="back-btn" onclick="navigate('appointments')">← Geri</button>
  </div>
  <div class="detail-hero" style="background:linear-gradient(180deg,${svc.color}15 0%,transparent 100%)">
    <div style="font-size:52px;margin-bottom:10px">${svc.icon}</div>
    <div class="detail-name">${svc.label}${a.serviceCustom ? ' — ' + a.serviceCustom : ''}</div>
    <div class="detail-sub">🕐 ${fmtDT(a.date)}${a.duration ? ' · ⏱️ ' + a.duration : ''}</div>
  </div>

  <div style="padding:16px;display:flex;flex-direction:column;gap:12px">
    <div class="info-block" style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <div class="info-label">Ücret</div>
        <div style="font-size:32px;font-weight:900;color:var(--success)">${fmt(a.price)}</div>
      </div>
      <div style="text-align:right">
        <span class="badge ${paid ? 'badge-paid' : 'badge-pending'}" style="font-size:13px;padding:7px 14px">${paid ? '✓ Ödendi' : '⏳ Bekliyor'}</span>
        ${!paid ? `<br><button class="action-btn success" style="padding:9px 16px;font-size:13px;margin-top:8px" onclick="markPaid('${a.id}');render()">✓ Tahsil Et</button>` : ''}
      </div>
    </div>

    <div class="info-block">
      ${a.customerName ? `<div class="info-row"><div class="info-icon">👤</div><div><div class="info-label">Müşteri</div><div class="info-value">${a.customerName}</div></div></div>` : ''}
      ${a.customerPhone ? `<div class="info-row"><div class="info-icon">📞</div><div><div class="info-label">Telefon</div><div class="info-value"><a href="tel:${a.customerPhone}" style="color:var(--primary);text-decoration:none">${a.customerPhone}</a></div></div></div>` : ''}
      ${a.customerAddress ? `<div class="info-row"><div class="info-icon">📍</div><div><div class="info-label">Adres</div><div class="info-value">${a.customerAddress}</div></div></div>` : ''}
      ${sens.id !== 'yok' ? `<div class="info-row"><div class="info-icon">⚠️</div><div><div class="info-label">Hassasiyet</div><div class="info-value" style="color:${sens.color};font-weight:700">${sens.label}</div></div></div>` : ''}
      ${a.notes ? `<div class="info-row"><div class="info-icon">📝</div><div><div class="info-label">Notlar</div><div class="info-value">${a.notes}</div></div></div>` : ''}
    </div>

    <div style="display:flex;gap:10px">
      ${a.customerPhone ? `<a href="https://wa.me/90${a.customerPhone.replace(/\D/g, '').slice(-10)}" class="action-btn success" style="flex:1;text-decoration:none"><img src="https://img.icons8.com/?size=100&id=16713&format=png&color=000000" class="wa-logo" alt="WA"> WhatsApp</a>` : ''}
      ${a.customerPhone ? `<a href="tel:${a.customerPhone}" class="action-btn primary" style="flex:1;text-decoration:none">📞 Ara</a>` : ''}
    </div>
    <button class="save-btn danger" onclick="confirmDeleteAppt('${a.id}',true)">🗑️ Bu İşlemi Sil</button>
  </div>
  <div style="height:20px"></div>`;
}

// ═══════════════════════════════════════════════════════════
//  MÜŞTERİLER
// ═══════════════════════════════════════════════════════════
async function renderCustomers() {
  const all = await cachedGet('customers', () => DB.getCustomers());
  // Tüm randevuları tek seferde çek (customerCard'da N+1 sorguyu önler)
  const allAppts = await cachedGet('appointments', () => DB.getAppointments());

  const q = searchQ.toLowerCase();
  const list = q ? all.filter(c => (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q) || (c.address || '').toLowerCase().includes(q)) : all;

  return `
  <div class="page-header">
    <div><div class="page-h-title">👥 Müşteri Rehberi</div><div class="page-h-sub">${all.length} kayıtlı müşteri</div></div>
    <button class="top-bar-btn" onclick="openAddCustomer()">👤 Müşteri Ekle</button>
  </div>
  <div class="search-wrap">
    <div class="search-bar">
      <span style="font-size:16px">🔍</span>
      <input type="text" placeholder="Müşteri adı veya telefon ile ara..." value="${searchQ}"
        oninput="searchQ=this.value;render()"/>
      ${searchQ ? `<span onclick="searchQ='';render()" style="cursor:pointer;color:var(--text-muted);font-size:18px;padding:0 4px">×</span>` : ''}
    </div>
  </div>
  <div style="padding:8px 16px 0">
  ${list.length === 0
      ? `<div class="empty"><div class="empty-icon">👥</div><div class="empty-title">${q ? 'Sonuç bulunamadı' : 'Henüz müşteri eklenmedi'}</div>${!q ? `<button class="action-btn primary" style="margin-top:12px" onclick="openAddCustomer()">İlk Müşteriyi Ekle</button>` : ''}</div>`
      : list.map(c => customerCardSync(c, allAppts)).join('')}
  </div>
  <div style="height:10px"></div>`;
}

// Senkron (önceden yüklenmiş randevuları kullan) — N+1 sorgu yok!
function customerCardSync(c, allAppts) {
  const apps = allAppts.filter(a => a.customerId === c.id);
  const totalPaid = apps.filter(a => a.paymentStatus === 'odendi').reduce((s, a) => s + (+a.price || 0), 0);
  const hasSens = c.sensitivityNote;

  return `
  <div class="customer-card">
    <div class="customer-card-top" onclick="navigate('customer-detail',{customerId:'${c.id}'})">
      <div class="avatar">${initials(c.name)}</div>
      <div style="flex:1;min-width:0">
        <div class="cust-name">${c.name}</div>
        ${c.phone ? `<div class="cust-phone">📞 ${c.phone}</div>` : ''}
        ${c.address ? `<div class="cust-address">📍 ${c.address}</div>` : ''}
        ${hasSens ? `<span class="badge badge-sens" style="margin-top:5px;font-size:10px">⚠️ ${c.sensitivityNote}</span>` : ''}
        ${apps.length > 0 ? `<div style="font-size:11px;color:var(--text-muted);margin-top:4px">🔄 ${apps.length} işlem · ${fmt(totalPaid)} ödendi</div>` : ''}
      </div>
    </div>
    <div class="customer-card-actions">
      <button class="cust-btn detail" onclick="navigate('customer-detail',{customerId:'${c.id}'})">📋 Detay</button>
      ${c.phone ? `<a href="https://wa.me/90${(c.phone || '').replace(/\D/g, '').slice(-10)}" class="cust-btn wa"><img src="https://img.icons8.com/?size=100&id=16713&format=png&color=000000" class="wa-logo" alt="WA"> WA</a>` : ''}
      ${c.phone ? `<a href="tel:${c.phone}" class="cust-btn call">📞 Ara</a>` : ''}
      <button class="cust-btn del" onclick="confirmDeleteCustomer('${c.id}','${escape(c.name)}')">🗑️</button>
    </div>
  </div>`;
}

// Eski async versiyon (tekil kullanım için)
async function customerCard(c) {
  const allAppts = await cachedGet('appointments', () => DB.getAppointments());
  return customerCardSync(c, allAppts);
}

// ═══════════════════════════════════════════════════════════
//  MÜŞTERİ DETAY
// ═══════════════════════════════════════════════════════════
async function renderCustomerDetail(id) {
  const c = await DB.getCustomerById(id);
  if (!c) return `<div class="empty"><div class="empty-title">Müşteri bulunamadı</div></div>`;
  const allAppts = await cachedGet('appointments', () => DB.getAppointments());
  const apps = allAppts.filter(a => a.customerId === id);
  const totalPaid = apps.filter(a => a.paymentStatus === 'odendi').reduce((s, a) => s + (+a.price || 0), 0);
  const pending = apps.filter(a => a.paymentStatus !== 'odendi').reduce((s, a) => s + (+a.price || 0), 0);

  return `
  <div class="page-header">
    <button class="back-btn" onclick="navigate('customers')">← Geri</button>
  </div>
  <div class="detail-hero">
    <div class="avatar-xl">${initials(c.name)}</div>
    <div class="detail-name">${c.name}</div>
    <div class="detail-sub">Müşteri · ${new Date(c.createdAt).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</div>
    <div class="detail-stats">
      <div class="d-stat"><div class="d-stat-val">${apps.length}</div><div class="d-stat-label">İşlem</div></div>
      <div class="d-stat"><div class="d-stat-val text-success" style="font-size:15px">${fmt(totalPaid)}</div><div class="d-stat-label">Ödendi</div></div>
      ${pending > 0 ? `<div class="d-stat"><div class="d-stat-val text-warning" style="font-size:15px">${fmt(pending)}</div><div class="d-stat-label">Bekliyor</div></div>` : ''}
    </div>
  </div>

  <div style="padding:16px;display:flex;flex-direction:column;gap:12px">
    <!-- Hızlı Aksiyonlar -->
    <div style="display:flex;gap:8px">
      <button class="action-btn primary" style="flex:2" onclick="openAddAppointment('${c.id}','${escape(c.name)}','${escape(c.phone || '')}','${escape(c.address || '')}')">📅 Yeni İşlem Ekle</button>
      ${c.phone ? `<a href="https://wa.me/90${(c.phone || '').replace(/\D/g, '').slice(-10)}" class="action-btn success" style="flex:1;text-decoration:none;font-size:12px"><img src="https://img.icons8.com/?size=100&id=16713&format=png&color=000000" class="wa-logo" alt="WA"> WA</a>` : ''}
      ${c.phone ? `<a href="tel:${c.phone}" class="action-btn primary" style="flex:1;text-decoration:none;background:var(--surface2);box-shadow:none;font-size:12px">📞 Ara</a>` : ''}
    </div>

    <!-- Bilgiler -->
    <div class="info-block">
      <div class="info-label" style="margin-bottom:12px">📋 İletişim Bilgileri</div>
      ${c.phone ? `<div class="info-row"><div class="info-icon">📞</div><div><div class="info-label">Telefon</div><div class="info-value"><a href="tel:${c.phone}" style="color:var(--primary);text-decoration:none">${c.phone}</a></div></div></div>` : ''}
      ${c.address ? `<div class="info-row"><div class="info-icon">📍</div><div><div class="info-label">Adres</div><div class="info-value">${c.address}</div></div></div>` : ''}
      ${c.sensitivityNote ? `<div class="info-row"><div class="info-icon">⚠️</div><div><div class="info-label">Hassasiyet Notu</div><div class="info-value" style="color:#F87171">${c.sensitivityNote}</div></div></div>` : ''}
      ${c.notes ? `<div class="info-row"><div class="info-icon">📝</div><div><div class="info-label">Özel Notlar</div><div class="info-value">${c.notes}</div></div></div>` : ''}
      ${!c.phone && !c.address && !c.notes ? `<div style="color:var(--text-muted);font-size:13px">Detay bilgi eklenmemiş</div>` : ''}
    </div>
    
    <button class="save-btn danger" style="margin-top:8px" onclick="confirmDeleteCustomerIncomes('${c.id}', '${escape(c.name)}')">🗑️ Müşterinin Tüm Gelirlerini Sil</button>

    <!-- İşlem Geçmişi -->
    <div style="font-size:13px;font-weight:700;color:var(--text-sec);text-transform:uppercase;letter-spacing:0.8px">
      📁 İşlem Geçmişi (${apps.length})
    </div>
    ${apps.length === 0
      ? `<div class="empty" style="padding:24px 0"><div class="empty-title">Henüz işlem yok</div></div>`
      : apps.map(a => apptCard(a, true)).join('')}
  </div>
  <div style="height:20px"></div>`;
}

// ═══════════════════════════════════════════════════════════
//  FİNANS
// ═══════════════════════════════════════════════════════════

// Ay filtresi için yardımcı
function getMonthOptions(items) {
  const months = new Set();
  items.forEach(i => {
    const d = new Date(i.date || i.createdAt);
    if (!isNaN(d)) months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  });
  return Array.from(months).sort().reverse();
}

async function renderFinance() {
  const appointments = await cachedGet('appointments', () => DB.getAppointments());
  const expenses = await cachedGet('expenses', () => DB.getExpenses());
  const golds = await cachedGet('gold', () => window.DB.getGolds ? window.DB.getGolds() : []);
  const now = new Date();

  const allIncomes = appointments.filter(a => a.paymentStatus === 'odendi')
    .map(a => ({ id: a.id, name: a.customerName || 'Müşteri', desc: a.serviceLabel || 'İşlem', amount: +a.price || 0, date: a.date, type: 'income', icon: getSvc(a.serviceType).icon }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const allExpList = expenses.map(e => ({ ...e, type: 'expense', icon: getExpCat(e.category).icon, desc: getExpCat(e.category).label }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const filterByMonth = (items) => {
    if (finMonth === 'all') return items;
    return items.filter(i => {
      const d = new Date(i.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === finMonth;
    });
  };

  const incomes = filterByMonth(allIncomes);
  const expList = filterByMonth(allExpList);
  const goldList = filterByMonth(golds);

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpense = expList.reduce((s, e) => s + e.amount, 0);
  const totalGoldGrams = golds.reduce((s, g) => s + (g.type === 'add' ? g.grams : -g.grams), 0);
  const totalGoldValue = totalGoldGrams * currentGoldPrice;
  const net = totalIncome - totalExpense + totalGoldValue;

  let listHtml = '';
  if (finTab === 'gold') {
    setTimeout(() => initGoldChart(goldList), 50);
    listHtml = `
      <div style="padding:16px;background:var(--surface);border-bottom:1px solid var(--border)">
        <div style="font-size:12px;color:var(--text-muted);font-weight:700;margin-bottom:8px">ALTIN GRAFİĞİ (GELİŞİM)</div>
        <div style="height:150px;width:100%"><canvas id="goldChart"></canvas></div>
      </div>
      ${goldList.length === 0 ? '<div class="empty"><div class="empty-title">Altın işlemi yok</div></div>' : goldList.map(g => `
      <div class="fin-item">
        <div class="fin-item-icon" style="background:var(--warning-bg)">🪙</div>
        <div class="fin-item-body">
          <div class="fin-item-name">${g.type === 'add' ? 'Altın Eklendi' : 'Altın Çıkarıldı'}</div>
          <div class="fin-item-sub"><span>${fmtDT(g.date)}</span><span>·</span><span>${g.note || ''}</span></div>
        </div>
        <div class="fin-item-amount ${g.type === 'add' ? 'income' : 'expense'}" style="color:var(--warning)">
          ${g.type === 'add' ? '+' : '-'}${g.grams} gr
        </div>
        <button onclick="event.stopPropagation();confirmDeleteGold('${g.id}')" style="background:none;border:none;color:var(--error);font-size:16px;cursor:pointer;padding:4px">🗑️</button>
      </div>`).join('')}
    `;
  } else {
    const list = finTab === 'income' ? incomes : expList;
    listHtml = list.length === 0
      ? `<div class="empty"><div class="empty-icon">${finTab === 'income' ? '💰' : '📉'}</div><div class="empty-title">${finTab === 'income' ? 'Henüz gelir yok' : 'Henüz gider kaydı yok'}</div></div>`
      : list.map(item => `
      <div class="fin-item" onclick="${finTab === 'expense' ? `confirmDeleteExpense('${item.id}')` : ''}" style="${finTab === 'income' ? 'cursor:default' : ''}">
        <div class="fin-item-icon" style="background:${finTab === 'income' ? 'var(--success-bg)' : 'var(--error-bg)'}">${item.icon}</div>
        <div class="fin-item-body">
          <div class="fin-item-name">${item.name}</div>
          <div class="fin-item-sub">
            <span>${fmtD(item.date)}</span>
            <span>·</span>
            <span>${item.desc}</span>
            ${finTab === 'income' && item.id ? `<span class="badge badge-paid" style="font-size:10px;padding:2px 8px">Ödendi</span>` : ''}
          </div>
        </div>
        <div class="fin-item-amount ${finTab === 'income' ? 'income' : 'expense'}">
          ${finTab === 'income' ? '+' : '-'}${fmt(item.amount)}
        </div>
        ${finTab === 'expense' ? `<button onclick="event.stopPropagation();confirmDeleteExpense('${item.id}')" style="background:none;border:none;color:var(--error);font-size:16px;cursor:pointer;padding:4px">🗑️</button>` : ''}
      </div>`).join('');
  }

  const allDates = [...allIncomes, ...allExpList, ...golds];
  const monthOpts = getMonthOptions(allDates);
  const monthLabel = (m) => {
    if (m === 'all') return 'Tüm Zamanlar';
    const [y, mo] = m.split('-');
    return new Date(+y, +mo - 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  };

  return `
  <div class="page-header">
    <div><div class="page-h-title">💳 Kasa & Finans</div><div class="page-h-sub">Net Kazanç: <strong class="${net >= 0 ? 'text-success' : 'text-error'}">${fmt(net)}</strong></div></div>
    <button class="top-bar-btn" onclick="${finTab === 'income' ? 'openAddIncome()' : (finTab === 'expense' ? 'openAddExpense()' : 'openAddGold()')}">
      ${finTab === 'income' ? '＋ Gelir' : (finTab === 'expense' ? '＋ Gider' : '🪙 Altın')}
    </button>
  </div>

  <div style="padding:10px 16px 0;display:flex;align-items:center;gap:8px">
    <span style="font-size:11px;color:var(--text-muted);font-weight:600">📅 Dönem:</span>
    <select class="form-input" style="flex:1;padding:7px 10px;font-size:12px;height:auto" onchange="finMonth=this.value;render()">
      <option value="all" ${finMonth === 'all' ? 'selected' : ''}>Tüm Zamanlar</option>
      ${monthOpts.map(m => `<option value="${m}" ${finMonth === m ? 'selected' : ''}>${monthLabel(m)}</option>`).join('')}
    </select>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 16px 0">
    <div style="background:var(--success-bg);border:1px solid rgba(16,185,129,0.2);border-radius:var(--r-md);padding:12px;text-align:center">
      <div style="font-size:10px;color:var(--success);font-weight:700;margin-bottom:4px">GELİR</div>
      <div style="font-size:14px;font-weight:900;color:var(--success)">${fmt(totalIncome)}</div>
    </div>
    <div style="background:var(--error-bg);border:1px solid rgba(239,68,68,0.2);border-radius:var(--r-md);padding:12px;text-align:center">
      <div style="font-size:10px;color:var(--error);font-weight:700;margin-bottom:4px">GİDER</div>
      <div style="font-size:14px;font-weight:900;color:var(--error)">${fmt(totalExpense)}</div>
    </div>
  </div>
  <div style="background:var(--warning-bg);border:1px solid var(--warning-border);border-radius:var(--r-md);padding:12px;margin:8px 16px 0;display:flex;justify-content:space-between;align-items:center">
    <div>
      <div style="font-size:10px;color:var(--warning);font-weight:700;margin-bottom:4px">ALTIN KASASI (${totalGoldGrams} gr)</div>
      <div style="font-size:14px;font-weight:900;color:var(--warning)">${fmt(totalGoldValue)}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:10px;color:var(--text-muted);font-weight:600">GÜNCEL KUR</div>
      <div style="font-size:12px;font-weight:700;color:var(--text)">${fmt(currentGoldPrice)} / gr</div>
    </div>
  </div>

  <div class="fin-tabs">
    <button class="fin-tab income ${finTab === 'income' ? 'active' : ''}" onclick="finTab='income';updateTopBar();render()">💰 Gelirler</button>
    <button class="fin-tab expense ${finTab === 'expense' ? 'active' : ''}" onclick="finTab='expense';updateTopBar();render()">📉 Giderler</button>
    <button class="fin-tab gold ${finTab === 'gold' ? 'active' : ''}" style="${finTab === 'gold' ? 'color:var(--warning);border-bottom-color:var(--warning)' : ''}" onclick="finTab='gold';updateTopBar();render()">🪙 Altın</button>
  </div>

  <div style="background:var(--surface);border-radius:var(--r-lg);margin:0 16px;border:1px solid var(--border);overflow:hidden">
    ${listHtml}
  </div>
  <div style="height:20px"></div>`;
}

// ═══════════════════════════════════════════════════════════
//  MODAL: RANDEVU EKLE
// ═══════════════════════════════════════════════════════════
async function openAddAppointment(customerId, customerName, customerPhone, customerAddress) {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 16);
  const customers = await DB.getCustomers();
  const hasCustomer = !!customerId;

  openModal('📅 Yeni Randevu', `
    <div class="form-group">
      <label class="form-label">Müşteri</label>
      ${hasCustomer
      ? `<div style="background:var(--primary-glow);border:1.5px solid var(--primary);border-radius:var(--r-md);padding:12px;font-weight:700;color:var(--primary)">👤 ${customerName}</div>
           <input type="hidden" id="a_cid" value="${customerId}">
           <input type="hidden" id="a_cname" value="${customerName}">
           <input type="hidden" id="a_cphone" value="${customerPhone || ''}">
           <input type="hidden" id="a_caddr" value="${customerAddress || ''}">`
      : `<select class="form-input" id="a_cid" onchange="fillCustomerInfo(this)">
             <option value="">— Müşteri Seç —</option>
             ${customers.map(c => `<option value="${c.id}" data-phone="${escape(c.phone || '')}" data-addr="${escape(c.address || '')}">${c.name}${c.phone ? ' (' + c.phone + ')' : ''}</option>`).join('')}
           </select>
           <input type="hidden" id="a_cname" value="">
           <input type="hidden" id="a_cphone" value="">
           <input type="hidden" id="a_caddr" value="">
           <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
             <span style="font-size:12px;color:var(--text-muted)">veya</span>
             <button class="top-bar-btn" onclick="closeModal();openAddCustomer()">+ Yeni Müşteri Oluştur</button>
           </div>`}
    </div>

    <div class="form-group">
      <label class="form-label">Hizmet Türü</label>
      <div class="option-grid" id="svcGrid">
        ${SERVICES.map((s, i) => `<button class="option-pill ${i === 0 ? 'selected' : ''}" data-svc="${s.id}" onclick="selectPill('#svcGrid','svc','${s.id}')">${s.icon} ${s.label}</button>`).join('')}
      </div>
      <input class="form-input" id="a_svc_custom" placeholder="Ek açıklama (isteğe bağlı)" style="margin-top:10px">
    </div>

    <div class="form-row form-group">
      <div>
        <label class="form-label">Tarih & Saat</label>
        <input class="form-input" id="a_date" type="datetime-local" value="${dateStr}">
      </div>
      <div>
        <label class="form-label">Süre</label>
        <input class="form-input" id="a_dur" placeholder="Örn: 2 saat">
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Deterjana Hassasiyet</label>
      <div class="option-grid" id="sensGrid">
        ${SENSITIVITY.map((s, i) => `<button class="option-pill ${i === 0 ? 'selected' : ''}" data-sens="${s.id}"
          onclick="selectSensPill('${s.id}')" style="${i === 0 ? `border-color:${s.color};background:${s.color}20;color:${s.color}` : ''}">
          ${s.label}</button>`).join('')}
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Tahmini Tutar (₺)</label>
      <div class="price-wrap">
        <input id="a_price" type="number" placeholder="0" min="0" step="1">
        <span class="price-wrap-unit">₺</span>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Ödeme Durumu</label>
      <div class="pay-toggle">
        <button class="pay-btn w" id="pb_bek" onclick="selectPay('bekliyor')">⏳ Bekliyor</button>
        <button class="pay-btn" id="pb_ode" onclick="selectPay('odendi')">✓ Ödendi</button>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Notlar</label>
      <textarea class="form-input" id="a_notes" placeholder="Kullanılan malzeme, özel istek, adres detayı..."></textarea>
    </div>

    <button class="save-btn" onclick="saveAppointment()">✓ Randevuyu Kaydet</button>
  `);
}

function fillCustomerInfo(sel) {
  const opt = sel.options[sel.selectedIndex];
  document.getElementById('a_cname').value = opt.text.split(' (')[0] || '';
  document.getElementById('a_cphone').value = opt.dataset.phone || '';
  document.getElementById('a_caddr').value = opt.dataset.addr || '';
}

function selectPill(container, attr, val) {
  document.querySelectorAll(`${container} .option-pill`).forEach(b => {
    b.classList.toggle('selected', b.dataset[attr] === val);
  });
}

function selectSensPill(id) {
  const s = getSens(id);
  document.querySelectorAll('#sensGrid .option-pill').forEach(b => {
    const active = b.dataset.sens === id;
    b.classList.toggle('selected', active);
    b.style.cssText = active ? `border-color:${s.color};background:${s.color}20;color:${s.color}` : '';
  });
}

function selectPay(val) {
  document.getElementById('pb_bek').className = 'pay-btn' + (val === 'bekliyor' ? ' w' : '');
  document.getElementById('pb_ode').className = 'pay-btn' + (val === 'odendi' ? ' s' : '');
}

async function saveAppointment() {
  const cidEl = document.getElementById('a_cid');
  const cid = cidEl.tagName === 'SELECT' ? cidEl.value : cidEl.value;
  const cname = document.getElementById('a_cname').value || (cidEl.tagName === 'SELECT' ? cidEl.options[cidEl.selectedIndex]?.text?.split(' (')[0] : '');
  const cphone = document.getElementById('a_cphone').value;
  const caddr = document.getElementById('a_caddr').value;

  if (!cname) { showToast('Müşteri seçiniz!', 'error'); return; }
  const svcId = document.querySelector('#svcGrid .option-pill.selected')?.dataset.svc || 'diger';
  const sensId = document.querySelector('#sensGrid .option-pill.selected')?.dataset.sens || 'yok';
  const paid = document.getElementById('pb_ode').classList.contains('s') ? 'odendi' : 'bekliyor';
  const dateV = document.getElementById('a_date').value;
  const svc = getSvc(svcId);

  await DB.saveAppointment({
    id: uid(), customerId: cid, customerName: cname,
    customerPhone: cphone, customerAddress: caddr,
    serviceType: svcId, serviceLabel: svc.label, serviceIcon: svc.icon,
    serviceCustom: document.getElementById('a_svc_custom').value.trim(),
    sensitivity: sensId,
    price: parseFloat(document.getElementById('a_price').value) || 0,
    notes: document.getElementById('a_notes').value.trim(),
    duration: document.getElementById('a_dur').value.trim(),
    paymentStatus: paid,
    date: dateV ? new Date(dateV).toISOString() : new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });
  invalidateCache('appointments'); // Önbelleği temizle
  closeModal(); showToast('Randevu kaydedildi ✓', 'success'); render();
}

// ═══════════════════════════════════════════════════════════
//  MODAL: MÜŞTERİ EKLE / DÜZENLE
// ═══════════════════════════════════════════════════════════
function openEditCustomer(id) { openAddCustomer(id); }

async function openAddCustomer(editId) {
  const c = editId ? await DB.getCustomerById(editId) : null;
  openModal(c ? '✏️ Müşteriyi Düzenle' : '👤 Yeni Müşteri', `
    <div class="form-group">
      <label class="form-label">Ad Soyad <span style="color:var(--error)">*</span></label>
      <input class="form-input" id="c_name" placeholder="Ahmet Yılmaz" value="${escape(c?.name || '')}">
    </div>
    <div class="form-group">
      <label class="form-label">Telefon Numarası</label>
      <input class="form-input" id="c_phone" type="tel" placeholder="05XX XXX XX XX" value="${escape(c?.phone || '')}">
    </div>
    <div class="form-group">
      <label class="form-label">Adres</label>
      <textarea class="form-input" id="c_addr" placeholder="Mahalle, sokak, kapı no...">${c?.address || ''}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Hassasiyet Notu <span style="color:var(--text-muted);font-weight:500">(leke çıkarıcı, deterjan vb.)</span></label>
      <input class="form-input" id="c_sens" placeholder="Örn: Leke çıkarıcıya hassasiyeti var" value="${escape(c?.sensitivityNote || '')}">
    </div>
    <div class="form-group">
      <label class="form-label">Özel Notlar</label>
      <textarea class="form-input" id="c_notes" placeholder="Hatırlatmalar, özel istekler...">${c?.notes || ''}</textarea>
    </div>
    <button class="save-btn" onclick="saveCustomer(${editId ? `'${editId}'` : 'null'})">${c ? '✓ Güncelle' : '✓ Müşteriyi Ekle'}</button>
  `);
}


async function saveCustomer(editId) {
  const name = document.getElementById('c_name').value.trim();
  if (!name) { showToast('Ad soyad zorunludur!', 'error'); return; }
  let createdAt = new Date().toISOString();
  if (editId) {
    const cached = await cachedGet('customers', () => DB.getCustomers());
    createdAt = cached.find(c => c.id === editId)?.createdAt || createdAt;
  }
  await DB.saveCustomer({
    id: editId || uid(), name,
    phone: document.getElementById('c_phone').value.trim(),
    address: document.getElementById('c_addr').value.trim(),
    sensitivityNote: document.getElementById('c_sens').value.trim(),
    notes: document.getElementById('c_notes').value.trim(),
    createdAt,
    updatedAt: new Date().toISOString(),
  });
  invalidateCache('customers'); // Önbelleği temizle
  closeModal(); showToast(editId ? 'Müşteri güncellendi ✓' : 'Müşteri eklendi ✓', 'success'); render();
}

// ═══════════════════════════════════════════════════════════
//  MODAL: GELİR / GİDER EKLE
// ═══════════════════════════════════════════════════════════
async function openAddIncome() {
  const customers = await DB.getCustomers();
  const now = new Date().toISOString().slice(0, 10);
  openModal('💰 Gelir Ekle', `
    <div class="form-group">
      <label class="form-label">Birim / Tutar</label>
      <div style="display:flex;gap:8px">
        <div class="price-wrap" style="flex:2">
          <input id="i_amt" type="number" placeholder="0" min="0" step="0.01">
        </div>
        <select id="i_currency" class="form-input" style="flex:1" onchange="document.getElementById('i_cust_wrap').style.display = this.value === 'TRY' ? 'block' : 'none'">
          <option value="TRY">₺ TL</option>
          <option value="GOLD">🪙 Altın (gr)</option>
        </select>
      </div>
    </div>
    <div class="form-group" id="i_cust_wrap">
      <label class="form-label">Müşteri (isteğe bağlı)</label>
      <select class="form-input" id="i_cust">
        <option value="">— Genel Gelir —</option>
        ${customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Açıklama</label>
      <input class="form-input" id="i_desc" placeholder="Satış, yatırım vb.">
    </div>
    <div class="form-group">
      <label class="form-label">Tarih</label>
      <input class="form-input" id="i_date" type="date" value="${now}">
    </div>
    <button class="save-btn success-btn" onclick="saveIncome()">＋ Kaydet</button>
  `);
}

async function saveIncome() {
  const amt = parseFloat(document.getElementById('i_amt').value) || 0;
  if (!amt) { showToast('Tutar giriniz!', 'error'); return; }
  const currency = document.getElementById('i_currency').value;
  const desc = document.getElementById('i_desc').value.trim();
  const dateVal = document.getElementById('i_date').value;

  if (currency === 'GOLD') {
    const g = {
      id: uid(),
      type: 'add',
      grams: amt,
      note: desc || 'Altın Geliri',
      date: dateVal ? dateVal + 'T12:00:00Z' : new Date().toISOString()
    };
    await window.DB.saveGold(g);
    invalidateCache('gold');
    showToast('Altın geliri eklendi');
    closeModal();
    render();
    return;
  }

  const custId = document.getElementById('i_cust').value;
  const customers = await cachedGet('customers', () => DB.getCustomers());
  const cust = custId ? customers.find(c => c.id === custId) : null;
  const a = {
    id: uid(),
    customerId: custId || null,
    customerName: cust ? cust.name : null,
    serviceType: 'diger',
    serviceLabel: desc || 'Genel Gelir',
    price: amt,
    date: dateVal ? dateVal + 'T12:00:00Z' : new Date().toISOString(),
    paymentStatus: 'odendi',
    sensitivity: 'yok'
  };
  await DB.saveAppointment(a);
  invalidateCache('appointments');
  showToast('Gelir kaydedildi');
  closeModal();
  render();
}

function openAddExpense() {
  const now = new Date().toISOString().slice(0, 10);
  openModal('📉 Gider Ekle', `
    <div class="form-group">
      <label class="form-label">Birim / Tutar</label>
      <div style="display:flex;gap:8px">
        <div class="price-wrap" style="flex:2">
          <input id="e_amt" type="number" placeholder="0" min="0" step="0.01">
        </div>
        <select id="e_currency" class="form-input" style="flex:1" onchange="document.getElementById('e_cat_wrap').style.display = this.value === 'TRY' ? 'block' : 'none'">
          <option value="TRY">₺ TL</option>
          <option value="GOLD">🪙 Altın (gr)</option>
        </select>
      </div>
    </div>
    <div class="form-group" id="e_cat_wrap">
      <label class="form-label">Gider Kategorisi</label>
      <div class="option-grid" id="expGrid">
        ${EXPENSE_CATS.map((e, i) => `<button class="option-pill ${i === 0 ? 'selected' : ''}" data-exp="${e.id}" onclick="selectPill('#expGrid','exp','${e.id}')">${e.icon} ${e.label}</button>`).join('')}
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Açıklama</label>
      <input class="form-input" id="e_desc" placeholder="Örn: Deterjan, altın bozdurma vb.">
    </div>
    <div class="form-group">
      <label class="form-label">Tarih</label>
      <input class="form-input" id="e_date" type="date" value="${now}">
    </div>
    <button class="save-btn danger" onclick="saveExpense()">－ Kaydet</button>
  `);
}

async function saveExpense() {
  const amt = parseFloat(document.getElementById('e_amt').value) || 0;
  if (!amt) { showToast('Tutar giriniz!', 'error'); return; }
  const currency = document.getElementById('e_currency').value;
  const dateVal = document.getElementById('e_date').value;

  if (currency === 'GOLD') {
    const g = {
      id: uid(),
      type: 'remove',
      grams: amt,
      note: 'Altın Gideri / Bozdurma',
      date: dateVal ? dateVal + 'T12:00:00Z' : new Date().toISOString()
    };
    await window.DB.saveGold(g);
    invalidateCache('gold');
    showToast('Altın çıkarıldı');
    closeModal();
    render();
    return;
  }

  const catEl = document.querySelector('#catGrid .selected');
  const cat = catEl ? catEl.dataset.cat : 'diger';
  const e = {
    id: uid(),
    category: cat,
    amount: amt,
    date: dateVal ? dateVal + 'T12:00:00Z' : new Date().toISOString()
  };
  await DB.saveExpense(e);
  invalidateCache('expenses');
  showToast('Gider kaydedildi');
  closeModal();
  render();
}

// ═══════════════════════════════════════════════════════════
//  HELPER ACTIONS
// ═══════════════════════════════════════════════════════════
async function markPaid(id) {
  const allAppts = await cachedGet('appointments', () => DB.getAppointments());
  const a = allAppts.find(x => x.id === id) || await DB.getAppointmentById(id);
  if (!a) return;
  await DB.saveAppointment({ ...a, paymentStatus: 'odendi' });
  invalidateCache('appointments'); // Önbelleği temizle
  showToast('Tahsilat tamamlandı ✓', 'success');
  render();
}

async function confirmDeleteAppt(id, goBack) {
  const a = await DB.getAppointmentById(id); if (!a) return;
  openModal('🗑️ İşlemi Sil', `
    <p style="color:var(--text-sec);margin-bottom:24px;line-height:1.6">"<strong>${getSvc(a.serviceType).label}</strong>" randevusunu silmek istiyor musunuz? Bu işlem geri alınamaz.</p>
    <div style="display:flex;gap:10px">
      <button class="save-btn" style="background:var(--surface2);box-shadow:none;flex:1" onclick="closeModal()">İptal</button>
      <button class="save-btn danger" style="flex:1" onclick="DB.deleteAppointment('${id}');invalidateCache('appointments');closeModal();showToast('Silindi','error');${goBack ? `navigate('appointments');` : ``}render()">Sil</button>
    </div>
  `);
}

async function confirmDeleteCustomer(id, name) {
  openModal('🗑️ Müşteri Sil', `
    <p style="color:var(--text-sec);margin-bottom:24px;line-height:1.6">"<strong>${name}</strong>" müşterisini ve tüm işlem geçmişini silmek istiyor musunuz?</p>
    <div style="display:flex;gap:10px">
      <button class="save-btn" style="background:var(--surface2);box-shadow:none;flex:1" onclick="closeModal()">İptal</button>
      <button class="save-btn danger" style="flex:1" onclick="DB.deleteCustomer('${id}');invalidateCache('customers');closeModal();showToast('Müşteri silindi','error');render()">Sil</button>
    </div>
  `);
}

async function confirmDeleteExpense(id) {
  openModal('🗑️ Gider Sil', `
    <p style="color:var(--text-sec);margin-bottom:24px">Bu gider kaydını silmek istiyor musunuz?</p>
    <div style="display:flex;gap:10px">
      <button class="save-btn" style="background:var(--surface2);box-shadow:none;flex:1" onclick="closeModal()">İptal</button>
      <button class="save-btn danger" style="flex:1" onclick="DB.deleteExpense('${id}');invalidateCache('expenses');closeModal();showToast('Silindi','error');render()">Sil</button>
    </div>
  `);
}

async function confirmDeleteCustomerIncomes(id, name) {
  openModal('🗑️ Tüm Gelirleri Sil', `
    <p style="color:var(--text-sec);margin-bottom:24px">"<strong>${name}</strong>" müşterisine ait tüm gelir (ödenmiş işlem) kayıtlarını silmek istiyor musunuz?</p>
    <div style="display:flex;gap:10px">
      <button class="save-btn" style="background:var(--surface2);box-shadow:none;flex:1" onclick="closeModal()">İptal</button>
      <button class="save-btn danger" style="flex:1" onclick="executeDeleteCustomerIncomes('${id}')">Sil</button>
    </div>
  `);
}

async function executeDeleteCustomerIncomes(customerId) {
  const allAppts = await cachedGet('appointments', () => DB.getAppointments());
  const apps = allAppts.filter(a => a.customerId === customerId && a.paymentStatus === 'odendi');
  await Promise.all(apps.map(a => DB.deleteAppointment(a.id)));
  invalidateCache('appointments');
  closeModal();
  showToast('Gelirler başarıyla silindi', 'success');
  render();
}

// ═══════════════════════════════════════════════════════════
//  MODAL CORE
// ═══════════════════════════════════════════════════════════
function openModal(title, body) {
  document.getElementById('modal').innerHTML = `
    <div class="modal-handle"></div>
    <div class="modal-header">
      <span class="modal-title">${title}</span>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">${body}</div>`;
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('modalOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.getElementById('modalOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

let _toastTimer;
function showToast(msg, type = 'info') {
  clearTimeout(_toastTimer);
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}-t`;
  _toastTimer = setTimeout(() => t.classList.add('hidden'), 2800);
}

// ═══════════════════════════════════════════════════════════
//  DESKTOP RENDER FONKSIYONLARI
// ═══════════════════════════════════════════════════════════

async function renderHomeDesktop() {
  const customers = await cachedGet('customers', () => DB.getCustomers());
  const appointments = await cachedGet('appointments', () => DB.getAppointments());
  const expenses = await cachedGet('expenses', () => DB.getExpenses());
  const now = new Date();

  const monthApps = appointments.filter(a => { const d = new Date(a.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const totalIncome = appointments.filter(a => a.paymentStatus === 'odendi').reduce((s, a) => s + (+a.price || 0), 0);
  const monthIncome = monthApps.filter(a => a.paymentStatus === 'odendi').reduce((s, a) => s + (+a.price || 0), 0);
  const monthExp = expenses.filter(e => { const d = new Date(e.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((s, e) => s + (+e.amount || 0), 0);
  const net = monthIncome - monthExp;
  const todayApps = appointments.filter(a => isToday(a.date)).sort((a, b) => new Date(a.date) - new Date(b.date));
  const pendingRev = appointments.filter(a => a.paymentStatus !== 'odendi').reduce((s, a) => s + (+a.price || 0), 0);
  const pendingCnt = appointments.filter(a => a.paymentStatus !== 'odendi').length;

  return `
  <!-- STATS GRID -->
  <div class="desktop-stats-grid">
    <div class="desktop-stat-card dsc-blue" onclick="navigate('finance')">
      <div class="desktop-stat-icon">💰</div>
      <div class="desktop-stat-label">Bu Ay Gelir</div>
      <div class="desktop-stat-value">${fmt(monthIncome)}</div>
      <div class="desktop-stat-trend">${monthApps.filter(a => a.paymentStatus === 'odendi').length} tahsilat</div>
    </div>
    <div class="desktop-stat-card dsc-red" onclick="navigate('finance')">
      <div class="desktop-stat-icon">📉</div>
      <div class="desktop-stat-label">Bu Ay Gider</div>
      <div class="desktop-stat-value">${fmt(monthExp)}</div>
      <div class="desktop-stat-trend">${expenses.filter(e => { const d = new Date(e.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length} kayıt</div>
    </div>
    <div class="desktop-stat-card dsc-green" onclick="navigate('appointments')">
      <div class="desktop-stat-icon">📋</div>
      <div class="desktop-stat-label">Bu Ay İşlem</div>
      <div class="desktop-stat-value">${monthApps.length}</div>
      <div class="desktop-stat-trend">${customers.length} toplam müşteri</div>
    </div>
    <div class="desktop-stat-card dsc-orange" onclick="navigate('appointments')">
      <div class="desktop-stat-icon">⏳</div>
      <div class="desktop-stat-label">Bekleyen Ödeme</div>
      <div class="desktop-stat-value">${pendingCnt}</div>
      <div class="desktop-stat-trend">${fmt(pendingRev)} bekliyor</div>
    </div>
  </div>

  <!-- NET CARD -->
  <div class="desktop-net-card">
    <div class="dnc-left">
      <div class="dnc-tag">🏆 Net Kazanç — Bu Ay</div>
      <div class="dnc-value" style="color:${net >= 0 ? 'white' : '#FCA5A5'}">${fmt(net)}</div>
      <div class="dnc-sub">${customers.length} kayıtlı müşteri · Toplam ${fmt(totalIncome)} tahsilat</div>
    </div>
    <div class="dnc-right">
      <div class="dnc-stat">
        <div class="dnc-stat-label">Bugün</div>
        <div class="dnc-stat-value">${todayApps.length} İş</div>
      </div>
      <div class="dnc-stat">
        <div class="dnc-stat-label">Toplam Müşteri</div>
        <div class="dnc-stat-value">${customers.length}</div>
      </div>
      <div class="dnc-stat">
        <div class="dnc-stat-label">Toplam İşlem</div>
        <div class="dnc-stat-value">${appointments.length}</div>
      </div>
    </div>
  </div>

  <!-- DUAL COLUMN -->
  <div class="desktop-dual">
    <!-- Bugünkü Randevular -->
    
    <div class="desktop-card" style="background:linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05)); border:1px solid rgba(251,191,36,0.3); margin-bottom:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; padding:24px">
        <div>
          <div style="font-size:13px; font-weight:700; color:var(--text-sec); margin-bottom:6px">🪙 YATIRIM / ALTIN KASASI</div>
          <div style="font-size:28px; font-weight:900; color:#FBBF24" id="deskGoldValue">Yükleniyor...</div>
          <div style="font-size:13px; color:var(--text-sec); margin-top:6px" id="deskGoldSub">Bekleyiniz...</div>
        </div>
        <div style="font-size:48px; opacity:0.8">📊</div>
      </div>
    </div>
    <div class="desktop-card">
      <div class="desktop-card-header">
        <div class="desktop-card-title">📅 Bugünün Randevuları (${todayApps.length})</div>
        <button class="desktop-card-action" onclick="navigate('appointments')">Tümünü Gör →</button>
      </div>
      <div class="desktop-card-body" style="padding:12px 0 4px">
        ${todayApps.length === 0
      ? `<div class="empty" style="padding:32px"><div class="empty-icon" style="font-size:40px">📭</div><div class="empty-title" style="font-size:13px">Bugün randevu yok</div></div>`
      : todayApps.map(a => todayCard(a)).join('')}
      </div>
    </div>

    <!-- Bekleyen + Son İşlemler -->
    <div class="desktop-card">
      <div class="desktop-card-header">
        <div class="desktop-card-title">⏳ Bekleyen Tahsilatlar (${pendingCnt})</div>
        <button class="desktop-card-action" onclick="navigate('appointments')">Tümünü Gör →</button>
      </div>
      <div class="desktop-card-body" style="padding:12px 0 4px">
        ${pendingCnt === 0
      ? `<div class="empty" style="padding:32px"><div class="empty-icon" style="font-size:40px">✅</div><div class="empty-title" style="font-size:13px">Tüm ödemeler tahsil edildi!</div></div>`
      : appointments.filter(a => a.paymentStatus !== 'odendi').slice(0, 5).map(a => `
            <div style="display:flex;align-items:center;gap:14px;padding:12px 22px;border-bottom:1px solid var(--border);cursor:pointer" onclick="navigate('appt-detail',{apptId:'${a.id}'})">
              <div style="width:40px;height:40px;border-radius:10px;background:${getSvc(a.serviceType).color}18;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${getSvc(a.serviceType).icon}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:14px;font-weight:700">${a.customerName || '—'}</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${fmtD(a.date)} · ${getSvc(a.serviceType).label}</div>
              </div>
              <div style="text-align:right;flex-shrink:0">
                <div style="font-size:16px;font-weight:900;color:var(--success-light)">${fmt(a.price)}</div>
                <button class="action-btn success" style="padding:5px 12px;font-size:11px;flex:none;margin-top:4px" onclick="event.stopPropagation();markPaid('${a.id}')">✓ Tahsil Et</button>
              </div>
            </div>`).join('')}
      </div>
    </div>
  </div>
  <div style="height:10px"></div>`;
}

async function renderAppointmentsDesktop() {
  const all = (await cachedGet('appointments', () => DB.getAppointments())).sort((a, b) => new Date(b.date) - new Date(a.date));
  const pendingAmt = all.filter(a => a.paymentStatus !== 'odendi').reduce((s, a) => s + (+a.price || 0), 0);

  const filtered = all.filter(a => {
    if (apptFilter === 'bekliyor') return a.paymentStatus !== 'odendi';
    if (apptFilter === 'odendi') return a.paymentStatus === 'odendi';
    if (apptFilter === 'bugun') return isToday(a.date);
    return true;
  });

  return `
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
    <div class="filter-bar" style="padding:0;flex:1">
      ${[['hepsi', 'Tümü'], ['bugun', '📅 Bugün'], ['bekliyor', '⏳ Bekliyor'], ['odendi', '✓ Ödendi']]
      .map(([id, l]) => `<button class="filter-chip ${apptFilter === id ? 'active' : ''}" onclick="apptFilter='${id}';render()">${l}</button>`).join('')}
    </div>
  </div>
  ${pendingAmt > 0 ? `<div class="pending-banner">⏳ Bekleyen toplam: <strong>${fmt(pendingAmt)}</strong></div>` : ''}
  <div class="desktop-appt-grid">
    ${filtered.length === 0
      ? `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">📅</div><div class="empty-title">Bu filtrede randevu yok</div></div>`
      : filtered.map(a => apptCard(a, false)).join('')}
  </div>
  <div style="height:10px"></div>`;
}

async function renderCustomersDesktop() {
  const all = await cachedGet('customers', () => DB.getCustomers());
  const allAppts = await cachedGet('appointments', () => DB.getAppointments());
  const q = searchQ.toLowerCase();
  const list = q ? all.filter(c => (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q) || (c.address || '').toLowerCase().includes(q)) : all;

  return `
  <div class="search-wrap" style="margin-bottom:16px">
    <div class="search-bar">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" placeholder="Müşteri adı veya telefon ile ara..." value="${searchQ}"
        oninput="searchQ=this.value;render()"/>
      ${searchQ ? `<span onclick="searchQ='';render()" style="cursor:pointer;color:var(--text-muted);font-size:18px;padding:0 4px">×</span>` : ''}
    </div>
  </div>
  <div class="desktop-customers-grid">
    ${list.length === 0
      ? `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">👥</div><div class="empty-title">${q ? 'Sonuç bulunamadı' : 'Henüz müşteri eklenmedi'}</div>${!q ? `<button class="action-btn primary" style="margin-top:12px" onclick="openAddCustomer()">İlk Müşteriyi Ekle</button>` : ''}</div>`
      : list.map(c => customerCardSync(c, allAppts)).join('')}
  </div>
  <div style="height:10px"></div>`;
}

async function renderFinanceDesktop() {
  const appointments = await cachedGet('appointments', () => DB.getAppointments());
  const expenses = await cachedGet('expenses', () => DB.getExpenses());
  const golds = await cachedGet('gold', () => window.DB.getGolds ? window.DB.getGolds() : []);

  const allIncomes = appointments.filter(a => a.paymentStatus === 'odendi')
    .map(a => ({ id: a.id, name: a.customerName || 'Müşteri', desc: a.serviceLabel || 'İşlem', amount: +a.price || 0, date: a.date, type: 'income', icon: getSvc(a.serviceType).icon }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const allExpList = expenses.map(e => ({ ...e, type: 'expense', icon: getExpCat(e.category).icon, desc: getExpCat(e.category).label }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const filterByMonth = (items) => {
    if (finMonth === 'all') return items;
    return items.filter(i => {
      const d = new Date(i.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === finMonth;
    });
  };

  const incomes = filterByMonth(allIncomes);
  const expList = filterByMonth(allExpList);
  const goldList = filterByMonth(golds);

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpense = expList.reduce((s, e) => s + e.amount, 0);
  const totalGoldGrams = golds.reduce((s, g) => s + (g.type === 'add' ? g.grams : -g.grams), 0);
  const totalGoldValue = totalGoldGrams * currentGoldPrice;
  const net = totalIncome - totalExpense + totalGoldValue;

  let listHtml = '';
  if (finTab === 'gold') {
    setTimeout(() => initGoldChart(goldList), 50);
    listHtml = `
      <div style="padding:20px;background:var(--surface);border-bottom:1px solid var(--border)">
        <div style="font-size:12px;color:var(--text-muted);font-weight:700;margin-bottom:8px">ALTIN GRAFİĞİ (GELİŞİM)</div>
        <div style="height:200px;width:100%"><canvas id="goldChart"></canvas></div>
      </div>
      ${goldList.length === 0 ? '<div class="empty"><div class="empty-title">Altın işlemi yok</div></div>' : goldList.map(g => `
      <div class="fin-item">
        <div class="fin-item-icon" style="background:var(--warning-bg)">🪙</div>
        <div class="fin-item-body">
          <div class="fin-item-name">${g.type === 'add' ? 'Altın Eklendi' : 'Altın Çıkarıldı'}</div>
          <div class="fin-item-sub"><span>${fmtDT(g.date)}</span><span>·</span><span>${g.note || ''}</span></div>
        </div>
        <div class="fin-item-amount ${g.type === 'add' ? 'income' : 'expense'}" style="color:var(--warning)">
          ${g.type === 'add' ? '+' : '-'}${g.grams} gr
        </div>
        <button onclick="event.stopPropagation();confirmDeleteGold('${g.id}')" style="background:none;border:none;color:var(--error);font-size:16px;cursor:pointer;padding:4px;margin-left:6px">🗑️</button>
      </div>`).join('')}
    `;
  } else {
    const list = finTab === 'income' ? incomes : expList;
    listHtml = list.length === 0
      ? `<div class="empty"><div class="empty-icon">${finTab === 'income' ? '💰' : '📉'}</div><div class="empty-title">${finTab === 'income' ? 'Henüz gelir yok' : 'Henüz gider kaydı yok'}</div></div>`
      : list.map(item => `
          <div class="fin-item" onclick="${finTab === 'expense' ? `confirmDeleteExpense('${item.id}')` : ''}">
            <div class="fin-item-icon" style="background:${finTab === 'income' ? 'var(--success-bg)' : 'var(--error-bg)'}">${item.icon}</div>
            <div class="fin-item-body">
              <div class="fin-item-name">${item.name}</div>
              <div class="fin-item-sub">
                <span>${fmtD(item.date)}</span>
                <span>·</span>
                <span>${item.desc}</span>
                ${finTab === 'income' && item.id ? `<span class="badge badge-paid" style="font-size:10px;padding:2px 8px">Ödendi</span>` : ''}
              </div>
            </div>
            <div class="fin-item-amount ${finTab === 'income' ? 'income' : 'expense'}">
              ${finTab === 'income' ? '+' : '-'}${fmt(item.amount)}
            </div>
            ${finTab === 'expense' ? `<button onclick="event.stopPropagation();confirmDeleteExpense('${item.id}')" style="background:none;border:none;color:var(--error);font-size:16px;cursor:pointer;padding:4px;margin-left:6px">🗑️</button>` : ''}
          </div>`).join('');
  }

  const allDates = [...allIncomes, ...allExpList, ...golds];
  const monthOpts = getMonthOptions(allDates);
  const monthLabel = (m) => {
    if (m === 'all') return 'Tüm Zamanlar';
    const [y, mo] = m.split('-');
    return new Date(+y, +mo - 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  };

  return `
  <div class="desktop-finance-layout">
    <div class="fin-summary-stack">
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--r-md);padding:14px">
        <div style="font-size:11px;color:var(--text-muted);font-weight:700;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.6px">📅 Dönem Filtresi</div>
        <select class="form-input" style="padding:8px 10px;font-size:13px;height:auto;width:100%" onchange="finMonth=this.value;render()">
          <option value="all" ${finMonth === 'all' ? 'selected' : ''}>Tüm Zamanlar</option>
          ${monthOpts.map(m => `<option value="${m}" ${finMonth === m ? 'selected' : ''}>${monthLabel(m)}</option>`).join('')}
        </select>
      </div>
      <div class="fin-summary-item ${finTab === 'income' ? 'active-income' : ''}" onclick="finTab='income';updateTopBar();render()">
        <div class="fsi-label">💰 Toplam Gelir</div>
        <div class="fsi-value" style="color:var(--success-light)">${fmt(totalIncome)}</div>
        <div class="fsi-count">${incomes.length} işlem</div>
      </div>
      <div class="fin-summary-item ${finTab === 'expense' ? 'active-expense' : ''}" onclick="finTab='expense';updateTopBar();render()">
        <div class="fsi-label">📉 Toplam Gider</div>
        <div class="fsi-value" style="color:var(--error)">${fmt(totalExpense)}</div>
        <div class="fsi-count">${expList.length} kayıt</div>
      </div>
      <div class="fin-summary-item ${finTab === 'gold' ? 'active-gold' : ''}" style="background:var(--warning-bg);border-color:var(--warning-border);cursor:pointer" onclick="finTab='gold';updateTopBar();render()">
        <div class="fsi-label" style="color:var(--warning)">🪙 Altın Kasası</div>
        <div class="fsi-value" style="color:var(--warning)">${fmt(totalGoldValue)}</div>
        <div class="fsi-count" style="color:var(--warning)">${totalGoldGrams} gram (Kur: ${fmt(currentGoldPrice)})</div>
      </div>
      <div class="fin-summary-item" style="background:${net >= 0 ? 'var(--success-bg)' : 'var(--error-bg)'};border-color:${net >= 0 ? 'var(--success-border)' : 'var(--error-border)'}">
        <div class="fsi-label">🏆 Net Toplam</div>
        <div class="fsi-value" style="color:${net >= 0 ? 'var(--success-light)' : 'var(--error)'}">${fmt(net)}</div>
        <div class="fsi-count" style="color:${net >= 0 ? 'var(--success)' : 'var(--error)'}">Altın dahil</div>
      </div>
    </div>

    <div class="desktop-card">
      <div class="desktop-card-header">
        <div class="desktop-card-title">${finTab === 'income' ? '💰 Gelirler' : (finTab === 'expense' ? '📉 Giderler' : '🪙 Altın İşlemleri')}</div>
        <div style="display:flex;gap:8px">
          <button class="filter-chip ${finTab === 'income' ? 'active' : ''}" onclick="finTab='income';updateTopBar();render()">Gelirler</button>
          <button class="filter-chip ${finTab === 'expense' ? 'active' : ''}" style="${finTab === 'expense' ? 'background:var(--error-bg);border-color:var(--error-dark);color:var(--error)' : ''}" onclick="finTab='expense';updateTopBar();render()">Giderler</button>
          <button class="filter-chip ${finTab === 'gold' ? 'active' : ''}" style="${finTab === 'gold' ? 'background:var(--warning-bg);border-color:var(--warning);color:var(--warning)' : ''}" onclick="finTab='gold';updateTopBar();render()">Altın</button>
        </div>
      </div>
      <div style="overflow:hidden;width:100%">
        ${listHtml}
      </div>
    </div>
  </div>
  <div style="height:20px"></div>`;
}
async function renderCustomerDetailDesktop(id) {
  const c = await DB.getCustomerById(id);
  if (!c) return `<div class="empty"><div class="empty-title">Müşteri bulunamadı</div></div>`;
  const allAppts = await cachedGet('appointments', () => DB.getAppointments());
  const apps = allAppts.filter(a => a.customerId === id);
  const totalPaid = apps.filter(a => a.paymentStatus === 'odendi').reduce((s, a) => s + (+a.price || 0), 0);
  const pending = apps.filter(a => a.paymentStatus !== 'odendi').reduce((s, a) => s + (+a.price || 0), 0);

  return `
  <div class="desktop-dual" style="align-items:start">
    <!-- Sol: Bilgiler -->
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="desktop-card">
        <div style="text-align:center;padding:28px 22px 22px;background:linear-gradient(180deg,rgba(79,126,255,0.06) 0%,transparent 100%);border-bottom:1px solid var(--border)">
          <div class="avatar-xl">${initials(c.name)}</div>
          <div class="detail-name">${c.name}</div>
          <div class="detail-sub">Müşteri · ${new Date(c.createdAt).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</div>
          <div class="detail-stats">
            <div class="d-stat"><div class="d-stat-val">${apps.length}</div><div class="d-stat-label">İşlem</div></div>
            <div class="d-stat"><div class="d-stat-val text-success" style="font-size:15px">${fmt(totalPaid)}</div><div class="d-stat-label">Ödendi</div></div>
            ${pending > 0 ? `<div class="d-stat"><div class="d-stat-val text-warning" style="font-size:15px">${fmt(pending)}</div><div class="d-stat-label">Bekliyor</div></div>` : ''}
          </div>
        </div>
        <div class="desktop-card-body">
          <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px">
            <button class="save-btn" onclick="openAddAppointment('${c.id}','${escape(c.name)}','${escape(c.phone || '')}','${escape(c.address || '')}')">📅 Yeni İşlem Ekle</button>
            ${c.phone ? `<div style="display:flex;gap:8px">
              <a href="https://wa.me/90${(c.phone || '').replace(/\D/g, '').slice(-10)}" class="action-btn success" style="flex:1;text-decoration:none"><img src="https://img.icons8.com/?size=100&id=16713&format=png&color=000000" class="wa-logo" alt="WA"> WhatsApp</a>
              <a href="tel:${c.phone}" class="action-btn primary" style="flex:1;text-decoration:none;background:var(--surface2);box-shadow:none">📞 Ara</a>
            </div>`: ''}
          </div>
          <div class="info-block">
            <div class="form-label" style="margin-bottom:12px">İletişim Bilgileri</div>
            ${c.phone ? `<div class="info-row"><div class="info-icon">📞</div><div><div class="info-label">Telefon</div><div class="info-value"><a href="tel:${c.phone}" style="color:var(--primary-light);text-decoration:none">${c.phone}</a></div></div></div>` : ''}
            ${c.address ? `<div class="info-row"><div class="info-icon">📍</div><div><div class="info-label">Adres</div><div class="info-value">${c.address}</div></div></div>` : ''}
            ${c.sensitivityNote ? `<div class="info-row"><div class="info-icon">⚠️</div><div><div class="info-label">Hassasiyet</div><div class="info-value" style="color:var(--error)">${c.sensitivityNote}</div></div></div>` : ''}
            ${c.notes ? `<div class="info-row"><div class="info-icon">📝</div><div><div class="info-label">Notlar</div><div class="info-value">${c.notes}</div></div></div>` : ''}
          </div>
        </div>
      </div>
    </div>

    <!-- Sağ: İşlem Geçmişi -->
    <div class="desktop-card">
      <div class="desktop-card-header">
        <div class="desktop-card-title">📁 İşlem Geçmişi (${apps.length})</div>
      </div>
      <div style="padding:12px">
        ${apps.length === 0
      ? `<div class="empty" style="padding:32px"><div class="empty-title">Henüz işlem yok</div></div>`
      : apps.map(a => apptCard(a, true)).join('')}
      </div>
    </div>
  </div>
  <div style="height:20px"></div>`;
}

async function renderApptDetailDesktop(id) {
  const allAppts = await cachedGet('appointments', () => DB.getAppointments());
  const a = allAppts.find(x => x.id === id) || await DB.getAppointmentById(id);
  if (!a) return `<div class="empty"><div class="empty-title">Bulunamadı</div></div>`;
  const svc = getSvc(a.serviceType);
  const sens = getSens(a.sensitivity);
  const paid = a.paymentStatus === 'odendi';

  return `
  <div class="desktop-dual" style="align-items:start">
    <!-- Sol: Ödeme & Bilgiler -->
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="desktop-card">
        <div style="text-align:center;padding:28px;background:linear-gradient(180deg,${svc.color}10 0%,transparent 100%);border-bottom:1px solid var(--border)">
          <div style="font-size:56px;margin-bottom:12px">${svc.icon}</div>
          <div style="font-size:22px;font-weight:900">${svc.label}${a.serviceCustom ? ' — ' + a.serviceCustom : ''}</div>
          <div style="font-size:13px;color:var(--text-sec);margin-top:6px">🕐 ${fmtDT(a.date)}${a.duration ? ' · ⏱️ ' + a.duration : ''}</div>
        </div>
        <div class="desktop-card-body">
          <div class="info-block" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <div>
              <div class="info-label">Ücret</div>
              <div style="font-size:36px;font-weight:900;color:var(--success-light);letter-spacing:-1px">${fmt(a.price)}</div>
            </div>
            <div style="text-align:right">
              <span class="badge ${paid ? 'badge-paid' : 'badge-pending'}" style="font-size:13px;padding:8px 16px">${paid ? '✓ Ödendi' : '⏳ Bekliyor'}</span>
              ${!paid ? `<br><button class="action-btn success" style="padding:9px 16px;font-size:13px;margin-top:8px" onclick="markPaid('${a.id}');render()">✓ Tahsil Et</button>` : ''}
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px">
            ${a.customerPhone ? `<a href="https://wa.me/90${a.customerPhone.replace(/\D/g, '').slice(-10)}" class="action-btn success" style="text-decoration:none"><img src="https://img.icons8.com/?size=100&id=16713&format=png&color=000000" class="wa-logo" alt="WA"> WhatsApp</a>` : ''}
            ${a.customerPhone ? `<a href="tel:${a.customerPhone}" class="action-btn primary" style="text-decoration:none">📞 Ara</a>` : ''}
            <button class="save-btn danger" onclick="confirmDeleteAppt('${a.id}',true)">🗑️ Bu İşlemi Sil</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Sağ: Detaylar -->
    <div class="desktop-card">
      <div class="desktop-card-header">
        <div class="desktop-card-title">📋 İşlem Detayları</div>
      </div>
      <div class="desktop-card-body">
        <div class="info-block">
          ${a.customerName ? `<div class="info-row"><div class="info-icon">👤</div><div><div class="info-label">Müşteri</div><div class="info-value">${a.customerName}</div></div></div>` : ''}
          ${a.customerPhone ? `<div class="info-row"><div class="info-icon">📞</div><div><div class="info-label">Telefon</div><div class="info-value"><a href="tel:${a.customerPhone}" style="color:var(--primary-light);text-decoration:none">${a.customerPhone}</a></div></div></div>` : ''}
          ${a.customerAddress ? `<div class="info-row"><div class="info-icon">📍</div><div><div class="info-label">Adres</div><div class="info-value">${a.customerAddress}</div></div></div>` : ''}
          ${sens.id !== 'yok' ? `<div class="info-row"><div class="info-icon">⚠️</div><div><div class="info-label">Hassasiyet</div><div class="info-value" style="color:${sens.color};font-weight:700">${sens.label}</div></div></div>` : ''}
          ${a.notes ? `<div class="info-row"><div class="info-icon">📝</div><div><div class="info-label">Notlar</div><div class="info-value">${a.notes}</div></div></div>` : ''}
        </div>
      </div>
    </div>
  </div>
  <div style="height:20px"></div>`;
}

// ─── INIT ─────────────────────────────────────────────────
// Not: render() artık Firebase onAuthStateChanged tarafından çağrılıyor
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  // Firebase auth state değiştiğinde render() çağrılacak (index.html)
});
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });







function openAddGold() {
  openModal('🪙 Altın İşlemi', `
    <div class="form-group">
      <label class="form-label">İşlem Türü</label>
      <div style="display:flex;gap:8px">
        <button class="option-pill selected" id="goldTypeAdd" onclick="document.getElementById('goldTypeAdd').classList.add('selected');document.getElementById('goldTypeRemove').classList.remove('selected')">➕ Altın Ekle</button>
        <button class="option-pill" id="goldTypeRemove" onclick="document.getElementById('goldTypeRemove').classList.add('selected');document.getElementById('goldTypeAdd').classList.remove('selected')">➖ Altın Çıkar</button>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Gram Miktarı</label>
      <input type="number" step="0.01" class="form-input" id="goldGrams" placeholder="Örn: 5.5">
    </div>
    <div class="form-group">
      <label class="form-label">Açıklama / Not</label>
      <input type="text" class="form-input" id="goldNote" placeholder="Müşteriden alındı, bozduruldu vb.">
    </div>
    <button class="save-btn success" onclick="saveGold()">Kaydet</button>
  `);
}

async function saveGold() {
  const isAdd = document.getElementById('goldTypeAdd').classList.contains('selected');
  const grams = parseFloat(document.getElementById('goldGrams').value);
  const note = document.getElementById('goldNote').value.trim();
  
  if (isNaN(grams) || grams <= 0) return showToast('Lütfen geçerli bir gram girin', 'error');
  
  const g = {
    id: uid(),
    type: isAdd ? 'add' : 'remove',
    grams,
    note,
    date: new Date().toISOString()
  };
  
  await window.DB.saveGold(g);
  invalidateCache('gold');
  showToast('Altın işlemi kaydedildi');
  closeModal();
  render();
}

function confirmDeleteGold(id) {
  openModal('🗑️ İşlemi Sil', `
    <div style="text-align:center;margin-bottom:20px">Bu altın işlemini silmek istediğinize emin misiniz?</div>
    <div style="display:flex;gap:10px">
      <button class="save-btn secondary" style="flex:1" onclick="closeModal()">İptal</button>
      <button class="save-btn danger" style="flex:1" onclick="deleteGold('${id}')">Evet, Sil</button>
    </div>
  `);
}

async function deleteGold(id) {
  await window.DB.deleteGold(id);
  invalidateCache('gold');
  showToast('Altın işlemi silindi');
  closeModal();
  render();
}

async function loadHomeGoldStats() {
  const golds = await cachedGet('gold', () => window.DB.getGolds ? window.DB.getGolds() : []);
  const now = new Date();
  
  const totalGoldGrams = golds.reduce((s, g) => s + (g.type === 'add' ? g.grams : -g.grams), 0);
  const monthGolds = golds.filter(g => {
    const d = new Date(g.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthAdd = monthGolds.reduce((s, g) => s + (g.type === 'add' ? g.grams : 0), 0);

  const totalValue = totalGoldGrams * currentGoldPrice;
  
  const hv = document.getElementById('homeGoldValue');
  const hs = document.getElementById('homeGoldSub');
  if (hv) hv.textContent = fmt(totalValue);
  if (hs) hs.textContent = `Toplam ${totalGoldGrams} gram · Bu ay +${monthAdd} gr`;

  const dv = document.getElementById('deskGoldValue');
  const ds = document.getElementById('deskGoldSub');
  if (dv) dv.textContent = fmt(totalValue);
  if (ds) ds.textContent = `Toplam ${totalGoldGrams} gram (Kur: ${fmt(currentGoldPrice)})`;
}

// Overwrite render to call loadHomeGoldStats
const oldRender = render;
render = async function() {
  await oldRender();
  if (page === 'home') {
    loadHomeGoldStats();
  }
}
