const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// Replace loadHomeGoldStats
code = code.replace(/async function loadHomeGoldStats\(\) \{[\s\S]*?\}\s*\}\s*$/m, \`async function loadHomeGoldStats() {
  const golds = await cachedGet('gold', () => window.DB.getGolds ? window.DB.getGolds() : []);
  const now = new Date();
  
  let totalValue = 0;
  let summaryParts = [];
  const currIcons = { GOLD: '🪙', USD: '💵', EUR: '💶' };
  
  ['GOLD', 'USD', 'EUR'].forEach(curr => {
    const items = golds.filter(g => (g.currency || 'GOLD') === curr);
    const totalAmt = items.reduce((s, g) => s + (g.type === 'add' ? g.grams : -g.grams), 0);
    if (totalAmt > 0 || curr === 'GOLD') {
      const price = window.currentPrices ? window.currentPrices[curr] : (curr==='GOLD' ? currentGoldPrice : 0);
      totalValue += totalAmt * price;
      let label = curr === 'GOLD' ? totalAmt + 'gr' : (curr === 'USD' ? '$'+totalAmt : '€'+totalAmt);
      summaryParts.push(currIcons[curr] + ' ' + label);
    }
  });

  const hv = document.getElementById('homeGoldValue');
  const hs = document.getElementById('homeGoldSub');
  if (hv) hv.textContent = fmt(totalValue);
  if (hs) hs.textContent = summaryParts.join(' | ');

  const dv = document.getElementById('deskGoldValue');
  const ds = document.getElementById('deskGoldSub');
  if (dv) dv.textContent = fmt(totalValue);
  if (ds) ds.textContent = summaryParts.join(' | ') + ' (Canlı Kur)';
}

// Overwrite render to call loadHomeGoldStats
const oldRender = render;
render = async function() {
  await oldRender();
  if (page === 'home') {
    loadHomeGoldStats();
  }
}
\`);

fs.writeFileSync('app.js', code);
