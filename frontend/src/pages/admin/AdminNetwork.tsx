import { useEffect, useMemo, useState } from 'react';
import { Network as NetworkIcon, Users, Crown, Globe, RefreshCw, ChevronDown, ChevronRight, TrendingUp, ShieldCheck, XCircle } from 'lucide-react';
import { adminBusinessApi } from '@/services/api';
import { Button } from '@/components/ui';
import { toast } from 'sonner';

interface NetUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  username: string;
  country?: string | null;
  membershipStatus: string;
  referralCode?: string | null;
  referrerId?: string | null;
  createdAt: string;
  children?: NetUser[];
}

const statusStyles: Record<string, { label: string; classes: string }> = {
  ACTIVE: { label: 'Activo', classes: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  INACTIVE: { label: 'Inactivo', classes: 'bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-dark-400' },
  REVOKED: { label: 'Revocado', classes: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
};

export function AdminNetworkPage() {
  const [users, setUsers] = useState<NetUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminBusinessApi.network();
      setUsers(res.data.users);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al cargar la red');
    } finally {
      setLoading(false);
    }
  };

  // Construir árbol unilevel: cada usuario cuelga de su referrerId
  const tree = useMemo(() => {
    const byId = new Map<string, NetUser>();
    users.forEach(u => byId.set(u.id, { ...u, children: [] }));

    const roots: NetUser[] = [];
    byId.forEach(u => {
      if (u.referrerId && byId.has(u.referrerId)) {
        const parent = byId.get(u.referrerId)!;
        parent.children = parent.children || [];
        parent.children.push(u);
      } else {
        roots.push(u);
      }
    });
    return roots;
  }, [users]);

  const activeCount = users.filter(u => u.membershipStatus === 'ACTIVE').length;
  const inactiveCount = users.length - activeCount;

  const toggle = (id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const statCards = [
    { label: 'Usuarios totales', value: users.length, icon: Users, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Membresías activas', value: activeCount, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Sin membresía', value: inactiveCount, icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-50' },
  ];

  const TreeNode = ({ node, depth = 0 }: { node: NetUser; depth?: number }) => {
    const st = statusStyles[node.membershipStatus] || statusStyles.INACTIVE;
    const hasChildren = (node.children?.length ?? 0) > 0;
    const isCollapsed = collapsed.has(node.id);

    return (
      <div>
        <div
          className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-800 hover:border-primary-200 dark:hover:border-primary-700 transition-colors"
          style={{ marginLeft: depth * 24 }}
        >
          <button
            onClick={() => hasChildren && toggle(node.id)}
            disabled={!hasChildren}
            className="w-6 h-6 flex items-center justify-center text-gray-400 dark:text-dark-500 disabled:opacity-30 hover:text-primary-500"
          >
            {hasChildren && (isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
          </button>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
            node.membershipStatus === 'ACTIVE'
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
              : 'bg-gradient-to-br from-gray-400 to-gray-500'
          }`}>
            {(node.firstName?.[0] || node.username?.[0] || '?').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-dark-100 truncate">
              {node.firstName || node.username} {node.lastName || ''}
              {!node.firstName && <span className="text-gray-400 font-normal"> ({node.username})</span>}
            </p>
            <p className="text-xs text-gray-500 dark:text-dark-400 flex items-center gap-1">
              <Globe className="w-3 h-3" /> {node.country || 'Sin país'}
              {node.referralCode && (
                <>
                  <span className="text-gray-300 dark:text-dark-600">•</span>
                  <span className="text-primary-500 dark:text-primary-400 font-mono">{node.referralCode}</span>
                </>
              )}
            </p>
          </div>
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${st.classes}`}>{st.label}</span>
        </div>
        {hasChildren && !isCollapsed && (
          <div className="space-y-1.5 mt-1.5">
            {node.children!.map(child => <TreeNode key={child.id} node={child} depth={depth + 1} />)}
          </div>
        )}
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-100">Red Global</h1>
          <p className="text-gray-500 dark:text-dark-400 mt-1">Árbol unilevel de todos los usuarios</p>
        </div>
        <Button onClick={load} className="border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300">
          <RefreshCw className="w-4 h-4" /> Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-4 flex items-center gap-4">
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

      {/* Árbol */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-900/20">
            <NetworkIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-dark-100">Árbol de afiliación</h2>
            <p className="text-xs text-gray-500 dark:text-dark-400">
              {tree.length} raíz(ces) · Los verdes tienen membresía activa
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 text-emerald-600"><Crown className="w-3.5 h-3.5" /> Activo</span>
            <span className="inline-flex items-center gap-1 text-gray-500"><TrendingUp className="w-3.5 h-3.5" /> Por vencimiento</span>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-dark-500 text-sm">Sin usuarios registrados</div>
        ) : (
          <div className="space-y-1.5">
            {tree.map(node => <TreeNode key={node.id} node={node} />)}
          </div>
        )}
      </div>
    </div>
  );
}
