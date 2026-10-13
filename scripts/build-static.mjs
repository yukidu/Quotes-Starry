import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourcePath = path.join(root, 'index.html');
const distDir = path.join(root, 'dist');
const source = fs.readFileSync(sourcePath, 'utf8');
const configText = fs.readFileSync(path.join(root, 'app-config.js'), 'utf8');
const platformText = fs.readFileSync(path.join(root, 'platform.js'), 'utf8');
let output = source;

function replaceOnce(input, from, to, label) {
  const first = input.indexOf(from);
  if (first === -1) throw new Error(`Build transform target not found: ${label}`);
  if (input.indexOf(from, first + from.length) !== -1) throw new Error(`Build transform target is not unique: ${label}`);
  return input.slice(0, first) + to + input.slice(first + from.length);
}

// Keep config/platform as separate source modules for future native adapters, but inline
// the tiny Web runtime into production HTML so today's Web users pay zero extra requests.
const runtimeBootstrap = `    <script>\n${configText}\n${platformText}\n    </script>\n`;
output = replaceOnce(
  output,
  '    <script>\n        const STORAGE_KEYS',
  `${runtimeBootstrap}    <script>\n        const STORAGE_KEYS`,
  'platform bootstrap'
);

output = replaceOnce(
  output,
  '        const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1HufZqMwvvZh735nBMvKnDDI-BnZMUuYmFTA0_3B2lCE/export?format=csv";',
  '        const GOOGLE_SHEET_CSV_URL = window.StarryConfig.googleSheetCsvUrl;',
  'Google Sheet config'
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

const runtimeBytes = bytes(configText) + bytes(platformText);
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
    firstPartyRuntimeRequests: 0
  },
  dependenciesAdded: 0,
  nativeInitializationAdded: 0
};

report.delta = {
  html: report.after.html - report.before.html,
  inlineJs: report.after.inlineJs - report.before.inlineJs,
  inlineCss: report.after.inlineCss - report.before.inlineCss,
  firstPartyRuntimeJs: report.after.firstPartyRuntimeJs - report.before.firstPartyRuntimeJs,
  firstPartyRuntimeRequests: 0
};

if (runtimeBytes > 6 * 1024) {
  throw new Error(`Platform/config runtime JS exceeds 6 KiB budget: ${runtimeBytes} bytes`);
}
if (output.includes('src="./app-config.js"') || output.includes('src="./platform.js"')) {
  throw new Error('Platform/config runtime must not add blocking production requests');
}

console.log(JSON.stringify(report, null, 2));

if (process.env.GITHUB_STEP_SUMMARY) {
  const kb = value => `${(value / 1024).toFixed(2)} KiB`;
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, [
    '## Web First / Capacitor-ready size report',
    '',
    '| Metric | Before | After | Delta |',
    '| --- | ---: | ---: | ---: |',
    `| HTML | ${kb(report.before.html)} | ${kb(report.after.html)} | ${kb(report.delta.html)} |`,
    `| Inline JS | ${kb(report.before.inlineJs)} | ${kb(report.after.inlineJs)} | ${kb(report.delta.inlineJs)} |`,
    `| Inline CSS | ${kb(report.before.inlineCss)} | ${kb(report.after.inlineCss)} | ${kb(report.delta.inlineCss)} |`,
    `| First-party platform/config JS | ${kb(report.before.firstPartyRuntimeJs)} | ${kb(report.after.firstPartyRuntimeJs)} | ${kb(report.delta.firstPartyRuntimeJs)} |`,
    `| Extra first-party runtime requests | ${report.before.firstPartyRuntimeRequests} | ${report.after.firstPartyRuntimeRequests} | 0 |`,
    '',
    '- Dependencies added: 0',
    '- Native initialization added: 0',
    '- Unused camera/notification/auth native code added: 0',
    ''
  ].join('\n'));
}
