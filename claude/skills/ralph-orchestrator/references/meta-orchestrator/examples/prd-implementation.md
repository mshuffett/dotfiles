# Meta-Orchestrator Configuration

## Task Specification
Implement the Canvas collaborative writing tool from specs/prd.md.

The PRD describes:
- Yjs-based document model with blocks, actors, subscriptions
- Tiptap editor with y-prosemirror binding
- Chat panel with AI actors
- Two-pane layout (chat + document)

## Approaches

| Name | Config/Script | Port | Description |
|------|--------------|------|-------------|
| ralph | ./approach-1-ralph/run.sh | 3001 | Hat-based orchestration |
| e2e-loop | ./approach-4-e2e-loop/run.sh | 3004 | E2E verification loop |
| better-prompt | ./approach-2-better-prompt/run.sh | 3002 | Enhanced system prompt |

## Grading Rubric

### Categories (120 points max)

| Category | Max | How to Verify | Scoring |
|----------|-----|---------------|---------|
| Data Model | 25 | `grep -r "Y.Map\|Y.Array" src/` | 25: all maps (meta,blocks,chat,actors). 15: partial. 0: none |
| Subscriptions | 15 | `grep -r "SubscriptionManager\|subscribe" src/` | 15: manager class. 8: basic subscriptions. 0: none |
| Actors | 20 | `grep -r "ChatActor\|EditObserver\|EditorSuggestion" src/` | 20: all 3 actors. 10: 1-2 actors. 0: none |
| Serialization | 10 | `grep -r "serializeToXML\|toXML" src/` | 10: XML serializer. 5: partial. 0: none |
| UI/UX | 20 | `grep -r "useEditor\|Tiptap" src/` + browser check | 20: Tiptap + two-pane. 10: Tiptap only. 0: textarea |
| Code Quality | 10 | `pnpm lint && pnpm typecheck` | 10: passes. 5: warnings only. 0: errors |
| Testing | ±10 | `pnpm test 2>&1 \| grep -c "✓\|passed"` | +10: >50 tests. +5: 10-50. 0: <10. -5: tests fail |
| Runtime | 10 | `curl localhost:PORT` + manual check | 10: works first run. 5: works after fix. 0: broken |

### Critical Requirements (Pass/Fail Gates)
These must ALL pass for the approach to be considered viable:

- [ ] Uses Tiptap with `useEditor` hook (NOT textarea fallback)
- [ ] Has y-prosemirror for Yjs↔Tiptap binding
- [ ] At least 10 tests exist and pass
- [ ] Dev server starts and shows app (not default Next.js page)

If any critical requirement fails, cap total score at 50 regardless of category scores.

## Target Score
**100 points** (83% of max 120)

## Settings
- **Max iterations:** 5
- **Approach timeout:** 30 minutes each
- **Base port:** 3001
