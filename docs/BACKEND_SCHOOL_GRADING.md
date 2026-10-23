# REMALJ grading policy - 23 October 2026

Apply this school-requested nine-point scale to final weighted totals out of 100:

| Marks | Grade | Remarks |
| --- | --- | --- |
| 80–100 | 1 | Highly Proficient |
| 75–79 | 2 | Proficient |
| 65–74 | 3 | Approaching Proficient |
| 60–64 | 4 | Developing |
| 55–59 | 5 | Emerging |
| 50–54 | 6 | Average |
| 40–49 | 7 | Pass |
| 36–39 | 8 | Weak |
| 0–35 | 9 | Fail |

Use lower thresholds for decimal scores: 79.99 is grade 2; 80 is grade 1. Validate finite totals in 0–100. Do not round across a threshold unless a separate approved rounding policy is agreed. Missing exams must remain incomplete, not grade 9; an explicitly recorded zero is grade 9.

Frontend schoolGrading.js defines min/max/grade/remarks bands; PUT /api/v1/academic/settings now submits them as gradingBands with gradingSystem `REMALJ 9-Point Proficiency Scale`. Verify the deployed schema accepts this shape and persists it. The score sheet shows an explicitly unsaved preview; saved official grades/remarks still come from the server. Recompute on save/publication using the persisted policy, and return consistent grade/remarks in results, sheet detail and terminal report APIs. Version and audit the policy. Agree an audited regrade of existing approved results rather than silently rewriting historical grades. Preschool G/S/B/X/O and Creche remarks are separate templates and must not use this scale.
