# Email Triage Corrections

User feedback on misclassifications. These corrections are included in the classifier prompt as few-shot examples.

---

## Correction: 2025-12-29 20:15
- **Email**: From Michelle Soriano <michelle@compose.ai> re: Quick Reminders – Unofficial YC W26
- **Got**: noise (80%)
- **Should be**: action because this is from YC (startup accelerator) with specific action items and deadlines. Anything from YC partners or related to the YC program should be treated as urgent or action, never noise.
- **Rule to add**: Emails containing "YC", "Y Combinator", or from YC-related contacts (compose.ai, ycombinator.com) with action items should be categorized as action or urgent, not noise.
