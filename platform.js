(() => {
  'use strict';

  const userAgent = navigator.userAgent || '';
  const GOOGLE_CLIENT_ID = '661055525630-ndcq5gtr16h7rqqprlqqkkvineea87lc.apps.googleusercontent.com';
  const GOOGLE_GSI = 'https://accounts.google.com/gsi/client';
  const SYNC_INTERVAL_MS = 3500;
  const runtime = Object.freeze({
    kind: 'web',
    isIOS: /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    isAndroid: /Android/i.test(userAgent),
    isStandalone: window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true
  });

  let currentIdentity = null;
  let currentToken = '';
  let identityReady = false;
  let lastSyncAt = 0;
  let overlay = null;
  const scriptLoads = new Map();

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function loadScriptOnce(src, globalName = '') {
    if (globalName && window[globalName]) return Promise.resolve(window[globalName]);
    if (scriptLoads.has(src)) return scriptLoads.get(src);
    const pending = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.dataset.starryRuntime = 'lazy';
      script.addEventListener('load', () => {
        const value = globalName ? window[globalName] : true;
        if (globalName && !value) reject(new Error(`Loaded script did not expose ${globalName}`));
        else resolve(value);
      }, { once: true });
      script.addEventListener('error', () => reject(new Error(`Unable to load ${src}`)), { once: true });
      document.head.appendChild(script);
    }).catch(error => {
      scriptLoads.delete(src);
      throw error;
    });
    scriptLoads.set(src, pending);
    return pending;
  }

  async function shareBlob({ blob, fileName, text, title = '' }) {
    const file = new File([blob], fileName, { type: blob.type || 'application/octet-stream' });
    if (typeof navigator.share === 'function') {
      const canShareFiles = typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] });
      if (canShareFiles) {
        try {
          await navigator.share({ files: [file], text, title });
          return { shared: true, downloaded: false, canceled: false };
        } catch (error) {
          if (error?.name === 'AbortError') return { shared: false, downloaded: false, canceled: true };
        }
      }
    }
    downloadBlob(blob, fileName);
    return { shared: false, downloaded: true, canceled: false };
  }

  async function shareUrl({ title = '', text = '', url = window.location.href } = {}) {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url });
        return { shared: true, copied: false, canceled: false };
      } catch (error) {
        if (error?.name === 'AbortError') return { shared: false, copied: false, canceled: true };
      }
    }
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        return { shared: false, copied: true, canceled: false };
      } catch {}
    }
    return { shared: false, copied: false, canceled: false };
  }

  function getDisplayName(identity = currentIdentity) {
    if (!identity?.authenticated || !identity?.name) return '';
    const rank = String(identity.approvedRank || identity.rank || '').trim();
    return [String(identity.name).trim(), rank].filter(Boolean).join(' ');
  }

  function getIdentity() {
    return currentIdentity ? { ...currentIdentity } : null;
  }

  function getToken() {
    return currentToken;
  }

  function identityKey(identity = currentIdentity) {
    if (!identity?.authenticated) return 'guest';
    return `user:${String(identity.userId || identity.id || identity.email || '')}`;
  }

  function renderIdentity(identity) {
    const welcome = document.getElementById('welcomeMsg');
    const welcomeLine = document.getElementById('welcomeLine');
    const displayName = getDisplayName(identity);
    if (welcome && welcomeLine) {
      welcome.textContent = displayName ? `歡迎你，${displayName}` : '歡迎你';
      welcomeLine.style.display = 'flex';
    }
    window.StarryUI?.renderIdentity?.(identity, displayName);
  }

  async function refreshIdentity({ reloadOnChange = false } = {}) {
    const before = identityKey();
    currentIdentity = null;
    currentToken = '';
    renderIdentity(null);
    try {
      const response = await fetch(window.StarryConfig.starryIdOrigin + '/api/apps/starry-mirror/session', {
        method: 'GET', mode: 'cors', credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json' }
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.authenticated && data?.token && data?.identity?.name) {
        currentToken = String(data.token);
        currentIdentity = { ...data.identity, authenticated: true };
      }
    } catch {}
    renderIdentity(currentIdentity);
    window.dispatchEvent(new CustomEvent('starry-mirror-identity', { detail: { identity: getIdentity(), token: currentToken } }));
    const after = identityKey();
    if (identityReady && reloadOnChange && before !== after) {
      window.location.reload();
      return getIdentity();
    }
    identityReady = true;
    return getIdentity();
  }

  function closeOverlay() {
    overlay?.remove();
    overlay = null;
  }

  function overlayStyle() {
    if (document.getElementById('starryMirrorAuthStyle')) return;
    const style = document.createElement('style');
    style.id = 'starryMirrorAuthStyle';
    style.textContent = '.starry-mirror-auth{position:fixed;inset:0;z-index:30000;display:grid;place-items:center;padding:18px;background:#020617b8;backdrop-filter:blur(7px)}.starry-mirror-auth-card{width:min(390px,100%);border:2px solid #111827;border-radius:22px;background:#fff;color:#111827;box-shadow:8px 8px 0 #111827;padding:20px;text-align:center}.starry-mirror-auth-close{float:right;border:0;background:transparent;font-size:25px;font-weight:900;cursor:pointer}.starry-mirror-auth h2{margin:7px 0 6px;font-size:21px}.starry-mirror-auth p{margin:0;color:#64748b;font-size:13px;line-height:1.6}.starry-mirror-google{display:flex;justify-content:center;min-height:44px;margin:17px 0 8px}.starry-mirror-auth-status{min-height:18px;margin:7px 0;color:#475569;font-size:12px}.starry-mirror-auth-actions{display:grid;gap:9px;margin-top:15px}.starry-mirror-auth-actions button,.starry-mirror-auth-actions a{min-height:44px;display:flex;align-items:center;justify-content:center;border:2px solid #111827;border-radius:12px;background:#fff;color:#111827;font-weight:900;text-decoration:none;cursor:pointer}.starry-mirror-auth-actions .danger{background:#fee2e2}';
    document.head.appendChild(style);
  }

  function setAuthStatus(message) {
    const node = overlay?.querySelector('[data-auth-status]');
    if (node) node.textContent = message;
  }

  async function finishGoogleLogin(credential) {
    if (!credential) return setAuthStatus('沒有取得 Google 登入資料，請再試一次。');
    setAuthStatus('正在登入繁星通行證…');
    try {
      const response = await fetch(window.StarryConfig.starryIdOrigin + '/api/google-sync', {
        method: 'POST', mode: 'cors', credentials: 'include', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ credential, appId: 'starry-mirror' })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.success === false) throw new Error(data?.error || '登入失敗');
      closeOverlay();
      await refreshIdentity();
      window.location.reload();
    } catch (error) {
      setAuthStatus(error?.message || '登入失敗，請再試一次。');
    }
  }

  async function renderGoogleButton() {
    setAuthStatus('正在準備 Google 登入…');
    try {
      await loadScriptOnce(GOOGLE_GSI, 'google');
      if (!overlay || !window.google?.accounts?.id) throw new Error('Google 登入暫時無法使用');
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: result => void finishGoogleLogin(String(result?.credential || '').trim()),
        ux_mode: 'popup', auto_select: false, itp_support: true
      });
      const slot = overlay.querySelector('[data-google-slot]');
      if (slot) {
        slot.replaceChildren();
        window.google.accounts.id.renderButton(slot, {
          theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', locale: 'zh_TW', width: 300
        });
      }
      setAuthStatus('請選擇 Google 帳號');
    } catch (error) {
      setAuthStatus(error?.message || 'Google 登入暫時無法使用');
    }
  }

  function showLogin() {
    closeOverlay();
    overlayStyle();
    overlay = document.createElement('div');
    overlay.className = 'starry-mirror-auth';
    overlay.innerHTML = '<div class="starry-mirror-auth-card" role="dialog" aria-modal="true" aria-label="登入繁星通行證"><button class="starry-mirror-auth-close" type="button" data-auth-close aria-label="關閉">×</button><h2>登入繁星通行證</h2><p>直接在繁星心鏡選擇 Google 帳號，完成後會留在這裡。</p><div class="starry-mirror-google" data-google-slot></div><div class="starry-mirror-auth-status" data-auth-status></div></div>';
    document.body.appendChild(overlay);
    overlay.querySelector('[data-auth-close]')?.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', event => { if (event.target === overlay) closeOverlay(); });
    void renderGoogleButton();
  }

  async function logoutAll() {
    try {
      await fetch(window.StarryConfig.starryIdOrigin + '/api/logout', {
        method: 'POST', mode: 'cors', credentials: 'include', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: '{}'
      });
    } catch {}
    currentIdentity = null;
    currentToken = '';
    try { window.google?.accounts?.id?.disableAutoSelect?.(); } catch {}
    closeOverlay();
    window.location.reload();
  }

  function showAccountActions() {
    closeOverlay();
    overlayStyle();
    const name = getDisplayName() || '繁星會員';
    overlay = document.createElement('div');
    overlay.className = 'starry-mirror-auth';
    overlay.innerHTML = `<div class="starry-mirror-auth-card" role="dialog" aria-modal="true" aria-label="繁星帳號"><button class="starry-mirror-auth-close" type="button" data-auth-close aria-label="關閉">×</button><h2>${name.replace(/[&<>"']/g, '')}</h2><p>此帳號與其他繁星 App 共用登入狀態。</p><div class="starry-mirror-auth-actions"><button type="button" data-switch-account>切換 Google 帳號</button><a href="${window.StarryConfig.starryIdOrigin}/member-center">會員中心</a><button class="danger" type="button" data-logout-all>登出全部繁星 App</button></div></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('[data-auth-close]')?.addEventListener('click', closeOverlay);
    overlay.querySelector('[data-switch-account]')?.addEventListener('click', () => {
      try { window.google?.accounts?.id?.disableAutoSelect?.(); } catch {}
      showLogin();
    });
    overlay.querySelector('[data-logout-all]')?.addEventListener('click', () => void logoutAll());
    overlay.addEventListener('click', event => { if (event.target === overlay) closeOverlay(); });
  }

  function interceptAccountClicks() {
    document.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const login = target.closest('#starryNavLogin');
      const member = target.closest('#starryNavMember');
      const menuAuth = target.closest('#starryMenuAuth');
      if (!login && !member && !menuAuth) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (currentIdentity?.authenticated) showAccountActions();
      else showLogin();
    }, true);
  }

  async function backgroundSync(force = false) {
    const now = Date.now();
    if (!force && now - lastSyncAt < SYNC_INTERVAL_MS) return;
    lastSyncAt = now;
    await refreshIdentity({ reloadOnChange: true });
  }

  function initIdentity() {
    renderIdentity(null);
    interceptAccountClicks();
    void refreshIdentity();
    window.addEventListener('focus', () => void backgroundSync());
    window.addEventListener('online', () => void backgroundSync(true));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void backgroundSync();
    });
  }

  window.StarryPlatform = Object.freeze({
    runtime,
    assets: Object.freeze({ loadScriptOnce }),
    files: Object.freeze({ downloadBlob }),
    share: Object.freeze({ shareBlob, shareUrl }),
    auth: Object.freeze({ refreshIdentity, getIdentity, getDisplayName, getToken, login: showLogin, switchAccount: showLogin, logoutAll })
  });

  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', initIdentity, { once: true });
  else initIdentity();
})();
