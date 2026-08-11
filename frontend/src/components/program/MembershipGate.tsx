import { useEffect, ReactNode, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useMembershipStore } from '@/store/membershipStore';
import { PaymentGate } from './PaymentGate';
import { Loader2, Clock, AlertTriangle, X } from 'lucide-react';
import { ButtonPrimary } from '@/components/ui';

interface MembershipGateProps {
  children: ReactNode;
}

export function MembershipGate({ children }: MembershipGateProps) {
  const { user } = useAuthStore();
  const {
    status, loadingStatus, fetchStatus,
    requestPayment, requestMonthlyPayment, requestingPayment,
  } = useMembershipStore();

  useEffect(() => {
    if (user) fetchStatus();
  }, [user, fetchStatus]);

  if (!user) return null;
  if (user.role === 'ADMIN') return <>{children}</>;

  if (loadingStatus) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const memberStatus = status?.status;

  // Sin membresía (nunca activó): paywall de membresía $500
  if (!memberStatus || memberStatus === 'INACTIVE' || memberStatus === 'REVOKED') {
    return <PaymentGate onRequestPayment={requestPayment} requesting={requestingPayment} variant="membership" />;
  }

  // Expirado: bloqueado, solo pantalla de renovación $50
  if (memberStatus === 'EXPIRED') {
    return <PaymentGate onRequestPayment={requestMonthlyPayment} requesting={requestingPayment} variant="monthly" />;
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
                onClick={() => requestMonthlyPayment()}
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
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
