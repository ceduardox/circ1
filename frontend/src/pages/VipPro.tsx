import { useEffect, useState } from 'react';
import {
  Rocket, ShoppingBag, Wallet, CheckCircle2,
  Circle, ExternalLink, Loader2, Crown, ChevronDown, Zap, Users, Package,
  AlertTriangle, RefreshCw,
} from 'lucide-react';
import { clsx } from 'clsx';
import { PageHeader, ButtonPrimary } from '@/components/ui';
import { useVipProStore, VipProModule } from '@/store/vipProStore';
import { toast } from 'sonner';

const iconMap: Record<string, any> = {
  Rocket,
  ShoppingBag,
  Wallet,
  Zap,
  Users,
  Package,
};

export function VipProPage() {
  const { modules, loading, error, fetchModules, toggleModule } = useVipProStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const completed = modules.filter(m => m.completed).length;

  const handleToggle = async (m: VipProModule) => {
    setTogglingId(m.id);
    try {
      await toggleModule(m.id);
      toast.success(m.completed ? `"${m.title}" marcado como pendiente` : `"${m.title}" completado. ¡Sigue así!`);
    } catch (e: any) {
      toast.error(e.message || 'No se pudo actualizar');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="VIP Pro"
        subtitle="Tu franquicia limitada para vender los productos de ryztor.com"
        icon={Crown}
      />

      {/* Hero compacto */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-700 via-violet-600 to-indigo-700 text-white p-6 sm:p-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 animate-gradient-x" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-[.25em] text-amber-300">Franquicia limitada · ryztor.com</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black leading-tight">
              Vende en TikTok Shop. Sin LLC. Sin ITIN.
            </h2>
            <p className="mt-2 text-sm text-purple-100 max-w-md">
              Usa el puente con afiliados de TikTok Shop. Tú compartes, ellos venden, tú ganas.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/20 px-4 py-3 text-center">
              <p className="text-3xl font-black">{completed}/{modules.length}</p>
              <p className="text-[10px] uppercase tracking-wider text-purple-100 mt-1">pasos completados</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/20 px-4 py-3 text-center">
              <p className="text-3xl font-black text-amber-300">+20%</p>
              <p className="text-[10px] uppercase tracking-wider text-purple-100 mt-1">por producto vendido</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      {modules.length > 0 && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-semibold text-gray-900 dark:text-dark-100">Tu camino VIP Pro</span>
            <span className="text-gray-500 dark:text-dark-400">{completed}/{modules.length} módulos</span>
          </div>
          <div className="h-2.5 rounded-full bg-gray-100 dark:bg-dark-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${modules.length ? (completed / modules.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Lista de módulos */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200" role="alert">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-bold">No se pudo cargar VIP Pro</h3>
              <p className="mt-1 break-words text-sm">{error}</p>
              <p className="mt-2 text-xs opacity-75">Endpoint: /api/vip-pro/modules</p>
              <button
                type="button"
                onClick={() => fetchModules()}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                <RefreshCw className="h-4 w-4" />
                Reintentar
              </button>
            </div>
          </div>
        </div>
      ) : modules.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200" role="status">
          La API respondió correctamente, pero no hay módulos VIP Pro activos para mostrar.
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((m, idx) => {
            const Icon = iconMap[m.icon] || Rocket;
            const expanded = expandedId === m.id;
            return (
              <div
                key={m.id}
                className={clsx(
                  'rounded-2xl border bg-white dark:bg-dark-800 shadow-sm overflow-hidden transition-all',
                  m.completed
                    ? 'border-emerald-300 dark:border-emerald-800'
                    : 'border-gray-100 dark:border-dark-700'
                )}
              >
                {/* Banner con imagen */}
                {m.image && (
                  <div
                    onClick={() => setExpandedId(expanded ? null : m.id)}
                    className="relative h-36 sm:h-44 overflow-hidden cursor-pointer group"
                    role="button"
                    aria-expanded={expanded}
                    aria-label={expanded ? `Cerrar ${m.title}` : `Abrir ${m.title}`}
                  >
                    <img
                      src={m.image}
                      alt={m.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    {m.completed && (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase shadow flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Listo
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                          Paso {idx + 1}
                        </span>
                        <h3 className="font-black text-white text-lg sm:text-xl leading-tight mt-0.5">
                          {m.title}
                        </h3>
                        {m.statNumber && (
                          <p className="text-white/85 text-sm mt-0.5">
                            <span className="font-black text-amber-300">{m.statNumber}</span>
                            {' '}{m.statLabel}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 w-9 h-9 rounded-xl bg-white/15 backdrop-blur border border-white/25 text-white flex items-center justify-center transition-all duration-300 group-hover:bg-white/25">
                        <ChevronDown
                          className={clsx(
                            'w-5 h-5 transition-transform duration-300',
                            expanded ? 'rotate-180 scale-110' : 'group-hover:translate-y-0.5'
                          )}
                        />
                      </span>
                    </div>
                  </div>
                )}

                {/* Sin imagen: encabezado clásico */}
                {!m.image && (
                  <button
                    onClick={() => setExpandedId(expanded ? null : m.id)}
                    className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors"
                  >
                    <div className={clsx(
                      'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
                      m.completed
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/20'
                    )}>
                      {m.completed ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-dark-500">
                          Paso {idx + 1}
                        </span>
                        {m.completed && (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase">
                            Listo
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-dark-100 leading-tight">{m.title}</h3>
                      {m.statNumber && (
                        <p className="text-sm text-gray-500 dark:text-dark-400 mt-0.5">
                          <span className="font-black text-violet-600 dark:text-violet-400">{m.statNumber}</span>
                          {' '}{m.statLabel}
                        </p>
                      )}
                    </div>

                    <ChevronDown className={clsx('w-5 h-5 text-gray-400 shrink-0 transition-transform', expanded && 'rotate-180')} />
                  </button>
                )}

                {expanded && (
                  <div className="border-t border-gray-100 dark:border-dark-700 px-4 sm:px-5 py-5 space-y-5 bg-gray-50/50 dark:bg-dark-800">
                    {m.description && (
                      <p className="text-sm leading-6 text-gray-600 dark:text-dark-300">{m.description}</p>
                    )}

                    {/* Pasos */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-dark-500 mb-3">
                        Cómo hacerlo
                      </p>
                      <ol className="space-y-2.5">
                        {m.steps.map((step, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-dark-200">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-bold shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span className="leading-6">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Registros (checks por plataforma) */}
                    {m.checkItems && m.checkItems.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-dark-500 mb-3">
                          Marca cuando te registres
                        </p>
                        <div className="space-y-2">
                          {m.checkItems.map((item, i) => {
                            const isChecked = m.checks?.includes(item) ?? false;
                            return (
                              <label
                                key={i}
                                className={clsx(
                                  'flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all select-none',
                                  isChecked
                                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20'
                                    : 'border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 hover:border-violet-300 dark:hover:border-violet-700'
                                )}
                              >
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 accent-emerald-600 shrink-0"
                                  checked={isChecked}
                                  disabled={togglingId === m.id}
                                  onChange={() => {
                                    setTogglingId(m.id);
                                    toggleModule(m.id, item)
                                      .catch((e: any) => toast.error(e.message || 'No se pudo actualizar'))
                                      .finally(() => setTogglingId(null));
                                  }}
                                />
                                <span className={clsx(
                                  'flex-1 text-sm font-medium',
                                  isChecked
                                    ? 'text-emerald-800 dark:text-emerald-300 line-through decoration-emerald-300'
                                    : 'text-gray-800 dark:text-dark-100'
                                )}>
                                  {item}
                                </span>
                                {togglingId === m.id && <Loader2 className="w-4 h-4 animate-spin text-gray-400 shrink-0" />}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Links */}
                    {m.links.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-dark-500 mb-3">
                          Herramientas y sitios
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {m.links.map((l, i) => (
                            <a
                              key={i}
                              href={l.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-sm font-medium text-gray-800 dark:text-dark-100 hover:border-violet-400 dark:hover:border-violet-600 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                            >
                              {l.label}
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Toggle completado (solo para módulos sin checklist) */}
                    {(!m.checkItems || m.checkItems.length === 0) && (
                      <ButtonPrimary
                        onClick={() => handleToggle(m)}
                        disabled={togglingId === m.id}
                        className={clsx('w-full sm:w-auto', m.completed && '!bg-emerald-600 hover:!bg-emerald-700')}
                      >
                        {togglingId === m.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : m.completed ? (
                          <Circle className="w-4 h-4" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        {m.completed ? 'Marcar como pendiente' : 'Completé este paso'}
                      </ButtonPrimary>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
