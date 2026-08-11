import { useState } from 'react';
import { Globe, ChevronDown, ChevronRight } from 'lucide-react';

export interface TreeMember {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  username: string;
  country?: string | null;
  avatarUrl?: string | null;
  membershipStatus: string;
  children?: TreeMember[];
  parentId?: string | null;
}

interface NetworkTreeProps {
  roots: TreeMember[];
}

const statusRing: Record<string, string> = {
  ACTIVE: 'ring-emerald-400 shadow-emerald-500/30',
  INACTIVE: 'ring-gray-300 dark:ring-dark-600',
  REVOKED: 'ring-red-400',
};

export function NetworkTree({ roots }: NetworkTreeProps) {
  return (
    <div className="overflow-x-auto py-4">
      <div className="flex justify-center min-w-max">
        <div className="flex flex-col items-center">
          {roots.map((root, i) => (
            <RootColumn key={root.id} root={root} isLast={i === roots.length - 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RootColumn({ root, isLast }: { root: TreeMember; isLast: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <NodeCard node={root} depth={0} isRoot />
      {root.children && root.children.length > 0 && (
        <>
          <Connector isRoot />
          <ChildrenRow nodes={root.children} parentId={root.id} />
        </>
      )}
      {!isLast && <div className="h-8 w-px bg-gray-200 dark:bg-dark-600" />}
    </div>
  );
}

function ChildrenRow({ nodes, parentId }: { nodes: TreeMember[]; parentId: string }) {
  return (
    <div className="flex items-start justify-center gap-6">
      {nodes.map((child, i) => (
        <div key={child.id} className="flex flex-col items-center relative">
          {/* conector horizontal desde la línea vertical del padre */}
          <div className="flex-1" />
          <div className="flex flex-col items-center">
            <div className="w-px h-6 bg-gray-200 dark:bg-dark-600" />
            <div className="flex items-center gap-1 w-full justify-center">
              {i > 0 && <div className="flex-1 h-px bg-gray-200 dark:bg-dark-600" />}
              <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-dark-500 shrink-0" />
              {i < nodes.length - 1 && <div className="flex-1 h-px bg-gray-200 dark:bg-dark-600" />}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <NodeCard node={child} depth={1} />
            {child.children && child.children.length > 0 && (
              <>
                <div className="w-px h-6 bg-gray-200 dark:bg-dark-600" />
                <ChildrenRow nodes={child.children} parentId={child.id} />
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Connector({ isRoot }: { isRoot?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-px h-6 bg-gray-200 dark:bg-dark-600" />
      <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-dark-500" />
    </div>
  );
}

function NodeCard({ node, depth, isRoot }: { node: TreeMember; depth: number; isRoot?: boolean }) {
  const [open, setOpen] = useState(true);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const ring = statusRing[node.membershipStatus] || statusRing.INACTIVE;

  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex flex-col items-center rounded-2xl bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 shadow-md px-4 py-3 transition-all hover:shadow-lg hover:-translate-y-0.5 ${
          isRoot ? 'border-primary-200 dark:border-primary-700 ring-2 ring-primary-500/20' : ''
        }`}
        style={{ minWidth: isRoot ? 140 : 120 }}
      >
        <div className={`relative w-14 h-14 rounded-full ring-4 ${ring} overflow-hidden shadow-lg`}>
          {node.avatarUrl ? (
            <img src={node.avatarUrl} alt={`Foto de ${node.username}`} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-500 to-purple-700 flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {(node.firstName?.[0] || node.username?.[0] || '?').toUpperCase()}
              </span>
            </div>
          )}
          <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-dark-800 ${
            node.membershipStatus === 'ACTIVE' ? 'bg-emerald-400' : 'bg-gray-400'
          }`} />
        </div>
        <p className="mt-2 text-xs font-semibold text-gray-900 dark:text-dark-100 text-center leading-tight max-w-[110px] truncate">
          {node.firstName || node.username} {node.lastName || ''}
        </p>
        <p className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-dark-400 mt-0.5">
          <Globe className="w-2.5 h-2.5" /> {node.country || '—'}
        </p>
        <span className={`mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
          node.membershipStatus === 'ACTIVE'
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
            : 'bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-dark-400'
        }`}>
          {node.membershipStatus === 'ACTIVE' ? 'Activo' : 'Inactivo'}
        </span>
      </div>
      {hasChildren && depth === 0 && (
        <button
          onClick={() => setOpen(!open)}
          className="mt-1 p-1 text-gray-400 dark:text-dark-500 hover:text-primary-500 transition-colors"
          title={open ? 'Colapsar' : 'Expandir'}
        >
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}
