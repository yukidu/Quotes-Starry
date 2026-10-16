import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const filePath = path.join(root, 'dist', 'index.html');
if (!fs.existsSync(filePath)) throw new Error('dist/index.html not found');
let html = fs.readFileSync(filePath, 'utf8');
const mirrorRuntime = fs.readFileSync(path.join(root, 'mirror-app.js'), 'utf8');

function removeDivById(id) {
  const marker = `id="${id}"`;
  const at = html.indexOf(marker);
  if (at < 0) throw new Error(`Missing element ${id}`);
  let start = html.lastIndexOf('<div', at);
  if (start < 0) throw new Error(`Missing opening div for ${id}`);
  const commentStart = html.lastIndexOf('<!--', start);
  const commentEnd = commentStart >= 0 ? html.indexOf('-->', commentStart) : -1;
  if (commentStart >= 0 && commentEnd >= commentStart && commentEnd < start) start = commentStart;
  let scan = html.indexOf('<div', start);
  let depth = 0;
  let cursor = scan;
  let end = -1;
  while (cursor >= 0 && cursor < html.length) {
    const nextOpen = html.indexOf('<div', cursor);
    const nextClose = html.indexOf('</div>', cursor);
    if (nextClose < 0) break;
    if (nextOpen >= 0 && nextOpen < nextClose) {
      depth += 1;
      cursor = html.indexOf('>', nextOpen) + 1;
    } else {
      depth -= 1;
      cursor = nextClose + 6;
      if (depth === 0) { end = cursor; break; }
    }
  }
  if (end < 0) throw new Error(`Unable to balance divs for ${id}`);
  html = html.slice(0, start) + html.slice(end);
}

html = html.replace(/<title>[\s\S]*?<\/title>/i, '<title>繁星心鏡 Starry Mirror</title>');
html = html.replace(/<meta property="og:title" content="[^"]*">/i, '<meta property="og:title" content="繁星心鏡 Starry Mirror">');
html = html.replaceAll('繁星語錄 Quotes Starry', '繁星心鏡 Starry Mirror');
html = html.replaceAll('繁星語錄', '繁星心鏡');

removeDivById('shakeTutorialModal');
html = html.replace(/^\s*@keyframes phoneShake[^\n]*\n\s*\.animate-shake[^\n]*\n?/m, '');
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
for (const required of ['繁星心鏡','Starry Mirror','starry-mirror-runtime','mirrorApiBase','/bootstrap','AI解籤','我的收藏','mirror-battery-pop']) {
  if (!html.includes(required)) throw new Error(`Mirror production marker missing: ${required}`);
}
if (html.includes('await autoImport(); window.randomStyle(true);')) throw new Error('Browser still loads Google Sheet directly on startup');

fs.writeFileSync(filePath, html);
console.log('Starry Mirror runtime applied; shake feature removed completely from production.');
