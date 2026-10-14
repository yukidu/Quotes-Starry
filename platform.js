(() => {
  'use strict';

  const userAgent = navigator.userAgent || '';
  const runtime = Object.freeze({
    kind: 'web',
    isIOS: /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    isAndroid: /Android/i.test(userAgent),
    isStandalone: window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true
  });

  let motionHandler = null;
  let currentIdentity = null;

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function shareBlob({ blob, fileName, text, title = '' }) {
    const file = new File([blob], fileName, { type: blob.type || 'application/octet-stream' });
    if (typeof navigator.share === 'function') {
      const canShareFiles = typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] });
      if (canShareFiles) {
        try {
          await navigator.share({ files: [file], text, title });
          return { shared: true, downloaded: false };
        } catch (error) {}
      }
    }
    downloadBlob(blob, fileName);
    return { shared: false, downloaded: true };
  }

  async function enableMotion(handler) {
    if (motionHandler === handler) return true;
    if (motionHandler) window.removeEventListener('devicemotion', motionHandler, true);
    if (typeof DeviceMotionEvent === 'undefined') return false;
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceMotionEvent.requestPermission();
        if (permission !== 'granted') return false;
      } catch (error) {
        return false;
      }
    }
    motionHandler = handler;
    window.addEventListener('devicemotion', motionHandler, true);
    return true;
  }

  function getDisplayName(identity = currentIdentity) {
    if (!identity?.authenticated || !identity?.name) return '';
    const rank = String(identity.approvedRank || identity.rank || '').trim();
    return [String(identity.name).trim(), rank].filter(Boolean).join(' ');
  }

  function getIdentity() {
    return currentIdentity ? { ...currentIdentity } : null;
  }

  function renderIdentity(identity) {
    const nav = document.querySelector('.sticky-nav .max-w-6xl');
    const welcome = document.getElementById('welcomeMsg');
    const welcomeLine = document.getElementById('welcomeLine');
    const displayName = getDisplayName(identity);

    if (welcome && welcomeLine) {
      welcome.textContent = displayName ? `歡迎你，${displayName}` : '歡迎你';
      welcomeLine.style.display = 'flex';
    }

    if (!nav) return;
    let button = document.getElementById('starryIdentityBtn');
    if (!button) {
      button = document.createElement('button');
      button.id = 'starryIdentityBtn';
      button.type = 'button';
      button.className = 'w-full mb-2 bg-white border-2 border-black rounded-xl px-3 py-2 font-black text-xs shadow-[3px_3px_0px_#000] text-left';
      nav.insertBefore(button, nav.firstChild);
    }

    if (displayName) {
      button.textContent = `👤 ${displayName}`;
      button.onclick = () => { window.location.href = window.StarryConfig.starryIdOrigin + '/'; };
    } else {
      button.textContent = '🔐 使用 Google 登入 Starry ID';
      button.onclick = () => { window.location.href = window.StarryConfig.starryIdOrigin + '/auth/quotes'; };
    }
  }

  async function refreshIdentity() {
    const origin = window.StarryConfig.starryIdOrigin;
    currentIdentity = null;
    renderIdentity(null);

    try {
      const response = await fetch(origin + '/api/apps/quotes/identity', {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      });
      const identity = await response.json().catch(() => null);
      if (response.ok && identity?.authenticated && identity?.name) {
        currentIdentity = identity;
        renderIdentity(currentIdentity);
      } else {
        currentIdentity = null;
        renderIdentity(null);
      }

      const url = new URL(window.location.href);
      if (url.searchParams.get('starry') === 'login') {
        url.searchParams.delete('starry');
        history.replaceState(null, '', url.pathname + url.search + url.hash);
      }
      return getIdentity();
    } catch (error) {
      currentIdentity = null;
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
    files: Object.freeze({ downloadBlob }),
    share: Object.freeze({ shareBlob }),
    motion: Object.freeze({ enable: enableMotion }),
    auth: Object.freeze({ refreshIdentity, getIdentity, getDisplayName })
  });

  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', initIdentity, { once: true });
  else initIdentity();
})();
