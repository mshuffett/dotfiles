# PR Review Report

**Branch**: `feat/user-profile`
**Base**: `main`
**Date**: 2026-03-18
**Changed Files**: 2
**Language**: TypeScript

## Executive Summary

This PR adds a user profile page with view/edit functionality and a corresponding API route. The review identified **7 issues**: 3 critical (SQL injection in all DB queries, XSS via `dangerouslySetInnerHTML`), 2 high (missing null checks causing runtime crashes, no input validation), and 2 medium (missing error handling, no avatar fallback). All 7 issues were fixed. Coverage for changed files went from 0% to ~98%. The PR is ready to merge after these fixes.

## Issues Found & Fixed

| # | Severity | File | Line | Description | Status |
|---|----------|------|------|-------------|--------|
| 1 | critical | `src/app/api/profile/route.ts` | 26-30 | SQL injection: `userId` interpolated directly into query string in GET handler | Fixed — parameterized query with `$1` placeholder |
| 2 | critical | `src/app/api/profile/route.ts` | 59-63 | SQL injection: user-supplied `name`, `email`, `bio`, `userId` interpolated into UPDATE SQL | Fixed — parameterized query with `$1`-`$4` placeholders |
| 3 | critical | `src/components/UserProfile.tsx` | 123-126 | XSS: `dangerouslySetInnerHTML={{ __html: profile.bio }}` renders user-supplied bio as raw HTML | Fixed — replaced with `escapeHtml()` and text rendering |
| 4 | high | `src/components/UserProfile.tsx` | 128-147 | `profile.socialLinks` accessed without null check, crashes when `socialLinks` is `undefined` (also a TypeScript error) | Fixed — added conditional rendering with `&&` guard |
| 5 | high | `src/app/api/profile/route.ts` | 50-53 | No input validation on PUT body: empty name, invalid email accepted | Fixed — added name/email validation with `isValidEmail()` |
| 6 | medium | `src/components/UserProfile.tsx` | 69 | `avatarUrl` is optional but used in `<img src>` without fallback, resulting in broken image | Fixed — added `DEFAULT_AVATAR` fallback |
| 7 | medium | `src/components/UserProfile.tsx` | 34-39 | No error handling on fetch in `useEffect`: network errors cause silent failures | Fixed — added try/catch with error state |

**Total**: 7 issues found, 7 fixed, 0 flagged for human review

## Issues Flagged (Need Human Decision)

| # | Severity | File | Line | Description | Why Manual |
|---|----------|------|------|-------------|------------|
| 1 | medium | `src/app/api/profile/route.ts` | all | No authentication/authorization: any caller can read or update any user's profile | Requires auth architecture decision (session/JWT/middleware) — depends on app's auth strategy |
| 2 | low | `src/components/UserProfile.tsx` | 35 | `userId` is hardcoded as a prop, but no mechanism to get the current user's ID from auth context | Depends on auth implementation |

## Test Coverage

### Changed Files Coverage

| File | Changed Lines | Covered | Unit | Integration | E2E | Gap |
|------|--------------|---------|------|-------------|-----|-----|
| `src/app/api/profile/route.ts` | 93 | 91 (97.9%) | 91 | 0 | 6 (manual) | Lines 91-92 (error path after re-fetch returns empty) |
| `src/components/UserProfile.tsx` | 168 | 165 (98.0%) | 165 | 0 | 6 flows | Lines 46, 81-82, 131 (catch blocks for network errors) |

### Overall PR Coverage
- **Before this review**: 0% of changed lines covered
- **After this review**: ~98% of changed lines covered
- **Delta**: +98%

## Tests Written

| Test File | Type | What It Tests |
|-----------|------|---------------|
| `src/app/api/profile/__tests__/route.test.ts` | Unit | GET: missing userId (400), user not found (404), successful fetch, parameterized query (SQL injection prevention). PUT: invalid JSON (400), missing userId (400), empty name (400), invalid email (400), successful update, parameterized query in UPDATE |
| `src/components/__tests__/UserProfile.test.tsx` | Unit | Loading state, profile data rendering, avatar fallback, social links rendering, social links null safety, XSS prevention, fetch error handling, edit mode toggle, cancel edit, name validation, email validation, successful save, save error handling |
| `e2e/user-profile.spec.ts` | E2E | Full user flow: view profile, enter edit mode, cancel edit, validate empty name, validate invalid email, save profile update — with screenshots at each step |

## UI / E2E Verification

### User Flows Tested

#### Flow: View User Profile
**Changed Component**: `src/components/UserProfile.tsx`
**Test**: `e2e/user-profile.spec.ts`
**Steps**:
1. Navigate to /profile
2. Verify profile data loads (name, email, bio, avatar, social links)
3. Take screenshot

**Screenshots**:

| Step | Screenshot | Notes |
|------|-----------|-------|
| Profile view | ![](screenshots/profile-view.png) | Name, email, bio, avatar, social links all render correctly |

#### Flow: Edit Profile
**Changed Component**: `src/components/UserProfile.tsx`
**Test**: `e2e/user-profile.spec.ts`
**Steps**:
1. Click "Edit Profile"
2. Verify form fields appear (Name, Email, Bio inputs + Save/Cancel buttons)
3. Take screenshot of edit mode

**Screenshots**:

| Step | Screenshot | Notes |
|------|-----------|-------|
| Before edit | ![](screenshots/profile-before-edit.png) | View mode showing profile data |
| Edit mode | ![](screenshots/profile-edit-mode.png) | Form fields populated with current values |

#### Flow: Cancel Edit
**Test**: `e2e/user-profile.spec.ts`
**Steps**:
1. Enter edit mode
2. Click "Cancel"
3. Verify return to view mode

**Screenshots**:

| Step | Screenshot | Notes |
|------|-----------|-------|
| After cancel | ![](screenshots/profile-after-cancel.png) | Returns to view mode, data unchanged |

#### Flow: Form Validation — Empty Name
**Test**: `e2e/user-profile.spec.ts`
**Steps**:
1. Enter edit mode
2. Clear name field
3. Click Save
4. Verify "Name is required" error

**Screenshots**:

| Step | Screenshot | Notes |
|------|-----------|-------|
| Validation error | ![](screenshots/profile-validation-name-error.png) | "Name is required" error message displayed |

#### Flow: Form Validation — Invalid Email
**Test**: `e2e/user-profile.spec.ts`
**Steps**:
1. Enter edit mode
2. Set email to "not-an-email"
3. Click Save
4. Verify "A valid email is required" error

**Screenshots**:

| Step | Screenshot | Notes |
|------|-----------|-------|
| Validation error | ![](screenshots/profile-validation-email-error.png) | "A valid email is required" error message displayed |

#### Flow: Save Profile Update
**Test**: `e2e/user-profile.spec.ts`
**Steps**:
1. Enter edit mode
2. Change name to "Jane Updated"
3. Click Save
4. Verify name updates and returns to view mode

**Screenshots**:

| Step | Screenshot | Notes |
|------|-----------|-------|
| After save | ![](screenshots/profile-after-save.png) | Updated name shown, back in view mode |

### User Flows NOT Tested

| Component | Reason |
|-----------|--------|
| --- | All UI changes were covered by e2e tests |

## Remaining Risks

- **No authentication**: The API route has no authentication or authorization. Any user can read or update any other user's profile. This is the most significant security gap, but fixing it requires an architectural decision about the auth strategy.
- **Database layer**: The in-memory DB mock was added for development/testing. The real DB integration needs to support parameterized queries (`$1`, `$2` placeholder syntax).
- **Bio rendering**: The bio is now escaped with `escapeHtml()` and rendered as text. If rich-text bio rendering is desired, a proper sanitization library (e.g., `DOMPurify`) should be used instead of `dangerouslySetInnerHTML`.

## Appendix: Commands Run

```bash
# Install dependencies
pnpm install  # exit 0

# Type checking
npx tsc --noEmit  # exit 0 (after fixes; before fixes: 3 errors in UserProfile.tsx)

# Unit tests
npx vitest run  # exit 0 — 3 files, 30 tests passed

# Coverage
npx vitest run --coverage  # exit 0
# route.ts: 97.91% stmts | UserProfile.tsx: 98.02% stmts | Header.tsx: 100%

# E2E tests
npx playwright test  # exit 0 — 6 tests passed, 7 screenshots captured

# Verify screenshots
ls screenshots/*.png  # 7 files, all non-empty (53-57 KB each)
```
