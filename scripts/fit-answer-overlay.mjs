import fs from 'node:fs';
import path from 'node:path';

const filePath = path.join(process.cwd(), 'dist', 'index.html');
if (!fs.existsSync(filePath)) throw new Error('dist/index.html not found; run build-static first');

let html = fs.readFileSync(filePath, 'utf8');
const requiredModalIds = ['answerOverlay', 'answerContent', 'recordModal', 'installModal', 'shakeTutorialModal', 'photoZoomOverlay'];
for (const id of requiredModalIds) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Modal markup not found in production HTML: ${id}`);
}

const style = `
<style id="starry-modal-responsive">
  :root{--starry-nav-height:72px}
  #answerOverlay,
  #recordModal,
  #installModal,
  #shakeTutorialModal,
  #photoZoomOverlay,
  #starryConfirmLayer{
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
  #answerContent,
  #recordModal>div:first-child,
  #installModal>div:first-child,
  #shakeTutorialModal>div:first-child,
  #starryConfirmLayer .starry-confirm-card{
    max-height:calc(100dvh - var(--starry-nav-height,72px) - 24px)!important;
    min-height:0!important;
    box-sizing:border-box!important;
  }
  #answerContent{
    width:min(92vw,400px)!important;
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
  #recordModal>div:first-child,
  #installModal>div:first-child{
    width:min(92vw,500px)!important;
    overflow:hidden!important;
  }
  #recordModal>div:first-child>div:last-child,
  #installModal>div:first-child>div:last-child{
    min-height:0!important;
  }
  #shakeTutorialModal>div:first-child{
    width:min(92vw,430px)!important;
    padding:clamp(18px,4vh,40px)!important;
    gap:clamp(12px,3vh,32px)!important;
    overflow-y:auto!important;
    overscroll-behavior:contain;
  }
  #photoZoomOverlay img{
    max-width:calc(100vw - 24px)!important;
    max-height:calc(100dvh - var(--starry-nav-height,72px) - 24px)!important;
  }
  #starryConfirmLayer{
    padding-top:12px!important;
  }
  #starryConfirmLayer .starry-confirm-card{
    overflow-y:auto!important;
  }
  #answerOverlay .modal-close-btn,
  #recordModal .modal-close-btn,
  #installModal .modal-close-btn,
  #shakeTutorialModal .modal-close-btn{
    top:8px!important;
    right:8px!important;
  }
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
    #recordModal>div:first-child,#installModal>div:first-child{border-width:5px!important;border-radius:30px!important}
    #recordModal>div:first-child>div:last-child,#installModal>div:first-child>div:last-child{border-radius:24px!important}
    #shakeTutorialModal>div:first-child{padding:16px!important;gap:12px!important;border-width:5px!important;border-radius:28px!important}
    #shakeTutorialModal .text-8xl{font-size:3.75rem!important}
    #shakeTutorialModal .text-4xl{font-size:1.75rem!important;margin-bottom:8px!important}
    #shakeTutorialModal .text-xl{font-size:1rem!important}
    #duduRandomPhoto{max-height:min(190px,22dvh)!important}
    #shareSingleCardBtn{padding:.6rem 1.25rem!important;font-size:.9rem!important}
  }
  @media(max-height:560px){
    #answerOverlay,#recordModal,#installModal,#shakeTutorialModal,#photoZoomOverlay,#starryConfirmLayer{padding:8px!important}
    #answerContent,#recordModal>div:first-child,#installModal>div:first-child,#shakeTutorialModal>div:first-child,#starryConfirmLayer .starry-confirm-card{
      max-height:calc(100dvh - var(--starry-nav-height,72px) - 16px)!important;
    }
    #answerContent{padding:10px!important}
    #duduRandomPhoto{max-height:16dvh!important}
    #answerCategoryTag{margin-bottom:4px!important}
    #shareSingleCardBtn{margin-top:6px!important;padding:.5rem 1rem!important;font-size:.82rem!important}
    #recordModal>div:first-child>div:last-child>div:first-child{padding:10px!important;padding-top:34px!important}
    #installModal>div:first-child>div:first-child+div{padding:12px!important}
    #shakeTutorialModal>div:first-child{padding:12px!important;gap:8px!important}
  }
</style>`;

const runtime = `
<script id="starry-modal-nav-sync">
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
    window.visualViewport?.addEventListener('scroll', sync, { passive: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
</script>`;

if (html.includes('id="starry-modal-responsive"') || html.includes('id="starry-modal-nav-sync"')) {
  throw new Error('Responsive Starry modal patch already present');
}

html = html.replace('</head>', `${style}\n</head>`);
html = html.replace('</body>', `${runtime}\n</body>`);

for (const selector of ['#answerOverlay', '#recordModal', '#installModal', '#shakeTutorialModal', '#photoZoomOverlay', '#starryConfirmLayer']) {
  if (!html.includes(selector)) throw new Error(`Responsive modal selector missing: ${selector}`);
}
if (!html.includes('max-height:calc(100dvh - var(--starry-nav-height,72px) - 24px)') ||
    !html.includes('getBoundingClientRect().height')) {
  throw new Error('Responsive Starry modal patch failed validation');
}

fs.writeFileSync(filePath, html);
console.log('Responsive Starry modal patch applied to all popup windows.');
