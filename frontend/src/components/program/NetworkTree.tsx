import { useState, useRef } from 'react';
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
  currentUser?: { id?: string; firstName?: string | null; lastName?: string | null; username: string; country?: string | null; avatarUrl?: string | null; membershipStatus?: string } | null;
}

const statusRing: Record<string, string> = {
  ACTIVE: 'ring-emerald-400 shadow-emerald-500/30',
  INACTIVE: 'ring-gray-300 dark:ring-dark-600',
  REVOKED: 'ring-red-400',
};

export function NetworkTree({ roots, currentUser }: NetworkTreeProps) {
  const me: TreeMember | null = currentUser
    ? {
        id: currentUser.id || 'me',
        firstName: currentUser.firstName || null,
        lastName: currentUser.lastName || null,
        username: currentUser.username,
        country: currentUser.country || null,
        avatarUrl: currentUser.avatarUrl || null,
        membershipStatus: (currentUser as any).membershipStatus || 'ACTIVE',
      }
    : null;

  const MIN_SCALE = 0.4;
  const MAX_SCALE = 2.5;
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Gestos táctiles: 1 dedo = mover, 2 dedos = zoom (pellizco).
  const pinchRef = useRef({ active: false, startDist: 0, startScale: 1 });
  const panTouchRef = useRef({ active: false, lastX: 0, lastY: 0 });
  const dragMouseRef = useRef({ active: false, lastX: 0, lastY: 0 });

  const clampScale = (v: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, v));

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setScale(s => clampScale(s - e.deltaY * 0.002));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchRef.current = {
        active: true,
        startDist: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY),
        startScale: scale,
      };
      panTouchRef.current.active = false;
    } else if (e.touches.length === 1) {
      panTouchRef.current = { active: true, lastX: e.touches[0].clientX, lastY: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current.active) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (pinchRef.current.startDist > 0) {
        setScale(clampScale(pinchRef.current.startScale * (dist / pinchRef.current.startDist)));
      }
    } else if (e.touches.length === 1 && panTouchRef.current.active) {
      const t = e.touches[0];
      const dx = t.clientX - panTouchRef.current.lastX;
      const dy = t.clientY - panTouchRef.current.lastY;
      panTouchRef.current.lastX = t.clientX;
      panTouchRef.current.lastY = t.clientY;
      setOffset(o => ({ x: o.x + dx, y: o.y + dy }));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      pinchRef.current.active = false;
      panTouchRef.current.active = false;
    } else if (e.touches.length === 1) {
      // Al soltar un dedo del pellizco, continúa como arrastre.
      pinchRef.current.active = false;
      panTouchRef.current = { active: true, lastX: e.touches[0].clientX, lastY: e.touches[0].clientY };
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    dragMouseRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragMouseRef.current.active) return;
    const dx = e.clientX - dragMouseRef.current.lastX;
    const dy = e.clientY - dragMouseRef.current.lastY;
    dragMouseRef.current.lastX = e.clientX;
    dragMouseRef.current.lastY = e.clientY;
    setOffset(o => ({ x: o.x + dx, y: o.y + dy }));
  };
  const endMouseDrag = () => { dragMouseRef.current.active = false; };

  const resetView = () => { setScale(1); setOffset({ x: 0, y: 0 }); };

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-lg p-1 shadow-sm">
        <button onClick={() => setScale(s => Math.max(MIN_SCALE, s - 0.1))} className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-700 rounded text-sm">−</button>
        <span className="text-xs w-10 text-center">{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale(s => Math.min(MAX_SCALE, s + 0.1))} className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-700 rounded text-sm">+</button>
        <button onClick={resetView} className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-700 rounded text-xs" title="Centrar">⤾</button>
      </div>
      <div
        className="overflow-hidden py-4 touch-manipulation select-none"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={endMouseDrag}
        onMouseLeave={endMouseDrag}
        style={{ touchAction: 'none', cursor: dragMouseRef.current.active ? 'grabbing' : scale > 1 ? 'grab' : 'default', overscrollBehavior: 'contain' }}
      >
        <div className="flex justify-center min-w-max" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: 'top center' }}>
          <div className="flex flex-col items-center gap-2">
            {me && (
              <>
                <NodeCard node={me} depth={0} isRoot />
                <Connector isRoot />
              </>
            )}
            <div className="flex items-start justify-center gap-8">
              {roots.map((root) => (
                <div key={root.id} className="flex flex-col items-center">
                  <NodeCard node={root} depth={0} />
                  {root.children && root.children.length > 0 && (
                    <>
                      <Connector isRoot />
                      <div className="bg-gray-50 dark:bg-dark-700/30 rounded-xl border border-gray-200 dark:border-dark-600 px-2 py-2">
                        <p className="text-[10px] font-bold text-center text-gray-500 dark:text-dark-400 mb-1.5">Equipo de {root.firstName || root.username}</p>
                        <ChildrenRow nodes={root.children} parentId={root.id} />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-center text-gray-400 mt-1">Arrastra para mover · Pellizca para zoom · Botones − / + / ⤾ para centrar</p>
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
        <div className="relative w-14 h-14">
          <div className={`w-14 h-14 rounded-full ring-4 ${ring} overflow-hidden shadow-lg`}>
            {node.avatarUrl ? (
              <img src={node.avatarUrl} alt={`Foto de ${node.username}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-500 to-purple-700 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {(node.firstName?.[0] || node.username?.[0] || '?').toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-dark-800 z-10 ${
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
