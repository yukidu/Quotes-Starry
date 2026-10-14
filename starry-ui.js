(() => {
  'use strict';

  const uiState = { menuOpen: false, confirmResolve: null };

  const STYLE = `
    .sticky-nav{position:sticky!important;top:0!important;z-index:1200!important;background:rgba(249,250,251,.72)!important;-webkit-backdrop-filter:blur(18px) saturate(150%);backdrop-filter:blur(18px) saturate(150%);border-bottom:1px solid rgba(15,23,42,.10)!important;box-shadow:0 8px 24px rgba(15,23,42,.08)!important;transition:background .28s ease,color .28s ease,border-color .28s ease,box-shadow .28s ease!important}
    .sticky-nav>.max-w-6xl{position:relative}.starry-topbar{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:56px;padding:4px 0 8px}.starry-brand{display:flex;align-items:center;gap:10px;min-width:0}.starry-app-icon{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;flex:0 0 auto;background:linear-gradient(145deg,#111827,#312e81 55%,#7c3aed);color:#fff;border:1px solid rgba(255,255,255,.45);box-shadow:0 6px 18px rgba(49,46,129,.25);font-size:20px}.starry-brand-copy{min-width:0}.starry-brand-name{font-weight:900;font-size:15px;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.starry-brand-sub{font-size:10px;font-weight:800;opacity:.58;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.starry-wave{display:flex;align-items:center;gap:2px;height:18px;margin-left:2px}.starry-wave span{width:2px;height:8px;border-radius:999px;background:currentColor;opacity:.55;transform-origin:center;animation:starryWave 1.15s ease-in-out infinite}.starry-wave span:nth-child(2){animation-delay:.14s}.starry-wave span:nth-child(3){animation-delay:.28s}.starry-wave span:nth-child(4){animation-delay:.42s}@keyframes starryWave{0%,100%{transform:scaleY(.55)}50%{transform:scaleY(1.65)}}
    .starry-nav-actions{display:flex;align-items:center;gap:8px;min-width:0}.starry-member-pill,.starry-login-btn,.starry-menu-btn{border:1px solid rgba(15,23,42,.14);background:rgba(255,255,255,.68);color:#111827;box-shadow:0 5px 16px rgba(15,23,42,.07);transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease,background .28s ease,color .28s ease}.starry-member-pill:hover,.starry-login-btn:hover,.starry-menu-btn:hover{transform:translateY(-1px);border-color:rgba(99,102,241,.42);box-shadow:0 8px 22px rgba(79,70,229,.12)}.starry-member-pill:active,.starry-login-btn:active,.starry-menu-btn:active{transform:scale(.95)}.starry-member-pill,.starry-login-btn{height:38px;border-radius:14px;padding:0 11px;font-size:11px;font-weight:900;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.starry-member-pill{display:none}.starry-menu-btn{width:40px;height:40px;border-radius:14px;display:grid;place-items:center;font-size:20px;font-weight:900;flex:0 0 auto}
    .starry-menu{position:absolute;right:0;top:52px;width:min(88vw,320px);padding:9px;border-radius:18px;border:1px solid rgba(255,255,255,.38);background:rgba(255,255,255,.88);-webkit-backdrop-filter:blur(18px) saturate(150%);backdrop-filter:blur(18px) saturate(150%);box-shadow:0 24px 50px rgba(15,23,42,.20);opacity:0;transform:translateY(-8px) scale(.97);pointer-events:none;transform-origin:top right;transition:opacity .19s ease-out,transform .19s ease-out;z-index:1300}.starry-menu.open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}.starry-menu-row{width:100%;border:0;background:transparent;border-radius:13px;padding:11px 12px;display:flex;align-items:center;gap:10px;font-size:13px;font-weight:850;text-align:left;color:#111827;transition:background .16s ease,color .16s ease,transform .16s ease}.starry-menu-row:hover{background:rgba(99,102,241,.10);color:#4f46e5;transform:translateX(2px)}.starry-menu-row .icon{width:24px;text-align:center;font-size:17px}.starry-menu-divider{height:1px;background:rgba(15,23,42,.08);margin:5px 4px}#welcomeLine{margin:0 0 5px!important;padding:0 2px!important;min-height:20px!important}#welcomeMsg{font-size:12px!important;font-weight:900!important;opacity:.72}
    .starry-confirm-layer{position:fixed;inset:0;z-index:10000;background:rgba(15,23,42,.22);display:flex;align-items:flex-start;justify-content:center;padding-top:max(5rem,calc(env(safe-area-inset-top) + 4.5rem));opacity:0;pointer-events:none;transition:opacity .14s ease}.starry-confirm-layer.open{opacity:1;pointer-events:auto}.starry-confirm-card{position:relative;width:80vw;max-width:32rem;border-radius:16px;border:1px solid rgb(252,211,77);background:rgb(255,251,235);color:rgb(120,53,15);padding:1.15rem 1rem 1rem;box-shadow:0 20px 25px -5px rgba(15,23,42,.18),0 8px 10px -6px rgba(15,23,42,.12);opacity:0;transform:scale(.95);transition:opacity .16s ease,transform .16s ease}.starry-confirm-layer.open .starry-confirm-card{opacity:1;transform:scale(1)}.starry-confirm-icon{position:absolute;left:.8rem;top:.8rem;font-size:clamp(4rem,16vw,4.75rem);line-height:1;color:rgb(217,119,6)}.starry-confirm-icon::after{content:'!';position:absolute;left:50%;top:48%;transform:translate(-50%,-50%);font-size:.42em;font-weight:1000;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.15)}.starry-confirm-copy{padding-left:4.75rem;text-align:center;min-height:4.6rem}.starry-confirm-title{font-size:1.05rem;font-weight:900;margin:.15rem 0 .45rem}.starry-confirm-message{font-size:.92rem;font-weight:750;line-height:1.55}.starry-confirm-actions{display:flex;justify-content:center;gap:.85rem;margin-top:1rem}.starry-confirm-actions button{width:7rem;min-height:42px;border-radius:12px;font-weight:900;font-size:.9rem;transition:transform .16s ease,box-shadow .16s ease}.starry-confirm-actions button:active{transform:scale(.95)}.starry-confirm-cancel{background:#fff;border:1px solid rgb(252,211,77);color:rgb(146,64,14)}.starry-confirm-ok{background:rgb(217,119,6);border:1px solid rgb(217,119,6);color:#fff}
    html.starry-dark body{background-color:#0f172a!important;color:#f8fafc!important}html.starry-dark .sticky-nav{background:rgba(15,23,42,.78)!important;border-color:rgba(148,163,184,.18)!important;color:#f8fafc!important;box-shadow:0 8px 26px rgba(2,6,23,.26)!important}html.starry-dark .starry-member-pill,html.starry-dark .starry-login-btn,html.starry-dark .starry-menu-btn{background:rgba(30,41,59,.74);color:#f8fafc;border-color:rgba(148,163,184,.22)}html.starry-dark .starry-menu{background:rgba(15,23,42,.92);border-color:rgba(148,163,184,.18)}html.starry-dark .starry-menu-row{color:#f8fafc}html.starry-dark .starry-menu-row:hover{background:rgba(129,140,248,.14);color:#c7d2fe}html.starry-dark .starry-menu-divider{background:rgba(148,163,184,.16)}html.starry-dark .starry-confirm-layer{background:rgba(2,6,23,.48)}html.starry-dark .starry-confirm-card{background:rgb(69,26,3);border-color:rgb(146,64,14);color:rgb(253,230,138)}html.starry-dark .starry-confirm-icon{color:rgb(251,191,36)}html.starry-dark .starry-confirm-ok{background:rgb(245,158,11);border-color:rgb(245,158,11);color:#1c1917}html.starry-dark .starry-confirm-cancel{background:rgb(92,39,10);border-color:rgb(146,64,14);color:rgb(253,230,138)}
    @media(max-width:640px){.starry-wave{display:none}.starry-brand-sub{max-width:120px}.starry-member-pill{max-width:132px}.starry-login-btn{padding:0 9px;font-size:10px}.starry-topbar{gap:6px}.starry-confirm-copy{padding-left:4.65rem}}
  `;

  function installStyles() {
    if (document.getElementById('starryUiStyles')) return;
    const style = document.createElement('style');
    style.id = 'starryUiStyles';
    style.textContent = STYLE;
    document.head.appendChild(style);
  }

  function toggleDark() {
    document.documentElement.classList.toggle('starry-dark');
    const dark = document.documentElement.classList.contains('starry-dark');
    localStorage.setItem('starry_quotes_theme', dark ? 'dark' : 'light');
    const label = document.getElementById('starryThemeLabel');
    if (label) label.textContent = dark ? '開燈' : '關燈';
  }

  function closeMenu() {
    uiState.menuOpen = false;
    document.getElementById('starryMenu')?.classList.remove('open');
  }

  function toggleMenu() {
    uiState.menuOpen = !uiState.menuOpen;
    document.getElementById('starryMenu')?.classList.toggle('open', uiState.menuOpen);
  }

  function makeMenuRow(icon, label, onClick, id = '') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'starry-menu-row';
    if (id) button.id = id;
    button.innerHTML = `<span class="icon">${icon}</span><span>${label}</span>`;
    button.addEventListener('click', () => { closeMenu(); onClick(); });
    return button;
  }

  function ensureChrome() {
    installStyles();
    if (localStorage.getItem('starry_quotes_theme') === 'dark') document.documentElement.classList.add('starry-dark');
    const host = document.querySelector('.sticky-nav .max-w-6xl');
    if (!host || document.getElementById('starryTopbar')) return;

    const bar = document.createElement('div');
    bar.id = 'starryTopbar';
    bar.className = 'starry-topbar';
    bar.innerHTML = `<div class="starry-brand"><div class="starry-app-icon" aria-hidden="true">✦</div><div class="starry-brand-copy"><div class="starry-brand-name">繁星語錄</div><div class="starry-brand-sub">Quotes Starry</div></div><div class="starry-wave" aria-hidden="true"><span></span><span></span><span></span><span></span></div></div><div class="starry-nav-actions"><button id="starryNavMember" type="button" class="starry-member-pill"></button><button id="starryNavLogin" type="button" class="starry-login-btn">按此註冊或登入</button><button id="starryMenuBtn" type="button" class="starry-menu-btn" aria-label="功能選單">☰</button></div><div id="starryMenu" class="starry-menu" role="menu"></div>`;
    host.insertBefore(bar, host.firstChild);

    const menu = bar.querySelector('#starryMenu');
    menu.appendChild(makeMenuRow('👤', 'Starry ID 會員', () => { window.location.href = window.StarryConfig.starryIdOrigin + '/'; }, 'starryMenuIdentity'));
    menu.appendChild(makeMenuRow('◐', document.documentElement.classList.contains('starry-dark') ? '開燈' : '關燈', toggleDark, 'starryThemeRow'));
    menu.lastChild.querySelector('span:last-child').id = 'starryThemeLabel';
    menu.appendChild(makeMenuRow('🧾', '抽卡紀錄', () => window.openRecordModal?.()));
    menu.appendChild(makeMenuRow('🔗', '分享網站', () => window.shareApp?.()));
    menu.appendChild(makeMenuRow('✨', '隨機變身', () => window.randomStyle?.()));
    const divider = document.createElement('div'); divider.className = 'starry-menu-divider'; menu.appendChild(divider);
    menu.appendChild(makeMenuRow('📲', '安裝到桌面', () => window.openInstallModal?.()));
    menu.appendChild(makeMenuRow('🔐', '登入 Starry ID', () => { const signedIn = Boolean(window.StarryPlatform?.auth?.getDisplayName?.()); window.location.href = window.StarryConfig.starryIdOrigin + (signedIn ? '/' : '/auth/quotes'); }, 'starryMenuAuth'));

    bar.querySelector('#starryMenuBtn').addEventListener('click', (event) => { event.stopPropagation(); toggleMenu(); });
    bar.querySelector('#starryNavLogin').addEventListener('click', () => { window.location.href = window.StarryConfig.starryIdOrigin + '/auth/quotes'; });
    bar.querySelector('#starryNavMember').addEventListener('click', () => { window.location.href = window.StarryConfig.starryIdOrigin + '/'; });
    document.addEventListener('click', (event) => { if (!bar.contains(event.target)) closeMenu(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
    renderIdentity(window.StarryPlatform?.auth?.getIdentity?.(), window.StarryPlatform?.auth?.getDisplayName?.() || '');
  }

  function renderIdentity(identity, displayName = '') {
    const member = document.getElementById('starryNavMember');
    const login = document.getElementById('starryNavLogin');
    const identityRow = document.getElementById('starryMenuIdentity');
    const authRow = document.getElementById('starryMenuAuth');
    if (!member || !login || !identityRow || !authRow) return;
    const authenticated = Boolean(identity?.authenticated && displayName);
    member.style.display = authenticated ? 'inline-flex' : 'none';
    member.textContent = authenticated ? `👤 ${displayName}` : '';
    login.style.display = authenticated ? 'none' : 'inline-flex';
    identityRow.querySelector('span:last-child').textContent = authenticated ? displayName : 'Starry ID 會員';
    authRow.querySelector('.icon').textContent = authenticated ? '👤' : '🔐';
    authRow.querySelector('span:last-child').textContent = authenticated ? '前往 Starry ID' : '登入 Starry ID';
  }

  function ensureConfirmLayer() {
    let layer = document.getElementById('starryConfirmLayer');
    if (layer) return layer;
    layer = document.createElement('div');
    layer.id = 'starryConfirmLayer';
    layer.className = 'starry-confirm-layer';
    layer.innerHTML = `<div class="starry-confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="starryConfirmTitle"><div class="starry-confirm-icon" aria-hidden="true">🛡️</div><div class="starry-confirm-copy"><div id="starryConfirmTitle" class="starry-confirm-title">請確認</div><div id="starryConfirmMessage" class="starry-confirm-message"></div></div><div class="starry-confirm-actions"><button id="starryConfirmCancel" type="button" class="starry-confirm-cancel">取消</button><button id="starryConfirmOk" type="button" class="starry-confirm-ok">確定</button></div></div>`;
    document.body.appendChild(layer);
    layer.addEventListener('click', (event) => { if (event.target === layer) resolveConfirm(false); });
    layer.querySelector('#starryConfirmCancel').addEventListener('click', () => resolveConfirm(false));
    layer.querySelector('#starryConfirmOk').addEventListener('click', () => resolveConfirm(true));
    return layer;
  }

  function resolveConfirm(value) {
    const layer = document.getElementById('starryConfirmLayer');
    layer?.classList.remove('open');
    const resolve = uiState.confirmResolve;
    uiState.confirmResolve = null;
    window.setTimeout(() => resolve?.(value), 160);
  }

  function confirmDialog({ title = '請確認', message = '', confirmText = '確定', cancelText = '取消' } = {}) {
    installStyles();
    const layer = ensureConfirmLayer();
    layer.querySelector('#starryConfirmTitle').textContent = title;
    layer.querySelector('#starryConfirmMessage').textContent = message;
    layer.querySelector('#starryConfirmOk').textContent = confirmText;
    layer.querySelector('#starryConfirmCancel').textContent = cancelText;
    layer.classList.add('open');
    layer.querySelector('#starryConfirmCancel').focus();
    return new Promise(resolve => { uiState.confirmResolve = resolve; });
  }

  window.StarryUI = Object.freeze({ ensureChrome, renderIdentity, confirm: confirmDialog, closeMenu });
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', ensureChrome, { once: true });
  else ensureChrome();
})();
