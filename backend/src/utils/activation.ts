import { prisma } from './prisma.js';

const defaults = {
  MEMBERSHIP_PRICE: 500,
  MONTHLY_FEE: 50,
  LEVEL1_PERCENT: 25,
  LEVEL2_PERCENT: 5,
};

async function getSettings() {
  const rows = await prisma.adminSetting.findMany();
  const map: Record<string, any> = {};
  for (const r of rows) {
    try { map[r.key] = JSON.parse(r.value as any); } catch { map[r.key] = r.value; }
  }
  return {
    membershipPrice: Number(map.MEMBERSHIP_PRICE ?? defaults.MEMBERSHIP_PRICE),
    monthlyFee: Number(map.MONTHLY_FEE ?? defaults.MONTHLY_FEE),
    level1Percent: Number(map.LEVEL1_PERCENT ?? defaults.LEVEL1_PERCENT),
    level2Percent: Number(map.LEVEL2_PERCENT ?? defaults.LEVEL2_PERCENT),
  };
}

// Activa la membresía y genera comisiones. Usada por aprobación manual (admin) y webhook de NowPayments.
export async function activateMembership(paymentId: string, processedBy: string) {
  const settings = await getSettings();

  const payment = await prisma.membershipPayment.findUnique({ where: { id: paymentId }, include: { user: true } });
  if (!payment) throw new Error('Pago no encontrado');
  if (payment.status !== 'PENDING') throw new Error('Este pago ya fue procesado');

  const now = new Date();
  const isRenewal = payment.type === 'MONTHLY';

  const baseExpiry = isRenewal
    ? (payment.user.membershipExpiresAt && payment.user.membershipExpiresAt > now
      ? payment.user.membershipExpiresAt
      : now)
    : now;
  const expires = new Date(baseExpiry);
  expires.setDate(expires.getDate() + 30);

  await prisma.$transaction(async (tx) => {
    await tx.membershipPayment.update({
      where: { id: paymentId },
      data: { status: 'APPROVED', processedAt: now, processedBy },
    });

    await tx.user.update({
      where: { id: payment.userId },
      data: {
        membershipStatus: 'ACTIVE',
        membershipPaidAt: now,
        membershipExpiresAt: expires,
      },
    });

    const source = await tx.user.findUnique({ where: { id: payment.userId } });
    const referrer = source?.referrerId ? await tx.user.findUnique({ where: { id: source.referrerId } }) : null;
    if (referrer && referrer.membershipStatus === 'ACTIVE') {
      const percent = settings.level1Percent;
      const amount = Math.round((payment.amount * percent) / 100 * 100) / 100;
      await tx.commission.create({
        data: {
          paymentId: payment.id,
          userId: referrer.id,
          sourceUserId: payment.userId,
          level: 1,
          percent,
          amount,
        },
      });
      await tx.user.update({ where: { id: referrer.id }, data: { balance: { increment: amount } } });
    }

    if (referrer) {
      const grandReferrer = referrer.referrerId
        ? await tx.user.findUnique({ where: { id: referrer.referrerId } })
        : null;
      if (grandReferrer && grandReferrer.membershipStatus === 'ACTIVE') {
        const percent2 = settings.level2Percent;
        const amount2 = Math.round((payment.amount * percent2) / 100 * 100) / 100;
        await tx.commission.create({
          data: {
            paymentId: payment.id,
            userId: grandReferrer.id,
            sourceUserId: payment.userId,
            level: 2,
            percent: percent2,
            amount: amount2,
          },
        });
        await tx.user.update({ where: { id: grandReferrer.id }, data: { balance: { increment: amount2 } } });
      }
    }
  });

  return { success: true };
}
