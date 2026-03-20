# Report Template

The report serves two purposes:
1. **`./pr-review-report.md`** committed to the repo (with relative screenshot paths)
2. **GitHub PR comment** (with raw.githubusercontent.com screenshot URLs)

Generate the committed file first, then post a PR comment version using `gh pr comment`.

## PR Comment Format

When posting as a GitHub PR comment, convert screenshot paths:
- Committed file: `![](screenshots/name.png)`
- PR comment: `![](https://raw.githubusercontent.com/{owner}/{repo}/{branch}/screenshots/name.png)`

Use `<img width="600">` for single images, `<img width="380">` for side-by-side pairs in `<table>` elements.

## Template

Use this structure. Replace `{placeholders}` with real values. Use `<details>` for sections that aren't critical-path reading.

```markdown
## Automated PR Review

{If a UI interaction GIF was recorded, show it immediately as the hero image — NOT collapsed:}

<img src="{raw.githubusercontent.com URL to screenshots/ui-demo.gif}" width="800">

{Omit if no UI changes in the PR.}

![](https://img.shields.io/badge/issues-{N}%20found%20→%20{M}%20fixed-success?style=flat-square) ![](https://img.shields.io/badge/coverage-{before}%25%20→%20{after}%25-blue?style=flat-square) ![](https://img.shields.io/badge/tests-{count}%20added-blue?style=flat-square) ![](https://img.shields.io/badge/screenshots-{count}-purple?style=flat-square)

> [!CAUTION]
> {Most critical findings — security vulnerabilities, data loss risks. Include diff blocks showing before/after:}
> ```diff
> - {vulnerable code}
> + {fixed code}
> ```
> {Link to each file/line: [`file.ts#L26`](https://github.com/owner/repo/blob/SHA/path#L26)}

> [!WARNING]
> {Merge blockers that need human decision — auth, architecture, etc.}
> {Omit this block entirely if there are no blockers.}

<details>
<summary><strong>All issues ({remaining count} more)</strong></summary>

| Sev | Issue | Fix | Link |
|:---:|-------|-----|:----:|
| 🟠 | {high severity issue} | {fix description} | [`L##`](https://github.com/owner/repo/blob/SHA/path#L##) |
| 🟡 | {medium severity issue} | {fix description} | [`L##`](https://github.com/owner/repo/blob/SHA/path#L##) |

</details>

<details>
<summary><strong>Tests ({count} added, all passing)</strong></summary>

| Suite | Count | Coverage | Link |
|-------|:-----:|:--------:|:----:|
| {suite name} | {N} | {X}% | [`file.test.ts`](https://github.com/owner/repo/blob/SHA/path) |

</details>

### UI Verification

{One `<details>` block per user flow. Use `<img width>` for sizing and `<table>` for side-by-side comparisons.}

<details>
<summary><strong>{Flow Name}</strong></summary>

<img src="{screenshot URL}" width="600">

</details>

<details>
<summary><strong>{Flow Name}</strong></summary>

<table>
<tr>
<td align="center"><strong>{State A}</strong></td>
<td align="center"><strong>{State B}</strong></td>
</tr>
<tr>
<td><img src="{screenshot URL}" width="380"></td>
<td><img src="{screenshot URL}" width="380"></td>
</tr>
</table>

</details>
```

## Guidelines

- **Critical/security findings go above the fold** — visible without clicking anything
- **Everything else is collapsed** — don't overwhelm the reader
- **Link to actual code lines** — `https://github.com/{owner}/{repo}/blob/{SHA}/{path}#L{line}`
- **Use diff blocks** for before/after on security fixes — shows exactly what changed
- **Badges are flat-square** — cleaner than for-the-badge in a PR comment
- **Screenshots use `<img width>`** not markdown `![]()` — gives size control
- **Side-by-side screenshots use `<table>`** — `<td>` with width keeps them aligned
- **Omit sections that don't apply** — no "None" placeholders, just skip them
- **If no UI changes exist**, skip the entire UI Verification section
