import { prisma } from './prisma.js';
import { isEligibleForCommissions } from './membershipStatus.js';

const defaults = {
  MEMBERSHIP_PRICE: 500,
  MONTHLY_FEE: 50,
  LEVEL1_PERCENT: 25,
  LEVEL2_PERCENT: 5,
};

const fmtUSD = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

async function notify(userId: string, title: string, message: string) {
  try {
    await prisma.notification.create({ data: { userId, title, message } });
  } catch {
    // no romper la activación si falla la notificación
  }
}

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
    if (referrer) {
      const percent = settings.level1Percent;
      const amount = Math.round((payment.amount * percent) / 100 * 100) / 100;
      // Solo cobra si está al día (ACTIVE o en gracia). Si no, la comisión queda retenida en el sistema.
      const eligible = isEligibleForCommissions(referrer);
      await tx.commission.create({
        data: {
          paymentId: payment.id,
          userId: referrer.id,
          sourceUserId: payment.userId,
          level: 1,
          percent,
          amount,
          status: eligible ? 'PAID' : 'RETENTED',
        },
      });
      if (eligible) {
        const buyerName = source?.firstName || source?.username || 'Un miembro';
        await tx.user.update({ where: { id: referrer.id }, data: { balance: { increment: amount } } });
        const updated = await tx.user.findUnique({ where: { id: referrer.id }, select: { balance: true } });
        await tx.balanceLog.create({
          data: { userId: referrer.id, type: 'credit', amount, balance: updated?.balance ?? 0, note: `Comisión nivel 1 por ${buyerName}` },
        });
        await notify(
          referrer.id,
          'Comisión por referido',
          `${buyerName} activó su membresía y ganaste ${fmtUSD(amount)} (nivel 1).`
        );
      }
    }

    if (referrer) {
      const grandReferrer = referrer.referrerId
        ? await tx.user.findUnique({ where: { id: referrer.referrerId } })
        : null;
      if (grandReferrer) {
        const percent2 = settings.level2Percent;
        const amount2 = Math.round((payment.amount * percent2) / 100 * 100) / 100;
        const eligible2 = isEligibleForCommissions(grandReferrer);
        await tx.commission.create({
          data: {
            paymentId: payment.id,
            userId: grandReferrer.id,
            sourceUserId: payment.userId,
            level: 2,
            percent: percent2,
            amount: amount2,
            status: eligible2 ? 'PAID' : 'RETENTED',
          },
        });
        if (eligible2) {
          await tx.user.update({ where: { id: grandReferrer.id }, data: { balance: { increment: amount2 } } });
          const updated2 = await tx.user.findUnique({ where: { id: grandReferrer.id }, select: { balance: true } });
          const buyerName = source?.firstName || source?.username || 'Un miembro';
          await tx.balanceLog.create({
            data: { userId: grandReferrer.id, type: 'credit', amount: amount2, balance: updated2?.balance ?? 0, note: `Comisión nivel 2 por ${buyerName}` },
          });
          await notify(
            grandReferrer.id,
            'Comisión de tu red',
            `${buyerName} de tu red activó su membresía y ganaste ${fmtUSD(amount2)} (nivel 2).`
          );
        }
      }
    }

    if (source) {
      await notify(
        source.id,
        'Membresía activa',
        'Tu membresía está activa. ¡Bienvenido a Círculo 1! Ya puedes acceder a tu programa.'
      );
    }
  });

  return { success: true };
}
