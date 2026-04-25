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

export function transactionLabel(type: 'FLOAT_TOP_UP' | 'FLOAT_WITHDRAWAL' | 'DEPOSIT' | 'FLOAT_TRANSFER') {
  switch (type) {
    case 'FLOAT_TOP_UP': return 'FLOAT TOP-UP';
    case 'FLOAT_WITHDRAWAL': return 'FLOAT WITHDRAWAL';
    case 'DEPOSIT': return 'DEPOSIT';
    case 'FLOAT_TRANSFER': return 'FLOAT TRANSFER';
  }
}

