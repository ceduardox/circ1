import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import countries from 'world-countries';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Enmascara una dirección cripto: 0x71C7656EC7...8976F
export function maskAddress(address: string): string {
  if (!address) return '';
  if (address.length <= 12) return address.slice(0, 6) + '...';
  const head = address.slice(0, 10);
  const tail = address.slice(-6);
  return `${head}...${tail}`;
}

const countryCodes: Record<string, string> = {};
const countryNamesLower: { name: string; code: string }[] = [];
for (const c of countries) {
  countryCodes[c.name.common] = c.cca2;
  countryCodes[c.name.common.toLowerCase()] = c.cca2;
  countryCodes[c.cca2.toLowerCase()] = c.cca2;
  countryNamesLower.push({ name: normalizeCountry(c.name.common), code: c.cca2 });
}

// Quita tildes y ñ para comparar sin acentos.
function normalizeCountry(name: string): string {
  return name
    .toLowerCase()
    .replace(/ñ/g, 'n')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Alias comunes para países escritos de forma informal.
const COUNTRY_ALIASES: Record<string, string> = {
  usa: 'us',
  eeuu: 'us',
  estadosunidos: 'us',
  espana: 'es',
  espanha: 'es',
  inglaterra: 'gb',
  'reino unido': 'gb',
  uk: 'gb',
  rusia: 'ru',
  venezuela: 've',
  colombia: 'co',
  mexico: 'mx',
  argentina: 'ar',
  chile: 'cl',
  peru: 'pe',
  bolivia: 'bo',
  brasil: 'br',
  ecuador: 'ec',
  uruguay: 'uy',
  paraguay: 'py',
  guatemala: 'gt',
  honduras: 'hn',
  salvador: 'sv',
  panama: 'pa',
  costarica: 'cr',
  cuba: 'cu',
  dominicana: 'do',
  republicadominicana: 'do',
};

// Convierte el país guardado por el usuario a su código ISO ("pe") para la bandera flag-icons.
// Es tolerante: acepta nombre con/sin tildes, código ISO y alias informales.
export function countryFlag(countryName?: string | null): string | null {
  if (!countryName) return null;
  const trimmed = countryName.trim();
  if (!trimmed) return null;

  // 1. Coincidencia exacta o por código ISO (incluye minúsculas)
  const direct = countryCodes[trimmed] || countryCodes[trimmed.toLowerCase()];
  if (direct) return direct.toLowerCase();

  // 2. Alias informales
  const alias = COUNTRY_ALIASES[normalizeCountry(trimmed)];
  if (alias) return alias;

  // 3. Coincidencia por nombre normalizado (sin tildes)
  const norm = normalizeCountry(trimmed);
  const byName = countryNamesLower.find(c => c.name === norm);
  if (byName) return byName.code.toLowerCase();

  // 4. Coincidencia parcial: el valor guardado está contenido en un nombre real (o al revés)
  const partial = countryNamesLower.find(c => c.name.includes(norm) || norm.includes(c.name));
  if (partial) return partial.code.toLowerCase();

  return null;
}