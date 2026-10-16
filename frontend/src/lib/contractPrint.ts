const escapeHtml = (s: string) =>
  (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

// Abre una ventana imprimible (Imprimir → Guardar como PDF) del contrato firmado.
export function printContract(c: any): boolean {
  const w = window.open('', '_blank');
  if (!w) return false;
  const sig = c.signatureImage ? `<img src="${c.signatureImage}" style="max-height:120px" />` : '';
  const signedBy = c.signedName || c.userName || '';
  const date = c.signedAt ? new Date(c.signedAt).toLocaleString('es-ES') : '';
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(c.contract?.title || c.title || 'Contrato')}</title>
  <style>body{font-family:system-ui,Arial,sans-serif;color:#111;margin:40px;line-height:1.55}h1{font-size:20px;margin-bottom:8px}pre{white-space:pre-wrap;font-family:inherit;font-size:14px}hr{margin:24px 0;border:none;border-top:1px solid #ddd}.muted{color:#777;font-size:12px;word-break:break-all}</style></head><body>
  <h1>${escapeHtml(c.contract?.title || c.title || 'Contrato')}</h1>
  <pre>${escapeHtml(c.contract?.body || c.body || '')}</pre>
  <hr/>
  <p><strong>Firmado por:</strong> ${escapeHtml(signedBy)}</p>
  <p><strong>Fecha:</strong> ${date}</p>
  <div>${sig}</div>
  <p class="muted">Hash: ${c.contentHash || ''}</p>
  <script>window.onload=function(){window.print();};</script>
  </body></html>`);
  w.document.close();
  return true;
}
