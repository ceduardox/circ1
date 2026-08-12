import { useEffect, useState } from 'react';
import { Check, Brain } from 'lucide-react';

const steps = [
  { n: '01', t: 'Descubre dónde estás', x: 'Definir sueños, miedos y prioridades.' },
  { n: '02', t: 'Entrena una nueva respuesta', x: 'Afirmaciones, ejercicios y desafíos.' },
  { n: '03', t: 'Ejecuta con intención', x: 'Transforma lo aprendido en decisiones.' },
  { n: '04', t: 'Observa tu evolución', x: 'Mide el avance y sigue construyendo.' },
];

export function AnimatedProcess() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % steps.length), 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <div className="mb-7 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[.18em] text-primary-300">Tu proceso</p>
          <h2 className="mt-1 text-xl font-bold">Construye tu siguiente nivel</h2>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/20 animate-float">
          <Brain className="h-6 w-6 text-primary-300" />
        </span>
      </div>

      {/* Ventana del bloque activo */}
      <div className="relative h-32 overflow-hidden rounded-2xl border border-primary-400/30 bg-black/30">
        {steps.map((s, i) => {
          const isActive = i === active;
          return (
            <div
              key={s.n}
              className="absolute inset-0 flex flex-col justify-center px-5 transition-all duration-700 ease-out"
              style={{
                opacity: isActive ? 1 : 0,
                transform: isActive ? 'translateX(0)' : `translateX(${i < active ? '-40px' : '40px'}) scale(.96)`,
                pointerEvents: isActive ? 'auto' : 'none',
              }}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold bg-primary-500">{s.n}</span>
                <span className="text-sm font-semibold">{s.t}</span>
              </div>
              <p className="mt-2 pl-12 text-xs leading-5 text-slate-400">{s.x}</p>
            </div>
          );
        })}
      </div>

      {/* Bloques en cola que se mueven */}
      <div className="mt-3 flex gap-2">
        {steps.map((s, i) => {
          const done = i < active || (active === 0 && i === steps.length - 1);
          return (
            <button
              key={s.n}
              onClick={() => setActive(i)}
              aria-label={s.t}
              className={`flex h-9 flex-1 items-center justify-center rounded-xl border transition-all duration-500 ${
                i === active
                  ? 'border-primary-400 bg-primary-500 shadow-lg shadow-primary-600/30 scale-105'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              {done ? <Check className="h-4 w-4 text-emerald-400" /> : <span className="text-[10px] font-bold text-slate-300">{s.n}</span>}
            </button>
          );
        })}
      </div>

      {/* Barra de estado del ciclo */}
      <div className="mt-4 rounded-2xl bg-gradient-to-r from-primary-600 to-fuchsia-600 bg-[length:200%_auto] animate-gradient-text p-5">
        <p className="text-xs text-primary-100">Principio Círculo 1</p>
        <p className="mt-1 text-sm font-semibold leading-6">Tu negocio crece cuando tú desarrollas la capacidad de sostener ese crecimiento.</p>
      </div>
    </div>
  );
}
