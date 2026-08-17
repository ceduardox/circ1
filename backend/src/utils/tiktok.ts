import { prisma } from './prisma.js';
import { isEligibleForCommissions } from './membershipStatus.js';
import { sendWebPush } from './onesignal.js';

const fmtUSD = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

// Lee los porcentajes de comisión configurables (nivel 1 = 25%, nivel 2 = 5%).
async function getCommissionSettings() {
  const rows = await prisma.adminSetting.findMany();
  const map: Record<string, any> = {};
  for (const r of rows) {
    try { map[r.key] = JSON.parse(r.value as any); } catch { map[r.key] = r.value; }
  }
  return {
    level1Percent: Number(map.LEVEL1_PERCENT ?? 25),
    level2Percent: Number(map.LEVEL2_PERCENT ?? 5),
  };
}

// Notificación in-app + web push respetando las preferencias del usuario.
async function notifyWithPush(userId: string, title: string, message: string, pref: 'pushCommissions' | 'pushPayments' | 'pushChat') {
  try {
    await prisma.notification.create({ data: { userId, title, message } });
  } catch { /* no romper */ }
  try {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { pushEnabled: true, [pref]: true } as any });
    if (u?.pushEnabled && u[pref]) {
      await sendWebPush({ externalUserIds: [userId], title, message });
    }
  } catch { /* no romper */ }
}

// El pack se determina automáticamente por el plan de membresía pagado
// (plan_id 'elite' o monto >= 1000 => 10 creadores, si no 500 => 5).
export async function resolvePackForUser(userId: string): Promise<{ packType: number; baseCreators: number }> {
  const lastPaid = await prisma.membershipPayment.findFirst({
    where: { userId, type: 'MEMBERSHIP', status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
  });
  const elite = lastPaid?.planId === 'elite' || (lastPaid?.amount ?? 0) >= 1000;
  return elite ? { packType: 1000, baseCreators: 10 } : { packType: 500, baseCreators: 5 };
}

// Total de slots disponibles: base del pack + creadores extra pagados.
export async function campaignMaxCreators(campaignId: string): Promise<number> {
  const c = await prisma.tikTokShopCampaign.findUnique({ where: { id: campaignId } });
  if (!c) return 0;
  return c.baseCreators + c.extraCreators;
}

// Activa la compra de un creador extra (reutiliza MembershipPayment tipo CREATOR_EXTRA).
// Se llama desde el webhook de NowPayments y desde la verificación manual del admin.
export async function activateCreatorExtra(paymentId: string, processedBy: string) {
  const payment = await prisma.membershipPayment.findUnique({ where: { id: paymentId }, include: { user: true } });
  if (!payment) throw new Error('Pago no encontrado');
  if (payment.status !== 'PENDING') throw new Error('Este pago ya fue procesado');
  if (payment.type !== 'CREATOR_EXTRA') throw new Error('Este pago no es de creador extra');
  if (!payment.campaignId) throw new Error('Este pago no está vinculado a una campaña de TikTok Shop');

  await prisma.$transaction(async (tx) => {
    await tx.membershipPayment.update({
      where: { id: paymentId },
      data: { status: 'APPROVED', processedAt: new Date(), processedBy },
    });
    await tx.tikTokShopCampaign.update({
      where: { id: payment.campaignId! },
      data: { extraCreators: { increment: 1 } },
    });
  });

  await notifyWithPush(
    payment.userId,
    'Creador extra agregado',
    '¡Pago confirmado! Ahora tienes un espacio más para un creador de contenido.',
    'pushPayments'
  );

  return { success: true };
}

// Aprobar una comisión TikTok: si el receptor está al día (ACTIVE o GRACE) cobra su porcentaje;
// si no, ese porcentaje lo recibe el admin que la aprueba (nunca queda retenido).
export async function approveTikTokCommission(commissionId: string, processedBy: string) {
  const commission = await prisma.tikTokCommission.findUnique({
    where: { id: commissionId },
    include: {
      user: true,
      sale: {
        include: {
          product: true,
          creator: true,
          campaign: { include: { user: true } },
        },
      },
    },
  });
  if (!commission) throw new Error('Comisión no encontrada');
  if (commission.status !== 'PENDING') throw new Error('Esta comisión ya fue procesada');

  let receiver = commission.user;
  let eligible = isEligibleForCommissions(receiver);

  // Si el receptor no está al día, el admin que aprueba se queda con ese porcentaje.
  if (!eligible) {
    const admin = await prisma.user.findUnique({ where: { id: processedBy } });
    if (!admin) throw new Error('Admin no encontrado');
    receiver = admin;
    eligible = true;
  }

  await prisma.$transaction(async (tx) => {
    await tx.tikTokCommission.update({
      where: { id: commissionId },
      data: { status: 'APPROVED', approvedAt: new Date(), userId: receiver.id },
    });
    await tx.user.update({ where: { id: receiver.id }, data: { balance: { increment: commission.amount } } });
    const updated = await tx.user.findUnique({ where: { id: receiver.id }, select: { balance: true } });
    await tx.balanceLog.create({
      data: {
        userId: receiver.id,
        type: 'credit',
        amount: commission.amount,
        balance: updated?.balance ?? 0,
        note: `Comisión TikTok Shop por ${commission.sale.product.name}`,
      },
    });
  });

  const isStudent = commission.type === 'STUDENT';
  if (isStudent) {
    await notifyWithPush(
      receiver.id,
      'Ganancia disponible 🎉',
      `Tu comisión por la venta de ${commission.sale.product.name} (${fmtUSD(commission.amount)}) ya está disponible.`,
      'pushCommissions'
    );
  } else {
    await notifyWithPush(
      receiver.id,
      'Comisión de tu red (TikTok Shop)',
      `${commission.sale.campaign.user.firstName || commission.sale.campaign.user.username} vendió y ganaste ${fmtUSD(commission.amount)} (${commission.percent}%).`,
      'pushCommissions'
    );
  }

  return { success: true };
}

// Genera comisiones de referido (25% nivel 1, 5% nivel 2) por el pack
// asignado manualmente por el admin a un usuario sin membresía real.
// Reutiliza el modelo Commission (anclado a un MembershipPayment sintético)
// para que el referidor lo vea en su historial.
// Regla de TikTok: si el receptor no está al día, ese % lo recibe el admin.
export async function creditPackReferral(userId: string, packType: number, processedBy: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.referrerId) return { success: true, level1: 0, level2: 0 };

  // Si el usuario ya pagó una membresía real, el referidor ya cobró su comisión
  // por ese pago (activateMembership). No duplicar.
  const paidMembership = await prisma.membershipPayment.findFirst({
    where: { userId, type: 'MEMBERSHIP', status: 'APPROVED' },
  });
  if (paidMembership) return { success: true, skipped: 'already-paid', level1: 0, level2: 0 };

  const settings = await getCommissionSettings();
  const packValue = packType >= 1000 ? 1000 : 500;
  const l1Amount = Math.round(packValue * settings.level1Percent / 100 * 100) / 100;
  const l2Amount = Math.round(packValue * settings.level2Percent / 100 * 100) / 100;

  // Pago sintético que ancla las comisiones (no activa membresía real).
  const anchor = await prisma.membershipPayment.create({
    data: {
      userId,
      amount: packValue,
      type: 'MEMBERSHIP',
      status: 'APPROVED',
      planId: packType >= 1000 ? 'elite' : 'estandar',
      planName: packType >= 1000 ? 'Élite' : 'Estándar',
      method: 'PACK_MANUAL',
      reference: 'pack-admin',
      processedAt: new Date(),
      processedBy,
    },
  });

  // ── Nivel 1: el referidor directo ──
  const referrer = await prisma.user.findUnique({ where: { id: user.referrerId } });
  if (referrer) {
    let receiverId = referrer.id;
    if (!isEligibleForCommissions(referrer)) {
      receiverId = processedBy; // no está al día → el admin que asigna se queda con el %
    }
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: receiverId }, data: { balance: { increment: l1Amount } } });
      const updated = await tx.user.findUnique({ where: { id: receiverId }, select: { balance: true } });
      await tx.commission.create({
        data: {
          paymentId: anchor.id,
          userId: receiverId,
          sourceUserId: userId,
          level: 1,
          percent: settings.level1Percent,
          amount: l1Amount,
          status: 'PAID',
        },
      });
      await tx.balanceLog.create({
        data: {
          userId: receiverId,
          type: 'credit',
          amount: l1Amount,
          balance: updated?.balance ?? 0,
          note: `Comisión nivel 1 por pack TikTok Shop de ${user.username}`,
        },
      });
    });
    const name = user.firstName || user.username || 'Un miembro';
    await notifyWithPush(receiverId, 'Comisión por tu red', `${name} activó TikTok Shop y ganaste ${fmtUSD(l1Amount)} (nivel 1).`, 'pushCommissions');
  }

  // ── Nivel 2: el referidor del referidor ──
  if (referrer?.referrerId) {
    const grandReferrer = await prisma.user.findUnique({ where: { id: referrer.referrerId } });
    if (grandReferrer) {
      let receiverId = grandReferrer.id;
      if (!isEligibleForCommissions(grandReferrer)) {
        receiverId = processedBy;
      }
      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: receiverId }, data: { balance: { increment: l2Amount } } });
        const updated = await tx.user.findUnique({ where: { id: receiverId }, select: { balance: true } });
        await tx.commission.create({
          data: {
            paymentId: anchor.id,
            userId: receiverId,
            sourceUserId: userId,
            level: 2,
            percent: settings.level2Percent,
            amount: l2Amount,
            status: 'PAID',
          },
        });
        await tx.balanceLog.create({
          data: {
            userId: receiverId,
            type: 'credit',
            amount: l2Amount,
            balance: updated?.balance ?? 0,
            note: `Comisión nivel 2 por pack TikTok Shop de ${user.username}`,
          },
        });
      });
      const name = user.firstName || user.username || 'Un miembro';
      await notifyWithPush(receiverId, 'Comisión de tu red', `${name} de tu red activó TikTok Shop y ganaste ${fmtUSD(l2Amount)} (nivel 2).`, 'pushCommissions');
    }
  }

  return { success: true, level1: l1Amount, level2: l2Amount };
}
