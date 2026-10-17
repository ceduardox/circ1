// Render de Markdown mínimo para contratos (seguro: escapa HTML y solo añade etiquetas propias).
// Soporta: **negrita**, "# Título", "## Cláusula" (se numera sola), "- viñeta", "1. lista".
const esc = (s: string) =>
  s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

const inline = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

export function markdownToHtml(text: string): string {
  const lines = (text || '').replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let clause = 0;
  let list: 'ul' | 'ol' | null = null;
  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) { closeList(); continue; }

    let m: RegExpMatchArray | null;
    if ((m = line.match(/^##\s+(.*)$/))) {
      closeList();
      clause += 1;
      out.push(`<h3 class="clause">${clause}. ${inline(m[1])}</h3>`);
    } else if ((m = line.match(/^#\s+(.*)$/))) {
      closeList();
      out.push(`<h4 class="heading">${inline(m[1])}</h4>`);
    } else if ((m = line.match(/^[-*]\s+(.*)$/))) {
      if (list !== 'ul') { closeList(); out.push('<ul>'); list = 'ul'; }
      out.push(`<li>${inline(m[1])}</li>`);
    } else if ((m = line.match(/^\d+[.)]\s+(.*)$/))) {
      if (list !== 'ol') { closeList(); out.push('<ol>'); list = 'ol'; }
      out.push(`<li>${inline(m[1])}</li>`);
    } else {
      closeList();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList();
  return out.join('\n');
}
