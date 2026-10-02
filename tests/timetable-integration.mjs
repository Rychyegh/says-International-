// Synthetic backend only: never writes production records.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE });
let workspace = { contract_version: 1, id: 'w1', revision: 1, published_revision: null, academic_year: '2026/2027', term: 'Term 1', can_manage: true, can_publish: true, entries: [], catalogs: { classes: [{ id: 'c1', name: 'Basic 7A' }], teachers: [{ id: 't1', name: 'Teacher One' }], subjects: [{ id: 's1', name: 'Mathematics' }], rooms: [{ id: 'r1', name: 'Room One' }] } };
let published = [], rejectSave = true, saves = 0, publishes = 0;
const errors = [];
async function pageFor(view) {
  const page = await browser.newPage(); page.on('pageerror', e => errors.push(e.message));
  await page.route('**/api/**', async route => {
    const req = route.request(), path = new URL(req.url()).pathname; let status = 200, body = [];
    if (path.endsWith('/timetables/workspace')) {
      body = workspace;
      if (req.method() === 'PUT') {
        saves++;
        if (rejectSave) { status = 409; body = { detail: 'Concurrent update. Reload timetable.' }; }
        else { workspace = { ...workspace, revision: workspace.revision + 1, entries: req.postDataJSON().entries.map((e, i) => ({ ...e, id: `e${i}` })) }; body = workspace; }
      }
    }
    if (path.endsWith('/workspace/publish')) { publishes++; workspace = { ...workspace, published_revision: workspace.revision }; published = workspace.entries.map(e => ({ ...e, status: 'PUBLISHED', subject_name: 'Mathematics', class_name: 'Basic 7A', teacher_name: 'Teacher One', room_name: 'Room One' })); body = workspace; }
    if (path.endsWith('/timetables/published')) body = { contract_version: 1, entries: published };
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.goto(`http://127.0.0.1:5179/tests/store-harness.html?view=${view}`);return page;
}
try {
  const admin = await pageFor('timetable');
  for (const [name, value] of [['Class / section','c1'],['Subject','s1'],['Teacher','t1'],['Room','r1']]) await admin.getByLabel(name, { exact: true }).selectOption(value);
  await admin.getByRole('button', { name: 'Add to draft', exact: true }).click();
  await admin.getByRole('button', { name: 'Save draft to database' }).click();
  await admin.getByRole('alert').filter({ hasText: 'Concurrent update' }).waitFor();
  assert.equal(workspace.entries.length, 0);
  rejectSave = false; await admin.getByRole('button', { name: 'Save draft to database' }).click();
  await admin.getByText('Draft saved to the database.', { exact: false }).waitFor();
  const student = await pageFor('published-timetable');
  await student.getByText('No timetable has been published for you yet.').waitFor();
  await admin.getByRole('button', { name: 'Publish saved timetable' }).click();
  await admin.getByText('Published. Students, teachers', { exact: false }).waitFor();
  await student.reload(); await student.getByText('Mathematics · Basic 7A').waitFor();
  await admin.reload(); await admin.getByRole('cell', { name: 'Mathematics', exact: true }).waitFor();
  workspace = { ...workspace, can_publish: false };
  await admin.reload();
  await admin.getByText('You can prepare and save drafts.', { exact: false }).waitFor();
  assert.equal(await admin.getByRole('button', { name: 'Publish saved timetable' }).count(), 0);
  assert.equal(await admin.getByRole('button', { name: 'Save draft to database' }).count(), 1);
  delete workspace.can_publish;
  await admin.reload();
  await admin.getByText('You can prepare and save drafts.', { exact: false }).waitFor();
  assert.equal(await admin.getByRole('button', { name: 'Publish saved timetable' }).count(), 0);
  assert.equal(saves, 2); assert.equal(publishes, 1); assert.deepEqual(errors, []);
  console.log('PASS: draft errors retain edits; save, publish, separate reader and reload use API records.');
} finally { await browser.close(); }
