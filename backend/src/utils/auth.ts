import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateReferralCode(username: string): string {
  const base = username.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
  return base ? `${base}${suffix}` : `C1${suffix}`;
}