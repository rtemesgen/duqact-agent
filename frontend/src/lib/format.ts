export function formatCurrency(value: number | string | null | undefined) {
  const amount = typeof value === 'string' ? Number(value) : (value ?? 0);
  return `USh ${new Intl.NumberFormat('en-US').format(Number.isFinite(amount) ? amount : 0)}`;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '--';
  return new Date(value).toLocaleString();
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map(part => part[0]?.toUpperCase() ?? '').join('') || 'MA';
}

export function transactionLabel(type: 'FLOAT_TOP_UP' | 'FLOAT_WITHDRAWAL' | 'DEPOSIT' | 'WITHDRAW' | 'FLOAT_TRANSFER') {
  switch (type) {
    case 'FLOAT_TOP_UP': return 'FLOAT TOP-UP';
    case 'FLOAT_WITHDRAWAL': return 'WITHDRAWAL';
    case 'DEPOSIT': return 'DEPOSIT';
    case 'WITHDRAW': return 'WITHDRAWAL';
    case 'FLOAT_TRANSFER': return 'FLOAT TRANSFER';
  }
}

export function generateTransactionId(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  const suffix = Math.random().toString(36).slice(2, 4).toUpperCase().padEnd(2, '0');
  return `TXN-${year}${month}${day}-${hours}${minutes}${seconds}-${milliseconds}-${suffix}`;
}

