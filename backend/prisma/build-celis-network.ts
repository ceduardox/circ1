import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateReferralCode } from '../src/utils/auth.js';

const prisma = new PrismaClient();

// ─── Configuración ───
// Identifica a celis por username o parte del email.
const CELIS_IDENTIFIER = process.env.CELIS_IDENTIFIER || 'celis';

// Plan de celis (500 = estándar, 1000 = élite). Determina pack y creadores base.
const CELIS_PACK = Number(process.env.CELIS_PACK || 1000);

// Red nivel 1: referidos directos de celis.
// daysAgo = hace cuántos días pagó la membresía (fechas en el pasado).
const L1 = [
  { username: 'red.juan', email: 'red.juan.mamani@ryztor.test', firstName: 'Juan', lastName: 'Mamani', country: 'Bolivia', pack: 500, daysAgo: 28 },
  { username: 'red.maria', email: 'red.maria.quispe@ryztor.test', firstName: 'María', lastName: 'Quispe', country: 'Bolivia', pack: 1000, daysAgo: 28 },
  { username: 'red.carlos', email: 'red.carlos.choque@ryztor.test', firstName: 'Carlos', lastName: 'Choque', country: 'Bolivia', pack: 500, daysAgo: 25 },
  { username: 'red.lucia', email: 'red.ana.condori@ryztor.test', firstName: 'Ana', lastName: 'Condori', country: 'Bolivia', pack: 500, daysAgo: 21 },
  { username: 'red.diego', email: 'red.jose.flores@ryztor.test', firstName: 'José', lastName: 'Flores', country: 'Bolivia', pack: 1000, daysAgo: 17 },
  { username: 'red.valentina', email: 'red.gabriela.apaza@ryztor.test', firstName: 'Gabriela', lastName: 'Apaza', country: 'Bolivia', pack: 500, daysAgo: 14 },
  { username: 'red.andres', email: 'red.roberto.gutierrez@ryztor.test', firstName: 'Roberto', lastName: 'Gutiérrez', country: 'Bolivia', pack: 500, daysAgo: 10 },
  { username: 'red.camila', email: 'red.daniela.vargas@ryztor.test', firstName: 'Daniela', lastName: 'Vargas', country: 'Bolivia', pack: 1000, daysAgo: 6 },
];

// Red nivel 2: referidos de los L1. parent = username del L1.
const L2 = [
  { username: 'red.sofia', email: 'red.rosa.ticona@ryztor.test', firstName: 'Rosa', lastName: 'Ticona', country: 'Bolivia', pack: 500, daysAgo: 20, parent: 'red.juan' },
  { username: 'red.mateo', email: 'red.luis.huanca@ryztor.test', firstName: 'Luis', lastName: 'Huanca', country: 'Bolivia', pack: 500, daysAgo: 15, parent: 'red.maria' },
  { username: 'red.isabella', email: 'red.carmen.chipana@ryztor.test', firstName: 'Carmen', lastName: 'Chipana', country: 'Bolivia', pack: 1000, daysAgo: 12, parent: 'red.carlos' },
  { username: 'red.santiago', email: 'red.rodrigo.mendoza@ryztor.test', firstName: 'Rodrigo', lastName: 'Mendoza', country: 'Bolivia', pack: 500, daysAgo: 8, parent: 'red.diego' },
  { username: 'red.fernanda', email: 'red.patricia.torrez@ryztor.test', firstName: 'Patricia', lastName: 'Torrez', country: 'Bolivia', pack: 500, daysAgo: 4, parent: 'red.valentina' },
];

// Creadores de TikTok Shop (2 influencers que le venden).
const CREATORS = [
  { name: 'Soy Camila', tiktokUrl: 'https://www.tiktok.com/@soycamila' },
  { name: 'Alex Fit Life', tiktokUrl: 'https://www.tiktok.com/@alexfitlife' },
];

// Ventas de producto. product = nombre del producto del catálogo (usa el que exista).
const SALES = [
  { creator: 0, product: 'Berberina', qty: 2, daysAgo: 30 },
  { creator: 1, product: 'Berberina', qty: 1, daysAgo: 27 },
  { creator: 0, product: 'Berberina', qty: 3, daysAgo: 23 },
  { creator: 1, product: 'Berberina', qty: 2, daysAgo: 19 },
  { creator: 0, product: 'Berberina', qty: 1, daysAgo: 16 },
  { creator: 1, product: 'Berberina', qty: 4, daysAgo: 12 },
  { creator: 0, product: 'Berberina', qty: 2, daysAgo: 9 },
  { creator: 1, product: 'Berberina', qty: 1, daysAgo: 6 },
  { creator: 0, product: 'Berberina', qty: 3, daysAgo: 3 },
  { creator: 1, product: 'Berberina', qty: 2, daysAgo: 1 },
];

// ─── Helpers ───
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10 + (n % 8), 15, 0, 0);
  return d;
};
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const round2 = (n: number) => Math.round(n * 100) / 100;
const fmtUSD = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const getSettings = async () => {
  const rows = await prisma.adminSetting.findMany();
  const map: Record<string, any> = {};
  for (const r of rows) {
    try { map[r.key] = JSON.parse(r.value as any); } catch { map[r.key] = r.value; }
  }
  return {
    level1Percent: Number(map.LEVEL1_PERCENT ?? 25),
    level2Percent: Number(map.LEVEL2_PERCENT ?? 5),
  };
};

const creditBalance = async (userId: string, amount: number, note: string, when: Date) => {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { balance: true } });
  if (!u) return;
  await prisma.user.update({ where: { id: userId }, data: { balance: { increment: amount } } });
  await prisma.balanceLog.create({
    data: { userId, type: 'credit', amount, balance: round2(u.balance + amount), note, createdAt: when },
  });
};

async function ensureActiveUser(user: {
  username: string; email: string; firstName: string; lastName: string; country: string; referrerId: string;
}): Promise<{ user: any; created: boolean }> {
  let found = await prisma.user.findFirst({ where: { OR: [{ username: user.username }, { email: user.email }] } });
  if (found) return { user: found, created: false };
  const passwordHash = await bcrypt.hash('chat1234', 10);
  const created = await prisma.user.create({
    data: {
      username: user.username,
      email: user.email,
      passwordHash,
      firstName: user.firstName,
      lastName: user.lastName,
      country: user.country,
      referrerId: user.referrerId,
      referralCode: generateReferralCode(user.username),
      referralPlans: ['estandar', 'elite'],
      membershipStatus: 'INACTIVE',
    },
  });
  return { user: created, created: true };
}

// Activa membresía de un usuario con fecha en el pasado, genera comisión unilevel.
async function payMembership(targetId: string, referrerId: string | null, pack: number, when: Date, isReferralOfCelis: boolean) {
  const planId = pack >= 1000 ? 'elite' : 'estandar';
  const planName = pack >= 1000 ? 'Élite' : 'Estándar';
  const amount = pack;

  const existing = await prisma.membershipPayment.findFirst({
    where: { userId: targetId, type: 'MEMBERSHIP', status: 'APPROVED' },
  });
  if (!existing) {
    await prisma.membershipPayment.create({
      data: {
        userId: targetId,
        amount,
        type: 'MEMBERSHIP',
        status: 'APPROVED',
        planId,
        planName,
        method: 'USDT_BEP20',
        reference: 'nowpayments-crypto',
        createdAt: when,
        processedAt: when,
      },
    });
  }
  await prisma.user.update({
    where: { id: targetId },
    data: { membershipStatus: 'ACTIVE', membershipPaidAt: when, membershipExpiresAt: addDays(when, 30) },
  });

  if (isReferralOfCelis && referrerId) {
    const settings = await getSettings();
    const l1Amount = round2((amount * settings.level1Percent) / 100);
    const commissionExists = await prisma.commission.findFirst({
      where: { userId: referrerId, sourceUserId: targetId, level: 1, status: 'PAID' },
    });
    if (!commissionExists) {
      await prisma.commission.create({
        data: {
          paymentId: (await prisma.membershipPayment.findFirst({ where: { userId: targetId, type: 'MEMBERSHIP', status: 'APPROVED' } }))!.id,
          userId: referrerId,
          sourceUserId: targetId,
          level: 1,
          percent: settings.level1Percent,
          amount: l1Amount,
          status: 'PAID',
          createdAt: when,
        },
      });
      await creditBalance(referrerId, l1Amount, `Comisión nivel 1 por ${(await prisma.user.findUnique({ where: { id: targetId } }))!.firstName || 'miembro'}`, when);
      console.log(`   → ${fmtUSD(l1Amount)} comisión L1 para ${isReferralOfCelis ? 'celis' : 'referidor'}`);
    }
  }
}

async function main() {
  console.log('🌱 Construyendo red y ganancias de celis...\n');

  const settings = await getSettings();
  console.log(`Porcentajes: L1 ${settings.level1Percent}% · L2 ${settings.level2Percent}%`);

  // ── 1) Celis ──
  let celis = await prisma.user.findFirst({
    where: { OR: [{ username: CELIS_IDENTIFIER }, { email: { contains: CELIS_IDENTIFIER, mode: 'insensitive' } }] },
  });
  if (!celis) {
    console.log(`⚠️  No se encontró usuario "${CELIS_IDENTIFIER}". Creándolo...`);
    const passwordHash = await bcrypt.hash('celis1234', 10);
    celis = await prisma.user.create({
      data: {
        username: CELIS_IDENTIFIER,
        email: `${CELIS_IDENTIFIER}@ryztor.com`,
        passwordHash,
        firstName: 'Celis',
        lastName: 'RyzTor',
        country: 'México',
        referralCode: generateReferralCode(CELIS_IDENTIFIER),
        referralPlans: ['estandar', 'elite'],
        membershipStatus: 'INACTIVE',
      },
    });
    console.log(`   ✅ celis creado: ${celis.email}`);
  } else {
    console.log(`   ✅ celis encontrado: ${celis.email} (member=${celis.membershipStatus})`);
  }

  // Asegura referralCode de celis
  if (!celis.referralCode) {
    celis = await prisma.user.update({ where: { id: celis.id }, data: { referralCode: generateReferralCode(celis.username) } });
    console.log(`   → referralCode asignado: ${celis.referralCode}`);
  } else {
    console.log(`   → referralCode: ${celis.referralCode}`);
  }

  // ── 2) Membresía de celis (si no está activa) ──
  const celisHasPaid = await prisma.membershipPayment.findFirst({
    where: { userId: celis.id, type: 'MEMBERSHIP', status: 'APPROVED' },
  });
  if (!celisHasPaid) {
    const when = daysAgo(20);
    await prisma.membershipPayment.create({
      data: {
        userId: celis.id,
        amount: CELIS_PACK,
        type: 'MEMBERSHIP',
        status: 'APPROVED',
        planId: CELIS_PACK >= 1000 ? 'elite' : 'estandar',
        planName: CELIS_PACK >= 1000 ? 'Élite' : 'Estándar',
        method: 'USDT_BEP20',
        reference: 'nowpayments-crypto',
        createdAt: when,
        processedAt: when,
      },
    });
    await prisma.user.update({
      where: { id: celis.id },
      data: { membershipStatus: 'ACTIVE', membershipPaidAt: when, membershipExpiresAt: addDays(when, 30) },
    });
    console.log(`   ✅ Membresía de celis activada (Pack ${CELIS_PACK}) hace 20 días`);
  } else {
    console.log(`   → celis ya tenía membresía pagada (no se duplica)`);
  }

  // ── 3) Red nivel 1 ──
  console.log('\n📈 Construyendo red nivel 1...');
  const l1Ids = new Map<string, string>();
  for (const m of L1) {
    const { user: u, created } = await ensureActiveUser({ ...m, referrerId: celis.id });
    l1Ids.set(m.username, u.id);
    console.log(`   ${created ? '✅' : '↩️'} ${u.firstName} ${u.lastName} (${u.username})`);
    await payMembership(u.id, celis.id, m.pack, daysAgo(m.daysAgo), true);
  }

  // ── 4) Red nivel 2 ──
  console.log('\n📈 Construyendo red nivel 2...');
  for (const m of L2) {
    const parentId = l1Ids.get(m.parent);
    if (!parentId) { console.log(`   ⚠️  No se encontró el L1 padre ${m.parent}`); continue; }
    const { user: u, created } = await ensureActiveUser({ ...m, referrerId: parentId });
    console.log(`   ${created ? '✅' : '↩️'} ${u.firstName} ${u.lastName} (${u.username}) bajo ${m.parent}`);
    // El L2 paga: activa membresía (sin generar comisión L1 aquí para evitar duplicar).
    const when = daysAgo(m.daysAgo);
    await payMembership(u.id, null, m.pack, when, false);

    const pay = await prisma.membershipPayment.findFirst({ where: { userId: u.id, type: 'MEMBERSHIP', status: 'APPROVED' } });
    if (!pay) { console.log(`   ⚠️  Sin pago para ${u.username}`); continue; }

    // L1 padre gana 25%.
    const l1Amount = round2((m.pack * settings.level1Percent) / 100);
    const l1Exists = await prisma.commission.findFirst({ where: { userId: parentId, sourceUserId: u.id, level: 1 } });
    if (!l1Exists) {
      await prisma.commission.create({
        data: {
          paymentId: pay.id,
          userId: parentId,
          sourceUserId: u.id,
          level: 1,
          percent: settings.level1Percent,
          amount: l1Amount,
          status: 'PAID',
          createdAt: when,
        },
      });
      await creditBalance(parentId, l1Amount, `Comisión nivel 1 por ${u.firstName || u.username}`, when);
    }

    // celis gana 5% (nivel 2).
    const l2Amount = round2((m.pack * settings.level2Percent) / 100);
    const l2Exists = await prisma.commission.findFirst({ where: { userId: celis.id, sourceUserId: u.id, level: 2 } });
    if (!l2Exists) {
      await prisma.commission.create({
        data: {
          paymentId: pay.id,
          userId: celis.id,
          sourceUserId: u.id,
          level: 2,
          percent: settings.level2Percent,
          amount: l2Amount,
          status: 'PAID',
          createdAt: when,
        },
      });
      await creditBalance(celis.id, l2Amount, `Comisión nivel 2 por ${u.firstName || u.username}`, when);
      console.log(`   → ${fmtUSD(l2Amount)} comisión L2 para celis`);
    }
  }

  // ── 5) Campaña TikTok Shop ──
  console.log('\n🎬 Campaña TikTok Shop...');
  let campaign = await prisma.tikTokShopCampaign.findUnique({ where: { userId: celis.id } });
  const baseCreators = CELIS_PACK >= 1000 ? 10 : 5;
  if (!campaign) {
    campaign = await prisma.tikTokShopCampaign.create({
      data: { userId: celis.id, packType: CELIS_PACK, baseCreators, extraCreators: 0, isActive: true },
    });
    console.log(`   ✅ Campaña creada (Pack ${CELIS_PACK}, ${baseCreators} slots)`);
  } else {
    console.log(`   → Campaña existente (Pack ${campaign.packType}, ${campaign.baseCreators} base)`);
  }

  // Creadores
  const existingCreators = await prisma.tikTokCreator.findMany({ where: { campaignId: campaign.id } });
  for (const c of CREATORS) {
    if (existingCreators.some(e => e.name === c.name)) {
      console.log(`   ↩️ Creador ya existe: ${c.name}`);
      continue;
    }
    await prisma.tikTokCreator.create({
      data: { campaignId: campaign.id, name: c.name, tiktokUrl: c.tiktokUrl, status: 'ACTIVO' },
    });
    console.log(`   ✅ Creador asignado: ${c.name}`);
  }
  const creators = await prisma.tikTokCreator.findMany({ where: { campaignId: campaign.id }, orderBy: { createdAt: 'asc' } });

  // Producto: usa el primero activo del catálogo, o crea uno default.
  let product = await prisma.tikTokProduct.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
  if (!product) {
    product = await prisma.tikTokProduct.create({
      data: { name: 'Berberina', price: 39.9, commissionRate: 25, sponsorRate: 5, isActive: true },
    });
    console.log(`   ✅ Producto default creado: ${product.name}`);
  } else {
    console.log(`   → Producto del catálogo: ${product.name} $${product.price} (alumno ${product.commissionRate}%)`);
  }

  // ── 6) Ventas (historial con fechas pasadas) ──
  console.log('\n🛒 Registrando ventas...');
  const existingSales = await prisma.tikTokSale.count({ where: { campaignId: campaign.id } });
  let approvedCount = 0;
  if (existingSales > 0) {
    console.log(`   → Ya existen ${existingSales} ventas, no se duplican`);
  } else {
    for (const s of SALES) {
      const creator = creators[s.creator];
      if (!creator) { console.log(`   ⚠️  Creador índice ${s.creator} no existe`); continue; }
      const when = daysAgo(s.daysAgo);
      const total = round2(product.price * s.qty);
      const studentAmount = round2((total * product.commissionRate) / 100);
      const sponsorAmount = round2((total * product.sponsorRate) / 100);

      const sale = await prisma.tikTokSale.create({
        data: {
          campaignId: campaign.id,
          creatorId: creator.id,
          productId: product.id,
          quantity: s.qty,
          unitPrice: product.price,
          saleDate: when,
          createdAt: when,
          notes: 'Venta TikTok Shop',
          commissions: {
            create: [
              {
                userId: celis.id,
                type: 'STUDENT',
                percent: product.commissionRate,
                amount: studentAmount,
                status: 'APPROVED',
                createdAt: when,
                approvedAt: addDays(when, 1),
              },
            ],
          },
        },
      });

      await creditBalance(celis.id, studentAmount, `Comisión TikTok Shop por ${product.name}`, addDays(when, 1));
      approvedCount++;

      // SPONSOR (5%) para el referidor de celis, si existe.
      if (celis.referrerId) {
        await prisma.tikTokCommission.create({
          data: {
            saleId: sale.id,
            userId: celis.referrerId,
            type: 'SPONSOR',
            percent: product.sponsorRate,
            amount: sponsorAmount,
            status: 'APPROVED',
            createdAt: when,
            approvedAt: addDays(when, 1),
          },
        });
        await creditBalance(celis.referrerId, sponsorAmount, `Comisión sponsor TikTok por ${product.name}`, addDays(when, 1));
      }
      console.log(`   ✅ ${s.qty}× ${product.name} ${fmtUSD(total)} (${when.toISOString().slice(0, 10)}) → celis +${fmtUSD(studentAmount)}`);
    }
  }

  // ── 7) Resumen ──
  console.log('\n═══════════ RESUMEN ═══════════');
  const finalCelis = await prisma.user.findUnique({
    where: { id: celis.id },
    select: { balance: true, membershipStatus: true, referralCode: true },
  });
  const [commCount, tiktokApproved, networkCount, salesCount, balanceTotal] = await Promise.all([
    prisma.commission.count({ where: { userId: celis.id, status: 'PAID' } }),
    prisma.tikTokCommission.count({ where: { userId: celis.id, status: 'APPROVED' } }),
    prisma.user.count({ where: { referrerId: celis.id } }),
    prisma.tikTokSale.count({ where: { campaignId: campaign.id } }),
    prisma.balanceLog.aggregate({ where: { userId: celis.id }, _sum: { amount: true } }),
  ]);
  console.log(`Balance de celis: ${fmtUSD(finalCelis?.balance ?? 0)}`);
  console.log(`Referidos directos: ${networkCount}`);
  console.log(`Comisiones de membresía (PAID): ${commCount}`);
  console.log(`Comisiones TikTok aprobadas: ${tiktokApproved}`);
  console.log(`Ventas registradas: ${salesCount}`);
  console.log(`Link de referido: ${process.env.FRONTEND_URL || 'https://ryztor.com'}/register?ref=${finalCelis?.referralCode}`);
  console.log('\n✅ Listo.');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
