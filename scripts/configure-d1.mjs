import fs from 'node:fs';

const listPath = process.argv[2];
if (!listPath || !fs.existsSync(listPath)) throw new Error('Usage: node scripts/configure-d1.mjs <d1-list.json>');
const raw = JSON.parse(fs.readFileSync(listPath, 'utf8'));
const rows = Array.isArray(raw) ? raw : Array.isArray(raw?.result) ? raw.result : [];
const database = rows.find(row => String(row?.name || row?.database_name || '') === 'starry_mirror_db');
const id = String(database?.uuid || database?.id || database?.database_id || '').trim();
if (!id) throw new Error('starry_mirror_db was not found in wrangler d1 list output');
let config = fs.readFileSync('wrangler.toml', 'utf8');
config = config.replace(/\n\[\[d1_databases\]\][\s\S]*?binding\s*=\s*"MIRROR_DB"[\s\S]*?(?=\n\[|$)/g, '\n');
config += `\n[[d1_databases]]\nbinding = "MIRROR_DB"\ndatabase_name = "starry_mirror_db"\ndatabase_id = "${id}"\n`;
fs.writeFileSync('wrangler.toml', config);
console.log(`Configured MIRROR_DB => starry_mirror_db (${id})`);
