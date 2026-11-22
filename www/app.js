const $ = id => document.getElementById(id);
const STORE = 'apay_demo_wallet_v2';
let profile = JSON.parse(localStorage.getItem('apay_profile') || 'null');
let state = JSON.parse(localStorage.getItem(STORE) || '{"balance":2500,"txs":[]}');
let balance = Number(state.balance ?? 2500);
let txs = Array.isArray(state.txs) ? state.txs : [];

function saveState() {
  localStorage.setItem(STORE, JSON.stringify({balance, txs}));
}
function safeText(value) {
  return String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function authScreen() {
  document.body.innerHTML = `<div class="auth-wrap"><div class="auth-card"><div class="brandmark auth-mark">A</div><div class="eyebrow">WELCOME TO</div><h1>A Pay Wallet</h1><p class="muted">Create a local demo profile to explore the app.</p><input id="demoName" class="field" placeholder="Your nickname" maxlength="30"><input id="demoCode" class="field" type="password" placeholder="Demo code (4+ characters)"><button id="signup" class="primary">Create demo account</button><button id="login" class="secondary">Login</button><p class="fineprint">Demo account only. Never enter your real password, banking PIN or UPI PIN.</p></div></div>`;
  $('signup').onclick = () => {
    const name = $('demoName').value.trim(), code = $('demoCode').value;
    if (!name || code.length < 4) return alert('Enter a nickname and a demo code of at least 4 characters.');
    profile = {name, code}; localStorage.setItem('apay_profile', JSON.stringify(profile));
    localStorage.setItem('apay_login','yes'); location.reload();
  };
  $('login').onclick = () => {
    const name = $('demoName').value.trim(), code = $('demoCode').value;
    const saved = JSON.parse(localStorage.getItem('apay_demo_code') || 'null');
    if (profile && name === profile.name && code === profile.code) { localStorage.setItem('apay_login','yes'); location.reload(); }
    else alert('For this demo, create a profile first or check your nickname and demo code.');
  };
}
function persistProfile() {
  if (profile) localStorage.setItem('apay_profile', JSON.stringify(profile));
}
function render() {
  $('balance').textContent = '₹' + balance.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
  $('helloName').textContent = profile?.name ? `Hello, ${profile.name}` : 'Your wallet';
  $('avatarLetter').textContent = (profile?.name || 'A').charAt(0).toUpperCase();
  $('transactions').innerHTML = txs.length ? txs.map(t => `<div class="tx-row"><div class="tx-icon ${t.plus?'positive':''}">${t.plus?'＋':'↗'}</div><div class="tx-copy"><b>${safeText(t.name)}</b><small>${safeText(t.time)}</small><em>DEMO</em></div><strong class="${t.plus?'credit':'debit'}">${t.plus?'+':'−'}₹${Number(t.amount).toFixed(2)}</strong></div>`).join('') : '<div class="empty-state"><div class="empty-icon">↻</div><b>No activity yet</b><span>Your demo transactions will appear here.</span></div>';
}
function addTx(name, amount, plus) {
  txs.unshift({name, amount, plus, time:new Date().toLocaleString('en-IN')});
  txs = txs.slice(0,100); saveState(); render();
}
function open(html) { $('modalContent').innerHTML = html; $('modal').classList.remove('hidden'); }
function close() { $('modal').classList.add('hidden'); stopScanner(); }
function stopScanner() {
  if (window.apayStream) { window.apayStream.getTracks().forEach(t=>t.stop()); window.apayStream=null; }
  if (window.apayScanTimer) { clearInterval(window.apayScanTimer); window.apayScanTimer=null; }
}
function parseUpiQr(raw) {
  let url;
  try { url = new URL(raw); } catch { return null; }
  if (url.protocol.toLowerCase() !== 'upi:' || url.hostname.toLowerCase() !== 'pay') return null;
  const p = url.searchParams;
  return {
    vpa: p.get('pa') || '',
    name: p.get('pn') || '',
    amount: p.get('am') || '',
    note: p.get('tn') || '',
    currency: p.get('cu') || 'INR'
  };
}
function showQrDetails(details) {
  stopScanner();
  open(`<div class="modal-eyebrow">QR SCAN RESULT</div><h2>UPI details found</h2><p class="muted">Check the information carefully. This screen only reads QR data; it does not send money.</p>
  <div class="details-card">
    <div class="detail-line"><span>Payee name</span><b>${safeText(details.name || 'Not provided in QR')}</b></div>
    <div class="detail-line"><span>UPI ID</span><b>${safeText(details.vpa || 'Not provided in QR')}</b></div>
    <div class="detail-line"><span>Amount</span><b>${details.amount ? '₹'+safeText(details.amount) : 'Not specified'}</b></div>
    <div class="detail-line"><span>Currency</span><b>${safeText(details.currency)}</b></div>
    <div class="detail-line"><span>Note</span><b>${safeText(details.note || 'None')}</b></div>
  </div><div class="notice">QR information can be incomplete or misleading. Verify recipient details independently. A Pay does not verify the account holder.</div><button class="primary" id="reviewPayment">Review payment</button><button class="secondary" id="scanAgain">Scan another QR</button>`);
  $('reviewPayment').onclick = () => showPaymentConfirmation(details);
  $('scanAgain').onclick = startScanner;
}
function showPaymentConfirmation(details) {
  const amountText = details.amount ? '₹' + safeText(details.amount) : 'Amount not set';
  open(`<div class="modal-eyebrow">PAYMENT CONFIRMATION</div><h2>Review before you continue</h2><p class="muted">The QR details are ready for review. No money has been sent.</p>
  <div class="details-card">
    <div class="detail-line"><span>Payee name</span><b>${safeText(details.name || 'Not provided')}</b></div>
    <div class="detail-line"><span>UPI ID</span><b>${safeText(details.vpa || 'Not provided')}</b></div>
    <div class="detail-line"><span>Amount</span><b>${amountText}</b></div>
    <div class="detail-line"><span>Note</span><b>${safeText(details.note || 'None')}</b></div>
  </div>
  <div class="notice">This demo cannot initiate UPI payments. To pay, open a supported, authorised UPI app and verify the recipient there before entering your UPI PIN.</div>
  <button class="primary" id="paymentContinue">Continue in authorised UPI app</button><button class="secondary" id="paymentCancel">Cancel</button>`);
  $('paymentContinue').onclick = () => open(`<div class="modal-eyebrow">PAYMENT NOT SENT</div><h2>Demo payment stopped safely</h2><p class="muted">A Pay is not connected to a UPI payment provider, so no payment was started or sent.</p><div class="notice">Use your bank's or authorised UPI provider's official app to make a real payment. Never share your UPI PIN with anyone.</div><button class="primary" id="donePayment">Done</button>`);
  $('paymentCancel').onclick = () => close();
  $('donePayment')?.addEventListener('click', close);
}
async function startScanner() {
  stopScanner();
  open(`<div class="modal-eyebrow">QR SCANNER</div><h2>Scan a UPI QR</h2><p class="muted">Point your camera at a UPI QR code. Camera permission is required.</p><div class="camera-box"><video id="qrVideo" playsinline></video><div class="scan-frame"></div></div><p id="scanStatus" class="scan-status">Starting camera…</p><button class="secondary" id="pasteQr">Enter QR text manually</button><p class="fineprint">Only reads QR content. No payment is initiated.</p>`);
  $('pasteQr').onclick = () => {
    stopScanner();
    open(`<div class="modal-eyebrow">MANUAL QR DATA</div><h2>Paste QR text</h2><textarea id="qrText" class="field qr-text" placeholder="Paste decoded UPI QR text here"></textarea><button class="primary" id="readQrText">Read details</button>`);
    $('readQrText').onclick = () => {
      const d = parseUpiQr($('qrText').value.trim());
      if (!d) return alert('This does not look like a standard UPI payment QR.');
      showQrDetails(d);
    };
  };
  if (!('BarcodeDetector' in window)) {
    $('scanStatus').textContent = 'QR camera scanning is not supported by this browser. Use manual entry.';
    return;
  }
  try {
    const detector = new BarcodeDetector({formats:['qr_code']});
    const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});
    window.apayStream = stream;
    const video = $('qrVideo'); video.srcObject = stream; await video.play();
    $('scanStatus').textContent = 'Camera ready — align the QR inside the frame.';
    window.apayScanTimer = setInterval(async () => {
      if (!video || video.readyState < 2) return;
      try {
        const codes = await detector.detect(video);
        if (codes.length) {
          const details = parseUpiQr(codes[0].rawValue);
          if (details) showQrDetails(details);
          else $('scanStatus').textContent = 'QR found, but it is not a standard UPI payment QR.';
        }
      } catch {}
    }, 450);
  } catch (err) {
    $('scanStatus').textContent = 'Camera unavailable or permission denied. Use manual entry instead.';
  }
}
function startApp() {
  $('close').onclick = close;
  $('modal').onclick = e => { if (e.target === $('modal')) close(); };
  $('add').onclick = () => {
    open(`<div class="modal-eyebrow">DEMO WALLET</div><h2>Add demo money</h2><input class="field" id="amt" type="number" min="1" max="10000" placeholder="Amount in ₹"><button class="primary" id="confirm">Add to demo wallet</button><p class="notice">Sample balance only. No real funds are added.</p>`);
  };
  $('send').onclick = () => {
    open(`<div class="modal-eyebrow">DEMO TRANSFER</div><h2>Send demo money</h2><input class="field" id="person" placeholder="Recipient nickname"><input class="field" id="amt" type="number" min="1" max="10000" placeholder="Amount in ₹"><button class="primary" id="confirm">Confirm demo transfer</button><p class="notice">No real payment or UPI transfer occurs.</p>`);
  };
  $('receive').onclick = () => open(`<div class="modal-eyebrow">RECEIVE</div><h2>Receive demo payment</h2><div class="demo-qr">A PAY<br><small>DEMO QR</small></div><p class="muted center">This is a visual demo only and cannot receive money.</p>`);
  $('scan').onclick = startScanner;
  $('mobile').onclick = () => open(`<div class="modal-eyebrow">RECHARGE PREVIEW</div><h2>Mobile recharge</h2><input class="field" id="phone" inputmode="numeric" placeholder="Mobile number"><input class="field" id="amt" type="number" min="1" max="10000" placeholder="Demo amount"><button class="primary" id="confirm">Preview recharge</button><p class="notice">No recharge will be processed.</p>`);
  document.addEventListener('click', e => { if (e.target.id === 'confirm') handleConfirm(); });
  $('historyJump').onclick = $('navHistory').onclick = () => $('history').scrollIntoView({behavior:'smooth'});
  $('clear').onclick = () => { if(confirm('Clear demo transaction history?')) {txs=[];saveState();render();} };
  $('navProfile').onclick = $('navProfileBottom').onclick = () => open(`<div class="modal-eyebrow">ACCOUNT</div><h2>My profile</h2><div class="details-card"><div class="detail-line"><span>Nickname</span><b>${safeText(profile?.name)}</b></div><div class="detail-line"><span>Account type</span><b>Local demo</b></div><div class="detail-line"><span>App</span><b>A Pay Wallet</b></div></div><button class="primary" id="logout">Logout</button><p class="notice">No bank account, UPI ID or real balance is connected.</p>`);
  document.addEventListener('click', e => {
    if (e.target.id === 'logout') { localStorage.removeItem('apay_login'); location.reload(); }
  });
  render();
}
function handleConfirm() {
  const amount = Number($('amt')?.value || 0);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10000) return alert('Enter an amount between ₹1 and ₹10,000.');
  if ($('person')) {
    const name = $('person').value.trim();
    if (!name) return alert('Enter recipient nickname.');
    if (amount > balance) return alert('Insufficient demo balance.');
    balance -= amount; addTx('Demo transfer to '+name, amount, false);
  } else if ($('modalContent').innerText.includes('Add demo money')) {
    balance += amount; addTx('Demo money added', amount, true);
  } else {
    addTx('Recharge preview', amount, false);
  }
  saveState(); close(); render();
}
if (!profile || localStorage.getItem('apay_login') !== 'yes') authScreen();
else startApp();
