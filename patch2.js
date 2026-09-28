const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// Update openAddIncome
const openAddIncomeOld = `async function openAddIncome() {
  const customers = await DB.getCustomers();
  const now = new Date().toISOString().slice(0, 10);
  openModal('💰 Gelir Ekle', \`
    <div class="form-group">
      <label class="form-label">Müşteri (isteğe bağlı)</label>
      <select class="form-input" id="i_cust">
        <option value="">— Genel Gelir —</option>
        \${customers.map(c => \`<option value="\${c.id}">\${c.name}</option>\`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Açıklama</label>
      <input class="form-input" id="i_desc" placeholder="Koltuk yıkama, halı vb.">
    </div>
    <div class="form-group">
      <label class="form-label">Tutar (₺)</label>
      <div class="price-wrap">
        <input id="i_amt" type="number" placeholder="0" min="0" step="1">
        <span class="price-wrap-unit">₺</span>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Tarih</label>
      <input class="form-input" id="i_date" type="date" value="\${now}">
    </div>
    <button class="save-btn success-btn" onclick="saveIncome()">＋ Geliri Kaydet</button>
  \`);
}`;

const openAddIncomeNew = `async function openAddIncome() {
  const customers = await DB.getCustomers();
  const now = new Date().toISOString().slice(0, 10);
  openModal('💰 Gelir Ekle', \`
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
        \${customers.map(c => \`<option value="\${c.id}">\${c.name}</option>\`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Açıklama</label>
      <input class="form-input" id="i_desc" placeholder="Satış, yatırım vb.">
    </div>
    <div class="form-group">
      <label class="form-label">Tarih</label>
      <input class="form-input" id="i_date" type="date" value="\${now}">
    </div>
    <button class="save-btn success-btn" onclick="saveIncome()">＋ Kaydet</button>
  \`);
}`;
if (code.includes(openAddIncomeOld)) {
  code = code.replace(openAddIncomeOld, openAddIncomeNew);
} else {
  console.log("openAddIncomeOld not found!");
}

// Update saveIncome
const saveIncomeOld = `async function saveIncome() {
  const amt = parseFloat(document.getElementById('i_amt').value) || 0;
  if (!amt) { showToast('Tutar giriniz!', 'error'); return; }
  const custId = document.getElementById('i_cust').value;
  const customers = await cachedGet('customers', () => DB.getCustomers());
  const cust = custId ? customers.find(c => c.id === custId) : null;
  const desc = document.getElementById('i_desc').value.trim();
  const dateVal = document.getElementById('i_date').value;
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
}`;

const saveIncomeNew = `async function saveIncome() {
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
    showToast('Altın geliri kaydedildi');
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
}`;
if (code.includes(saveIncomeOld)) {
  code = code.replace(saveIncomeOld, saveIncomeNew);
} else {
  console.log("saveIncomeOld not found!");
}

// Update openAddExpense
const openAddExpenseOld = `async function openAddExpense() {
  const now = new Date().toISOString().slice(0, 10);
  openModal('📉 Gider Ekle', \`
    <div class="form-group">
      <label class="form-label">Kategori</label>
      <div class="option-grid" id="catGrid">
        \${EXPENSE_CATS.map((c, i) => \`<button class="option-pill \${i === 0 ? 'selected' : ''}" data-cat="\${c.id}" onclick="selectPill('#catGrid','cat','\${c.id}')">\${c.icon} \${c.label}</button>\`).join('')}
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Tutar (₺)</label>
      <div class="price-wrap">
        <input id="e_amt" type="number" placeholder="0" min="0" step="1">
        <span class="price-wrap-unit">₺</span>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Tarih</label>
      <input class="form-input" id="e_date" type="date" value="\${now}">
    </div>
    <button class="save-btn danger" onclick="saveExpense()">－ Gideri Kaydet</button>
  \`);
}`;

const openAddExpenseNew = `async function openAddExpense() {
  const now = new Date().toISOString().slice(0, 10);
  openModal('📉 Gider Ekle', \`
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
      <label class="form-label">Kategori</label>
      <div class="option-grid" id="catGrid">
        \${EXPENSE_CATS.map((c, i) => \`<button class="option-pill \${i === 0 ? 'selected' : ''}" data-cat="\${c.id}" onclick="selectPill('#catGrid','cat','\${c.id}')">\${c.icon} \${c.label}</button>\`).join('')}
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Tarih</label>
      <input class="form-input" id="e_date" type="date" value="\${now}">
    </div>
    <button class="save-btn danger" onclick="saveExpense()">－ Kaydet</button>
  \`);
}`;
if (code.includes(openAddExpenseOld)) {
  code = code.replace(openAddExpenseOld, openAddExpenseNew);
} else {
  console.log("openAddExpenseOld not found!");
}

// Update saveExpense
const saveExpenseOld = `async function saveExpense() {
  const amt = parseFloat(document.getElementById('e_amt').value) || 0;
  if (!amt) { showToast('Tutar giriniz!', 'error'); return; }
  const catEl = document.querySelector('#catGrid .selected');
  const cat = catEl ? catEl.dataset.cat : 'diger';
  const dateVal = document.getElementById('e_date').value;
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
}`;

const saveExpenseNew = `async function saveExpense() {
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
    showToast('Altın gideri kaydedildi');
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
}`;
if (code.includes(saveExpenseOld)) {
  code = code.replace(saveExpenseOld, saveExpenseNew);
} else {
  console.log("saveExpenseOld not found!");
}

// Update renderHome (Mobile)
const renderHomeMatch = code.match(/async function renderHome\(\) \{[\s\S]*?return `[\s\S]*?<div class="net-card">/);
if (renderHomeMatch) {
  const newRenderHome = renderHomeMatch[0].replace(
    '<div class="net-card">',
    `
  \${(() => {
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
  <div class="net-card">`
  );
  code = code.replace(renderHomeMatch[0], newRenderHome);
}

// Update renderHomeDesktop
const renderHomeDesktopMatch = code.match(/async function renderHomeDesktop\(\) \{[\s\S]*?return `[\s\S]*?<div class="desktop-card">/);
if (renderHomeDesktopMatch) {
  const newRenderHomeDesktop = renderHomeDesktopMatch[0].replace(
    '<div class="desktop-card">',
    `
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
    <div class="desktop-card">`
  );
  code = code.replace(renderHomeDesktopMatch[0], newRenderHomeDesktop);
}

// Add script to populate gold values
code += `
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
  if (hs) hs.textContent = \`Toplam \${totalGoldGrams} gram · Bu ay +\${monthAdd} gr\`;

  const dv = document.getElementById('deskGoldValue');
  const ds = document.getElementById('deskGoldSub');
  if (dv) dv.textContent = fmt(totalValue);
  if (ds) ds.textContent = \`Toplam \${totalGoldGrams} gram (Kur: \${fmt(currentGoldPrice)})\`;
}

// Overwrite render to call loadHomeGoldStats
const oldRender = render;
render = async function() {
  await oldRender();
  if (page === 'home') {
    loadHomeGoldStats();
  }
}
`;

fs.writeFileSync('app.js', code);
