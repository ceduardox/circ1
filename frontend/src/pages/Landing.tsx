import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, Brain, CalendarDays, Check, ChevronDown, Compass, Flame,
  Menu, ShieldCheck, Sparkles, Star, Target, Users,
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
    <div className="min-h-screen bg-[#faf7f2] text-[#0a0d29]">
      <header className="absolute inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5 lg:px-12">
        <nav className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between rounded-2xl border border-white/80 bg-white/95 px-4 shadow-[0_18px_45px_rgba(31,20,79,.10)] backdrop-blur-xl sm:h-[86px] sm:px-7 lg:px-12" aria-label="Navegación principal">
          <Link to="/" className="flex items-center gap-3" aria-label="Círculo 1, inicio">
            <img src="/images/logo.png" alt="Círculo 1" className="h-9 w-auto sm:h-12" />
          </Link>

          <div className="hidden items-center gap-9 text-sm font-semibold lg:flex">
            <a href="#programa" className="transition hover:text-[#392099]">Programa</a>
            <a href="#resultados" className="transition hover:text-[#392099]">Resultados</a>
            <a href="#comunidad" className="transition hover:text-[#392099]">Comunidad</a>
            <a href="#preguntas" className="transition hover:text-[#392099]">Preguntas</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {!isAuthenticated && <Link to="/login" className="hidden px-3 py-3 text-sm font-semibold hover:text-[#392099] sm:block">Ingresar</Link>}
            <Link to={primaryPath} className="rounded-xl bg-[#ff6259] px-4 py-3 text-xs font-bold text-white shadow-[0_10px_25px_rgba(255,81,73,.28)] transition hover:-translate-y-0.5 hover:bg-[#f13f3b] sm:px-7 sm:py-4 sm:text-sm">{isAuthenticated ? 'Mi programa' : 'Comenzar'}</Link>
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
        <section className="relative overflow-hidden border-b border-[#17172a]/10 bg-[#f9f6f1] pt-[105px] sm:pt-[126px] lg:pt-[100px]">
          <div className="mx-auto max-w-[1600px] lg:grid lg:min-h-[720px] lg:grid-cols-[42%_58%]">
            <div className="relative z-20 flex flex-col justify-center px-6 pb-12 pt-12 sm:px-12 lg:px-[6.5vw] lg:pb-24 lg:pt-28">
              <div className="mb-7 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.28em] text-[#4b2db5]"><Sparkles className="h-4 w-4" /> Neuroentrenamiento</div>
              <p className="max-w-[520px] text-[2rem] font-extrabold leading-[1.08] tracking-[-.025em] sm:text-[2.65rem] lg:text-[2.8rem]">Deja de sobrevivir en automático.</p>
              <h1 className="mt-4 max-w-[610px] text-[3.8rem] font-black uppercase leading-[.87] tracking-[-.055em] text-[#392099] sm:text-[5.6rem] lg:text-[5.8rem] xl:text-[6.7rem]">Empieza a dirigir tu vida<span className="text-[#ff6259]">.</span></h1>
              <p className="mt-7 max-w-[550px] text-sm font-medium leading-7 text-[#3e3d49] sm:text-base">Entrena claridad, disciplina y ejecución con un sistema diseñado para convertir <strong className="text-[#392099]">intención en progreso real.</strong></p>
              <Link to={primaryPath} className="mt-9 inline-flex w-fit items-center justify-center gap-3 rounded-xl bg-[#ff6259] px-7 py-4 text-sm font-bold text-white shadow-[0_18px_35px_rgba(255,81,73,.24)] transition hover:-translate-y-0.5 hover:bg-[#f13f3b]">{primaryLabel}<ArrowRight className="h-4 w-4" /></Link>
            </div>

            <div className="relative min-h-[500px] overflow-hidden bg-[#21106f] sm:min-h-[620px] lg:min-h-0">
              <img src="/images/landing/hero.webp" alt="Persona avanzando hacia una nueva etapa" className="absolute inset-0 h-full w-full object-cover object-center" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#29106f]/10 via-transparent to-[#16084f]/30" />
              <div className="pointer-events-none absolute -left-20 top-0 hidden h-full w-40 -skew-x-[18deg] bg-[#f9f6f1] lg:block" />
              <aside className="absolute inset-y-0 right-0 flex w-[105px] flex-col justify-center gap-14 bg-gradient-to-b from-[#45239d]/95 to-[#1c075d]/95 px-3 text-white sm:w-[150px] sm:px-6 lg:w-[175px]">
                {[{icon:Target,label:'Sistema probado'},{icon:BarChart3,label:'Resultados reales'},{icon:Users,label:'Comunidad activa'}].map(({icon: Icon,label}) => <div key={label} className="flex flex-col items-center gap-3 text-center text-[9px] font-semibold sm:text-xs"><Icon className="h-7 w-7 text-[#b8a6ff] sm:h-9 sm:w-9" /><span>{label}</span></div>)}
              </aside>
              <div className="absolute bottom-0 left-3 right-[82px] grid grid-cols-3 bg-white/95 text-[#0a0d29] shadow-2xl backdrop-blur sm:left-[8%] sm:right-[120px] lg:right-[150px] lg:[clip-path:polygon(5%_0,100%_0,95%_100%,0_100%)]">
                {[['01','Claridad'],['02','Acción'],['03','Expansión']].map(([number,label], index) => <div key={number} className={`px-4 py-4 sm:px-8 sm:py-6 ${index < 2 ? 'border-r border-[#17172a]/10' : ''}`}><strong className="block text-base text-[#392099] sm:text-xl">{number}</strong><span className="mt-1 block text-[10px] font-bold sm:text-sm">{label}</span></div>)}
              </div>
            </div>
          </div>

          <div className="relative z-30 mx-auto grid max-w-[1500px] grid-cols-2 gap-y-7 border-t border-[#17172a]/10 bg-white/95 px-6 py-7 shadow-[0_-12px_35px_rgba(31,20,79,.05)] sm:px-10 lg:grid-cols-4 lg:rounded-t-2xl lg:px-12">
            {[{icon:Star,title:'4.9/5',text:'Experiencia valorada'},{icon:CalendarDays,title:'Paso a paso',text:'Ruta estructurada sin complicaciones'},{icon:Users,title:'Comunidad',text:'Crecimiento compartido y apoyo constante'},{icon:BarChart3,title:'Avance medible',text:'Progreso visible y sostenible'}].map(({icon: Icon,title,text}, index) => <div key={title} className={`flex items-start gap-4 ${index % 2 ? 'border-l border-[#17172a]/10 pl-5' : ''} lg:border-l lg:pl-8 first:lg:border-l-0 first:lg:pl-0`}><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f1ebff] text-[#5426e8]"><Icon className="h-6 w-6" /></span><span><strong className="block text-sm">{title}</strong><span className="mt-1 block max-w-[190px] text-xs leading-5 text-[#565560]">{text}</span></span></div>)}
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
