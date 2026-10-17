import { useEffect, useState } from 'react';
import { FileSignature, Plus, Trash2, Pencil, Loader2, CheckCircle2, Clock, Download, X, Users, Send, Search } from 'lucide-react';
import { adminContractsApi, adminApi } from '@/services/api';
import { Button, ButtonPrimary, Input, Label, PageHeader } from '@/components/ui';
import { ContractText } from '@/components/ui/ContractText';
import { useConfirm } from '@/components/ui/confirm';
import { printContract } from '@/lib/contractPrint';
import { toast } from 'sonner';
import { clsx } from 'clsx';

export function AdminContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', body: '' });
  const [submitting, setSubmitting] = useState(false);
  const [assignFor, setAssignFor] = useState<any>(null);
  const [userSearch, setUserSearch] = useState('');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [viewSig, setViewSig] = useState<any>(null);
  const confirm = useConfirm();

  const load = async () => {
    try {
      const { data } = await adminContractsApi.list();
      setContracts(data.contracts || []);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al cargar los contratos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) { toast.error('Título y contenido son obligatorios'); return; }
    setSubmitting(true);
    try {
      if (editing) {
        await adminContractsApi.update(editing.id, { title: form.title, body: form.body });
        toast.success('Contrato actualizado');
      } else {
        await adminContractsApi.create({ title: form.title, body: form.body });
        toast.success('Contrato creado');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ title: '', body: '' });
      await load();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (c: any) => {
    if (!(await confirm({ title: 'Eliminar contrato', message: `¿Eliminar "${c.title}"? Se borrarán también sus firmas.`, confirmText: 'Sí, eliminar' }))) return;
    try {
      await adminContractsApi.remove(c.id);
      toast.success('Contrato eliminado');
      await load();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al eliminar');
    }
  };

  const openAssign = async (c: any) => {
    setAssignFor(c);
    setSelectedIds([]);
    setUserSearch('');
    setUsersList([]);
    try {
      const { data } = await adminApi.users({ page: 1 });
      setUsersList(data.users || []);
    } catch { /* ignore */ }
  };

  const searchUsers = async (q: string) => {
    setUserSearch(q);
    try {
      const { data } = await adminApi.users({ search: q, page: 1 });
      setUsersList(data.users || []);
    } catch { /* ignore */ }
  };

  const toggleUser = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const doAssign = async () => {
    if (!assignFor || selectedIds.length === 0) { toast.error('Selecciona al menos un usuario'); return; }
    setAssigning(true);
    try {
      const { data } = await adminContractsApi.assign(assignFor.id, selectedIds);
      toast.success(`Asignado a ${data.assigned} usuario(s)${data.skipped ? ` · ${data.skipped} ya lo tenían` : ''}`);
      setAssignFor(null);
      await load();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al asignar');
    } finally {
      setAssigning(false);
    }
  };

  const signedCount = (c: any) => c.signatures.filter((s: any) => s.status === 'FIRMADO').length;

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Contratos" subtitle="Redacta contratos, asígnalos y revisa las firmas" icon={FileSignature} />

      <div className="flex justify-end">
        <ButtonPrimary size="sm" onClick={() => { setEditing(null); setForm({ title: '', body: '' }); setShowForm(v => !v); }}>
          <Plus className="w-4 h-4" /> Nuevo contrato
        </ButtonPrimary>
      </div>

      {showForm && (
        <form onSubmit={save} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-dark-100">{editing ? 'Editar contrato' : 'Nuevo contrato'}</h3>
          <div>
            <Label>Título</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ej. Contrato de Prestación de Servicios" />
          </div>
          <div>
            <Label>Contrato (pega el texto completo)</Label>
            <textarea
              value={form.body}
              onChange={e => setForm({ ...form, body: e.target.value })}
              rows={12}
              placeholder="Pega aquí el contrato con todos los detalles..."
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm text-gray-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Formato: <b>**negrita**</b> · <code>## Cláusula</code> (se numera sola) · <code>- </code> viñetas · <code>1. </code> listas. La <b>fecha del contrato</b> se pone automáticamente al crearlo.
            </p>
          </div>
          <div className="flex gap-2">
            <ButtonPrimary type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} {editing ? 'Guardar cambios' : 'Crear contrato'}
            </ButtonPrimary>
            <Button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300">Cancelar</Button>
          </div>
        </form>
      )}

      {contracts.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-dark-500"><FileSignature className="w-10 h-10 mx-auto mb-3 opacity-50" /><p className="text-sm">Aún no hay contratos.</p></div>
      ) : contracts.map(c => {
        const list = c.signatures || [];
        return (
          <div key={c.id} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0"><FileSignature className="w-5 h-5" /></div>
              <div className="flex-1 min-w-[160px]">
                <p className="text-sm font-semibold text-gray-900 dark:text-dark-100">{c.title}</p>
                <p className="text-xs text-gray-500 dark:text-dark-400">{new Date(c.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })} · {signedCount(c)}/{list.length} firmados</p>
              </div>
              <ButtonPrimary size="sm" onClick={() => openAssign(c)}><Send className="w-4 h-4" /> Asignar</ButtonPrimary>
              <Button size="sm" onClick={() => { setEditing(c); setForm({ title: c.title, body: c.body }); setShowForm(true); }} className="border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300" title="Editar (solo si nadie firmó)"><Pencil className="w-4 h-4" /></Button>
              <Button size="sm" onClick={() => remove(c)} className="border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400"><Trash2 className="w-4 h-4" /></Button>
            </div>

            {list.length > 0 && (
              <div className="mt-3 divide-y divide-gray-100 dark:divide-dark-700 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
                {list.map((s: any) => (
                  <div key={s.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                    <span className={clsx('w-2 h-2 rounded-full shrink-0', s.status === 'FIRMADO' ? 'bg-emerald-500' : 'bg-amber-400')} />
                    <span className="text-xs font-medium text-gray-800 dark:text-dark-100 flex-1 min-w-[120px] truncate">{s.user?.firstName || s.user?.username} {s.user?.lastName || ''} <span className="text-gray-400">@{s.user?.username}</span></span>
                    {s.status === 'FIRMADO' ? (
                      <>
                        <span className="text-[11px] text-gray-500 dark:text-dark-400 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {s.signedAt ? new Date(s.signedAt).toLocaleDateString('es-ES') : ''}</span>
                        <Button size="sm" onClick={() => setViewSig({ ...s, contract: { title: c.title, body: c.body, createdAt: c.createdAt } })} className="border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300"><Download className="w-3.5 h-3.5" /> Ver firmado</Button>
                      </>
                    ) : (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Pendiente</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Modal asignar */}
      {assignFor && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setAssignFor(null)}>
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-100 dark:border-dark-700">
              <h3 className="font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2"><Users className="w-4 h-4 text-primary-600" /> Asignar "{assignFor.title}"</h3>
              <button onClick={() => setAssignFor(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input value={userSearch} onChange={e => searchUsers(e.target.value)} placeholder="Buscar usuario..." className="pl-9" />
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-dark-700 rounded-xl border border-gray-100 dark:border-dark-700">
                {usersList.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-6">Sin usuarios.</p>
                ) : usersList.map((u: any) => {
                  const on = selectedIds.includes(u.id);
                  return (
                    <button key={u.id} type="button" onClick={() => toggleUser(u.id)} className={clsx('w-full flex items-center gap-3 px-3 py-2.5 text-left', on ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-dark-700')}>
                      <span className={clsx('w-4 h-4 rounded border flex items-center justify-center shrink-0', on ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-300 dark:border-dark-600')}>{on && <CheckCircle2 className="w-3 h-3" />}</span>
                      <span className="flex-1 min-w-0 text-sm text-gray-800 dark:text-dark-100 truncate">{u.firstName} {u.lastName} <span className="text-gray-400">@{u.username}</span></span>
                      <span className="text-[11px] text-gray-400 truncate">{u.email}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between gap-2 mt-4">
                <span className="text-xs text-gray-500 dark:text-dark-400">{selectedIds.length} seleccionado(s)</span>
                <ButtonPrimary onClick={doAssign} disabled={assigning || selectedIds.length === 0}>
                  {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Asignar
                </ButtonPrimary>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal ver firmado */}
      {viewSig && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setViewSig(null)}>
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-100 dark:border-dark-700">
              <h3 className="font-bold text-gray-900 dark:text-dark-100">{viewSig.contract.title}</h3>
              <button onClick={() => setViewSig(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 max-h-[45vh] overflow-y-auto">
              <p className="text-xs text-gray-500 dark:text-dark-400 mb-3">Fecha del contrato: {viewSig.contract.createdAt ? new Date(viewSig.contract.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}</p>
              <ContractText text={viewSig.contract.body} />
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-dark-700 space-y-2">
              <p className="text-xs text-gray-500 dark:text-dark-400">Firmado por <b className="text-gray-700 dark:text-dark-200">{viewSig.signedName}</b> el {viewSig.signedAt ? new Date(viewSig.signedAt).toLocaleString('es-ES') : ''}</p>
              <p className="text-[10px] text-gray-400">IP: {viewSig.ip || '-'}</p>
              {viewSig.signatureImage && <img src={viewSig.signatureImage} alt="firma" className="max-h-24 bg-white rounded-lg border border-gray-200 dark:border-dark-600" />}
              <p className="text-[10px] text-gray-400 break-all">Hash: {viewSig.contentHash}</p>
              <ButtonPrimary size="sm" onClick={() => { if (!printContract({ ...viewSig, contract: viewSig.contract })) toast.error('Permite ventanas emergentes'); }}><Download className="w-4 h-4" /> Descargar PDF</ButtonPrimary>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
