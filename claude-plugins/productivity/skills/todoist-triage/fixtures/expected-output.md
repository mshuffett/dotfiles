# Expected Output for Sample Export

This shows the expected Notion markdown output for the tasks in `sample-export.json`.

**User ID**: 486423 (Michael)

## Filtering Results

From the 10 sample tasks:
- **Excluded** (assigned to others):
  - "Tweak the Luma event page with michael" (assignee: 48532968 = Evelisa)
- **Included** (9 tasks):
  - 7 unassigned tasks (assignee_id: null)
  - 2 tasks assigned to Michael (assignee_id: 486423)

## Expected Notion Output

```markdown
**Source**: Todoist Triage Export
**Date**: December 7, 2025
**Total Tasks**: 8 (excluded 1 assigned to others)
Process each task: Move to PPV Action Items, complete, or delete.

## 📥 Inbox / Uncategorized (6)
<callout icon="📥">
	- [ ] **Get the Notion Todoist Sync Integration Fixed**
</callout>
<callout icon="📥">
	- [ ] **Check Compose AI Email**
</callout>
<callout icon="📥">
	- [ ] **pair down credit cards and anything that is taking too much time if it doesn't translate to my goals / okrs etc**
</callout>
<callout icon="📥">
	- [ ] **When I upgraded to ultimate through a trial and a code I didn't have my unlimited limits until I logged out and logged back in again on the evelisa@compose.ai account**
</callout>
<callout icon="📥">
	- [ ] **Discuss cash flow / income affordances**
	How much are they paying now for nanny
	I know there hasn't been a ledger to date but should we create one?
	We want to get a house and need to pay debt now so how can we fairly allocate for that vs pool and such?
	We have about 80K + 20K in debt and need to cover that. What can be helped with? Can we get that as part of next asset sales and such?
</callout>
<callout icon="📥">
	- [ ] **📄 [Pilot Agreed] Draft simple pilot contract**
	Create a straightforward agreement outlining scope, deliverables, and payment terms for the k pilot for AgelessRx.
</callout>

## 🏷️ #Review (2)
<callout icon="🏷️">
	- [ ] **i put my gratitude notes directly into the fields and it didnt register it**
</callout>
<callout icon="🏷️">
	- [ ] **APPROVE transfer of $1,840 to Compose (remaining balance from the apartment loan)**
	*Due: 2025-12-08*
	Ref: [FINAL 2025 Compose Proposal](https://www.notion.so/composeai/FINAL-2025-Compose-Proposal-2a9577f82e2880968778db3ad614cfcb)
</callout>

## 📋 Other (1)
<callout icon="📋">
	- [ ] **REVIEW Max's profile (founder looking for Engineering work) - YC Recommended**
	[Account | Y Combinator](https://bookface.ycombinator.com/posts/95974)
</callout>
```

## Validation Criteria

1. **Filtering**: Task "Tweak the Luma event page with michael" should NOT appear (assigned to Evelisa)
2. **Descriptions**: Tasks with descriptions should have them displayed below the title
3. **Labels**: Tasks with "Review" or "review" label should be in #Review section
4. **Due dates**: "APPROVE transfer" should show due date 2025-12-08
5. **Links in descriptions**: Should be preserved as markdown links
6. **Counts**: Section counts should match actual filtered tasks

## Notes

- The sample uses 10 tasks; real triage may have 100+
- Comments are not included in this sample (would require separate API calls)
- Project names would need lookup from projects API
