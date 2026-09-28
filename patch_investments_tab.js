const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// Update Gold to Yatırımlar in Kasa & Finans desktop buttons
code = code.replace(/<button class="desk-sub-tab \${finTab === 'gold' \? 'active' : ''}" onclick="setFinTab\('gold'\)">🪙 Altın<\/button>/g, \`<button class="desk-sub-tab \${finTab === 'gold' ? 'active' : ''}" onclick="setFinTab('gold')">💎 Yatırım</button>\`);

// Mobile tab
code = code.replace(/<button class="top-bar-btn \${finTab === 'gold' \? 'active' : ''}" onclick="setFinTab\('gold'\)">🪙 Altın<\/button>/g, \`<button class="top-bar-btn \${finTab === 'gold' ? 'active' : ''}" onclick="setFinTab('gold')">💎 Yatırım</button>\`);

// Display loop logic in renderFinance and renderFinanceDesktop
// We need to replace: \`🪙 \${g.grams} gr\` with a dynamic one based on currency.
code = code.replace(/\`🪙 \$\{g\.grams\} gr\`/g, "\`${g.currency==='USD'?'💵':g.currency==='EUR'?'💶':'🪙'} ${g.grams}${g.currency==='USD'||g.currency==='EUR'?'':' gr'}\`");

// Also update the description: \`<div class="appt-service">\${g.type==='add' \? 'Altın Geliri' : 'Altın Çıkışı'} - \${g.note || ''}<\/div>\`
// Note: they are stored as note, but we can prepend "Yatırım". The code currently says `Altın Geliri` statically for some.
// But actually `g.note` is set dynamically in save, so we can just rely on g.note!
// Wait, the existing code:
// <div class="appt-service">${g.type==='add' ? 'Altın Eklendi' : 'Altın Çıkarıldı'}${g.note ? ' - '+g.note : ''}</div>
code = code.replace(/\$\{g\.type==='add' \? 'Altın Eklendi' : 'Altın Çıkarıldı'\}/g, "\${g.type==='add' ? 'Yatırım Eklendi' : 'Yatırım Çıkarıldı'}");

fs.writeFileSync('app.js', code);
