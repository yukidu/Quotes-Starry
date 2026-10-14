import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourcePath = path.join(root, 'index.html');
const distDir = path.join(root, 'dist');
const source = fs.readFileSync(sourcePath, 'utf8');
const configText = fs.readFileSync(path.join(root, 'app-config.js'), 'utf8');
const platformText = fs.readFileSync(path.join(root, 'platform.js'), 'utf8');
const authText = fs.readFileSync(path.join(root, 'starry-auth.js'), 'utf8');
let output = source;

function replaceOnce(input, from, to, label) {
  const first = input.indexOf(from);
  if (first === -1) throw new Error(`Build transform target not found: ${label}`);
  if (input.indexOf(from, first + from.length) !== -1) throw new Error(`Build transform target is not unique: ${label}`);
  return input.slice(0, first) + to + input.slice(first + from.length);
}

function removeSection(input, startMarker, endMarker, label) {
  const start = input.indexOf(startMarker);
  if (start === -1) throw new Error(`Build transform start marker not found: ${label}`);
  const end = input.indexOf(endMarker, start);
  if (end === -1) throw new Error(`Build transform end marker not found: ${label}`);
  return input.slice(0, start) + input.slice(end);
}

// Keep config/platform/auth as separate source modules for future native adapters, but inline
// the tiny Web runtime into production HTML so today's Web users pay zero extra JS requests.
const runtimeBootstrap = `    <script>\n${configText}\n${platformText}\n${authText}\n    </script>\n`;
output = replaceOnce(
  output,
  '    <script>\n        const STORAGE_KEYS',
  `${runtimeBootstrap}    <script>\n        const STORAGE_KEYS`,
  'platform/auth bootstrap'
);

output = replaceOnce(
  output,
  '        const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1HufZqMwvvZh735nBMvKnDDI-BnZMUuYmFTA0_3B2lCE/export?format=csv";',
  '        const GOOGLE_SHEET_CSV_URL = window.StarryConfig.googleSheetCsvUrl;',
  'Google Sheet config'
);

output = replaceOnce(
  output,
  `            <div id="welcomeLine">\n                <p id="welcomeMsg"></p>\n                <button class="reset-name-btn" onclick="window.resetName()">✎</button>\n            </div>`,
  `            <div id="welcomeLine">\n                <p id="welcomeMsg">歡迎你</p>\n                <button id="starryAuthBtn" type="button" class="flex-shrink-0 bg-black text-white px-3 h-9 rounded-full text-[11px] font-black whitespace-nowrap">Starry ID 登入</button>\n            </div>`,
  'welcome identity UI'
);

output = removeSection(
  output,
  '    <!-- 姓名輸入視窗 (點任意處關閉) -->',
  '    <!-- 紀錄視窗 (點任意處關閉) -->',
  'legacy guest name modal'
);

output = replaceOnce(
  output,
  "        const STORAGE_KEYS = { PROGRESS: 'better_you_progress_v3', METADATA: 'better_you_metadata_v3', USERNAME: 'better_you_user_name', SESSION_FLIP_COUNT: 'session_flip_count', DUDU_INDEX_QUEUE: 'dudu_photo_queue_v4' };",
  "        const STORAGE_KEYS = { PROGRESS: 'better_you_progress_v3', METADATA: 'better_you_metadata_v3', SESSION_FLIP_COUNT: 'session_flip_count', DUDU_INDEX_QUEUE: 'dudu_photo_queue_v4' };",
  'legacy guest name storage'
);

output = replaceOnce(
  output,
  `        window.initApp = async () => {\n            const loading = document.getElementById('aiLoading'); loading.style.display = 'flex';\n            sessionStorage.setItem(STORAGE_KEYS.SESSION_FLIP_COUNT, '0');\n            try {\n                const name = localStorage.getItem(STORAGE_KEYS.USERNAME);\n                if (name) updateWelcomeUI(name); else setTimeout(() => document.getElementById('nameModal').classList.remove('hidden'), 500);\n                const prog = localStorage.getItem(STORAGE_KEYS.PROGRESS);`,
  `        window.initApp = async () => {\n            const loading = document.getElementById('aiLoading'); loading.style.display = 'flex';\n            sessionStorage.setItem(STORAGE_KEYS.SESSION_FLIP_COUNT, '0');\n            window.StarryIdentity.refresh();\n            try {\n                const prog = localStorage.getItem(STORAGE_KEYS.PROGRESS);`,
  'guest name startup flow'
);

output = replaceOnce(
  output,
  `\n        function updateWelcomeUI(name) { \n            const line = document.getElementById('welcomeLine'), m = document.getElementById('welcomeMsg'); \n            if (name && line && m) { m.textContent = \`歡迎 ${'${'}name} 一起改變生命未來式！\`; line.style.display = 'flex'; } \n        }\n`,
  '\n',
  'legacy welcome name renderer'
);

output = replaceOnce(
  output,
  `            document.getElementById('exportSenderInfo').textContent = \`寄送人：${'${'}localStorage.getItem(STORAGE_KEYS.USERNAME) || '好友'} | ${'${'}ts}\`;`,
  `            const exportIdentity = window.StarryIdentity.getDisplayName();\n            const senderInfo = document.getElementById('exportSenderInfo');\n            if (exportIdentity) { senderInfo.textContent = \`${'${'}exportIdentity} | ${'${'}ts}\`; senderInfo.style.display = 'block'; }\n            else { senderInfo.textContent = ''; senderInfo.style.display = 'none'; }`,
  'export identity field'
);

output = replaceOnce(
  output,
  `        window.saveUserName = () => { const v = document.getElementById('userNameInput').value.trim(); if (v) { localStorage.setItem(STORAGE_KEYS.USERNAME, v); updateWelcomeUI(v); document.getElementById('nameModal').classList.add('hidden'); showToast(\`你好 ${'${'}v}！ ✨\`); } else showToast("請輸入名字喔！"); };\n        window.resetName = () => { localStorage.removeItem(STORAGE_KEYS.USERNAME); window.location.reload(); };\n        `,
  '',
  'legacy guest name actions'
);

output = replaceOnce(
  output,
  `        window.closeNameModal = () => document.getElementById('nameModal').classList.add('hidden');\n`,
  '',
  'legacy guest name close action'
);

output = replaceOnce(
  output,
  `        window.initInteraction = async () => {\n            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();\n            if (audioCtx.state === 'suspended') audioCtx.resume();\n            if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {\n                try { const p = await DeviceMotionEvent.requestPermission(); if (p === 'granted') window.addEventListener('devicemotion', handleShake, true); } catch (e) {}\n            } else { window.addEventListener('devicemotion', handleShake, true); }\n        };`,
  `        window.initInteraction = async () => {\n            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();\n            if (audioCtx.state === 'suspended') audioCtx.resume();\n            await window.StarryPlatform.motion.enable(handleShake);\n        };`,
  'device motion platform delegation'
);

output = replaceOnce(
  output,
  'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=',
  '${window.StarryConfig.qrCodeApiBaseUrl}?size=150x150&data=',
  'QR API config'
);

output = replaceOnce(
  output,
  `            if (navigator.share) { try { await navigator.share({ files: [new File([blob], "BetterYou.png", { type: 'image/png' })], text: "分享金句" }); } catch (e) { triggerDownload(blob); } }\n            else { triggerDownload(blob); }`,
  `            const shareResult = await window.StarryPlatform.share.shareBlob({\n                blob,\n                fileName: window.StarryConfig.shareFileName,\n                text: window.StarryConfig.shareText\n            });\n            if (shareResult.downloaded) showToast("圖片已下載到裝置 📥");`,
  'file sharing platform delegation'
);

output = replaceOnce(
  output,
  `        function triggerDownload(blob) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'BetterYou.png'; a.click(); showToast("圖片已下載到電腦 📥"); URL.revokeObjectURL(url); }`,
  `        function triggerDownload(blob) { window.StarryPlatform.files.downloadBlob(blob, window.StarryConfig.shareFileName); showToast("圖片已下載到裝置 📥"); }`,
  'download platform delegation'
);

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, 'index.html'), output);

function bytes(text) {
  return Buffer.byteLength(text, 'utf8');
}

function sumInlineBlocks(html, tagName) {
  const regex = tagName === 'style'
    ? /<style[^>]*>([\s\S]*?)<\/style>/gi
    : /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let total = 0;
  for (const match of html.matchAll(regex)) total += bytes(match[1]);
  return total;
}

const runtimeBytes = bytes(configText) + bytes(platformText) + bytes(authText);
const report = {
  before: {
    html: bytes(source),
    inlineJs: sumInlineBlocks(source, 'script'),
    inlineCss: sumInlineBlocks(source, 'style'),
    firstPartyRuntimeJs: 0,
    firstPartyRuntimeRequests: 0
  },
  after: {
    html: bytes(output),
    inlineJs: sumInlineBlocks(output, 'script'),
    inlineCss: sumInlineBlocks(output, 'style'),
    firstPartyRuntimeJs: runtimeBytes,
    firstPartyRuntimeRequests: 1
  },
  dependenciesAdded: 0,
  nativeInitializationAdded: 0
};

report.delta = {
  html: report.after.html - report.before.html,
  inlineJs: report.after.inlineJs - report.before.inlineJs,
  inlineCss: report.after.inlineCss - report.before.inlineCss,
  firstPartyRuntimeJs: report.after.firstPartyRuntimeJs - report.before.firstPartyRuntimeJs,
  firstPartyRuntimeRequests: 1
};

if (runtimeBytes > 6 * 1024) {
  throw new Error(`Platform/config/auth runtime JS exceeds 6 KiB budget: ${runtimeBytes} bytes`);
}
if (output.includes('src="./app-config.js"') || output.includes('src="./platform.js"') || output.includes('src="./starry-auth.js"')) {
  throw new Error('Platform/config/auth runtime must not add blocking production JS requests');
}
for (const legacy of ['nameModal', 'userNameInput', 'saveUserName', 'resetName', 'STORAGE_KEYS.USERNAME', '寄送人：好友']) {
  if (output.includes(legacy)) throw new Error(`Legacy guest-name flow still present in production: ${legacy}`);
}
if (!output.includes('window.StarryIdentity') || !output.includes('Starry ID 登入')) {
  throw new Error('Starry ID identity runtime missing from production build');
}

console.log(JSON.stringify(report, null, 2));

if (process.env.GITHUB_STEP_SUMMARY) {
  const kb = value => `${(value / 1024).toFixed(2)} KiB`;
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, [
    '## Web First / Starry ID size report',
    '',
    '| Metric | Before | After | Delta |',
    '| --- | ---: | ---: | ---: |',
    `| HTML | ${kb(report.before.html)} | ${kb(report.after.html)} | ${kb(report.delta.html)} |`,
    `| Inline JS | ${kb(report.before.inlineJs)} | ${kb(report.after.inlineJs)} | ${kb(report.delta.inlineJs)} |`,
    `| Inline CSS | ${kb(report.before.inlineCss)} | ${kb(report.after.inlineCss)} | ${kb(report.delta.inlineCss)} |`,
    `| First-party platform/config/auth JS | ${kb(report.before.firstPartyRuntimeJs)} | ${kb(report.after.firstPartyRuntimeJs)} | ${kb(report.delta.firstPartyRuntimeJs)} |`,
    `| Runtime identity requests | 0 | ${report.after.firstPartyRuntimeRequests} | +1 |`,
    '',
    '- Dependencies added: 0',
    '- Native initialization added: 0',
    '- Starry ID profile is not persisted to localStorage',
    ''
  ].join('\n'));
}
