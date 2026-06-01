# PR Review: User Profile Page + API Route

**Branch:** `feat/user-profile`
**Base:** `main`
**Date:** 2026-03-18
**Files:** `src/app/api/profile/route.ts`, `src/components/UserProfile.tsx`

---

## Summary

This PR adds a user profile display/edit component and a Next.js API route for GET/PUT operations on user profiles. The original code contained **4 critical/high security vulnerabilities**, **2 runtime crash bugs**, and multiple quality issues. All fixable issues have been resolved; authentication remains as a blocking issue requiring architectural decisions.

**Verdict: Do not merge until authentication is added to the API route.**

---

## Issues Found and Fixed

### Critical: SQL Injection (3 locations)

**File:** `src/app/api/profile/route.ts`

The original code interpolated user input directly into SQL strings in three places:

```ts
// GET handler
WHERE id = '${userId}'

// PUT handler (UPDATE)
SET name = '${body.name}', email = '${body.email}', bio = '${body.bio}' WHERE id = '${body.userId}'

// PUT handler (re-fetch SELECT)
WHERE id = '${body.userId}'
```

**Fix:** All three queries now use parameterized placeholders (`$1`, `$2`, etc.) with values passed as the second argument to `db.query`/`db.execute`. The `DbClient` interface already supports this.

### Critical: XSS via `dangerouslySetInnerHTML`

**File:** `src/components/UserProfile.tsx`

The original code rendered user-supplied `bio` as raw HTML:
```tsx
<div dangerouslySetInnerHTML={{ __html: profile.bio }} />
```

An intermediate fix applied `escapeHtml()` before passing to `dangerouslySetInnerHTML`. While technically safe, this is fragile -- removing the escape call re-opens the vulnerability.

**Fix:** Replaced entirely with plain text rendering: `<p>{profile.bio}</p>`. React auto-escapes text content. Added `whitespace-pre-wrap` to preserve line breaks. Removed the unused `escapeHtml` import.

### Critical (NOT FIXED): No Authentication

**File:** `src/app/api/profile/route.ts`

Both GET and PUT handlers have no authentication check. Any anonymous caller can read or modify any user's profile by supplying an arbitrary `userId`.

**Status:** Left as TODO comments. This requires a project-level decision on auth mechanism (next-auth, JWT middleware, session cookies). **Must be resolved before production deployment.**

### High: Runtime Crash on Optional `socialLinks`

**File:** `src/components/UserProfile.tsx`

`socialLinks` is typed as optional but accessed unconditionally: `profile.socialLinks.twitter`. When `socialLinks` is `undefined`, this throws a TypeError and crashes the component.

**Fix:** Guard with `{profile.socialLinks && (...)}` and render each link only when its URL is truthy.

### High: No Server-Side Input Validation

**File:** `src/app/api/profile/route.ts` (PUT handler)

The PUT handler accepted any payload without validation -- empty names, invalid emails, missing fields.

**Fix:** Added validation: name required (non-empty after trim), email required with format check (reusing `isValidEmail` from `@/lib/utils`), bio defaults to empty string. Name and email are trimmed before saving.

### Medium: No Error Handling on Fetch

**File:** `src/components/UserProfile.tsx`

The `useEffect` fetch had no try/catch and did not check `res.ok`. A failed request would try to use error response data as a profile.

**Fix:** Added try/catch, `res.ok` check, error state, and a cleanup function to prevent state updates after unmount (race condition when `userId` changes rapidly).

### Medium: No JSON Parse Error Handling

**File:** `src/app/api/profile/route.ts` (PUT handler)

`request.json()` throws on malformed input. Without a catch, the endpoint returns an unhelpful 500.

**Fix:** Wrapped in try/catch, returning 400 with `"Invalid JSON body"`.

### Low: Broken Avatar Image

`avatarUrl` is optional but used directly as `<img src>`. **Fix:** Fallback to `DEFAULT_AVATAR`.

### Low: Cancel Does Not Reset Form

Cancelling edit left modified values in state. **Fix:** `handleCancel` resets `formData` to current profile values and clears errors.

### Low: No Save Loading State

Users could double-click Save. **Fix:** Added `isSaving` state; Save shows "Saving...", both buttons disabled during request.

### Low: Missing Accessibility

Form inputs had no labels; errors had no `role="alert"`; email used `type="text"`. **Fix:** Added sr-only `<label>` elements, `role="alert"` on error containers, `type="email"` on email input.

### Low: External Links Missing `rel`

Social links lacked `rel="noopener noreferrer"`. **Fix:** Added to all external link anchors.

### Low: `userId` Not URL-Encoded

Special characters in `userId` could break the fetch URL. **Fix:** `encodeURIComponent(userId)`.

---

## Test Coverage

### Component Tests (`src/components/__tests__/UserProfile.test.tsx`) -- 24 tests

- **Loading:** Shows loading indicator
- **Display:** Renders profile data, avatar (with fallback for undefined and empty string), social links (present/undefined/partial), `rel` attribute, XSS prevention (raw HTML rendered as text, no script injection, no parsed HTML elements), whitespace preservation in bio
- **Errors:** Non-ok response, network throw, `role="alert"` accessibility
- **Edit mode:** Enter/exit, pre-fill, Cancel resets form data, Cancel clears validation errors, accessible labels, email input type
- **Validation:** Empty name, empty email, invalid email, no API call when validation fails
- **Save:** Success flow with data verification, error display from server response, "Saving..." state with disabled buttons
- **URL encoding:** `encodeURIComponent` on userId

### API Route Tests (`src/app/api/profile/__tests__/route.test.ts`) -- 14 tests

- **GET:** Missing userId (400), not found (404), success (200), camelCase key mapping, SQL injection prevention (parameterized query verified)
- **PUT:** Missing userId (400), empty name (400), whitespace-only name (400), invalid email (400), missing email (400), malformed JSON (400), success with parameterized execute, input trimming, null bio default, 404 after update if user disappears, SQL injection prevention

### Coverage Gaps

- Authentication/authorization flows (blocked on implementation)
- Rate limiting (no middleware exists)
- CSRF protection on PUT
- Concurrent edit conflicts (no optimistic locking)

---

## Files Modified

| File | Changes |
|---|---|
| `src/components/UserProfile.tsx` | Removed `dangerouslySetInnerHTML` (XSS fix), added `isSaving`, `handleCancel`, `useEffect` cleanup, form validation, error handling, accessibility labels, `rel` attributes, avatar fallback, URL encoding |
| `src/components/__tests__/UserProfile.test.tsx` | 24 tests covering all component behavior |
| `src/app/api/profile/__tests__/route.test.ts` | 14 tests covering API validation, parameterization, edge cases |

Note: `src/app/api/profile/route.ts` had already been partially fixed (parameterized queries, validation) by a prior review pass. The API tests were extended with additional edge cases.
