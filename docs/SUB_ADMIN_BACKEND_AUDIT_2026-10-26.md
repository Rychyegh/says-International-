# Sub Admin backend audit — 26 October 2026

Follow-up: frontend repairs and the new backend integration contract are documented in `BACKEND_SUB_ADMIN_REPAIRS.md`. Findings below describe the audited state before those repairs; server implementation and live verification remain outstanding.

## Scope and evidence limits

Reviewed the current local frontend source, Sub Admin navigation and action handlers, shared PortalStore, service request methods, and all Node unit tests. No authenticated Sub Admin browser session was available. No production records were created, edited, approved, declined, billed, deleted or messaged during this audit. Backend source/database access was not available. Consequently **API-connected does not mean live-tested or database persistence confirmed**. Earlier screenshots demonstrate backend validation failures, not successful saves.

## Feature inventory

| Sub Admin feature | Connection found | Assessment |
| --- | --- | --- |
| Dashboard | Shared student/application/staff/result API reads | Connected; count accuracy depends on successful, complete API reads. |
| Applications & Forms | `/admissions/applications`, status PATCH, updates and enrollment requests | Connected; multipart contract, authorization and persistence require live verification. |
| Student Roster | GET `/students`; status/promotion PUT `/students/{id}` | Connected. Status editor checks returned student identity. General student edit path has a false-success risk described below. |
| Student CSV / printing | Generated in the browser from loaded records | No database write is expected. Export accuracy depends on fetched records and resolved period fields. |
| Classes / subjects | GET/POST `/academic/catalog/{collection}` | Connected. Subclass saves currently swallow errors. Subject wrapper parsing has a local fix; cross-device behavior remains unverified. |
| Staff and teaching assignments | Staff API plus teaching-assignment read/write API | Connected. Teaching-staff creation is explicitly Head-Admin-only in the UI handler; Sub Admin cannot assume every Classes & Staff action is allowed. |
| Card issuance | Student PUT for UID, daily limit and parent pickup card fields | Connected for record association. It is not proof of physical RFID/NFC encoding or PIN persistence. |
| Attendance & SMS | Attendance logs, scan, roll-call, notify-absent and send-sms API calls | Connected; SMS provider delivery is separate from successful API submission. Avoid live SMS tests without consent and a designated recipient. |
| Academic Settings | GET/PUT `/academic/settings` | Connected. Screenshots exposed empty-date and missing expectedVersion contract failures. Local fixes exist; live persistence has not been confirmed. |
| Timetable | `/timetables/workspace` draft save, publication and published-reader API | Connected; requires backend revision/catalog contract and can_manage/can_publish permissions. Adding a row is a draft operation until saved and published. |
| Register for Exams | `/exams/registrations` plus shared subject catalogue | Connected across shared registration screens. Cross-device persistence still needs two-device GET verification. |
| Score Sheet Entry | SIMS score-sheet/test-result APIs | Connected. Complete scores and student/term/year identity must be verified in returned data. |
| Transcripts & Results | Results API; status PATCH; SIMS publish for assessment records | Connected. Approved-only transcript helpers exist. Some other academic modal reports remain misleading, as below. |
| Decline note to teacher | Result decline followed by separate message request unless backend supplies notification identity | Not atomic on the frontend. Decline can succeed while messaging fails. Backend transactional notification/outbox support is needed for a guarantee. |
| Submit PV Request | `/finance/vouchers` with idempotent creation | Connected. Multi-provider submissions check backend capability first. Creation does not imply approval or disbursement. |
| Official Fee Schedule | Browser-local templates; backend calls when bills are posted | Mixed. Template editing does not sync to other devices. Posted invoices are separate backend records. |
| UAC, PV approval/disbursement, security screens | Intended Head-Admin-only | Sidebar hiding is not server authorization. A UAC rendering gap exists, described below; server 403 enforcement must be verified separately. |

## Confirmed frontend findings, highest priority first

### 1. Some academic actions are generic reports, with invented fallback values

In `src/portals/AdminPortal.jsx`, the academicSimsModal branch renders Score Sheet Entry specially; other labels fall through to the same generic register. This includes labels suggesting Creche evaluation, pending-result review and pre-audit/approval. Changing the modal title does not implement those workflows.

The fallback table uses `tData?.averageScore || '82.5'`, `tData?.cgpa || '3.75'`, labels every row **Verified**, and limits rows with `.slice(0, 50)`. Missing records can therefore print invented academic values and unearned verification; real zero averages also fall through. Do not treat those modal reports as authoritative or complete. Replace each action with its actual workflow; never fabricate missing results or verification status.

### 2. General student edits can appear saved after a failed backend update

`updateOnboardedStudent` catches updateStudent failures and continues updating in-memory roster data unless the action is card-related. The database can remain unchanged while the current screen changes. Fail closed on non-card edits too; use the persisted response and confirm via GET before reporting success. Do not conflate this handler with StudentStatusEditor, which calls the API directly and checks the returned identity.

### 3. Subclass creation can silently become local-only

`addSubClassLevel` registers the local subclass before POST, catches API failures with console.warn, updates local state anyway and returns success. This directly explains why subclasses may exist on one device but not another. Register locally only after a confirmed server save; propagate failures and verify catalogue reload.

### 4. Fee templates are not a shared database catalogue

OfficialSchoolFeeStructure reads/writes `official_fee_schedule` and `master_stationery_schedule` using localStorage. Per-student bill drafts are React state. Another device cannot see these templates/drafts simply by logging in. Bill posting uses backend APIs, but that does not persist the editable template. A school/class/year/term-scoped fee-template endpoint is required, distinct from issued invoices and individual adjustments.

### 5. Restricted UAC screen can still mount through a stored navigation alias

The restricted banner and sidebar block `User Access Control (UAC)`, but the UAC render branch independently matches that label plus `UAC` and `User Access Control`, without checking adminRole. UserAccessControl mounts its backend user-fetch effect and has no early Sub Admin guard. A persisted navigation value can therefore mount this screen despite hidden sidebar access. This is a frontend restriction gap, **not proof that the backend allows unauthorized user access**. Guard the render branch, normalize restricted aliases, and verify every user-management endpoint rejects Sub Admin server-side.

### 6. Card UI overstates what is persisted

The student card form collects PIN and holder details, but the submit handler sends UID, cardIssued and dailyLimit only; PIN/holder fields are not saved there. Calling the result “encoded” does not demonstrate hardware writing. Confirm the backend card-field schema, UID uniqueness and actual hardware integration; remove unsupported security controls rather than suggesting they are active.

### 7. Backend-connected settings still require contract verification

The editor now omits empty/hidden dates and sends the version loaded before editing as expectedVersion, preserving unsaved edits on conflict. GET must return a numeric version; PUT must preserve omitted dates, atomically compare versions and return complete saved settings. This cannot be certified without a successful save and subsequent GET from another authenticated device.

## Validation performed

`npm test`: **123 tests, 121 passed, 2 failed**.

Both failures are in `tests/api.test.mjs`: “fee and disbursement requests carry idempotency keys” and “split-account fee payment uses one request with the original total and key”. Both stop at the structured-payment-allocation feature gate (“disabled pending deployed backend verification”). These are mock/unit tests, not live database tests; they do not establish that production payments fail. Do not enable financial functionality merely to turn the tests green without verifying the deployed contract.

No application code was changed as part of this audit. Existing fixes from earlier requests remain separate from these audit findings.

## Safe live verification plan

1. Open an authenticated Sub Admin session and confirm the deployed build being tested. Do not share passwords in chat.
2. Use approved test records, preferably staging, and a second authorized device/account in the same school.
3. For each write, inspect the actual request, status and persisted response; then GET the record again and check it on device B. A green toast alone is insufficient.
4. Test allowed/restricted actions using Sub Admin and Head Admin sessions. Confirm denied actions return 403 from the backend without changing data.
5. Verify subject/subclass catalogue, student status/promotion, fee template vs issued invoice, settings version and grading propagation, timetable publication, and exam registration separately.
6. Verify result approval is reflected in the same student's term/year transcript and report card; decline must exclude it and deliver a persisted teacher notification.
7. Never test real SMS delivery, real payments, deletion or academic decisions on production learners without specific approval and a controlled test plan.

## Recommended repair order

1. Remove fabricated academic results/verification and block restricted UAC rendering.
2. Make failed student/subclass saves remain failures instead of local success.
3. Add shared backend fee-template storage and complete the mislabeled academic workflows.
4. Verify settings, subjects, reports and notifications with authorized two-device persistence checks.
