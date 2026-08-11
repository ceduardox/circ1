import { useEffect, useMemo, useState } from 'react';
import { Link as LinkIcon, Copy, Check, Users, Share2, Globe, Shield, List, GitBranch } from 'lucide-react';
import { membershipApi } from '@/services/api';
import { useMembershipStore } from '@/store/membershipStore';
import { NetworkTree, TreeMember } from '@/components/program/NetworkTree';
import { toast } from 'sonner';

const statusStyles: Record<string, { label: string; classes: string }> = {
  ACTIVE: { label: 'Activo', classes: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  INACTIVE: { label: 'Inactivo', classes: 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-400' },
  REVOKED: { label: 'Revocado', classes: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
};

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
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${st.classes}`}>{st.label}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total en tu red', value: network.count.total, icon: Users, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Nivel 1 (directos)', value: network.count.level1, icon: Share2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Nivel 2 (indirectos)', value: network.count.level2, icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-100">Mi Red</h1>
        <p className="text-gray-500 dark:text-dark-400 mt-1">Tu red unilevel de referidos</p>
      </div>
      {viewToggle}

      {/* Link de referido */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-5 text-white shadow-lg shadow-primary-600/20">
        <div className="flex items-center gap-2 text-primary-100 text-sm font-medium mb-3">
          <LinkIcon className="w-4 h-4" />
          Tu link de referido
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-sm truncate">
            {status?.referralLink || 'Generando...'}
          </code>
          <button
            onClick={copyLink}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-primary-700 text-sm font-semibold hover:bg-primary-50 transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <p className="text-primary-200 text-xs mt-3">
          Gana {status?.settings?.level1Percent || 25}% por cada miembro que se una con tu link y un 5% adicional en su nivel 2.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={`${stat.bg} dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-4 flex items-center gap-4`}>
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-dark-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-dark-100">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

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
