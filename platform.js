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

    if (typeof navigator.share === 'function') {
      const canShareFiles = typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] });
      if (canShareFiles) {
        try {
          await navigator.share({ files: [file], text, title });
          return { shared: true, downloaded: false };
        } catch (error) {
          // Keep the existing Web behavior: any share failure falls back to download.
        }
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

  window.StarryPlatform = Object.freeze({
    runtime,
    files: Object.freeze({ downloadBlob }),
    share: Object.freeze({ shareBlob }),
    motion: Object.freeze({ enable: enableMotion })
  });
})();
