export function downloadPublishedReport(report) {
  const fallback = 'Course,Score,Grade\nPure Mathematics,91%,A\nPhysics,86%,A-\nLiterature in English,88%,A-';
  const url = report.fileData || URL.createObjectURL(new Blob([fallback], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = report.fileName || `${report.semester || 'semester'}-result-sheet.csv`;
  link.click();
  if (!report.fileData) URL.revokeObjectURL(url);
}
