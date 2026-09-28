const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// 1. Add currentPrices object and update fetchGoldPrice
code = code.replace(/let currentGoldPrice = 3000;\s*async function fetchGoldPrice/, \`window.currentPrices = { GOLD: 3000, USD: 34, EUR: 37 };
let currentGoldPrice = 3000; // backwards compatibility

async function fetchGoldPrice\`);

code = code.replace(/currentGoldPrice = parseFloat\(str\.split\('\.'\)\.join\(''\)\.replace\(',', '\.'\)\);/, \`currentGoldPrice = parseFloat(str.split('.').join('').replace(',', '.'));
      window.currentPrices.GOLD = currentGoldPrice;
      window.currentPrices.USD = parseFloat(data['USD'].Selling.split('.').join('').replace(',', '.'));
      window.currentPrices.EUR = parseFloat(data['EUR'].Selling.split('.').join('').replace(',', '.'));\`);

// 2. Update Modals (Add Income / Add Expense)
code = code.replace(/<option value="GOLD">🪙 Altın \(gr\)<\/option>/g, \`<option value="GOLD">🪙 Altın (gr)</option>
          <option value="USD">💵 Dolar ($)</option>
          <option value="EUR">💶 Euro (€)</option>\`);

// 3. Update Income save logic (in saveIncome)
// Find: if (currency === 'GOLD') {
code = code.replace(/if \(currency === 'GOLD'\) \{[\s\S]*?return;\s*\}/, \`if (currency === 'GOLD' || currency === 'USD' || currency === 'EUR') {
    const g = {
      id: uid(),
      type: 'add',
      grams: amt,
      currency: currency,
      note: desc || (currency === 'GOLD' ? 'Altın Geliri' : currency === 'USD' ? 'Dolar Geliri' : 'Euro Geliri'),
      date: dateVal ? dateVal + 'T12:00:00Z' : new Date().toISOString()
    };
    await window.DB.saveGold(g);
    invalidateCache('gold');
    showToast('Yatırım geliri eklendi');
    closeModal();
    render();
    return;
  }\`);

// 4. Update Expense save logic (in saveExpense)
code = code.replace(/if \(currency === 'GOLD'\) \{[\s\S]*?return;\s*\}/, \`if (currency === 'GOLD' || currency === 'USD' || currency === 'EUR') {
    const g = {
      id: uid(),
      type: 'remove',
      grams: amt,
      currency: currency,
      note: currency === 'GOLD' ? 'Altın Çıkışı / Bozdurma' : currency === 'USD' ? 'Dolar Çıkışı / Bozdurma' : 'Euro Çıkışı / Bozdurma',
      date: dateVal ? dateVal + 'T12:00:00Z' : new Date().toISOString()
    };
    await window.DB.saveGold(g);
    invalidateCache('gold');
    showToast('Yatırım çıkışı yapıldı');
    closeModal();
    render();
    return;
  }\`);

fs.writeFileSync('app.js', code);
