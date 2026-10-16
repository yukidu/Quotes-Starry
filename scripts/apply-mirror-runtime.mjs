import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const filePath = path.join(root, 'dist', 'index.html');
if (!fs.existsSync(filePath)) throw new Error('dist/index.html not found');
let html = fs.readFileSync(filePath, 'utf8');
const mirrorRuntime = fs.readFileSync(path.join(root, 'mirror-app.js'), 'utf8');

function removeBetween(startMarker, endMarker, label) {
  const start = html.indexOf(startMarker);
  if (start < 0) throw new Error(`Missing ${label} start`);
  const end = html.indexOf(endMarker, start);
  if (end < 0) throw new Error(`Missing ${label} end`);
  html = html.slice(0, start) + html.slice(end);
}

html = html.replace(/<title>[\s\S]*?<\/title>/i, '<title>繁星心鏡 Starry Mirror</title>');
html = html.replace(/<meta property="og:title" content="[^"]*">/i, '<meta property="og:title" content="繁星心鏡 Starry Mirror">');
html = html.replaceAll('繁星語錄 Quotes Starry', '繁星心鏡 Starry Mirror');
html = html.replaceAll('繁星語錄', '繁星心鏡');

removeBetween('    <!-- 搖一搖教學彈窗', '    <!-- 紀錄視窗', 'shake tutorial modal');

html = html.replace(/\s*@keyframes phoneShake\s*\{[^}]*\}\s*/g, '\n');
html = html.replace(/\s*\.animate-shake\s*\{[^}]*\}\s*/g, '\n');
html = html.replace("        let lastShakeTime = 0, duduTemporaryHidden = false;", "        let duduTemporaryHidden = false;");
html = html.replace(/\n\s*if \(count === 1\) setTimeout\(\(\) => document\.getElementById\('shakeTutorialModal'\)\.classList\.remove\('hidden'\), 300\);/g, '');
html = html.replace(/\n\s*window\.closeShakeTutorial\s*=\s*\(\)\s*=>\s*document\.getElementById\('shakeTutorialModal'\)\.classList\.add\('hidden'\);/g, '');

const initStart = html.indexOf('        let interactionInitialized = false;');
const shakeStart = html.indexOf('        function handleShake(e) {', initStart);
if (initStart < 0 || shakeStart < 0) throw new Error('Optimized interaction/shake block not found');
html = html.slice(0, initStart) + `        let interactionInitialized = false;\n        window.initInteraction = async () => {\n            if (interactionInitialized) return;\n            interactionInitialized = true;\n            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();\n            if (audioCtx.state === 'suspended') await audioCtx.resume().catch(() => {});\n        };\n\n` + html.slice(shakeStart);

const shakeFunctionStart = html.indexOf('        function handleShake(e) {');
const dropdownStart = html.indexOf('        window.toggleDropdown', shakeFunctionStart);
if (shakeFunctionStart < 0 || dropdownStart < 0) throw new Error('Shake handler range not found');
html = html.slice(0, shakeFunctionStart) + html.slice(dropdownStart);

html = html.replace('                await autoImport(); window.randomStyle(true);', '                window.randomStyle(true);');

if (html.includes('id="starry-mirror-runtime"')) throw new Error('Mirror runtime already injected');
html = html.replace('</body>', `    <script id="starry-mirror-runtime">\n${mirrorRuntime}\n    </script>\n</body>`);

for (const forbidden of ['DeviceMotionEvent','devicemotion','handleShake','shakeRandomCard','shakeTutorialModal','closeShakeTutorial','phoneShake','animate-shake','搖一搖']) {
  if (html.includes(forbidden)) throw new Error(`Shake code still present in production: ${forbidden}`);
}
for (const required of ['繁星心鏡','Starry Mirror','starry-mirror-runtime','/api/mirror/bootstrap','AI解籤','我的收藏','mirror-battery-pop']) {
  if (!html.includes(required)) throw new Error(`Mirror production marker missing: ${required}`);
}
if (html.includes('await autoImport(); window.randomStyle(true);')) throw new Error('Browser still loads Google Sheet directly on startup');

fs.writeFileSync(filePath, html);
console.log('Starry Mirror runtime applied; shake feature removed completely from production.');
