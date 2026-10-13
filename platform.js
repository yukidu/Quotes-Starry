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
    const payload = { files: [file], text, title };

    if (typeof navigator.share === 'function') {
      const canShareFiles = typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] });
      if (canShareFiles) {
        try {
          await navigator.share(payload);
          return { shared: true, downloaded: false };
        } catch (error) {
          // Preserve current Web behavior: share failures fall back to a local download.
        }
      }
    }

    downloadBlob(blob, fileName);
    return { shared: false, downloaded: true };
  }

  async function shareUrl({ url, text, title = '' }) {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ url, text, title });
        return { shared: true, copied: false };
      } catch (error) {
        // Fall through to copy fallback.
      }
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return { shared: false, copied: true };
    }

    const input = document.createElement('textarea');
    input.value = url;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    input.remove();
    return { shared: false, copied: true };
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

  window.StarryPlatform = Object.freeze({
    runtime,
    files: Object.freeze({ downloadBlob }),
    share: Object.freeze({ shareBlob, shareUrl }),
    motion: Object.freeze({ enable: enableMotion })
  });
})();
