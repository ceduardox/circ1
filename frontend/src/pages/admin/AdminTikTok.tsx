import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, User, Plus, Trash2, Pencil, CheckCircle, XCircle, Loader2,
  Package, Music, DollarSign, ExternalLink, Users, ShoppingBag, ChevronLeft,
  ChevronRight, ChevronDown, Mail, MapPin, Crown, X, FolderOpen, Film,
  Upload, Sparkles, Zap, Flame, ShieldAlert, Eye, TrendingUp, Check, Layers,
  Filter, Play, ArrowRight, Video, Image as ImageIcon
} from 'lucide-react';
import { adminTiktokApi, adminBusinessApi } from '@/services/api';
import { Input, Label, ButtonPrimary, Button, PageHeader } from '@/components/ui';
import { TikTokIcon, TikTokShopIcon } from '@/components/TikTokLogo';
import { toast } from 'sonner';
import { clsx } from 'clsx';

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

// Helper de búsqueda estilo WhatsApp con resaltado en negrita
const highlightMatch = (text: string, query: string) => {
  if (!query || !query.trim() || !text) return text;
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

const creatorStatusMeta: Record<string, { label: string; classes: string }> = {
  PENDIENTE: { label: 'Pendiente', classes: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200/50' },
  ACEPTADO: { label: 'Aceptado', classes: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200/50' },
  ACTIVO: { label: 'Activo', classes: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50' },
};

type Tab = 'usuarios' | 'productos' | 'material' | 'comisiones';

function usePackBaseDefaults() {
  const [base, setBase] = useState({ base500: 3, base1000: 5 });
  useEffect(() => {
    adminBusinessApi.settings()
      .then(({ data }) => {
        setBase({
          base500: Number(data.tiktokBaseCreators500 ?? 5) || 0,
          base1000: Number(data.tiktokBaseCreators1000 ?? 10) || 0,
        });
      })
      .catch(() => {});
  }, []);
  return base;
}

export function AdminTikTokPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get('tab') as Tab) || 'usuarios';

  const setTab = (t: Tab) => {
    setSearchParams({ tab: t });
  };

  const tabs = [
    { id: 'usuarios', label: 'Usuarios y Campañas', icon: Users, color: 'from-blue-500 to-indigo-600' },
    { id: 'productos', label: 'Catálogo de Productos', icon: Package, color: 'from-purple-500 to-fuchsia-600' },
    { id: 'material', label: 'Material Creativo', icon: FolderOpen, color: 'from-teal-500 to-emerald-600' },
    { id: 'comisiones', label: 'Comisiones por Aprobar', icon: DollarSign, color: 'from-amber-500 to-orange-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Administración de TikTok Shop"
        subtitle="Gestiona campañas, asigna creadores de contenido, administra productos y autoriza comisiones de venta."
        icon={TikTokShopIcon}
      />

      {/* Hero Banner Panel Admin */}
      <div className="relative overflow-hidden rounded-3xl text-white shadow-2xl border border-white/10 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6 sm:p-8">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold uppercase tracking-[.15em] text-pink-300">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Centro de Control TikTok Shop</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Control de Campañas y Creadores
            </h1>
            <p className="text-xs sm:text-sm text-purple-100/80 leading-relaxed">
              Asigna creadores calificados a las cuentas de tus afiliados, registra ventas y aprueba comisiones en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center shrink-0">
              <Zap className="w-4 h-4 text-pink-400 mx-auto" />
              <p className="text-base font-black text-pink-400 mt-0.5">Automático</p>
              <p className="text-[10px] uppercase text-purple-200">Comisiones</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center shrink-0">
              <Film className="w-4 h-4 text-teal-400 mx-auto" />
              <p className="text-base font-black text-teal-400 mt-0.5">Hasta 200MB</p>
              <p className="text-[10px] uppercase text-teal-200">Media Hub</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none sticky top-0 z-20 py-2 bg-gray-50/95 dark:bg-dark-900/95 backdrop-blur-md">
        {tabs.map(t => {
          const Icon = t.icon;
          const active = currentTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={clsx(
                'flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border shadow-sm',
                active
                  ? 'bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 border-pink-500/50 shadow-md ring-2 ring-pink-500/20'
                  : 'bg-white/70 dark:bg-dark-800/70 text-gray-600 dark:text-dark-300 border-gray-200/80 dark:border-dark-700 hover:bg-white dark:hover:bg-dark-800'
              )}
            >
              <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${t.color} text-white flex items-center justify-center shadow-sm`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render Tabs */}
      {currentTab === 'usuarios' && <UsersTab />}
      {currentTab === 'productos' && <ProductsTab />}
      {currentTab === 'material' && <MaterialTab />}
      {currentTab === 'comisiones' && <CommissionsTab />}
    </div>
  );
}

// ─── Usuarios y campañas (lista paginada con activación de pack) ───
function UsersTab() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [packBusy, setPackBusy] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'with_campaign' | 'no_campaign'>('all');
  const { base500, base1000 } = usePackBaseDefaults();

  const load = async (targetPage = page, term = search) => {
    setLoading(true);
    try {
      const { data } = await adminTiktokApi.searchUsers(term.trim(), targetPage);
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || 1);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    load(1, search);
  };

  const assignPack = async (u: any, packType: number) => {
    const base = packType >= 1000 ? base1000 : base500;
    if (!u.tiktokCampaign && !confirm(`¿Activar TikTok Shop para ${u.firstName || u.username} con Pack $${packType}? Se activará su membresía y se repartirán comisiones de red.`)) return;
    setPackBusy(u.id);
    try {
      const { data: res } = await adminTiktokApi.updatePack(u.id, { packType, baseCreators: base });
      const ref = res.referral;
      if (ref?.level1 || ref?.level2) {
        toast.success(`Membresía activada (Pack $${packType}). Comisión de red: ${fmt(ref.level1)} (nivel 1)${ref.level2 ? ` + ${fmt(ref.level2)} (nivel 2)` : ''}`);
      } else if (ref?.skipped === 'already-paid') {
        toast.info(`Pack $${packType} actualizado. El usuario ya pagó membresía (comisión ya generada).`);
      } else {
        toast.success(`Membresía activada con Pack $${packType}`);
      }
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al asignar pack');
    } finally {
      setPackBusy(null);
    }
  };

  const selectUser = async (u: any) => {
    try {
      const { data } = await adminTiktokApi.campaign(u.id);
      setSelected(data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al cargar la campaña');
    }
  };

  const filteredUsers = useMemo(() => {
    if (filterMode === 'with_campaign') {
      return users.filter(u => !!u.tiktokCampaign);
    }
    if (filterMode === 'no_campaign') {
      return users.filter(u => !u.tiktokCampaign);
    }
    return users;
  }, [users, filterMode]);

  return (
    <div className="space-y-4">
      {/* Buscador WhatsApp y Filtros */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm p-4 sm:p-5 space-y-3">
        <form onSubmit={runSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-gray-50 dark:bg-dark-900/60 border border-gray-200 dark:border-dark-700 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-dark-100 placeholder-gray-400 dark:placeholder-dark-500 transition-all"
              placeholder="Buscar usuario por nombre, email, usuario o país..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  load(1, '');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <ButtonPrimary type="submit" disabled={loading} className="!bg-gradient-to-r !from-pink-600 !to-rose-600 !border-0 shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Buscar
          </ButtonPrimary>
        </form>

        {/* Chips de filtro */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              filterMode === 'all'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-300'
            }`}
          >
            Todos ({total})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('with_campaign')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              filterMode === 'with_campaign'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-300'
            }`}
          >
            Con Campaña Activa
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('no_campaign')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              filterMode === 'no_campaign'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-300'
            }`}
          >
            Sin Campaña
          </button>
        </div>
      </div>

      {/* Detalle de campaña (si el admin entra a un usuario) */}
      {selected ? (
        <CampaignDetail data={selected} onBack={() => setSelected(null)} onRefresh={setSelected} />
      ) : (
        <>
          {/* Lista Desktop: Tabla */}
          <div className="hidden lg:block bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-gray-400 dark:text-dark-500 border-b border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-900/40">
                    <th className="px-5 py-3.5">Usuario</th>
                    <th className="px-5 py-3.5">Membresía</th>
                    <th className="px-5 py-3.5">Pack / Creadores</th>
                    <th className="px-5 py-3.5 text-right">Asignar / Activar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/70 dark:hover:bg-dark-700/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <button onClick={() => selectUser(u)} className="flex items-center gap-3 text-left group">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                            {u.firstName?.[0] || u.username?.[0] || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 dark:text-dark-100 truncate group-hover:text-pink-600 transition-colors">
                              {highlightMatch(`${u.firstName || ''} ${u.lastName || ''}`, search)}
                              <span className="text-gray-400 font-normal ml-1">@{highlightMatch(u.username, search)}</span>
                            </p>
                            <p className="text-xs text-gray-500 dark:text-dark-400 flex items-center gap-2 truncate mt-0.5">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span>{highlightMatch(u.email, search)}</span>
                              {u.country && (
                                <>
                                  <span>·</span>
                                  <MapPin className="w-3 h-3 text-gray-400" />
                                  <span>{highlightMatch(u.country, search)}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <MembershipBadge status={u.membershipStatus} />
                      </td>
                      <td className="px-5 py-3.5">
                        {u.tiktokCampaign ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border border-pink-200/50 text-xs font-bold">
                            <TikTokIcon className="w-3.5 h-3.5" />
                            <span>Pack {u.tiktokCampaign.packType}</span>
                            <span className="text-pink-500">·</span>
                            <span>{u.tiktokCampaign._count.creators}/{u.tiktokCampaign.baseCreators + u.tiktokCampaign.extraCreators} creadores</span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-dark-700 text-gray-400">
                            Sin campaña activa
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => selectUser(u)}
                            className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-dark-200 text-xs font-semibold hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-dark-600 transition-colors"
                          >
                            Ver campaña
                          </button>
                          <PackSelect user={u} busy={packBusy === u.id} onAssign={assignPack} base500={base500} base1000={base1000} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lista Móvil */}
          <div className="lg:hidden space-y-3">
            {filteredUsers.map(u => (
              <MobileUserCard
                key={u.id}
                user={u}
                search={search}
                busy={packBusy === u.id}
                onSelect={() => selectUser(u)}
                onAssign={assignPack}
                base500={base500}
                base1000={base1000}
              />
            ))}
          </div>

          {filteredUsers.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400 dark:text-dark-500 text-sm bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No se encontraron usuarios coincidentes.</p>
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-3">
              <Button
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => load(page - 1)}
                className="rounded-xl border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </Button>
              <span className="text-xs font-semibold text-gray-600 dark:text-dark-300">
                Página <strong>{page}</strong> de {totalPages}
              </span>
              <Button
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => load(page + 1)}
                className="rounded-xl border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MembershipBadge({ status }: { status: string }) {
  const meta: Record<string, { label: string; classes: string }> = {
    ACTIVE: { label: 'Activa', classes: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50' },
    INACTIVE: { label: 'Inactiva', classes: 'bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-dark-400' },
    REVOKED: { label: 'Revocada', classes: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
    GRACE: { label: 'En gracia', classes: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200/50' },
    EXPIRED: { label: 'Expirada', classes: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  };
  const m = meta[status] || { label: status || '—', classes: 'bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-dark-400' };
  return (
    <span className={clsx('text-[11px] font-bold px-2.5 py-1 rounded-full', m.classes)}>{m.label}</span>
  );
}

function PackSelect({ user, busy, onAssign, base500, base1000 }: { user: any; busy: boolean; onAssign: (u: any, packType: number) => void; base500: number; base1000: number }) {
  const current = user.tiktokCampaign?.packType;
  return (
    <div className="inline-flex items-center gap-2">
      <select
        className="text-xs rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium"
        value={current ? String(current) : '0'}
        disabled={busy}
        onChange={(e) => {
          const packType = Number(e.target.value);
          if (packType === 0) return;
          onAssign(user, packType);
        }}
      >
        <option value="0">{current ? 'Pack activo' : '— Sin pack —'}</option>
        <option value="500">Pack $500 ({base500})</option>
        <option value="1000">Pack $1000 ({base1000})</option>
      </select>
      {busy && <Loader2 className="w-4 h-4 animate-spin text-pink-600" />}
    </div>
  );
}

function MobileUserCard({ user, search, busy, onSelect, onAssign, base500, base1000 }: { user: any; search: string; busy: boolean; onSelect: () => void; onAssign: (u: any, packType: number) => void; base500: number; base1000: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-dark-700/40 transition-colors">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
          {user.firstName?.[0] || user.username?.[0] || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-dark-100 truncate">
            {highlightMatch(`${user.firstName || ''} ${user.lastName || ''}`, search)}
            <span className="text-gray-400 font-normal ml-1">@{highlightMatch(user.username, search)}</span>
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <MembershipBadge status={user.membershipStatus} />
            {user.tiktokCampaign ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400">
                Pack {user.tiktokCampaign.packType} · {user.tiktokCampaign._count.creators}/{user.tiktokCampaign.baseCreators + user.tiktokCampaign.extraCreators}
              </span>
            ) : (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-dark-400">Sin campaña</span>
            )}
          </div>
        </div>
        <ChevronDown className={clsx('w-4 h-4 text-gray-400 transition-transform shrink-0', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-dark-700 pt-3 space-y-3">
          <p className="text-xs text-gray-500 dark:text-dark-400 truncate flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-gray-400" /> {highlightMatch(user.email, search)}
            {user.country && <><span>·</span><MapPin className="w-3.5 h-3.5 text-gray-400" /> {highlightMatch(user.country, search)}</>}
          </p>
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              onClick={onSelect}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 text-xs font-bold hover:bg-pink-100 transition-colors"
            >
              <Users className="w-3.5 h-3.5" /> Ver campaña
            </button>
            <PackSelect user={user} busy={busy} onAssign={onAssign} base500={base500} base1000={base1000} />
          </div>
        </div>
      )}
    </div>
  );
}

function CampaignDetail({ data, onBack, onRefresh }: { data: any; onBack: () => void; onRefresh: (u: any) => void }) {
  const [showAddCreator, setShowAddCreator] = useState(false);
  const [newCreator, setNewCreator] = useState({ name: '', tiktokUrl: '', status: 'PENDIENTE' });
  const [editingCreator, setEditingCreator] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saleForm, setSaleForm] = useState({ creatorId: '', productId: '', quantity: 1, saleDate: new Date().toISOString().slice(0, 10), notes: '' });
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [planSlots, setPlanSlots] = useState<string[]>([]);
  const [planPicker, setPlanPicker] = useState<number | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const { base500, base1000 } = usePackBaseDefaults();

  const { user, campaign, creators, sales, products, pendingCommissions, maxCreators } = data;

  const isOverLimit = creators.length > maxCreators;
  const userTotal = sales.reduce((s: number, x: any) => s + x.unitPrice * x.quantity, 0);

  useEffect(() => {
    const maxSlots = data?.maxCreators ?? 0;
    const saved: string[] = Array.isArray(data?.campaign?.productSlots) ? data.campaign.productSlots : [];
    setPlanSlots(Array.from({ length: maxSlots }, (_, i) => saved[i] || ''));
  }, [data?.campaign?.id, data?.maxCreators, JSON.stringify(data?.campaign?.productSlots ?? [])]);

  const productById: Record<string, any> = {};
  for (const p of (products || [])) productById[p.id] = p;
  const planUsed = planSlots.filter(Boolean).length;
  const planSaved: string[] = Array.isArray(campaign?.productSlots) ? campaign.productSlots : [];
  const planDirty = JSON.stringify(planSlots.filter(Boolean)) !== JSON.stringify(planSaved.filter(Boolean));

  const savePlan = async () => {
    setSavingPlan(true);
    try {
      await adminTiktokApi.updateProductPlan(user.id, planSlots.filter(Boolean));
      toast.success('Plan de productos guardado');
      const { data: fresh } = await adminTiktokApi.campaign(user.id);
      onRefresh(fresh);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSavingPlan(false);
    }
  };

  const addCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminTiktokApi.addCreator(user.id, newCreator);
      toast.success('Creador asignado');
      setNewCreator({ name: '', tiktokUrl: '', status: 'PENDIENTE' });
      setShowAddCreator(false);
      const { data: fresh } = await adminTiktokApi.campaign(user.id);
      onRefresh(fresh);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al asignar creador');
    } finally {
      setSubmitting(false);
    }
  };

  const updateCreator = async (id: string, patch: any) => {
    try {
      await adminTiktokApi.updateCreator(id, patch);
      toast.success('Creador actualizado');
      const { data: fresh } = await adminTiktokApi.campaign(user.id);
      onRefresh(fresh);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al actualizar');
    }
  };

  const removeCreator = async (id: string) => {
    if (!confirm('¿Eliminar este creador de contenido?')) return;
    try {
      await adminTiktokApi.deleteCreator(id);
      toast.success('Creador eliminado');
      const { data: fresh } = await adminTiktokApi.campaign(user.id);
      onRefresh(fresh);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const registerSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleForm.creatorId || !saleForm.productId) {
      toast.error('Selecciona el creador y el producto');
      return;
    }
    setSubmitting(true);
    try {
      await adminTiktokApi.registerSale({
        creatorId: saleForm.creatorId,
        productId: saleForm.productId,
        quantity: saleForm.quantity,
        saleDate: new Date(saleForm.saleDate).toISOString(),
        notes: saleForm.notes || undefined,
      });
      toast.success('Venta registrada. Comisiones creadas.');
      setSaleForm({ ...saleForm, quantity: 1, notes: '' });
      const { data: fresh } = await adminTiktokApi.campaign(user.id);
      onRefresh(fresh);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al registrar la venta');
    } finally {
      setSubmitting(false);
    }
  };

  const removeSale = async (id: string) => {
    if (!confirm('¿Eliminar esta venta? Se revierten las comisiones aprobadas.')) return;
    setPendingId(id);
    try {
      await adminTiktokApi.deleteSale(id);
      toast.success('Venta eliminada');
      const { data: fresh } = await adminTiktokApi.campaign(user.id);
      onRefresh(fresh);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al eliminar la venta');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button onClick={onBack} size="sm" className="rounded-xl border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300">
          <ChevronLeft className="w-4 h-4 mr-1" /> Volver a lista
        </Button>
        <h2 className="font-bold text-gray-900 dark:text-dark-100 text-lg">
          Campaña de {user.firstName} {user.lastName} <span className="text-gray-400 font-normal">(@{user.username})</span>
        </h2>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Paquete" value={campaign ? `Pack ${campaign.packType} (${campaign.baseCreators} creadores)` : 'Sin activar'} color="text-pink-600" bg="bg-pink-50 dark:bg-pink-950/40" icon={Package} />
        <SummaryCard label="Creadores asignados" value={`${creators.length}${maxCreators ? ` / ${maxCreators}` : ''}`} color={isOverLimit ? 'text-red-600' : 'text-emerald-600'} bg={isOverLimit ? 'bg-red-50 dark:bg-red-950/40' : 'bg-emerald-50 dark:bg-emerald-950/40'} icon={Users} />
        <SummaryCard label="Ventas totales" value={fmt(userTotal)} color="text-amber-600" bg="bg-amber-50 dark:bg-amber-950/40" icon={DollarSign} />
      </div>

      {/* Ajuste de pack */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-pink-600" /> Configuración de Pack
            </h3>
            <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
              {campaign
                ? `Actual: Pack ${campaign.packType} · ${campaign.baseCreators} base + ${campaign.extraCreators} extra = ${maxCreators} espacios disponibles`
                : 'Este usuario aún no tiene campaña activa.'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              className="text-xs rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 px-3 py-2 font-medium"
              value={campaign ? String(campaign.packType) : '500'}
              onChange={async (e) => {
                const packType = Number(e.target.value);
                const base = packType >= 1000 ? base1000 : base500;
                if (!campaign && !confirm('¿Activar TikTok Shop para este usuario?')) return;
                try {
                  const { data: res } = await adminTiktokApi.updatePack(user.id, { packType, baseCreators: base });
                  toast.success(`Pack ${packType} (${base} creadores) asignado`);
                  const { data: fresh } = await adminTiktokApi.campaign(user.id);
                  onRefresh(fresh);
                } catch (err: any) {
                  toast.error(err.response?.data?.error || 'Error al asignar pack');
                }
              }}
            >
              <option value="500">Pack $500 ({base500} creadores)</option>
              <option value="1000">Pack $1000 ({base1000} creadores)</option>
            </select>
            <Input
              type="number"
              min="0"
              className="!w-20 !px-2.5 !py-1.5 text-xs rounded-xl"
              value={campaign?.extraCreators ?? 0}
              onChange={async (e) => {
                if (!campaign) return;
                const extraCreators = Math.max(0, Number(e.target.value) || 0);
                await adminTiktokApi.updatePack(user.id, { extraCreators });
                toast.success(`Extras actualizados: ${extraCreators}`);
                const { data: fresh } = await adminTiktokApi.campaign(user.id);
                onRefresh(fresh);
              }}
              title="Creadores extra"
            />
            <span className="text-xs text-gray-500 dark:text-dark-400">extras</span>
          </div>
        </div>
      </div>

      {/* Rejilla de productos */}
      {campaign && maxCreators > 0 && (
        <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-dark-700 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-purple-600" /> Slots de Productos del Usuario
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                Selección de catálogo ({planUsed}/{maxCreators} espacios ocupados).
              </p>
            </div>
            {planDirty && (
              <ButtonPrimary size="sm" onClick={savePlan} disabled={savingPlan} className="!bg-purple-600 !border-0">
                {savingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Guardar
              </ButtonPrimary>
            )}
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {planSlots.map((pid, i) => {
                const prod = pid ? productById[pid] : null;
                return (
                  <div key={i} className={`relative rounded-2xl border-2 p-3 flex flex-col items-center justify-center gap-1.5 min-h-[110px] ${prod ? 'border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10' : 'border-dashed border-gray-200 dark:border-dark-600 bg-gray-50/50 dark:bg-dark-700/20'}`}>
                    {prod ? (
                      <>
                        {prod.imageUrl
                          ? <img src={prod.imageUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
                          : <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"><ShoppingBag className="w-4 h-4 text-purple-600 dark:text-purple-400" /></div>}
                        <p className="text-[11px] font-bold text-gray-900 dark:text-dark-100 text-center leading-tight truncate w-full">{prod.name}</p>
                        <button type="button" onClick={() => setPlanPicker(i)} className="text-[10px] text-purple-600 dark:text-purple-400 font-bold hover:underline">Cambiar</button>
                        <button type="button" onClick={() => setPlanSlots(prev => prev.map((x, j) => (j === i ? '' : x)))} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 dark:bg-dark-800/90 text-gray-500 hover:text-red-600 flex items-center justify-center" title="Quitar"><X className="w-3 h-3" /></button>
                      </>
                    ) : (
                      <button type="button" onClick={() => setPlanPicker(i)} className="flex flex-col items-center gap-1.5 w-full">
                        <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 dark:border-dark-500 flex items-center justify-center text-gray-400"><Plus className="w-3.5 h-3.5" /></div>
                        <span className="text-[10px] text-gray-400 font-medium">Espacio {i + 1}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Picker de producto Modal */}
      {planPicker != null && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPlanPicker(null)}>
          <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl max-w-md w-full p-5 max-h-[80vh] overflow-y-auto space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-dark-700">
              <h3 className="font-bold text-gray-900 dark:text-dark-100 text-sm">Selecciona un producto del catálogo</h3>
              <button onClick={() => setPlanPicker(null)} className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2">
              {(products || []).map((p: any) => (
                <button key={p.id} type="button" onClick={() => { setPlanSlots(prev => prev.map((x, j) => (j === planPicker ? p.id : x))); setPlanPicker(null); }} className="w-full flex items-center gap-3 p-2.5 rounded-2xl border border-gray-100 dark:border-dark-700 hover:bg-purple-50 dark:hover:bg-dark-700 text-left transition-colors">
                  {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" /> : <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0"><ShoppingBag className="w-4 h-4 text-purple-600" /></div>}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-dark-100 truncate">{p.name}</p>
                    <p className="text-[11px] text-gray-500">{fmt(p.price)} · Alumno {p.commissionRate}%</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Creadores Asignados */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-dark-700 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-pink-600" /> Creadores de Contenido Asignados
            </h3>
            <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
              Límite total: {maxCreators} creadores ({creators.length} asignados)
            </p>
          </div>
          <ButtonPrimary size="sm" onClick={() => setShowAddCreator(!showAddCreator)} className="!bg-pink-600 !border-0">
            <Plus className="w-4 h-4" /> Asignar Creador
          </ButtonPrimary>
        </div>

        {showAddCreator && (
          <form onSubmit={addCreator} className="p-5 border-b border-gray-100 dark:border-dark-700 bg-pink-50/40 dark:bg-dark-700/30 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Nombre / Usuario del Creador</Label>
                <Input
                  placeholder="Ej. @soycami"
                  value={newCreator.name}
                  onChange={e => setNewCreator({ ...newCreator, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Enlace de Perfil TikTok</Label>
                <Input
                  placeholder="https://www.tiktok.com/@soycami"
                  value={newCreator.tiktokUrl}
                  onChange={e => setNewCreator({ ...newCreator, tiktokUrl: e.target.value })}
                />
              </div>
              <div>
                <Label>Estado Inicial</Label>
                <select
                  className="w-full h-10 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 px-3 text-xs font-semibold"
                  value={newCreator.status}
                  onChange={e => setNewCreator({ ...newCreator, status: e.target.value })}
                >
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="ACEPTADO">Aceptado</option>
                  <option value="ACTIVO">Activo</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <ButtonPrimary type="submit" disabled={submitting} className="!bg-pink-600 !border-0">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Guardar Creador
              </ButtonPrimary>
              <Button type="button" onClick={() => setShowAddCreator(false)}>Cancelar</Button>
            </div>
          </form>
        )}

        {creators.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-dark-500 text-xs">
            Aún no hay creadores asignados a esta campaña.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-dark-700">
            {creators.map((c: any) => (
              <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-dark-700/30 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {c.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingCreator?.id === c.id ? (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          value={editingCreator.name}
                          onChange={e => setEditingCreator({ ...editingCreator, name: e.target.value })}
                          className="py-1.5 text-xs font-bold"
                        />
                        <Input
                          value={editingCreator.tiktokUrl || ''}
                          onChange={e => setEditingCreator({ ...editingCreator, tiktokUrl: e.target.value })}
                          className="py-1.5 text-xs"
                          placeholder="Link de TikTok"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-gray-900 dark:text-dark-100">{c.name}</p>
                        {c.tiktokUrl ? (
                          <a href={c.tiktokUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-pink-600 dark:text-pink-400 flex items-center gap-1 hover:underline truncate">
                            <TikTokIcon className="w-3 h-3" /> {c.tiktokUrl} <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <p className="text-xs text-gray-400">Sin link directo</p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {editingCreator?.id === c.id ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        await updateCreator(c.id, { name: editingCreator.name, tiktokUrl: editingCreator.tiktokUrl });
                        setEditingCreator(null);
                      }}
                      className="!bg-emerald-600 !text-white"
                    >
                      <CheckCircle className="w-4 h-4" /> Guardar
                    </Button>
                    <Button size="sm" onClick={() => setEditingCreator(null)}>Cancelar</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                    <span className={clsx('text-[11px] font-bold px-2.5 py-1 rounded-full', creatorStatusMeta[c.status]?.classes)}>
                      {creatorStatusMeta[c.status]?.label || c.status}
                    </span>
                    <select
                      className="text-xs rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-700 dark:text-dark-200 px-2 py-1.5 font-medium"
                      value={c.status}
                      onChange={e => updateCreator(c.id, { status: e.target.value })}
                    >
                      <option value="PENDIENTE">Pendiente</option>
                      <option value="ACEPTADO">Aceptado</option>
                      <option value="ACTIVO">Activo</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setEditingCreator(c)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-dark-200 hover:bg-gray-100"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCreator(c.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registrar Venta */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm p-5 space-y-4">
        <h3 className="font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-emerald-600" /> Registrar Venta Directa de Creador
        </h3>
        <form onSubmit={registerSale} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <Label>Creador</Label>
            <select
              className="w-full h-10 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 px-3 text-xs font-semibold"
              value={saleForm.creatorId}
              onChange={e => setSaleForm({ ...saleForm, creatorId: e.target.value })}
              required
            >
              <option value="">Selecciona...</option>
              {creators.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Producto</Label>
            <select
              className="w-full h-10 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 px-3 text-xs font-semibold"
              value={saleForm.productId}
              onChange={e => setSaleForm({ ...saleForm, productId: e.target.value })}
              required
            >
              <option value="">Selecciona...</option>
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {fmt(p.price)} ({p.commissionRate}%)
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Cantidad</Label>
            <Input
              type="number"
              min="1"
              value={saleForm.quantity}
              onChange={e => setSaleForm({ ...saleForm, quantity: Number(e.target.value) || 1 })}
            />
          </div>
          <div>
            <Label>Fecha</Label>
            <Input
              type="date"
              value={saleForm.saleDate}
              onChange={e => setSaleForm({ ...saleForm, saleDate: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <ButtonPrimary type="submit" disabled={submitting} className="w-full !bg-emerald-600 !border-0">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Registrar
            </ButtonPrimary>
          </div>
        </form>
      </div>

      {/* Historial de Ventas */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-dark-100 text-sm">Historial de Ventas de la Campaña</h3>
          <span className="text-xs text-gray-500 font-semibold">{sales.length} ventas</span>
        </div>
        {sales.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-dark-500 text-xs">Aún no hay ventas registradas.</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-dark-700">
            {sales.map((s: any) => {
              const student = s.commissions?.find((c: any) => c.type === 'STUDENT');
              const sponsor = s.commissions?.find((c: any) => c.type === 'SPONSOR');
              return (
                <div key={s.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {s.product.imageUrl
                        ? <img src={s.product.imageUrl} alt="" className="w-full h-full object-cover" />
                        : (s.product.name?.[0]?.toUpperCase() || 'P')}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-dark-100 truncate">
                        {s.product.name} × {s.quantity}
                        <span className="text-gray-400 font-normal ml-1">· Creador: {s.creator.name}</span>
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-dark-400 mt-0.5">
                        {new Date(s.saleDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {student && <> · Alumno: <strong className="text-emerald-600">{fmt(student.amount)}</strong> ({student.status})</>}
                        {sponsor && <> · Patrocinador: <strong className="text-blue-600">{fmt(sponsor.amount)}</strong></>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-black text-gray-900 dark:text-dark-100">{fmt(s.unitPrice * s.quantity)}</span>
                    <button
                      type="button"
                      onClick={() => removeSale(s.id)}
                      disabled={pendingId === s.id}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Catálogo de productos ───
function ProductsTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', price: '', commissionRate: 25, sponsorRate: 5, imageUrl: '' });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try {
      const { data } = await adminTiktokApi.products();
      setProducts(data.products);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const optimizeImage = async (file: File): Promise<File | null> => {
    if (!file.type.startsWith('image/')) { toast.error('El archivo debe ser una imagen'); return null; }
    if (file.size > 5 * 1024 * 1024) { toast.error('La imagen no puede superar los 5MB'); return null; }
    try {
      const bitmap = await createImageBitmap(file);
      const MAX_DIM = 1280;
      let { width, height } = bitmap;
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { bitmap.close(); return file; }
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(b => resolve(b), 'image/jpeg', 0.8));
      if (!blob) return file;
      return new File([blob], 'product.jpg', { type: 'image/jpeg' });
    } catch {
      return file;
    }
  };

  const handleImageSelect = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const optimized = await optimizeImage(file);
      if (!optimized) return;
      const { data } = await adminTiktokApi.uploadProductImage(optimized);
      setForm(f => ({ ...f, imageUrl: data.url }));
      toast.success('Imagen optimizada y subida');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        price: Number(form.price),
        commissionRate: Number(form.commissionRate),
        sponsorRate: Number(form.sponsorRate),
        imageUrl: form.imageUrl || null,
      };
      if (editing) {
        await adminTiktokApi.updateProduct(editing.id, payload);
        toast.success('Producto actualizado');
      } else {
        await adminTiktokApi.createProduct(payload);
        toast.success('Producto creado');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', price: '', commissionRate: 25, sponsorRate: 5, imageUrl: '' });
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (p: any) => {
    if (!confirm(`¿Eliminar "${p.name}"?`)) return;
    try {
      await adminTiktokApi.deleteProduct(p.id);
      toast.success('Producto eliminado');
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q));
  }, [products, search]);

  if (loading) return <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-pink-600" /></div>;

  return (
    <div className="space-y-4">
      {/* Header y Acciones */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-gray-50 dark:bg-dark-900/60 border border-gray-200 dark:border-dark-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-dark-100 placeholder-gray-400"
            placeholder="Buscar producto por nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <ButtonPrimary size="sm" onClick={() => { setEditing(null); setForm({ name: '', price: '', commissionRate: 25, sponsorRate: 5, imageUrl: '' }); setShowForm(!showForm); }} className="!bg-purple-600 !border-0 shrink-0">
          <Plus className="w-4 h-4" /> Nuevo Producto
        </ButtonPrimary>
      </div>

      {showForm && (
        <form onSubmit={save} className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm p-6 space-y-4 animate-fade-in">
          <h3 className="font-bold text-gray-900 dark:text-dark-100 text-base">{editing ? 'Editar Producto' : 'Crear Nuevo Producto'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Nombre del Producto</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Ej. Serum Facial Antioxidante" />
            </div>
            <div>
              <Label>Precio Unitario (USDT)</Label>
              <Input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required placeholder="0.00" />
            </div>
            <div>
              <Label>Comisión para el Alumno (%)</Label>
              <Input type="number" min="0" max="100" value={form.commissionRate} onChange={e => setForm({ ...form, commissionRate: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Comisión para el Patrocinador (%)</Label>
              <Input type="number" min="0" max="100" value={form.sponsorRate} onChange={e => setForm({ ...form, sponsorRate: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <Label>Imagen del Producto</Label>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="w-16 h-16 rounded-2xl border border-gray-200 dark:border-dark-600 overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-dark-700 shrink-0 shadow-sm">
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <label className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-dark-600 text-xs font-semibold cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                {uploading ? 'Subiendo…' : 'Subir Imagen'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = (e.target as HTMLInputElement).files?.[0];
                    void handleImageSelect(f);
                    (e.target as HTMLInputElement).value = '';
                  }}
                />
              </label>
              {form.imageUrl && (
                <button type="button" onClick={() => setForm({ ...form, imageUrl: '' })} className="text-xs text-red-600 hover:underline">
                  Quitar
                </button>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Se optimiza automáticamente en el navegador a máximo 1280px.</p>
          </div>
          <div className="flex gap-2 pt-2">
            <ButtonPrimary type="submit" disabled={submitting} className="!bg-purple-600 !border-0">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {editing ? 'Guardar Cambios' : 'Crear Producto'}
            </ButtonPrimary>
            <Button type="button" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </form>
      )}

      {/* Grid de Productos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(p => (
          <div key={p.id} className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm p-4 flex flex-col justify-between gap-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-700 flex items-center justify-center">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-gray-900 dark:text-dark-100 text-sm leading-snug">
                  {highlightMatch(p.name, search)}
                </h4>
                <p className="text-base font-black text-purple-600 dark:text-purple-400 mt-0.5">
                  {fmt(p.price)}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">
                    Alumno {p.commissionRate}%
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold">
                    Sponsor {p.sponsorRate}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-dark-700">
              <button
                type="button"
                onClick={() => {
                  setEditing(p);
                  setForm({ name: p.name, price: String(p.price), commissionRate: p.commissionRate, sponsorRate: p.sponsorRate, imageUrl: p.imageUrl || '' });
                  setShowForm(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-dark-700 text-xs font-semibold hover:bg-purple-50 hover:text-purple-600 transition-colors flex items-center gap-1"
              >
                <Pencil className="w-3.5 h-3.5" /> Editar
              </button>
              <button
                type="button"
                onClick={() => remove(p)}
                className="p-1.5 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Material de productos (imágenes y videos) ───
function MaterialTab() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [newCat, setNewCat] = useState('');
  const [activeMediaPreview, setActiveMediaPreview] = useState<{ url: string; type: 'IMAGE' | 'VIDEO' } | null>(null);

  const load = async () => {
    try {
      const [c, p] = await Promise.all([adminTiktokApi.mediaCategories(), adminTiktokApi.products()]);
      setCategories(c.data.categories || []);
      setProducts(p.data.products || []);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al cargar el material');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    try {
      await adminTiktokApi.createMediaCategory({ name: newCat.trim() });
      setNewCat('');
      toast.success('Categoría creada');
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al crear la categoría');
    }
  };

  const renameCategory = async (id: string, name: string) => {
    if (!name.trim()) return;
    try {
      await adminTiktokApi.updateMediaCategory(id, { name: name.trim() });
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al renombrar');
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('¿Eliminar la categoría? Los productos quedarán sin categoría.')) return;
    try {
      await adminTiktokApi.deleteMediaCategory(id);
      toast.success('Categoría eliminada');
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const setProductCategory = async (productId: string, categoryId: string) => {
    try {
      await adminTiktokApi.updateProduct(productId, { categoryId: categoryId || null });
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al asignar categoría');
    }
  };

  const uploadMedia = async (productId: string, files: File[]) => {
    if (!files.length) return;
    setBusy(productId);
    setProgress(0);
    let done = 0;
    try {
      for (const file of files) {
        await adminTiktokApi.uploadProductMedia(productId, file, (pct) => {
          const overall = Math.round(((done + pct / 100) / files.length) * 100);
          setProgress(overall);
        });
        done++;
      }
      toast.success(files.length > 1 ? `${files.length} archivos subidos` : 'Archivo subido');
      await load();
    } catch (err: any) {
      const tail = files.length > done + 1 ? ` (${done}/${files.length} subidos)` : '';
      toast.error((err.response?.data?.error || 'Error al subir el archivo') + tail);
    } finally {
      setBusy(null);
      setProgress(0);
    }
  };

  const removeMedia = async (id: string) => {
    if (!confirm('¿Eliminar este archivo multimedia?')) return;
    try {
      await adminTiktokApi.deleteMedia(id);
      toast.success('Archivo eliminado');
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;

  const groups = categories.map(c => ({ id: c.id, name: c.name, products: products.filter(p => p.categoryId === c.id) }));
  const uncategorized = products.filter(p => !p.categoryId);

  const renderProduct = (p: any) => {
    const images = (p.media || []).filter((m: any) => m.type === 'IMAGE');
    const videos = (p.media || []).filter((m: any) => m.type === 'VIDEO');
    return (
      <div key={p.id} className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden border border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-700 flex items-center justify-center shrink-0">
              {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-gray-400" />}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-dark-100">{p.name}</p>
              <p className="text-xs text-gray-500 dark:text-dark-400">{images.length} fotos · {videos.length} videos UGC</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={p.categoryId || ''}
              onChange={e => setProductCategory(p.id, e.target.value)}
              className="text-xs rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-700 dark:text-dark-200 px-3 py-1.5 font-medium"
            >
              <option value="">Sin categoría</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${busy === p.id ? 'opacity-60 bg-gray-100' : 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-200/50 hover:bg-teal-100'}`}>
              {busy === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Subir Medios
              <input type="file" accept="image/*,video/*" multiple className="hidden" disabled={busy === p.id} onChange={e => { const files = Array.from((e.target as HTMLInputElement).files || []); void uploadMedia(p.id, files); (e.target as HTMLInputElement).value = ''; }} />
            </label>
          </div>
        </div>

        {busy === p.id && (
          <div className="pt-2">
            <div className="h-2 rounded-full bg-gray-100 dark:bg-dark-700 overflow-hidden">
              <div className="h-full bg-teal-600 transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 mt-1">Subiendo al servidor… {progress}%</p>
          </div>
        )}

        {(images.length + videos.length) > 0 && (
          <div className="pt-2 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {images.map((m: any) => (
              <div key={m.id} className="relative group rounded-2xl overflow-hidden border border-gray-200 dark:border-dark-700 aspect-square">
                <img src={m.url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <button type="button" onClick={() => setActiveMediaPreview({ url: m.url, type: 'IMAGE' })} className="p-1.5 rounded-lg bg-white text-gray-900"><Eye className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => removeMedia(m.id)} className="p-1.5 rounded-lg bg-red-600 text-white"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
            {videos.map((m: any) => (
              <div key={m.id} className="relative group rounded-2xl overflow-hidden border border-gray-200 dark:border-dark-700 bg-black aspect-square flex items-center justify-center">
                <video src={m.url} className="w-full h-full object-cover" muted preload="metadata" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60 transition-all">
                  <Film className="w-6 h-6 text-white/90" />
                </div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <button type="button" onClick={() => setActiveMediaPreview({ url: m.url, type: 'VIDEO' })} className="p-1.5 rounded-lg bg-white text-gray-900"><Play className="w-3.5 h-3.5 fill-current" /></button>
                  <button type="button" onClick={() => removeMedia(m.id)} className="p-1.5 rounded-lg bg-red-600 text-white"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Administrador de Categorías */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm p-5 space-y-4">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-dark-100 text-sm flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-teal-600" /> Categorías de Creativos
          </h3>
          <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">Organiza los videos e imágenes por nicho o línea de productos.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((c: any) => (
            <div key={c.id} className="flex items-center gap-1 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-2xl pl-3 pr-1 py-1">
              <input
                defaultValue={c.name}
                onBlur={e => { if (e.target.value !== c.name) renameCategory(c.id, e.target.value); }}
                className="bg-transparent text-xs font-semibold text-gray-900 dark:text-dark-100 w-28 focus:outline-none"
              />
              <button type="button" onClick={() => deleteCategory(c.id)} className="p-1 rounded-lg text-gray-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>

        <form onSubmit={addCategory} className="flex gap-2 max-w-sm">
          <Input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Nueva categoría (ej. Suplementos)" className="text-xs" />
          <ButtonPrimary type="submit" size="sm" className="!bg-teal-600 !border-0 shrink-0"><Plus className="w-4 h-4" /> Agregar</ButtonPrimary>
        </form>
      </div>

      {groups.map(g => (
        <div key={g.id} className="space-y-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-teal-600" /> {g.name}
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-600">({g.products.length})</span>
          </h3>
          <div className="space-y-3">
            {g.products.length === 0 ? <p className="text-xs text-gray-400">Sin productos en esta categoría.</p> : g.products.map(renderProduct)}
          </div>
        </div>
      ))}

      {uncategorized.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-400" /> Sin Categoría
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">({uncategorized.length})</span>
          </h3>
          <div className="space-y-3">{uncategorized.map(renderProduct)}</div>
        </div>
      )}

      {/* Modal Preview */}
      {activeMediaPreview && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setActiveMediaPreview(null)}>
          <div className="relative max-w-3xl w-full bg-black rounded-3xl overflow-hidden shadow-2xl p-2" onClick={e => e.stopPropagation()}>
            <button onClick={() => setActiveMediaPreview(null)} className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white z-10"><X className="w-5 h-5" /></button>
            {activeMediaPreview.type === 'IMAGE' ? (
              <img src={activeMediaPreview.url} alt="" className="max-w-full max-h-[80vh] object-contain rounded-2xl mx-auto" />
            ) : (
              <video src={activeMediaPreview.url} controls autoPlay className="max-w-full max-h-[80vh] rounded-2xl mx-auto" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Comisiones pendientes ───
function CommissionsTab() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [autoApprove, setAutoApprove] = useState(false);
  const [savingSetting, setSavingSetting] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'STUDENT' | 'SPONSOR'>('ALL');

  const load = async () => {
    try {
      const [{ data: cData }, { data: sData }] = await Promise.all([
        adminTiktokApi.pendingCommissions(),
        adminBusinessApi.settings(),
      ]);
      setCommissions(cData.commissions || []);
      setTotal(cData.total || 0);
      setAutoApprove(sData.tiktokAutoApprove ?? false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al cargar comisiones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleAutoApprove = async (value: boolean) => {
    setSavingSetting(true);
    try {
      await adminBusinessApi.updateSettings({ tiktokAutoApprove: value });
      setAutoApprove(value);
      toast.success(value ? 'Aprobación automática activada' : 'Aprobación automática desactivada');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSavingSetting(false);
    }
  };

  const act = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    try {
      if (action === 'approve') {
        await adminTiktokApi.approveCommission(id);
        toast.success('Comisión aprobada y acreditada al balance');
      } else {
        await adminTiktokApi.rejectCommission(id);
        toast.success('Comisión rechazada');
      }
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al procesar');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredCommissions = useMemo(() => {
    let list = commissions;
    if (filterType !== 'ALL') {
      list = list.filter(c => c.type === filterType);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => {
        const uName = `${c.user?.firstName || ''} ${c.user?.lastName || ''}`.toLowerCase();
        const username = (c.user?.username || '').toLowerCase();
        const pName = (c.sale?.product?.name || '').toLowerCase();
        const cName = (c.sale?.creator?.name || '').toLowerCase();
        return uName.includes(q) || username.includes(q) || pName.includes(q) || cName.includes(q);
      });
    }
    return list;
  }, [commissions, filterType, search]);

  if (loading) return <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>;

  return (
    <div className="space-y-4">
      {/* Switch de Aprobación Automática */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${autoApprove ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-dark-100">Aprobación Automática de Comisiones</p>
            <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
              Si está activo, las comisiones se aprueban al instante al registrar la venta.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => toggleAutoApprove(!autoApprove)}
          disabled={savingSetting}
          className={`shrink-0 relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${autoApprove ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-dark-600'}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${autoApprove ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Card de Total Pendiente */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-dark-400 font-medium">Total Pendiente por Aprobar</p>
            <p className="text-2xl font-black text-gray-900 dark:text-dark-100">{fmt(total)}</p>
          </div>
        </div>

        {/* Buscador & Filtro Tipo */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar en comisiones..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-700 p-1 rounded-xl text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-lg font-semibold ${filterType === 'ALL' ? 'bg-white dark:bg-dark-800 shadow-sm text-gray-900 dark:text-dark-100' : 'text-gray-500'}`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterType('STUDENT')}
              className={`px-2.5 py-1 rounded-lg font-semibold ${filterType === 'STUDENT' ? 'bg-white dark:bg-dark-800 shadow-sm text-emerald-600' : 'text-gray-500'}`}
            >
              Alumno
            </button>
            <button
              onClick={() => setFilterType('SPONSOR')}
              className={`px-2.5 py-1 rounded-lg font-semibold ${filterType === 'SPONSOR' ? 'bg-white dark:bg-dark-800 shadow-sm text-blue-600' : 'text-gray-500'}`}
            >
              Sponsor
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Comisiones */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-dark-100 text-sm">Comisiones Pendientes de Validación</h3>
          <span className="text-xs text-gray-500 font-semibold">{filteredCommissions.length} pendientes</span>
        </div>
        {filteredCommissions.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-dark-500 text-xs">
            No hay comisiones pendientes de aprobar.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-dark-700">
            {filteredCommissions.map(c => (
              <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-dark-700/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${c.type === 'STUDENT' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                    {c.type === 'STUDENT' ? 'A' : 'P'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-dark-100 truncate">
                      {c.type === 'STUDENT' ? 'Alumno' : 'Patrocinador'} — {highlightMatch(`${c.user?.firstName || ''} ${c.user?.lastName || ''}`, search)}
                      <span className="text-gray-400 font-normal ml-1">(@{highlightMatch(c.user?.username, search)})</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-400 truncate mt-0.5">
                      {highlightMatch(c.sale?.product?.name, search)} · Creador: {highlightMatch(c.sale?.creator?.name, search)} · {c.percent}% de {fmt(c.sale?.unitPrice * (c.sale?.quantity || 1))}
                    </p>
                  </div>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400 shrink-0">{fmt(c.amount)}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <Button
                    size="sm"
                    onClick={() => act(c.id, 'approve')}
                    disabled={processingId === c.id}
                    className="!bg-emerald-600 hover:!bg-emerald-700 !text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    {processingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => act(c.id, 'reject')}
                    disabled={processingId === c.id}
                    className="rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold"
                  >
                    Rechazar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color, bg, icon: Icon }: { label: string; value: string; color: string; bg: string; icon: any }) {
  return (
    <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm p-4 flex items-center gap-4">
      <div className={`p-3.5 rounded-2xl ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-dark-400 font-medium">{label}</p>
        <p className={`text-base font-black truncate ${color}`}>{value}</p>
      </div>
    </div>
  );
}
export default AdminTikTokPage;
