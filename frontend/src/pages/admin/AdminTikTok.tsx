import { useEffect, useState } from 'react';
import { Search, User, Plus, Trash2, Pencil, CheckCircle, XCircle, Loader2, Package, Music, DollarSign, ExternalLink, Users, ShoppingBag, ChevronLeft, ChevronRight, ChevronDown, Mail, MapPin, Crown } from 'lucide-react';
import { adminTiktokApi, adminBusinessApi } from '@/services/api';
import { Input, Label, ButtonPrimary, Button, PageHeader } from '@/components/ui';
import { TikTokIcon } from '@/components/TikTokLogo';
import { toast } from 'sonner';
import { clsx } from 'clsx';

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const creatorStatusMeta: Record<string, { label: string; classes: string }> = {
  PENDIENTE: { label: 'Pendiente', classes: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  ACEPTADO: { label: 'Aceptado', classes: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  ACTIVO: { label: 'Activo', classes: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
};

type Tab = 'usuarios' | 'productos' | 'comisiones';

export function AdminTikTokPage() {
  const [tab, setTab] = useState<Tab>('usuarios');

  return (
    <div className="space-y-6">
      <PageHeader
        title="TikTok Shop"
        subtitle="Gestiona campañas, creadores de contenido, ventas y comisiones"
        icon={Music}
      />

      <div className="flex flex-wrap gap-2">
        {([
          { id: 'usuarios', label: 'Usuarios y campañas', icon: Users },
          { id: 'productos', label: 'Catálogo de productos', icon: Package },
          { id: 'comisiones', label: 'Comisiones por aprobar', icon: DollarSign },
        ] as const).map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
                active
                  ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-md shadow-primary-600/25'
                  : 'bg-white dark:bg-dark-800 text-gray-600 dark:text-dark-300 border border-gray-200 dark:border-dark-700 hover:border-primary-300 dark:hover:border-dark-500'
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'usuarios' && <UsersTab />}
      {tab === 'productos' && <ProductsTab />}
      {tab === 'comisiones' && <CommissionsTab />}
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
    const base = packType >= 1000 ? 10 : 5;
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

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <form onSubmit={runSearch} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="Buscar usuario por nombre, email o usuario..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <ButtonPrimary type="submit" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Buscar
        </ButtonPrimary>
      </form>

      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-gray-500 dark:text-dark-400">
          <strong className="text-gray-900 dark:text-dark-100">{total}</strong> usuarios
        </p>
        <p className="text-xs text-gray-400 dark:text-dark-500">Selecciona el pack para activar la membresía y repartir comisiones</p>
      </div>

      {/* Detalle de campaña (si el admin entra a un usuario) */}
      {selected ? (
        <CampaignDetail data={selected} onBack={() => setSelected(null)} onRefresh={setSelected} />
      ) : (
        <>
          {/* Lista (desktop: tabla) */}
          <div className="hidden lg:block bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-gray-400 dark:text-dark-500 border-b border-gray-100 dark:border-dark-700">
                    <th className="px-4 py-3">Usuario</th>
                    <th className="px-4 py-3">Membresía</th>
                    <th className="px-4 py-3">Pack / Creadores</th>
                    <th className="px-4 py-3 text-right">Activar membresía</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/40 transition-colors">
                      <td className="px-4 py-3">
                        <button onClick={() => selectUser(u)} className="flex items-center gap-3 text-left">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-700 text-white flex items-center justify-center text-sm font-bold shrink-0">
                            {u.firstName?.[0] || u.username?.[0] || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-dark-100 truncate">
                              {u.firstName} {u.lastName} <span className="text-gray-400 font-normal">· @{u.username}</span>
                            </p>
                            <p className="text-xs text-gray-500 dark:text-dark-400 flex items-center gap-2 truncate">
                              <Mail className="w-3 h-3" /> {u.email}
                              {u.country && <><span>·</span><MapPin className="w-3 h-3" /> {u.country}</>}
                            </p>
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <MembershipBadge status={u.membershipStatus} />
                      </td>
                      <td className="px-4 py-3">
                        {u.tiktokCampaign ? (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
                            Pack {u.tiktokCampaign.packType} · {u.tiktokCampaign._count.creators}/{u.tiktokCampaign.baseCreators + u.tiktokCampaign.extraCreators} creadores
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-dark-400">
                            Sin campaña
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <PackSelect user={u} busy={packBusy === u.id} onAssign={assignPack} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lista (móvil: cards desplegables) */}
          <div className="lg:hidden space-y-3">
            {users.map(u => <MobileUserCard key={u.id} user={u} busy={packBusy === u.id} onSelect={() => selectUser(u)} onAssign={assignPack} />)}
          </div>

          {users.length === 0 && !loading && (
            <div className="text-center py-10 text-gray-400 dark:text-dark-500 text-sm bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700">
              No se encontraron usuarios.
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => load(page - 1)}
                className="border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </Button>
              <span className="text-sm text-gray-600 dark:text-dark-300">
                Página <strong>{page}</strong> de {totalPages}
              </span>
              <Button
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => load(page + 1)}
                className="border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300"
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
    ACTIVE: { label: 'Activa', classes: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
    INACTIVE: { label: 'Inactiva', classes: 'bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-dark-400' },
    REVOKED: { label: 'Revocada', classes: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
    GRACE: { label: 'En gracia', classes: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
    EXPIRED: { label: 'Expirada', classes: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  };
  const m = meta[status] || { label: status || '—', classes: 'bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-dark-400' };
  return (
    <span className={clsx('text-[11px] font-semibold px-2.5 py-1 rounded-full', m.classes)}>{m.label}</span>
  );
}

function PackSelect({ user, busy, onAssign }: { user: any; busy: boolean; onAssign: (u: any, packType: number) => void }) {
  const current = user.tiktokCampaign?.packType;
  return (
    <div className="inline-flex items-center gap-2">
      <select
        className="text-xs rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 px-2 py-2"
        value={current ? String(current) : '0'}
        disabled={busy}
        onChange={(e) => {
          const packType = Number(e.target.value);
          if (packType === 0) return;
          onAssign(user, packType);
        }}
      >
        <option value="0">{current ? 'Pack activo' : '— Sin pack —'}</option>
        <option value="500">Pack $500 (5)</option>
        <option value="1000">Pack $1000 (10)</option>
      </select>
      {busy && <Loader2 className="w-4 h-4 animate-spin text-primary-600" />}
    </div>
  );
}

function MobileUserCard({ user, busy, onSelect, onAssign }: { user: any; busy: boolean; onSelect: () => void; onAssign: (u: any, packType: number) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-dark-700/40 transition-colors">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-700 text-white flex items-center justify-center text-sm font-bold shrink-0">
          {user.firstName?.[0] || user.username?.[0] || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-dark-100 truncate">
            {user.firstName} {user.lastName} <span className="text-gray-400 font-normal">· @{user.username}</span>
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <MembershipBadge status={user.membershipStatus} />
            {user.tiktokCampaign ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
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
            <Mail className="w-3 h-3" /> {user.email}
            {user.country && <><span>·</span><MapPin className="w-3 h-3" /> {user.country}</>}
          </p>
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={onSelect}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-dark-200 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
            >
              <Users className="w-3.5 h-3.5" /> Ver campaña
            </button>
            <PackSelect user={user} busy={busy} onAssign={onAssign} />
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

  const { user, campaign, creators, sales, products, pendingCommissions, maxCreators } = data;

  const isOverLimit = creators.length > maxCreators;
  const userTotal = sales.reduce((s: number, x: any) => s + x.unitPrice * x.quantity, 0);

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
      toast.success('Venta registrada. Comisiones creadas (pendientes).');
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
        <Button onClick={onBack} size="sm" className="border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300">
          ← Volver
        </Button>
        <h2 className="font-semibold text-gray-900 dark:text-dark-100">
          Campaña de {user.firstName} {user.lastName} <span className="text-gray-400 font-normal">(@{user.username})</span>
        </h2>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Paquete" value={campaign ? `Pack ${campaign.packType} (${campaign.baseCreators} creadores)` : 'Sin activar'} color="text-primary-600" bg="bg-primary-50" icon={Package} />
        <SummaryCard label="Creadores asignados" value={`${creators.length}${maxCreators ? ` / ${maxCreators}` : ''}`} color={isOverLimit ? 'text-red-600' : 'text-emerald-600'} bg={isOverLimit ? 'bg-red-50' : 'bg-emerald-50'} icon={Users} />
        <SummaryCard label="Ventas totales" value={fmt(userTotal)} color="text-amber-600" bg="bg-amber-50" icon={DollarSign} />
      </div>

      {/* Ajuste de pack (admin) */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-dark-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary-600" /> Pack del usuario
            </h3>
            <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
              {campaign
                ? `Actual: Pack ${campaign.packType} · ${campaign.baseCreators} base + ${campaign.extraCreators} extra = ${maxCreators} espacios`
                : 'Este usuario aún no tiene campaña activa.'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              className="text-sm rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 px-3 py-2"
              value={campaign ? String(campaign.packType) : '500'}
              onChange={async (e) => {
                const packType = Number(e.target.value);
                const base = packType >= 1000 ? 10 : 5;
                if (!campaign && !confirm('¿Activar TikTok Shop para este usuario?')) return;
                try {
                  const { data: res } = await adminTiktokApi.updatePack(user.id, { packType, baseCreators: base });
                  const ref = res.referral;
                  const msg = `Pack ${packType} (${base} creadores) asignado`;
                  if (ref?.level1 || ref?.level2) {
                    toast.success(`${msg}. Comisión de red: ${fmt(ref.level1)} (nivel 1)${ref.level2 ? ` + ${fmt(ref.level2)} (nivel 2)` : ''}`);
                  } else if (ref?.skipped === 'already-paid') {
                    toast.info(`${msg}. El usuario ya pagó membresía (comisión ya generada por ese pago).`);
                  } else {
                    toast.success(msg);
                  }
                  const { data: fresh } = await adminTiktokApi.campaign(user.id);
                  onRefresh(fresh);
                } catch (err: any) {
                  toast.error(err.response?.data?.error || 'Error al asignar pack');
                }
              }}
            >
              <option value="500">Pack $500 (5 creadores)</option>
              <option value="1000">Pack $1000 (10 creadores)</option>
            </select>
            <Input
              type="number"
              min="0"
              className="!w-20 !px-2 !py-2 text-sm"
              value={campaign?.extraCreators ?? 0}
              onChange={async (e) => {
                if (!campaign) return;
                const extraCreators = Math.max(0, Number(e.target.value) || 0);
                await adminTiktokApi.updatePack(user.id, { extraCreators });
                toast.success(`Extras actualizados: ${extraCreators}`);
                const { data: fresh } = await adminTiktokApi.campaign(user.id);
                onRefresh(fresh);
              }}
              title="Creadores extra (comprados/pagados)"
            />
            <span className="text-xs text-gray-500 dark:text-dark-400">extras</span>
          </div>
        </div>
      </div>

      {isOverLimit && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-sm text-red-700 dark:text-red-300">
          El usuario supera su límite de creadores ({creators.length}/{maxCreators}). Revisa los extras pagados.
        </div>
      )}

      {/* Creadores */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-dark-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-600" /> Creadores de contenido
            </h3>
            <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
              Extras pagados: {campaign?.extraCreators ?? 0} · Límite actual: {maxCreators}
            </p>
          </div>
          <ButtonPrimary size="sm" onClick={() => setShowAddCreator(!showAddCreator)}>
            <Plus className="w-4 h-4" /> Asignar creador
          </ButtonPrimary>
        </div>

        {showAddCreator && (
          <form onSubmit={addCreator} className="p-5 border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/30 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Nombre del creador</Label>
                <Input
                  placeholder="Ej. @soycami"
                  value={newCreator.name}
                  onChange={e => setNewCreator({ ...newCreator, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Link de TikTok</Label>
                <Input
                  placeholder="https://www.tiktok.com/@soycami"
                  value={newCreator.tiktokUrl}
                  onChange={e => setNewCreator({ ...newCreator, tiktokUrl: e.target.value })}
                />
              </div>
              <div>
                <Label>Estatus</Label>
                <select
                  className="w-full h-10 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 px-3 text-sm"
                  value={newCreator.status}
                  onChange={e => setNewCreator({ ...newCreator, status: e.target.value })}
                >
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="ACEPTADO">Aceptado</option>
                  <option value="ACTIVO">Activo</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <ButtonPrimary type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Asignar
              </ButtonPrimary>
              <Button type="button" onClick={() => setShowAddCreator(false)}>Cancelar</Button>
            </div>
          </form>
        )}

        {creators.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-dark-500 text-sm">
            Aún no hay creadores asignados. La campaña muestra "buscando creadores" hasta que asignes uno.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-dark-700">
            {creators.map((c: any) => (
              <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {c.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingCreator?.id === c.id ? (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          value={editingCreator.name}
                          onChange={e => setEditingCreator({ ...editingCreator, name: e.target.value })}
                          className="py-1.5 text-sm"
                        />
                        <Input
                          value={editingCreator.tiktokUrl || ''}
                          onChange={e => setEditingCreator({ ...editingCreator, tiktokUrl: e.target.value })}
                          className="py-1.5 text-sm"
                          placeholder="Link de TikTok"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-gray-900 dark:text-dark-100">{c.name}</p>
                        {c.tiktokUrl ? (
                          <a href={c.tiktokUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 dark:text-primary-400 flex items-center gap-1 hover:underline truncate">
                            <TikTokIcon className="w-3 h-3" /> {c.tiktokUrl} <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <p className="text-xs text-gray-400">Sin link de TikTok</p>
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
                    >
                      <CheckCircle className="w-4 h-4" /> Guardar
                    </Button>
                    <Button size="sm" onClick={() => setEditingCreator(null)}>Cancelar</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={clsx('text-[11px] font-semibold px-2.5 py-1 rounded-full', creatorStatusMeta[c.status].classes)}>
                      {creatorStatusMeta[c.status].label}
                    </span>
                    <select
                      className="text-xs rounded-lg border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-700 dark:text-dark-200 px-1.5 py-1"
                      value={c.status}
                      onChange={e => updateCreator(c.id, { status: e.target.value })}
                      title="Cambiar estatus"
                    >
                      <option value="PENDIENTE">Pendiente</option>
                      <option value="ACEPTADO">Aceptado</option>
                      <option value="ACTIVO">Activo</option>
                    </select>
                    <Button size="sm" variant="danger" onClick={() => setEditingCreator(c)} className="!bg-transparent !shadow-none">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => removeCreator(c.id)} className="!bg-transparent !shadow-none">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registrar venta */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 dark:text-dark-100 flex items-center gap-2 mb-4">
          <ShoppingBag className="w-4 h-4 text-primary-600" /> Registrar venta
        </h3>
        <form onSubmit={registerSale} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <Label>Creador</Label>
            <select
              className="w-full h-10 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 px-3 text-sm"
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
              className="w-full h-10 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 px-3 text-sm"
              value={saleForm.productId}
              onChange={e => setSaleForm({ ...saleForm, productId: e.target.value })}
              required
            >
              <option value="">Selecciona...</option>
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {fmt(p.price)} ({p.commissionRate}% + {p.sponsorRate}%)
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
            <ButtonPrimary type="submit" disabled={submitting} className="w-full">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Registrar
            </ButtonPrimary>
          </div>
        </form>
        {products.length === 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
            No hay productos en el catálogo. Crea uno en la pestaña "Catálogo de productos".
          </p>
        )}
      </div>

      {/* Ventas */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-dark-100">Historial de ventas</h3>
          <span className="text-xs text-gray-500">{sales.length} ventas</span>
        </div>
        {sales.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-dark-500 text-sm">Aún no hay ventas registradas.</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-dark-700">
            {sales.map((s: any) => {
              const student = s.commissions?.find((c: any) => c.type === 'STUDENT');
              const sponsor = s.commissions?.find((c: any) => c.type === 'SPONSOR');
              return (
                <div key={s.id} className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {s.product.name?.[0]?.toUpperCase() || 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-dark-100 truncate">
                      {s.product.name} × {s.quantity}
                      <span className="text-gray-400 font-normal"> · {s.creator.name}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-400">
                      {new Date(s.saleDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {student && <> · Alumno: {fmt(student.amount)} ({student.status})</>}
                      {sponsor && <> · Patrocinador: {fmt(sponsor.amount)} ({sponsor.status})</>}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-dark-100">{fmt(s.unitPrice * s.quantity)}</span>
                  <Button size="sm" variant="danger" onClick={() => removeSale(s.id)} disabled={pendingId === s.id} className="!bg-transparent !shadow-none">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
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
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', price: '', commissionRate: 25, sponsorRate: 5 });
  const [submitting, setSubmitting] = useState(false);

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

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        price: Number(form.price),
        commissionRate: Number(form.commissionRate),
        sponsorRate: Number(form.sponsorRate),
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
      setForm({ name: '', price: '', commissionRate: 25, sponsorRate: 5 });
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

  if (loading) return <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ButtonPrimary size="sm" onClick={() => { setEditing(null); setForm({ name: '', price: '', commissionRate: 25, sponsorRate: 5 }); setShowForm(!showForm); }}>
          <Plus className="w-4 h-4" /> Nuevo producto
        </ButtonPrimary>
      </div>

      {showForm && (
        <form onSubmit={save} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-dark-100">{editing ? 'Editar producto' : 'Nuevo producto'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Nombre</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Ej. Programa Círculo 1" />
            </div>
            <div>
              <Label>Precio (USDT)</Label>
              <Input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required placeholder="0.00" />
            </div>
            <div>
              <Label>Comisión alumno (%)</Label>
              <Input type="number" min="0" max="100" value={form.commissionRate} onChange={e => setForm({ ...form, commissionRate: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Comisión patrocinador (%)</Label>
              <Input type="number" min="0" max="100" value={form.sponsorRate} onChange={e => setForm({ ...form, sponsorRate: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex gap-2">
            <ButtonPrimary type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {editing ? 'Guardar cambios' : 'Crear producto'}
            </ButtonPrimary>
            <Button type="button" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden">
        {products.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-dark-500 text-sm">No hay productos. Crea el catálogo.</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-dark-700">
            {products.map(p => (
              <div key={p.id} className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-dark-100">{p.name}</p>
                  <p className="text-xs text-gray-500 dark:text-dark-400">
                    {fmt(p.price)} · Alumno {p.commissionRate}% · Patrocinador {p.sponsorRate}%
                  </p>
                </div>
                <Button size="sm" variant="danger" onClick={() => { setEditing(p); setForm({ name: p.name, price: String(p.price), commissionRate: p.commissionRate, sponsorRate: p.sponsorRate }); setShowForm(true); }} className="!bg-transparent !shadow-none">
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="danger" onClick={() => remove(p)} className="!bg-transparent !shadow-none">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Comisiones pendientes ───
function CommissionsTab() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [autoApprove, setAutoApprove] = useState(false);
  const [savingSetting, setSavingSetting] = useState(false);

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
        toast.success('Comisión aprobada: acreditada al balance');
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

  const membershipLabel = (u: any) => {
    if (!u) return '—';
    if (u.membershipStatus === 'ACTIVE') return 'Al día';
    if (u.membershipStatus === 'INACTIVE') return 'Sin membresía';
    return u.membershipStatus;
  };

  if (loading) return <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-4">
      {/* Aprobación automática */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-4 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-primary-50">
          <CheckCircle className="w-5 h-5 text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-dark-100">Aprobación automática de comisiones</p>
          <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
            Al registrar una venta, las comisiones se acreditan de inmediato (con la regla de elegibilidad). Si está apagado, quedan pendientes y las apruebas manualmente.
          </p>
        </div>
        <button
          onClick={() => toggleAutoApprove(!autoApprove)}
          disabled={savingSetting}
          className="shrink-0 relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          style={{ backgroundColor: autoApprove ? '#10b981' : '#d1d5db' }}
          title={autoApprove ? 'Desactivar' : 'Activar'}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${autoApprove ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-4 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-amber-50">
          <DollarSign className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-dark-400">Total pendiente por aprobar</p>
          <p className="text-xl font-bold text-gray-900 dark:text-dark-100">{fmt(total)}</p>
        </div>
        <p className="text-xs text-gray-400 ml-auto max-w-sm text-right">
          Al aprobar, si el receptor está al día (ACTIVE o en gracia) cobra su porcentaje; si no, ese porcentaje lo recibe el admin.
        </p>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-dark-700">
          <h3 className="font-semibold text-gray-900 dark:text-dark-100">Comisiones pendientes</h3>
        </div>
        {commissions.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-dark-500 text-sm">
            No hay comisiones pendientes de aprobar.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-dark-700">
            {commissions.map(c => (
              <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={clsx('w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0',
                    c.type === 'STUDENT' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600')}>
                    {c.type === 'STUDENT' ? 'A' : 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-dark-100 truncate">
                      {c.type === 'STUDENT' ? 'Alumno' : 'Patrocinador'} — {c.user?.firstName || c.user?.username || '—'}
                      <span className={clsx('ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full',
                        c.user?.membershipStatus === 'ACTIVE'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400')}>
                        {membershipLabel(c.user)}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-400 truncate">
                      {c.sale?.product?.name} · {c.sale?.creator?.name} · {c.sale?.campaign?.user?.firstName || c.sale?.campaign?.user?.username}
                      {' '}· {c.percent}% de {fmt(c.sale?.unitPrice * (c.sale?.quantity || 1))}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 shrink-0">{fmt(c.amount)}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" onClick={() => act(c.id, 'approve')} disabled={processingId === c.id} className="!bg-emerald-500 !text-white hover:!bg-emerald-600">
                    {processingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Aprobar
                  </Button>
                  <Button size="sm" onClick={() => act(c.id, 'reject')} disabled={processingId === c.id} className="!bg-transparent !shadow-none text-red-500">
                    <XCircle className="w-4 h-4" />
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
    <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-4 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 dark:text-dark-400">{label}</p>
        <p className={`text-lg font-bold text-gray-900 dark:text-dark-100 truncate ${color}`}>{value}</p>
      </div>
    </div>
  );
}
