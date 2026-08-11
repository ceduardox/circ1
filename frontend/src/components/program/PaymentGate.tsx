import { useEffect, useState } from 'react';
import { ButtonPrimary } from '@/components/ui';
import { Crown, Zap, Rocket, Shield, Infinity as InfinityIcon, ChevronRight, Loader2, ExternalLink, CheckCircle2, RefreshCw } from 'lucide-react';
import { PaymentInfo } from '@/store/membershipStore';
import { usePaymentFlow } from './usePaymentFlow';

interface PaymentGateProps {
  onRequestPayment: () => Promise<PaymentInfo | null>;
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { payment, paid, start, checkNow } = usePaymentFlow();

  const isMonthly = variant === 'monthly';

  useEffect(() => {
    const t = setInterval(() => setPhraseIdx(i => (i + 1) % phrases.length), 4000);
    return () => clearInterval(t);
  }, []);

  const handleRequest = async () => {
    // Abrir la pestaña sincrónicamente en el gesto del usuario (antes del await)
    // para que el navegador no la bloquee como popup.
    const win = window.open('', '_blank');
    try {
      await start(onRequestPayment, win);
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.error || 'No se pudo iniciar el pago. Inténtalo de nuevo.');
    }
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

            {/* CTA / estados */}
            {paid ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-center animate-enter-up">
                <div className="flex items-center justify-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300 text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  ¡Pago confirmado! Tu acceso está activo.
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  Recarga la página para entrar a tu programa.
                </p>
              </div>
            ) : payment ? (
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 animate-enter-up">
                <div className="flex items-center gap-2 font-semibold text-indigo-800 dark:text-indigo-300 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Esperando confirmación del pago…
                </div>
                <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">
                  Completaste el pago en la pestaña de NowPayments? La activación es automática.
                </p>
                <div className="mt-4 space-y-2">
                  {payment.invoiceUrl && (
                    <a
                      href={payment.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-white dark:bg-dark-700 border border-indigo-200 dark:border-indigo-700 text-sm font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-dark-600 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Abrir página de pago
                    </a>
                  )}
                  <button
                    onClick={checkNow}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Verificar estado del pago
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 text-center">
                    {errorMsg}
                  </div>
                )}
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
                  Pago en cripto seguro vía NowPayments · Activación automática
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
