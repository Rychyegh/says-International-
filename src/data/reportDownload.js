export function downloadPublishedReport(report) {
  const url = report.fileUrl || report.fileData;
  if (!url || !/^(https?:|data:|blob:)/i.test(url)) throw new Error('No saved report file is available. Ask the school to upload it.');
  const link = document.createElement('a');
  link.href = url;
  link.download = report.fileName || 'result-sheet';
  link.rel = 'noopener';
  link.click();
}
