import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Actualiza los videos de las tareas diarias para apuntar a los archivos locales
// (servidos por el frontend en /videos/). Idempotente: no borra nada.
const dayVideos = [
  { dayNumber: 1, url: '/videos/day1.mp4', provider: 'direct', duration: 28, author: 'CollazoMcl', description: 'El poder de la sugestión: cómo moldea tu personalidad desde que naces. Aprende a usarlo a tu favor.' },
  { dayNumber: 2, url: '/videos/day2.mp4', provider: 'direct', duration: 56, author: 'CollazoMcl', description: 'Las leyes mentales que gobiernan tu comportamiento: la ley del hábito y la ley de la inercia.' },
  { dayNumber: 3, url: '/videos/day3.mp4', provider: 'direct', duration: 11, author: '1% Imparable', description: 'Piensa en el éxito, obsesiónate con él, trabaja por él y el éxito llegará a ti.' },
  { dayNumber: 4, url: '/videos/day4.mp4', provider: 'direct', duration: 18, author: '1% Imparable', description: 'Disciplina: la base del éxito silencioso. No hace ruido, pero construye imperios.' },
  { dayNumber: 5, url: '/videos/day5.mp4', provider: 'direct', duration: 40, author: 'CollazoMcl', description: 'El fracaso no existe: solo datos. No vincules tu identidad a los resultados.' },
  { dayNumber: 6, url: '/videos/day6.mp4', provider: 'direct', duration: 54, author: 'CollazoMcl', description: 'La ejecución diaria sin excusas: el hábito de quienes construyen algo grande desde cero.' },
  { dayNumber: 7, url: '/videos/day7.mp4', provider: 'direct', duration: 19, author: '1% Imparable', description: 'Mentalidad sin excusas: el cielo no es tu límite, es tu punto de partida.' },
];

async function main() {
  let updated = 0;
  for (const v of dayVideos) {
    const day = await prisma.programDay.findUnique({ where: { dayNumber: v.dayNumber } });
    if (!day) continue;
    const video = await prisma.dayContent.findFirst({ where: { dayId: day.id, type: 'VIDEO' } });
    if (!video) continue;
    await prisma.dayContent.update({
      where: { id: video.id },
      data: { content: { ...(video.content as any), url: v.url, provider: v.provider, duration: v.duration, author: v.author, description: v.description } },
    });
    updated++;
  }
  console.log(`✅ Videos actualizados en ${updated} días`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
