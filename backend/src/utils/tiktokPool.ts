import { readFile } from 'fs/promises';
import path from 'path';
import { prisma } from './prisma.js';

// Parser CSV (RFC4180 simple): soporta comillas, comas y saltos dentro de campos.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = '';
    } else if (c !== '\r') {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

const toInt = (s?: string) => {
  const n = parseInt((s || '').replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
};
const toBool = (s?: string) => {
  const v = (s || '').trim().toLowerCase();
  return v === 'si' || v === 'sí' || v === 'yes' || v === 'true';
};
const toMoney = (s?: string) => {
  const n = parseFloat((s || '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

// Extrae métricas de la bio tipo:
// "US · GMV 7d $114,666 · total $613,910 · 4,548 uds · 224 prod · Beauty & Personal Care; ..."
function parseBioMetrics(bio: string | null) {
  const out = { country: null as string | null, gmv7d: 0, gmvTotal: 0, units: 0, products: 0, categories: null as string | null };
  if (!bio) return out;
  const m7 = bio.match(/GMV\s*7d\s*\$?([\d.,]+)/i);
  if (m7) out.gmv7d = toMoney(m7[1]);
  const mt = bio.match(/total\s*\$?([\d.,]+)/i);
  if (mt) out.gmvTotal = toMoney(mt[1]);
  const mu = bio.match(/([\d.,]+)\s*uds/i);
  if (mu) out.units = Math.round(toMoney(mu[1]));
  const mp = bio.match(/([\d.,]+)\s*prod/i);
  if (mp) out.products = Math.round(toMoney(mp[1]));
  const mc = bio.match(/prod\s*[·•|]\s*([^·•|]+)/i);
  if (mc) out.categories = mc[1].trim();
  const mc2 = bio.match(/^([A-Z]{2})\b/);
  if (mc2) out.country = mc2[1];
  return out;
}

// Carga la base de TikTokers desde prisma/data/tiktok_creadores.csv (idempotente por usuario).
export async function syncTikTokCreatorPool(): Promise<number> {
  const file = path.join(process.cwd(), 'prisma', 'data', 'tiktok_creadores.csv');
  let raw: string;
  try {
    raw = await readFile(file, 'utf8');
  } catch {
    return 0;
  }
  const clean = raw.replace(/^\uFEFF/, '');
  const rows = parseCsv(clean).filter(r => r.some(c => (c || '').trim() !== ''));
  if (rows.length < 2) return 0;

  const header = rows[0].map(h => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const iUser = idx('usuario');
  const iName = idx('nombre');
  const iFollowers = idx('seguidores');
  const iShop = idx('tiktok shop');
  const iVerified = idx('verificado');
  const iBio = idx('bio');
  const iWeb = idx('web');
  const iLikes = idx('me gusta');
  const iVideos = idx('videos');
  const iProfile = idx('perfil');
  if (iUser === -1) return 0;

  let count = 0;
  for (const r of rows.slice(1)) {
    const username = (r[iUser] || '').trim();
    if (!username) continue;
    const profileUrl = (iProfile >= 0 ? (r[iProfile] || '').trim() : '')
      || `https://www.tiktok.com/${username.startsWith('@') ? username : '@' + username}`;

    const data = {
      username,
      name: (iName >= 0 ? (r[iName] || '').trim() : '') || null,
      followers: iFollowers >= 0 ? toInt(r[iFollowers]) : 0,
      hasShop: iShop >= 0 ? toBool(r[iShop]) : false,
      verified: iVerified >= 0 ? toBool(r[iVerified]) : false,
      bio: iBio >= 0 ? (r[iBio] || '').trim() || null : null,
      web: iWeb >= 0 ? (r[iWeb] || '').trim() || null : null,
      likes: iLikes >= 0 ? toInt(r[iLikes]) : 0,
      videos: iVideos >= 0 ? toInt(r[iVideos]) : 0,
      profileUrl,
      ...parseBioMetrics(iBio >= 0 ? (r[iBio] || '').trim() || null : null),
    };

    await prisma.tikTokCreatorPool.upsert({
      where: { username },
      update: data,
      create: data,
    });
    count++;
  }
  return count;
}
