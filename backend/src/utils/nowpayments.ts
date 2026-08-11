import crypto from 'crypto';
import { config } from '../config/index.js';

interface NowPaymentsResponse {
  id?: number;
  payment_id?: number;
  invoice_url?: string;
  payment_status?: string;
  pay_amount?: number | string;
  pay_currency?: string;
  price_amount?: number | string;
  price_currency?: string;
  order_id?: string;
  error?: string;
  status?: string;
  [key: string]: unknown;
}

const baseHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': config.nowpayments.apiKey,
  };
  if (config.nowpayments.sandbox) headers['x-sandbox'] = 'true';
  return headers;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${config.nowpayments.baseUrl}${path}`, {
    ...options,
    headers: { ...baseHeaders(), ...(options.headers as Record<string, string>) },
  });
  const data = (await res.json().catch(() => ({}))) as T;
  if (!res.ok) {
    const err = (data as NowPaymentsResponse)?.error || (data as NowPaymentsResponse)?.status || res.statusText;
    throw new Error(`NowPayments ${res.status}: ${err}`);
  }
  return data;
}

export interface CreateInvoiceParams {
  priceAmount: number;
  priceCurrency: string;
  orderId: string;
  orderDescription: string;
  successUrl?: string;
  cancelUrl?: string;
  ipnCallbackUrl?: string;
}

export async function createInvoice(params: CreateInvoiceParams): Promise<{
  paymentId: number;
  invoiceUrl: string;
  paymentStatus: string;
}> {
  const data = await request<NowPaymentsResponse>('/v1/invoice', {
    method: 'POST',
    body: JSON.stringify({
      price_amount: params.priceAmount,
      price_currency: params.priceCurrency,
      order_id: params.orderId,
      order_description: params.orderDescription,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      ipn_callback_url: params.ipnCallbackUrl,
    }),
  });
  if (!data.payment_id && !data.id) {
    throw new Error('NowPayments no devolvió un invoice válido');
  }
  const paymentId = Number(data.payment_id ?? data.id);
  return {
    paymentId,
    invoiceUrl: data.invoice_url || '',
    paymentStatus: data.payment_status || 'waiting',
  };
}

export interface PaymentStatus {
  payment_id: number;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid: number;
  pay_currency: string;
  order_id: string;
  outcome_payment_status?: string;
}

export async function getPaymentStatus(paymentId: number): Promise<PaymentStatus> {
  try {
    return await request<PaymentStatus>(`/v1/payment/${paymentId}`);
  } catch (err: any) {
    // El invoice aún no tiene payment hasta que el usuario inicia el pago.
    if (err.message.includes('404')) {
      return {
        payment_id: paymentId,
        payment_status: 'waiting',
        pay_address: '',
        price_amount: 0,
        price_currency: '',
        pay_amount: 0,
        actually_paid: 0,
        pay_currency: '',
        order_id: '',
      };
    }
    throw err;
  }
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!config.nowpayments.ipnSecret) return false;
  const hmac = crypto.createHmac('sha512', config.nowpayments.ipnSecret);
  hmac.update(rawBody);
  const expected = hmac.digest('hex');
  const received = signature.trim().toLowerCase();
  return received.length === expected.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}
