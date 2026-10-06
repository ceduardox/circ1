import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useProgramStore } from '@/store/programStore';
import { programApi } from '@/services/api';
import {
  ChevronLeft, CheckCircle, BookOpen, Clock, Target, Flame, Sparkles,
  Award, Trophy, Zap, Shield, Snowflake, ArrowRight, Play, CheckCircle2,
  Lock, Search, X, Filter, BarChart, ChevronRight, Star, RefreshCw,
  HelpCircle, Check
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { PageHeader } from '@/components/ui';
import { toast } from 'sonner';

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

const levelTitles: Record<number, string> = {
  1: 'Iniciado · Círculo 1',
  2: 'Constructor de Hábitos',
  3: 'Mente Imparable',
  4: 'Líder en Crecimiento',
  5: 'Estratega de Élite',
  6: 'Maestro del Enfoque',
  7: 'Referente Visionario',
  8: 'Emprendedor de Impacto',
  9: 'Pilar del Círculo',
  10: 'Leyenda Círculo 1',
};

export function ProgressPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';
  const navigate = useNavigate();

  const { progress, reflections, fetchProgress } = useProgramStore();
  const [programData, setProgramData] = useState<any>(null);
  const [daysData, setDaysData] = useState<any[]>([]);
  const [achievementsData, setAchievementsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [freezing, setFreezing] = useState(false);

  // Buscador y filtros de días
  const [daySearch, setDaySearch] = useState('');
  const [dayFilter, setDayFilter] = useState<'ALL' | 'COMPLETED' | 'UNLOCKED' | 'LOCKED'>('ALL');

  // Buscador de reflexiones
  const [reflectionSearch, setReflectionSearch] = useState('');
  const [reflectionTypeFilter, setReflectionTypeFilter] = useState<string>('ALL');

  useEffect(() => {
    load();
  }, []);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [progRes, daysRes, achRes] = await Promise.all([
        programApi.progress(),
        programApi.getDays(),
        programApi.achievements().catch(() => ({ data: { achievements: [] } })),
      ]);
      setProgramData(progRes.data);
      setDaysData(daysRes.data.days || []);
      setAchievementsData(achRes.data?.achievements || []);
      await fetchProgress();
    } catch (e: any) {
      if (!silent) toast.error('Error al sincronizar tu progreso');
    } finally {
      setLoading(false);
    }
  };

  const handleUseFreeze = async () => {
    setFreezing(true);
    try {
      const res = await programApi.useFreeze();
      if (res.data?.error) {
        toast.error(res.data.error);
      } else {
        toast.success(res.data?.message || '¡Streak Freeze aplicado con éxito!');
        await load(true);
      }
    } catch (e: any) {
      toast.error('No se pudo aplicar el freeze');
    } finally {
      setFreezing(false);
    }
  };

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // Cálculos de estadísticas
  const validProgress = progress.filter(p => p.dayId && p.day && p.content);
  const completedContents = validProgress.filter(p => p.status === 'COMPLETED').length;
  const pendingContents = validProgress.filter(p => p.status === 'PENDING').length;
  const totalDays = daysData.length;
  const completedDays = daysData.filter(d => d.isCompleted).length;
  const currentUnlockedDay = daysData.find(d => d.isUnlocked && !d.isCompleted) || daysData[daysData.length - 1];

  const overallProgress = programData?.overallProgress ?? (daysData.length > 0 ? Math.round((completedDays / daysData.length) * 100) : 0);
  const streak = programData?.streak ?? 0;
  const streakFreezes = programData?.streakFreezes ?? 0;
  const points = programData?.points ?? (completedContents * 10 + completedDays * 5);
  const level = programData?.level ?? Math.min(100, Math.floor(points / 100) + 1);
  const levelName = levelTitles[Math.min(level, 10)] || `Nivel ${level} Pro`;

  // Filtrado de días
  const filteredDays = daysData.filter(d => {
    const term = daySearch.toLowerCase().trim();
    const matchesSearch = term === '' ||
      d.title?.toLowerCase().includes(term) ||
      `día ${d.dayNumber}`.includes(term) ||
      d.description?.toLowerCase().includes(term);

    const matchesFilter =
      dayFilter === 'ALL' ||
      (dayFilter === 'COMPLETED' && d.isCompleted) ||
      (dayFilter === 'UNLOCKED' && d.isUnlocked && !d.isCompleted) ||
      (dayFilter === 'LOCKED' && !d.isUnlocked);

    return matchesSearch && matchesFilter;
  });

  // Filtrado de reflexiones
  const allReflections = programData?.reflections || reflections || [];
  const filteredReflections = allReflections.filter((r: any) => {
    const term = reflectionSearch.toLowerCase().trim();
    const matchesSearch = term === '' ||
      r.content?.toLowerCase().includes(term) ||
      r.reflectionType?.toLowerCase().includes(term);

    const matchesType = reflectionTypeFilter === 'ALL' || r.reflectionType === reflectionTypeFilter;
    return matchesSearch && matchesType;
  });

  const uniqueReflectionTypes: string[] = ['ALL', ...Array.from(new Set<string>(allReflections.map((r: any) => String(r.reflectionType || 'GENERAL'))))];

  const tabs = [
    { id: 'overview', label: 'Mi Nivel & Resumen', icon: BarChart, count: `Nivel ${level}`, color: 'from-blue-500 to-indigo-600' },
    { id: 'days', label: 'Días del Programa', icon: BookOpen, count: `${completedDays}/${totalDays}`, color: 'from-violet-500 to-purple-600' },
    { id: 'achievements', label: 'Logros & Medallas', icon: Award, count: `${achievementsData.filter(a => a.unlocked).length || 3}`, color: 'from-amber-500 to-yellow-600' },
    { id: 'reflections', label: 'Mis Reflexiones', icon: Target, count: String(allReflections.length), color: 'from-emerald-500 to-teal-600' },
    { id: 'stats', label: 'Racha & Hábitos', icon: Flame, count: `${streak}d 🔥`, color: 'from-rose-500 to-orange-500' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-3 border-blue-500/20 border-t-blue-500 animate-spin" />
          <BarChart className="w-5 h-5 absolute inset-0 m-auto text-blue-500 animate-pulse" />
        </div>
        <p className="text-sm font-medium text-gray-500 dark:text-dark-400">Cargando tu progreso y logros...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Progreso y Entrenamiento"
        subtitle="Monitorea tu evolución diaria, racha de constancia, ejercicios completados y reflexiones personales."
        icon={BarChart}
      />

      {/* Hero Gamificado de Nivel & Racha */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white p-5 sm:p-7 border border-white/10 shadow-xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-violet-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-violet-600/30 to-purple-600/30 border border-violet-500/30 text-xs font-bold text-violet-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Nivel {level} · {levelName}</span>
              </div>

              {streak > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-xs font-bold text-orange-300">
                  <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                  <span>{streak} días de racha activa</span>
                </div>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Tu viaje de transformación <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">Día a Día</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-300 mt-1 leading-relaxed">
                Has completado <strong>{completedDays} de {totalDays} días</strong> del programa ({overallProgress}% del recorrido total).
              </p>
            </div>

            {/* Barra de Progreso Global */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-semibold text-gray-400">
                <span>Progreso Total del Programa</span>
                <span className="text-white font-bold">{overallProgress}%</span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5 backdrop-blur-xs">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500 rounded-full transition-all duration-700 shadow-sm shadow-violet-500/50"
                  style={{ width: `${Math.max(overallProgress, 4)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="flex flex-wrap sm:flex-nowrap lg:flex-col gap-2.5 shrink-0">
            {currentUnlockedDay && (
              <button
                onClick={() => navigate(`/dashboard`)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-black shadow-lg shadow-purple-600/30 transition-all active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Continuar Día {currentUnlockedDay.dayNumber}</span>
              </button>
            )}

            <button
              onClick={() => load(false)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold backdrop-blur transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sincronizar Progreso</span>
            </button>
          </div>
        </div>

        {/* 4 Métricas Integradas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <p className="text-[11px] text-gray-400 font-medium">Días Completados</p>
            <p className="text-base sm:text-xl font-black text-emerald-400 mt-0.5">{completedDays} / {totalDays}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <p className="text-[11px] text-gray-400 font-medium">Ejercicios Realizados</p>
            <p className="text-base sm:text-xl font-black text-blue-400 mt-0.5">{completedContents} listos</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <p className="text-[11px] text-gray-400 font-medium">Puntos de Experiencia</p>
            <p className="text-base sm:text-xl font-black text-amber-300 mt-0.5">{points} XP</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <p className="text-[11px] text-gray-400 font-medium">Reflexiones Escritas</p>
            <p className="text-base sm:text-xl font-black text-purple-300 mt-0.5">{allReflections.length} notas</p>
          </div>
        </div>
      </div>

      {/* Sticky Tab Navigation (Touch Scrollable) */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-gray-50/90 dark:bg-dark-900/90 backdrop-blur-md border-y border-gray-200/60 dark:border-dark-700/60">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                  active
                    ? 'bg-white dark:bg-dark-800 text-gray-900 dark:text-white shadow-md shadow-black/5 ring-1 ring-black/5 dark:ring-white/10'
                    : 'text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-dark-800/50'
                }`}
              >
                <div className={`w-5 h-5 rounded-lg bg-gradient-to-br ${tab.color} text-white flex items-center justify-center shrink-0 shadow-xs`}>
                  <Icon className="w-3 h-3 text-white" />
                </div>
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  active
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-200/80 dark:bg-dark-700 text-gray-600 dark:text-dark-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── TAB 1: Mi Nivel & Resumen ─── */}
      {currentTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Card de Desglose de Hábitos y Contenidos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Módulo Mental</p>
                  <p className="text-lg font-black text-gray-900 dark:text-dark-100">
                    {programData?.stats?.mentalCount ?? completedContents} ejercicios
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-dark-400">
                Reprogramación de creencias y mindset de abundancia.
              </p>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Evaluaciones & Quizzes</p>
                  <p className="text-lg font-black text-gray-900 dark:text-dark-100">
                    {programData?.stats?.quizCount ?? Math.floor(completedContents / 2)} completados
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-dark-400">
                Validación de conceptos y aprendizajes clave.
              </p>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center font-bold">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Retos de Confianza</p>
                  <p className="text-lg font-black text-gray-900 dark:text-dark-100">
                    {programData?.stats?.confidenceCount ?? completedDays} ejecutados
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-dark-400">
                Acciones reales para salir de tu zona de confort.
              </p>
            </div>
          </div>

          {/* Recorrido de los últimos días */}
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-dark-700">
              <div>
                <h2 className="font-bold text-base sm:text-lg text-gray-900 dark:text-dark-100 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-violet-600" />
                  <span>Resumen del Recorrido</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                  Visualiza rápidamente el estado de tus lecciones
                </p>
              </div>

              <button
                onClick={() => setTab('days')}
                className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Ver todos los {totalDays} días</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {daysData.slice(0, 6).map(day => (
                <div
                  key={day.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    day.isCompleted
                      ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/40 dark:bg-emerald-950/15'
                      : day.isUnlocked
                      ? 'border-violet-200 dark:border-violet-800/50 bg-violet-50/40 dark:bg-violet-950/15 ring-1 ring-violet-500/20'
                      : 'border-gray-100 dark:border-dark-700 bg-gray-50/40 dark:bg-dark-900/30 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-gray-500 dark:text-dark-400">Día #{day.dayNumber}</span>
                    {day.isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" /> Listo
                      </span>
                    ) : day.isUnlocked ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                        <Play className="w-2.5 h-2.5 fill-current" /> En Curso
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 dark:bg-dark-700 text-gray-600 dark:text-dark-400">
                        <Lock className="w-2.5 h-2.5" /> Bloqueado
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-dark-100 truncate">{day.title}</p>
                  <p className="text-[11px] text-gray-500 dark:text-dark-400 mt-1">
                    {day.completedRequired} de {day.totalRequired} obligatorios
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: Días del Programa ─── */}
      {currentTab === 'days' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-dark-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-base sm:text-lg text-gray-900 dark:text-dark-100 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-violet-600" />
                  <span>Todos los Días del Entrenamiento</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                  Explora cada jornada de formación, tareas obligatorias y material complementario
                </p>
              </div>

              {/* Filtros */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
                {[
                  { id: 'ALL', label: 'Todos' },
                  { id: 'COMPLETED', label: 'Completados' },
                  { id: 'UNLOCKED', label: 'Desbloqueados' },
                  { id: 'LOCKED', label: 'Bloqueados' },
                ].map(chip => (
                  <button
                    key={chip.id}
                    onClick={() => setDayFilter(chip.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      dayFilter === chip.id
                        ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 ring-1 ring-violet-500/30'
                        : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-400 hover:bg-gray-200'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Buscador de Días */}
            <div className="p-4 bg-gray-50/50 dark:bg-dark-900/30 border-b border-gray-100 dark:border-dark-700">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar día por título, tema o número de día..."
                  value={daySearch}
                  onChange={e => setDaySearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                />
                {daySearch && (
                  <button
                    onClick={() => setDaySearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Lista de Días */}
            <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDays.map(day => (
                <div
                  key={day.id}
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 ${
                    day.isCompleted
                      ? 'border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-950/10 shadow-xs'
                      : day.isUnlocked
                      ? 'border-violet-200 dark:border-violet-800/40 bg-white dark:bg-dark-800 shadow-sm ring-1 ring-violet-500/20'
                      : 'border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-900/20 opacity-60'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                        Día #{day.dayNumber}
                      </span>

                      {day.isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> Completado
                        </span>
                      ) : day.isUnlocked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400">
                          <Play className="w-2.5 h-2.5 fill-current" /> Desbloqueado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-200 dark:bg-dark-700 text-gray-600 dark:text-dark-400">
                          <Lock className="w-2.5 h-2.5" /> Bloqueado
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-dark-100">
                      {highlightMatch(day.title, daySearch)}
                    </h3>

                    {day.description && (
                      <p className="text-xs text-gray-500 dark:text-dark-400 line-clamp-2">
                        {highlightMatch(day.description, daySearch)}
                      </p>
                    )}

                    {/* Lista de Contenidos */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {day.contents?.map((c: any) => {
                        const isDone = day.completedContentIds?.includes(c.id);
                        return (
                          <span
                            key={c.id}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 ${
                              isDone
                                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                                : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-400'
                            }`}
                          >
                            <span className="truncate max-w-[120px]">{c.title}</span>
                            {isDone && <Check className="w-2.5 h-2.5 text-emerald-600" />}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-dark-700/60 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">
                      {day.completedRequired} / {day.totalRequired} obligatorios
                    </span>

                    {day.isUnlocked ? (
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
                      >
                        <span>Entrar a lección</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Completa el día anterior
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: Logros & Medallas ─── */}
      {currentTab === 'achievements' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-dark-700">
              <div>
                <h2 className="font-bold text-base sm:text-lg text-gray-900 dark:text-dark-100 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>Insignias de Maestría y Medallas</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                  Completa retos y mantén tu constancia para desbloquear medallas exclusivas
                </p>
              </div>

              <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs font-bold">
                {points} XP Acumulados
              </div>
            </div>

            {/* Grid de Medallas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: 'Primer Paso', desc: 'Completa tu primer día de entrenamiento', icon: CheckCircle, unlocked: completedDays >= 1, tier: 'Bronce' },
                { title: 'Constancia de Fuego', desc: 'Alcanza una racha de 3 días consecutivos', icon: Flame, unlocked: streak >= 3, tier: 'Plata' },
                { title: 'Mente Imparable', desc: 'Completa 10 ejercicios de reprogramación mental', icon: Zap, unlocked: completedContents >= 10, tier: 'Oro' },
                { title: 'Filósofo del Círculo', desc: 'Escribe al menos 5 reflexiones personales', icon: Target, unlocked: allReflections.length >= 5, tier: 'Plata' },
                { title: 'Hábito de Hierro', desc: 'Alcanza una racha de 7 días sin fallar', icon: Shield, unlocked: streak >= 7, tier: 'Diamante' },
                { title: 'Graduado Círculo 1', desc: 'Completa todos los días del programa', icon: Trophy, unlocked: completedDays >= totalDays && totalDays > 0, tier: 'Élite' },
              ].map((ach, i) => {
                const Icon = ach.icon;
                return (
                  <div
                    key={i}
                    className={`p-5 rounded-3xl border transition-all flex items-start gap-4 ${
                      ach.unlocked
                        ? 'border-amber-200 dark:border-amber-800/40 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30 dark:from-dark-800 dark:via-dark-800 dark:to-dark-750 shadow-xs'
                        : 'border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-900/30 opacity-60'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                      ach.unlocked
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/30'
                        : 'bg-gray-300 dark:bg-dark-700 text-gray-500'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-dark-100 truncate">{ach.title}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          ach.unlocked
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                            : 'bg-gray-200 dark:bg-dark-700 text-gray-500'
                        }`}>
                          {ach.tier}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">{ach.desc}</p>
                      <p className={`text-[11px] font-bold mt-2 ${ach.unlocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                        {ach.unlocked ? '✨ Desbloqueado' : '🔒 En progreso'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: Mis Reflexiones ─── */}
      {currentTab === 'reflections' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-dark-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-base sm:text-lg text-gray-900 dark:text-dark-100 flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-600" />
                  <span>Diario de Reflexiones y Aprendizajes</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                  Tus pensamientos, compromisos y conclusiones guardados durante el programa
                </p>
              </div>

              {/* Filtros de Tipo de Reflexión */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
                {uniqueReflectionTypes.map(t => (
                  <button
                    key={t}
                    onClick={() => setReflectionTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all ${
                      reflectionTypeFilter === t
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30'
                        : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-400 hover:bg-gray-200'
                    }`}
                  >
                    {t === 'ALL' ? 'Todas' : t.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Buscador de Reflexiones */}
            <div className="p-4 bg-gray-50/50 dark:bg-dark-900/30 border-b border-gray-100 dark:border-dark-700">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar en tus reflexiones por palabra clave..."
                  value={reflectionSearch}
                  onChange={e => setReflectionSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                {reflectionSearch && (
                  <button
                    onClick={() => setReflectionSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Feed de Reflexiones */}
            {filteredReflections.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                <Target className="w-10 h-10 text-gray-300 dark:text-dark-600 mx-auto mb-2" />
                <p className="font-semibold text-gray-700 dark:text-dark-300">No hay reflexiones registradas</p>
                <p className="text-xs text-gray-400 mt-1">Al responder las preguntas del día tus reflexiones se guardarán aquí.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-dark-700">
                {filteredReflections.map((r: any) => (
                  <div key={r.id} className="p-5 space-y-2 hover:bg-gray-50/60 dark:hover:bg-dark-750 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        {r.reflectionType?.toLowerCase()}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: es })}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-800 dark:text-dark-200 leading-relaxed font-normal whitespace-pre-wrap">
                      {highlightMatch(r.content, reflectionSearch)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 5: Racha & Hábitos ─── */}
      {currentTab === 'stats' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Card de Racha Activa */}
            <div className="lg:col-span-6 bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white rounded-3xl p-6 sm:p-7 border border-white/10 shadow-xl space-y-6 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 text-white flex items-center justify-center">
                  <Flame className="w-7 h-7 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Racha de Constancia</h3>
                  <p className="text-xs text-gray-400">Mantén el fuego encendido completando al menos 1 día de entrenamiento al día</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-medium">Días Activos Consecutivos</p>
                <p className="text-4xl sm:text-5xl font-black text-orange-400 mt-1">
                  {streak} <span className="text-lg font-semibold text-gray-300">días seguidos</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Snowflake className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-gray-200">Streak Freezes Disponibles</span>
                  </div>
                  <span className="text-xs font-black text-cyan-300 bg-cyan-500/20 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                    {streakFreezes} protectores
                  </span>
                </div>

                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Los Streak Freezes te permiten proteger tu racha en caso de que tengas un día ocupado y no puedas conectarte.
                </p>

                {programData?.freezableGap && streakFreezes > 0 && (
                  <button
                    onClick={handleUseFreeze}
                    disabled={freezing}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-black text-xs font-bold transition-all disabled:opacity-50"
                  >
                    <Snowflake className="w-3.5 h-3.5" />
                    <span>{freezing ? 'Aplicando...' : 'Aplicar Streak Freeze Ahora'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Resumen de Hábitos */}
            <div className="lg:col-span-6 bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 dark:border-dark-700">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 text-white flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-dark-100">Estadísticas de Hábitos</h3>
                  <p className="text-xs text-gray-500 dark:text-dark-400">Desglose de actividad en la plataforma</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-700 dark:text-dark-300">Días Completados</span>
                    <span className="text-violet-600 dark:text-violet-400 font-bold">{completedDays} / {totalDays}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-600 rounded-full" style={{ width: `${totalDays > 0 ? (completedDays / totalDays) * 100 : 0}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-700 dark:text-dark-300">Ejercicios Realizados</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">{completedContents}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(completedContents * 5, 100)}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-700 dark:text-dark-300">Reflexiones Escritas</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{allReflections.length}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${Math.min(allReflections.length * 10, 100)}%` }} />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 text-xs text-orange-900 dark:text-orange-200 leading-relaxed">
                🚀 Cada día de entrenamiento suma <strong>+10 XP</strong> y cada día completo desbloquea <strong>+5 XP</strong> extra para subir de nivel.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}