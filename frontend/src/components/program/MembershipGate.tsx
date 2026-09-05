import { useEffect, ReactNode, useState, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useMembershipStore, PaymentInfo } from '@/store/membershipStore';
import { PaymentGate } from './PaymentGate';
import { usePaymentFlow } from './usePaymentFlow';
import { Loader2, Clock, AlertTriangle, X, ExternalLink, CheckCircle2, RefreshCw } from 'lucide-react';
import { ButtonPrimary } from '@/components/ui';

interface MembershipGateProps {
  children: ReactNode;
}

export function MembershipGate({ children }: MembershipGateProps) {
  const { user } = useAuthStore();
  const {
    status, loadingStatus, fetchStatus,
    requestPayment, requestMonthlyPayment, requestingPayment, requestManualPayment,
  } = useMembershipStore();

  useEffect(() => {
    if (user) fetchStatus();
  }, [user, fetchStatus]);

  if (!user) return null;
  if (user.role === 'ADMIN') return <>{children}</>;

  if (loadingStatus && !status) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const memberStatus = status?.status;

  // Sin membresía (nunca activó): paywall de membresía
  if (!memberStatus || memberStatus === 'INACTIVE' || memberStatus === 'REVOKED') {
    return <PaymentGate onRequestPayment={requestPayment} onRequestManualPayment={requestManualPayment} requesting={requestingPayment} variant="membership" plans={status?.settings?.plans} level1Percent={status?.settings?.level1Percent} level2Percent={status?.settings?.level2Percent} paymentCurrency={status?.settings?.paymentCurrency} bankDetails={status?.settings?.bankDetails} />;
  }

  // Expirado: bloqueado, solo pantalla de renovación (cuota del plan del usuario)
  if (memberStatus === 'EXPIRED') {
    const planForFee = (status?.pack as any)?.planId ? status?.settings?.plans?.find((p: any) => p.id === (status?.pack as any).planId) : null;
    const fee = (planForFee as any)?.monthlyFee ?? status?.settings?.monthlyFee ?? 50;
    return <PaymentGate onRequestPayment={requestMonthlyPayment} requesting={requestingPayment} variant="monthly" paymentCurrency={status?.settings?.paymentCurrency} monthlyFee={fee} />;
  }

  // En gracia: accede al contenido pero muestra modal para pagar la cuota
  if (memberStatus === 'GRACE') {
    return (
      <GraceBanner>
        {children}
      </GraceBanner>
    );
  }

  return <>{children}</>;
}

function GraceBanner({ children }: { children: ReactNode }) {
  const { requestMonthlyPayment, requestingPayment } = useMembershipStore();
  const { payment, paid, start, checkNow } = usePaymentFlow();
  const [open, setOpen] = useState(true);

  return (
    <div className="relative">
      {children}

      {/* Overlay de gracia */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-dark-800 border border-amber-200 dark:border-amber-800 shadow-2xl overflow-hidden animate-enter-up">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          <div className="p-6 sm:p-8 text-center">
            {paid ? (
              <div>
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-dark-100">
                  ¡Cuota pagada!
                </h2>
                <p className="text-gray-500 dark:text-dark-400 text-sm mt-2">
                  Tu membresía se renovó correctamente. Recarga la página para continuar.
                </p>
                <div className="mt-6">
                  <ButtonPrimary onClick={() => window.location.reload()} className="w-full">
                    RECARGAR
                  </ButtonPrimary>
                </div>
              </div>
            ) : payment ? (
              <div>
                <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                  <Loader2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-spin" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-dark-100">
                  Esperando confirmación del pago
                </h2>
                <p className="text-gray-500 dark:text-dark-400 text-sm mt-2">
                  La activación es automática al confirmarse el pago en la red.
                </p>
                <div className="mt-6 space-y-2">
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
              <>
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                  <Clock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-dark-100">
                  Tu membresía venció
                </h2>
                <p className="text-gray-500 dark:text-dark-400 text-sm mt-2">
                  Estás en tu <span className="font-semibold text-amber-600 dark:text-amber-400">periodo de gracia</span>.
                  Renueva tu cuota mensual para mantener el acceso activo.
                </p>

                <div className="mt-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-2xl font-black text-gray-900 dark:text-dark-100">$50</span>
                    <span className="text-sm text-gray-500 dark:text-dark-400">/ mes</span>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Si no renuevas antes de que termine la gracia, perderás el acceso hasta pagar.
                  </p>
                </div>

                <div className="mt-6 space-y-2">
                  <ButtonPrimary
                    onClick={() => { const win = window.open('', '_blank'); start(requestMonthlyPayment, win); }}
                    disabled={requestingPayment}
                    className="w-full"
                  >
                    {requestingPayment && <Loader2 className="w-4 h-4 animate-spin" />}
                    PAGAR MI CUOTA MENSUAL
                  </ButtonPrimary>
                  <p className="text-[11px] text-gray-400 dark:text-dark-500">
                    Puedes seguir usando la plataforma mientras tanto.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
