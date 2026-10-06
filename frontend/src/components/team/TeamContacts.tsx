import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Phone, Clock, CheckCircle2, XCircle, UserPlus, Trash2, Loader2, Plus,
  MessageCircle, TrendingUp, Target, Users2, Sparkles, Search, X,
  ExternalLink, Filter, ChevronRight, Share2, Copy
} from 'lucide-react';
import { teamApi } from '@/services/api';
import { ButtonPrimary, Button, Input, Label } from '@/components/ui';
import { toast } from 'sonner';

interface Contact {
  id: string;
  name: string;
  contact?: string | null;
  notes?: string | null;
  status: string;
  createdAt: string;
}

const STATUS_FLOW = ['PENDING', 'CONTACTED', 'CALL_BACK', 'READY', 'REJECTED'] as const;

const statusMeta: Record<string, { label: string; icon: any; color: string; bg: string; ring: string }> = {
  PENDING: { label: 'Pendiente', icon: UserPlus, color: 'text-gray-600 dark:text-dark-300', bg: 'bg-gray-100 dark:bg-dark-700', ring: 'ring-gray-300 dark:ring-dark-600' },
  CONTACTED: { label: 'Contactado', icon: MessageCircle, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', ring: 'ring-blue-300' },
  CALL_BACK: { label: 'Llamar después', icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', ring: 'ring-amber-300' },
  READY: { label: '¡Listo!', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', ring: 'ring-emerald-300' },
  REJECTED: { label: 'Rechazó', icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', ring: 'ring-red-300' },
};

// Resaltado de coincidencias estilo WhatsApp
function highlightMatch(text: string, query: string) {
  if (!query.trim() || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-amber-200 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 font-bold px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function TeamContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Buscador y filtros
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONTACTED' | 'CALL_BACK' | 'READY' | 'REJECTED'>('ALL');

  const load = useCallback(async () => {
    try {
      const { data } = await teamApi.contacts();
      setContacts(data.contacts || []);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al cargar contactos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createContact = async () => {
    if (!name.trim()) {
      toast.error('Escribe el nombre del contacto');
      return;
    }
    setSaving(true);
    try {
      await teamApi.createContact({ name: name.trim(), contact: contactInfo.trim() || null, notes: notes.trim() || null });
      toast.success('¡Contacto agregado con éxito!');
      setName(''); setContactInfo(''); setNotes('');
      setShowForm(false);
      await load();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'No se pudo agregar');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (id: string, status: string) => {
    const prev = contacts;
    setContacts(prev.map(c => c.id === id ? { ...c, status } : c));
    try {
      await teamApi.updateContact(id, { status });
    } catch {
      setContacts(prev);
      toast.error('No se pudo actualizar el estado');
    }
  };

  const removeContact = async (id: string) => {
    try {
      await teamApi.deleteContact(id);
      setContacts(contacts.filter(c => c.id !== id));
      toast.success('Contacto eliminado');
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  const counts = STATUS_FLOW.reduce((acc, s) => {
    acc[s] = contacts.filter(c => c.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const readyCount = counts.READY || 0;
  const total = contacts.length;
  const progressPct = total > 0 ? Math.round(((counts.CONTACTED + counts.CALL_BACK + counts.READY) / total) * 100) : 0;

  // Filtrado
  const filteredContacts = contacts.filter(c => {
    const term = search.toLowerCase().trim();
    const matchesSearch = term === '' ||
      c.name?.toLowerCase().includes(term) ||
      c.contact?.toLowerCase().includes(term) ||
      c.notes?.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Panel resumen del Embudo */}
      <div className="rounded-3xl border border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-800 overflow-hidden shadow-sm">
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span>Embudo de Conversión de Prospectos</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                {total} prospectos registrados · {progressPct}% de avance en el pipeline
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-xl">
              {readyCount} listos para cierre
            </span>
          </div>

          {/* Barra de Progreso */}
          <div className="h-3 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-amber-400 to-emerald-500 rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${Math.max(progressPct, 4)}%` }}
            />
          </div>

          {/* 5 Fases del Pipeline */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
            {STATUS_FLOW.map(s => {
              const m = statusMeta[s];
              const Icon = m.icon;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-2xl border p-3 text-center transition-all ${
                    statusFilter === s
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs'
                      : 'border-gray-100 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600'
                  }`}
                >
                  <Icon className={`w-4 h-4 mx-auto ${m.color}`} />
                  <p className="text-lg font-black text-gray-900 dark:text-dark-100 mt-1">{counts[s] || 0}</p>
                  <p className="text-[10px] text-gray-500 dark:text-dark-400 font-semibold truncate mt-0.5">{m.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card motivacional */}
        <div className={`border-t border-gray-100 dark:border-dark-700 p-4 ${readyCount > 0 ? 'bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-transparent dark:from-emerald-900/20 dark:to-transparent' : 'bg-gray-50/50 dark:bg-dark-900/30'}`}>
          {readyCount > 0 ? (
            <p className="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
              <span>Tienes <strong>{readyCount} {readyCount === 1 ? 'contacto listo' : 'contactos listos'}</strong> para activar su membresía. ¡Contáctalos hoy para cerrar tus comisiones!</span>
            </p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-dark-400 flex items-center gap-2">
              <Target className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Agrega personas a tu lista y hazles seguimiento paso a paso con las guías de llamadas.</span>
            </p>
          )}
        </div>
      </div>

      {/* Barra de Acciones, Buscador y Filtros */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-sky-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-cyan-600/20 transition-all shrink-0"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showForm ? 'Cerrar formulario' : 'Agregar nuevo contacto'}</span>
          </button>

          {/* Filtros Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'PENDING', label: 'Pendientes' },
              { id: 'CONTACTED', label: 'Contactados' },
              { id: 'CALL_BACK', label: 'Por llamar' },
              { id: 'READY', label: '¡Listos!' },
              { id: 'REJECTED', label: 'Rechazados' },
            ].map(chip => (
              <button
                key={chip.id}
                onClick={() => setStatusFilter(chip.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  statusFilter === chip.id
                    ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-500/30'
                    : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-400 hover:bg-gray-200'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Buscador estilo WhatsApp */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar contacto por nombre, teléfono, WhatsApp o notas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Formulario para Crear */}
      {showForm && (
        <div className="rounded-3xl border border-cyan-200 dark:border-cyan-800 bg-white dark:bg-dark-800 p-5 sm:p-6 space-y-4 animate-fade-in shadow-xl shadow-cyan-500/5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100 dark:border-dark-700">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 text-white flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-dark-100">Registrar Nuevo Prospecto</p>
              <p className="text-xs text-gray-500 dark:text-dark-400">Añade a tu contacto para comenzar su proceso de seguimiento</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold">Nombre Completo *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Carlos Mendoza" />
            </div>
            <div>
              <Label className="text-xs font-bold">Contacto (Teléfono / WhatsApp / Instagram)</Label>
              <Input value={contactInfo} onChange={e => setContactInfo(e.target.value)} placeholder="+1 234 567 8900 o @usuario" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-bold">Notas o Contexto del Prospecto</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Interés en TikTok Shop, quiere trabajar en equipo..." />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={() => setShowForm(false)} className="rounded-xl text-xs">Cancelar</Button>
            <ButtonPrimary onClick={createContact} disabled={saving} className="flex-1 rounded-xl text-xs bg-cyan-600 hover:bg-cyan-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Guardar en CRM
            </ButtonPrimary>
          </div>
        </div>
      )}

      {/* Lista de Contactos */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>
      ) : filteredContacts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 p-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 flex items-center justify-center mb-3">
            <Users2 className="w-7 h-7 text-cyan-500" />
          </div>
          <p className="font-bold text-sm text-gray-900 dark:text-dark-100">No se encontraron prospectos</p>
          <p className="text-xs text-gray-500 dark:text-dark-400 mt-1 max-w-xs mx-auto">
            {search ? 'Intenta con otro término de búsqueda o limpia los filtros.' : 'Comienza agregando personas que conozcas para presentarles la oportunidad.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredContacts.map(c => {
            const m = statusMeta[c.status] || statusMeta.PENDING;
            const Icon = m.icon;
            const currentIdx = STATUS_FLOW.indexOf(c.status as any);

            // Detector de teléfono para WhatsApp directo
            const phoneDigits = c.contact?.replace(/\D/g, '') || '';
            const isPhone = phoneDigits.length >= 7;

            return (
              <div
                key={c.id}
                className={`rounded-3xl border bg-white dark:bg-dark-800 p-4 sm:p-5 transition-all flex flex-col justify-between gap-3.5 ${
                  c.status === 'READY'
                    ? 'border-emerald-300 dark:border-emerald-700 shadow-md shadow-emerald-500/10'
                    : c.status === 'REJECTED'
                    ? 'border-red-200 dark:border-red-900/40 opacity-70'
                    : 'border-gray-100 dark:border-dark-700 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 ${m.bg} ${m.color}`}>
                      {c.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-900 dark:text-dark-100 truncate">
                        {highlightMatch(c.name, search)}
                      </p>
                      {c.contact && (
                        <p className="text-xs text-gray-500 dark:text-dark-400 truncate flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-cyan-500" />
                          <span>{highlightMatch(c.contact, search)}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isPhone && (
                      <a
                        href={`https://wa.me/${phoneDigits}?text=${encodeURIComponent(`Hola ${c.name}, te escribo por la oportunidad de Círculo 1...`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => removeContact(c.id)}
                      className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {c.notes && (
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-dark-900/40 text-xs text-gray-600 dark:text-dark-300 font-normal">
                    {highlightMatch(c.notes, search)}
                  </div>
                )}

                {/* Pipeline de 1 Clic */}
                <div className="pt-2 border-t border-gray-100 dark:border-dark-700/60 flex items-center justify-between gap-1 flex-wrap">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estado:</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {STATUS_FLOW.map((s, i) => {
                      const sm = statusMeta[s];
                      const SIcon = sm.icon;
                      const isCurrent = c.status === s;
                      return (
                        <button
                          key={s}
                          onClick={() => setStatus(c.id, s)}
                          title={`Cambiar a ${sm.label}`}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            isCurrent
                              ? `${sm.bg} ${sm.color} ring-2 ${sm.ring}`
                              : 'bg-gray-100 dark:bg-dark-700 text-gray-400 hover:text-gray-700'
                          }`}
                        >
                          <SIcon className="w-2.5 h-2.5" />
                          <span>{sm.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
