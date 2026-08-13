import { useState, useEffect, useCallback } from 'react';
import { Phone, Clock, CheckCircle2, XCircle, UserPlus, Trash2, Loader2, Plus, MessageCircle, TrendingUp, Target, Users2, Sparkles } from 'lucide-react';
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
  PENDING: { label: 'Pendiente', icon: UserPlus, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-dark-700', ring: 'ring-gray-300 dark:ring-dark-600' },
  CONTACTED: { label: 'Contactado', icon: MessageCircle, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', ring: 'ring-blue-300' },
  CALL_BACK: { label: 'Llamar después', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', ring: 'ring-amber-300' },
  READY: { label: '¡Listo!', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', ring: 'ring-emerald-300' },
  REJECTED: { label: 'Rechazó', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', ring: 'ring-red-300' },
};

export function TeamContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await teamApi.contacts();
      setContacts(data.contacts);
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
      toast.error('Escribe el nombre');
      return;
    }
    setSaving(true);
    try {
      await teamApi.createContact({ name: name.trim(), contact: contactInfo.trim() || null, notes: notes.trim() || null });
      toast.success('Contacto agregado');
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
      toast.error('No se pudo actualizar');
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

  return (
    <div className="space-y-5">
      {/* Panel resumen */}
      <div className="rounded-2xl border border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-800 overflow-hidden">
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Tu embudo de contactos
            </p>
            <span className="text-xs text-gray-500 dark:text-dark-400">{total} contactos · {progressPct}% avanzado</span>
          </div>
          <div className="h-2.5 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 via-amber-400 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {STATUS_FLOW.map(s => {
              const m = statusMeta[s];
              const Icon = m.icon;
              return (
                <div key={s} className="rounded-xl border border-gray-100 dark:border-dark-700 p-2.5 text-center">
                  <Icon className={`w-4 h-4 mx-auto ${m.color}`} />
                  <p className="text-lg font-black text-gray-900 dark:text-dark-100 mt-1">{counts[s] || 0}</p>
                  <p className="text-[9px] text-gray-500 dark:text-dark-400 leading-tight">{m.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card motivacional */}
        <div className={`border-t border-gray-100 dark:border-dark-700 p-4 ${readyCount > 0 ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10' : 'bg-gray-50/50 dark:bg-dark-700/30'}`}>
          {readyCount > 0 ? (
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              Tienes {readyCount} {readyCount === 1 ? 'contacto listo' : 'contactos listos'}. ¡Cierra esa licencia hoy! El equipo crece.
            </p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-dark-400 flex items-center gap-2">
              <Target className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              Agrega contactos y llévalos por el pipeline: contactar → cerrar.
            </p>
          )}
        </div>
      </div>

      {/* Botón agregar */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all hover:-translate-y-0.5"
      >
        <Plus className="w-5 h-5" />
        {showForm ? 'Cerrar formulario' : 'Agregar contacto'}
      </button>

      {/* Formulario */}
      {showForm && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-dark-800 p-5 space-y-4 animate-enter-up shadow-lg shadow-emerald-500/5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <p className="font-bold text-gray-900 dark:text-dark-100">Nuevo prospecto</p>
          </div>
          <div>
            <Label>Nombre *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la persona" />
          </div>
          <div>
            <Label>Contacto (teléfono / red social)</Label>
            <Input value={contactInfo} onChange={e => setContactInfo(e.target.value)} placeholder="WhatsApp, Instagram, TikTok..." />
          </div>
          <div>
            <Label>Notas</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Contexto, intereses, qué le ofrecerás..." />
          </div>
          <ButtonPrimary onClick={createContact} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Guardar contacto
          </ButtonPrimary>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center mb-4">
            <Users2 className="w-7 h-7 text-emerald-500" />
          </div>
          <p className="font-bold text-gray-900 dark:text-dark-100">Empieza tu lista</p>
          <p className="text-sm text-gray-500 dark:text-dark-400 mt-1 max-w-xs mx-auto leading-6">
            Escribe a quién vas a llamar para ofrecerle la membresía. <span className="font-semibold text-emerald-600 dark:text-emerald-400">Cada contacto es una comisión potencial.</span>
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-dark-500">
            <Phone className="w-3.5 h-3.5" /> Solo agrega y ve avanzando el estado
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {contacts.map(c => {
            const m = statusMeta[c.status];
            const Icon = m.icon;
            const currentIdx = STATUS_FLOW.indexOf(c.status as any);
            return (
              <div key={c.id} className={`rounded-2xl border bg-white dark:bg-dark-800 transition-all hover:shadow-md ${c.status === 'READY' ? 'border-emerald-300 dark:border-emerald-700 shadow-md shadow-emerald-500/5' : c.status === 'REJECTED' ? 'border-red-200 dark:border-red-900/40 opacity-70' : 'border-gray-100 dark:border-dark-700'}`}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.bg} ${m.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-dark-100 truncate">{c.name}</p>
                        {c.contact && <p className="text-xs text-gray-500 dark:text-dark-400 truncate flex items-center gap-1"><Phone className="w-3 h-3" /> {c.contact}</p>}
                        {c.notes && <p className="text-xs text-gray-400 dark:text-dark-500 mt-0.5 line-clamp-1">{c.notes}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${m.bg} ${m.color}`}>{m.label}</span>
                      <button onClick={() => removeContact(c.id)} className="text-gray-300 hover:text-red-500 dark:text-dark-600 dark:hover:text-red-400 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Pipeline de estados */}
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    {STATUS_FLOW.map((s, i) => {
                      const sm = statusMeta[s];
                      const SIcon = sm.icon;
                      const isCurrent = c.status === s;
                      const isDone = i < currentIdx;
                      return (
                        <button
                          key={s}
                          onClick={() => setStatus(c.id, s)}
                          title={sm.label}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                            isCurrent
                              ? `${sm.bg} ${sm.color} border-transparent shadow-sm ring-2 ${sm.ring}`
                              : isDone
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:scale-105'
                              : 'bg-gray-50 dark:bg-dark-700 text-gray-400 dark:text-dark-500 border-gray-200 dark:border-dark-600 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-gray-600'
                          }`}
                        >
                          <SIcon className="w-3 h-3" />
                          {sm.label}
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
