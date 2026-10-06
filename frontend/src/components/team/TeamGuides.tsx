import { useState } from 'react';
import {
  Phone, Flame, Presentation, DollarSign, ChevronDown, CheckCircle2,
  MessageCircle, Lightbulb, ShoppingBag, Video, Copy, Check, Search, X,
  Sparkles, Share2
} from 'lucide-react';
import { toast } from 'sonner';

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
  scriptExample?: string;
}

const guides: Guide[] = [
  {
    id: 'videos-productos',
    title: 'Vende con tus videos orgánicos',
    desc: 'Promociona productos de ryztor.com en tus redes con tu enlace de afiliado y gana por cada venta.',
    icon: Video,
    color: 'from-rose-500 to-pink-600',
    shadow: 'shadow-rose-500/20',
    tag: 'Doble Ingreso',
    link: { label: 'Ver productos en ryztor.com', url: 'https://ryztor.com' },
    scriptExample: '¡Hola a todos! Muchos me preguntaron qué uso para [problema que resuelve el producto]. Aquí les dejo el enlace con descuento exclusivo: [TU_LINK]',
    steps: [
      { text: 'Entra a ryztor.com y elige 1-2 productos visualmente atractivos.' },
      { text: 'Graba el producto en uso mostrando su funcionamiento real.' },
      { text: 'Edita con subtítulos grandes, música en tendencia y gancho de 3 segundos.' },
      { text: 'Publica en TikTok/Reels con tu link de afiliado en biografía o descripción.' },
      { text: 'Sube historias interactivas: "Te dejo el link directo aquí 👇".' },
    ],
  },
  {
    id: 'frio',
    title: 'Guion de Llamada en Frío',
    desc: 'Para prospectos nuevos que aún no conocen la plataforma.',
    icon: Phone,
    color: 'from-blue-500 to-indigo-600',
    shadow: 'shadow-blue-500/20',
    tag: 'Nuevos Contactos',
    scriptExample: 'Hola [Nombre], ¿cómo estás? Te escribo rápido porque sé que eres emprendedor. Estamos expandiendo un modelo donde ganas comisiones por comercio electrónico y creación de equipo sin pagar publicidad. ¿Estarías abierto a revisar un video de 5 min?',
    steps: [
      { text: 'Pregunta abierta inicial: "¿Qué estás haciendo hoy para generar más ingresos en dólares?"' },
      { text: 'Escucha activa: Anota sus principales obstáculos (tiempo, capital, conocimiento).' },
      { text: 'Comparte tu testimonio: Explica cómo Círculo 1 resolvió ese mismo problema para ti.' },
      { text: 'Invitación sin presión: "Solo mira la información y decides si hace sentido para ti."' },
      { text: 'Agendar seguimiento con fecha y hora fija: "¿Te parece si te escribo el jueves a las 4 PM?"' },
    ],
  },
  {
    id: 'caliente',
    title: 'Guion de Llamada en Caliente',
    desc: 'Para quien ya vio información, preguntó o mostró interés.',
    icon: Flame,
    color: 'from-orange-500 to-red-600',
    shadow: 'shadow-orange-500/20',
    tag: 'Cierre Rápido',
    scriptExample: '¡Hola [Nombre]! Vi que te interesó el modelo de Círculo 1. De todo lo que viste, ¿qué fue lo que más te llamó la atención? ¿La parte de TikTok Shop o las comisiones por equipo?',
    steps: [
      { text: 'Reforzar el interés: "¿Qué fue lo que más te gustó de la oportunidad?"' },
      { text: 'Mostrar resultados: Comparte comprobantes de pago o crecimiento de la red.' },
      { text: 'Presentar el plan y beneficios: Cuánto cuesta y el soporte de mentoría diaria.' },
      { text: 'Manejo de dudas: Despeja temores sobre medios de pago y retiro.' },
      { text: 'Llamado a la acción: "¿Empezamos con tu registro y activación hoy mismo?"' },
    ],
  },
  {
    id: 'presentacion',
    title: 'La Presentación de 5 Minutos',
    desc: 'Estructura infalible para presentar la oportunidad sin enredarse.',
    icon: Presentation,
    color: 'from-purple-500 to-fuchsia-600',
    shadow: 'shadow-purple-500/20',
    tag: 'Estructura Probada',
    scriptExample: 'Minuto 1: Conecta con su dolor.\nMinuto 2: Cuenta tu historia.\nMinuto 3: Muestra la plataforma por dentro.\nMinuto 4: Explica el modelo de negocio.\nMinuto 5: Cierra con decisión.',
    steps: [
      { text: 'Minuto 1: Conecta. Haz preguntas sobre su situación actual y escucha.' },
      { text: 'Minuto 2: Historia de transformación. Qué hacías antes y qué lograste con la comunidad.' },
      { text: 'Minuto 3: Recorrido del sistema (Módulo diario, TikTok Shop y VIP Pro).' },
      { text: 'Minuto 4: Economía del equipo: Cómo ganas comisiones continuas.' },
      { text: 'Minuto 5: Pregunta de cierre: "¿Listo para comenzar en nuestro equipo?"' },
    ],
  },
  {
    id: 'cerrar',
    title: 'Manejo de Objeciones & Cierre de Membresía',
    desc: 'Cómo responder a las 5 objeciones más comunes y cerrar la venta.',
    icon: DollarSign,
    color: 'from-emerald-500 to-teal-600',
    shadow: 'shadow-emerald-500/20',
    tag: 'Objeciones Clave',
    scriptExample: '"Es caro" → "Comparado con abrir un negocio tradicional de miles de dólares, esto te da sistema, producto y mentoría lista para generar desde la primera semana."',
    steps: [
      { text: '"Es caro" → "No es un gasto, es una inversión que se recupera con tu primera venta y referidos."' },
      { text: '"No tengo tiempo" → "Solo necesitas 20 minutos al día para revisar tu módulo y coordinar tu equipo."' },
      { text: '"Tengo que pensarlo" → "¿Qué información específica necesitas para tomar la decisión? Te ayudo ahora."' },
      { text: '"No sé vender" → "No necesitas experiencia previa. Todo el sistema tiene guiones listos como este."' },
      { text: 'Cierre directo: "Vamos a crear tu cuenta ahora para que reserves tu lugar."' },
    ],
  },
];

export function TeamGuides() {
  const [openId, setOpenId] = useState<string | null>('frio');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyScript = (id: string, text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('¡Guion copiado al portapapeles!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredGuides = guides.filter(g => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      g.title.toLowerCase().includes(term) ||
      g.desc.toLowerCase().includes(term) ||
      g.tag.toLowerCase().includes(term) ||
      g.steps.some(s => s.text.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Intro */}
      <div className="rounded-3xl border border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-800 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-dark-100">Guías de Prospección y Cierre</h2>
              <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5 leading-relaxed max-w-xl">
                Aprende qué decir paso a paso para presentar la oportunidad y cerrar membresías con total confianza.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar en guiones..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-7 py-2 text-xs rounded-xl border border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Guías */}
      <div className="space-y-3">
        {filteredGuides.map((g, idx) => {
          const Icon = g.icon;
          const open = openId === g.id;
          return (
            <div
              key={g.id}
              className={`rounded-3xl border bg-white dark:bg-dark-800 overflow-hidden transition-all ${
                open
                  ? 'border-emerald-300 dark:border-emerald-700 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20'
                  : 'border-gray-100 dark:border-dark-700 hover:shadow-md'
              }`}
            >
              <button
                onClick={() => setOpenId(open ? null : g.id)}
                className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-gray-50/50 dark:hover:bg-dark-750 transition-colors"
              >
                <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${g.color} text-white flex items-center justify-center shrink-0 shadow-md ${g.shadow}`}>
                  <Icon className="w-6 h-6" />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 text-gray-700 dark:text-dark-300 text-[10px] font-black flex items-center justify-center shadow-xs">
                    {idx + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-dark-700 text-[10px] font-bold text-gray-600 dark:text-dark-300 uppercase tracking-wider mb-1">
                    {g.tag}
                  </span>
                  <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-dark-100 leading-tight">{g.title}</p>
                  <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">{g.desc}</p>
                </div>
                <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${open ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rotate-180' : 'bg-gray-100 dark:bg-dark-700 text-gray-400'}`}>
                  <ChevronDown className="w-4 h-4 transition-transform" />
                </div>
              </button>

              {open && (
                <div className="border-t border-gray-100 dark:border-dark-700 p-5 sm:p-6 space-y-4 bg-gray-50/40 dark:bg-dark-900/30 animate-fade-in">
                  {/* Ejemplo de Guion para Copiar */}
                  {g.scriptExample && (
                    <div className="p-4 rounded-2xl bg-white dark:bg-dark-800 border border-emerald-200 dark:border-emerald-800/60 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 uppercase tracking-wider">
                          <Sparkles className="w-3.5 h-3.5" /> Mensaje / Guion Listo para Usar:
                        </span>
                        <button
                          onClick={() => copyScript(g.id, g.scriptExample)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all"
                        >
                          {copiedId === g.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === g.id ? '¡Copiado!' : 'Copiar Guion'}</span>
                        </button>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-dark-200 whitespace-pre-wrap leading-relaxed italic bg-gray-50 dark:bg-dark-900/50 p-3 rounded-xl border border-gray-100 dark:border-dark-700">
                        "{g.scriptExample}"
                      </p>
                    </div>
                  )}

                  {/* Pasos de la Guía */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pasos de ejecución:</p>
                    {g.steps.map((s, sIdx) => (
                      <div key={sIdx} className="flex items-start gap-3 p-3 rounded-2xl bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 text-xs text-gray-800 dark:text-dark-200">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                          {sIdx + 1}
                        </span>
                        <p className="leading-relaxed flex-1">{s.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
