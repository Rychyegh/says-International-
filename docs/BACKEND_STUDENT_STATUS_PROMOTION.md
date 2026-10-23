# Student inactivity and promotion

Frontend roster now provides Status / Promote for head_admin and sub_admin, plus Active/Inactive/All filters. Existing PUT `/api/v1/students/{uuid}` receives status (Active/Inactive), is_active, class_level, class_section and change_reason. Verify deployed schema compatibility before release; these fields have not been live-tested. Return the committed student with its UUID and updated fields, and expose inactive students to authorized administrators in GET `/students`.

Authorize both roles server-side. Require a meaningful reason, validate the saved class and section against the catalog, and preserve student UUID/code, financial history, results, receipts and admission records. Promotion updates current class but must not rewrite historical score/invoice class snapshots. Audit before/after, actor and timestamp. Inactive status must not delete the learner; exclude inactive students from new-term billing and active class rosters according to school rules, with reactivation available. If inactive status also suspends login, enforce that on the server.

Test active → inactive → reload → inactive roster → reactivate; Basic 1 → Basic 2 promotion with valid section; cross-device refresh; unauthorized update; invalid class/section/reason rejection with no partial writes. Backend persistence remains unverified.
