import { useEffect, useState } from 'react';
import { FileSignature, Plus, Trash2, Pencil, Loader2, CheckCircle2, Clock, Download, X, Users, Send, Search, PenLine, Link2, Copy } from 'lucide-react';
import { adminContractsApi, adminApi } from '@/services/api';
import { Button, ButtonPrimary, Input, Label, PageHeader } from '@/components/ui';
import { ContractText } from '@/components/ui/ContractText';
import { SignaturePad } from '@/components/ui/SignaturePad';
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
  const [repFor, setRepFor] = useState<any>(null);
  const [repName, setRepName] = useState('');
  const [repImage, setRepImage] = useState<string | null>(null);
  const [repSigning, setRepSigning] = useState(false);
  const [linksFor, setLinksFor] = useState<any>(null);
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
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

  const doRepSign = async () => {
    if (!repFor) return;
    if (repName.trim().length < 3) { toast.error('Escribe el nombre del representante'); return; }
    if (!repImage) { toast.error('Dibuja la firma'); return; }
    setRepSigning(true);
    try {
      await adminContractsApi.repSign(repFor.id, { name: repName.trim(), signatureImage: repImage });
      toast.success('Firma registrada');
      setRepFor(null); setRepName(''); setRepImage(null);
      await load();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al firmar');
    } finally {
      setRepSigning(false);
    }
  };

  const reloadLinks = async (contractId: string) => {
    try {
      const { data } = await adminContractsApi.list();
      setContracts(data.contracts || []);
      setLinksFor((data.contracts || []).find((x: any) => x.id === contractId) || null);
    } catch { /* ignore */ }
  };

  const genLink = async () => {
    if (!linksFor) return;
    if (linkName.trim().length < 3) { toast.error('Escribe el nombre del representante'); return; }
    setLinkLoading(true);
    try {
      const { data } = await adminContractsApi.createRepInvite(linksFor.id, linkName.trim());
      setLinkUrl(data.url);
      toast.success('Link generado');
      await reloadLinks(linksFor.id);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al generar el link');
    } finally {
      setLinkLoading(false);
    }
  };

  const revokeLink = async (inviteId: string) => {
    if (!linksFor) return;
    try {
      await adminContractsApi.revokeRepInvite(linksFor.id, inviteId);
      toast.success('Link revocado');
      await reloadLinks(linksFor.id);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al revocar');
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copiado')).catch(() => toast.error('No se pudo copiar'));
  };

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
                        <Button size="sm" onClick={() => setViewSig({ ...s, contract: { title: c.title, body: c.body, createdAt: c.createdAt, repSignatures: c.repSignatures } })} className="border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300"><Download className="w-3.5 h-3.5" /> Ver firmado</Button>
                      </>
                    ) : (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Pendiente</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-gray-700 dark:text-dark-200">Firmas de RYZTOR:</span>
              {(c.repSignatures || []).length === 0 ? (
                <span className="text-[11px] text-gray-400">Sin firmar</span>
              ) : (
                (c.repSignatures || []).map((r: any, i: number) => (
                  <span key={i} className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="w-3 h-3" /> {r.name}</span>
                ))
              )}
              <Button size="sm" onClick={() => { setRepFor(c); setRepName(''); setRepImage(null); }} className="border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300"><PenLine className="w-3.5 h-3.5" /> Firmar (RYZTOR)</Button>
              <Button size="sm" onClick={() => { setLinksFor(c); setLinkName(''); setLinkUrl(''); }} className="border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300"><Link2 className="w-3.5 h-3.5" /> Links de firma</Button>
            </div>
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

      {/* Modal firmar representante de RYZTOR */}
      {repFor && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setRepFor(null)}>
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-100 dark:border-dark-700">
              <h3 className="font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2"><FileSignature className="w-4 h-4 text-primary-600" /> Firmar como representante</h3>
              <button onClick={() => setRepFor(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-800 dark:text-dark-100">Representante de RYZTOR</label>
                <div className="flex flex-wrap gap-2 mt-1 mb-2">
                  <button type="button" onClick={() => setRepName('Jhonatan Quiroga')} className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300 hover:bg-gray-50 dark:hover:bg-dark-700">Jhonatan Quiroga</button>
                  <button type="button" onClick={() => setRepName('Jose Eduardo Callau')} className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300 hover:bg-gray-50 dark:hover:bg-dark-700">Jose Eduardo Callau</button>
                </div>
                <Input value={repName} onChange={e => setRepName(e.target.value)} placeholder="Nombre del representante" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-800 dark:text-dark-100">Firma</label>
                <p className="text-xs text-gray-500 dark:text-dark-400 mb-1">Dibuja la firma del representante.</p>
                <SignaturePad onChange={setRepImage} />
              </div>
              <ButtonPrimary onClick={doRepSign} disabled={repSigning}>
                {repSigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSignature className="w-4 h-4" />} Firmar
              </ButtonPrimary>
            </div>
          </div>
        </div>
      )}

      {/* Modal links de firma */}
      {linksFor && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setLinksFor(null)}>
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-100 dark:border-dark-700">
              <h3 className="font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2"><Link2 className="w-4 h-4 text-primary-600" /> Links de firma — {linksFor.title}</h3>
              <button onClick={() => setLinksFor(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-800 dark:text-dark-100">Nuevo link para un representante</label>
                <div className="flex flex-wrap gap-2 mt-1 mb-2">
                  <button type="button" onClick={() => setLinkName('Jhonatan Quiroga')} className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300 hover:bg-gray-50 dark:hover:bg-dark-700">Jhonatan Quiroga</button>
                  <button type="button" onClick={() => setLinkName('Jose Eduardo Callau')} className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300 hover:bg-gray-50 dark:hover:bg-dark-700">Jose Eduardo Callau</button>
                </div>
                <div className="flex gap-2">
                  <Input value={linkName} onChange={e => setLinkName(e.target.value)} placeholder="Nombre del representante" />
                  <ButtonPrimary onClick={genLink} disabled={linkLoading}>{linkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />} Generar</ButtonPrimary>
                </div>
                {linkUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <input readOnly value={linkUrl} className="flex-1 min-w-0 text-xs px-2 py-2 rounded-lg border border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 text-gray-700 dark:text-dark-200" />
                    <Button size="sm" onClick={() => copyText(linkUrl)} className="border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300"><Copy className="w-3.5 h-3.5" /> Copiar</Button>
                  </div>
                )}
                <p className="text-[11px] text-gray-400 mt-1">El link es de un solo uso y vence en 7 días.</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-700 dark:text-dark-200 mb-2">Links generados</p>
                {(linksFor.repInvites || []).length === 0 ? (
                  <p className="text-xs text-gray-400">Aún no hay links.</p>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-dark-700 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
                    {(linksFor.repInvites || []).map((inv: any) => (
                      <div key={inv.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                        <span className={clsx('w-2 h-2 rounded-full shrink-0', inv.status === 'FIRMADO' ? 'bg-emerald-500' : 'bg-amber-400')} />
                        <span className="text-xs font-medium text-gray-800 dark:text-dark-100 flex-1 min-w-[100px]">{inv.name}</span>
                        <span className="text-[11px] text-gray-500 dark:text-dark-400">{inv.status === 'FIRMADO' ? 'Firmado' : `Expira ${new Date(inv.expiresAt).toLocaleDateString('es-ES')}`}</span>
                        {inv.status !== 'FIRMADO' && (
                          <>
                            <Button size="sm" onClick={() => copyText(`${window.location.origin}/firmar/${inv.token}`)} className="border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300"><Copy className="w-3.5 h-3.5" /> Copiar</Button>
                            <Button size="sm" onClick={() => revokeLink(inv.id)} className="border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400"><Trash2 className="w-3.5 h-3.5" /></Button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
