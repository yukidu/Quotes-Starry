import fs from 'node:fs';
import path from 'node:path';

const filePath = path.join(process.cwd(), 'dist', 'index.html');
if (!fs.existsSync(filePath)) throw new Error('dist/index.html not found; run build first');
let html = fs.readFileSync(filePath, 'utf8');
for (const id of ['answerOverlay','answerContent','recordModal','installModal','photoZoomOverlay']) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Modal markup not found: ${id}`);
}

const style = `
<style id="starry-modal-responsive">
:root{--starry-nav-height:72px}
#answerOverlay,#recordModal,#installModal,#photoZoomOverlay,#starryConfirmLayer{inset:auto 0 0 0!important;top:var(--starry-nav-height,72px)!important;height:calc(100dvh - var(--starry-nav-height,72px))!important;min-height:0!important;box-sizing:border-box!important;padding:12px!important;align-items:center!important;justify-content:center!important;overflow-y:auto!important;overscroll-behavior:contain}
#answerContent,#recordModal>div:first-child,#installModal>div:first-child,#starryConfirmLayer .starry-confirm-card{max-height:calc(100dvh - var(--starry-nav-height,72px) - 24px)!important;min-height:0!important;box-sizing:border-box!important}
#answerContent{width:min(92vw,400px)!important;padding:clamp(14px,3.2vh,32px)!important;border-width:clamp(4px,.9vh,8px)!important;border-radius:clamp(24px,5vh,50px)!important;overflow:hidden!important}
#answerContent>.relative.z-20{min-height:0!important;max-height:100%!important;overflow-y:auto!important;overflow-x:hidden!important;scrollbar-width:none;padding:2px 0}#answerContent>.relative.z-20::-webkit-scrollbar{display:none}
#recordModal{padding:clamp(10px,2.2vw,16px)!important;overflow:hidden!important}#recordModal>div:first-child{width:min(90vw,480px)!important;height:min(100%,760px)!important;border-width:6px!important;border-radius:34px!important;box-shadow:8px 8px 0 #fff!important;overflow:hidden!important}#recordModal>div:first-child>div:last-child{min-height:0!important;flex:1 1 auto!important;border-radius:28px!important;overflow:hidden!important}#recordModal>div:first-child>div:last-child>div:first-child{flex:0 0 auto!important;min-height:76px!important;padding:12px 66px 12px 16px!important;display:flex!important;align-items:center!important;justify-content:center!important}#recordModal>div:first-child>div:last-child>div:first-child button{min-height:48px!important;padding:0 30px!important;border-radius:14px!important;font-size:1rem!important;line-height:1!important}#recordModal>div:first-child>div:last-child>div:nth-child(2){flex:0 0 auto!important;min-height:56px!important;padding:10px 12px!important;gap:8px!important;align-items:center!important;overflow-x:auto!important;overflow-y:hidden!important}#recordModal .tab-btn{flex:0 0 auto!important;height:36px!important;padding:0 14px!important;font-size:.8rem!important;line-height:1!important;justify-content:center!important}#recordModal #favoriteList{flex:1 1 auto!important;min-height:0!important;padding:12px!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain}#recordModal .modal-close-btn{width:46px!important;height:46px!important;top:10px!important;right:10px!important;border-width:3px!important}
#installModal>div:first-child{width:min(92vw,500px)!important;overflow:hidden!important}#photoZoomOverlay img{max-width:calc(100vw - 24px)!important;max-height:calc(100dvh - var(--starry-nav-height,72px) - 24px)!important}#starryConfirmLayer{padding-top:12px!important}#starryConfirmLayer .starry-confirm-card{overflow-y:auto!important}#answerOverlay .modal-close-btn,#installModal .modal-close-btn{top:8px!important;right:8px!important}
@media(max-width:420px){#recordModal{padding:10px!important}#recordModal>div:first-child{width:calc(100vw - 20px)!important;border-radius:28px!important;border-width:5px!important;box-shadow:6px 6px 0 #fff!important}#recordModal>div:first-child>div:last-child>div:first-child{min-height:68px!important;padding:10px 58px 10px 12px!important}#recordModal>div:first-child>div:last-child>div:nth-child(2){min-height:52px!important;padding:8px 10px!important;gap:7px!important}#recordModal .tab-btn{height:34px!important;padding:0 12px!important;font-size:.75rem!important}#recordModal #favoriteList{padding:10px!important}}
@media(max-height:560px){#answerOverlay,#recordModal,#installModal,#photoZoomOverlay,#starryConfirmLayer{padding:8px!important}#answerContent,#recordModal>div:first-child,#installModal>div:first-child,#starryConfirmLayer .starry-confirm-card{max-height:calc(100dvh - var(--starry-nav-height,72px) - 16px)!important}}
</style>`;

const runtime = `
<script id="starry-modal-nav-sync">
(()=>{const sync=()=>{const nav=document.querySelector('.sticky-nav');const height=nav?Math.max(0,Math.ceil(nav.getBoundingClientRect().height)):72;document.documentElement.style.setProperty('--starry-nav-height',height+'px')};const boot=()=>{sync();requestAnimationFrame(sync);setTimeout(sync,120);const nav=document.querySelector('.sticky-nav');if(nav&&'ResizeObserver'in window)new ResizeObserver(sync).observe(nav);addEventListener('resize',sync,{passive:true});visualViewport?.addEventListener('resize',sync,{passive:true});visualViewport?.addEventListener('scroll',sync,{passive:true})};document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot()})();
</script>`;

if (html.includes('id="starry-modal-responsive"') || html.includes('id="starry-modal-nav-sync"')) throw new Error('Responsive patch already present');
html = html.replace('</head>', `${style}\n</head>`).replace('</body>', `${runtime}\n</body>`);
if (html.includes('shakeTutorialModal') || html.includes('animate-shake')) throw new Error('Shake UI unexpectedly present after cleanup');
if (!html.includes('recordModal') || !html.includes('getBoundingClientRect().height')) throw new Error('Responsive patch validation failed');
fs.writeFileSync(filePath, html);
console.log('Starry Mirror responsive modal patch applied.');
