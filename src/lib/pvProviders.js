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
  const item = resolve(items?.items);
  return items?.type === 'array' && Boolean(item?.properties?.payee_id && item?.properties?.payee_name);
}
