import { useEffect, useState } from 'react';
import { ButtonPrimary } from '@/components/ui';
import { Crown, Zap, Rocket, Shield, Infinity as InfinityIcon, ChevronRight, Loader2 } from 'lucide-react';

interface PaymentGateProps {
  onRequestPayment: () => Promise<void>;
  requesting?: boolean;
  variant?: 'membership' | 'monthly';
}

const phrases = [
  'Deja de soñar. Empieza a construir.',
  'Tu chip mental es tu mejor inversión.',
  'Los exitosos no tienen más talento. Tienen más constancia.',
  'Hoy empieza la versión de ti que no se rinde.',
];

const benefits = [
  { icon: <Crown className="w-5 h-5 text-yellow-400" />, title: 'Mentoría RYZTOR', desc: 'La franquicia de dropshipping para vender en USA' },
  { icon: <Zap className="w-5 h-5 text-purple-400" />, title: 'Entrenamiento IA', desc: 'Tu entrenador personal de mente fuerte' },
  { icon: <Rocket className="w-5 h-5 text-pink-400" />, title: 'Comunidad de Élite', desc: 'Únete a los que sí llegan a la meta' },
  { icon: <Shield className="w-5 h-5 text-blue-400" />, title: 'Red de Afiliados', desc: 'Gana comisiones invitando a tu red' },
];

export function PaymentGate({ onRequestPayment, requesting, variant = 'membership' }: PaymentGateProps) {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [requested, setRequested] = useState(false);
  const isMonthly = variant === 'monthly';

  useEffect(() => {
    const t = setInterval(() => setPhraseIdx(i => (i + 1) % phrases.length), 4000);
    return () => clearInterval(t);
  }, []);

  const handleRequest = async () => {
    await onRequestPayment();
    setRequested(true);
  };

  const price = isMonthly ? '$50' : '$500';
  const priceLabel = isMonthly ? '/ mes' : 'USD';
  const subLabel = isMonthly
    ? 'Mantenimiento mensual de tu membresía'
    : 'Tu llave a la mente fuerte + la franquicia';
  const cta = isMonthly ? 'RENOVAR MI MEMBRESÍA' : 'ACTIVAR MI MEMBRESÍA';

  return (
    <div className="min-h-[calc(100vh-9rem)] flex items-center justify-center py-6">
      <div className="w-full max-w-3xl">
        {/* Hero frases animadas */}
        <div className="text-center mb-8 min-h-[100px] flex items-center justify-center">
          <p key={phraseIdx} className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent animate-enter-up leading-tight max-w-2xl">
            {phrases[phraseIdx]}
          </p>
        </div>

        {/* Card de membresía */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary-500/20 bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 animate-gradient-x" />

          <div className="p-6 sm:p-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-6 h-6 text-yellow-500" />
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-100">
                    {isMonthly ? 'Renovar Membresía RYZTOR' : 'Membresía RYZTOR'}
                  </h1>
                </div>
                <p className="text-gray-500 dark:text-dark-400">{subLabel}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-gray-900 dark:text-dark-100">
                  {price} <span className="text-sm font-medium text-gray-400">{priceLabel}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-dark-400">
                  {isMonthly ? 'Mantiene tu acceso activo' : 'Pago único · + $50/mes mantenimiento'}
                </p>
              </div>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-dark-700/50 border border-gray-100 dark:border-dark-600 animate-enter-up hover:border-primary-300 dark:hover:border-primary-700 transition-colors" style={{ animationDelay: `${i * 0.12}s` }}>
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-dark-800 shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                    {b.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-dark-100">{b.title}</p>
                    <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            {requested ? (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-center animate-enter-up">
                <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                  {isMonthly ? 'Renovación solicitada' : 'Pago solicitado'}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  Tu solicitud está pendiente de aprobación. El equipo la revisará en breve y renovará tu acceso.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <ButtonPrimary
                  onClick={handleRequest}
                  disabled={requesting}
                  className="w-full py-4 text-base font-bold relative overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                  <span className="flex items-center justify-center gap-2 animate-pulse-soft">
                    {requesting ? <Loader2 className="w-5 h-5 animate-spin" /> : <InfinityIcon className="w-5 h-5" />}
                    {requesting ? 'PROCESANDO...' : cta}
                    {!requesting && <ChevronRight className="w-5 h-5" />}
                  </span>
                </ButtonPrimary>
                <p className="text-center text-xs text-gray-400 dark:text-dark-500">
                  Pago seguro · Acceso inmediato tras aprobación
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}