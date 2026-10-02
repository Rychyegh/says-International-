export function retryPresentation(record) {
  const failure = record.lastFailure || record.firstFailure;
  // A later validation/auth response cannot resolve an earlier uncertain write.
  if (record.state !== 'rejected') return {
    kind: 'uncertain', title: 'Database outcome uncertain',
    message: 'We could not confirm whether this request was saved. Retry the original request to check its outcome before submitting another.',
  };
  if (failure?.status === 422) {
    let issues;
    try {
      const parsed = JSON.parse(failure.message);
      issues = Array.isArray(parsed) ? parsed : parsed.detail;
    } catch { /* Older saved messages may be truncated. Use a readable fallback. */ }
    const labels = { amount: 'Total amount', unit_cost: 'Unit cost', quantity: 'Quantity' };
    const messages = Array.isArray(issues) ? issues.flatMap(issue => {
      const label = labels[issue.loc?.at(-1)];
      if (!label) return [];
      if (issue.type === 'decimal_max_digits' && Number.isFinite(issue.ctx?.max_digits)) return [`${label} must contain no more than ${issue.ctx.max_digits} digits in total.`];
      if (issue.type === 'less_than_equal' && Number.isFinite(issue.ctx?.le)) return [`${label} must be ${issue.ctx.le.toLocaleString('en-US')} or less.`];
      return [];
    }) : [];
    return {
      kind: 'validation', title: 'Not saved — check the form',
      message: messages.length ? [...new Set(messages)].join(' ') : 'Some values were rejected. Check the amount, quantity and other form entries.',
    };
  }
  return {
    kind: 'authentication', title: 'Not saved — sign-in required',
    message: 'The server rejected this request. Verify your sign-in / PIN and account permissions before retrying.',
  };
}
