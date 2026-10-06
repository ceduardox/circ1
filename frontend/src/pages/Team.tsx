import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Users, BookOpen, CalendarCheck, Sparkles, BadgePercent, ShoppingBag,
  TrendingUp, ChevronRight, Target, Calculator, DollarSign, ArrowRight,
  ShieldCheck, CheckCircle2, Flame, Users2, Zap, Play, Layers
} from 'lucide-react';
import { PageHeader } from '@/components/ui';
import { TeamContacts } from '@/components/team/TeamContacts';
import { TeamGuides } from '@/components/team/TeamGuides';
import { TeamCalendar } from '@/components/team/TeamCalendar';

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export function TeamPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'contacts';

  // Simulador de Equipo
  const [calcMembers, setCalcMembers] = useState<number>(5);
  const [calcSalesPerMember, setCalcSalesPerMember] = useState<number>(2);
  const [calcLicensePrice, setCalcLicensePrice] = useState<number>(1000);
  const [calcProductVolume, setCalcProductVolume] = useState<number>(500);

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // Cálculos de proyección
  const calcLicenseCommissions = calcMembers * calcSalesPerMember * (calcLicensePrice * 0.25);
  const calcProductCommissions = calcMembers * (calcProductVolume * 0.05); // 5% volumen indirecto de equipo
  const calcTotalMonthly = calcLicenseCommissions + calcProductCommissions;
  const calcAnnual = calcTotalMonthly * 12;

  const tabs = [
    { id: 'contacts', label: 'Mis Contactos CRM', icon: Users2, count: 'Prospectos', color: 'from-cyan-500 to-sky-600' },
    { id: 'guides', label: 'Guías y Guiones', icon: BookOpen, count: '5 Guiones', color: 'from-emerald-500 to-teal-600' },
    { id: 'calendar', label: 'Calendario Social', icon: CalendarCheck, count: 'Planificador', color: 'from-purple-500 to-fuchsia-600' },
    { id: 'strategy', label: 'Estrategia', icon: Target, count: 'Método', color: 'from-amber-500 to-orange-600' },
    { id: 'calculator', label: 'Calculadora', icon: Calculator, count: 'Simulador', color: 'from-blue-500 to-indigo-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Construir Equipo"
        subtitle="Expande tu red, administra tus prospectos, utiliza guiones de cierre y proyecta tus ganancias por comisiones indirectas."
        icon={Users}
      />

      {/* Hero con la Estrategia Principal */}
      <div className="relative overflow-hidden rounded-3xl text-white shadow-2xl border border-white/10 bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 p-6 sm:p-9">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold uppercase tracking-[.15em] text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Apalancamiento de Red · Círculo 1</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight">
              No pagues publicidad pagada. <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                Construye un equipo de afiliados.
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Cada persona que sumas a tu equipo invierte en su propia formación y vende productos. Tú ganas el <strong>25% por cada membresía</strong> y comisiones pasivas por sus ventas de TikTok Shop.
            </p>

            <div className="grid grid-cols-3 gap-2.5 pt-2">
              {[
                { n: '25%', l: 'Por cada licencia', icon: BadgePercent },
                { n: '+ Ventas', l: 'Comisiones de equipo', icon: ShoppingBag },
                { n: '$0', l: 'En costo de Ads', icon: TrendingUp },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.l} className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-3 text-center">
                    <Icon className="w-4 h-4 text-amber-300 mx-auto" />
                    <p className="text-lg font-black text-amber-300 mt-1">{s.n}</p>
                    <p className="text-[10px] uppercase tracking-wider text-emerald-200 mt-0.5">{s.l}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:w-80 shrink-0">
            <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                Tu Plan de Acción Diario
              </p>
              <div className="space-y-2.5">
                {[
                  { t: '1. Agrega prospectos al CRM', d: 'Lista de personas interesadas' },
                  { t: '2. Aplica los guiones', d: 'Llamadas en frío y en caliente' },
                  { t: '3. Publica contenido orgánico', d: '3 a 5 videos por semana' },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-400 text-emerald-950 text-[10px] font-black shrink-0 mt-0.5">
                      ✓
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">{s.t}</p>
                      <p className="text-[10px] text-emerald-200/70">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                    ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300'
                    : 'bg-gray-200/80 dark:bg-dark-700 text-gray-600 dark:text-dark-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido de Pestañas */}
      {currentTab === 'contacts' && <TeamContacts />}
      {currentTab === 'guides' && <TeamGuides />}
      {currentTab === 'calendar' && <TeamCalendar />}

      {/* ─── TAB 4: Estrategia del Negocio en Equipo ─── */}
      {currentTab === 'strategy' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center">
                <BadgePercent className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-gray-900 dark:text-dark-100">1. Comisión por Licencia</h3>
              <p className="text-xs text-gray-500 dark:text-dark-400 leading-relaxed">
                Cada vez que un miembro nuevo ingresa con tu link y abona su membresía de $500 o $1,000, recibes el 25% de forma inmediata a tu balance.
              </p>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-gray-900 dark:text-dark-100">2. Ventas de TikTok Shop</h3>
              <p className="text-xs text-gray-500 dark:text-dark-400 leading-relaxed">
                Tus afiliados reciben creadores de contenido que suben videos todos los días. Sus ventas suman comisiones pasivas directas a tu cuenta.
              </p>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-gray-900 dark:text-dark-100">3. Apalancamiento Infinito</h3>
              <p className="text-xs text-gray-500 dark:text-dark-400 leading-relaxed">
                En lugar de trabajar 10 horas solo, tienes un equipo de 10 personas trabajando 2 horas al día = 20 horas de producción diaria a tu favor.
              </p>
            </div>
          </div>

          {/* Comparativa Gráfica */}
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-base text-gray-900 dark:text-dark-100">¿Por qué construir equipo en Círculo 1?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-red-50/50 dark:bg-red-950/15 border border-red-200 dark:border-red-900/30 space-y-2">
                <p className="font-bold text-sm text-red-800 dark:text-red-300">❌ Comercio Electrónico Tradicional</p>
                <ul className="text-xs text-red-700/80 dark:text-red-300/80 space-y-1.5 list-disc list-inside leading-relaxed">
                  <li>Inversión de miles de dólares en inventario.</li>
                  <li>Riesgo constante de perder dinero en anuncios de Facebook/TikTok.</li>
                  <li>Lidiar con envíos, devoluciones y paqueterías.</li>
                  <li>Si tú te enfermas o paras, las ventas se detienen por completo.</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/15 border border-emerald-200 dark:border-emerald-900/30 space-y-2">
                <p className="font-bold text-sm text-emerald-800 dark:text-emerald-300">✅ Modelo de Equipo Círculo 1</p>
                <ul className="text-xs text-emerald-700/80 dark:text-emerald-300/80 space-y-1.5 list-disc list-inside leading-relaxed">
                  <li>Cero inversión en inventario ni costos logísticos.</li>
                  <li>Atracción de clientes 100% orgánica con videos virales y llamadas.</li>
                  <li>Cada miembro se apalanca en el software y la comunidad.</li>
                  <li>Ingresos pasivos continuos generados por las ventas de toda tu red.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: Calculadora de Equipo ─── */}
      {currentTab === 'calculator' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Controles de Simulación */}
            <div className="lg:col-span-6 bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm p-5 sm:p-6 space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 dark:border-dark-700">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-gray-900 dark:text-dark-100">Simulador de Ingresos por Equipo</h2>
                  <p className="text-xs text-gray-500 dark:text-dark-400">Proyecta cuánto ganarás al sumar y capacitar afiliados</p>
                </div>
              </div>

              {/* Slider 1: Miembros en tu red */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-700 dark:text-dark-300">👥 Afiliados Directos en tu Equipo</span>
                  <span className="font-black text-blue-600 dark:text-blue-400 text-sm bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-lg">
                    {calcMembers} personas
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={calcMembers}
                  onChange={e => setCalcMembers(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Slider 2: Licencias por miembro */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-700 dark:text-dark-300">📜 Licencias Vendidas al Mes por Miembro</span>
                  <span className="font-black text-cyan-600 dark:text-cyan-400 text-sm bg-cyan-50 dark:bg-cyan-900/30 px-2.5 py-0.5 rounded-lg">
                    {calcSalesPerMember} licencias/mes
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={calcSalesPerMember}
                  onChange={e => setCalcSalesPerMember(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Selector de Precio de Licencia */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-dark-300">🏷️ Tipo de Licencia Promedio</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Pack Estándar ($500)', val: 500 },
                    { label: 'Pack Élite ($1,000)', val: 1000 },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setCalcLicensePrice(opt.val)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        calcLicensePrice === opt.val
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-600 dark:text-dark-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pantalla de Resultados Proyectados */}
            <div className="lg:col-span-6 bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white rounded-3xl p-6 sm:p-7 border border-white/10 shadow-xl flex flex-col justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Potencial de Ganancia</span>
                </div>

                <div>
                  <p className="text-xs text-gray-400 font-medium">Ingreso Mensual Estimado por Equipo</p>
                  <p className="text-3xl sm:text-5xl font-black text-emerald-400 mt-1">
                    {fmt(calcTotalMonthly)} <span className="text-sm font-semibold text-gray-400">/ mes</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[11px] text-gray-400">Proyección Anual</p>
                    <p className="text-base font-bold text-cyan-300 mt-0.5">{fmt(calcAnnual)}/año</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[11px] text-gray-400">Licencias Totales</p>
                    <p className="text-base font-bold text-purple-300 mt-0.5">{calcMembers * calcSalesPerMember} licencias/mes</p>
                  </div>
                </div>
              </div>

              <div className="relative pt-4 border-t border-white/10 text-xs text-gray-300">
                <p className="font-semibold text-white mb-1">🚀 El poder de la duplicación:</p>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Con solo {calcMembers} personas activas vendiendo {calcSalesPerMember} licencias al mes, generas <strong>{fmt(calcTotalMonthly)}</strong> pasivos mientras cada uno construye su propio negocio.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
