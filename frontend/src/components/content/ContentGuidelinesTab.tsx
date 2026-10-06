import { useState } from 'react';
import {
  Compass, Clock, ShieldAlert, CheckCircle2, XCircle, TrendingUp,
  Search, Eye, Share2, MessageCircle, ShoppingBag, Globe, Zap, AlertTriangle
} from 'lucide-react';

interface TimezoneSchedule {
  country: string;
  flag: string;
  zone: string;
  peak1: string;
  peak2: string;
  peak3: string;
  bestDays: string;
  recommendedFrequency: string;
}

const SCHEDULES: TimezoneSchedule[] = [
  {
    country: 'Estados Unidos (Este - Miami / NY)',
    flag: '🇺🇸',
    zone: 'EDT / EST',
    peak1: '12:00 PM - 2:00 PM',
    peak2: '6:30 PM - 8:30 PM',
    peak3: '9:30 PM - 11:30 PM',
    bestDays: 'Martes, Jueves, Viernes y Domingo',
    recommendedFrequency: '2 a 4 videos por día',
  },
  {
    country: 'México (Ciudad de México)',
    flag: '🇲🇽',
    zone: 'CST',
    peak1: '1:00 PM - 3:30 PM',
    peak2: '7:00 PM - 9:30 PM',
    peak3: '10:00 PM - 11:30 PM',
    bestDays: 'Miércoles, Jueves y Sábado',
    recommendedFrequency: '2 a 3 videos por día',
  },
  {
    country: 'Colombia / Perú / Ecuador',
    flag: '🇨🇴',
    zone: 'COT / PET',
    peak1: '12:30 PM - 2:30 PM',
    peak2: '6:30 PM - 9:00 PM',
    peak3: '9:30 PM - 11:00 PM',
    bestDays: 'Lunes, Jueves y Domingo',
    recommendedFrequency: '2 a 3 videos por día',
  },
  {
    country: 'España (Madrid / Barcelona)',
    flag: '🇪🇸',
    zone: 'CEST / CET',
    peak1: '2:00 PM - 4:00 PM',
    peak2: '8:00 PM - 10:30 PM',
    peak3: '11:00 PM - 12:30 AM',
    bestDays: 'Miércoles, Viernes y Domingo',
    recommendedFrequency: '1 a 3 videos por día',
  },
  {
    country: 'Argentina / Chile',
    flag: '🇦🇷',
    zone: 'ART / CLST',
    peak1: '1:00 PM - 3:00 PM',
    peak2: '7:30 PM - 10:00 PM',
    peak3: '10:30 PM - 12:00 AM',
    bestDays: 'Martes, Viernes y Sábado',
    recommendedFrequency: '2 a 3 videos por día',
  },
];

const FORBIDDEN_WORDS = [
  {
    bad: 'Link en bio / Link en perfil',
    good: 'Enlace en mi foto / botón del perfil',
    why: 'TikTok penaliza palabras que intentan sacar tráfico fuera del feed sin usar sus herramientas oficiales.',
  },
  {
    bad: 'Gratis / 100% Free',
    good: 'Costo $0 / Sin cargo extra / Obsequio',
    why: 'Algoritmos antispam detectan "gratis" como posible estafa o señuelo fraudulento.',
  },
  {
    bad: 'WhatsApp / Instagram / Telegram',
    good: 'Mensaje directo / Red verde / Red de fotos',
    why: 'Mencionar nombres de plataformas competidoras reduce drásticamente el alcance orgánico.',
  },
  {
    bad: 'Comprar / Compra ya',
    good: 'Consíguelo en el carrito amarillo / Toca abajo',
    why: 'Lenguaje agresivo de venta reduce el engagement frente a llamadas a la acción nativas.',
  },
  {
    bad: 'Dinero fácil / Hacerse rico',
    good: 'Ingresos extras / Generar comisiones / Modelo de afiliados',
    why: 'Políticas estrictas sobre promesas financieras no fundamentadas.',
  },
];

export function ContentGuidelinesTab() {
  const [selectedCountryIndex, setSelectedCountryIndex] = useState<number>(0);
  const currentSchedule = SCHEDULES[selectedCountryIndex];

  return (
    <div className="space-y-8">
      {/* Horarios Óptimos de Publicación */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 p-5 sm:p-7 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-rose-500" />
              Mejores Horarios de Publicación por Mercado
            </h2>
            <p className="text-xs text-gray-500 dark:text-dark-400">
              Publica en los picos de conexión para maximizar la velocidad inicial de visualizaciones (primeros 60 minutos).
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 self-start sm:self-auto">
            {currentSchedule.flag} {currentSchedule.zone}
          </span>
        </div>

        {/* Selector de Países */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {SCHEDULES.map((s, idx) => (
            <button
              key={s.country}
              type="button"
              onClick={() => setSelectedCountryIndex(idx)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedCountryIndex === idx
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-300 hover:bg-gray-200 dark:hover:bg-dark-600'
              }`}
            >
              <span>{s.flag}</span>
              <span>{s.country.split('(')[0]}</span>
            </button>
          ))}
        </div>

        {/* Card de Horarios y Frecuencia */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 to-orange-500/10 border border-rose-200 dark:border-rose-900/40 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Pico Matutino / Almuerzo
            </span>
            <p className="text-lg font-black text-gray-900 dark:text-dark-100">{currentSchedule.peak1}</p>
            <p className="text-xs text-gray-500 dark:text-dark-400">Excelente para videos cortos de 15-20s y reviews rápidas.</p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-200 dark:border-amber-900/40 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Pico Tarde / Salida Laboral
            </span>
            <p className="text-lg font-black text-gray-900 dark:text-dark-100">{currentSchedule.peak2}</p>
            <p className="text-xs text-gray-500 dark:text-dark-400">El bloque de mayor retención de audiencia del día.</p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-200 dark:border-purple-900/40 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Pico Nocturno (Compras)
            </span>
            <p className="text-lg font-black text-gray-900 dark:text-dark-100">{currentSchedule.peak3}</p>
            <p className="text-xs text-gray-500 dark:text-dark-400">Mayor tasa de conversión de ventas en TikTok Shop.</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-dark-900/50 border border-gray-100 dark:border-dark-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <strong className="text-gray-900 dark:text-dark-100">Días con mayor engagement: </strong>
            <span className="text-gray-600 dark:text-dark-300">{currentSchedule.bestDays}</span>
          </div>
          <div>
            <strong className="text-gray-900 dark:text-dark-100">Frecuencia sugerida: </strong>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{currentSchedule.recommendedFrequency}</span>
          </div>
        </div>
      </div>

      {/* Las 5 Métricas del Algoritmo */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 p-5 sm:p-7 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-500" />
            Las 5 Métricas que Hacen Viral un Video de Ventas
          </h2>
          <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
            El algoritmo de TikTok evalúa estas 5 variables en los primeros 100 usuarios de prueba (test cohort).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            {
              n: '1',
              title: 'Retención en Seg 3',
              meta: '> 65%',
              desc: 'Si no detienes el scroll en 3s, el video muere de inmediato.',
              icon: Eye,
              color: 'text-rose-500',
            },
            {
              n: '2',
              title: 'Tasa de Finalización',
              meta: '> 25%',
              desc: 'Porcentaje de usuarios que ven el video hasta el final.',
              icon: Zap,
              color: 'text-amber-500',
            },
            {
              n: '3',
              title: 'Compartidos (Shares)',
              meta: '> 2%',
              desc: 'La métrica con mayor peso para viralidad masiva.',
              icon: Share2,
              color: 'text-blue-500',
            },
            {
              n: '4',
              title: 'Clics en Carrito',
              meta: '> 5% CTR',
              desc: 'Intención de compra detectada por TikTok Shop.',
              icon: ShoppingBag,
              color: 'text-emerald-500',
            },
            {
              n: '5',
              title: 'Comentarios',
              meta: '> 1%',
              desc: 'Preguntas y debates en los comentarios aumentan el alcance.',
              icon: MessageCircle,
              color: 'text-purple-500',
            },
          ].map(m => {
            const Icon = m.icon;
            return (
              <div
                key={m.n}
                className="p-4 rounded-2xl bg-gray-50 dark:bg-dark-900/50 border border-gray-100 dark:border-dark-700 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="w-6 h-6 rounded-lg bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-dark-200 text-xs font-black flex items-center justify-center">
                      {m.n}
                    </span>
                    <Icon className={`w-4 h-4 ${m.color}`} />
                  </div>
                  <p className="font-bold text-gray-900 dark:text-dark-100 text-xs leading-snug">{m.title}</p>
                  <p className="text-[11px] text-gray-500 dark:text-dark-400 mt-1 leading-relaxed">{m.desc}</p>
                </div>
                <div className="pt-2 border-t border-gray-200/60 dark:border-dark-700">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Meta Óptima:</span>
                  <p className="text-sm font-black text-gray-900 dark:text-dark-100">{m.meta}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Diccionario de Palabras Prohibidas & Reglas Anti-Strike */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 p-5 sm:p-7 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              Diccionario Anti-Shadowban & Palabras Prohibidas
            </h2>
            <p className="text-xs text-gray-500 dark:text-dark-400">
              Reemplaza estos términos en tus videos y descripciones para proteger tu cuenta de sanciones invisibles.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 self-start sm:self-auto">
            Reglas de Comunidad
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-dark-700 text-gray-400 uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-bold">❌ Evitar (Shadowban)</th>
                <th className="pb-3 font-bold">✅ Usar en su lugar</th>
                <th className="pb-3 font-bold hidden md:table-cell">Motivo Algorítmico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
              {FORBIDDEN_WORDS.map((w, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-dark-700/30 transition-colors">
                  <td className="py-3.5 pr-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold border border-rose-200/40">
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      {w.bad}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/40">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      {w.good}
                    </span>
                  </td>
                  <td className="py-3.5 text-gray-500 dark:text-dark-400 hidden md:table-cell leading-relaxed">
                    {w.why}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TikTok SEO Checklist */}
      <div className="rounded-3xl bg-gradient-to-br from-teal-950 via-slate-900 to-slate-950 border border-white/10 p-6 sm:p-7 text-white shadow-xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-wider text-teal-300 border border-white/10">
          <Search className="w-3.5 h-3.5 text-teal-300" />
          Checklist de SEO en TikTok
        </div>
        <h3 className="text-lg font-bold">Cómo hacer que tus videos aparezcan en la barra de búsqueda</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-2">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="font-bold text-teal-300">1. Audio Verbalizado</span>
            <p className="text-gray-300">Pronuncia el nombre del producto exacto en los primeros 3 segundos.</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="font-bold text-teal-300">2. Subtítulos Nativos</span>
            <p className="text-gray-300">Activa los subtítulos automáticos de TikTok para que indexe cada frase.</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="font-bold text-teal-300">3. Texto en Pantalla</span>
            <p className="text-gray-300">Escribe la pregunta o beneficio con la herramienta de texto de TikTok.</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="font-bold text-teal-300">4. 3 a 5 Hashtags</span>
            <p className="text-gray-300">Usa 1 general (#tiktokshop) + 2 de nicho (#hacks) + 1 de producto.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
