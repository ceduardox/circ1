import { useEffect, useState } from 'react';
import { ButtonPrimary } from '@/components/ui';
import { Crown, Zap, Rocket, Shield, Infinity as InfinityIcon, ChevronRight, Loader2, ExternalLink, CheckCircle2, RefreshCw, Store, Globe2, Repeat2, Clock, X } from 'lucide-react';
import { PaymentInfo } from '@/store/membershipStore';
import { usePaymentFlow } from './usePaymentFlow';
import { useMembershipStore } from '@/store/membershipStore';

interface PaymentGateProps {
  onRequestPayment: (planId?: string) => Promise<PaymentInfo | null>;
  requesting?: boolean;
  variant?: 'membership' | 'monthly';
  plans?: { id: string; name: string; price: number }[];
  level1Percent?: number;
  level2Percent?: number;
  paymentCurrency?: string;
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

const franchiseStats = [
  { icon: <Store className="w-6 h-6" />, number: '+20%', label: 'por producto vendido de ryztor.com' },
  { icon: <Globe2 className="w-6 h-6" />, number: 'USA', label: 'vende en el mercado #1 del mundo' },
  { icon: <Repeat2 className="w-6 h-6" />, number: '2', label: 'fuentes de ingreso: ventas + tu red' },
];

export function PaymentGate({ onRequestPayment, requesting, variant = 'membership', plans, level1Percent = 25, level2Percent = 5, paymentCurrency = 'usdtbep20' }: PaymentGateProps) {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingPay, setPendingPay] = useState<PaymentInfo & { remainingMin?: number; expiresAt?: string } | null>(null);
  const { payment, paid, start, checkNow } = usePaymentFlow();
  const { fetchPendingPayment } = useMembershipStore();

  const isMonthly = variant === 'monthly';

  const planList = plans && plans.length > 0 ? plans : [{ id: 'estandar', name: 'Estándar', price: 500 }];
  const [selectedPlanId, setSelectedPlanId] = useState<string>(planList[0].id);
  const selectedPlan = planList.find(p => p.id === selectedPlanId) || planList[0];

  useEffect(() => {
    setPhraseIdx(0);
  }, [variant]);

  useEffect(() => {
    const t = setInterval(() => setPhraseIdx(i => (i + 1) % phrases.length), 4000);
    return () => clearInterval(t);
  }, []);

  // Consulta si hay un pago pendiente vigente para poder reanudarlo en vez de bloquear.
  useEffect(() => {
    fetchPendingPayment().then(p => {
      if (p) setPendingPay(p);
    });
  }, [fetchPendingPayment, variant]);

  const handleRequest = async () => {
    // Abrir la pestaña sincrónicamente en el gesto del usuario (antes del await)
    // para que el navegador no la bloquee como popup.
    const win = window.open('', '_blank');
    try {
      await start(() => onRequestPayment(isMonthly ? undefined : selectedPlan.id), win);
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.error || 'No se pudo iniciar el pago. Inténtalo de nuevo.');
    }
  };

  const resumePending = () => {
    if (!pendingPay?.invoiceUrl) return;
    const win = window.open(pendingPay.invoiceUrl, '_blank', 'noopener,noreferrer');
    if (!win) window.location.href = pendingPay.invoiceUrl;
    setPendingPay(null);
  };

  const dismissPending = () => setPendingPay(null);

  const isCrypto = paymentCurrency !== 'usd';
  const currencyLabel = isCrypto
    ? ({ usdtbsc: 'USDT BEP-20', usdtmatic: 'USDT Polygon', usdttrc20: 'USDT TRC-20', usdterc20: 'USDT ERC-20' } as Record<string, string>)[paymentCurrency] || 'USDT'
    : 'USD';
  const currencyShort = isCrypto ? 'USDT' : 'USD';

  const price = isMonthly ? (isCrypto ? '50' : '$50') : (isCrypto ? `${selectedPlan.price}` : `$${selectedPlan.price}`);
  const priceLabel = isMonthly ? `/ mes` : (isCrypto ? currencyShort : 'USD');
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
                  {isMonthly ? 'Mantiene tu acceso activo' : `Pago único en ${currencyLabel} · + 50 ${currencyShort}/mes mantenimiento`}
                </p>
              </div>
            </div>

            {/* Beneficios */}
            {!isMonthly && planList.length > 1 && (
              <div className="mb-8">
                <p className="text-sm font-semibold text-gray-700 dark:text-dark-200 mb-3">Elige tu plan</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {planList.map(pl => {
                    const isTop = pl.price === Math.max(...planList.map(p => p.price));
                    const earn = (pl.price * level1Percent) / 100;
                    const earn2 = (pl.price * level2Percent) / 100;
                    return (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={() => setSelectedPlanId(pl.id)}
                        className={`relative rounded-2xl border p-4 text-left transition-all ${
                          selectedPlan.id === pl.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md shadow-primary-500/10'
                            : 'border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 hover:border-primary-300 dark:hover:border-primary-700'
                        } ${isTop && selectedPlan.id !== pl.id ? 'border-amber-300 dark:border-amber-700' : ''}`}
                      >
                        {isTop && (
                          <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold shadow">
                            MÁS GANANCIAS
                          </span>
                        )}
                        <p className="text-sm font-semibold text-gray-900 dark:text-dark-100">{pl.name}</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-dark-100 mt-1">
                          {isCrypto ? pl.price : `$${pl.price}`} <span className="text-xs font-medium text-gray-400">{currencyShort}</span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-dark-400 mt-1.5">
                          Ganas <span className="font-bold text-emerald-600 dark:text-emerald-400">{isCrypto ? `${earn} ${currencyShort}` : earn.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span> por referido
                          <span className="text-gray-400"> · {isCrypto ? `${earn2} ${currencyShort}` : earn2.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} nivel 2</span>
                        </p>
                        {selectedPlan.id === pl.id && (
                          <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-1">✓ Seleccionado</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Franquicia limitada */}
            {!isMonthly && (
              <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 via-purple-600 to-fuchsia-600 text-white p-5 sm:p-6">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 animate-gradient-x" />
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="w-5 h-5 text-amber-300" />
                  <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-300">
                    Franquicia limitada · ryztor.com
                  </p>
                </div>
                <p className="font-bold text-lg leading-snug">
                  Vende en TikTok Shop sin LLC ni ITIN.
                </p>
                <p className="text-sm text-purple-100 mt-1">
                  El puente con afiliados de TikTok Shop vende los productos de ryztor.com. Tú compartes, ellos venden, tú ganas.
                </p>
                <div className="grid grid-cols-3 gap-3 mt-5">
                  {franchiseStats.map((s, i) => (
                    <div key={i} className="rounded-2xl bg-white/10 backdrop-blur border border-white/20 px-2 py-3 text-center">
                      <div className="flex justify-center text-amber-300 mb-1">{s.icon}</div>
                      <p className="text-2xl font-black leading-none">{s.number}</p>
                      <p className="text-[10px] text-purple-100 mt-1.5 leading-tight">{s.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-purple-200 mt-4">
                  Sin LLC ni ITIN propios para empezar · franquicia limitada: hoy puedes vender sin límite, el cupo podrá ajustarse.
                </p>
              </div>
            )}

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
                {pendingPay && !payment && (
                  <div className="relative p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <button
                      onClick={dismissPending}
                      className="absolute top-2.5 right-2.5 p-1 rounded-lg text-amber-400 hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                      aria-label="Cerrar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                          Tienes un pago pendiente
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                          {pendingPay.remainingMin != null && pendingPay.remainingMin > 0
                            ? `Puedes reanudarlo en los próximos ${pendingPay.remainingMin} min, o esperar a que expire para iniciar uno nuevo.`
                            : 'Puedes reanudarlo o iniciar uno nuevo.'}
                        </p>
                        {pendingPay.invoiceUrl && (
                          <button
                            onClick={resumePending}
                            className="mt-2.5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Reanudar mi pago
                          </button>
                        )}
                      </div>
                    </div>
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
                  Pago en {currencyLabel} (NowPayments) · Activación automática
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
