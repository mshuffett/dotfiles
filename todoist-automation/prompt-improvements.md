# GTD Prompt Iteration & Improvements

**Purpose:** Track prompt versions, evaluation results, corrections, and planned enhancements for the `/gtd` command.

---

## Current Version

**v1.0** (2025-10-02)
- Initial GTD processor with Ship to Beach alignment
- Core categories: Sprint Work, Wisdom, Ideas, Backlog, Delegated, Vague, Admin
- Confidence scoring: <70% / 70-90% / 90%+
- Decision framework for uncertain tasks
- Learning capture protocol

**Status:** Alignment Phase - Building trust through corrections
**Target:** 90%+ accuracy for production deployment

---

## Version History

### v1.0 (2025-10-02) - Initial Release
**Focus:** Core GTD workflow with Ship to Beach principles

**Features:**
- 7 task categories with clear decision rules
- 5-step processing workflow
- Confidence-based decision hierarchy
- Markdown table output format
- Correction capture protocol

**Alignment Sessions:**
- Session 1: TBD - Initial batch processing
- Session 2: TBD
- Session 3: TBD

**Accuracy Tracking:**
- Session 1: TBD% (X tasks, Y corrections)
- Session 2: TBD%
- Session 3: TBD%

**Target:** 3-5 alignment sessions to reach 90%+ consistent accuracy

---

## Corrections Log

**Purpose:** Every correction is a learning opportunity. Document all user corrections here to improve the prompt.

### Session 1 (Date: TBD)

#### Correction #1
```
Task: [Task description]
My Decision: [What I proposed]
User Correction: [What user said to do instead]
Root Cause: [Why I got it wrong]
Pattern Extracted: [General rule to prevent this]
Prompt Update: [How I updated /gtd command]
```

#### Correction #2
```
[Same format]
```

### Session 2 (Date: TBD)
[Track corrections here]

---

## Evaluation Dataset (Gold Standard)

**Purpose:** Build a test set of tasks with "correct" categorizations to evaluate new prompt versions.

### Test Cases (Target: 50-100 tasks)

#### Category: Sprint Work
```json
{
  "task_id": "example1",
  "content": "Deploy Phase 1.9 to production",
  "due_date": "2025-10-03",
  "current_project": "Inbox",
  "correct_action": "keep_date_move_today",
  "correct_project": "current_sprint",
  "reasoning": "Final 20% shipping work, directly advances sprint goal"
}
```

#### Category: Wisdom/Timeless
```json
{
  "task_id": "example2",
  "content": "Read philosophy book on stoicism",
  "due_date": "2025-10-03",
  "current_project": "Inbox",
  "correct_action": "remove_date",
  "correct_project": "Inbox",
  "reasoning": "Timeless content, no urgency, not sprint-related"
}
```

#### Category: Ideas
```json
{
  "task_id": "example3",
  "content": "Build tool for automatic X",
  "due_date": "2025-10-03",
  "current_project": "Inbox",
  "correct_action": "move_remove_date",
  "correct_project": "A/Ideas 💡",
  "reasoning": "Exploration/idea, not THE ONE THING, explorer energy"
}
```

### Building the Dataset
**Method 1:** Capture from alignment sessions
- After each session, export approved decisions
- Add to test set with correct actions
- Tag with confidence level and reasoning

**Method 2:** Synthetic generation
- Create representative examples across all categories
- Include edge cases and ambiguous tasks
- Validate with Michael before adding

**Method 3:** Historical data
- Review past task processing patterns
- Extract examples with clear outcomes
- Document Michael's actual decisions

---

## Uncertainty Quantification

**Goal:** Move beyond confidence thresholds to quantitative uncertainty measurement.

### Approach 1: Embedding-Based Similarity
**Concept:** Tasks similar to gold standard should have higher confidence

```python
# Pseudocode
def calculate_confidence(task):
    # Embed task description
    task_embedding = embed(task.content)

    # Find similar tasks in gold standard
    similar_tasks = find_nearest(task_embedding, gold_standard_embeddings, k=5)

    # If all similar tasks have same category → high confidence
    if all_same_category(similar_tasks):
        return 0.95
    # If mixed categories → lower confidence
    elif majority_category(similar_tasks) > 0.6:
        return 0.75
    else:
        return 0.50
```

**Pros:** Data-driven, improves with dataset size
**Cons:** Requires embeddings, offline processing
**Status:** Future enhancement

### Approach 2: Pattern Matching Confidence
**Concept:** Track which patterns reliably predict categories

```python
# Pseudocode
patterns = {
    "timeless_keywords": {
        "patterns": ["read", "watch", "learn", "reflect", "philosophy"],
        "accuracy": 0.95,
        "category": "wisdom"
    },
    "idea_keywords": {
        "patterns": ["build", "create", "experiment", "try", "idea"],
        "accuracy": 0.88,
        "category": "ideas"
    }
}

def pattern_confidence(task):
    matches = find_matching_patterns(task.content, patterns)
    if matches:
        return max([p.accuracy for p in matches])
    return 0.60  # default low confidence
```

**Pros:** Simple, interpretable, fast
**Cons:** Manual pattern curation
**Status:** Could implement in v1.1

### Approach 3: Multi-Factor Scoring
**Concept:** Combine multiple signals for confidence

```python
def calculate_confidence(task):
    factors = {
        "pattern_match": pattern_confidence(task),
        "date_age": age_factor(task.due_date),
        "has_comments": 0.8 if task.comment_count > 0 else 0.6,
        "similar_history": similarity_to_past_decisions(task),
        "keyword_clarity": keyword_clarity_score(task)
    }

    # Weighted average
    return weighted_avg(factors, weights=[0.3, 0.2, 0.15, 0.25, 0.1])
```

**Pros:** Holistic, captures multiple dimensions
**Cons:** Weight tuning required
**Status:** Best for v2.0+

---

## Learning Loop Design

### Real-Time Learning (During Sessions)
**Goal:** Improve within a single processing session

**Approach:**
1. Process batch of tasks
2. User corrects mistakes
3. Extract pattern from correction
4. Apply pattern to remaining tasks in batch
5. Check if pattern fixes similar tasks

**Example:**
```
Batch: 20 tasks
Task 3 corrected: "read X" should remove date, not keep
Pattern: "read [anything]" → wisdom category → remove date
Apply to remaining tasks: Find 3 more "read" tasks
Confidence: 85% → 95% for those tasks
```

**Status:** Could implement in v1.1 with simple pattern extraction

### Offline Learning (Between Sessions)
**Goal:** Improve the base prompt using accumulated data

**Approach:**
1. After each session, analyze all corrections
2. Identify common patterns and edge cases
3. Update `/gtd` command with new rules
4. Test against eval dataset
5. Deploy if accuracy improves

**Example:**
```
Analysis: 12 corrections in last 3 sessions
Pattern: 8/12 were "tentative language" (maybe, consider, think about)
Rule: Add to vague category → "Tentative language = idea, not commitment"
Test: Apply to eval dataset → 92% → 96% accuracy
Deploy: Update /gtd command with new rule
```

**Status:** Manual process, can be automated later

### Prompt Versioning Strategy
**When to create new version:**
- Major rule changes (>3 new categories or decision rules)
- Significant accuracy improvement (>5% on eval set)
- New capabilities (e.g., adding uncertainty scoring)

**How to test new versions:**
1. Run against full eval dataset
2. Compare accuracy to previous version
3. Check for regressions (tasks it got worse at)
4. A/B test if unclear (use v1 for half, v2 for half)
5. Deploy if proven better

---

## Metrics to Track

### Accuracy Metrics
```
Overall Accuracy: (Correct decisions / Total tasks) × 100
Per-Category Accuracy: Track each category separately
Confidence Calibration: Do 90% confidence items actually get 90% right?
```

### Efficiency Metrics
```
Tasks Processed per Session: Target 20-30
User Corrections per Session: Target <3 (90%+ accuracy)
Time to Review: How long does user spend reviewing?
```

### Outcome Metrics
```
Tomorrow's Task Count: Before vs After (23 → 5-7 target)
Tasks Completed This Week: Are we focusing on the right things?
User Satisfaction: "Did this help you focus?"
```

### Learning Metrics
```
Patterns Extracted: How many new rules learned?
Eval Dataset Size: Growing over time?
Confidence Improvement: Are confidence scores getting more accurate?
```

---

## Integration Improvements

### Sprint Context Integration
**Idea:** Pull current sprint info from `🎯 START HERE.md` to improve categorization

```python
def load_sprint_context():
    sprint_file = read("~/ws/everything-monorepo/notes/1-Projects/🚢🏖️ Ship to Beach/🎯 START HERE.md")
    current_sprint = extract_current_sprint(sprint_file)
    sprint_tasks = extract_sprint_backlog(sprint_file)
    return {
        "focus": current_sprint,
        "tasks": sprint_tasks
    }

def is_sprint_work(task, sprint_context):
    # Check if task content relates to sprint focus
    if task_matches_sprint(task, sprint_context.focus):
        return True, 0.95
    # Check if task is in sprint backlog
    if task in sprint_context.tasks:
        return True, 0.98
    return False, 0.60
```

**Benefit:** Higher confidence on sprint vs non-sprint work
**Status:** v2.0 feature

### Todoist API Enhancements
**Idea:** Use additional Todoist data for better decisions

```python
def enhanced_task_info(task_id):
    task = fetch_task(task_id)
    comments = fetch_comments(task_id)
    activity = fetch_activity(task_id)

    return {
        "task": task,
        "comment_count": len(comments),
        "last_comment_date": max(c.posted for c in comments),
        "created_date": task.created_at,
        "last_modified": activity[-1].timestamp,
        "completed_subtasks": task.completed_subtasks_count,
        "total_subtasks": task.subtasks_count
    }
```

**Signals to use:**
- Recent comments → Still relevant
- No modifications in 30 days → Likely stale
- Has subtasks → More concrete/important
- Created recently → May be current priority

**Status:** Data available now, could use in v1.1

### UI/Output Improvements
**Idea 1:** Color-coded confidence in terminal
```bash
🟢 High (90%+): Task X → Action Y
🟡 Medium (70-90%): Task A → Action B (please review)
🔴 Low (<70%): Task M → ??? (need guidance)
```

**Idea 2:** Interactive approval
```bash
# Instead of static table, interactive prompts
Task 1/20: "Read philosophy book" (Due: Tomorrow)
Proposed: Remove date (Confidence: 95%)
[a]pprove | [e]dit | [s]kip | [q]uit
```

**Idea 3:** Batch actions by type
```
## Actions to Execute

### Remove Dates (8 tasks)
1. Read X
2. Watch Y
...

### Move to Ideas (5 tasks)
1. Build tool Z
...

Approve all? [y/n]
```

**Status:** UX improvements for v1.1+

---

## Research Questions

### Question 1: Optimal Confidence Thresholds
**Current:** <70% = ask, 70-90% = review, 90%+ = execute
**Question:** Are these the right thresholds for Michael's workflow?
**Test:** Try different thresholds, measure user friction vs accuracy

### Question 2: Category Granularity
**Current:** 7 categories (Sprint, Wisdom, Ideas, Backlog, Delegated, Vague, Admin)
**Question:** Too many? Too few? Are there overlaps or gaps?
**Test:** Track which categories are hardest to distinguish

### Question 3: Batch Size vs Accuracy
**Current:** Processing 10-20 tasks at once
**Question:** Does accuracy degrade with larger batches?
**Test:** Compare accuracy on batches of 10 vs 20 vs 30 tasks

### Question 4: Temporal Patterns
**Current:** Treating all tasks equally regardless of when created
**Question:** Do older tasks have different patterns than recent ones?
**Test:** Analyze accuracy by task age, creation date

### Question 5: Learning Curve
**Current:** Assuming 3-5 sessions to 90% accuracy
**Question:** How fast does the system actually learn?
**Test:** Track accuracy over 10+ sessions, plot learning curve

---

## Next Steps (Priority Order)

### Phase 1: Alignment (Current)
- [ ] Run 3-5 alignment sessions
- [ ] Capture corrections in this log
- [ ] Extract patterns and update /gtd
- [ ] Build eval dataset from approved decisions
- [ ] Reach 90%+ consistent accuracy

### Phase 2: Measurement (After Alignment)
- [ ] Implement pattern matching confidence (Approach 2 above)
- [ ] Track accuracy metrics per session
- [ ] Build 50-task eval dataset
- [ ] Create automated testing script
- [ ] Version the prompt (v1.1)

### Phase 3: Learning Loop (After Measurement)
- [ ] Implement real-time pattern extraction
- [ ] Add sprint context integration
- [ ] Test offline learning workflow
- [ ] A/B test prompt versions
- [ ] Deploy best-performing version

### Phase 4: Advanced Features (Future)
- [ ] Embedding-based confidence
- [ ] Multi-factor uncertainty scoring
- [ ] Interactive approval UI
- [ ] Automated prompt improvement
- [ ] Full learning loop automation

---

## Ideas Backlog (Rough Concepts)

- **Natural language actions:** "Move all philosophy tasks to someday"
- **Scheduled processing:** "Process my Todoist every Sunday at 6pm"
- **Smart batching:** "Only show me low-confidence items"
- **Explanation mode:** "Why did you categorize this as X?"
- **Template tasks:** "Create sprint task template with subtasks"
- **Delegation helper:** "Find all tasks for Michelle and check status"
- **Weekly reports:** "How many tasks processed? What patterns emerged?"
- **Integration with coach:** "Flag tasks that conflict with sprint focus"
- **Habit tracking:** "Track daily task completion patterns"
- **Energy scoring:** "Which tasks energize vs drain? (Explorer vs Operator)"

---

*This file grows with the system. Every session teaches something. Every correction makes it smarter.*

**Last Updated:** 2025-10-02 (v1.0 created)
