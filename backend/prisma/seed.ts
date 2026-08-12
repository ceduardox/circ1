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
      referralCode: 'ADMIN1',
    },
  });
  console.log('✅ Usuario Administrador creado (admin@circulo1.com / admin123)');

  // ═══════════════════════════════════════════════════════════
  // DÍA 1: Despertar — Conociéndote a Ti Mismo (11 contenidos)
  // ═══════════════════════════════════════════════════════════
  const day1 = await prisma.programDay.create({
    data: { dayNumber: 1, title: 'Despertar: Conociéndote a Ti Mismo', description: 'El primer paso es conocerte. Descubre tus sueños, enfrenta tus miedos y establece tu intención.', isActive: true },
  });
  await prisma.dayContent.createMany({ data: [
    { dayId: day1.id, type: ContentType.REFLECTION, title: 'Tus Sueños y Deseos', content: { prompt: 'Si no tienes sueños claros, escríbelos ahora. ¿Qué vida ideal imaginas? ¿Qué logros te harían sentir pleno? No te limites, escribe en grande.', placeholder: 'Mis sueños más grandes son...', minChars: 80 }, orderIndex: 1, isRequired: true },
    { dayId: day1.id, type: ContentType.REFLECTION, title: 'Tus Miedos y Limitaciones', content: { prompt: 'Identifica tus miedos: miedo al fracaso, al qué dirán, a no ser suficiente, al cambio... Escríbelos todos. Nombrarlos les quita poder.', placeholder: 'Los miedos que me frenan son...', minChars: 50 }, orderIndex: 2, isRequired: true },
    { dayId: day1.id, type: ContentType.AFFIRMATION, title: 'Afirmación de Poder Personal', content: { text: 'YO SOY CAPAZ DE CREAR LA VIDA QUE DESEO. MI MENTE ES PODEROSA Y ESTOY REPROGRAMÁNDOLA PARA EL ÉXITO. MEREZCO TODO LO BUENO QUE LA VIDA TIENE PARA MÍ.', repeatCount: 5, instruction: 'Lee en voz alta con convicción. Siente cada palabra en tu cuerpo. Repite 5 veces.' }, orderIndex: 3, isRequired: true },
    { dayId: day1.id, type: ContentType.VIDEO, title: 'El Poder de Tu Mente', content: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', provider: 'youtube', duration: 600, description: 'Descubre cómo tu cerebro puede ser reprogramado para alcanzar el éxito. 10 min.' }, orderIndex: 4, isRequired: true },
    { dayId: day1.id, type: ContentType.QUIZ, title: 'Quiz: Fundamentos del Neuroentrenamiento', content: { questions: [
      { id: 'q1', text: '¿Qué es la neuroplasticidad?', type: 'single', options: ['La capacidad del cerebro de cambiar y crear nuevas conexiones', 'Un tipo de medicamento', 'Una enfermedad neuronal'], correct: 0 },
      { id: 'q2', text: '¿Cuál de estas es una afirmación potenciadora?', type: 'single', options: ['No puedo hacer nada bien', 'Soy capaz de lograr mis metas con esfuerzo', 'El éxito es solo para otros'], correct: 1 },
      { id: 'q3', text: '¿Cuántas veces al día deberías repetir tus afirmaciones?', type: 'single', options: ['Una vez a la semana', 'Al menos 3 veces al día', 'Solo cuando te sientas mal'], correct: 1 },
    ], passingScore: 70 }, orderIndex: 5, isRequired: true },
    { dayId: day1.id, type: ContentType.MENTAL_EXERCISE, title: 'Visualización: Tu Yo Futuro', content: { instruction: 'Cierra los ojos y respira profundo 3 veces. Imagina que es 1 año desde hoy y ya lograste tu meta principal. ¿Cómo te sientes? ¿Qué ves? Vive esa escena.', durationMinutes: 5, steps: ['Respira profundo 3 veces y relaja tu cuerpo', 'Imagina tu día perfecto un año desde hoy', 'Visualiza los detalles: lugar, personas, emociones', 'Siente la gratitud y la alegría del logro', 'Ancla esa sensación apretando tu puño'] }, orderIndex: 6, isRequired: false },
    { dayId: day1.id, type: ContentType.CONFIDENCE_TASK, title: 'Reto: Declaración Pública', content: { task: 'Escribe en el grupo: "Mi meta principal esta semana es..." y "Lo que más me motiva es...". Declarar tu intención la hace real.', evidenceType: 'text', description: 'La declaración pública aumenta la probabilidad de cumplir tu meta en un 65%.' }, orderIndex: 7, isRequired: false },
    { dayId: day1.id, type: ContentType.INTERACTIVE_EXERCISE, title: '🔗 Conecta: Sueños vs Miedos', content: { type: 'matching', instruction: 'Conecta cada sueño con el miedo que lo bloquea.', pairs: [
      { left: 'Quiero emprender', right: 'Miedo al fracaso' },
      { left: 'Quiero vender más', right: 'Miedo al rechazo' },
      { left: 'Quiero hablar en público', right: 'Miedo al qué dirán' },
      { left: 'Quiero ganar más dinero', right: 'Miedo a no ser suficiente' },
    ]}, orderIndex: 8, isRequired: true },
    { dayId: day1.id, type: ContentType.INTERACTIVE_EXERCISE, title: '📊 Autoevaluación: ¿Dónde Estás?', content: { type: 'scale', instruction: 'Evalúa honestamente tu situación actual del 1 al 10.', questions: [
      { id: 'q1', question: '¿Qué tan claro tienes tus sueños?', lowLabel: 'Confundido', highLabel: 'Cristalino' },
      { id: 'q2', question: '¿Qué tan fuerte sientes tus miedos?', lowLabel: 'No me afectan', highLabel: 'Me paralizan' },
      { id: 'q3', question: '¿Qué tan motivado estás para cambiar?', lowLabel: 'Sin energía', highLabel: 'Imparable' },
    ]}, orderIndex: 9, isRequired: true },
  ]});
  console.log('✅ Día 1: 9 contenidos');

  // ═══════════════════════════════════════════════════════════
  // DÍA 2: Creencias — Reprogramando Tu Mente (10 contenidos)
  // ═══════════════════════════════════════════════════════════
  const day2 = await prisma.programDay.create({
    data: { dayNumber: 2, title: 'Creencias: Reprogramando Tu Mente', description: 'Identifica las creencias limitantes que te bloquean y reemplázalas por creencias potenciadoras.', isActive: true },
  });
  await prisma.dayContent.createMany({ data: [
    { dayId: day2.id, type: ContentType.REFLECTION, title: 'Detecta tus Creencias Limitantes', content: { prompt: 'Completa con honestidad: "No puedo porque...", "No merezco...", "El dinero es...", "El éxito es...". Estas son tus creencias limitantes.', placeholder: 'Mis creencias limitantes son...', minChars: 60 }, orderIndex: 1, isRequired: true },
    { dayId: day2.id, type: ContentType.REFLECTION, title: 'Transforma tus Creencias', content: { prompt: 'Toma cada creencia limitante y escríbela como potenciadora. Ej: "No puedo" → "Estoy aprendiendo y creciendo cada día".', placeholder: 'Mis nuevas creencias potenciadoras son...', minChars: 60 }, orderIndex: 2, isRequired: true },
    { dayId: day2.id, type: ContentType.AFFIRMATION, title: 'Afirmaciones de Reprogramación', content: { text: 'MEREZCO EL ÉXITO Y LA ABUNDANCIA. MI MENTE CREA MI REALIDAD. CADA DÍA SOY MEJOR VERSIÓN DE MÍ MISMO. EL DINERO ES UNA HERRAMIENTA QUE ME AYUDA A CREAR IMPACTO.', repeatCount: 5, instruction: 'Mírate al espejo, sostén tu mirada y repite cada afirmación 5 veces. Cree lo que dices.' }, orderIndex: 3, isRequired: true },
    { dayId: day2.id, type: ContentType.VIDEO, title: 'Cómo Cambiar tus Creencias', content: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', provider: 'youtube', duration: 720, description: 'La ciencia detrás de por qué las creencias nos controlan y cómo cambiarlas conscientemente. 12 min.' }, orderIndex: 4, isRequired: true },
    { dayId: day2.id, type: ContentType.QUIZ, title: 'Quiz: Creencias y Mentalidad', content: { questions: [
      { id: 'q1', text: '¿Qué es una creencia limitante?', type: 'single', options: ['Una idea que nos impide avanzar', 'Un hecho científico', 'Una opinión ajena'], correct: 0 },
      { id: 'q2', text: '¿Cómo se cambia una creencia limitante?', type: 'single', options: ['Ignorarla', 'Reemplazarla conscientemente con una potenciadora', 'Hablar de ella con todos'], correct: 1 },
      { id: 'q3', text: '¿Cuándo repetir las nuevas creencias?', type: 'single', options: ['Solo los domingos', 'Al despertar y antes de dormir', 'Cuando te sientas mal'], correct: 1 },
    ], passingScore: 70 }, orderIndex: 5, isRequired: true },
    { dayId: day2.id, type: ContentType.MENTAL_EXERCISE, title: 'Reescribe tu Historia', content: { instruction: 'Piensa en un evento del pasado que te hizo creer algo negativo. Reescríbelo: ¿Qué aprendiste? ¿Cómo te hizo más fuerte?', durationMinutes: 8, steps: ['Identifica un evento pasado que te marcó negativamente', 'Escribe la creencia que te dejó', 'Busca 3 cosas positivas de ese evento', 'Escribe una nueva historia: "Eso pasó para enseñarme que..."', 'Repite la nueva historia 3 veces en voz alta'] }, orderIndex: 6, isRequired: true },
    { dayId: day2.id, type: ContentType.CONFIDENCE_TASK, title: 'Reto: Carta de Gratitud', content: { task: 'Escribe 10 cosas por las que estás genuinamente agradecido hoy. La gratitud reprograma tu cerebro para ver oportunidades.', evidenceType: 'text', description: 'Estudios muestran que escribir gratitud diaria aumenta la felicidad en un 25% en 2 semanas.' }, orderIndex: 7, isRequired: false },
    { dayId: day2.id, type: ContentType.INTERACTIVE_EXERCISE, title: '🔗 Conecta: Limitante → Potenciadora', content: { type: 'matching', instruction: 'Conecta cada creencia limitante con su versión potenciadora.', pairs: [
      { left: '"No merezco el éxito"', right: '"Merezco todo lo bueno que doy"' },
      { left: '"El dinero es malo"', right: '"El dinero es una herramienta de impacto"' },
      { left: '"No soy suficiente"', right: '"Estoy en constante evolución"' },
      { left: '"Siempre fracaso"', right: '"Cada intento me enseña algo nuevo"' },
    ]}, orderIndex: 8, isRequired: true },
    { dayId: day2.id, type: ContentType.INTERACTIVE_EXERCISE, title: '✏️ Completa: Tus Nuevas Creencias', content: { type: 'fill_blanks', instruction: 'Completa cada frase con tu propia creencia potenciadora.', sentences: [
      { id: 's1', text: 'Merezco el éxito porque ___.', answer: 'trabajo duro' },
      { id: 's2', text: 'El dinero fluye hacia mí cuando ___.', answer: 'creo valor' },
      { id: 's3', text: 'Soy capaz de lograr ___.', answer: 'mis metas' },
    ]}, orderIndex: 9, isRequired: true },
    { dayId: day2.id, type: ContentType.INTERACTIVE_EXERCISE, title: '📊 Autoevaluación: Tus Creencias', content: { type: 'scale', instruction: 'Evalúa qué tan fuertes son tus creencias potenciadoras.', questions: [
      { id: 'q1', question: '¿Qué tan presente está "no merezco" en tu mente?', lowLabel: 'Nunca', highLabel: 'Constantemente' },
      { id: 'q2', question: '¿Qué tan seguido te saboteas con pensamientos negativos?', lowLabel: 'Rara vez', highLabel: 'Siempre' },
    ]}, orderIndex: 10, isRequired: true },
  ]});
  console.log('✅ Día 2: 10 contenidos');

  // ═══════════════════════════════════════════════════════════
  // DÍA 3: Visión — Construyendo tu Mapa del Futuro (11 contenidos)
  // ═══════════════════════════════════════════════════════════
  const day3 = await prisma.programDay.create({
    data: { dayNumber: 3, title: 'Visión: Construyendo tu Mapa del Futuro', description: 'Sin dirección clara, cualquier viento te lleva. Hoy trazas tu mapa.', isActive: true },
  });
  await prisma.dayContent.createMany({ data: [
    { dayId: day3.id, type: ContentType.REFLECTION, title: 'Carta a tu Yo del Futuro', content: { prompt: 'Escribe una carta a ti mismo dentro de 1 año. Cuéntale qué hiciste, qué aprendiste, qué te prometes.', placeholder: 'Querido yo del futuro...', minChars: 150 }, orderIndex: 1, isRequired: true },
    { dayId: day3.id, type: ContentType.REFLECTION, title: 'Mapa de tu Vida: 5 Áreas', content: { prompt: 'Evalúa del 1 al 10: Salud, Finanzas, Relaciones, Propósito, Crecimiento. ¿Qué necesitas mejorar?', placeholder: 'Salud: _/10\nFinanzas: _/10\nRelaciones: _/10\nPropósito: _/10\nCrecimiento: _/10', minChars: 100 }, orderIndex: 2, isRequired: true },
    { dayId: day3.id, type: ContentType.AFFIRMATION, title: 'Afirmaciones de Visión Clara', content: { text: 'MI VISIÓN ES TAN CLARA QUE NO PUEDO ERRARLA. CADA CELULA DE MI CUERPO SABE HACIA DONDE VAMOS. SOY UN COMPÁS QUE SIEMPRE APUNTA A MI DESTINO.', repeatCount: 5, instruction: 'Mira al frente a un punto fijo y repite. Tu mirada y voz deben estar alineadas.' }, orderIndex: 3, isRequired: true },
    { dayId: day3.id, type: ContentType.VIDEO, title: 'El Poder de la Visualización', content: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', provider: 'youtube', duration: 780, description: 'Los atletas olímpicos visualizan sus victorias antes de competir. Aprende la técnica. 13 min.' }, orderIndex: 4, isRequired: true },
    { dayId: day3.id, type: ContentType.QUIZ, title: 'Quiz: Ciencia de la Visualización', content: { questions: [
      { id: 'q1', text: '¿Qué descubrió la neurociencia sobre la visualización?', type: 'single', options: ['El cerebro no distingue entre real y visualizado con detalle', 'Solo sirve para atletas', 'No tiene efecto'], correct: 0 },
      { id: 'q2', text: '¿Qué porcentaje del cerebro se activa al visualizar vívidamente?', type: 'single', options: ['5%', '90%, similar a hacerlo realmente', 'Nada'], correct: 1 },
      { id: 'q3', text: '¿Cuándo es mejor visualizar?', type: 'single', options: ['Solo en cumpleaños', 'Al despertar y antes de dormir', 'Nunca'], correct: 1 },
    ], passingScore: 70 }, orderIndex: 5, isRequired: true },
    { dayId: day3.id, type: ContentType.MENTAL_EXERCISE, title: 'Recorrido por tu Futuro', content: { instruction: 'Vive un día completo de tu futuro ideal. Usa todos tus sentidos.', durationMinutes: 12, steps: ['Respira profundo 5 veces, relaja tu cuerpo', 'Despiertas en tu hogar ideal: ¿cómo se siente?', 'Caminas por tu casa: colores, sonidos, olores', 'Miras por la ventana: ¿dónde estás?', 'Desayunas algo delicioso: ¿sabor, compañía?', 'Sal a tu actividad ideal: ¿qué emoción te lleva?', 'Al final del día, agradeces. ¿Qué lograste?'] }, orderIndex: 6, isRequired: true },
    { dayId: day3.id, type: ContentType.CONFIDENCE_TASK, title: 'Reto: Tablero de Visión Digital', content: { task: 'Crea un tablero en Canva o Pinterest con 15 imágenes: cuerpo ideal, hogar, trabajo, viajes, relaciones, finanzas. Guárdalo como fondo de pantalla.', evidenceType: 'text', description: 'El 80% de los atletas olímpicos usan visualización. Tu cerebro trabaja 24/7 hacia lo que le muestra.' }, orderIndex: 7, isRequired: false },
    { dayId: day3.id, type: ContentType.INTERACTIVE_EXERCISE, title: '🧩 Puzzle: Meta SMART', content: { type: 'puzzle', instruction: 'Arrastra cada palabra al lugar correcto para completar la fórmula SMART.', pieces: ['ESPECÍFICA', 'MEDIBLE', 'ALCANZABLE', 'RELEVANTE', 'CON TIEMPO'], slots: ['Una meta ___ tiene un número claro', 'Una meta ___ se puede medir', 'Una meta ___ es posible lograr', 'Una meta ___ importa para ti', 'Una meta ___ tiene fecha límite'] }, orderIndex: 8, isRequired: true },
    { dayId: day3.id, type: ContentType.INTERACTIVE_EXERCISE, title: '📋 Ordena: Pasos para Definir Metas', content: { type: 'ordering', instruction: 'Ordena los pasos para crear metas poderosas.', items: ['Visualizar tu futuro ideal', 'Identificar tus 5 áreas de vida', 'Definir 3 metas SMART por mes', 'Escribirlas y revisarlas semanalmente', 'Celebrar cada mini-logro'] }, orderIndex: 9, isRequired: true },
    { dayId: day3.id, type: ContentType.INTERACTIVE_EXERCISE, title: '📊 Autoevaluación: Tu Claridad', content: { type: 'scale', instruction: 'Evalúa tu nivel de claridad de visión.', questions: [
      { id: 'q1', question: '¿Qué tan claro ves tu futuro ideal?', lowLabel: 'Borroso', highLabel: 'Cristalino' },
      { id: 'q2', question: '¿Qué tan concretas son tus metas?', lowLabel: 'Vagas', highAction: 'Muy específicas' },
      { id: 'q3', question: '¿Qué tan comprometido estás con tus metas?', lowLabel: 'Despistado', highLabel: 'Obsesionado' },
    ]}, orderIndex: 10, isRequired: true },
  ]});
  console.log('✅ Día 3: 10 contenidos');

  // ═══════════════════════════════════════════════════════════
  // DÍA 4: Disciplina — El Arte de Ser Constante (11 contenidos)
  // ═══════════════════════════════════════════════════════════
  const day4 = await prisma.programDay.create({
    data: { dayNumber: 4, title: 'Disciplina: El Arte de Ser Constante', description: 'La motivación enciende el fuego, pero la disciplina lo mantiene ardiendo.', isActive: true },
  });
  await prisma.dayContent.createMany({ data: [
    { dayId: day4.id, type: ContentType.REFLECTION, title: 'Auditoría de Tiempo', content: { prompt: '¿Dónde se te va el tiempo? Cuántas horas en celular, cuántas en actividades que no te acercan a tu meta.', placeholder: 'Mi desglose:\nSueño: _h\nTrabajo: _h\nCelular/redes: _h\nEjercicio: _h\nTiempo "perdido": _h', minChars: 100 }, orderIndex: 1, isRequired: true },
    { dayId: day4.id, type: ContentType.REFLECTION, title: 'Tu Protocolo Mañana y Noche', content: { prompt: 'Diseña 2 rutinas de 15 min: una para al despertar y una antes de dormir. Define hora, lugar, acción exacta.', placeholder: '🌅 Mañana (15 min): ...\n🌙 Noche (15 min): ...', minChars: 100 }, orderIndex: 2, isRequired: true },
    { dayId: day4.id, type: ContentType.AFFIRMATION, title: 'Afirmaciones de Disciplina', content: { text: 'LA DISCIPLINA ES MI SUPERPODER. HAGO LO QUE DEBO, CUANDO DEBO, SIN EXCUSAS. CADA PEQUEÑA ACCIÓN CONSTRUYE MI IMPERIO.', repeatCount: 7, instruction: 'Levántate de un salto y repite con energía. Tu cuerpo debe estar en modo acción.' }, orderIndex: 3, isRequired: true },
    { dayId: day4.id, type: ContentType.VIDEO, title: 'La Regla de los 2 Minutos', content: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', provider: 'youtube', duration: 660, description: 'David Allen explica la técnica más poderosa para vencer la procrastinación. 11 min.' }, orderIndex: 4, isRequired: true },
    { dayId: day4.id, type: ContentType.QUIZ, title: 'Quiz: Neurociencia de los Hábitos', content: { questions: [
      { id: 'q1', text: '¿Qué parte del cerebro almacena hábitos?', type: 'single', options: ['Corteza prefrontal', 'Ganglios basales', 'Cerebelo'], correct: 1 },
      { id: 'q2', text: '¿Qué es la ley de los 2 minutos?', type: 'single', options: ['Hacer más de 100 hábitos', 'Si toma menos de 2 min, hazlo ahora', 'Esperar 2 min antes de actuar'], correct: 1 },
      { id: 'q3', text: '¿Por qué fallamos al crear hábitos?', type: 'single', options: ['Somos débiles', 'Empezamos demasiado grande', 'Los hábitos no funcionan'], correct: 1 },
      { id: 'q4', text: '¿Qué es más poderoso para mantener hábitos?', type: 'single', options: ['Motivación diaria', 'Sistema y rutina automática', 'Fuerza de voluntad'], correct: 1 },
    ], passingScore: 70 }, orderIndex: 5, isRequired: true },
    { dayId: day4.id, type: ContentType.MENTAL_EXERCISE, title: 'Método de Hábitos Encadenados', content: { instruction: 'Crea tu cadena de hábitos conectando uno nuevo a uno existente.', durationMinutes: 8, steps: ['Elige UN hábito de menos de 2 minutos', 'Conéctalo a un hábito existente', 'Escribe: "Después de [existente], haré [nuevo]"', 'Visualiza la cadena por 21 días', 'Prepara tu plan para el día 5 (cuando quieras abandonar)', 'Define tu recompensa diaria'] }, orderIndex: 6, isRequired: true },
    { dayId: day4.id, type: ContentType.CONFIDENCE_TASK, title: 'Reto: Mini Hábito por 3 Días', content: { task: 'Elige UN mini hábito (menos de 2 min) y hazlo por 3 días: leer 1 página, 5 flexiones, 1 min meditación, 3 gratitudes. Comprométete aquí.', evidenceType: 'text', description: 'El 80% que empieza con mini hábitos lo mantiene. El 20% que empieza grande lo abandona.' }, orderIndex: 7, isRequired: true },
    { dayId: day4.id, type: ContentType.INTERACTIVE_EXERCISE, title: '🎭 Escenario: Hábitos Bajo Presión', content: { type: 'scenarios', instruction: 'Lee cada situación y elige la mejor respuesta para mantener tus hábitos.', scenarios: [
      { situation: 'Llevas 5 días meditando. El día 6 amaneces con prisa y piensas "hoy no puedo". ¿Qué haces?', options: ['Skip today', 'Medito 1 min: la versión mínima', 'Lo dejo, no sirve', 'Medito 10 min para compensar'], correct: 1, explanation: 'Mejor versión mínima que romper la cadena. La constancia supera la intensidad.' },
      { situation: 'Tu cliente dice "no tengo presupuesto". ¿Qué respondes?', options: ['Ok, cuando tengas me llamas', '¿Cuánto presupuesto tienes disponible?', 'Es una inversión, ¿cuánto vale resolver tu problema?', 'Te hago un descuento'], correct: 2, explanation: 'Reencuadra: no es "costo" sino "inversión". Conecta valor con necesidad.' },
    ]}, orderIndex: 8, isRequired: true },
    { dayId: day4.id, type: ContentType.INTERACTIVE_EXERCISE, title: '🧩 Puzzle: La Fórmula del Hábito', content: { type: 'puzzle', instruction: 'Arrastra cada pieza al lugar correcto según James Clear.', pieces: ['SEÑAL', 'RUTINA', 'RECOMPENSA', 'CREENCIA'], slots: ['El ___ activa el comportamiento', 'La ___ es la acción que realizas', 'La ___ refuerza el hábito', 'La ___ lo hace permanente'] }, orderIndex: 9, isRequired: true },
    { dayId: day4.id, type: ContentType.INTERACTIVE_EXERCISE, title: '📊 Autoevaluación: Tu Disciplina', content: { type: 'scale', instruction: 'Evalúa tu nivel de disciplina actual.', questions: [
      { id: 'q1', question: '¿Qué tan seguido haces lo que te propones?', lowLabel: 'Rara vez', highLabel: 'Siempre' },
      { id: 'q2', question: '¿Qué tan bien mantienes una rutina de mañana?', lowLabel: 'No tengo', highLabel: 'Perfecta' },
      { id: 'q3', question: '¿Qué tan rápido actúas cuando sabes qué hacer?', lowLabel: 'Procrastino', highLabel: 'Inmediato' },
    ]}, orderIndex: 10, isRequired: true },
  ]});
  console.log('✅ Día 4: 10 contenidos');

  // ═══════════════════════════════════════════════════════════
  // DÍA 5: Emociones — El GPS de tu Vida (11 contenidos)
  // ═══════════════════════════════════════════════════════════
  const day5 = await prisma.programDay.create({
    data: { dayNumber: 5, title: 'Emociones: El GPS de tu Vida', description: 'Tus emociones no son el enemigo, son tu sistema de navegación más preciso.', isActive: true },
  });
  await prisma.dayContent.createMany({ data: [
    { dayId: day5.id, type: ContentType.REFLECTION, title: 'Tu Mapa Emocional del Día', content: { prompt: 'Reproduce tu día de ayer. ¿Qué momentos te hicieron sentir feliz? ¿Enojado? ¿Ansioso? ¿Orgulloso? Traza tu línea emocional.', placeholder: 'Mi mapa emocional:\n7am: me sentí...\n10am: me sentí...\n1pm: me sentí...\n4pm: me sentí...', minChars: 100 }, orderIndex: 1, isRequired: true },
    { dayId: day5.id, type: ContentType.REFLECTION, title: 'El Semáforo Emocional', content: { prompt: 'Para cada emoción escribe: ¿cuándo aparece? ¿Qué la dispara? ¿Qué haces cuando la sientes?\n🔴 IRAN\n🟡 FRUSTRACIÓN\n🟢 GRATITUD\n🔵 CALMA', placeholder: '🔴 IRAN: ...\n🟡 FRUSTRACIÓN: ...\n🟢 GRATITUD: ...\n🔵 CALMA: ...', minChars: 80 }, orderIndex: 2, isRequired: true },
    { dayId: day5.id, type: ContentType.AFFIRMATION, title: 'Afirmaciones de Maestría Emocional', content: { text: 'SOY DUEÑO DE MIS EMOCIONES, NO SU ESCLAVO. CADA EMOCIÓN ES UN MENSAJE, NO UNA SENTENCIA. ELIJO RESPONDER CON SABIDURÍA.', repeatCount: 5, instruction: 'Mano en el pecho, siente tu corazón. Repite como la verdad absoluta.' }, orderIndex: 3, isRequired: true },
    { dayId: day5.id, type: ContentType.VIDEO, title: 'El Secreto de los 90 Segundos', content: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', provider: 'youtube', duration: 840, description: 'La Dra. Jill Bolte Taylor descubrió por qué una emoción dura exactamente 90 segundos. 14 min.' }, orderIndex: 4, isRequired: true },
    { dayId: day5.id, type: ContentType.QUIZ, title: 'Quiz: Inteligencia Emocional', content: { questions: [
      { id: 'q1', text: '¿Cuánto dura el ciclo químico de una emoción?', type: 'single', options: ['10 segundos', '90 segundos', '10 minutos'], correct: 1 },
      { id: 'q2', text: '¿Qué es la ventana de tolerancia?', type: 'single', options: ['Un espacio físico', 'El rango de emociones que puedes manejar', 'Un tipo de medicación'], correct: 1 },
      { id: 'q3', text: '¿Qué es la etiqueta emocional?', type: 'single', options: ['Ponerle nombre para reducir intensidad', 'Esconder emociones', 'Ignorar lo que sientes'], correct: 0 },
      { id: 'q4', text: '¿Cuál es la emoción más difícil?', type: 'single', options: ['La alegría', 'La vergüenza (ataca la identidad)', 'La tristeza'], correct: 1 },
    ], passingScore: 70 }, orderIndex: 5, isRequired: true },
    { dayId: day5.id, type: ContentType.MENTAL_EXERCISE, title: 'Técnica STOP: El Freno Emocional', content: { instruction: 'Aprende STOP: S(Para), T(Respira), O(Observa), P(Procede). La herramienta más poderosa.', durationMinutes: 10, steps: ['S - PARA: Detente físicamente', 'T - RESPIRA: 3 respiraciones (4 seg inhalar, 4 sostener, 6 exhalar)', 'O - OBSERVA: ¿Qué siento? ¿Dónde? ¿Qué necesito?', 'P - PROCEDE: Elige tu respuesta conscientemente', 'Practica con una situación real de hoy'] }, orderIndex: 6, isRequired: true },
    { dayId: day5.id, type: ContentType.CONFIDENCE_TASK, title: 'Reto: Diario Emocional 24h', content: { task: 'Registra CADA emoción por 24h (mínimo 5). Para cada una: hora, nombre, intensidad 1-10, trigger, qué hiciste.', evidenceType: 'text', description: 'Las personas con alta IE se auto-monitorean 3 veces más que las promedio.' }, orderIndex: 7, isRequired: false },
    { dayId: day5.id, type: ContentType.INTERACTIVE_EXERCISE, title: '🔗 Conecta: Emoción → Respuesta', content: { type: 'matching', instruction: 'Conecta cada emoción con la mejor estrategia de regulación.', pairs: [
      { left: 'IRA intensa', right: 'Respiración 4-7-8 y caminar 90 seg' },
      { left: 'ANSIEDAD', right: 'Grounding: 5 cosas que ves, 4 que tocas' },
      { left: 'FRUSTRACIÓN', right: 'Preguntar: ¿Qué puedo controlar?' },
      { left: 'MIEDO', right: 'Visualizar peor escenario y plan B' },
      { left: 'TRISTEZA', right: 'Permitirte 10 min, luego acción pequeña' },
    ]}, orderIndex: 8, isRequired: true },
    { dayId: day5.id, type: ContentType.INTERACTIVE_EXERCISE, title: '🎭 Escenario: Emociones en Venta', content: { type: 'scenarios', instruction: 'Un cliente te rechaza en vivo. ¿Cómo manejas tus emociones?', scenarios: [
      { situation: 'Llevas 20 min de presentación y el cliente dice "no me interesa". Sientes que se te acelera el corazón. ¿Qué haces?', options: ['Sigo hablando desesperado', 'Respiro, observo la emoción, y pregunto: "¿Qué necesitarías?"', 'Me voy enojado', 'Le digo que está equivocado'], correct: 1, explanation: 'STOP en acción: para, respira, observa, y elige una respuesta consciente.' },
      { situation: 'Tu competencia tiene mejor precio y el cliente te lo dice. Sientes envidia. ¿Qué haces?', options: ['Le digo que la competencia es mala', 'Reconozco la emoción y me enfoco en mi propuesta de valor', 'Le bajo el precio automáticamente', 'Me rindo'], correct: 1, explanation: 'La envidia es una señal de que quieres ese resultado. Úsala como combustible, no como veneno.' },
    ]}, orderIndex: 9, isRequired: true },
    { dayId: day5.id, type: ContentType.INTERACTIVE_EXERCISE, title: '📊 Autoevaluación: Tu IE', content: { type: 'scale', instruction: 'Evalúa tu inteligencia emocional.', questions: [
      { id: 'q1', question: '¿Qué tan bien identificas lo que sientes?', lowLabel: 'No tengo idea', highLabel: 'Al instante' },
      { id: 'q2', question: '¿Qué tan bien manejas la ira?', lowLabel: 'Exploto', highLabel: 'Calma total' },
      { id: 'q3', question: '¿Qué tan fácil empatizas con otros?', lowLabel: 'Difícil', highLabel: 'Natural' },
    ]}, orderIndex: 10, isRequired: true },
  ]});
  console.log('✅ Día 5: 10 contenidos');

  // ═══════════════════════════════════════════════════════════
  // DÍA 6: Acción — De la Parálisis al Momentum (11 contenidos)
  // ═══════════════════════════════════════════════════════════
  const day6 = await prisma.programDay.create({
    data: { dayNumber: 6, title: 'Acción: De la Parálisis al Momentum', description: 'El conocimiento sin acción es información muerta. Hoy activas el modo guerrero.', isActive: true },
  });
  await prisma.dayContent.createMany({ data: [
    { dayId: day6.id, type: ContentType.REFLECTION, title: 'Análisis de Parálisis', content: { prompt: '¿Qué meta importante NO estás persiguiendo? ¿Qué excusas usas? Escribe TODAS y táchalas una por una.', placeholder: 'Mi meta que postergo: ...\nMis excusas (las tacho):\n1. ❌ ...\n2. ❌ ...\nLa verdad es...', minChars: 100 }, orderIndex: 1, isRequired: true },
    { dayId: day6.id, type: ContentType.REFLECTION, title: 'Tu Primera Acción en 24h', content: { prompt: 'Define UNA acción: "Voy a [ACCIÓN] el [DÍA] a las [HORA] en [LUGAR] con [RECURSO]". Hazlo tan concreto que sea imposible no hacerlo.', placeholder: 'Qué: ...\nCuándo: ...\nDónde: ...\nNecesito: ...\nSi no lo hago: ...\nSi lo hago: ...', minChars: 100 }, orderIndex: 2, isRequired: true },
    { dayId: day6.id, type: ContentType.AFFIRMATION, title: 'Afirmaciones de Acción', content: { text: 'SOY UNA MÁQUINA DE ACCIÓN. NO ESPERO LA MOTIVACIÓN, LA CREO. CADA DÍA HAGO ALGO QUE ME DA MIEDO. EL MIEDO ES MI BRÚJULA.', repeatCount: 5, instruction: 'Puños levantados, repite con poder. Tu cuerpo debe sentirse listo para la batalla.' }, orderIndex: 3, isRequired: true },
    { dayId: day6.id, type: ContentType.VIDEO, title: 'La Regla 5 Segundos de Mel Robbins', content: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', provider: 'youtube', duration: 900, description: 'Mel Robbins: cuando sepas qué hacer, cuenta 5-4-3-2-1 y ACTÚA. Sin pensar. 15 min.' }, orderIndex: 4, isRequired: true },
    { dayId: day6.id, type: ContentType.QUIZ, title: 'Quiz: Psicología de la Acción', content: { questions: [
      { id: 'q1', text: '¿Qué descubrió Mel Robbins?', type: 'single', options: ['Es un problema de pereza', 'La cuenta de 5 segundos vence el miedo', 'No tiene solución'], correct: 1 },
      { id: 'q2', text: '¿Qué es la Ley del Mínimo Esfuerzo?', type: 'single', options: ['Hacer siempre lo mínimo', 'Empezar con la acción más pequeña para crear momentum', 'No hacer nada'], correct: 1 },
      { id: 'q3', text: '¿Por qué la perfección es enemiga?', type: 'single', options: ['No existe y te paraliza', 'Todo debe ser perfecto', 'Los perfectos tienen éxito'], correct: 0 },
      { id: 'q4', text: '¿Qué es el Principio 80/20?', type: 'single', options: ['El 80% del resultado viene del 20% de acciones', 'Debes hacer el 80% perfecto', 'El 20% del tiempo basta'], correct: 0 },
      { id: 'q5', text: '¿Cuál es la peor decisión?', type: 'single', options: ['Una mala decisión', 'No decidir nada', 'Decidir rápido'], correct: 1 },
    ], passingScore: 70 }, orderIndex: 5, isRequired: true },
    { dayId: day6.id, type: ContentType.MENTAL_EXERCISE, title: 'La Cuenta Regresiva de 5 Segundos', content: { instruction: 'Practica la técnica de Mel Robbins en vivo.', durationMinutes: 8, steps: ['Piensa en algo que postergas', 'Cuenta en voz alta: 5... 4... 3... 2... 1... ACÍO', 'Hazlo AHORA, sin pensar más', 'Observa cómo te sientes después', 'Repite con otra cosa', 'Escribe tu plan: "La próxima vez que piense en..., contaré 5-4-3-2-1"'] }, orderIndex: 6, isRequired: true },
    { dayId: day6.id, type: ContentType.CONFIDENCE_TASK, title: 'Reto: 3 Acciones en 24h', content: { task: 'Haz 3 cosas postergadas:\n1. Algo de menos de 2 min\n2. Algo que te da miedo\n3. Algo que alguien espera de ti\n\nRegistra cada una.', evidenceType: 'text', description: 'La acción genera acción. 3 acciones crean momentum.' }, orderIndex: 7, isRequired: true },
    { dayId: day6.id, type: ContentType.INTERACTIVE_EXERCISE, title: '✏️ Completa: Frases de Acción', content: { type: 'fill_blanks', instruction: 'Completa con la palabra correcta.', sentences: [
      { id: 's1', text: 'La ___ perfecta es el enemigo de la acción.', answer: 'parálisis' },
      { id: 's2', text: 'El miedo no se elimina, se ___ con acción.', answer: 'transforma' },
      { id: 's3', text: 'Un ___ de 2 minutos puede cambiar tu día.', answer: 'momentum' },
      { id: 's4', text: 'Los exitosos actúan antes de estar ___.', answer: 'listos' },
    ]}, orderIndex: 8, isRequired: true },
    { dayId: day6.id, type: ContentType.INTERACTIVE_EXERCISE, title: '🎭 Escenario: Venta Bajo Presión', content: { type: 'scenarios', instruction: 'Cada segundo cuenta. Elige la mejor acción.', scenarios: [
      { situation: 'Tu cliente dice "Envíame una propuesta y te llamo". ¿Qué haces?', options: ['Le envío y espero', '"¿Puedo hacerte 2 preguntas para personalizarla?"', 'Le envío con descuento', 'Solo doy propuestas en persona'], correct: 1, explanation: 'NUNCA cuelgues sin siguiente acción concreta. La pregunta te da control.' },
      { situation: 'Llevas 15 min presentando y el cliente mira su celular. ¿Qué haces?', options: ['Sigo presentando', 'Paro y pregunto: "¿Esto es lo que buscabas?"', 'Le pido que guarde el celular', 'Termino rápido'], correct: 1, explanation: 'Honestidad y respeto construyen confianza. Preguntar muestra seguridad.' },
      { situation: 'El cliente dice "tengo que consultarlo". ¿Qué respondes?', options: ['Dale, cuando lo piensen me avisan', '¿Qué le dirías para convencerlo? ¿Puedo ayudarte?', 'No es necesario, es obvio', 'Te hago un descuento'], correct: 1, explanation: 'Convierte al cliente en tu aliado. Ayuda a preparar el argumento.' },
    ]}, orderIndex: 9, isRequired: true },
    { dayId: day6.id, type: ContentType.INTERACTIVE_EXERCISE, title: '📊 Autoevaluación: Tu Acción', content: { type: 'scale', instruction: 'Evalúa tu nivel de acción.', questions: [
      { id: 'q1', question: '¿Qué tan rápido actúas cuando sabes qué hacer?', lowLabel: 'Procrastino', highLabel: 'Inmediato' },
      { id: 'q2', question: '¿Qué tan seguido sales de tu zona de confort?', lowLabel: 'Nunca', highLabel: 'Diario' },
      { id: 'q3', question: '¿Qué tan bien manejas el rechazo en ventas?', lowLabel: 'Me destruye', highLabel: 'Me impulsa' },
    ]}, orderIndex: 10, isRequired: true },
  ]});
  console.log('✅ Día 6: 10 contenidos');

  // ═══════════════════════════════════════════════════════════
  // DÍA 7: Integración — Tu Nuevo Yo Nace Hoy (12 contenidos)
  // ═══════════════════════════════════════════════════════════
  const day7 = await prisma.programDay.create({
    data: { dayNumber: 7, title: 'Integración: Tu Nuevo Yo Nace Hoy', description: 'No es el final, es el comienzo real. Consolidas todo y defines tu camino.', isActive: true },
  });
  await prisma.dayContent.createMany({ data: [
    { dayId: day7.id, type: ContentType.REFLECTION, title: 'Diagnóstico Final: ¿Quién Soy Hoy?', content: { prompt: 'Reevalúa las 5 áreas del Día 3. ¿Meoró algo? ¿Qué descubriste en 7 días?', placeholder: 'DÍA 3 → DÍA 7:\nSalud: _/10 → _/10\nFinanzas: _/10 → _/10\nRelaciones: _/10 → _/10\nPropósito: _/10 → _/10\nCrecimiento: _/10 → _/10', minChars: 120 }, orderIndex: 1, isRequired: true },
    { dayId: day7.id, type: ContentType.REFLECTION, title: 'Tu Manifiesto de Vida', content: { prompt: 'Escribe tu manifiesto personal como poema o declaración. ¿Quién eres? ¿En qué crees? ¿Cómo vives?', placeholder: 'EL MANIFESTO DE [TU NOMBRE]:\nYO SOY...\nCREO EN...\nMI DÍA COMIENZA CON...\nDEJO ATRÁS...\nMI PROMESA ES...', minChars: 200 }, orderIndex: 2, isRequired: true },
    { dayId: day7.id, type: ContentType.REFLECTION, title: 'Tu Plan de Mantenimiento', content: { prompt: '¿Qué harás DIARIAMENTE? ¿SEMANALMENTE? ¿MENSUALMENTE para mantener tu transformación?', placeholder: '📅 DIARIAMENTE:\n- Mañana: ...\n- Noche: ...\n📅 SEMANALMENTE:\n- Lunes: ...\n- Viernes: ...\n📅 MENSUALMENTE:\n- Primera semana: ...', minChars: 120 }, orderIndex: 3, isRequired: true },
    { dayId: day7.id, type: ContentType.AFFIRMATION, title: 'Afirmación de Poder Absoluto', content: { text: 'MI TRANSFORMACIÓN ES REAL. MI NUEVO YO NACE HOY. NO HAY RETROCESO. MI MENTE, CUERPO Y ALMA ESTÁN ALINEADOS. SOY IMANABLE, PODEROSO, INFINITO.', repeatCount: 7, instruction: '7 repeticiones: una por cada día. De pie, brazos abiertos, mirando al cielo.' }, orderIndex: 4, isRequired: true },
    { dayId: day7.id, type: ContentType.VIDEO, title: 'El Primer Día del Resto de tu Vida', content: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', provider: 'youtube', duration: 720, description: 'Reflexión poderosa: no importa dónde estés, hoy es el día para empezar de verdad. 12 min.' }, orderIndex: 5, isRequired: true },
    { dayId: day7.id, type: ContentType.QUIZ, title: 'Quiz Final: Tu Certificación', content: { questions: [
      { id: 'q1', text: '¿Qué es lo más importante del Día 1?', type: 'single', options: ['Que no puedo lograr sueños', 'Conocerme: sueños y miedos', 'Que el dinero lo es todo'], correct: 1 },
      { id: 'q2', text: '¿Qué herramienta del Día 5 usarías si sientes ira?', type: 'single', options: ['Gritar', 'Técnica STOP', 'Dormir'], correct: 1 },
      { id: 'q3', text: '¿La fórmula del Día 4 para hábitos?', type: 'single', options: ['Hacer todo grande', 'Empezar con <2min y conectar a hábito existente', 'Esperar motivación'], correct: 1 },
      { id: 'q4', text: '¿Técnica del Día 6 contra procrastinación?', type: 'single', options: ['Esperar 1 hora', 'Cuenta 5-4-3-2-1 y actúa', 'Hacer lista y no hacer nada'], correct: 1 },
      { id: 'q5', text: '¿Qué vas a hacer diferente mañana?', type: 'single', options: ['Nada', 'Algo diferente: hábito, acción, o rutiina', 'Esperar la próxima semana'], correct: 1 },
    ], passingScore: 80 }, orderIndex: 6, isRequired: true },
    { dayId: day7.id, type: ContentType.MENTAL_EXERCISE, title: 'El Juramento del Guerrero', content: { instruction: 'Última meditación. Ritual de compromiso.', durationMinutes: 12, steps: ['Posición de poder: espalda recta, ojos cerrados', 'Respira 7 veces, una por cada día', 'Agradece: "Día 1, gracias por enseñarme a conocerme"', 'Visualiza tu nuevo yo: ¿cómo camina? ¿cómo habla?', 'Mano en corazón: "Yo, [nombre], me comprometo a..."', 'Escribe tu compromiso y guárdalo', 'Abre los ojos: el programa terminó, tu vida empieza'] }, orderIndex: 7, isRequired: true },
    { dayId: day7.id, type: ContentType.CONFIDENCE_TASK, title: 'Reto: Carta de Recomendación', content: { task: 'Escribe una carta de recomendación para ti mismo como tu propio jefe. ¿Qué habilidades demostraste? ¿Qué superaste? Lee en voz alta.', evidenceType: 'text', description: 'La auto-reconocimiento es un ejercicio de poder personal. Te lo mereces.' }, orderIndex: 8, isRequired: false },
    { dayId: day7.id, type: ContentType.INTERACTIVE_EXERCISE, title: '🔗 Conecta: Todo lo Aprendido', content: { type: 'matching', instruction: 'Conecta cada concepto con su día y aplicación.', pairs: [
      { left: 'Neuroplasticidad', right: 'Día 1: Tus creencias pueden cambiarse' },
      { left: 'Afirmaciones potenciadoras', right: 'Día 2: Reemplazar creencias limitantes' },
      { left: 'Visualización vívida', right: 'Día 3: Crear tu mapa del futuro' },
      { left: 'Habit stacking', right: 'Día 4: Conectar hábitos nuevos' },
      { left: 'Técnica STOP', right: 'Día 5: Gestionar emociones' },
      { left: 'Regla 5 segundos', right: 'Día 6: Vencer procrastinación' },
    ]}, orderIndex: 9, isRequired: true },
    { dayId: day7.id, type: ContentType.INTERACTIVE_EXERCISE, title: '🎭 Escenario Final: Tu Nuevo Yo', content: { type: 'scenarios', instruction: 'Demuestra lo que aprendiste. Cada escenario usa herramientas de diferentes días.', scenarios: [
      { situation: 'Un prospecto dice "no tengo dinero". Usando Creencias y Emociones, ¿qué回应?', options: ['Ok, gracias', '"¿Qué te gustaría lograr si tuvieras los recursos?"', 'Todos dicen eso', 'Te doy 50% off'], correct: 1, explanation: 'Reencuadras como oportunidad de conexión. Empatía + pregunta de valor.' },
      { situation: 'Es lunes, tienes 10 reuniones pero deberías meditar. ¿Qué haces?', options: ['No puedo hoy', 'Medito 1 min: versión mínima mantiene el hábito', 'Hago 30 min para compensar', 'Lo dejo para el martes'], correct: 1, explanation: '1 minuto mantiene la señal. Constancia, no intensidad.' },
      { situation: 'Un cliente te rechaza después de 3 reuniones. Usando Miedos y Emociones, ¿cómo reaccionas?', options: ['Me siento fracasado', 'Analizo: ¿qué aprendí? Uso como dato, no identidad', 'Le escribo enfadado', 'Lo ignoro'], correct: 1, explanation: 'Separar resultado de identidad. El rechazo es datos, no definición.' },
    ]}, orderIndex: 10, isRequired: true },
    { dayId: day7.id, type: ContentType.INTERACTIVE_EXERCISE, title: '📊 Autoevaluación Final', content: { type: 'scale', instruction: 'Evalúa cuánto cambaste durante el programa.', questions: [
      { id: 'q1', question: '¿Qué tan clara tu visión del futuro?', lowLabel: 'Confundido', highLabel: 'Cristalino' },
      { id: 'q2', question: '¿Qué tan bien manejas emociones bajo presión?', lowLabel: 'Reactivo', highLabel: 'Consciente' },
      { id: 'q3', question: '¿Qué tan consistente con tus hábitos?', lowLabel: 'Dejo todo', highLabel: 'Soy constante' },
      { id: 'q4', question: '¿Qué tan seguro al vender/comunicar?', lowLabel: 'Inseguro', highLabel: 'Imparable' },
      { id: 'q5', question: '¿Qué tan listo para zona de confort?', lowLabel: 'Paralizado', highLabel: 'Listo para todo' },
    ]}, orderIndex: 11, isRequired: true },
  ]});
  console.log('✅ Día 7: 11 contenidos');

  console.log('🎉 ¡Seed completado! 7 días balanceados con ~10 contenidos cada uno.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
