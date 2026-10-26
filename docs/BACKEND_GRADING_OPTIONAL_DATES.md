# Grading-only saves and optional dates

The grading-only screen sends `PUT /api/v1/academic/settings` without `resumptionDate` or `vacationDate`. Other academic fields and validated grading bands remain in the payload. Full settings saves also omit empty dates rather than sending invalid empty strings.

The backend must treat omitted date fields as unchanged. Do not require dates to update grading bands, clear existing dates on omission, or substitute today's date. Validate dates only when provided. Apply updates atomically and return the complete saved settings, including academicYear, academicTerm and gradingBands. If partial updates are not supported by PUT, agree on a PATCH endpoint before changing the frontend contract.

Verify that a grading-only save with no dates succeeds, existing dates remain unchanged, and grades and remarks persist across devices. The deployed backend behavior still requires verification.

## Concurrent edits

GET must return an integer `version` with the settings. The editor preserves the version of the settings loaded before editing, and sends it as `expectedVersion` on PUT. The backend must atomically compare the version, apply changes and increment it, returning the complete saved settings with the new version. Reject stale versions with 409 or 412 and do not change data. The frontend preserves unsaved edits on conflict and requires explicit confirmation before discarding them to reload. It must not fetch a fresh version and silently retry stale edits over another administrator's changes.
