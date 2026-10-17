import { markdownToHtml } from './markdown';

const escapeHtml = (s: string) =>
  (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

const fmtDate = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

// Abre una ventana imprimible (Imprimir → Guardar como PDF) del contrato firmado.
export function printContract(c: any): boolean {
  const w = window.open('', '_blank');
  if (!w) return false;

  const title = c.contract?.title || c.title || 'Contrato';
  const body = c.contract?.body || c.body || '';
  const contractDate = fmtDate(c.contract?.createdAt || c.contractDate);
  const signedBy = c.signedName || c.userName || '';
  const signedDate = c.signedAt ? new Date(c.signedAt).toLocaleString('es-ES') : '';
  const sig = c.signatureImage ? `<img src="${c.signatureImage}" style="max-height:120px" />` : '';

  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
  <style>
    body{font-family:system-ui,Arial,sans-serif;color:#111;margin:40px;line-height:1.55}
    h1{font-size:20px;margin:0 0 4px}
    .date{color:#666;font-size:12px;margin-bottom:16px}
    .contract-md h3.clause{font-size:15px;font-weight:700;margin:14px 0 4px}
    .contract-md h4.heading{font-size:14px;font-weight:700;margin:12px 0 4px}
    .contract-md p{margin:6px 0}
    .contract-md ul{list-style:disc;padding-left:22px;margin:6px 0}
    .contract-md ol{list-style:decimal;padding-left:22px;margin:6px 0}
    .contract-md li{margin:2px 0}
    .contract-md strong{font-weight:700}
    hr{margin:24px 0;border:none;border-top:1px solid #ddd}
    .muted{color:#777;font-size:12px;word-break:break-all}
  </style></head><body>
  <h1>${escapeHtml(title)}</h1>
  ${contractDate ? `<div class="date">Fecha del contrato: ${contractDate}</div>` : ''}
  <div class="contract-md">${markdownToHtml(body)}</div>
  <hr/>
  <p><strong>Firmado por:</strong> ${escapeHtml(signedBy)}</p>
  ${signedDate ? `<p><strong>Fecha de firma:</strong> ${signedDate}</p>` : ''}
  <div>${sig}</div>
  <p class="muted">Hash: ${c.contentHash || ''}</p>
  <script>window.onload=function(){window.print();};</script>
  </body></html>`);
  w.document.close();
  return true;
}
