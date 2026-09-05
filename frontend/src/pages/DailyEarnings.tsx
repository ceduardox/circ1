import { useEffect, useState } from 'react';
import { membershipApi } from '@/services/api';
import { PageHeader } from '@/components/ui';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';

export function DailyEarningsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any>({ rows: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const load = async (page = 1) => {
    try {
      const [s, h] = await Promise.all([membershipApi.dailySummary(), membershipApi.dailyHistory(page)]);
      setSummary(s.data);
      setHistory(h.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  const max = Math.max(...(summary?.last7 || []).map((x: any) => x.amount), 1);

  return (
    <div className="space-y-6">
      <PageHeader title="Ganancia diaria" subtitle="Historial de abonos por tu pack" icon={DollarSign} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-dark-800 rounded-2xl border p-4 flex items-center gap-3"><div className="p-2 rounded-xl bg-emerald-50"><DollarSign className="w-5 h-5 text-emerald-600" /></div><div><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold">${Number(summary?.total || 0).toFixed(2)}</p></div></div>
        <div className="bg-white dark:bg-dark-800 rounded-2xl border p-4 flex items-center gap-3"><div className="p-2 rounded-xl bg-blue-50"><TrendingUp className="w-5 h-5 text-blue-600" /></div><div><p className="text-xs text-gray-500">Hoy</p><p className="text-xl font-bold">${Number(summary?.today || 0).toFixed(2)} <span className="text-xs text-gray-400">{summary?.todayPercent || 0}%</span></p></div></div>
        <div className="bg-white dark:bg-dark-800 rounded-2xl border p-4 flex items-center gap-3"><div className="p-2 rounded-xl bg-amber-50"><Calendar className="w-5 h-5 text-amber-600" /></div><div><p className="text-xs text-gray-500">Días</p><p className="text-xl font-bold">{summary?.count || 0}</p></div></div>
      </div>
      <div className="bg-white dark:bg-dark-800 rounded-2xl border p-4">
        <p className="text-sm font-semibold mb-3">Últimos 30 días — Evolución (estilo Dow Jones)</p>
        {(() => {
          const rows = [...(history.rows || [])].reverse();
          const data = rows.length > 0 ? rows : [...(summary?.last7 || [])].reverse();
          if (data.length === 0) return <p className="text-sm text-gray-400">Sin datos aún</p>;
          let cum = 0;
          const points = data.map((d: any) => { cum += Number(d.amount); return { date: d.date, total: cum, amount: Number(d.amount) }; });
          const maxTotal = Math.max(...points.map(p => p.total), 1);
          const minTotal = Math.min(...points.map(p => p.total), 0);
          const W = 800, H = 180, padL = 40, padR = 10, padT = 10, padB = 25;
          const stepX = (W - padL - padR) / Math.max(points.length - 1, 1);
          const scaleY = (v: number) => H - padB - ((v - minTotal) / Math.max(maxTotal - minTotal, 1)) * (H - padT - padB);
          const pathArea = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${padL + i * stepX} ${scaleY(p.total)}`).join(' ') + ` L ${padL + (points.length - 1) * stepX} ${H - padB} L ${padL} ${H - padB} Z`;
          const pathLine = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${padL + i * stepX} ${scaleY(p.total)}`).join(' ');
          const hover = hoverIdx !== null ? points[hoverIdx] : null;
          return (
            <div>
              <div className="overflow-x-auto" onMouseLeave={() => setHoverIdx(null)}>
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[200px] min-w-[600px] touch-manipulation">
                  <defs>
                    <linearGradient id="dowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  {[0, 0.25, 0.5, 0.75, 1].map(t => {
                    const y = padT + t * (H - padT - padB);
                    const val = (maxTotal - t * (maxTotal - minTotal)).toFixed(2);
                    return <g key={t}><line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e5e7eb" strokeDasharray="3 3" /><text x={padL - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#9ca3af">${val}</text></g>;
                  })}
                  <path d={pathArea} fill="url(#dowGrad)" stroke="none" />
                  <path d={pathLine} fill="none" stroke="#6366f1" strokeWidth="2" />
                  {points.map((p, i) => (
                    <g key={i} onMouseEnter={() => setHoverIdx(i)} onTouchStart={() => setHoverIdx(i)} className="cursor-pointer">
                      <circle cx={padL + i * stepX} cy={scaleY(p.total)} r={hoverIdx === i ? 5 : 2.5} fill={hoverIdx === i ? "#4f46e5" : "#6366f1"} stroke="white" strokeWidth={hoverIdx === i ? 2 : 0} />
                      <rect x={padL + i * stepX - stepX/2} y={padT} width={stepX} height={H - padT - padB} fill="transparent" />
                    </g>
                  ))}
                  {points.map((p, i) => {
                    if (i % Math.ceil(points.length / 6) !== 0 && i !== points.length - 1) return null;
                    return <text key={i} x={padL + i * stepX} y={H - 8} textAnchor="middle" fontSize="9" fill="#9ca3af">{new Date(p.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</text>;
                  })}
                </svg>
              </div>
              {hover && (
                <div className="mt-2 flex items-center justify-center gap-3 text-xs bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl px-3 py-2">
                  <span className="font-medium">{new Date(hover.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="text-gray-300">•</span>
                  <span className="font-bold text-indigo-600">+${Number(hover.amount).toFixed(2)}</span>
                  <span className="text-gray-500">acumulado ${Number(hover.total).toFixed(2)}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-2 text-[11px] text-gray-500">
                <span>Crecimiento acumulado — total ${points[points.length - 1]?.total.toFixed(2)}</span>
                <span className="text-gray-300">•</span>
                <span>{points.length} días</span>
                <span className="text-gray-400">• toca un punto para ver detalle</span>
              </div>
            </div>
          );
        })()}
        {summary?.apps && summary.apps.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-medium text-gray-600 mb-2">Apps que generan este rendimiento</p>
            <div className="flex flex-wrap gap-2">
              {summary.apps.map((app: any, i: number) => (
                <a key={i} href={app.url || undefined} target={app.url ? "_blank" : undefined} rel={app.url ? "noopener noreferrer" : undefined} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${app.url ? 'bg-white hover:bg-emerald-50 border-gray-200 hover:border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                  {app.logo ? <img src={app.logo} alt={app.name} className="w-5 h-5 rounded-full object-cover" /> : <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700">{app.name[0]}</span>}
                  <span className="font-medium">{app.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="bg-white dark:bg-dark-800 rounded-2xl border overflow-hidden">
        <div className="p-4 border-b"><h3 className="font-semibold">Historial</h3></div>
        <div className="divide-y">
          {history.rows.length === 0 ? <p className="text-center py-8 text-gray-400">Sin ganancias aún</p> : history.rows.map((r: any) => {
            const breakdown: any[] = r.breakdown || [];
            return (
              <div key={r.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium">{new Date(r.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</p><p className="text-xs text-gray-500">{r.percent}% sobre ${Number(r.priceSnapshot).toFixed(2)}</p></div>
                  <span className="text-sm font-bold text-emerald-600">+${Number(r.amount).toFixed(2)}</span>
                </div>
                {breakdown.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {breakdown.map((b: any, i: number) => (
                      <span key={i} className="text-[11px] px-2 py-1 rounded-full bg-gray-50 dark:bg-dark-700 border flex items-center gap-1.5">
                        {b.logo ? <img src={b.logo} alt={b.name} className="w-4 h-4 rounded-full object-cover" /> : null}
                        {b.name}: <b>${Number(b.amount).toFixed(2)}</b> <span className="text-gray-400">{b.percent}%</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {history.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t">
            <button disabled={history.page <= 1} onClick={() => load(history.page - 1)} className="px-3 py-1 rounded border disabled:opacity-50">Anterior</button>
            <span className="text-sm">{history.page} / {history.totalPages}</span>
            <button disabled={history.page >= history.totalPages} onClick={() => load(history.page + 1)} className="px-3 py-1 rounded border disabled:opacity-50">Siguiente</button>
          </div>
        )}
      </div>
    </div>
  );
}
