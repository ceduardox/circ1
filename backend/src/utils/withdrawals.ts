// Validación de métodos de retiro:
//  - USDT_BEP20 / MATIC_POLYGON: dirección de red (0x + 40 hex), ya que USDT se envía vía contrato ERC-20
//    en BNB Smart Chain (BEP-20) y en Polygon (ERC-20).
//  - BANK_US: cuenta bancaria en USA (routing de 9 dígitos + número de cuenta).

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const ROUTING_RE = /^\d{9}$/;

export type WithdrawalMethod = 'USDT_BEP20' | 'MATIC_POLYGON' | 'BANK_US';

const CRYPTO_LABELS: Record<string, string> = {
  USDT_BEP20: 'USDT (BEP-20 / BNB)',
  MATIC_POLYGON: 'USDT (Polygon)',
};

export function validateAddress(method: string, address: string): string | null {
  const clean = address.trim();
  const label = CRYPTO_LABELS[method] || method;
  if (!ADDRESS_RE.test(clean)) {
    return `La dirección para ${label} no es válida. Debe ser una dirección de wallet (0x + 40 caracteres hexadecimales).`;
  }
  return null;
}

export function validateBankDetails(details: any): string | null {
  if (details.bankName == null || String(details.bankName).trim().length < 2) {
    return 'El nombre del banco es obligatorio (mínimo 2 caracteres).';
  }
  if (details.accountHolder == null || String(details.accountHolder).trim().length < 2) {
    return 'El titular de la cuenta es obligatorio (mínimo 2 caracteres).';
  }
  const routing = String(details.routingNumber || '').trim();
  if (!ROUTING_RE.test(routing)) {
    return 'El número de routing debe ser de 9 dígitos.';
  }
  const accountNumber = String(details.accountNumber || '').trim();
  if (accountNumber.length < 4 || accountNumber.length > 17) {
    return 'El número de cuenta debe tener entre 4 y 17 dígitos.';
  }
  return null;
}

export function validateWithdrawalInput(method: string, account: string | undefined, details: any): string | null {
  if (method === 'USDT_BEP20' || method === 'MATIC_POLYGON') {
    if (!account || !account.trim()) return 'Ingresa la dirección de tu wallet.';
    return validateAddress(method, account);
  }
  if (method === 'BANK_US') {
    if (!details) return 'Completa los datos de tu cuenta bancaria.';
    return validateBankDetails(details);
  }
  return 'Selecciona un método de retiro válido.';
}