(() => {
  'use strict';

  const userAgent = navigator.userAgent || '';
  const runtime = Object.freeze({
    kind: 'web',
    isIOS: /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    isAndroid: /Android/i.test(userAgent),
    isStandalone: window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true
  });

  let currentIdentity = null;
  let currentToken = '';
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

  async function refreshIdentity() {
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
      renderIdentity(currentIdentity);
      window.dispatchEvent(new CustomEvent('starry-mirror-identity', { detail: { identity: getIdentity(), token: currentToken } }));
      return getIdentity();
    } catch {
      renderIdentity(null);
      return null;
    }
  }

  function initIdentity() {
    renderIdentity(null);
    void refreshIdentity();
  }

  window.StarryPlatform = Object.freeze({
    runtime,
    assets: Object.freeze({ loadScriptOnce }),
    files: Object.freeze({ downloadBlob }),
    share: Object.freeze({ shareBlob, shareUrl }),
    auth: Object.freeze({ refreshIdentity, getIdentity, getDisplayName, getToken })
  });

  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', initIdentity, { once: true });
  else initIdentity();
})();
