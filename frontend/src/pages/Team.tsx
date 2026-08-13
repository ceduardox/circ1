import { useState } from 'react';
import { Users, BookOpen, CalendarCheck, Sparkles, BadgePercent, ShoppingBag, TrendingUp, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/ui';
import { TeamContacts } from '@/components/team/TeamContacts';
import { TeamGuides } from '@/components/team/TeamGuides';
import { TeamCalendar } from '@/components/team/TeamCalendar';

type Tab = 'contacts' | 'guides' | 'calendar';

const tabs: { id: Tab; label: string; icon: any; desc: string }[] = [
  { id: 'contacts', label: 'Mis Contactos', icon: Users, desc: 'Tu lista de prospectos' },
  { id: 'guides', label: 'Guías', icon: BookOpen, desc: 'Cómo vender y hablar' },
  { id: 'calendar', label: 'Contenido Social', icon: CalendarCheck, desc: 'Sube videos, atrae clientes' },
];

export function TeamPage() {
  const [tab, setTab] = useState<Tab>('contacts');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Construir Equipo"
        subtitle="Suma gente, gana comisiones. Ellos pagan su publicidad, tú cobras."
        icon={Users}
      />

      {/* Hero con la estrategia */}
      <div className="relative overflow-hidden rounded-3xl text-white shadow-2xl shadow-emerald-600/20">
        <div className="absolute inset-0">
          <img src="/images/vip-pro/redes.jpg" alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/95 via-teal-800/90 to-cyan-900/80" />
        </div>
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 animate-gradient-x" />

        <div className="relative p-6 sm:p-9">
          <div className="flex flex-col lg:flex-row lg:items-center gap-7">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-[11px] font-bold uppercase tracking-[.2em] text-emerald-200 mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                La estrategia del equipo
              </div>
              <h2 className="text-2xl sm:text-4xl font-black leading-tight">
                No pagues publicidad. <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200">Construye equipo.</span>
              </h2>
              <p className="mt-3 text-sm sm:text-base text-emerald-100/90 max-w-lg leading-6">
                Cada persona que sumas paga su propia publicidad y vende. Tú ganas por cada licencia y por cada venta. <span className="font-bold text-white">El equipo es tu motor.</span>
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2.5 max-w-md">
                {[
                  { n: '25%', l: 'por licencia', icon: BadgePercent },
                  { n: '+', l: 'por cada venta', icon: ShoppingBag },
                  { n: '$0', l: 'en publicidad', icon: TrendingUp },
                ].map(s => {
                  const Icon = s.icon;
                  return (
                    <div key={s.l} className="rounded-2xl bg-white/10 backdrop-blur border border-white/20 px-3 py-3 text-center">
                      <Icon className="w-4 h-4 text-amber-300 mx-auto" />
                      <p className="text-xl font-black text-amber-300 mt-1">{s.n}</p>
                      <p className="text-[10px] uppercase tracking-wider text-emerald-100 mt-0.5">{s.l}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:w-72 shrink-0">
              <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/20 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">Tu próximo paso</p>
                <div className="mt-3 space-y-2.5">
                  {[
                    { t: 'Agrega contactos', d: 'A quién vas a hablar' },
                    { t: 'Sigue las guías', d: 'Llamada fría y caliente' },
                    { t: 'Sube contenido', d: 'El cliente viene a ti' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-emerald-950 text-xs font-black shrink-0 mt-0.5">{i + 1}</span>
                      <div>
                        <p className="text-sm font-bold text-white leading-tight">{s.t}</p>
                        <p className="text-[11px] text-emerald-100/80">{s.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`group relative flex items-center gap-3 rounded-2xl border p-4 text-left transition-all overflow-hidden ${
                active
                  ? 'border-transparent bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:-translate-y-0.5 hover:shadow-md'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${active ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-dark-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className={`font-semibold text-sm ${active ? 'text-white' : 'text-gray-900 dark:text-dark-100'}`}>{t.label}</p>
                <p className={`text-xs truncate ${active ? 'text-emerald-100' : 'text-gray-500 dark:text-dark-400'}`}>{t.desc}</p>
              </div>
              <ChevronRight
                className={`w-5 h-5 shrink-0 transition-colors ${
                  active
                    ? 'text-white animate-arrow-nudge'
                    : 'text-gray-300 dark:text-dark-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 animate-arrow-nudge'
                }`}
              />
              {active && <span className="ml-auto w-1.5 h-8 rounded-full bg-amber-300 animate-pulse" />}
            </button>
          );
        })}
      </div>

      {tab === 'contacts' && <TeamContacts />}
      {tab === 'guides' && <TeamGuides />}
      {tab === 'calendar' && <TeamCalendar />}
    </div>
  );
}
