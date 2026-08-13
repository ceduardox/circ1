import { useState, useEffect, useCallback, useMemo } from 'react';
import { CalendarCheck, Instagram, Music2, Facebook, Loader2, Flame, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Video, TrendingUp, Target } from 'lucide-react';
import { teamApi } from '@/services/api';
import { toast } from 'sonner';

interface Post {
  id: string;
  platform?: string | null;
  date: string;
  posted: boolean;
  note?: string | null;
}

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'from-pink-500 to-purple-600' },
  { id: 'tiktok', label: 'TikTok', icon: Music2, color: 'from-gray-800 to-gray-950' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'from-blue-600 to-indigo-700' },
];

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function TeamCalendar() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState('tiktok');
  const [monthOffset, setMonthOffset] = useState(0);

  const now = new Date();
  const viewYear = now.getFullYear();
  const viewMonth = now.getMonth() + monthOffset;

  const load = useCallback(async () => {
    try {
      const { data } = await teamApi.social();
      setPosts(data.posts);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const postMap = useMemo(() => {
    const map: Record<string, Post> = {};
    for (const p of posts) {
      const key = p.date.slice(0, 10);
      map[key] = p;
    }
    return map;
  }, [posts]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const postedInMonth = posts.filter(p => {
    const d = new Date(p.date);
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear && p.posted;
  }).length;

  const postedThisWeek = (() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return posts.filter(p => p.posted && new Date(p.date) >= weekAgo).length;
  })();

  const toggleDay = async (day: number) => {
    const date = new Date(viewYear, viewMonth, day, 12, 0, 0);
    const iso = date.toISOString();
    const existing = postMap[iso.slice(0, 10)];
    try {
      if (existing?.posted) {
        await teamApi.deleteSocial(iso);
        setPosts(posts.filter(p => p.date.slice(0, 10) !== iso.slice(0, 10)));
      } else {
        const { data } = await teamApi.saveSocial({ date: iso, platform, posted: true });
        setPosts(prev => [...prev.filter(p => p.date.slice(0, 10) !== iso.slice(0, 10)), data.post]);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'No se pudo guardar');
    }
  };

  const isToday = (day: number) => {
    const t = new Date();
    return monthOffset === 0 && t.getDate() === day;
  };

  const feedback = useMemo(() => {
    const pct = Math.min(100, Math.round((postedThisWeek / 5) * 100));
    if (postedThisWeek >= 5) {
      return { icon: Flame, color: 'text-orange-500', bg: 'from-orange-500/10 to-amber-500/10 border-orange-300 dark:border-orange-700', title: '¡Imparable!', msg: `${postedThisWeek} videos esta semana. Así es como los clientes llegan solos.`, bar: 'from-orange-500 to-amber-400', pct: 100 };
    }
    if (postedThisWeek >= 3) {
      return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'from-emerald-500/10 to-teal-500/10 border-emerald-300 dark:border-emerald-700', title: 'Bien hecho', msg: `${postedThisWeek} videos esta semana. Sigue, la constancia trae clientes.`, bar: 'from-emerald-500 to-teal-400', pct };
    }
    return { icon: AlertTriangle, color: 'text-amber-600', bg: 'from-amber-500/10 to-yellow-500/10 border-amber-300 dark:border-amber-700', title: 'Vas lento', msg: `${postedThisWeek} video${postedThisWeek === 1 ? '' : 's'} esta semana. La meta es 3-5. Sube tu contenido hoy.`, bar: 'from-amber-500 to-yellow-400', pct };
  }, [postedThisWeek]);

  const FeedbackIcon = feedback.icon;

  return (
    <div className="space-y-5">
      {/* Hero de estrategia social */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-800 p-5">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br from-pink-200/40 to-purple-200/40 dark:from-pink-900/20 dark:to-purple-900/20 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5" />
              El cliente viene a ti
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-dark-300 leading-6">
              Cuando subes videos de tu progreso o del panel, la gente pregunta <em className="font-semibold text-gray-900 dark:text-dark-100">"¿cómo lo hiciste?"</em>. Esa es la forma más fácil de vender la membresía. <span className="font-bold text-purple-700 dark:text-purple-300">Meta: 3-5 videos por semana.</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 shrink-0">
            <div className="rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 px-4 py-2.5 text-center">
              <p className="text-xl font-black text-purple-700 dark:text-purple-300">3-5</p>
              <p className="text-[10px] text-purple-600 dark:text-purple-400">videos/semana</p>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-2.5 text-center">
              <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">$1000</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400">por cliente que llega</p>
            </div>
          </div>
        </div>
      </div>

      {/* Plataforma */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-dark-500 mb-2">Elige tu red principal</p>
        <div className="grid grid-cols-3 gap-2.5">
          {PLATFORMS.map(p => {
            const Icon = p.icon;
            const active = platform === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border p-4 transition-all ${
                  active
                    ? `border-transparent bg-gradient-to-br ${p.color} text-white shadow-lg scale-[1.02]`
                    : 'border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-600 dark:text-dark-300 hover:border-purple-300 dark:hover:border-purple-700 hover:-translate-y-0.5'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-bold">{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback semanal con barra */}
      <div className={`rounded-2xl border bg-gradient-to-r p-4 ${feedback.bg}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-white dark:bg-dark-800 flex items-center justify-center shrink-0 shadow-sm`}>
            <FeedbackIcon className={`w-5 h-5 ${feedback.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className={`font-bold text-sm ${feedback.color}`}>{feedback.title}</p>
              <span className={`text-xs font-black ${feedback.color}`}>{postedThisWeek}/5</span>
            </div>
            <div className="h-2 bg-white/60 dark:bg-dark-700 rounded-full overflow-hidden mt-1.5">
              <div className={`h-full rounded-full bg-gradient-to-r ${feedback.bar} transition-all duration-500`} style={{ width: `${feedback.pct}%` }} />
            </div>
            <p className="text-xs text-gray-600 dark:text-dark-300 mt-1.5 leading-5">{feedback.msg}</p>
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="rounded-2xl border border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white dark:from-dark-800 dark:to-dark-800">
          <button onClick={() => setMonthOffset(o => o - 1)} className="p-2 rounded-lg hover:bg-white dark:hover:bg-dark-700 text-gray-500 dark:text-dark-300 transition-colors" aria-label="Mes anterior">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <p className="font-black text-gray-900 dark:text-dark-100">{MONTHS[((viewMonth % 12) + 12) % 12]} {viewYear}</p>
            <p className="text-[11px] text-gray-400 dark:text-dark-500 flex items-center justify-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" />
              {postedInMonth} videos este mes
            </p>
          </div>
          <button onClick={() => setMonthOffset(o => o + 1)} className="p-2 rounded-lg hover:bg-white dark:hover:bg-dark-700 text-gray-500 dark:text-dark-300 transition-colors" aria-label="Mes siguiente">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-7 gap-1 mb-1.5">
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-bold text-gray-400 dark:text-dark-500 uppercase">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {days.map(day => {
              const date = new Date(viewYear, viewMonth, day, 12, 0, 0);
              const iso = date.toISOString().slice(0, 10);
              const post = postMap[iso];
              const isPosted = !!post?.posted;
              const today = isToday(day);
              const past = date < new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
              return (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-sm font-semibold transition-all border ${
                    isPosted
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-transparent shadow-md shadow-emerald-500/20 scale-[1.02]'
                      : today
                      ? 'border-primary-400 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 ring-2 ring-primary-300/50'
                      : past
                      ? 'border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 text-gray-400 dark:text-dark-500 hover:border-emerald-300 dark:hover:border-emerald-700 hover:scale-105'
                      : 'border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-600 dark:text-dark-300 hover:border-emerald-300 dark:hover:border-emerald-700 hover:scale-105'
                  }`}
                >
                  <span>{day}</span>
                  {isPosted && <CalendarCheck className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 pb-4 flex items-center gap-4 text-[11px] text-gray-500 dark:text-dark-400 flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gradient-to-br from-emerald-500 to-teal-600 inline-block" /> Subiste video</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-gray-300 dark:border-dark-600 inline-block" /> No subiste</span>
          <span className="flex items-center gap-1.5"><Target className="w-3 h-3 text-purple-500" /> Toca un día para marcar</span>
        </div>
      </div>

      {loading && <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>}
    </div>
  );
}
