import { prisma } from './prisma.js';

export function randomPercent(min: number, max: number): number {
  const v = Math.random() * (max - min) + min;
  return Math.round(v * 10000) / 10000;
}

export function scheduleDailyEarnings() {
  const msUntilMidnight = () => {
    const now = new Date();
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 5, 0));
    return next.getTime() - now.getTime();
  };
  const run = async () => {
    try {
      const r = await generateDailyEarningsForDate();
      if (r.created > 0) console.log(`💰 Ganancias diarias ${r.date}: ${r.created} acreditadas`);
    } catch (e) {
      console.error('⚠️ Error en ganancias diarias:', e);
    }
  };
  setTimeout(() => {
    void run();
    setInterval(() => void run(), 24 * 60 * 60 * 1000);
  }, msUntilMidnight());
  console.log('⏰ Ganancias diarias programadas (00:05 UTC)');
}

export async function generateDailyEarningsForDate(targetDate?: Date) {
  const d = targetDate ? new Date(targetDate) : new Date();
  d.setUTCHours(0, 0, 0, 0);

  const rows = await prisma.adminSetting.findMany();
  const map: Record<string, any> = {};
  for (const r of rows) {
    try { map[r.key] = JSON.parse(r.value as any); } catch { map[r.key] = r.value; }
  }
  const plansRaw = map.PLANS ?? map.plans;
  let plans: any[] = [];
  if (plansRaw) {
    try {
      const parsed = typeof plansRaw === 'string' ? JSON.parse(plansRaw) : plansRaw;
      if (Array.isArray(parsed)) plans = parsed;
    } catch {}
  }
  if (plans.length === 0) {
    plans = [
      { id: 'estandar', name: 'Estándar', price: 500, dailyYield: null },
      { id: 'elite', name: 'Élite', price: 1000, dailyYield: null },
    ];
  }

  const eligiblePlans = plans.filter((p: any) => p.dailyYield?.enabled && p.dailyYield.min != null && p.dailyYield.max != null);
  if (eligiblePlans.length === 0) return { created: 0, skipped: 0 };

  const planById = new Map(eligiblePlans.map((p: any) => [p.id, p]));

  const users = await prisma.user.findMany({
    where: { membershipStatus: 'ACTIVE' },
    select: { id: true },
  });

  let created = 0;
  let skipped = 0;

  for (const u of users) {
    const lastPaid = await prisma.membershipPayment.findFirst({
      where: { userId: u.id, type: 'MEMBERSHIP', status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
    });
    if (!lastPaid?.planId) { skipped++; continue; }
    const plan = planById.get(lastPaid.planId);
    if (!plan) { skipped++; continue; }

    const exists = await prisma.dailyEarning.findUnique({
      where: { userId_date: { userId: u.id, date: d } },
    });
    if (exists) { skipped++; continue; }

    const min = Number(plan.dailyYield.min);
    const max = Number(plan.dailyYield.max);
    if (!(min >= 0 && max >= 0 && max >= min)) { skipped++; continue; }

    // Requiere al menos 1 referido directo ACTIVE para empezar a generar
    const directActiveForCheck = await prisma.user.count({ where: { referrerId: u.id, membershipStatus: 'ACTIVE' } });
    if (directActiveForCheck === 0) { skipped++; continue; }

    let pct = randomPercent(min, max);
    const bonusPerRef = Number(plan.dailyYield.bonusPerReferral ?? 0.02);
    const bonusCap = Number(plan.dailyYield.bonusCap ?? 0.1);
    if (bonusPerRef > 0) {
      const bonus = Math.min(directActiveForCheck * bonusPerRef, bonusCap);
      pct = Math.round((pct + bonus) * 10000) / 10000;
    }
    const price = Number(lastPaid.amount) || Number(plan.price);
    const amount = Math.round(price * pct / 100 * 100) / 100;
    if (amount <= 0) { skipped++; continue; }

    const apps = Array.isArray(plan.dailyYield.apps) ? plan.dailyYield.apps : [];
    const breakdown = apps.length > 0 ? (() => {
      const weights = apps.map(() => Math.random() + 0.5);
      const sumW = weights.reduce((a: number, b: number) => a + b, 0);
      let remaining = amount;
      return apps.map((app: any, i: number) => {
        const isLast = i === apps.length - 1;
        const share = isLast ? remaining : Math.round(amount * weights[i] / sumW * 100) / 100;
        if (!isLast) remaining = Math.round((remaining - share) * 100) / 100;
        const appPct = price > 0 ? Math.round(share / price * 100 * 10000) / 10000 : 0;
        return { name: app.name, logo: app.logo || null, url: app.url || null, percent: appPct, amount: share };
      });
    })() : null;

    await prisma.$transaction(async (tx) => {
      await tx.dailyEarning.create({
        data: {
          userId: u.id,
          planId: plan.id,
          date: d,
          percent: pct,
          amount,
          priceSnapshot: price,
          breakdown: breakdown as any,
        },
      });
      const cur = await tx.user.findUnique({ where: { id: u.id }, select: { balance: true } });
      const nextBal = Math.round(((cur?.balance ?? 0) + amount) * 100) / 100;
      await tx.user.update({ where: { id: u.id }, data: { balance: nextBal } });
      await tx.balanceLog.create({
        data: { userId: u.id, type: 'credit', amount, balance: nextBal, note: `Ganancia diaria ${plan.name} ${pct}%` },
      });
    });
    created++;
  }

  return { created, skipped, date: d.toISOString().slice(0, 10) };
}
