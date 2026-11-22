const $ = id => document.getElementById(id);
let balance = 2500;
let txs = [];
let profile = JSON.parse(localStorage.getItem('apay_profile') || 'null');

function authScreen() {
  document.body.innerHTML = `
  <div style="max-width:420px;margin:60px auto;padding:24px;font-family:Arial;text-align:center">
    <h1 style="color:#1769e8;font-size:38px">A PAY</h1>
    <h2 id="authTitle">Create Account</h2>
    <p>Welcome to A Pay Demo Wallet</p>
    <input id="demoName" placeholder="Your nickname"
      style="box-sizing:border-box;width:100%;padding:15px;margin:8px 0;border:1px solid #ddd;border-radius:12px">
    <input id="demoCode" type="password" placeholder="Demo code (4+ characters)"
      style="box-sizing:border-box;width:100%;padding:15px;margin:8px 0;border:1px solid #ddd;border-radius:12px">
    <button id="signup" style="width:100%;padding:15px;background:#1769e8;color:white;border:0;border-radius:12px;margin-top:12px">Create Account</button>
    <button id="login" style="width:100%;padding:15px;background:#15945c;color:white;border:0;border-radius:12px;margin-top:10px">Login</button>
    <p style="font-size:12px;color:#777">Demo account only. Never use your real password, banking PIN or UPI PIN.</p>
  </div>`;

  $('signup').onclick = () => {
    const name = $('demoName').value.trim();
    const code = $('demoCode').value;
    if (!name || code.length < 4) {
      alert('Enter nickname and a demo code of at least 4 characters.');
      return;
    }
    profile = {name, code};
    localStorage.setItem('apay_profile', JSON.stringify(profile));
    localStorage.setItem('apay_login', 'yes');
    location.reload();
  };

  $('login').onclick = () => {
    const name = $('demoName').value.trim();
    const code = $('demoCode').value;
    if (profile && name === profile.name && code === profile.code) {
      localStorage.setItem('apay_login', 'yes');
      location.reload();
    } else {
      alert('Incorrect demo login details.');
    }
  };
}

function render() {
  $('balance').textContent = '₹ ' + balance.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
  $('transactions').innerHTML = txs.length
    ? txs.map(t => `<div class="tx"><div class="tx-icon">${t.icon}</div><div class="tx-info"><b>${t.name}</b><small>${t.time}</small></div><div class="tx-amount" style="color:${t.plus?'#15945c':'#172b49'}">${t.plus?'+':'−'}₹${t.amount.toFixed(2)}</div></div>`).join('')
    : '<div class="empty">No transactions yet. Try a demo action.</div>';
}

function addTx(name, amount, plus, icon) {
  txs.unshift({name, amount, plus, icon, time:new Date().toLocaleString()});
  render();
}

function open(html) {
  $('modalContent').innerHTML = html;
  $('modal').classList.remove('hidden');
}

function close() {
  $('modal').classList.add('hidden');
}

function startApp() {
  $('close').onclick = close;
  $('modal').onclick = e => {if(e.target === $('modal')) close();};

  $('add').onclick = () => open(`
    <h2>Add demo money</h2>
    <input class="field" id="amt" type="number" min="1" max="10000" placeholder="Amount in ₹">
    <button class="primary" id="confirm">Add to demo wallet</button>
    <p class="note">Demo only. No real money is added.</p>`);

  $('send').onclick = () => open(`
    <h2>Send demo money</h2>
    <input class="field" id="person" placeholder="Recipient nickname">
    <input class="field" id="amt" type="number" min="1" placeholder="Amount in ₹">
    <button class="primary" id="confirm">Confirm demo transfer</button>
    <p class="note">No real payment or UPI transfer occurs.</p>`);

  $('receive').onclick = () => open(`
    <h2>Receive</h2><p>Your A Pay demo receive screen</p>
    <div class="qr">▦</div><p style="text-align:center">A PAY • DEMO ONLY</p>
    <p class="note">Decorative QR only. Not scannable.</p>`);

  $('mobile').onclick = () => open(`
    <h2>Mobile recharge</h2><p>Recharge preview</p>
    <input class="field" type="number" id="amt" placeholder="Demo amount">
    <button class="primary" id="confirm">Preview recharge</button>
    <p class="note">No recharge will be processed.</p>`);

  $('bills').onclick = () => open('<h2>Bill payments</h2><p>Coming soon.</p>');

  document.addEventListener('click', e => {
    if (e.target.id !== 'confirm') return;
    const a = Number($('amt')?.value || 0);
    if (!Number.isFinite(a) || a <= 0 || a > 10000) {
      alert('Enter an amount between ₹1 and ₹10,000.');
      return;
    }
    if ($('person')) {
      const n = $('person').value.trim();
      if (!n) {alert('Enter recipient nickname.');return;}
      if (a > balance) {alert('Insufficient demo balance.');return;}
      balance -= a;
      addTx('Demo transfer to '+n,a,false,'↗');
    } else if ($('modalContent').innerText.includes('Add demo money')) {
      balance += a;
      addTx('Demo money added',a,true,'＋');
    } else {
      addTx('Recharge preview',a,false,'▤');
    }
    close();
    render();
  });

  $('historyJump').onclick = () => $('history').scrollIntoView({behavior:'smooth'});
  $('navHistory').onclick = () => $('history').scrollIntoView({behavior:'smooth'});
  $('clear').onclick = () => {txs=[];render();};

  $('navProfile').onclick = () => open(`
    <h2>My Profile</h2>
    <p>Name: ${profile.name.replace(/[<>&"]/g,'')}</p>
    <p>A Pay Demo Wallet • Version 1.1</p>
    <button class="primary" id="logout">Logout</button>
    <p class="note">Demo only. No real KYC, UPI, bank account or stored funds.</p>`);

  document.addEventListener('click', e => {
    if (e.target.id === 'logout') {
      localStorage.removeItem('apay_login');
      location.reload();
    }
  });

  render();
}

if (!profile || localStorage.getItem('apay_login') !== 'yes') {
  authScreen();
} else {
  startApp();
}
