import { PrismaClient, ContentType, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  await prisma.userProgress.deleteMany();
  await prisma.userReflection.deleteMany();
  await prisma.dayContent.deleteMany();
  await prisma.programDay.deleteMany();
  await prisma.user.deleteMany();

  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      email: 'admin@circulo1.com',
      username: 'admin',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'Circulo',
      role: UserRole.ADMIN,
    },
  });
  console.log('✅ Usuario Administrador creado (admin@circulo1.com / admin123)');

  const day1 = await prisma.programDay.create({
    data: {
      dayNumber: 1,
      title: 'Semana 1 - Día 1: Abriendo la Mente',
      description: 'Descubre tus sueños, enfrenta tus miedos y reprograma tu mentalidad',
      isActive: true,
    },
  });

  console.log('✅ Día 1 creado');

  const contents = [
    {
      dayId: day1.id,
      type: ContentType.REFLECTION,
      title: '🎯 Ejercicio: ¿Cuáles son tus sueños?',
      content: {
        prompt: 'Si no tienes sueños claros, escríbelos ahora. ¿Qué vida ideal imaginas? ¿Qué logros te harían sentir pleno? No te limites, escribe en grande.',
        placeholder: 'Mis sueños son...',
        minChars: 50,
      },
      orderIndex: 1,
      isRequired: true,
    },
    {
      dayId: day1.id,
      type: ContentType.REFLECTION,
      title: '😨 Ejercicio: ¿Qué miedos te frenan?',
      content: {
        prompt: 'Identifica tus miedos: miedo al fracaso, al qué dirán, a no ser suficiente, al cambio... Escríbelos todos. Nombrarlos les quita poder.',
        placeholder: 'Mis miedos son...',
        minChars: 30,
      },
      orderIndex: 2,
      isRequired: true,
    },
    {
      dayId: day1.id,
      type: ContentType.AFFIRMATION,
      title: '💪 Frase de Entusiasmo - Repite 3 veces',
      content: {
        text: 'YO SOY CAPAZ DE CREAR LA VIDA QUE DESEO. MI MENTE ES PODEROSA Y ESTOY REPROGRAMÁNDOLA PARA EL ÉXITO.',
        repeatCount: 3,
        instruction: 'Lee en voz alta con convicción. Siente cada palabra. Repite 3 veces seguidas.',
      },
      orderIndex: 3,
      isRequired: true,
    },
    {
      dayId: day1.id,
      type: ContentType.VIDEO,
      title: '📹 Video: Mauro Stendel - "El Poder de la Mente"',
      content: {
        url: 'https://www.facebook.com/watch/?v=1234567890',
        provider: 'facebook',
        duration: 1200,
        autoplay: false,
        description: 'Video motivacional sobre reprogramación mental. Duración: 20 min.',
      },
      orderIndex: 4,
      isRequired: true,
    },
    {
      dayId: day1.id,
      type: ContentType.QUIZ,
      title: '🧠 Quiz: Neuroentrenamiento Básico',
      content: {
        questions: [
          {
            id: 'q1',
            text: '¿Qué es la neuroplasticidad?',
            type: 'single',
            options: [
              'La capacidad del cerebro de cambiar y adaptarse',
              'Un tipo de medicamento',
              'Una enfermedad neuronal',
            ],
            correct: 0,
          },
          {
            id: 'q2',
            text: '¿Cuál de estas afirmaciones reprograma tu mente?',
            type: 'multiple',
            options: [
              'Yo soy capaz de lograr mis metas',
              'El dinero es malo',
              'La abundancia fluye hacia mí',
              'No merezco el éxito',
            ],
            correct: [0, 2],
          },
          {
            id: 'q3',
            text: 'Escribe una creencia limitante que quieres cambiar:',
            type: 'text',
            options: [],
            correct: [],
          },
        ],
        passingScore: 70,
      },
      orderIndex: 5,
      isRequired: true,
    },
    {
      dayId: day1.id,
      type: ContentType.MENTAL_EXERCISE,
      title: '🧘 Ejercicio Mental: Visualización del Futuro',
      content: {
        instruction: 'Cierra los ojos. Imagina que ya has logrado tu primer millón. ¿Cómo te sientes? ¿Qué ves a tu alrededor? ¿Quién está contigo? Vive la escena con todos tus sentidos por 5 minutos.',
        durationMinutes: 5,
        steps: [
          'Relaja tu cuerpo y respira profundo',
          'Visualiza tu meta alcanzada con detalle',
          'Siente la emoción del logro',
          'Ancla esa sensación en tu cuerpo',
        ],
      },
      orderIndex: 6,
      isRequired: false,
    },
    {
      dayId: day1.id,
      type: ContentType.CONFIDENCE_TASK,
      title: '💼 Reto de Confianza: Comparte tu Visión',
      content: {
        task: 'Cuéntale a una persona de confianza (o escríbelo en el grupo) cuál es tu meta principal para esta mentoría. Declarar tu intención la hace real.',
        evidenceType: 'text',
        description: 'La declaración pública aumenta el compromiso en un 65% según estudios.',
      },
      orderIndex: 7,
      isRequired: false,
    },
  ];

  for (const c of contents) {
    await prisma.dayContent.create({ data: c });
  }

  console.log('✅ 8 contenidos creados para Día 1');

  const day2 = await prisma.programDay.create({
    data: {
      dayNumber: 2,
      title: 'Semana 1 - Día 2: Reprogramando Creencias',
      description: 'Identifica y cambia creencias limitantes por potenciadoras',
      isActive: true,
    },
  });

  await prisma.dayContent.createMany({
    data: [
      {
        dayId: day2.id,
        type: ContentType.REFLECTION,
        title: '🔍 Detecta tus creencias limitantes',
        content: { prompt: 'Completa: "No puedo porque...", "No merezco...", "El dinero es..."', placeholder: 'Mis creencias limitantes...', minChars: 30 },
        orderIndex: 1,
        isRequired: true,
      },
      {
        dayId: day2.id,
        type: ContentType.AFFIRMATION,
        title: '🔄 Nuevas creencias potenciadoras',
        content: { text: 'MEREZCO EL ÉXITO Y LA ABUNDANCIA. EL DINERO FLUYE FÁCILMENTE HACIA MÍ. SOY CREADOR DE MI REALIDAD.', repeatCount: 5 },
        orderIndex: 2,
        isRequired: true,
      },
    ],
  });

  console.log('✅ Día 2 creado con 2 contenidos');

  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });