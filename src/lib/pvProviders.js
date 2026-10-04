export function voucherProviders(items = []) {
  return [...new Map(items.map(item => [String(item.providerId || item.payee_id || ''), {
    id: item.providerId || item.payee_id || '', name: item.provider || item.payee_name || '',
  }])).values()];
}

// Check the create contract before sending multiple payees to older servers,
// which can silently ignore the items field.
export function supportsVoucherItemProviders(document) {
  const resolve = schema => schema?.$ref
    ? schema.$ref.split('/').slice(1).reduce((value, key) => value?.[key], document)
    : schema;
  const route = Object.entries(document?.paths || {}).find(([path]) => /\/finance\/vouchers\/?$/.test(path))?.[1];
  const body = resolve(route?.post?.requestBody);
  const schema = resolve(body?.content?.['application/json']?.schema);
  const items = resolve(schema?.properties?.items);
  // Optional lists may be expressed as anyOf: [array, null]. Keep checking
  // the array's item contract before allowing multiple payees.
  const variants = [items, ...(Array.isArray(items?.anyOf) ? items.anyOf : [])];
  return variants.some(variant => {
    const array = resolve(variant);
    const item = resolve(array?.items);
    return array?.type === 'array' && Boolean(item?.properties?.payee_id && item?.properties?.payee_name);
  });
}
