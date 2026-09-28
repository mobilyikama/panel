const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

function replaceBlock(code, functionName, newCode) {
  const startIdx = code.indexOf("async function " + functionName + "() {");
  if (startIdx === -1) {
    console.log(functionName + ' not found');
    return code;
  }
  let endIdx = startIdx;
  let braceCount = 0;
  let foundFirst = false;
  for (let i = startIdx; i < code.length; i++) {
    if (code[i] === '{') {
      braceCount++;
      foundFirst = true;
    } else if (code[i] === '}') {
      braceCount--;
    }
    if (foundFirst && braceCount === 0) {
      endIdx = i + 1;
      break;
    }
  }
  return code.substring(0, startIdx) + newCode + code.substring(endIdx);
}

const openAddIncomeNew = "async function openAddIncome() {\n" +
  "  const customers = await DB.getCustomers();\n" +
  "  const now = new Date().toISOString().slice(0, 10);\n" +
  "  openModal('💰 Gelir Ekle', `\n" +
  "    <div class=\"form-group\">\n" +
  "      <label class=\"form-label\">Birim / Tutar</label>\n" +
  "      <div style=\"display:flex;gap:8px\">\n" +
  "        <div class=\"price-wrap\" style=\"flex:2\">\n" +
  "          <input id=\"i_amt\" type=\"number\" placeholder=\"0\" min=\"0\" step=\"0.01\">\n" +
  "        </div>\n" +
  "        <select id=\"i_currency\" class=\"form-input\" style=\"flex:1\" onchange=\"document.getElementById('i_cust_wrap').style.display = this.value === 'TRY' ? 'block' : 'none'\">\n" +
  "          <option value=\"TRY\">₺ TL</option>\n" +
  "          <option value=\"GOLD\">🪙 Altın (gr)</option>\n" +
  "        </select>\n" +
  "      </div>\n" +
  "    </div>\n" +
  "    <div class=\"form-group\" id=\"i_cust_wrap\">\n" +
  "      <label class=\"form-label\">Müşteri (isteğe bağlı)</label>\n" +
  "      <select class=\"form-input\" id=\"i_cust\">\n" +
  "        <option value=\"\">— Genel Gelir —</option>\n" +
  "        ${customers.map(c => `<option value=\"${c.id}\">${c.name}</option>`).join('')}\n" +
  "      </select>\n" +
  "    </div>\n" +
  "    <div class=\"form-group\">\n" +
  "      <label class=\"form-label\">Açıklama</label>\n" +
  "      <input class=\"form-input\" id=\"i_desc\" placeholder=\"Satış, yatırım vb.\">\n" +
  "    </div>\n" +
  "    <div class=\"form-group\">\n" +
  "      <label class=\"form-label\">Tarih</label>\n" +
  "      <input class=\"form-input\" id=\"i_date\" type=\"date\" value=\"${now}\">\n" +
  "    </div>\n" +
  "    <button class=\"save-btn success-btn\" onclick=\"saveIncome()\">＋ Kaydet</button>\n" +
  "  `);\n" +
  "}";

const saveIncomeNew = "async function saveIncome() {\n" +
  "  const amt = parseFloat(document.getElementById('i_amt').value) || 0;\n" +
  "  if (!amt) { showToast('Tutar giriniz!', 'error'); return; }\n" +
  "  const currency = document.getElementById('i_currency').value;\n" +
  "  const desc = document.getElementById('i_desc').value.trim();\n" +
  "  const dateVal = document.getElementById('i_date').value;\n" +
  "\n" +
  "  if (currency === 'GOLD') {\n" +
  "    const g = {\n" +
  "      id: uid(),\n" +
  "      type: 'add',\n" +
  "      grams: amt,\n" +
  "      note: desc || 'Altın Geliri',\n" +
  "      date: dateVal ? dateVal + 'T12:00:00Z' : new Date().toISOString()\n" +
  "    };\n" +
  "    await window.DB.saveGold(g);\n" +
  "    invalidateCache('gold');\n" +
  "    showToast('Altın geliri eklendi');\n" +
  "    closeModal();\n" +
  "    render();\n" +
  "    return;\n" +
  "  }\n" +
  "\n" +
  "  const custId = document.getElementById('i_cust').value;\n" +
  "  const customers = await cachedGet('customers', () => DB.getCustomers());\n" +
  "  const cust = custId ? customers.find(c => c.id === custId) : null;\n" +
  "  const a = {\n" +
  "    id: uid(),\n" +
  "    customerId: custId || null,\n" +
  "    customerName: cust ? cust.name : null,\n" +
  "    serviceType: 'diger',\n" +
  "    serviceLabel: desc || 'Genel Gelir',\n" +
  "    price: amt,\n" +
  "    date: dateVal ? dateVal + 'T12:00:00Z' : new Date().toISOString(),\n" +
  "    paymentStatus: 'odendi',\n" +
  "    sensitivity: 'yok'\n" +
  "  };\n" +
  "  await DB.saveAppointment(a);\n" +
  "  invalidateCache('appointments');\n" +
  "  showToast('Gelir kaydedildi');\n" +
  "  closeModal();\n" +
  "  render();\n" +
  "}";

const openAddExpenseNew = "async function openAddExpense() {\n" +
  "  const now = new Date().toISOString().slice(0, 10);\n" +
  "  openModal('📉 Gider Ekle', `\n" +
  "    <div class=\"form-group\">\n" +
  "      <label class=\"form-label\">Birim / Tutar</label>\n" +
  "      <div style=\"display:flex;gap:8px\">\n" +
  "        <div class=\"price-wrap\" style=\"flex:2\">\n" +
  "          <input id=\"e_amt\" type=\"number\" placeholder=\"0\" min=\"0\" step=\"0.01\">\n" +
  "        </div>\n" +
  "        <select id=\"e_currency\" class=\"form-input\" style=\"flex:1\" onchange=\"document.getElementById('e_cat_wrap').style.display = this.value === 'TRY' ? 'block' : 'none'\">\n" +
  "          <option value=\"TRY\">₺ TL</option>\n" +
  "          <option value=\"GOLD\">🪙 Altın (gr)</option>\n" +
  "        </select>\n" +
  "      </div>\n" +
  "    </div>\n" +
  "    <div class=\"form-group\" id=\"e_cat_wrap\">\n" +
  "      <label class=\"form-label\">Kategori</label>\n" +
  "      <div class=\"option-grid\" id=\"catGrid\">\n" +
  "        ${EXPENSE_CATS.map((c, i) => `<button class=\"option-pill ${i === 0 ? 'selected' : ''}\" data-cat=\"${c.id}\" onclick=\"selectPill('#catGrid','cat','${c.id}')\">${c.icon} ${c.label}</button>`).join('')}\n" +
  "      </div>\n" +
  "    </div>\n" +
  "    <div class=\"form-group\">\n" +
  "      <label class=\"form-label\">Tarih</label>\n" +
  "      <input class=\"form-input\" id=\"e_date\" type=\"date\" value=\"${now}\">\n" +
  "    </div>\n" +
  "    <button class=\"save-btn danger\" onclick=\"saveExpense()\">－ Kaydet</button>\n" +
  "  `);\n" +
  "}";

const saveExpenseNew = "async function saveExpense() {\n" +
  "  const amt = parseFloat(document.getElementById('e_amt').value) || 0;\n" +
  "  if (!amt) { showToast('Tutar giriniz!', 'error'); return; }\n" +
  "  const currency = document.getElementById('e_currency').value;\n" +
  "  const dateVal = document.getElementById('e_date').value;\n" +
  "\n" +
  "  if (currency === 'GOLD') {\n" +
  "    const g = {\n" +
  "      id: uid(),\n" +
  "      type: 'remove',\n" +
  "      grams: amt,\n" +
  "      note: 'Altın Gideri / Bozdurma',\n" +
  "      date: dateVal ? dateVal + 'T12:00:00Z' : new Date().toISOString()\n" +
  "    };\n" +
  "    await window.DB.saveGold(g);\n" +
  "    invalidateCache('gold');\n" +
  "    showToast('Altın çıkarıldı');\n" +
  "    closeModal();\n" +
  "    render();\n" +
  "    return;\n" +
  "  }\n" +
  "\n" +
  "  const catEl = document.querySelector('#catGrid .selected');\n" +
  "  const cat = catEl ? catEl.dataset.cat : 'diger';\n" +
  "  const e = {\n" +
  "    id: uid(),\n" +
  "    category: cat,\n" +
  "    amount: amt,\n" +
  "    date: dateVal ? dateVal + 'T12:00:00Z' : new Date().toISOString()\n" +
  "  };\n" +
  "  await DB.saveExpense(e);\n" +
  "  invalidateCache('expenses');\n" +
  "  showToast('Gider kaydedildi');\n" +
  "  closeModal();\n" +
  "  render();\n" +
  "}";

code = replaceBlock(code, 'openAddIncome', openAddIncomeNew);
code = replaceBlock(code, 'saveIncome', saveIncomeNew);
code = replaceBlock(code, 'openAddExpense', openAddExpenseNew);
code = replaceBlock(code, 'saveExpense', saveExpenseNew);

fs.writeFileSync('app.js', code);
