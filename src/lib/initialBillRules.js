// Optional services are added to a saved invoice through its revision workflow.
export function assertCompulsoryInitialBill(items = []) {
  if (items.some(item => item.is_optional === true || item.isOptional === true || item.optional === true || /^optional\s*:/i.test(item.details || item.description || item.name || ''))) {
    throw new Error('Post compulsory fees first. Add optional services later through Edit saved bills for the individual student.');
  }
}
