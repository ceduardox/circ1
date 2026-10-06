import { useState, useMemo } from 'react';
import {
  FolderOpen, Image as ImageIcon, Film, Download, Search, X, Package,
  ExternalLink, Sparkles, Filter, Check, Eye, Play, ChevronLeft, ChevronRight,
  Layers, ArrowDownToLine, Share2, Copy
} from 'lucide-react';
import { toast } from 'sonner';

interface MediaItem {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  title?: string;
}

interface ProductItem {
  id: string;
  name: string;
  imageUrl?: string;
  media: MediaItem[];
}

interface CategoryItem {
  id: string;
  name: string;
  products: ProductItem[];
}

interface ContentMaterialsTabProps {
  categories: CategoryItem[];
  loading: boolean;
}

export function ContentMaterialsTab({ categories, loading }: ContentMaterialsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'IMAGE' | 'VIDEO'>('all');
  const [activePreview, setActivePreview] = useState<{
    type: 'IMAGE' | 'VIDEO';
    url: string;
    title?: string;
    productName: string;
  } | null>(null);

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

  // Filtrado reactivo de categorías y productos
  const filteredCategories = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return categories
      .map(cat => {
        // Si hay filtro de categoría seleccionado y no coincide
        if (selectedCategory !== 'all' && cat.id !== selectedCategory) {
          return null;
        }

        const filteredProducts = cat.products
          .map(p => {
            // Filtrar medios por tipo
            const filteredMedia = p.media.filter(m => {
              if (selectedType === 'all') return true;
              return m.type === selectedType;
            });

            if (filteredMedia.length === 0 && selectedType !== 'all') {
              return null;
            }

            // Si hay término de búsqueda
            if (q) {
              const nameMatch = p.name.toLowerCase().includes(q);
              const catMatch = cat.name.toLowerCase().includes(q);
              const mediaMatch = filteredMedia.some(m => (m.title || '').toLowerCase().includes(q));

              if (!nameMatch && !catMatch && !mediaMatch) {
                return null;
              }
            }

            return {
              ...p,
              media: filteredMedia,
            };
          })
          .filter(Boolean) as ProductItem[];

        if (filteredProducts.length === 0) return null;

        return {
          ...cat,
          products: filteredProducts,
        };
      })
      .filter(Boolean) as CategoryItem[];
  }, [categories, searchTerm, selectedCategory, selectedType]);

  const totalProducts = categories.reduce((acc, c) => acc + c.products.length, 0);
  const totalImages = categories.reduce(
    (acc, c) => acc + c.products.reduce((pAcc, p) => pAcc + p.media.filter(m => m.type === 'IMAGE').length, 0),
    0
  );
  const totalVideos = categories.reduce(
    (acc, c) => acc + c.products.reduce((pAcc, p) => pAcc + p.media.filter(m => m.type === 'VIDEO').length, 0),
    0
  );

  const copyMediaLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('¡Enlace del recurso copiado!');
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y Buscador WhatsApp */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Input Buscador */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por producto, categoría, video o imagen..."
              className="w-full pl-11 pr-10 py-2.5 rounded-2xl bg-gray-50 dark:bg-dark-900/60 border border-gray-200 dark:border-dark-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-dark-100 placeholder-gray-400 dark:placeholder-dark-500 transition-all"
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

          {/* Filtro de Tipo de Medios */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-dark-700/60 rounded-2xl shrink-0">
            <button
              type="button"
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedType === 'all'
                  ? 'bg-white dark:bg-dark-800 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-gray-500 dark:text-dark-400 hover:text-gray-900'
              }`}
            >
              Todos ({totalImages + totalVideos})
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('VIDEO')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedType === 'VIDEO'
                  ? 'bg-white dark:bg-dark-800 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-gray-500 dark:text-dark-400 hover:text-gray-900'
              }`}
            >
              <Film className="w-3.5 h-3.5" /> Videos ({totalVideos})
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('IMAGE')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedType === 'IMAGE'
                  ? 'bg-white dark:bg-dark-800 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-gray-500 dark:text-dark-400 hover:text-gray-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Fotos ({totalImages})
            </button>
          </div>
        </div>

        {/* Categorías Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-300 hover:bg-gray-200 dark:hover:bg-dark-600'
            }`}
          >
            Todas las Categorías ({categories.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-300 hover:bg-gray-200 dark:hover:bg-dark-600'
              }`}
            >
              {cat.name} ({cat.products.length})
            </button>
          ))}
        </div>
      </div>

      {/* Resultados de Materiales */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-900/30 text-teal-500 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-dark-100 mb-1">
            {searchTerm ? 'No se encontraron coincidencias' : 'No hay materiales disponibles'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-dark-400 max-w-md mx-auto">
            {searchTerm
              ? `No encontramos productos ni creativos que coincidan con "${searchTerm}". Intenta con otra palabra clave o limpia el filtro.`
              : 'Pronto se añadirán nuevos paquetes de videos e imágenes de alta conversión.'}
          </p>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedType('all');
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors"
            >
              Limpiar filtros de búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {filteredCategories.map(cat => (
            <div key={cat.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-sm">
                    <FolderOpen className="w-3.5 h-3.5" />
                  </div>
                  <span>{highlightMatch(cat.name, searchTerm)}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-300">
                    {cat.products.length} producto{cat.products.length === 1 ? '' : 's'}
                  </span>
                </h2>
              </div>

              <div className="space-y-6">
                {cat.products.map(product => {
                  const images = product.media.filter(m => m.type === 'IMAGE');
                  const videos = product.media.filter(m => m.type === 'VIDEO');

                  return (
                    <div
                      key={product.id}
                      className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200/80 dark:border-dark-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* Cabecera de Producto */}
                      <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-dark-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-gray-50/50 via-white to-gray-50/50 dark:from-dark-800 dark:via-dark-800 dark:to-dark-800">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 flex items-center justify-center shrink-0">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-dark-100 text-base">
                              {highlightMatch(product.name, searchTerm)}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500 dark:text-dark-400">
                                {videos.length} videos · {images.length} imágenes
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Material Verificado
                          </span>
                        </div>
                      </div>

                      {/* Contenido Multimedia */}
                      <div className="p-4 sm:p-6 space-y-6">
                        {/* Galería de Videos UGC */}
                        {videos.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-dark-400 flex items-center gap-1.5">
                                <Film className="w-3.5 h-3.5 text-rose-500" />
                                Videos UGC & Reels Listos para Publicar ({videos.length})
                              </p>
                              <span className="text-[11px] text-gray-400">Formato 9:16 Vertical HD</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {videos.map(v => (
                                <div
                                  key={v.id}
                                  className="group relative rounded-2xl overflow-hidden border border-gray-200 dark:border-dark-700 bg-black flex flex-col justify-between shadow-sm"
                                >
                                  {/* Player Container */}
                                  <div className="relative aspect-[9/14] sm:aspect-[9/16] max-h-72 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                                    <video
                                      src={v.url}
                                      preload="metadata"
                                      className="w-full h-full object-cover"
                                    />
                                    {/* Overlay de Play */}
                                    <div
                                      onClick={() =>
                                        setActivePreview({
                                          type: 'VIDEO',
                                          url: v.url,
                                          title: v.title || product.name,
                                          productName: product.name,
                                        })
                                      }
                                      className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                                    >
                                      <div className="w-12 h-12 rounded-full bg-white/90 group-hover:bg-white text-gray-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        <Play className="w-5 h-5 fill-current ml-0.5" />
                                      </div>
                                      <span className="text-xs font-semibold text-white/90 drop-shadow-md">
                                        Vista Previa
                                      </span>
                                    </div>

                                    {/* Badge HD */}
                                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold">
                                      1080p
                                    </span>
                                  </div>

                                  {/* Botonera de Video */}
                                  <div className="p-3 bg-white dark:bg-dark-800 border-t border-gray-100 dark:border-dark-700 flex items-center justify-between gap-2">
                                    <p className="text-xs font-semibold text-gray-800 dark:text-dark-200 truncate flex-1">
                                      {highlightMatch(v.title || product.name, searchTerm)}
                                    </p>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => copyMediaLink(v.url)}
                                        title="Copiar enlace del video"
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                      <a
                                        href={v.url}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-colors"
                                      >
                                        <Download className="w-3.5 h-3.5" /> Descargar
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Galería de Imágenes */}
                        {images.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-dark-400 flex items-center gap-1.5">
                                <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                                Fotos de Producto & Banners ({images.length})
                              </p>
                              <span className="text-[11px] text-gray-400">Alta Definición</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                              {images.map(img => (
                                <div
                                  key={img.id}
                                  className="group relative rounded-2xl overflow-hidden border border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900 aspect-square"
                                >
                                  <img
                                    src={img.url}
                                    alt={img.title || product.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                    <div className="flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => copyMediaLink(img.url)}
                                        className="p-1 rounded-md bg-black/50 text-white hover:bg-black/70"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setActivePreview({
                                            type: 'IMAGE',
                                            url: img.url,
                                            title: img.title || product.name,
                                            productName: product.name,
                                          })
                                        }
                                        className="flex-1 py-1 px-2 rounded-lg bg-white/90 text-gray-900 text-[11px] font-bold text-center hover:bg-white flex items-center justify-center gap-1"
                                      >
                                        <Eye className="w-3 h-3" /> Ver
                                      </button>
                                      <a
                                        href={img.url}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 rounded-lg bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal / Lightbox de Vista Previa */}
      {activePreview && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setActivePreview(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-dark-900 rounded-3xl border border-dark-700 overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="p-4 border-b border-dark-700 flex items-center justify-between bg-dark-800">
              <div>
                <p className="text-xs text-teal-400 font-semibold">{activePreview.productName}</p>
                <h4 className="text-sm font-bold text-white truncate max-w-md">
                  {activePreview.title || 'Vista Previa de Recurso'}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activePreview.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar HD
                </a>
                <button
                  type="button"
                  onClick={() => setActivePreview(null)}
                  className="p-2 rounded-xl bg-dark-700 text-gray-400 hover:text-white hover:bg-dark-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-black flex items-center justify-center p-2 sm:p-6 overflow-hidden min-h-[300px]">
              {activePreview.type === 'IMAGE' ? (
                <img
                  src={activePreview.url}
                  alt={activePreview.title}
                  className="max-w-full max-h-[70vh] object-contain rounded-xl"
                />
              ) : (
                <video
                  src={activePreview.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[70vh] rounded-xl"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
