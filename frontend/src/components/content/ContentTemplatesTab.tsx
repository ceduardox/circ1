import { useState } from 'react';
import {
  Sparkles, Download, Copy, Check, ExternalLink, Flame, ShieldCheck,
  Star, Truck, Tag, AlertCircle, Play, Music, ArrowDownRight, Layers, FileCode
} from 'lucide-react';
import { toast } from 'sonner';

interface BadgeTemplate {
  id: string;
  title: string;
  category: 'shipping' | 'discount' | 'social_proof' | 'cta' | 'urgency';
  bgGradient: string;
  textColor: string;
  icon: any;
  subtext: string;
}

const BADGES: BadgeTemplate[] = [
  {
    id: 'b-1',
    title: 'ENVÍO GRATIS 24-48H',
    category: 'shipping',
    bgGradient: 'from-emerald-500 to-teal-600',
    textColor: 'text-white',
    icon: Truck,
    subtext: 'Entrega prioritaria a todo el país',
  },
  {
    id: 'b-2',
    title: '50% DE DESCUENTO FLASH',
    category: 'discount',
    bgGradient: 'from-rose-500 to-red-600',
    textColor: 'text-white',
    icon: Tag,
    subtext: 'Promoción por tiempo limitado',
  },
  {
    id: 'b-3',
    title: 'TOP #1 MÁS VENDIDO EN TIKTOK',
    category: 'social_proof',
    bgGradient: 'from-amber-400 to-yellow-500',
    textColor: 'text-slate-950',
    icon: Star,
    subtext: '+10,000 clientes satisfechos',
  },
  {
    id: 'b-4',
    title: '👇 TOCA EL CARRITO AMARILLO',
    category: 'cta',
    bgGradient: 'from-yellow-400 to-amber-500',
    textColor: 'text-slate-950',
    icon: ArrowDownRight,
    subtext: 'Compra directa sin salir de la app',
  },
  {
    id: 'b-5',
    title: 'GARANTÍA DE 30 DÍAS',
    category: 'social_proof',
    bgGradient: 'from-blue-500 to-indigo-600',
    textColor: 'text-white',
    icon: ShieldCheck,
    subtext: 'Satisfacción 100% o devolución',
  },
  {
    id: 'b-6',
    title: '⚠️ ÚLTIMAS UNIDADES EN STOCK',
    category: 'urgency',
    bgGradient: 'from-orange-500 to-red-600',
    textColor: 'text-white',
    icon: AlertCircle,
    subtext: 'Alta demanda en las últimas 24h',
  },
];

const CAPCUT_PRESETS = [
  {
    id: 'c-1',
    title: 'Viral Hook 3 Cortes + Subtítulos Hormozi',
    software: 'CapCut',
    tag: 'Edición Rápida',
    desc: 'Estructura con zoom in/out dinámico en los primeros 3 segundos y subtítulos con palabras clave animadas en amarillo.',
    duration: '15 - 30 seg',
    link: 'https://www.capcut.com/template-detail/72910382910',
  },
  {
    id: 'c-2',
    title: 'Split Screen: Problema vs Solución',
    software: 'CapCut / Premiere',
    tag: 'Conversión Alta',
    desc: 'Pantalla partida 50/50: Arriba la situación incómoda y abajo el producto resolviéndolo en segundos.',
    duration: '20 - 35 seg',
    link: 'https://www.capcut.com/template-detail/71829384910',
  },
  {
    id: 'c-3',
    title: 'Plantilla de Portadas TikTok CTR 12%+',
    software: 'Canva Pro',
    tag: 'Portadas Feed',
    desc: 'Kit de 6 portadas editables con tipografías de alto contraste y stickers que disparan los clics en el perfil.',
    duration: 'Imagen 9:16',
    link: 'https://www.canva.com/design/DAGtemplate_circulo1',
  },
];

export function ContentTemplatesTab() {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Genera y descarga el badge como PNG transparente usando un Canvas virtual
  const downloadBadgePNG = (badge: BadgeTemplate) => {
    setDownloadingId(badge.id);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Fondo redondeado con gradiente
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Sombra
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 8;

        const radius = 36;
        ctx.beginPath();
        ctx.roundRect(20, 20, 760, 200, radius);
        
        // Gradient
        const grad = ctx.createLinearGradient(0, 0, 800, 0);
        if (badge.category === 'shipping') {
          grad.addColorStop(0, '#10b981');
          grad.addColorStop(1, '#0d9488');
        } else if (badge.category === 'discount') {
          grad.addColorStop(0, '#f43f5e');
          grad.addColorStop(1, '#e11d48');
        } else if (badge.category === 'social_proof' && badge.id === 'b-3') {
          grad.addColorStop(0, '#fbbf24');
          grad.addColorStop(1, '#f59e0b');
        } else if (badge.category === 'cta') {
          grad.addColorStop(0, '#facc15');
          grad.addColorStop(1, '#eab308');
        } else if (badge.category === 'urgency') {
          grad.addColorStop(0, '#f97316');
          grad.addColorStop(1, '#dc2626');
        } else {
          grad.addColorStop(0, '#3b82f6');
          grad.addColorStop(1, '#4f46e5');
        }
        ctx.fillStyle = grad;
        ctx.fill();

        // Texto
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = badge.textColor === 'text-slate-950' ? '#0f172a' : '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(badge.title, 400, 110);

        ctx.font = 'normal 22px sans-serif';
        ctx.fillStyle = badge.textColor === 'text-slate-950' ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.85)';
        ctx.fillText(badge.subtext, 400, 160);

        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `sticker_${badge.id}_circulo1.png`;
        link.href = dataUrl;
        link.click();
        toast.success(`Sticker "${badge.title}" descargado en PNG.`);
      }
    } catch (e) {
      toast.error('Error al generar la imagen.');
    } finally {
      setDownloadingId(null);
    }
  };

  const copyTemplateLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('¡Enlace de la plantilla copiado!');
  };

  return (
    <div className="space-y-8">
      {/* Sección 1: Stickers y Overlays PNG */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Insignias & Stickers PNG Transparentes
            </h2>
            <p className="text-xs text-gray-500 dark:text-dark-400">
              Agrégalos sobre tus videos en CapCut, TikTok o Reels para multiplicar la confianza y las conversiones.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 border border-purple-200/50 self-start sm:self-auto">
            PNG Transparente HD
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BADGES.map(badge => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.id}
                className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                {/* Visualizador del Sticker */}
                <div
                  className={`relative w-full rounded-2xl p-4 bg-gradient-to-r ${badge.bgGradient} ${badge.textColor} shadow-md flex items-center gap-3 overflow-hidden`}
                >
                  <div className="w-10 h-10 rounded-xl bg-black/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm tracking-tight leading-tight truncate">{badge.title}</p>
                    <p className="text-[11px] opacity-90 truncate mt-0.5">{badge.subtext}</p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-dark-700">
                  <span className="text-[11px] text-gray-400 capitalize">Categoría: {badge.category}</span>
                  <button
                    type="button"
                    onClick={() => downloadBadgePNG(badge)}
                    disabled={downloadingId === badge.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Descargar PNG
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sección 2: Plantillas Editables CapCut y Canva */}
      <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-dark-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              Plantillas Editables (CapCut & Canva)
            </h2>
            <p className="text-xs text-gray-500 dark:text-dark-400">
              Estructuras listas para clonar: solo reemplaza el video del producto y exporta en 2 minutos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CAPCUT_PRESETS.map(preset => (
            <div
              key={preset.id}
              className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 p-5 shadow-sm hover:border-indigo-400/50 dark:hover:border-indigo-500/50 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold border border-indigo-200/50">
                    {preset.software}
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">{preset.duration}</span>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 dark:text-dark-100 text-sm leading-snug">
                    {preset.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-dark-400 mt-1.5 leading-relaxed">
                    {preset.desc}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-100 dark:border-dark-700 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => copyTemplateLink(preset.link)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-dark-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar Link
                </button>
                <a
                  href={preset.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir Plantilla
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sección 3: Sonidos y Audios de Tendencia */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-white/10 p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-300">
              <Music className="w-4 h-4 text-pink-400" />
              Audios de Tendencia Recomendados
            </div>
            <h3 className="text-base font-bold">Estrategia de Audio de Fondo</h3>
            <p className="text-xs text-indigo-100/80">
              Usa audios virales con el volumen al 5% - 10% para que el algoritmo clasifique tu video en la tendencia sin tapar tu voz.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <p className="font-bold text-pink-300">1. Beats Upbeat Dinámicos</p>
            <p className="text-gray-300 mt-1">Ideales para videos de demostración rápida, gadgets y compras compulsivas.</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <p className="font-bold text-teal-300">2. Sonidos ASMR Relajantes</p>
            <p className="text-gray-300 mt-1">Perfectos para cosmética, texturas, unboxing y apertura de cajas.</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <p className="font-bold text-amber-300">3. Audios de Suspenso Suave</p>
            <p className="text-gray-300 mt-1">Para videos de &quot;Storytelling&quot;, desmentir mitos y advertencias de compra.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
