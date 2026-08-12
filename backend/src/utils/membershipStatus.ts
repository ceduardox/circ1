export const GRACE_DAYS = 3;
export const MEMBERSHIP_DAYS = 30;

export type MemberLike = {
  membershipStatus: string;
  membershipExpiresAt: Date | null;
};

// Estado efectivo: ACTIVE mientras dura, GRACE en los 3 días tras vencer (aún está al día),
// EXPIRED después.
export function effectiveMembership(user: MemberLike): {
  status: string;
  expiresAt: Date | null;
  graceEndsAt: Date | null;
} {
  if (user.membershipStatus !== 'ACTIVE' || !user.membershipExpiresAt) {
    return { status: user.membershipStatus, expiresAt: user.membershipExpiresAt, graceEndsAt: null };
  }
  const now = new Date();
  const expiresAt = user.membershipExpiresAt;
  const graceEndsAt = new Date(expiresAt.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000);
  if (now <= expiresAt) return { status: 'ACTIVE', expiresAt, graceEndsAt };
  if (now <= graceEndsAt) return { status: 'GRACE', expiresAt, graceEndsAt };
  return { status: 'EXPIRED', expiresAt, graceEndsAt };
}

// Está al día para cobrar comisiones cuando su membresía es ACTIVE o está en GRACE.
export function isEligibleForCommissions(user: MemberLike): boolean {
  const eff = effectiveMembership(user);
  return eff.status === 'ACTIVE' || eff.status === 'GRACE';
}