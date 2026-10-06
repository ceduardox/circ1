import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FolderOpen, FileText, Sparkles, Compass, Loader2, Film, Image as ImageIcon,
  Zap, Download, ArrowRight, Layers, Eye, CheckCircle2, TrendingUp, ShieldCheck
} from 'lucide-react';
import { tiktokApi } from '@/services/api';
import { PageHeader } from '@/components/ui';
import { toast } from 'sonner';
import { ContentMaterialsTab } from '@/components/content/ContentMaterialsTab';
import { ContentScriptsTab } from '@/components/content/ContentScriptsTab';
import { ContentTemplatesTab } from '@/components/content/ContentTemplatesTab';
import { ContentGuidelinesTab } from '@/components/content/ContentGuidelinesTab';

export function ContentMaterialsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'materials';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tiktokApi
      .material()
      .then(r => setData(r.data))
      .catch((e: any) => toast.error(e.response?.data?.error || 'Error al cargar el material'))
      .finally(() => setLoading(false));
  }, []);

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const categories = data?.categories || [];
  const totalProducts = categories.reduce((s: number, c: any) => s + c.products.length, 0);
  const totalImages = categories.reduce(
    (s: number, c: any) => s + c.products.reduce((pS: number, p: any) => pS + p.media.filter((m: any) => m.type === 'IMAGE').length, 0),
    0
  );
  const totalVideos = categories.reduce(
    (s: number, c: any) => s + c.products.reduce((pS: number, p: any) => pS + p.media.filter((m: any) => m.type === 'VIDEO').length, 0),
    0
  );

  const tabs = [
    {
      id: 'materials',
      label: 'Material de Productos',
      icon: FolderOpen,
      count: `${totalVideos + totalImages} Creativos`,
      color: 'from-teal-500 to-emerald-600',
    },
    {
      id: 'scripts',
      label: 'Guiones y Hooks',
      icon: FileText,
      count: '5 Estructuras',
      color: 'from-amber-500 to-orange-600',
    },
    {
      id: 'templates',
      label: 'Plantillas y Overlays',
      icon: Sparkles,
      count: 'Kit de Diseño',
      color: 'from-purple-500 to-indigo-600',
    },
    {
      id: 'guidelines',
      label: 'Algoritmo y Reglas',
      icon: Compass,
      count: 'Guía Viral',
      color: 'from-pink-500 to-rose-600',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Hub de Contenido y Creativos"
        subtitle="Videos UGC listos para publicar, fotos HD de productos, guiones de alta conversión y plantillas virales para tus redes."
        icon={FolderOpen}
      />

      {/* Hero Banner Hub */}
      <div className="relative overflow-hidden rounded-3xl text-white shadow-2xl border border-white/10 bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 p-6 sm:p-9">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold uppercase tracking-[.15em] text-teal-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Librería de Recursos · Círculo 1</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight">
              Creativos listos para usar. <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                Multiplica tus conversiones.
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
              Descarga videos en formato vertical 9:16, imágenes de alta resolución y guiones probados de ventas con llamados a la acción al carrito amarillo.
            </p>

            {/* Métricas rápidas */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-3 text-center">
                <Film className="w-4 h-4 text-teal-300 mx-auto" />
                <p className="text-lg font-black text-teal-300 mt-1">{loading ? '...' : totalVideos}</p>
                <p className="text-[10px] uppercase tracking-wider text-teal-200 mt-0.5">Videos UGC</p>
              </div>
              <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-3 text-center">
                <ImageIcon className="w-4 h-4 text-emerald-300 mx-auto" />
                <p className="text-lg font-black text-emerald-300 mt-1">{loading ? '...' : totalImages}</p>
                <p className="text-[10px] uppercase tracking-wider text-emerald-200 mt-0.5">Fotos HD</p>
              </div>
              <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-3 text-center">
                <Zap className="w-4 h-4 text-amber-300 mx-auto" />
                <p className="text-lg font-black text-amber-300 mt-1">1-Clic</p>
                <p className="text-[10px] uppercase tracking-wider text-amber-200 mt-0.5">Descarga Directa</p>
              </div>
            </div>
          </div>

          <div className="lg:w-80 shrink-0">
            <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Garantía de Contenido Seguro
              </p>
              <div className="space-y-2.5 text-xs text-teal-100/90">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sin marcas de agua de terceros</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Formato 9:16 vertical 1080p nativo</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Optimizados para el algoritmo 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de Pestañas con estilo interactivo */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none sticky top-0 z-20 py-2 bg-gray-50/95 dark:bg-dark-900/95 backdrop-blur-md">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shadow-sm border ${
                isActive
                  ? 'bg-white dark:bg-dark-800 text-teal-700 dark:text-teal-300 border-teal-500/40 shadow-md ring-2 ring-teal-500/20'
                  : 'bg-white/70 dark:bg-dark-800/70 text-gray-600 dark:text-dark-300 border-gray-200/80 dark:border-dark-700 hover:bg-white dark:hover:bg-dark-800'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-white bg-gradient-to-tr ${tab.color} shadow-sm`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <p className="leading-tight">{tab.label}</p>
                <p className="text-[10px] font-normal text-gray-400 dark:text-dark-400 mt-0.5">{tab.count}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Renderizado de Pestañas */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-3" />
          <p className="text-sm font-semibold text-gray-600 dark:text-dark-300">Cargando catálogo de creativos...</p>
        </div>
      ) : (
        <div>
          {currentTab === 'materials' && (
            <ContentMaterialsTab categories={categories} loading={loading} />
          )}

          {currentTab === 'scripts' && <ContentScriptsTab />}

          {currentTab === 'templates' && <ContentTemplatesTab />}

          {currentTab === 'guidelines' && <ContentGuidelinesTab />}
        </div>
      )}
    </div>
  );
}
export default ContentMaterialsPage;
