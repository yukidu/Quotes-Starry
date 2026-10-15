import fs from 'node:fs';
import path from 'node:path';

const filePath = path.join(process.cwd(), 'dist', 'index.html');
if (!fs.existsSync(filePath)) throw new Error('dist/index.html not found; run build-static first');

let html = fs.readFileSync(filePath, 'utf8');

function replaceOnce(input, from, to, label) {
  const first = input.indexOf(from);
  if (first === -1) throw new Error(`Runtime optimization target not found: ${label}`);
  if (input.indexOf(from, first + from.length) !== -1) throw new Error(`Runtime optimization target is not unique: ${label}`);
  return input.slice(0, first) + to + input.slice(first + from.length);
}

html = replaceOnce(
  html,
  '    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>\n',
  '',
  'remove eager html2canvas'
);

html = replaceOnce(
  html,
  '    <div id="toast" class="fixed top-10 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 font-black rounded-full shadow-2xl z-[3000] opacity-0 pointer-events-none transition-all"></div>',
  '    <div id="toast" role="status" aria-live="polite" aria-atomic="true" class="fixed top-10 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 font-black rounded-full shadow-2xl z-[3000] opacity-0 pointer-events-none transition-all"></div>',
  'accessible toast'
);

html = replaceOnce(
  html,
  '        body.theme-love { --card-radius: 50% 50% 50% 50% / 40% 40% 60% 60%; --card-border: 69px solid #FF69B4; }',
  '        body.theme-love { --card-radius: 28px; --card-border: 4px solid #FF4F9A; --card-shadow: 6px 6px 0px #000; }\n        body.theme-love .card-front { background: linear-gradient(145deg, #FF9DCE 0%, #FF69B4 55%, #FF4F9A 100%); color: #000; }\n        body.theme-love .card-emoji-bg { opacity: 0.28; }',
  'stable pink-heart theme'
);

html = replaceOnce(
  html,
  `        window.initInteraction = async () => {\n            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();\n            if (audioCtx.state === 'suspended') audioCtx.resume();\n            await window.StarryPlatform.motion.enable(handleShake);\n        };`,
  `        let interactionInitialized = false;\n        window.initInteraction = async () => {\n            if (interactionInitialized) return;\n            interactionInitialized = true;\n            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();\n            if (audioCtx.state === 'suspended') await audioCtx.resume().catch(() => {});\n            await window.StarryPlatform.motion.enable(handleShake);\n        };`,
  'one-time interaction initialization'
);

const helpers = `        function safeJsonParse(value, fallback) {\n            if (!value) return fallback;\n            try { return JSON.parse(value); } catch (error) { return fallback; }\n        }\n\n        function shuffleInPlace(items) {\n            for (let i = items.length - 1; i > 0; i--) {\n                const j = Math.floor(Math.random() * (i + 1));\n                [items[i], items[j]] = [items[j], items[i]];\n            }\n            return items;\n        }\n\n        function escapeHtml(value) {\n            return String(value ?? '').replace(/[&<>\"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[ch]));\n        }\n\n        function fitElementFontSize(element, minSize, maxSize, fits) {\n            let low = minSize, high = maxSize, best = minSize;\n            while (low <= high) {\n                const size = Math.floor((low + high) / 2);\n                element.style.fontSize = size + 'px';\n                if (fits()) { best = size; low = size + 1; }\n                else high = size - 1;\n            }\n            element.style.fontSize = best + 'px';\n        }\n\n        function ensureHtml2Canvas() {\n            return window.StarryPlatform.assets.loadScriptOnce(window.StarryConfig.html2CanvasUrl, 'html2canvas');\n        }\n\n`;

html = replaceOnce(
  html,
  '        window.initApp = async () => {',
  `${helpers}        window.initApp = async () => {`,
  'runtime helpers'
);

html = replaceOnce(
  html,
  `                const prog = localStorage.getItem(STORAGE_KEYS.PROGRESS);\n                if (prog) { const d = JSON.parse(prog); Object.keys(d).forEach(c => categoryProgress[c] = new Set(d[c])); }\n                cardMetadata = JSON.parse(localStorage.getItem(STORAGE_KEYS.METADATA) || '{}');`,
  `                const progressData = safeJsonParse(localStorage.getItem(STORAGE_KEYS.PROGRESS), {});\n                Object.keys(progressData).forEach(c => {\n                    const entries = Array.isArray(progressData[c]) ? progressData[c] : [];\n                    categoryProgress[c] = new Set(entries.filter(Number.isInteger));\n                });\n                const storedMetadata = safeJsonParse(localStorage.getItem(STORAGE_KEYS.METADATA), {});\n                cardMetadata = storedMetadata && typeof storedMetadata === 'object' && !Array.isArray(storedMetadata) ? storedMetadata : {};`,
  'safe local storage parsing'
);

html = replaceOnce(
  html,
  `                const res = await fetch(GOOGLE_SHEET_CSV_URL); const csv = await res.text(); const rows = parseCSV(csv), newData = {}, photoData = [];`,
  `                const controller = new AbortController();\n                const timeoutId = window.setTimeout(() => controller.abort(), 10000);\n                let res;\n                try {\n                    res = await fetch(GOOGLE_SHEET_CSV_URL, { signal: controller.signal, cache: 'no-store' });\n                } finally {\n                    window.clearTimeout(timeoutId);\n                }\n                if (!res.ok) throw new Error('Google Sheet HTTP ' + res.status);\n                const csv = await res.text(); const rows = parseCSV(csv), newData = {}, photoData = [];`,
  'Google Sheet timeout and HTTP validation'
);

html = replaceOnce(
  html,
  `            } catch (e) { showToast("連線異常"); }`,
  `            } catch (e) { showToast(e?.name === 'AbortError' ? "資料讀取逾時，請重新整理" : "資料連線異常，請稍後重試"); }`,
  'Google Sheet user-facing error'
);

html = replaceOnce(
  html,
  `                    let shuffled = [...CATEGORY_EMOJI_POOL].sort(() => Math.random() - 0.5);`,
  `                    let shuffled = shuffleInPlace([...CATEGORY_EMOJI_POOL]);`,
  'category shuffle'
);

html = replaceOnce(
  html,
  `if (currentCategory === 'all') { Object.keys(gameData).forEach(cat => { gameData[cat].forEach((txt, idx) => items.push({ cat, idx, text: txt, isDudu: false })); }); items.sort(() => Math.random() - 0.5); }`,
  `if (currentCategory === 'all') { Object.keys(gameData).forEach(cat => { gameData[cat].forEach((txt, idx) => items.push({ cat, idx, text: txt, isDudu: false })); }); shuffleInPlace(items); }`,
  'card shuffle'
);

html = replaceOnce(
  html,
  `            items.forEach((item, i) => {`,
  `            const fragment = document.createDocumentFragment();\n            items.forEach((item, i) => {`,
  'card document fragment start'
);

html = replaceOnce(
  html,
  `                c.onclick = () => handleCardClick(item, i); grid.appendChild(c);`,
  `                c.onclick = () => handleCardClick(item, i); fragment.appendChild(c);`,
  'card document fragment append'
);

html = replaceOnce(
  html,
  `            });\n        }\n\n        function handleCardClick`,
  `            });\n            grid.appendChild(fragment);\n        }\n\n        function handleCardClick`,
  'card document fragment flush'
);

html = replaceOnce(
  html,
  `                    const lines = item.text.split('\\n'); dt.innerHTML = lines.map(l => \`<div class="dudu-line aesthetic-text">${'${'}l}</div>\`).join('');`,
  `                    const lines = item.text.split('\\n');\n                    dt.replaceChildren(...lines.map(line => {\n                        const el = document.createElement('div');\n                        el.className = 'dudu-line aesthetic-text';\n                        el.textContent = line;\n                        return el;\n                    }));`,
  'safe dudu text rendering'
);

html = replaceOnce(
  html,
  `        function adjustDuduTextSize() {\n            const lines = document.querySelectorAll('.dudu-line'), containerWidth = document.getElementById('duduTextLines').clientWidth;\n            lines.forEach(el => { let size = 32; el.style.fontSize = size + 'px'; while (el.scrollWidth > containerWidth && size > 10) { size -= 1; el.style.fontSize = size + 'px'; } });\n        }`,
  `        function adjustDuduTextSize() {\n            const lines = document.querySelectorAll('.dudu-line'), containerWidth = document.getElementById('duduTextLines').clientWidth;\n            lines.forEach(el => fitElementFontSize(el, 10, 32, () => el.scrollWidth <= containerWidth));\n        }`,
  'faster dudu text fitting'
);

html = replaceOnce(
  html,
  `        function fitTextToContainer() {\n            const t = document.getElementById('overlayText'), c = document.getElementById('textFitContainer'); \n            if (!t || !c || t.classList.contains('hidden')) return;\n            let s = 45; t.style.fontSize = s + 'px'; \n            const maxH = c.clientHeight, maxW = c.clientWidth;\n            while ((t.scrollHeight > maxH || t.scrollWidth > maxW) && s > 8) { \n                s -= 1; t.style.fontSize = s + 'px'; \n            }\n        }`,
  `        function fitTextToContainer() {\n            const t = document.getElementById('overlayText'), c = document.getElementById('textFitContainer');\n            if (!t || !c || t.classList.contains('hidden')) return;\n            const maxH = c.clientHeight, maxW = c.clientWidth;\n            fitElementFontSize(t, 8, 45, () => t.scrollHeight <= maxH && t.scrollWidth <= maxW);\n        }`,
  'faster quote text fitting'
);

html = replaceOnce(
  html,
  `            temp.style.visibility = 'visible'; temp.style.left = '0'; \n            await new Promise(r => setTimeout(r, 800));\n            const canvas = await html2canvas(temp, { scale: 2, useCORS: true, backgroundColor: "#ffffff" }); \n            temp.style.visibility = 'hidden'; temp.style.left = '-5000px';\n            const blob = await new Promise(r => canvas.toBlob(r));`,
  `            temp.style.visibility = 'visible'; temp.style.left = '0';\n            let canvas;\n            try {\n                await new Promise(r => setTimeout(r, 300));\n                const html2canvas = await ensureHtml2Canvas();\n                canvas = await html2canvas(temp, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });\n            } catch (error) {\n                showToast("圖片產生失敗，請稍後再試");\n                return;\n            } finally {\n                temp.style.visibility = 'hidden'; temp.style.left = '-5000px';\n            }\n            const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));\n            if (!blob) { showToast("圖片產生失敗，請稍後再試"); return; }`,
  'lazy and resilient single-card export'
);

const shareFunctions = `        window.shareApp = async () => {\n            const result = await window.StarryPlatform.share.shareUrl({\n                title: window.StarryConfig.shareTitle,\n                text: '一起來抽一句今天需要的話 ✨',\n                url: window.StarryConfig.productionUrl\n            });\n            if (result.copied) showToast("網址已複製，可以貼給朋友 ✨");\n            else if (!result.shared && !result.canceled) showToast("請使用瀏覽器的分享功能");\n        };\n\n        window.shareRecordAsImage = async () => {\n            const modal = document.getElementById('recordModal');\n            const panel = modal?.firstElementChild;\n            if (!panel) return;\n            showToast("正在整理紀錄圖片...");\n            let clone = null;\n            try {\n                const html2canvas = await ensureHtml2Canvas();\n                clone = panel.cloneNode(true);\n                clone.querySelector('.modal-close-btn')?.remove();\n                const exportButton = [...clone.querySelectorAll('button')].find(button => button.textContent.includes('匯出圖片'));\n                exportButton?.parentElement?.remove();\n                Object.assign(clone.style, {\n                    position: 'fixed', left: '-10000px', top: '0', width: '500px', maxWidth: '500px',\n                    maxHeight: 'none', height: 'auto', overflow: 'visible', background: '#fff', color: '#111827'\n                });\n                const inner = clone.lastElementChild;\n                if (inner) { inner.style.height = 'auto'; inner.style.overflow = 'visible'; }\n                const list = clone.querySelector('#favoriteList');\n                if (list) { list.style.height = 'auto'; list.style.maxHeight = 'none'; list.style.overflow = 'visible'; }\n                document.body.appendChild(clone);\n                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));\n                const scale = clone.scrollHeight > 3200 ? 1.25 : 2;\n                const canvas = await html2canvas(clone, { scale, useCORS: true, backgroundColor: '#ffffff' });\n                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));\n                if (!blob) throw new Error('record export blob failed');\n                const result = await window.StarryPlatform.share.shareBlob({\n                    blob, fileName: 'Quotes-Starry-Records.png', text: '我的繁星語錄抽卡紀錄', title: window.StarryConfig.shareTitle\n                });\n                if (result.downloaded) showToast("紀錄圖片已下載到裝置 📥");\n            } catch (error) {\n                showToast("紀錄圖片產生失敗，請稍後再試");\n            } finally {\n                clone?.remove();\n            }\n        };\n\n`;

html = replaceOnce(
  html,
  `        window.closeShakeTutorial = () => document.getElementById('shakeTutorialModal').classList.add('hidden');`,
  `${shareFunctions}        window.closeShakeTutorial = () => document.getElementById('shakeTutorialModal').classList.add('hidden');`,
  'working share actions'
);

html = replaceOnce(
  html,
  `            localStorage.clear(); sessionStorage.clear();`,
  `            [STORAGE_KEYS.PROGRESS, STORAGE_KEYS.METADATA, STORAGE_KEYS.DUDU_INDEX_QUEUE].forEach(key => localStorage.removeItem(key));\n            sessionStorage.removeItem(STORAGE_KEYS.SESSION_FLIP_COUNT);`,
  'scoped reset storage'
);

html = replaceOnce(
  html,
  `                d.innerHTML = \`<div class="flex justify-between items-center mb-2"><span class="text-[10px] font-black uppercase bg-white border border-black px-2 py-0.5 rounded-full">${'${'}i.category}</span><div class="text-xs">❤️ ${'${'}i.rating || 0}</div></div><p class="font-black text-black leading-tight text-center">${'${'}i.text}</p>\`; list.appendChild(d);`,
  `                const safeRating = Math.max(0, Math.min(3, Number(i.rating) || 0));\n                d.innerHTML = \`<div class="flex justify-between items-center mb-2"><span class="text-[10px] font-black uppercase bg-white border border-black px-2 py-0.5 rounded-full">${'${'}escapeHtml(i.category || '未分類')}</span><div class="text-xs">❤️ ${'${'}safeRating}</div></div><p class="font-black text-black leading-tight text-center">${'${'}escapeHtml(i.text)}</p>\`; list.appendChild(d);`,
  'safe record rendering'
);

html = replaceOnce(
  html,
  `function showToast(m, h=false) { const t=document.getElementById('toast'); t.innerHTML=m;`,
  `function showToast(m, h=false) { const t=document.getElementById('toast'); t.textContent=m;`,
  'safe toast rendering'
);

const requiredMarkers = [
  'safeJsonParse', 'shuffleInPlace', 'fitElementFontSize', 'ensureHtml2Canvas',
  'window.shareApp = async', 'window.shareRecordAsImage = async', 'AbortController',
  'document.createDocumentFragment', "localStorage.removeItem(key)", 'aria-live="polite"',
  'body.theme-love { --card-radius: 28px; --card-border: 4px solid #FF4F9A;'
];
for (const marker of requiredMarkers) {
  if (!html.includes(marker)) throw new Error(`Runtime optimization marker missing: ${marker}`);
}
if (html.includes('cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>')) {
  throw new Error('html2canvas is still eagerly loaded');
}
if (html.includes('localStorage.clear();') || html.includes('sessionStorage.clear();')) {
  throw new Error('Broad storage clearing remains in production');
}
if (html.includes('--card-border: 69px solid #FF69B4')) {
  throw new Error('Broken oversized pink-heart border remains in production');
}

fs.writeFileSync(filePath, html);
console.log('Runtime performance, reliability, safety and pink-heart theme fixes applied.');