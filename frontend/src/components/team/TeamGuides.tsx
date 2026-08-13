import { useState } from 'react';
import { Phone, Flame, Presentation, DollarSign, ChevronDown, CheckCircle2, MessageCircle, Lightbulb, ShoppingBag, Video } from 'lucide-react';

interface Guide {
  id: string;
  title: string;
  desc: string;
  icon: any;
  color: string;
  shadow: string;
  tag: string;
  steps: { text: string }[];
  link?: { label: string; url: string };
}

const guides: Guide[] = [
  {
    id: 'videos-productos',
    title: 'Vende con tus videos',
    desc: 'Pon los productos de ryztor.com en tus redes con tu link y gana por cada venta, además de la membresía.',
    icon: Video,
    color: 'from-rose-500 to-pink-600',
    shadow: 'shadow-rose-500/20',
    tag: 'Doble ingreso',
    link: { label: 'Ver productos en ryztor.com', url: 'https://ryztor.com' },
    steps: [
      { text: 'Entra a ryztor.com y elige 1-2 productos que se vean bien en video.' },
      { text: 'Graba el producto en uso: muestra cómo se ve, su tamaño, cómo funciona.' },
      { text: 'Edítalo simple: corta lo aburrido, agrega texto grande y música.' },
      { text: 'Publica en tu red con TU link de afiliado en la descripción.' },
      { text: 'Comparte también en historias: "Mira lo que uso, te lo dejo aquí 👇".' },
    ],
  },
  {
    id: 'frio',
    title: 'Llamada en frío',
    desc: 'Contactas a alguien que aún no te conoce ni ha mostrado interés.',
    icon: Phone,
    color: 'from-blue-500 to-indigo-600',
    shadow: 'shadow-blue-500/20',
    tag: 'Para nuevos contactos',
    steps: [
      { text: 'Pregunta abierta: "¿Qué estás haciendo hoy para generar más ingresos?"' },
      { text: 'Escucha más de lo que hablas. Anota qué le falta.' },
      { text: 'Cuenta TU historia: qué te cambió la membresía.' },
      { text: 'Invítalo a ver el programa, sin presión: "Solo mira y decide."' },
      { text: 'Agenda un seguimiento: "¿Hablamos el jueves y me cuentas?"' },
    ],
  },
  {
    id: 'caliente',
    title: 'Llamada en caliente',
    desc: 'Ya preguntó o mostró interés. Es el momento de cerrar.',
    icon: Flame,
    color: 'from-orange-500 to-red-600',
    shadow: 'shadow-orange-500/20',
    tag: 'Para quien ya preguntó',
    steps: [
      { text: 'Refuerza su deseo: "¿Qué es lo que más te llamó la atención?"' },
      { text: 'Muestra resultados reales de tu red o tuyos.' },
      { text: 'Presenta el plan: cuánto cuesta y qué incluye.' },
      { text: 'Maneja la objeción: escucha, repite y responde.' },
      { text: 'Cierra: "¿Te ayudo a activar tu membresía ahora mismo?"' },
    ],
  },
  {
    id: 'presentacion',
    title: 'La presentación de 5 minutos',
    desc: 'El orden exacto para presentar la membresía.',
    icon: Presentation,
    color: 'from-purple-500 to-fuchsia-600',
    shadow: 'shadow-purple-500/20',
    tag: 'Estructura probada',
    steps: [
      { text: 'Min 0-1: Conecta. Pregunta y escucha su situación.' },
      { text: 'Min 1-2: Tu historia de transformación.' },
      { text: 'Min 2-3: Muestra la plataforma (programa + VIP Pro).' },
      { text: 'Min 3-4: El negocio del equipo: comisiones sin pagar ads.' },
      { text: 'Min 4-5: Cierra con acción clara.' },
    ],
  },
  {
    id: 'cerrar',
    title: 'Cerrar la membresía de $1000',
    desc: 'Manejo de objeciones y cierre.',
    icon: DollarSign,
    color: 'from-emerald-500 to-teal-600',
    shadow: 'shadow-emerald-500/20',
    tag: 'El cierre',
    steps: [
      { text: '"Es caro" → "Es una inversión que se recupera con tu primera venta y tus referidos."' },
      { text: '"No tengo tiempo" → "Son 15-20 min al día, y el equipo trabaja contigo."' },
      { text: '"Lo pienso" → "Perfecto, ¿qué necesitas resolver para decidir? ¿Te ayudo?"' },
      { text: '"No sé vender" → "La mentoría y las guías te enseñan. No necesitas experiencia."' },
      { text: 'Cierre: pide la decisión. No tengas miedo al "no", es parte del juego.' },
    ],
  },
];

export function TeamGuides() {
  const [openId, setOpenId] = useState<string | null>('frio');

  return (
    <div className="space-y-4">
      {/* Intro */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-800 p-5">
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-emerald-100/50 dark:bg-emerald-900/20 blur-2xl" />
        <div className="relative flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-dark-300 leading-6">
              La membresía se vende <span className="font-bold text-gray-900 dark:text-dark-100">hablando con personas</span>, no con publicidad pagada. Cada guía es una lista de pasos: <span className="font-semibold text-emerald-600 dark:text-emerald-400">léela antes de cada llamada</span> y practica en voz alta.
            </p>
          </div>
        </div>
      </div>

      {guides.map((g, idx) => {
        const Icon = g.icon;
        const open = openId === g.id;
        return (
          <div key={g.id} className={`rounded-2xl border bg-white dark:bg-dark-800 overflow-hidden transition-all ${open ? 'border-gray-200 dark:border-dark-600 shadow-lg' : 'border-gray-100 dark:border-dark-700 hover:shadow-md'}`}>
            <button
              onClick={() => setOpenId(open ? null : g.id)}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors"
            >
              <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${g.color} text-white flex items-center justify-center shrink-0 shadow-lg ${g.shadow}`}>
                <Icon className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 text-gray-500 dark:text-dark-300 text-[10px] font-black flex items-center justify-center">
                  {idx + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 dark:bg-dark-700 text-[10px] font-bold text-gray-500 dark:text-dark-400 uppercase tracking-wider mb-1">
                  {g.tag}
                </span>
                <p className="font-bold text-gray-900 dark:text-dark-100 leading-tight">{g.title}</p>
                <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">{g.desc}</p>
              </div>
              <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${open ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rotate-180' : 'bg-gray-100 dark:bg-dark-700 text-gray-400'}`}>
                <ChevronDown className="w-4 h-4 transition-transform" />
              </div>
            </button>

            {open && (
              <div className="border-t border-gray-100 dark:border-dark-700 p-5 space-y-3 bg-gray-50/50 dark:bg-dark-800">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-dark-500 mb-1">
                  <MessageCircle className="w-3.5 h-3.5" />
                  Qué decir
                </div>
                {g.steps.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-dark-200 bg-white dark:bg-dark-700 rounded-xl border border-gray-100 dark:border-dark-600 p-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-6">{s.text}</span>
                  </div>
                ))}
                {g.link && (
                  <a
                    href={g.link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-bold hover:opacity-90 transition-opacity mt-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {g.link.label}
                  </a>
                )}
                <div className="flex items-start gap-2 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 mt-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  Practica en voz alta antes de la llamada. La confianza se nota.
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
