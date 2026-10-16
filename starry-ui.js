(() => {
  'use strict';

  const uiState = { menuOpen: false, confirmResolve: null };
  const THEME_KEY = 'starry_mirror_theme';
  const LEGACY_THEME_KEY = 'starry_quotes_theme';

  const STYLE = `
    .sticky-nav{position:sticky!important;top:0!important;z-index:1200!important;background:rgba(249,250,251,.76)!important;-webkit-backdrop-filter:blur(18px) saturate(150%);backdrop-filter:blur(18px) saturate(150%);border-bottom:1px solid rgba(15,23,42,.10)!important;box-shadow:0 8px 24px rgba(15,23,42,.08)!important}.sticky-nav>.max-w-6xl{position:relative}.starry-topbar{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:56px;padding:4px 0 8px}.starry-brand{display:flex;align-items:center;gap:10px;min-width:0}.starry-app-icon{width:40px;height:40px;border-radius:14px;display:grid;place-items:center;flex:0 0 auto;background:linear-gradient(145deg,#0f172a,#4338ca 54%,#ec4899);color:#fff;border:1px solid rgba(255,255,255,.46);box-shadow:0 6px 18px rgba(67,56,202,.26);font-size:21px}.starry-brand-copy{min-width:0}.starry-brand-name{font-weight:950;font-size:15px;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.starry-brand-sub{font-size:10px;font-weight:850;opacity:.6;margin-top:3px;white-space:nowrap}.starry-wave{display:flex;align-items:center;gap:2px;height:18px}.starry-wave span{width:2px;height:8px;border-radius:999px;background:currentColor;opacity:.55;animation:starryWave 1.15s ease-in-out infinite}.starry-wave span:nth-child(2){animation-delay:.14s}.starry-wave span:nth-child(3){animation-delay:.28s}.starry-wave span:nth-child(4){animation-delay:.42s}@keyframes starryWave{0%,100%{transform:scaleY(.55)}50%{transform:scaleY(1.65)}}
    .starry-nav-actions{display:flex;align-items:center;gap:8px;min-width:0}.starry-member-pill,.starry-login-btn,.starry-menu-btn{border:1px solid rgba(15,23,42,.14);background:rgba(255,255,255,.72);color:#111827;box-shadow:0 5px 16px rgba(15,23,42,.07);transition:.18s ease}.starry-member-pill:hover,.starry-login-btn:hover,.starry-menu-btn:hover{transform:translateY(-1px);border-color:rgba(99,102,241,.42)}.starry-member-pill,.starry-login-btn{height:38px;border-radius:14px;padding:0 11px;font-size:11px;font-weight:900;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.starry-member-pill{display:none;align-items:center}.starry-menu-btn{width:40px;height:40px;border-radius:14px;display:grid;place-items:center;font-size:20px;font-weight:900;flex:0 0 auto}.starry-menu{position:absolute;right:0;top:52px;width:min(90vw,330px);padding:9px;border-radius:18px;border:1px solid rgba(255,255,255,.4);background:rgba(255,255,255,.92);-webkit-backdrop-filter:blur(18px) saturate(150%);backdrop-filter:blur(18px) saturate(150%);box-shadow:0 24px 50px rgba(15,23,42,.20);opacity:0;transform:translateY(-8px) scale(.97);pointer-events:none;transform-origin:top right;transition:.19s ease;z-index:1300}.starry-menu.open{opacity:1;transform:none;pointer-events:auto}.starry-menu-row{width:100%;border:0;background:transparent;border-radius:13px;padding:11px 12px;display:flex;align-items:center;gap:10px;font-size:13px;font-weight:850;text-align:left;color:#111827;transition:.16s ease}.starry-menu-row:hover{background:rgba(99,102,241,.10);color:#4f46e5;transform:translateX(2px)}.starry-menu-row .icon{width:24px;text-align:center;font-size:17px}.starry-menu-row[hidden]{display:none}.starry-menu-divider{height:1px;background:rgba(15,23,42,.08);margin:5px 4px}.starry-usage{margin:3px 2px 6px;padding:10px 12px;border-radius:13px;background:linear-gradient(135deg,rgba(99,102,241,.10),rgba(236,72,153,.09));font-size:12px;font-weight:900;line-height:1.55;color:#312e81}.starry-usage strong{display:block;font-size:13px;color:#111827}.starry-battery{font-size:11px;opacity:.75;margin-top:2px}#welcomeLine{margin:0 0 5px!important;padding:0 2px!important;min-height:20px!important}#welcomeMsg{font-size:12px!important;font-weight:900!important;opacity:.72}
    .starry-confirm-layer{position:fixed;inset:0;z-index:10000;background:rgba(15,23,42,.25);display:flex;align-items:flex-start;justify-content:center;padding-top:max(5rem,calc(env(safe-area-inset-top) + 4.5rem));opacity:0;pointer-events:none;transition:opacity .14s ease}.starry-confirm-layer.open{opacity:1;pointer-events:auto}.starry-confirm-card{position:relative;width:80vw;max-width:32rem;border-radius:16px;border:1px solid rgb(252,211,77);background:rgb(255,251,235);color:rgb(120,53,15);padding:1.15rem 1rem 1rem;box-shadow:0 20px 25px -5px rgba(15,23,42,.18);opacity:0;transform:scale(.95);transition:.16s ease}.starry-confirm-layer.open .starry-confirm-card{opacity:1;transform:scale(1)}.starry-confirm-icon{position:absolute;left:.8rem;top:.8rem;font-size:4rem;line-height:1}.starry-confirm-copy{padding-left:4.75rem;text-align:center;min-height:4.6rem}.starry-confirm-title{font-size:1.05rem;font-weight:900;margin:.15rem 0 .45rem}.starry-confirm-message{font-size:.92rem;font-weight:750;line-height:1.55}.starry-confirm-actions{display:flex;justify-content:center;gap:.85rem;margin-top:1rem}.starry-confirm-actions button{width:7rem;min-height:42px;border-radius:12px;font-weight:900;font-size:.9rem}.starry-confirm-cancel{background:#fff;border:1px solid rgb(252,211,77);color:rgb(146,64,14)}.starry-confirm-ok{background:rgb(217,119,6);border:1px solid rgb(217,119,6);color:#fff}
    html.starry-dark body{background-color:#0f172a!important;color:#f8fafc!important}html.starry-dark .sticky-nav{background:rgba(15,23,42,.82)!important;border-color:rgba(148,163,184,.18)!important;color:#f8fafc!important}html.starry-dark .starry-member-pill,html.starry-dark .starry-login-btn,html.starry-dark .starry-menu-btn{background:rgba(30,41,59,.76);color:#f8fafc;border-color:rgba(148,163,184,.22)}html.starry-dark .starry-menu{background:rgba(15,23,42,.94);border-color:rgba(148,163,184,.18)}html.starry-dark .starry-menu-row{color:#f8fafc}html.starry-dark .starry-menu-row:hover{background:rgba(129,140,248,.14);color:#c7d2fe}html.starry-dark .starry-menu-divider{background:rgba(148,163,184,.16)}html.starry-dark .starry-usage{background:rgba(129,140,248,.13);color:#c7d2fe}html.starry-dark .starry-usage strong{color:#fff}html.starry-dark .custom-dropdown,html.starry-dark .dropdown-trigger,html.starry-dark .dropdown-options,html.starry-dark #answerContent,html.starry-dark #recordModal>div,html.starry-dark #installModal>div{color:#111827}
    @media(max-width:640px){.starry-wave{display:none}.starry-brand-sub{max-width:100px}.starry-member-pill{max-width:116px}.starry-login-btn{padding:0 8px;font-size:10px}.starry-topbar{gap:6px}.starry-confirm-copy{padding-left:4.45rem}}
  `;

  function installStyles() {
    if (document.getElementById('starryUiStyles')) return;
    const style = document.createElement('style'); style.id = 'starryUiStyles'; style.textContent = STYLE; document.head.appendChild(style);
  }
  function toggleDark() {
    document.documentElement.classList.toggle('starry-dark');
    const dark = document.documentElement.classList.contains('starry-dark');
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
    const label = document.getElementById('starryThemeLabel'); if (label) label.textContent = dark ? '開燈' : '關燈';
  }
  function closeMenu() { uiState.menuOpen = false; document.getElementById('starryMenu')?.classList.remove('open'); }
  function toggleMenu() { uiState.menuOpen = !uiState.menuOpen; document.getElementById('starryMenu')?.classList.toggle('open', uiState.menuOpen); }
  function makeMenuRow(icon, label, onClick, id = '') {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'starry-menu-row'; if (id) button.id = id;
    button.innerHTML = `<span class="icon">${icon}</span><span>${label}</span>`;
    button.addEventListener('click', () => { closeMenu(); onClick(); }); return button;
  }
  function go(path) { window.location.href = path; }

  function ensureChrome() {
    installStyles();
    const saved = localStorage.getItem(THEME_KEY) || localStorage.getItem(LEGACY_THEME_KEY);
    if (saved === 'dark') document.documentElement.classList.add('starry-dark');
    const host = document.querySelector('.sticky-nav .max-w-6xl');
    if (!host || document.getElementById('starryTopbar')) return;
    const bar = document.createElement('div'); bar.id = 'starryTopbar'; bar.className = 'starry-topbar';
    bar.innerHTML = `<div class="starry-brand"><div class="starry-app-icon" aria-hidden="true">🪞</div><div class="starry-brand-copy"><div class="starry-brand-name">繁星心鏡</div><div class="starry-brand-sub">Starry Mirror</div></div><div class="starry-wave" aria-hidden="true"><span></span><span></span><span></span><span></span></div></div><div class="starry-nav-actions"><button id="starryNavMember" type="button" class="starry-member-pill"></button><button id="starryNavLogin" type="button" class="starry-login-btn">註冊／登入</button><button id="starryMenuBtn" type="button" class="starry-menu-btn" aria-label="功能選單">☰</button></div><div id="starryMenu" class="starry-menu" role="menu"></div>`;
    host.insertBefore(bar, host.firstChild);
    const menu = bar.querySelector('#starryMenu');
    const usage = document.createElement('div'); usage.id = 'starryMirrorUsage'; usage.className = 'starry-usage'; usage.innerHTML = '<strong>今日抽卡</strong><span>讀取中…</span><div class="starry-battery"></div>'; menu.appendChild(usage);
    menu.appendChild(makeMenuRow('🏠', '抽卡首頁', () => go('/'), 'starryMirrorHome'));
    menu.appendChild(makeMenuRow('❤️', '我的收藏', () => go('/favorites'), 'starryMirrorFavorites'));
    menu.appendChild(makeMenuRow('🔮', 'AI解籤紀錄', () => go('/ai-history'), 'starryMirrorAiHistory'));
    menu.appendChild(makeMenuRow('⚙️', '超級管理員', () => go('/admin'), 'starryMirrorAdmin'));
    menu.querySelector('#starryMirrorAdmin').hidden = true;
    const divider1 = document.createElement('div'); divider1.className = 'starry-menu-divider'; menu.appendChild(divider1);
    menu.appendChild(makeMenuRow('👤', 'Starry ID 會員', () => go(window.StarryConfig.starryIdOrigin + '/'), 'starryMenuIdentity'));
    menu.appendChild(makeMenuRow('◐', document.documentElement.classList.contains('starry-dark') ? '開燈' : '關燈', toggleDark, 'starryThemeRow'));
    menu.lastChild.querySelector('span:last-child').id = 'starryThemeLabel';
    menu.appendChild(makeMenuRow('🔗', '分享網站', () => window.shareApp?.()));
    menu.appendChild(makeMenuRow('✨', '隨機變身', () => window.randomStyle?.()));
    const divider2 = document.createElement('div'); divider2.className = 'starry-menu-divider'; menu.appendChild(divider2);
    menu.appendChild(makeMenuRow('📲', '安裝到桌面', () => window.openInstallModal?.()));
    menu.appendChild(makeMenuRow('🔐', '登入 Starry ID', () => go(window.StarryConfig.starryIdOrigin + window.StarryConfig.starryIdLoginPath), 'starryMenuAuth'));
    bar.querySelector('#starryMenuBtn').addEventListener('click', event => { event.stopPropagation(); toggleMenu(); });
    bar.querySelector('#starryNavLogin').addEventListener('click', () => go(window.StarryConfig.starryIdOrigin + window.StarryConfig.starryIdLoginPath));
    bar.querySelector('#starryNavMember').addEventListener('click', () => go(window.StarryConfig.starryIdOrigin + '/'));
    document.addEventListener('click', event => { if (!bar.contains(event.target)) closeMenu(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
    renderIdentity(window.StarryPlatform?.auth?.getIdentity?.(), window.StarryPlatform?.auth?.getDisplayName?.() || '');
  }

  function renderIdentity(identity, displayName = '') {
    const member = document.getElementById('starryNavMember'), login = document.getElementById('starryNavLogin');
    const identityRow = document.getElementById('starryMenuIdentity'), authRow = document.getElementById('starryMenuAuth'), adminRow = document.getElementById('starryMirrorAdmin');
    if (!member || !login || !identityRow || !authRow) return;
    const authenticated = Boolean(identity?.authenticated && displayName);
    member.style.display = authenticated ? 'inline-flex' : 'none'; member.textContent = authenticated ? `👤 ${displayName}` : '';
    login.style.display = authenticated ? 'none' : 'inline-flex';
    identityRow.querySelector('span:last-child').textContent = authenticated ? displayName : 'Starry ID 會員';
    authRow.querySelector('.icon').textContent = authenticated ? '👤' : '🔐'; authRow.querySelector('span:last-child').textContent = authenticated ? '前往 Starry ID' : '登入 Starry ID';
    if (adminRow) adminRow.hidden = !identity?.isSuperAdmin;
  }

  function renderMirrorStatus(data) {
    const box = document.getElementById('starryMirrorUsage'); if (!box || !data?.usage) return;
    const draws = data.usage.draws || {}; const battery = data.battery;
    box.querySelector('span').textContent = `已抽 ${draws.used || 0} / 剩餘 ${draws.remaining || 0} 次`;
    box.querySelector('.starry-battery').textContent = battery == null ? '訪客不計電池' : `🔋 ${battery} 顆`;
    const adminRow = document.getElementById('starryMirrorAdmin'); if (adminRow) adminRow.hidden = !data.identity?.isSuperAdmin;
  }

  function ensureConfirmLayer() {
    let layer = document.getElementById('starryConfirmLayer'); if (layer) return layer;
    layer = document.createElement('div'); layer.id = 'starryConfirmLayer'; layer.className = 'starry-confirm-layer';
    layer.innerHTML = `<div class="starry-confirm-card" role="alertdialog" aria-modal="true"><div class="starry-confirm-icon">🛡️</div><div class="starry-confirm-copy"><div id="starryConfirmTitle" class="starry-confirm-title">請確認</div><div id="starryConfirmMessage" class="starry-confirm-message"></div></div><div class="starry-confirm-actions"><button id="starryConfirmCancel" type="button" class="starry-confirm-cancel">取消</button><button id="starryConfirmOk" type="button" class="starry-confirm-ok">確定</button></div></div>`;
    document.body.appendChild(layer); layer.addEventListener('click', event => { if (event.target === layer) resolveConfirm(false); });
    layer.querySelector('#starryConfirmCancel').addEventListener('click', () => resolveConfirm(false)); layer.querySelector('#starryConfirmOk').addEventListener('click', () => resolveConfirm(true)); return layer;
  }
  function resolveConfirm(value) { const layer = document.getElementById('starryConfirmLayer'); layer?.classList.remove('open'); const resolve = uiState.confirmResolve; uiState.confirmResolve = null; setTimeout(() => resolve?.(value), 120); }
  function confirmDialog({ title = '請確認', message = '', confirmText = '確定', cancelText = '取消' } = {}) {
    installStyles(); const layer = ensureConfirmLayer(); layer.querySelector('#starryConfirmTitle').textContent = title; layer.querySelector('#starryConfirmMessage').textContent = message; layer.querySelector('#starryConfirmOk').textContent = confirmText; layer.querySelector('#starryConfirmCancel').textContent = cancelText; layer.classList.add('open'); return new Promise(resolve => { uiState.confirmResolve = resolve; });
  }

  window.StarryUI = Object.freeze({ ensureChrome, renderIdentity, renderMirrorStatus, confirm: confirmDialog, closeMenu });
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', ensureChrome, { once: true }); else ensureChrome();
})();
