// Read the posted bill snapshot; current fee templates may have changed since posting.
export function savedBillItems(bill = {}) {
  const explicit = [bill.itemsBreakdown, bill.items_breakdown, bill.items, bill.lines, bill.line_items, bill.bill_items]
    .find(value => Array.isArray(value) && value.length);
  const normalize = (item, optional = false) => ({
    ...item,
    details: item.details || item.description || item.name || item.item_name || item.fee_name || item.label || 'Fee item',
    amount: Number(item.amount ?? item.fee ?? item.total_amount ?? item.total ?? 0),
    is_optional: item.is_optional ?? item.optional ?? item.isOptional ?? (/^OPTIONAL:/i.test(item.details || item.description || item.name || '') || optional),
  });
  if (explicit) return explicit.map(item => normalize(item));
  const items = [];
  const tuition = bill.tuition_fee ?? bill.tuitionFee;
  if (tuition != null) items.push({details:'Tuition',amount:Number(tuition),is_optional:false});
  const stationery = bill.stationery_breakdown || bill.stationeryBreakdown;
  if (Array.isArray(stationery) && stationery.length) items.push(...stationery.map(item => normalize(item)));
  else if ((bill.stationery_fee ?? bill.stationeryFee) != null) items.push({details:'Stationery',amount:Number(bill.stationery_fee ?? bill.stationeryFee),is_optional:false});
  const optional = bill.optional_services || bill.optionalServices;
  if (Array.isArray(optional)) items.push(...optional.map(item => normalize(item, true)));
  return items;
}
