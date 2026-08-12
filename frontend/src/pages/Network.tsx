import { useEffect, useMemo, useState } from 'react';
import { Link as LinkIcon, Copy, Check, Users, Share2, Globe, Shield, List, GitBranch, Sparkles, UserPlus2, Users2, BadgePercent, Crown } from 'lucide-react';
import { membershipApi } from '@/services/api';
import { useMembershipStore } from '@/store/membershipStore';
import { NetworkTree, TreeMember } from '@/components/program/NetworkTree';
import { PageHeader } from '@/components/ui';
import { toast } from 'sonner';

const statusStyles: Record<string, { label: string; classes: string }> = {
  ACTIVE: { label: 'Activo', classes: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  INACTIVE: { label: 'Inactivo', classes: 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-400' },
  REVOKED: { label: 'Revocado', classes: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
};

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export function NetworkPage() {
  const { status, fetchStatus } = useMembershipStore();
  const [network, setNetwork] = useState<any>({ level1: [], level2: [], count: { level1: 0, level2: 0, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<'list' | 'tree'>('list');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [netRes, st] = await Promise.all([membershipApi.network(), fetchStatus()]);
      setNetwork(netRes.data);
      void st;
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al cargar tu red');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!status?.referralLink) return;
    try {
      await navigator.clipboard.writeText(status.referralLink);
      setCopied(true);
      toast.success('Link de referido copiado');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar el link');
    }
  };

  const MemberRow = ({ member, level }: { member: any; level: number }) => {
    const st = statusStyles[member.membershipStatus] || statusStyles.INACTIVE;
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-800">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${
          level === 1 ? 'bg-gradient-to-br from-primary-500 to-primary-700' : 'bg-gradient-to-br from-purple-500 to-purple-700'
        }`}>
          {(member.firstName?.[0] || member.username?.[0] || '?').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-dark-100 truncate">
            {member.firstName || member.username} {member.lastName || ''}
            {!member.firstName && <span className="text-gray-400 font-normal"> ({member.username})</span>}
          </p>
          <p className="text-xs text-gray-500 dark:text-dark-400 flex items-center gap-1">
            <Globe className="w-3 h-3" /> {member.country || 'Sin país'}
            <span className="text-gray-300 dark:text-dark-600">•</span>
            Nivel {level}
          </p>
        </div>
        {member.earned > 0 && (
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">
            Ganaste {fmt(member.earned)}
          </span>
        )}
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${st.classes}`}>{st.label}</span>
      </div>
    );
  };

  const statCards = [
    { label: 'Total en tu red', value: network.count.total, icon: Users, gradient: 'from-primary-500 to-primary-700' },
    { label: 'Nivel 1 (directos)', value: network.count.level1, icon: Share2, gradient: 'from-blue-500 to-cyan-500' },
    { label: 'Nivel 2 (indirectos)', value: network.count.level2, icon: Shield, gradient: 'from-purple-500 to-fuchsia-500' },
  ];

  // Análisis de actividad de la red
  const allMembers = [...(network.level1 || []), ...(network.level2 || [])];
  const activeCount = allMembers.filter(m => m.membershipStatus === 'ACTIVE').length;
  const inactiveCount = allMembers.length - activeCount;
  const activePct = allMembers.length > 0 ? Math.round((activeCount / allMembers.length) * 100) : 0;
  const lostPerInactive = (status?.settings?.level1Percent || 25) / 100 * (status?.settings?.membershipPrice || 500);
  const totalLost = inactiveCount * lostPerInactive;


  // Árbol: yo en la raíz, nivel 1 como hijos, nivel 2 como nietos
  const treeRoots: TreeMember[] = useMemo(() => {
    const l1 = (network.level1 || []).map((u: any) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      username: u.username,
      country: u.country,
      avatarUrl: u.avatarUrl,
      membershipStatus: u.membershipStatus,
      children: (network.level2 || [])
        .filter((c: any) => c.parentId === u.id)
        .map((c: any) => ({
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          username: c.username,
          country: c.country,
          avatarUrl: c.avatarUrl,
          membershipStatus: c.membershipStatus,
          parentId: c.parentId,
        })),
    }));
    return l1;
  }, [network]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const viewToggle = (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-dark-700">
      <button
        onClick={() => setView('list')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
          view === 'list'
            ? 'bg-white dark:bg-dark-800 text-primary-600 dark:text-primary-400 shadow-sm'
            : 'text-gray-500 dark:text-dark-400 hover:text-gray-700'
        }`}
      >
        <List className="w-3.5 h-3.5" /> Lista
      </button>
      <button
        onClick={() => setView('tree')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
          view === 'tree'
            ? 'bg-white dark:bg-dark-800 text-primary-600 dark:text-primary-400 shadow-sm'
            : 'text-gray-500 dark:text-dark-400 hover:text-gray-700'
        }`}
      >
        <GitBranch className="w-3.5 h-3.5" /> Árbol
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi Red"
        subtitle="Tu red unilevel de referidos"
        icon={Users}
        action={viewToggle}
      />

      {/* Link de referido */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-purple-800 rounded-2xl p-6 text-white shadow-xl shadow-primary-600/25">
        {/* Decoración de fondo */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-14 -right-6 w-44 h-44 rounded-full bg-purple-400/20 blur-3xl" />
        <div className="absolute top-0 right-8 w-24 h-24 opacity-10">
          <Crown className="w-full h-full" />
        </div>

        {/* Encabezado */}
        <div className="relative flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15 border border-white/20 backdrop-blur-sm">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold">Tu link de referido</p>
              <p className="text-primary-100 text-xs">Comparte y gana en tu red</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-100 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            Pasivo activo
          </div>
        </div>

        {/* Link + copiar */}
        <div className="relative flex items-center gap-2">
          <code className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-sm truncate">
            {status?.referralLink || 'Generando...'}
          </code>
          <button
            onClick={copyLink}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              copied ? 'bg-emerald-400 text-emerald-950' : 'bg-white text-primary-700 hover:bg-primary-50'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>

        <p className="relative text-primary-100 text-xs mt-3 flex items-center gap-1.5">
          <BadgePercent className="w-3.5 h-3.5 shrink-0" />
          Gana {status?.settings?.level1Percent || 25}% por cada miembro que se una con tu link y un {status?.settings?.level2Percent || 5}% adicional en su nivel 2.
        </p>

        {/* Comisiones por plan */}
        <div className="relative mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(status?.settings?.plans && status.settings.plans.length > 0 ? status.settings.plans : [{ id: 'estandar', name: 'Membresía', price: status?.settings?.membershipPrice || 500 }]).map((pl, idx) => {
            const l1 = (pl.price * (status?.settings?.level1Percent || 25)) / 100;
            const l2 = (pl.price * (status?.settings?.level2Percent || 5)) / 100;
            return (
              <div key={pl.id} className="bg-white/10 border border-white/15 rounded-xl p-4 backdrop-blur-sm hover:bg-white/15 transition-colors">
                <div className={`flex items-center justify-between mb-2 ${idx === 0 ? '' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${idx === 1 ? 'bg-amber-400/25 text-amber-200' : 'bg-white/15'}`}>
                      {idx === 1 ? <Crown className="w-4 h-4" /> : <Users2 className="w-4 h-4" />}
                    </div>
                    <p className="text-primary-100 text-xs font-bold uppercase tracking-wide">Plan {pl.name}</p>
                  </div>
                  {idx === 1 && (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-amber-950">
                      ÉLITE
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-primary-200">
                  <span className="inline-flex items-center gap-1.5">
                    <UserPlus2 className="w-3.5 h-3.5" /> Directo
                  </span>
                  <span className="text-lg font-bold text-white">{fmt(l1)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-primary-200 mt-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <Users2 className="w-3.5 h-3.5" /> Nivel 2
                  </span>
                  <span className="text-lg font-bold text-white">{fmt(l2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="relative overflow-hidden group bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-4 flex items-center gap-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${stat.gradient} opacity-10 group-hover:opacity-20 blur-xl transition-opacity`} />
              <div className={`relative p-3 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg shadow-primary-600/20`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="relative">
                <p className="text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wide">{stat.label}</p>
                <p className={`text-3xl font-black bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Análisis de actividad de la red */}
      {allMembers.length > 0 && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 dark:text-dark-100 mb-4">Salud de tu red</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Activos (al día)</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{activeCount} ({activePct}%)</p>
            </div>
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Inactivos</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">{inactiveCount}</p>
            </div>
            <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
              <p className="text-xs text-red-700 dark:text-red-400 font-medium">Pierdes por inactivos</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400 mt-1">{fmt(totalLost)}</p>
              <p className="text-[11px] text-red-600 dark:text-red-300 mt-0.5">
                {inactiveCount} × {fmt(lostPerInactive)} (comisión de nivel 1)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Vista árbol */}
      {view === 'tree' && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-dark-100">Gráfico de tu red</h2>
            <span className="text-xs text-gray-500 dark:text-dark-400">Foto de perfil por miembro</span>
          </div>
          {treeRoots.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-dark-500 text-sm">
              Aún no tienes referidos. ¡Comparte tu link para empezar a construir tu árbol!
            </div>
          ) : (
            <NetworkTree roots={treeRoots} />
          )}
        </div>
      )}

      {/* Nivel 1 y 2 (vista lista) */}
      {view === 'list' && (
        <>
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-dark-100">Nivel 1 — Referidos directos</h2>
          <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2.5 py-1 rounded-full">
            {status?.settings?.level1Percent || 25}% comisión
          </span>
        </div>
        {network.level1.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-dark-500 text-sm">
            Aún no tienes referidos directos. ¡Comparte tu link!
          </div>
        ) : (
          <div className="space-y-2">
            {network.level1.map((m: any) => <MemberRow key={m.id} member={m} level={1} />)}
          </div>
        )}
      </div>

      {/* Nivel 2 */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-dark-100">Nivel 2 — Referidos indirectos</h2>
          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2.5 py-1 rounded-full">
            {status?.settings?.level2Percent || 5}% comisión
          </span>
        </div>
        {network.level2.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-dark-500 text-sm">
            Aún no tienes referidos de nivel 2.
          </div>
        ) : (
          <div className="space-y-2">
            {network.level2.map((m: any) => <MemberRow key={m.id} member={m} level={2} />)}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
