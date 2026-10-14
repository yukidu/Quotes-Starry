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
