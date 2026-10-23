# Declined result: message to submitting teacher

Requirement: when Head Admin declines a result and enters a comment, the original submitting teacher receives a persistent in-app message containing the comment, student, subject, reporting period and link/reference to the score sheet.

Current frontend sends PATCH `/api/v1/results/{result_id}/status` with `{ "status": "Declined", "decline_note": "Reason" }`. Confirm this route accepts the score-record UUID for assessment sheets too; coordinate the adapter if those require a separate decline route.

Backend must authorize the decision, require a nonblank decline_note, resolve the original submitting teacher from the saved teacher/user relationship, and commit status, comment, audit and recipient notification atomically. Never infer recipient by subject, display name or whoever is currently assigned to the class. Do not broadcast to all staff. A missing author relationship must be reported and reconciled.

Persist a unique notification per result decision revision to prevent duplicate messages on retries. GET `/messages` should return the notification only to its authorized recipient and decision administrators. Use the existing message projection's recipient-role mapping consistently for teacher/class_teacher. Include stable result/score sheet UUIDs and canonical student name. Preserve notification history through resubmission while marking the latest decision clearly.

Result list and score sheet detail must return teacher_id, decline_note and Declined status consistently. The frontend now requires a decline comment, refreshes after saving and shows returned-result alerts when those fields identify the signed-in teacher. It does not claim an inbox message was sent merely because the status request succeeded. Backend persistent messaging and live delivery remain unverified.

Test separate Head Admin and teacher sessions: decline → refresh → comment notification visible to original teacher → correction/resubmission → new decision without duplicate notification. Verify unauthorized users cannot read the message and a failed transaction cannot leave a declined result with its notification missing.
