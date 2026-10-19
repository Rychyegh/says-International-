export function paymentAllocations(lines, total) {
  const cents = value => Math.round(Number(value) * 100);
  const result = lines.map(line => {
    const amount = Number(line.amount);
    if (!line.accountName || !Number.isFinite(amount) || amount <= 0 || Math.abs(amount * 100 - cents(amount)) > 0.000001) {
      throw new Error('Select an account and enter a positive amount with up to two decimal places for each row.');
    }
    return { accountName: line.accountName, accountCode: line.accountCode || '', amount };
  });
  if (!result.length || result.reduce((sum, line) => sum + cents(line.amount), 0) !== cents(total)) {
    throw new Error('Account amounts must add up to the total amount received.');
  }
  return result;
}
export function allocationNotes(notes, allocations) {
  if (!allocations?.length) return notes || '';
  return [notes, 'Payment account breakdown:', ...allocations.map(line => `${line.accountName}${line.accountCode ? ` [${line.accountCode}]` : ''}: GHS ${Number(line.amount).toFixed(2)}`)].filter(Boolean).join('\n');
}
export function receiptAllocations(receipt) {
  if (Array.isArray(receipt.allocations)) return receipt.allocations;
  const breakdown = [receipt.description, receipt.notes].filter(Boolean).map(text => String(text).split('Payment account breakdown:\n')[1]).find(Boolean);
  if (!breakdown) return [];
  return breakdown.split('\n').map(line => {
    const match = line.match(/^(.*?)\s*(?:\[([^\]]+)\])?: GHS (\d+\.\d{2})$/);
    return match ? {accountName:match[1].trim(),accountCode:match[2] || '',amount:Number(match[3])} : null;
  }).filter(Boolean);
}
