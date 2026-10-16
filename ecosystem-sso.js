(() => {
  'use strict';

  if (window.StarryMirrorEcosystemAuth) return;

  const CENTRAL = 'https://id.starry.phd';
  const CLIENT_ID = '661055525630-ndcq5gtr16h7rqqprlqqkkvineea87lc.apps.googleusercontent.com';
  const APP_ID = 'starry-mirror';
  const MIN_SYNC_MS = 2500;
  let overlay = null;
  let syncing = false;
  let lastSyncAt = 0;
  let reloadPending = false;
  let lastIdentityId = '';

  const readIdentity = () => window.StarryPlatform?.auth?.getIdentity?.() || null;
  const identityId = identity => String(identity?.id || identity?.userId || '').trim();

  function reloadOnce() {
    if (reloadPending) return;
    reloadPending = true;
    window.location.reload();
  }

  async function json(response) {
    return response.json().catch(() => ({}));
  }

  function ensureStyle() {
    if (document.getElementById('starry-mirror-sso-style')) return;
    const style = document.createElement('style');
    style.id = 'starry-mirror-sso-style';
    style.textContent = `
      .mirror-sso-layer{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:18px;background:rgba(2,6,23,.68);backdrop-filter:blur(7px)}
      .mirror-sso-card{width:min(390px,100%);border:1px solid rgba(196,181,253,.38);border-radius:22px;padding:22px 18px 20px;background:#0f172a;color:#fff;text-align:center;box-shadow:0 26px 80px rgba(0,0,0,.5)}
      .mirror-sso-close{float:right;border:0;background:transparent;color:#fff;font-size:27px;line-height:1;cursor:pointer}
      .mirror-sso-title{margin:5px 0 8px;font:900 21px/1.3 system-ui,sans-serif}
      .mirror-sso-copy{margin:0;color:#cbd5e1;font:600 13px/1.65 system-ui,sans-serif}
      .mirror-sso-google{display:flex;justify-content:center;min-height:44px;margin-top:18px}
      .mirror-sso-status{min-height:18px;margin-top:12px;color:#ddd6fe;font:600 12px/1.5 system-ui,sans-serif}
    `;
    document.head.appendChild(style);
  }

  function closeLogin() {
    overlay?.remove();
    overlay = null;
  }

  function status(message) {
    const node = overlay?.querySelector('[data-mirror-sso-status]');
    if (node) node.textContent = message;
  }

  async function syncIdentity(force = false) {
    const now = Date.now();
    if (syncing || (!force && now - lastSyncAt < MIN_SYNC_MS)) return;
    syncing = true;
    lastSyncAt = now;
    const before = identityId(readIdentity());
    try {
      const next = await window.StarryPlatform?.auth?.refreshIdentity?.();
      const after = identityId(next);
      if (lastIdentityId && after !== lastIdentityId) reloadOnce();
      else if (before && after !== before) reloadOnce();
      lastIdentityId = after;
      patchMenu();
    } catch {
      // Network failures must not force a logout.
    } finally {
      syncing = false;
    }
  }

  async function completeGoogleLogin(credential) {
    if (!credential) return status('沒有取得 Google 登入資料，請再試一次。');
    status('正在登入繁星通行證…');
    try {
      const response = await fetch(`${CENTRAL}/api/google-sync`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        cache: 'no-store',
        headers: {'Content-Type': 'application/json', Accept: 'application/json'},
        body: JSON.stringify({credential, appId: APP_ID})
      });
      const data = await json(response);
      if (!response.ok || !data?.success) throw new Error(data?.error || '登入失敗');
      closeLogin();
      reloadOnce();
    } catch (error) {
      status(error?.message || '登入失敗，請再試一次。');
    }
  }

  function renderGoogleButton() {
    if (!overlay) return;
    if (!window.google?.accounts?.id) {
      window.setTimeout(renderGoogleButton, 80);
      return;
    }
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: response => void completeGoogleLogin(String(response?.credential || '')),
      ux_mode: 'popup',
      auto_select: false,
      itp_support: true
    });
    const slot = overlay.querySelector('[data-mirror-google]');
    if (slot && !slot.childElementCount) {
      window.google.accounts.id.renderButton(slot, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        locale: 'zh_TW',
        width: 300
      });
    }
    status('請選擇 Google 帳號');
  }

  function loadGoogle() {
    if (window.google?.accounts?.id || document.querySelector('script[data-mirror-google-gsi]')) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.mirrorGoogleGsi = '1';
    document.head.appendChild(script);
  }

  function showLogin({switchAccount = false} = {}) {
    if (overlay) return;
    ensureStyle();
    loadGoogle();
    try {
      if (switchAccount) window.google?.accounts?.id?.disableAutoSelect?.();
    } catch {}
    overlay = document.createElement('div');
    overlay.className = 'mirror-sso-layer';
    overlay.innerHTML = `
      <div class="mirror-sso-card" role="dialog" aria-modal="true" aria-label="登入繁星通行證">
        <button class="mirror-sso-close" type="button" data-mirror-sso-close aria-label="關閉">×</button>
        <div class="mirror-sso-title">${switchAccount ? '切換繁星通行證帳號' : '登入繁星通行證'}</div>
        <p class="mirror-sso-copy">選擇 Google 帳號，完成後會留在繁星心鏡。</p>
        <div class="mirror-sso-google" data-mirror-google></div>
        <div class="mirror-sso-status" data-mirror-sso-status>正在準備登入…</div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('[data-mirror-sso-close]')?.addEventListener('click', closeLogin);
    overlay.addEventListener('click', event => { if (event.target === overlay) closeLogin(); });
    renderGoogleButton();
  }

  async function logout() {
    try {
      await fetch(`${CENTRAL}/api/logout`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        cache: 'no-store',
        headers: {'Content-Type': 'application/json'},
        body: '{}'
      });
    } catch {}
    try { window.google?.accounts?.id?.disableAutoSelect?.(); } catch {}
    reloadOnce();
  }

  function patchMenu() {
    const identity = readIdentity();
    const authenticated = Boolean(identity?.authenticated);
    const identityRow = document.getElementById('starryMenuIdentity');
    const authRow = document.getElementById('starryMenuAuth');
    const menu = document.getElementById('starryMenu');

    if (identityRow) {
      const label = identityRow.querySelector('span:last-child');
      if (!authenticated && label) label.textContent = '繁星通行證會員';
      identityRow.title = '前往繁星通行證會員中心';
    }
    if (authRow) {
      const icon = authRow.querySelector('.icon');
      const label = authRow.querySelector('span:last-child');
      if (icon) icon.textContent = authenticated ? '🔄' : '🔐';
      if (label) label.textContent = authenticated ? '切換登入帳號' : '登入繁星通行證';
    }

    let logoutRow = document.getElementById('starryMenuLogout');
    if (!logoutRow && menu) {
      logoutRow = document.createElement('button');
      logoutRow.type = 'button';
      logoutRow.id = 'starryMenuLogout';
      logoutRow.className = 'starry-menu-row';
      logoutRow.innerHTML = '<span class="icon">↪</span><span>登出繁星通行證</span>';
      menu.appendChild(logoutRow);
    }
    if (logoutRow) logoutRow.hidden = !authenticated;
  }

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const loginButton = target.closest('#starryNavLogin,#starryMenuAuth');
    if (loginButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showLogin({switchAccount: Boolean(readIdentity()?.authenticated)});
      return;
    }
    const logoutButton = target.closest('#starryMenuLogout');
    if (logoutButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      void logout();
    }
  }, true);

  window.addEventListener('starry-mirror-identity', event => {
    lastIdentityId = identityId(event?.detail?.identity);
    patchMenu();
  });
  window.addEventListener('focus', () => void syncIdentity());
  window.addEventListener('online', () => void syncIdentity(true));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void syncIdentity();
  });

  const observer = new MutationObserver(patchMenu);
  if (document.documentElement) observer.observe(document.documentElement, {childList: true, subtree: true});

  loadGoogle();
  window.setTimeout(() => {
    lastIdentityId = identityId(readIdentity());
    patchMenu();
    void syncIdentity(true);
  }, 0);

  window.StarryMirrorEcosystemAuth = Object.freeze({
    login: () => showLogin(),
    switchAccount: () => showLogin({switchAccount: true}),
    logout,
    sync: () => syncIdentity(true)
  });
})();
