// Legacy vouchers may store item detail only in the description written by
// SubmitPVRequest. Recovered lines are display/draft data, never backend IDs.
export function disbursementItems(voucher = {}) {
  const items = Array.isArray(voucher.items) ? voucher.items : [];
  if (items.length > 1) return items;
  const description = String(voucher.description || items[0]?.description || '').replace(/^\[[^\]]+\]\s*/, '');
  const lines = description.split(/;\s*/);
  if (lines.length < 2) return items;
  const recovered = lines.map((line, index) => {
    const match = line.match(/^(.+?)\s+\(qty\s+(\d+(?:\.\d+)?)\s*[×x]\s*GHS\s+([\d,]+(?:\.\d+)?)\s*=\s*GHS\s+([\d,]+(?:\.\d+)?)\)$/i);
    if (!match) return null;
    const qty = Number(match[2]);
    const costPerItem = Number(match[3].replaceAll(',', ''));
    const totalAmount = Number(match[4].replaceAll(',', ''));
    if (![qty, costPerItem, totalAmount].every(Number.isFinite) || qty <= 0 || costPerItem < 0 || Math.abs(qty * costPerItem - totalAmount) > 0.011) return null;
    return { id: `description-line-${index + 1}`, description: match[1], qty, costPerItem, totalAmount, provider: voucher.provider, status: voucher.status, recoveredFromDescription: true };
  });
  return recovered.every(Boolean) ? recovered : items;
}

export function requiresItemDisbursement(voucher) {
  return disbursementItems(voucher).length > 1;
}
