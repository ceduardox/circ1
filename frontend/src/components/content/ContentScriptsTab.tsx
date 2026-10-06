import { useState, useMemo } from 'react';
import {
  FileText, Copy, Check, Search, X, Sparkles, Zap, Flame, Clock,
  TrendingUp, Video, Target, ArrowRight, Lightbulb, PlayCircle, Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface ScriptItem {
  id: string;
  title: string;
  angle: 'hook' | 'pas' | 'transformation' | 'tiktok_made_me' | 'comparison';
  angleLabel: string;
  targetDuration: string;
  retentionScore: string;
  hook: string;
  body: string;
  demo: string;
  cta: string;
  recordingTip: string;
  recommendedNiche: string;
}

const SCRIPTS_DATA: ScriptItem[] = [
  {
    id: 'script-1',
    title: 'El Gancho de Curiosidad Masiva ("Si tienes esto, lo estás haciendo mal")',
    angle: 'hook',
    angleLabel: '🎣 Scroll Stopper',
    targetDuration: '18 - 25 seg',
    retentionScore: '93% retención',
    recommendedNiche: 'Gadgets, Belleza, Cuidado Personal',
    hook: 'Si todavía estás usando [método tradicional o producto antiguo], por favor detente ahora mismo...',
    body: 'Llevo 3 semanas probando esto y no puedo creer la cantidad de tiempo y dinero que estaba tirando a la basura.',
    demo: 'Mira cómo funciona en segundos: solo aplicas esto aquí, presionas este botón y listo. El resultado es instantáneo y sin esfuerzo.',
    cta: 'Te dejé el enlace en el carrito amarillo de aquí abajo antes de que se vuelva a agotar el stock.',
    recordingTip: 'Comienza con la cara seria y mirando directo a cámara. En el segundo 3 haz un corte rápido mostrando el producto en primer plano.',
  },
  {
    id: 'script-2',
    title: 'Estructura PAS (Problema Incomodo + Agitación + Alivio Inmediato)',
    angle: 'pas',
    angleLabel: '⚠️ Problema - Solución',
    targetDuration: '25 - 35 seg',
    retentionScore: '89% retención',
    recommendedNiche: 'Salud, Postura, Limpieza, Accesorios',
    hook: '¿Por qué nadie me dijo que existía esto antes de que sufriera por meses?',
    body: 'Todos los días tenía el mismo problema insoportable con [mencionar dolor cotidiano] y ninguna solución normal me servía...',
    demo: 'Hasta que encontré esto. Miren esto: se adapta al instante, no pesa nada y resuelve exactamente lo que promete en menos de 1 minuto.',
    cta: 'Haz clic abajo en el carrito amarillo y aprovecha el descuento flash con envío prioritario.',
    recordingTip: 'Muestra una expresión de frustración al inicio y luego una expresión de alivio y satisfacción cuando utilizas el producto.',
  },
  {
    id: 'script-3',
    title: 'TikTok Me Hizo Comprarlo ("Pensé que era una estafa de internet")',
    angle: 'tiktok_made_me',
    angleLabel: '🤫 TikTok Made Me Buy It',
    targetDuration: '20 - 30 seg',
    retentionScore: '94% retención',
    recommendedNiche: 'Moda, Cocina, Autos, Gadgets',
    hook: 'Pensé que este producto viral de TikTok era una estafa total... hasta que me llegó el paquete a la puerta.',
    body: 'Lo vi en como 20 videos y pensé "es imposible que funcione tan bien por ese precio". Decidí ponerlo a prueba en vivo.',
    demo: 'Miren la prueba en tiempo real: sin filtros, sin trucos. Funciona incluso mejor de lo que mostraban en los anuncios.',
    cta: 'Sigue disponible con descuento en el botón amarillo aquí en la esquina inferior izquierda.',
    recordingTip: 'Graba en formato unboxing con sonido ASMR natural al abrir la caja y encender el producto.',
  },
  {
    id: 'script-4',
    title: 'Transformación Antes vs Después ("Día 1 vs Día 7")',
    angle: 'transformation',
    angleLabel: '🔄 Antes y Después',
    targetDuration: '22 - 32 seg',
    retentionScore: '91% retención',
    recommendedNiche: 'SkinCare, Fitness, Productividad, Cabello',
    hook: 'Así es como pasé de tener [problema visible inicial] a tener esto en solo 7 días sin gastar cientos de dólares.',
    body: 'Probé cremas caras, tratamientos y tutoriales que no sirvieron de nada. Mi rutina era un caos total.',
    demo: 'Solo integré esto 2 minutos por la mañana y 2 minutos por la noche. Miren la textura y el cambio radical.',
    cta: 'Consíguelo con garantía de 30 días tocando el carrito amarillo en la pantalla.',
    recordingTip: 'Utiliza pantalla dividida (split screen) o una transición limpia de chasquido de dedos para el antes y después.',
  },
  {
    id: 'script-5',
    title: 'Comparativa Radical ("Producto Barato vs Este Producto")',
    angle: 'comparison',
    angleLabel: '⚡ Comparativa Directa',
    targetDuration: '25 - 40 seg',
    retentionScore: '88% retención',
    recommendedNiche: 'Tecnología, Herramientas, Hogar',
    hook: 'Compré la versión genérica barata del supermercado vs el producto viral número #1 de TikTok. ¿Cuál vale la pena?',
    body: 'La versión tradicional se rompió al segundo uso y tardó horas en dar resultados mediocres.',
    demo: 'En cambio este tiene materiales de grado profesional, batería de larga duración y miren la potencia en comparación.',
    cta: 'Asegura tu unidad original en el carrito oficial aquí abajo con envío gratis.',
    recordingTip: 'Coloca ambos productos uno al lado del otro y haz una prueba de resistencia o velocidad frente al lente.',
  },
];

export function ContentScriptsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAngle, setSelectedAngle] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Helper de búsqueda estilo WhatsApp con resaltado en negrita
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || !text) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-amber-400/30 text-amber-900 dark:text-amber-200 font-bold px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const filteredScripts = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return SCRIPTS_DATA.filter(item => {
      if (selectedAngle !== 'all' && item.angle !== selectedAngle) {
        return false;
      }
      if (q) {
        const titleMatch = item.title.toLowerCase().includes(q);
        const hookMatch = item.hook.toLowerCase().includes(q);
        const bodyMatch = item.body.toLowerCase().includes(q);
        const demoMatch = item.demo.toLowerCase().includes(q);
        const ctaMatch = item.cta.toLowerCase().includes(q);
        const nicheMatch = item.recommendedNiche.toLowerCase().includes(q);
        const tipMatch = item.recordingTip.toLowerCase().includes(q);

        return titleMatch || hookMatch || bodyMatch || demoMatch || ctaMatch || nicheMatch || tipMatch;
      }
      return true;
    });
  }, [searchTerm, selectedAngle]);

  const copyFullScript = (script: ScriptItem) => {
    const fullText = `🎬 TÍTULO: ${script.title}\n🎯 DURACIÓN: ${script.targetDuration} | NICHO: ${script.recommendedNiche}\n\n[0-3s GANCHO]\n${script.hook}\n\n[3-15s RETENCIÓN / PROBLEMA]\n${script.body}\n\n[15-25s DEMO & SOLUCIÓN]\n${script.demo}\n\n[25-35s LLAMADO A LA ACCIÓN (CTA)]\n${script.cta}\n\n💡 TIP DE GRABACIÓN:\n${script.recordingTip}`;

    navigator.clipboard.writeText(fullText);
    setCopiedId(script.id);
    toast.success('¡Guión completo copiado al portapapeles!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const copyHookOnly = (hook: string) => {
    navigator.clipboard.writeText(hook);
    toast.success('¡Gancho (Hook) copiado!');
  };

  return (
    <div className="space-y-6">
      {/* Controles de Filtros y Búsqueda */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar en guiones, ganchos virales, nichos o tips de grabación..."
              className="w-full pl-11 pr-10 py-2.5 rounded-2xl bg-gray-50 dark:bg-dark-900/60 border border-gray-200 dark:border-dark-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:text-dark-100 placeholder-gray-400 dark:placeholder-dark-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Chips de Filtro por Ángulo */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'Todos los Guiones' },
            { id: 'hook', label: '🎣 Scroll Stoppers' },
            { id: 'pas', label: '⚠️ Problema - Solución' },
            { id: 'tiktok_made_me', label: '🤫 TikTok Made Me Buy It' },
            { id: 'transformation', label: '🔄 Antes y Después' },
            { id: 'comparison', label: '⚡ Comparativa Directa' },
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedAngle(f.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedAngle === f.id
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-300 hover:bg-gray-200 dark:hover:bg-dark-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Guiones */}
      {filteredScripts.length === 0 ? (
        <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-gray-900 dark:text-dark-100">No se encontraron guiones</h3>
          <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">
            No hay guiones que coincidan con &quot;{searchTerm}&quot;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredScripts.map(script => (
            <div
              key={script.id}
              className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm overflow-hidden flex flex-col justify-between hover:border-amber-400/50 dark:hover:border-amber-500/50 transition-all group"
            >
              {/* Header de Card */}
              <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-dark-700 bg-gradient-to-r from-amber-50/40 via-white to-orange-50/40 dark:from-dark-800 dark:via-dark-800 dark:to-dark-800">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
                    {script.angleLabel}
                  </span>
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-dark-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" /> {script.targetDuration}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <Flame className="w-3.5 h-3.5" /> {script.retentionScore}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-gray-900 dark:text-dark-100 leading-snug">
                  {highlightMatch(script.title, searchTerm)}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Nicho sugerido: <strong className="text-gray-600 dark:text-dark-300">{highlightMatch(script.recommendedNiche, searchTerm)}</strong>
                </p>
              </div>

              {/* Bloques de Guión Paso a Paso */}
              <div className="p-5 sm:p-6 space-y-4 text-xs">
                {/* 0-3s Gancho */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Zap className="w-3 h-3" /> [0 - 3s] Gancho de Impacto (Hook)
                    </span>
                    <button
                      type="button"
                      onClick={() => copyHookOnly(script.hook)}
                      className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-0.5"
                    >
                      <Copy className="w-2.5 h-2.5" /> Copiar Hook
                    </button>
                  </div>
                  <p className="text-gray-800 dark:text-dark-100 font-medium italic">
                    &quot;{highlightMatch(script.hook, searchTerm)}&quot;
                  </p>
                </div>

                {/* 3-15s Retención */}
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-dark-900/50 border border-gray-100 dark:border-dark-700 space-y-1">
                  <span className="font-bold text-gray-500 dark:text-dark-400 uppercase tracking-wider text-[10px]">
                    [3 - 15s] Problema & Retención
                  </span>
                  <p className="text-gray-700 dark:text-dark-200">
                    {highlightMatch(script.body, searchTerm)}
                  </p>
                </div>

                {/* 15-25s Demo */}
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-dark-900/50 border border-gray-100 dark:border-dark-700 space-y-1">
                  <span className="font-bold text-gray-500 dark:text-dark-400 uppercase tracking-wider text-[10px]">
                    [15 - 25s] Demostración & Solución
                  </span>
                  <p className="text-gray-700 dark:text-dark-200">
                    {highlightMatch(script.demo, searchTerm)}
                  </p>
                </div>

                {/* 25-35s CTA */}
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider text-[10px]">
                    [25 - 35s] Llamado a la Acción (CTA Carrito)
                  </span>
                  <p className="text-gray-800 dark:text-dark-100 font-medium">
                    {highlightMatch(script.cta, searchTerm)}
                  </p>
                </div>

                {/* Tip de Grabación */}
                <div className="flex items-start gap-2 pt-1 text-[11px] text-gray-500 dark:text-dark-400">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-gray-700 dark:text-dark-200">Consejo Pro: </strong>
                    {highlightMatch(script.recordingTip, searchTerm)}
                  </span>
                </div>
              </div>

              {/* Botón de Copiar Guión Completo */}
              <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-900/30 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">Listo para personalizar y grabar</span>
                <button
                  type="button"
                  onClick={() => copyFullScript(script)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    copiedId === script.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 hover:bg-amber-600 text-white'
                  }`}
                >
                  {copiedId === script.id ? (
                    <>
                      <Check className="w-4 h-4" /> ¡Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copiar Guión Completo
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
