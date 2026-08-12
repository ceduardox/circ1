import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, Brain, Check, ChevronDown, Compass, Flame,
  Menu, Network, ShieldCheck, Sparkles, Target,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const steps = [
  { icon: Compass, number: '01', title: 'Claridad', text: 'Reconoce dónde estás, qué deseas y qué patrones están dirigiendo hoy tus decisiones.' },
  { icon: Brain, number: '02', title: 'Reprogramación', text: 'Entrena una respuesta mental más consciente frente al miedo, la duda y la frustración.' },
  { icon: Flame, number: '03', title: 'Acción', text: 'Convierte intención en disciplina, hábitos y decisiones alineadas con tus objetivos.' },
  { icon: BarChart3, number: '04', title: 'Expansión', text: 'Aplica tu crecimiento personal para liderar mejor y escalar tu negocio con propósito.' },
];

const faqs = [
  ['¿Necesito tener un negocio para comenzar?', 'No. Puedes comenzar si ya tienes un negocio o si estás desarrollando la mentalidad, claridad y disciplina necesarias para construirlo.'],
  ['¿Cuánto tiempo necesito cada día?', 'El programa está pensado para avanzar a tu ritmo. La prioridad es realizar cada ejercicio con intención y aplicar lo aprendido.'],
  ['¿Puedo usar Círculo 1 desde mi celular?', 'Sí. La plataforma se adapta a celular y computadora, y guarda el progreso directamente en tu cuenta.'],
  ['¿Cómo avanzo dentro del programa?', 'Completarás una ruta progresiva de ejercicios, reflexiones y contenidos. Cada etapa prepara la siguiente para construir un cambio sostenible.'],
];

export function LandingPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const primaryPath = isAuthenticated ? '/dashboard' : '/register';
  const primaryLabel = isAuthenticated ? 'Ir a mi programa' : 'Comenzar mi proceso';

  return (
    <div className="min-h-screen bg-[#f7f0e4] text-[#0a0d29]">
      <header className="sticky top-0 z-50 border-b border-[#17172a]/10 bg-[#f7f0e4]/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12" aria-label="Navegación principal">
          <Link to="/" className="flex items-center gap-3" aria-label="Círculo 1, inicio">
            <img src="/images/logo.png" alt="Círculo 1" className="h-10 w-auto" />
          </Link>

          <div className="hidden items-center gap-9 text-sm font-semibold lg:flex">
            <a href="#programa" className="transition hover:text-[#392099]">Programa</a>
            <a href="#resultados" className="transition hover:text-[#392099]">Resultados</a>
            <a href="#comunidad" className="transition hover:text-[#392099]">Comunidad</a>
            <a href="#preguntas" className="transition hover:text-[#392099]">Preguntas</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {!isAuthenticated && <Link to="/login" className="hidden px-3 py-3 text-sm font-semibold hover:text-[#392099] sm:block">Ingresar</Link>}
            <Link to={primaryPath} className="rounded-xl bg-[#ff5149] px-4 py-3 text-xs font-bold text-white shadow-lg shadow-[#ff5149]/20 transition hover:-translate-y-0.5 hover:bg-[#f13f3b] sm:px-6 sm:text-sm">{isAuthenticated ? 'Mi programa' : 'Comenzar'}</Link>
            <details className="relative lg:hidden">
              <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center" aria-label="Abrir menú"><Menu className="h-7 w-7" /></summary>
              <div className="absolute right-0 top-14 w-56 rounded-2xl border border-black/10 bg-[#fffaf1] p-3 shadow-2xl">
                {['programa', 'resultados', 'comunidad', 'preguntas'].map((item) => <a key={item} href={`#${item}`} className="block rounded-xl px-4 py-3 text-sm font-semibold capitalize hover:bg-[#efe5d5]">{item}</a>)}
                {!isAuthenticated && <Link to="/login" className="block rounded-xl px-4 py-3 text-sm font-semibold text-[#392099] hover:bg-[#efe5d5]">Iniciar sesión</Link>}
              </div>
            </details>
          </div>
        </nav>
      </header>

      <main>
        <section className="overflow-hidden border-b border-[#17172a]/20 px-4 pb-5 pt-8 sm:px-7 sm:pb-8 lg:px-10 lg:pt-10">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-8 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[.28em] text-[#392099]"><Sparkles className="h-4 w-4" /> Neuroentrenamiento</div>
                <p className="text-3xl font-bold leading-tight sm:text-4xl">Deja de sobrevivir en automático.</p>
                <h1 className="mt-1 max-w-5xl text-[3.4rem] uppercase leading-[.9] tracking-[-.025em] text-[#26106b] sm:text-[5rem] lg:text-[6.3rem]" style={{ fontFamily: 'Impact, Haettenschweiler, Arial Narrow Bold, sans-serif' }}>Empieza a dirigir tu vida.</h1>
                <p className="mt-5 max-w-2xl text-sm font-medium leading-7 text-[#454450] sm:text-base">Entrena claridad, disciplina y ejecución con un sistema diseñado para convertir intención en progreso real.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:pb-2">
                <Link to={primaryPath} className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#ff5149] px-7 py-4 text-sm font-bold text-white shadow-xl shadow-[#ff5149]/20 transition hover:-translate-y-0.5 hover:bg-[#f13f3b]">{primaryLabel}<ArrowRight className="h-4 w-4" /></Link>
              </div>
            </div>

            <div className="relative overflow-hidden bg-[#1c1672] shadow-[0_24px_70px_rgba(35,16,107,.18)] lg:min-h-[590px]">
              <div className="relative h-[420px] overflow-hidden sm:h-[520px] lg:absolute lg:inset-y-0 lg:left-0 lg:right-[190px] lg:h-auto">
                <img src="/images/landing/hero.webp" alt="Persona avanzando hacia una nueva etapa" className="h-full w-full object-cover object-center" fetchPriority="high" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0a0d29]/15 via-transparent to-[#26106b]/25" />
                <div className="pointer-events-none absolute -left-28 top-0 hidden h-[125%] w-48 -skew-x-[18deg] bg-[#f7f0e4] lg:block" />
                <div className="pointer-events-none absolute -right-16 top-0 hidden h-[125%] w-32 -skew-x-[18deg] bg-[#4b2db5] lg:block" />
              </div>

              <aside className="relative grid grid-cols-3 bg-gradient-to-b from-[#32178f] to-[#1b0c61] text-white lg:absolute lg:inset-y-0 lg:right-0 lg:flex lg:w-[210px] lg:flex-col lg:justify-center lg:gap-14 lg:pl-10 lg:pr-6">
                {[{icon:Target,label:'Método probado'},{icon:BarChart3,label:'Progreso visible'},{icon:Network,label:'Comunidad activa'}].map(({icon: Icon,label}) => <div key={label} className="flex flex-col items-center gap-2 border-white/10 px-2 py-5 text-center text-[10px] font-semibold sm:text-xs lg:items-start lg:border-0 lg:p-0 lg:text-left"><Icon className="h-6 w-6 text-[#a894ff] lg:h-8 lg:w-8" /><span>{label}</span></div>)}
              </aside>

              <div className="relative grid grid-cols-3 bg-[#fffaf1] text-[#0a0d29] lg:absolute lg:bottom-0 lg:left-[7%] lg:right-[210px] lg:max-w-[700px] lg:[clip-path:polygon(4%_0,100%_0,96%_100%,0_100%)]">
                {[['01','Claridad'],['02','Acción'],['03','Expansión']].map(([number,label], index) => <div key={number} className={`px-4 py-4 sm:px-7 sm:py-5 ${index < 2 ? 'border-r border-[#17172a]/15' : ''}`}><strong className="block text-lg text-[#392099] sm:text-xl">{number}</strong><span className="mt-1 block text-xs font-bold sm:text-sm">{label}</span></div>)}
              </div>
            </div>
          </div>
        </section>

        <section id="programa" className="px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1340px]">
            <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
              <div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#ff5149]">El método Círculo 1</p><h2 className="mt-4 text-4xl font-black leading-tight sm:text-6xl">No acumules información. <span className="text-[#392099]">Entrena transformación.</span></h2></div>
              <div className="lg:pl-16"><p className="max-w-xl text-lg leading-8 text-[#52515c]">Una ruta progresiva que te ayuda a conocerte, romper patrones y convertir nuevas decisiones en resultados sostenibles.</p><div className="mt-6 flex items-start gap-4 border-l-2 border-[#ff5149] pl-5"><span className="text-5xl font-black leading-none text-[#392099]">“</span><p className="font-bold leading-7">Tu siguiente nivel necesita una versión más entrenada de ti.</p></div></div>
            </div>

            <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {steps.map(({ icon: Icon, number, title, text }) => <article key={title} className="group border border-[#17172a]/15 bg-[#fffaf1] p-6 transition hover:-translate-y-1 hover:border-[#392099]"><div className="flex items-center justify-between"><Icon className="h-7 w-7 text-[#392099]" /><span className="text-4xl font-black text-[#d8ccbd]">{number}</span></div><h3 className="mt-8 text-xl font-black">{title}</h3><p className="mt-3 text-sm leading-6 text-[#62616a]">{text}</p></article>)}
            </div>
          </div>
        </section>

        <section aria-label="El proceso Círculo 1" className="px-5 pb-24 sm:px-8 lg:px-12 lg:pb-32">
          <div className="mx-auto grid max-w-[1340px] gap-5 lg:grid-cols-[1.15fr_.85fr]">
            <figure className="group relative min-h-[420px] overflow-hidden bg-[#171049] sm:min-h-[560px]">
              <img
                src="/images/landing/claridad.webp"
                alt="Claridad para definir una nueva dirección"
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
                loading="lazy"
              />
              <figcaption className="absolute bottom-0 left-0 bg-[#fffaf1] px-6 py-4 text-[#0a0d29] sm:px-8">
                <span className="mr-3 text-lg font-black text-[#392099]">01</span>
                <span className="text-sm font-bold uppercase tracking-[.18em]">Claridad</span>
              </figcaption>
            </figure>

            <figure className="group relative min-h-[420px] overflow-hidden bg-[#171049] sm:min-h-[560px]">
              <img
                src="/images/landing/metodo.webp"
                alt="Acción para construir progreso real"
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
                loading="lazy"
              />
              <figcaption className="absolute bottom-0 left-0 bg-[#2b1590] px-6 py-4 text-white sm:px-8">
                <span className="mr-3 text-lg font-black text-[#ff766f]">02</span>
                <span className="text-sm font-bold uppercase tracking-[.18em]">Acción</span>
              </figcaption>
            </figure>
          </div>
        </section>

        <section id="resultados" className="bg-[#0b0e2d] px-5 py-24 text-white sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1340px] gap-14 lg:grid-cols-2 lg:items-center">
            <div className="relative"><div className="absolute -left-4 -top-4 h-28 w-28 bg-[#ff5149]" /><img src="/images/landing/transformacion.webp" alt="Proceso de transformación personal" className="relative aspect-[4/3] w-full object-cover" loading="lazy" /><div className="absolute -bottom-5 right-5 bg-[#f7f0e4] px-5 py-3 text-sm font-bold uppercase tracking-[.15em] text-[#392099] shadow-xl">03 Expansión</div></div>
            <div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#ff6c65]">Dentro de la plataforma</p><h2 className="mt-4 text-4xl font-black leading-tight sm:text-6xl">Un sistema para avanzar, no otra colección de videos.</h2><p className="mt-6 max-w-xl text-base leading-8 text-slate-300">Cada contenido tiene una intención: ayudarte a observar, responder, actuar y medir tu evolución personal.</p><div className="mt-9 grid gap-4 sm:grid-cols-2">{['Ruta diaria de neuroentrenamiento','Ejercicios guiados de reflexión','Videos y desafíos prácticos','Seguimiento visible del progreso','Contenido paso a paso','Acceso móvil y en computadora'].map((text) => <div key={text} className="flex items-start gap-3 text-sm"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ff5149]"><Check className="h-3 w-3" /></span>{text}</div>)}</div></div>
          </div>
        </section>

        <section id="comunidad" className="px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1340px] gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#ff5149]">Crecer acompañado cambia todo</p><h2 className="mt-4 text-4xl font-black leading-tight sm:text-6xl">Avanza dentro de un círculo que también eligió crecer.</h2><p className="mt-6 max-w-xl text-lg leading-8 text-[#565560]">Conecta tu proceso personal con una comunidad orientada a la acción, el progreso y el desarrollo de nuevas posibilidades.</p><div className="mt-8 space-y-4">{['Comparte avances y aprendizajes','Construye una red con propósito','Mantén el enfoque en tu siguiente nivel'].map((text) => <div key={text} className="flex items-center gap-3 font-bold"><ShieldCheck className="h-5 w-5 text-[#392099]" />{text}</div>)}</div></div>
            <div className="relative"><div className="absolute -bottom-5 -right-5 h-full w-full border-2 border-[#392099]" /><img src="/images/landing/comunidad.webp" alt="Comunidad de crecimiento Círculo 1" className="relative aspect-square w-full object-cover" loading="lazy" /></div>
          </div>
        </section>

        <section className="bg-[#2b1590] px-5 py-20 text-white sm:px-8 lg:px-12">
          <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-9 text-center lg:flex-row lg:text-left"><div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#ff8b83]">Tu cambio comienza con una decisión</p><h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">Conviértete en la persona capaz de crear los resultados que hoy imaginas.</h2></div><Link to={primaryPath} className="inline-flex shrink-0 items-center gap-3 rounded-xl bg-[#ff5149] px-7 py-4 text-sm font-bold shadow-xl transition hover:-translate-y-0.5 hover:bg-[#f13f3b]">{primaryLabel}<ArrowRight className="h-4 w-4" /></Link></div>
        </section>

        <section id="preguntas" className="px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto max-w-4xl"><div className="text-center"><p className="text-xs font-bold uppercase tracking-[.25em] text-[#ff5149]">Resolvemos tus dudas</p><h2 className="mt-4 text-4xl font-black sm:text-5xl">Preguntas frecuentes</h2></div><div className="mt-12 divide-y divide-[#17172a]/20 border-y border-[#17172a]/20">{faqs.map(([question,answer]) => <details key={question} className="group"><summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-base font-bold sm:text-lg">{question}<ChevronDown className="h-5 w-5 shrink-0 text-[#392099] transition group-open:rotate-180" /></summary><p className="max-w-3xl pb-7 text-sm leading-7 text-[#5c5b64] sm:text-base">{answer}</p></details>)}</div></div>
        </section>
      </main>

      <footer className="border-t border-[#17172a]/20 px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-[1340px] flex-col items-center justify-between gap-4 text-center text-xs text-[#62616a] sm:flex-row"><div className="flex items-center gap-2 font-bold text-[#0a0d29]"><span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#090d2b]"><img src="/images/favicon.png" alt="Círculo 1" className="w-full h-full object-cover" /></span>Círculo 1</div><p>Neuroentrenamiento para crecer desde adentro hacia afuera.</p>{!isAuthenticated && <Link to="/login" className="font-semibold hover:text-[#392099]">Acceso para miembros</Link>}</div></footer>
    </div>
  );
}
