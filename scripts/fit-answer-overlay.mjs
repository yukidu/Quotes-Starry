import fs from 'node:fs';
import path from 'node:path';

const filePath = path.join(process.cwd(), 'dist', 'index.html');
if (!fs.existsSync(filePath)) throw new Error('dist/index.html not found; run build-static first');

let html = fs.readFileSync(filePath, 'utf8');
if (!html.includes('id="answerOverlay"') || !html.includes('id="answerContent"')) {
  throw new Error('Answer overlay markup not found in production HTML');
}

const style = `
<style id="answer-overlay-responsive">
  :root{--starry-nav-height:72px}
  #answerOverlay{
    inset:auto 0 0 0!important;
    top:var(--starry-nav-height,72px)!important;
    height:calc(100dvh - var(--starry-nav-height,72px))!important;
    min-height:0!important;
    box-sizing:border-box!important;
    padding:12px!important;
    align-items:center!important;
    justify-content:center!important;
    overflow-y:auto!important;
    overscroll-behavior:contain;
  }
  #answerContent{
    width:min(92vw,400px)!important;
    max-height:calc(100dvh - var(--starry-nav-height,72px) - 24px)!important;
    min-height:0!important;
    box-sizing:border-box!important;
    padding:clamp(14px,3.2vh,32px)!important;
    border-width:clamp(4px,.9vh,8px)!important;
    border-radius:clamp(24px,5vh,50px)!important;
    overflow:hidden!important;
  }
  #answerContent>.relative.z-20{
    min-height:0!important;
    max-height:100%!important;
    overflow-y:auto!important;
    overflow-x:hidden!important;
    overscroll-behavior:contain;
    scrollbar-width:none;
    padding:2px 0;
  }
  #answerContent>.relative.z-20::-webkit-scrollbar{display:none}
  #answerOverlay .modal-close-btn{top:8px!important;right:8px!important}
  #answerCategoryTag{margin-bottom:clamp(6px,1.3vh,16px)!important;flex:0 0 auto}
  #duduPhotoContainer{margin-bottom:clamp(6px,1.6vh,15px)!important;flex:0 0 auto}
  #duduRandomPhoto{max-height:min(250px,28dvh)!important}
  #textFitContainer{min-height:0!important}
  #shareSingleCardBtn{
    margin-top:clamp(8px,1.8vh,16px)!important;
    padding:.75rem 1.5rem!important;
    transform:none!important;
    flex:0 0 auto;
  }
  @media(max-height:700px){
    #answerContent{width:min(94vw,390px)!important;padding:12px!important;border-radius:24px!important}
    #duduRandomPhoto{max-height:min(190px,22dvh)!important}
    #shareSingleCardBtn{padding:.6rem 1.25rem!important;font-size:.9rem!important}
  }
  @media(max-height:560px){
    #answerOverlay{padding:8px!important}
    #answerContent{max-height:calc(100dvh - var(--starry-nav-height,72px) - 16px)!important;padding:10px!important}
    #duduRandomPhoto{max-height:16dvh!important}
    #answerCategoryTag{margin-bottom:4px!important}
    #shareSingleCardBtn{margin-top:6px!important;padding:.5rem 1rem!important;font-size:.82rem!important}
  }
</style>`;

const runtime = `
<script id="answer-overlay-nav-sync">
(() => {
  'use strict';
  const sync = () => {
    const nav = document.querySelector('.sticky-nav');
    const height = nav ? Math.max(0, Math.ceil(nav.getBoundingClientRect().height)) : 72;
    document.documentElement.style.setProperty('--starry-nav-height', height + 'px');
  };
  const boot = () => {
    sync();
    requestAnimationFrame(sync);
    window.setTimeout(sync, 120);
    const nav = document.querySelector('.sticky-nav');
    if (nav && 'ResizeObserver' in window) new ResizeObserver(sync).observe(nav);
    window.addEventListener('resize', sync, { passive: true });
    window.visualViewport?.addEventListener('resize', sync, { passive: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
</script>`;

if (html.includes('id="answer-overlay-responsive"') || html.includes('id="answer-overlay-nav-sync"')) {
  throw new Error('Responsive answer overlay patch already present');
}

html = html.replace('</head>', `${style}\n</head>`);
html = html.replace('</body>', `${runtime}\n</body>`);

if (!html.includes('max-height:calc(100dvh - var(--starry-nav-height,72px) - 24px)') ||
    !html.includes("getBoundingClientRect().height")) {
  throw new Error('Responsive answer overlay patch failed validation');
}

fs.writeFileSync(filePath, html);
console.log('Responsive answer overlay patch applied.');
