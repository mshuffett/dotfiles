# Email Triage Backtest Results

**Date:** 2025-12-29
**Model:** claude-sonnet-4-5-20250929 (upgraded from Haiku after poor results)

---

## Summary

| Issue | Haiku | Sonnet |
|-------|-------|--------|
| Misclassified as "calendar" | 4/8 | 0/8 |
| Wrong comprehension ("I'd be happy to join") | Yes | No |
| Proactive sponsor pitch | No | Yes |
| Correct link (RSVP vs calendar) | Sometimes | Usually |
| Warm/enthusiastic tone | No | Yes |

**Decision:** Upgraded to Sonnet. Cost increase ~$0.30/day, but quality is significantly better.

---

## Prompt Improvements Made

1. "calendar" category only for automated notifications, not human messages about events
2. Demo day in subject + interest -> use RSVP link, not calendar
3. Investor from fund -> proactively mention sponsor opportunities
4. When unclear -> ask clarifying question + offer call
5. Address the person directly, not the introducer
6. Short acknowledgments are valid responses
7. Warmer tone: "awesome", "crushing it", "glad you can make it"

---

## Detailed Test Cases

See original backtest file for full email thread analysis comparing Haiku vs Sonnet responses.
