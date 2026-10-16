import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const htmlPath = path.join(root, 'dist', 'index.html');
const ssoPath = path.join(root, 'ecosystem-sso.js');
const html = fs.readFileSync(htmlPath, 'utf8');
const sso = fs.readFileSync(ssoPath, 'utf8');

if (!html.includes('</body>')) throw new Error('dist/index.html missing </body>');
if (html.includes('StarryMirrorEcosystemAuth')) throw new Error('ecosystem SSO runtime already injected');
if (Buffer.byteLength(sso, 'utf8') > 12 * 1024) throw new Error('ecosystem SSO runtime exceeds 12 KiB budget');

const output = html.replace('</body>', `<script data-starry-mirror-ecosystem-sso>\n${sso}\n</script>\n</body>`);
fs.writeFileSync(htmlPath, output);

if (!output.includes('https://mirror.starry.phd/') || !output.includes('StarryMirrorEcosystemAuth')) {
  throw new Error('mirror production domain or ecosystem SSO runtime missing after injection');
}
if (output.includes('https://quotes.starry.phd/')) {
  throw new Error('legacy quotes.starry.phd remains in production HTML');
}

console.log(`Injected ecosystem SSO: ${Buffer.byteLength(sso, 'utf8')} bytes`);
