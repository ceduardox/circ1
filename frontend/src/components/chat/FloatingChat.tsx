import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, X, Send, ChevronDown, Search, Check, Trash2, Ban, CheckCircle2, Smile, Maximize2, Minimize2, ChevronLeft, ImagePlus, XCircle, ZoomIn, ZoomOut, ShieldCheck, ChevronRight, Bell, BellRing } from 'lucide-react';
import { chatApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { countryFlag } from '@/lib/utils';
import { hasPushPermission, requestPushPermission } from '@/lib/onesignal';
import { toast } from 'sonner';
import 'flag-icons/css/flag-icons.min.css';

interface ChatUser {
  id: string;
  firstName?: string;
  lastName?: string;
  username: string;
  country?: string;
  avatarUrl?: string;
  role?: string;
  chatBlocked?: boolean;
}

interface ChatMsg {
  id: string;
  message: string;
  messagePreview?: string;
  imageUrl?: string | null;
  createdAt: string;
  deletedAt?: string | null;
  isDeleted?: boolean;
  user: ChatUser;
  isImpersonated: boolean;
  isOwn: boolean;
}

// Paleta de colores para identificar a cada usuario en el chat.
const USER_COLORS = [
  'text-blue-600 dark:text-blue-400',
  'text-emerald-600 dark:text-emerald-400',
  'text-purple-600 dark:text-purple-400',
  'text-pink-600 dark:text-pink-400',
  'text-amber-600 dark:text-amber-400',
  'text-cyan-600 dark:text-cyan-400',
  'text-orange-600 dark:text-orange-400',
  'text-rose-600 dark:text-rose-400',
  'text-indigo-600 dark:text-indigo-400',
  'text-teal-600 dark:text-teal-400',
];

// Color estable por usuario (basado en su username).
function userColor(id?: string): string {
  let hash = 0;
  const str = id || 'anon';
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[idx];
}

// Renderiza el texto del mensaje resaltando las menciones @usuario.
const MENTION_RE = /(@[a-zA-Z0-9_]{1,30})/g;
function mentionText(text: string): React.ReactNode[] {
  return text.split(MENTION_RE).map((part, i) => {
    if (part.startsWith('@') && part.length > 1) {
      return (
        <span key={i} className="font-bold text-sky-500 dark:text-sky-400 bg-sky-500/10 rounded px-0.5">
          {part}
        </span>
      );
    }
    return part;
  });
}

const EMOJIS = [
  '😀','😄','😁','😂','🤣','😊','😍','🥰','😘','😎','🤩','🥳',
  '😢','😭','😅','🙃','😉','🤔','🤗','😇','🤯','😴','🤤','😪',
  '👍','👎','👏','🙏','💪','🤝','✌️','🤟','👋','🙌','🤲','👊',
  '❤️','🧡','💛','💚','💙','💜','🖤','💯','🔥','✨','🌟','💥',
  '🎉','🎊','🎯','🏆','🥇','🚀','💰','💵','💳','🤑','💸','🏁',
  '✅','❌','⚠️','❗','❓','💡','🧠','⚡','🌍','🏆','⚽','🎮',
];

function Avatar({ user, size = 'md' }: { user: ChatUser; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-primary-500 to-purple-700 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden ring-2 ring-offset-1 dark:ring-offset-dark-800 ${userColor(user.id)}`}>
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        `${user.firstName?.[0] || user.username?.[0] || '?'}`.toUpperCase()
      )}
    </div>
  );
}

function Flag({ country }: { country?: string }) {
  const code = countryFlag(country);
  if (!code) return null;
  return (
    <span
      className={`fi fi-${code} shrink-0 rounded-sm shadow-sm`}
      style={{ width: '1rem', height: '0.7rem', backgroundSize: 'cover' }}
      aria-hidden="true"
    />
  );
}

// Visor de imagen con zoom: pinch en móvil, scroll en PC, doble clic para alternar.
function ZoomableImage({ src, onClose }: { src: string; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);
  const dragRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const lastTapRef = useRef(0);

  const apply = (s: number, o: { x: number; y: number }) => {
    scaleRef.current = s;
    offsetRef.current = o;
    setScale(s);
    setOffset(o);
  };

  const reset = () => apply(1, { x: 0, y: 0 });

  const onWheel = (e: React.WheelEvent) => {
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    const next = Math.min(4, Math.max(1, scaleRef.current * factor));
    apply(next, next === 1 ? { x: 0, y: 0 } : offsetRef.current);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (pinchRef.current && pinchRef.current.dist) return;
    dragRef.current = { x: e.clientX, y: e.clientY, startX: offsetRef.current.x, startY: offsetRef.current.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current) {
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      if (scaleRef.current > 1) {
        apply(scaleRef.current, { x: dragRef.current.startX + dx, y: dragRef.current.startY + dy });
      }
    }
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  // Manejo de pinch con dos dedos usando touch events (más fiable en móvil).
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.sqrt(dx * dx + dy * dy), scale: scaleRef.current };
      dragRef.current = null;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const next = Math.min(4, Math.max(1, (pinchRef.current.scale * dist) / pinchRef.current.dist));
      apply(next, next === 1 ? { x: 0, y: 0 } : offsetRef.current);
    } else if (e.touches.length === 1 && scaleRef.current > 1 && !pinchRef.current) {
      // Arrastre con un dedo cuando está ampliado.
      e.preventDefault();
      const prev = dragRef.current;
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      if (!prev) {
        dragRef.current = { x, y, startX: offsetRef.current.x, startY: offsetRef.current.y };
      } else {
        const dx = x - prev.x;
        const dy = y - prev.y;
        apply(scaleRef.current, { x: offsetRef.current.x + dx, y: offsetRef.current.y + dy });
        dragRef.current = { x, y, startX: offsetRef.current.x, startY: offsetRef.current.y };
      }
    }
  };

  const onTouchEnd = () => {
    pinchRef.current = null;
    dragRef.current = null;
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      reset();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      apply(scaleRef.current > 1 ? 1 : 2.5, scaleRef.current > 1 ? { x: 0, y: 0 } : offsetRef.current);
    }
  };

  const zoomBy = (factor: number) => {
    const next = Math.min(4, Math.max(1, scaleRef.current * factor));
    apply(next, next === 1 ? { x: 0, y: 0 } : offsetRef.current);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fade-in overflow-hidden"
      onClick={onClose}
      onWheel={onWheel}
      onDoubleClick={onDoubleClick}
      style={{ touchAction: 'none', cursor: scale > 1 ? 'grabbing' : 'zoom-in' }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
        aria-label="Cerrar imagen"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); zoomBy(1 / 1.25); }}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          aria-label="Alejar"
          title="Alejar"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
        >
          Cerrar
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); zoomBy(1.25); }}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          aria-label="Acercar"
          title="Acercar"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
      </div>

      <img
        src={src}
        alt="Imagen del chat en grande"
        draggable={false}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transition: 'transform 0.05s linear',
          maxWidth: '90vw',
          maxHeight: '85vh',
          objectFit: 'contain',
          borderRadius: '12px',
          cursor: scale > 1 ? 'grabbing' : 'zoom-in',
        }}
      />
    </div>
  );
}

export function FloatingChat() {
  const { user, isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [impersonateId, setImpersonateId] = useState<string>('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [auditData, setAuditData] = useState<any[]>([]);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushChecking, setPushChecking] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);
  const isAdmin = user?.role === 'ADMIN';

  // Optimiza una imagen en el navegador: redimensiona a máx 1280px y comprime a JPEG/WebP.
  const optimizeImage = async (file: File): Promise<File | null> => {
    if (!file.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen');
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar los 5MB');
      return null;
    }
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
      if (!ctx) return file;
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(b => resolve(b), 'image/jpeg', 0.8));
      if (!blob) return file;
      return new File([blob], 'chat-image.jpg', { type: 'image/jpeg' });
    } catch {
      return file;
    }
  };

  const handleFileSelect = async (file: File) => {
    const optimized = await optimizeImage(file);
    if (!optimized) return;
    const preview = URL.createObjectURL(optimized);
    setPendingImage({ file: optimized, preview });
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          handleFileSelect(file);
          return;
        }
      }
    }
  };

  const insertEmoji = (emoji: string) => {
    setDraft(prev => (prev + emoji).slice(0, 300));
  };

  const loadMessages = async (countUnread = false) => {
    try {
      const { data } = await chatApi.messages();
      const msgs = data.messages || [];
      setMessages(msgs);
      setHasMore(!!data.hasMore);
      // Cuando el chat está cerrado, contar mensajes que no son míos (badge).
      if (countUnread && !openRef.current) {
        const mine = new Set(msgs.filter((m: ChatMsg) => m.isOwn && !m.isImpersonated).map((m: ChatMsg) => m.id));
        const other = msgs.filter((m: ChatMsg) => !mine.has(m.id) && !m.isDeleted).length;
        setUnreadCount(other);
      }
    } catch { /* silencioso */ }
  };

  useEffect(() => {
    openRef.current = open;
    if (open) setUnreadCount(0);
  }, [open]);

  const loadMore = async () => {
    if (loadingMore || messages.length === 0) return;
    setLoadingMore(true);
    try {
      const first = messages[0];
      const { data } = await chatApi.messages({ before: first.createdAt });
      const older = data.messages || [];
      setMessages(prev => [...older, ...prev]);
      setHasMore(!!data.hasMore);
      // Mantener la posición de scroll después de cargar más arriba.
      if (listRef.current) {
        const anchor = listRef.current.children[older.length] as HTMLElement | undefined;
        if (anchor) listRef.current.scrollTop = anchor.offsetTop;
      }
    } catch { /* silencioso */ }
    finally {
      setLoadingMore(false);
    }
  };

  const loadUsers = async () => {
    if (!isAdmin) return;
    try {
      const { data } = await chatApi.users();
      setUsers(data.users || []);
    } catch { /* silencioso */ }
  };

  const loadAudit = async () => {
    if (!isAdmin) return;
    try {
      const { data } = await chatApi.audit();
      setAuditData(data.messages || []);
    } catch { /* silencioso */ }
  };

  // Detecta si el navegador ya tiene el permiso de push concedido.
  useEffect(() => {
    let active = true;
    (async () => {
      const ok = await hasPushPermission();
      if (active) {
        setPushEnabled(ok);
        setPushChecking(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const enablePush = async () => {
    const ok = await requestPushPermission();
    setPushEnabled(ok);
    if (ok) {
      toast.success('Notificaciones activadas. Te avisaremos de las menciones en el chat.');
    } else {
      toast.error('Permiso denegado. Activa las notificaciones desde el navegador para recibir menciones.');
    }
  };

  // Polling: cada 5s cuando el chat está abierto (carga normal), y también
  // cuando está cerrado para contar mensajes nuevos en el badge.
  useEffect(() => {
    if (!isAuthenticated) return;
    const t = setInterval(() => {
      if (openRef.current) loadMessages();
      else loadMessages(true);
    }, 5000);
    return () => clearInterval(t);
  }, [isAuthenticated]);

  useEffect(() => {
    if (open && isAuthenticated) {
      setLoading(true);
      setUnreadCount(0);
      Promise.all([loadMessages(), loadUsers()]).finally(() => setLoading(false));
    }
  }, [open, isAuthenticated]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = async () => {
    const text = draft.trim();
    if ((!text && !pendingImage) || sending) return;
    setSending(true);
    setUploadingImage(!!pendingImage);
    try {
      let imageUrl: string | undefined;
      if (pendingImage) {
        const { data } = await chatApi.uploadImage(pendingImage.file);
        imageUrl = data.imageUrl;
      }
      await chatApi.send({ message: text, imageUrl, asUserId: impersonateId || undefined });
      setDraft('');
      if (pendingImage) {
        URL.revokeObjectURL(pendingImage.preview);
        setPendingImage(null);
      }
      await loadMessages();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al enviar el mensaje');
    } finally {
      setSending(false);
      setUploadingImage(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${u.firstName || ''} ${u.lastName || ''} ${u.username}`.toLowerCase().includes(q);
  });

  // Candidatos para mencionar: usuarios (si es admin) + remitentes de mensajes cargados.
  const mentionCandidates = useMemo(() => {
    const map = new Map<string, ChatUser>();
    users.forEach(u => map.set(u.username.toLowerCase(), u));
    messages.forEach(m => {
      if (m.user?.username && !map.has(m.user.username.toLowerCase())) {
        map.set(m.user.username.toLowerCase(), m.user);
      }
    });
    return Array.from(map.values()).filter(u => u.username !== user?.username);
  }, [users, messages, user]);

  // Detecta si se está escribiendo una mención (última palabra empieza con @).
  const mentionState = useMemo(() => {
    const m = draft.match(/@([a-zA-Z0-9_]{0,30})$/);
    if (!m) return null;
    const partial = m[1].toLowerCase();
    return {
      partial,
      matches: mentionCandidates.filter(u =>
        u.username.toLowerCase().startsWith(partial) ||
        `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().startsWith(partial)
      ).slice(0, 6),
    };
  }, [draft, mentionCandidates]);

  const insertMention = (u: ChatUser) => {
    // Reemplaza el @parcial que se está escribiendo por @username + espacio.
    const before = draft.replace(/@([a-zA-Z0-9_]{0,30})$/, `@${u.username} `);
    setDraft(before.slice(0, 300));
    setMentionOpen(false);
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('¿Eliminar este mensaje del chat? Se ocultará para todos los usuarios.')) return;
    try {
      await chatApi.deleteMessage(id);
      await loadMessages();
      toast.success('Mensaje eliminado para la comunidad');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al eliminar');
    }
  };

  const restoreMessage = async (id: string) => {
    try {
      await chatApi.restoreMessage(id);
      await loadMessages();
      toast.success('Mensaje restaurado');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al restaurar');
    }
  };

  const toggleBlock = async (u: ChatUser) => {
    const next = !u.chatBlocked;
    const action = next ? 'bloquear' : 'desbloquear';
    if (next && !confirm(`¿Bloquear a ${u.firstName || u.username} para que no pueda chatear?`)) return;
    try {
      await chatApi.setBlocked(u.id, next);
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, chatBlocked: next } : x));
      toast.success(next ? 'Usuario bloqueado del chat' : 'Usuario desbloqueado');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al cambiar el bloqueo');
    }
  };

  const impUser = users.find(u => u.id === impersonateId);

  if (!isAuthenticated) return null;

  return (
    <div className={`fixed z-50 flex flex-col items-end gap-3 ${expanded ? 'inset-0' : 'bottom-5 right-5'}`}>
      {open && (
        <div className={`bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 shadow-2xl flex flex-col overflow-hidden ${
          expanded
            ? 'fixed inset-0 w-full h-full rounded-none animate-enter-up'
            : 'w-[calc(100vw-2.5rem)] max-w-sm h-[28rem] max-h-[calc(100vh-6rem)] rounded-2xl animate-enter-up'
        }`}>
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              {expanded && (
                <button onClick={() => setExpanded(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" aria-label="Volver al chat flotante" title="Volver atrás">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <p className="font-bold">Chat Comunitario</p>
                <p className="text-primary-100 text-xs">Conecta con toda la comunidad</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!pushChecking && (
                <button
                  onClick={enablePush}
                  disabled={pushEnabled}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-70 disabled:cursor-default"
                  aria-label="Activar notificaciones del chat"
                  title={pushEnabled ? 'Notificaciones activadas' : 'Activar notificaciones de menciones'}
                >
                  {pushEnabled ? <BellRing className="w-4 h-4 text-emerald-200" /> : <Bell className="w-4 h-4" />}
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => { loadAudit(); setShowAudit(true); }}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Auditoría de impersonación"
                  title="Ver quién escribió de verdad (auditoría)"
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>
              )}
              {!expanded && (
                <button onClick={() => setExpanded(true)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" aria-label="Ver en pantalla completa" title="Pantalla completa">
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}
              {expanded && (
                <button onClick={() => setExpanded(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" aria-label="Volver atrás" title="Volver al chat flotante">
                  <Minimize2 className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => { setOpen(false); setExpanded(false); }} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" aria-label="Cerrar chat">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Búsqueda de mensajes (modo expandido) */}
          {expanded && (
            <div className="px-3 py-2 border-b border-gray-100 dark:border-dark-700 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar mensajes..."
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-dark-200"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Selector de impersonación (solo admin) */}
          {isAdmin && (
            <div className="px-3 py-2 border-b border-gray-100 dark:border-dark-700">
              <button
                onClick={() => setPickerOpen(!pickerOpen)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-sm"
              >
                <span className="flex items-center gap-2 min-w-0">
                  {impUser ? (
                    <>
                      <Avatar user={impUser} size="sm" />
                      <span className="truncate font-medium text-gray-900 dark:text-dark-100">
                        Chateando como {impUser.firstName || impUser.username}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-500 dark:text-dark-400 font-medium">
                      Chateando como Admin
                    </span>
                  )}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${pickerOpen ? 'rotate-180' : ''}`} />
              </button>

              {pickerOpen && (
                <div className="mt-2">
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Buscar usuario..."
                      className="w-full h-8 pl-8 pr-3 rounded-lg border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    <button
                      onClick={() => { setImpersonateId(''); setPickerOpen(false); setSearch(''); }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                        !impersonateId ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'hover:bg-gray-50 dark:hover:bg-dark-700'
                      }`}
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 dark:bg-dark-600 text-gray-600 dark:text-dark-300 text-xs font-bold">A</span>
                      <span className="font-medium">Chatear como Admin</span>
                      {!impersonateId && <Check className="w-4 h-4 ml-auto text-primary-600" />}
                    </button>
                    {filteredUsers.map(u => (
                      <div
                        key={u.id}
                        className={`flex items-center gap-1 rounded-lg px-1 transition-colors ${
                          impersonateId === u.id ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-dark-700'
                        }`}
                      >
                        <button
                          onClick={() => { setImpersonateId(u.id); setPickerOpen(false); setSearch(''); }}
                          className="flex-1 flex items-center gap-2 px-1.5 py-1.5 text-sm text-left"
                        >
                          <Avatar user={u} size="sm" />
                          <span className="flex items-center gap-1.5 font-medium min-w-0">
                            <span className={`truncate ${u.chatBlocked ? 'text-gray-400 line-through' : ''}`}>{u.firstName || u.username}</span>
                            <Flag country={u.country} />
                          </span>
                          <span className="text-[10px] text-gray-400 truncate">@{u.username}</span>
                          {u.chatBlocked && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300">bloqueado</span>
                          )}
                          {impersonateId === u.id && <Check className="w-4 h-4 ml-auto text-primary-600" />}
                        </button>
                        <button
                          onClick={() => toggleBlock(u)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.chatBlocked
                              ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                              : 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                          }`}
                          title={u.chatBlocked ? 'Desbloquear del chat' : 'Bloquear del chat'}
                          aria-label={u.chatBlocked ? 'Desbloquear del chat' : 'Bloquear del chat'}
                        >
                          {u.chatBlocked ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mensajes */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 chat-pattern-bg">
            {loading && messages.length === 0 ? (
              <div className="text-center text-gray-400 text-xs py-6">Cargando...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-400 text-xs py-6">
                Aún no hay mensajes. ¡Sé el primero en saludar!
              </div>
            ) : (
              <>
                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="w-full py-2 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? 'Cargando...' : 'Cargar más mensajes'}
                  </button>
                )}
                {messages
                  .filter(m => !searchQuery || m.message.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(m => {
                  const mine = m.isOwn && !m.isImpersonated;
                  const deleted = m.isDeleted;
                  return (
                    <div key={m.id} className={`group flex gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                      {!mine && <Avatar user={m.user} size="sm" />}
                      <div className={`relative max-w-[80%] rounded-2xl px-3 py-2 ${
                        deleted
                          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl rounded-bl-sm'
                          : mine
                          ? 'bg-primary-600 text-white rounded-2xl rounded-br-sm'
                          : 'bg-white dark:bg-dark-700 border border-gray-100 dark:border-dark-600 rounded-2xl rounded-bl-sm'
                      }`}>
                        {isAdmin && !deleted && (
                          <button
                            onClick={() => deleteMessage(m.id)}
                            className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                            title="Eliminar mensaje"
                            aria-label="Eliminar mensaje"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        {isAdmin && deleted && (
                          <button
                            onClick={() => restoreMessage(m.id)}
                            className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                            title="Restaurar mensaje"
                            aria-label="Restaurar mensaje"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                          </button>
                        )}
                        {!mine && (
                        <p className="flex items-center gap-1.5 text-[11px] font-bold mb-0.5">
                          <span className={`truncate ${userColor(m.user.id)}`}>{m.user.firstName || m.user.username}</span>
                          <span className="text-[10px] font-semibold text-gray-400 dark:text-dark-500 truncate">@{m.user.username}</span>
                          <Flag country={m.user.country} />
                          {m.user.role === 'ADMIN' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300">Admin</span>
                          )}
                          {m.isImpersonated && isAdmin && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300">impersonado</span>
                          )}
                        </p>
                      )}
                      {deleted ? (
                        <>
                          <p className="text-sm italic text-red-600 dark:text-red-300 line-through opacity-60">{m.message}</p>
                          <p className="text-[10px] font-semibold text-red-500 dark:text-red-400 mt-0.5">
                            🗑️ Eliminado para la comunidad · visible solo para el admin
                          </p>
                        </>
                      ) : (
                        <>
                          {m.imageUrl && (
                            <img
                              src={m.imageUrl}
                              alt="Imagen del chat"
                              className="max-w-[200px] max-h-[200px] rounded-xl object-cover my-1 cursor-zoom-in hover:opacity-90 transition-opacity"
                              loading="lazy"
                              onClick={() => m.imageUrl && setViewImage(m.imageUrl)}
                            />
                          )}
                          {m.message && <p className="text-sm leading-snug break-words">{mentionText(m.message)}</p>}
                        </>
                      )}
                      <p className={`text-[10px] mt-0.5 ${mine ? 'text-primary-200' : 'text-gray-400 dark:text-dark-500'}`}>
                        {new Date(m.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {mine && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-purple-700 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                        {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : `${user?.firstName?.[0] || '?'}`.toUpperCase()}
                      </div>
                    )}
                  </div>
                );
              })}
              </>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100 dark:border-dark-700 relative">
            {mentionOpen && mentionState && mentionState.matches.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mx-3 mb-1 max-h-40 overflow-y-auto rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 shadow-lg z-20">
                {mentionState.matches.map(u => (
                  <button
                    key={u.id}
                    onMouseDown={e => {
                      e.preventDefault();
                      insertMention(u);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-dark-700 text-left"
                  >
                    <Avatar user={u} size="sm" />
                    <span className="font-semibold text-primary-600 dark:text-primary-400">@{u.username}</span>
                    <span className="text-xs text-gray-500 dark:text-dark-400 truncate">
                      {u.firstName} {u.lastName}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {pendingImage && (
              <div className="relative inline-block mb-2">
                <img src={pendingImage.preview} alt="Vista previa" className="h-20 w-20 object-cover rounded-xl border border-gray-200 dark:border-dark-600" />
                <button
                  onClick={() => {
                    URL.revokeObjectURL(pendingImage.preview);
                    setPendingImage(null);
                  }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow"
                  aria-label="Quitar imagen"
                >
                  <XCircle className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                value={draft}
                maxLength={300}
                onChange={e => {
                  setDraft(e.target.value);
                  setMentionOpen(true);
                }}
                onKeyDown={e => {
                  if (mentionOpen && mentionState && (e.key === 'Tab' || e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                    e.preventDefault();
                  }
                  if (e.key === 'Enter') {
                    if (mentionOpen && mentionState && mentionState.matches.length > 0) {
                      insertMention(mentionState.matches[0]);
                    } else {
                      send();
                    }
                  }
                  if (e.key === 'Escape') setMentionOpen(false);
                }}
                onPaste={handlePaste}
                onBlur={() => setTimeout(() => setMentionOpen(false), 150)}
                placeholder={impUser ? `Enviando como ${impUser.firstName || impUser.username}...` : 'Escribe un mensaje...'}
                className="flex-1 h-10 px-3 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                  e.target.value = '';
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-dark-300 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
                aria-label="Adjuntar imagen"
                title="Adjuntar imagen (o pega con Ctrl+V)"
              >
                <ImagePlus className="w-5 h-5" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setEmojiOpen(!emojiOpen)}
                  className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-dark-300 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
                  aria-label="Emojis"
                >
                  <Smile className="w-5 h-5" />
                </button>
                {emojiOpen && (
                  <>
                    <div className="absolute bottom-11 right-0 w-64 max-w-[calc(100vw-6rem)] bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-600 shadow-2xl p-2 z-10 animate-enter-up">
                      <div className="grid grid-cols-6 gap-0.5 max-h-52 overflow-y-auto">
                        {EMOJIS.map(e => (
                          <button
                            key={e}
                            onClick={() => { insertEmoji(e); }}
                            className="h-9 flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="fixed inset-0 z-0" onClick={() => setEmojiOpen(false)} />
                  </>
                )}
              </div>
              <button
                onClick={send}
                disabled={(!draft.trim() && !pendingImage) || sending || uploadingImage}
                className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 disabled:opacity-40 transition-colors"
                aria-label="Enviar"
              >
                {sending || uploadingImage ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between mt-1 px-1">
              <span className="text-[10px] text-gray-400 dark:text-dark-500">
                {pendingImage ? 'Imagen lista para enviar · máx 5MB' : draft.length >= 270 && draft.length <= 300
                  ? `${300 - draft.length} caracteres restantes`
                  : 'Máx. 300 caracteres'}
              </span>
              <span className={`text-[10px] ${draft.length >= 300 ? 'text-red-500 font-semibold' : 'text-gray-400 dark:text-dark-500'}`}>
                {draft.length}/300
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante — oculto en modo pantalla completa */}
      {!expanded && (
        <button
          onClick={() => setOpen(!open)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-600 to-purple-700 text-white shadow-xl shadow-primary-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform relative"
          aria-label={open ? 'Cerrar chat' : 'Abrir chat'}
        >
          {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
          {!open && (
            <>
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full bg-red-500 border-2 border-white dark:border-dark-800 text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white dark:border-dark-800 rounded-full animate-pulse" />
              )}
            </>
          )}
        </button>
      )}

      {/* Modal de imagen en grande con zoom */}
      {viewImage && (
        <ZoomableImage src={viewImage} onClose={() => setViewImage(null)} />
      )}

      {/* Auditoría de impersonación (solo admin) */}
      {showAudit && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAudit(false)}>
          <div
            className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <div>
                  <p className="font-bold">Auditoría de impersonación</p>
                  <p className="text-xs text-gray-500 dark:text-dark-400">Quién escribió de verdad al enviar como otro usuario</p>
                </div>
              </div>
              <button onClick={() => setShowAudit(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 dark:text-dark-300" aria-label="Cerrar auditoría">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {auditData.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-dark-400 text-center py-8">No hay mensajes impersonados.</p>
              ) : (
                auditData.map(a => (
                  <div key={a.id} className="rounded-xl border border-gray-100 dark:border-dark-700 p-3 bg-gray-50 dark:bg-dark-700">
                    <div className="flex items-center gap-2 text-xs mb-1 flex-wrap">
                      <span className="font-bold text-gray-700 dark:text-dark-200">@{a.realSender.username}</span>
                      <span className="text-gray-400 dark:text-dark-400">{a.realSender.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-bold text-primary-600 dark:text-primary-400">@{a.shownAs.username}</span>
                      <span className="ml-auto text-gray-400 dark:text-dark-500">
                        {new Date(a.createdAt).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm break-words">{a.message || '(solo imagen)'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}