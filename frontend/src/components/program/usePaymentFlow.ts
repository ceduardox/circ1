import { useCallback, useEffect, useRef, useState } from 'react';
import { useMembershipStore, PaymentInfo } from '@/store/membershipStore';

const isPaid = (p: PaymentInfo | null) =>
  p?.status === 'APPROVED' || p?.npStatus === 'confirmed' || p?.npStatus === 'finished';

// Flujo de pago NowPayments: abre el invoice en otra pestaña y hace polling hasta confirmar.
export function usePaymentFlow() {
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [paid, setPaid] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { checkPayment, fetchStatus } = useMembershipStore();

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const start = useCallback(async (onRequest: () => Promise<PaymentInfo | null>, win?: Window | null) => {
    let info: PaymentInfo | null = null;
    try {
      info = await onRequest();
    } catch (e: any) {
      if (win && win.location.href === 'about:blank') win.close();
      throw e;
    }
    if (!info) {
      if (win && win.location.href === 'about:blank') win.close();
      return;
    }
    setPayment(info);
    setPaid(false);

    if (info.invoiceUrl) {
      if (win) {
        win.location.href = info.invoiceUrl;
      } else {
        window.open(info.invoiceUrl, '_blank', 'noopener,noreferrer');
      }
    } else if (win && !win.location.href) {
      win.close();
    }

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const updated = await checkPayment(info.id);
        setPayment(updated);
        if (isPaid(updated)) {
          if (pollRef.current) clearInterval(pollRef.current);
          setPaid(true);
          await fetchStatus();
        }
      } catch {
        // ignorar errores temporales del polling
      }
    }, 5000);
  }, [checkPayment, fetchStatus]);

  const checkNow = useCallback(async () => {
    if (!payment) return;
    try {
      const updated = await checkPayment(payment.id);
      setPayment(updated);
      if (isPaid(updated)) {
        if (pollRef.current) clearInterval(pollRef.current);
        setPaid(true);
        await fetchStatus();
      }
    } catch {
      // noop
    }
  }, [checkPayment, payment, fetchStatus]);

  // Limpia el estado del flujo (cuando el usuario cambia de método de pago).
  const reset = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    setPayment(null);
    setPaid(false);
  }, []);

  return { payment, paid, start, checkNow, reset };
}
