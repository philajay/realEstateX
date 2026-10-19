# Firebase Google Sign-In with Buyer/Seller Roles — Test Cases

| Field            | Value                                |
| ---------------- | ------------------------------------ |
| Requirements     | [`requirements.md`](./requirements.md) |
| Slug             | `firebase-google-signin-roles`       |
| Date             | `2026-10-19`                         |
| Author           | `<name>`                             |
| Requirements ver | 0.2                                  |
| Firebase project | `sdemo-5cbcd`                        |

## 1. Test strategy

- **Levels in scope:** E2E only, executed by driving a real browser with `playwright-cli` (see `.opencode/skills/playwright-cli`). Every case below maps to a concrete `playwright-cli` command sequence.
- **Out of scope:** unit and integration levels — the user selected E2E only. Firestore rules are asserted through the browser rather than through `@firebase/rules-unit-testing`, and there is no emulator suite in this iteration.
- **Environment:** the live Firebase project `sdemo-5cbcd` — no emulator. The app runs on the local dev server (`npm run dev`). A non-localhost deploy origin is needed only for NFR-010 (Q-007).
- **Execution model:** `e2e/run-e2e-auth.sh`, one case per row, each writing `rfp/firebase-google-signin-roles/evidence/<TC-ID>-<slug>.png` at the moment of assertion, on both pass and fail. The existing `e2e/run-e2e.sh` is untouched and its evidence directory is not shared.
- **Test data:**
  - **Account A** — a dedicated test Google account, first used to produce the "first sign-in" document. Sign in as `buyer`.
  - **Account B** — a second test Google account, used for the "another user reads this document" rule case (TC-SEC-004) and to seed a `seller` document.
  - **Seeded document** — one `users/{uid}` document created ahead of time by Account B, so the returning-sign-in path (TC-USR-005) does not depend on test ordering.
- **The Google popup — resolved, with a correction.** `signInWithPopup` opens `accounts.google.com` in a new browser context, and Google blocks sign-in from a default automated browser with *"This browser or app may not be secure"*. The confirmed workaround is a **persistent profile with a one-time manual login**:
  1. `playwright-cli -s=auth open --headed --profile=.playwright/auth-profile` — a human completes the Google sign-in once, by hand.
  2. Every later run reopens with the same `--profile=` flag. There is no second step.
  3. `.playwright/auth-profile/` must be gitignored — it holds a live Google session.

  > **Correction, found during execution.** `state-save` / `state-load` does **not** work for Firebase. Playwright's `storageState` captures cookies and `localStorage` only, and Firebase Auth persists its session in **IndexedDB**. A session saved with `state-save` and restored into a fresh browser comes back signed out — measured, not assumed (see TC-USR-011). The persistent profile is the only mechanism that carries the Firebase session, because it is a real user-data directory. Do not reintroduce `state-save`.

  - The popup is a separate window, so cases drive it with `tab-list` → `tab-select <n>` → act → `tab-select 0`.
  - In headed mode the human sees the popup directly and does not need the tab commands at all.
  - **If the persistent profile fails to get past Google's block, stop.** The sign-in cases cannot be automated and must be run manually. Record the outcome against Q-014 rather than marking cases skipped.
- **Entry/exit criteria:** the app boots against `sdemo-5cbcd` with no console errors, a persistent auth profile exists, and every Must-priority FR has an executed case. Exit requires zero open Critical/High defects and zero unexplained failures.
- **Coverage ratio per requirement:** every FR has at least one happy-path case; FRs with a state machine (FR-004 to FR-007), a persistence rule (FR-009 to FR-011), or a failure mode (FR-019 to FR-021) also carry boundary, negative, and error/recovery cases.

### Reading and writing Firestore from the browser

**Resolved: option D — do it from the browser, no service account and no console.**

The wide-open rules decision (BR-008) is what makes this possible. With no `match` condition on `users/{uid}`, the Firestore REST API answers **unauthenticated** requests, so the test harness can read and write the real documents straight from the page — no service account key, no `firebase` CLI, no credential added to the repo, and no human staring at the console.

`playwright-cli run-code` gives a `page` handle, so a whole assertion is one command:

```bash
# list every user document (unauthenticated — wide-open rules)
playwright-cli -s=auth run-code "async page => page.evaluate(async () => {
  const r = await fetch('https://firestore.googleapis.com/v1/projects/sdemo-5cbcd/databases/(default)/documents/users?pageSize=100');
  const j = await r.json();
  return (j.documents || []).map(d => ({ name: d.name.split('/').pop(), ...d.fields }));
})"

# read one document
playwright-cli -s=auth run-code "async page => page.evaluate(async () => {
  const r = await fetch('https://firestore.googleapis.com/v1/projects/sdemo-5cbcd/databases/(default)/documents/users/<uid>');
  return r.status === 200 ? await r.json() : 'DENIED:' + r.status;
})"

# write one field
playwright-cli -s=auth run-code "async page => page.evaluate(async () => {
  await fetch('https://firestore.googleapis.com/v1/projects/sdemo-5cbcd/databases/(default)/documents/users/<uid>?updateMask.fieldPaths=role', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { role: { stringValue: 'seller' } } })
  });
})"
```

**No app code changes are required for this** — it is a property of the wide-open rules, which is exactly why locking the rules down (Q-014) will break these test cases. That is a known and accepted trade-off for a POC; whoever tightens the rules must rewrite this section first.

Each case below uses `readDoc` / `writeField` helpers built from the three commands above. The UID is resolved by listing the collection and matching the test account's email, so cases never hardcode it.

One caveat: `serverTimestamp()` values come back as Firestore `timestampValue` strings, so compare them as strings rather than `Date` objects.

## 2. Traceability matrix

Every FR and NFR from `requirements.md` must appear here.

| Req ID | Test cases | Notes |
| ------ | ---------- | ----- |
| FR-001 | TC-CFG-001, TC-SEC-006 | Asserts the app's project id, not the SDK internals |
| FR-002 | TC-ENT-001 | Replaces the homepage placeholder sign-in link — Q-006 |
| FR-003 | TC-ENT-002, TC-NEG-011 | Exactly two options; no third role — Q-009 |
| FR-004 | TC-ROL-001, TC-ROL-002 | |
| FR-005 | TC-ROL-003, TC-ROL-004, TC-NEG-008 | Radio semantics |
| FR-006 | TC-ROL-005, TC-ROL-006 | BR-001 |
| FR-007 | TC-AUTH-001, TC-AUTH-006, TC-NEG-001, TC-NEG-002 | Popup tab handling; blocked by Google's automation check — Q-014 |
| FR-008 | TC-AUTH-002 | |
| FR-009 | TC-USR-001 | Needs the Q-015 harness decision |
| FR-010 | TC-USR-002, TC-USR-003, TC-USR-004 | BR-003 |
| FR-011 | TC-USR-005, TC-USR-006 | BR-004 |
| FR-012 | TC-USR-007, TC-SEC-009 | BR-002 |
| FR-013 | TC-HDR-001, TC-HDR-002 | Fallback path needs a Google account with no display name |
| FR-014 | TC-HDR-003, TC-HDR-004 | Both badge labels asserted |
| FR-015 | TC-HDR-005 | |
| FR-016 | TC-OUT-001, TC-OUT-002 | |
| FR-017 | TC-USR-010 | BR-005 |
| FR-018 | TC-HDR-006 | Asserts the role reaches the UI layer, not the token |
| FR-019 | TC-NEG-003, TC-NEG-004, TC-NEG-005 | |
| FR-020 | TC-NEG-006 | Cancellation must not read as failure |
| FR-021 | TC-USR-008, TC-NEG-007 | |
| FR-022 | TC-ROL-007 | |
| FR-023 | TC-USR-011, TC-REL-003 | Profile survives a fresh browser context — Firestore is the source of truth, not local storage |
| NFR-001 | TC-PERF-001 | 3 s budget was not fixed by the user — see Q-016 |
| NFR-002 | TC-SEC-002 | Repo grep plus gitignore assertion |
| NFR-003 | TC-SEC-003, TC-SEC-004, TC-SEC-005, TC-SEC-010 | **POC decision:** these cases assert wide-open access, i.e. they confirm the exposure exists rather than that it is blocked — see BR-008 and Q-014 |
| NFR-004 | TC-SEC-007 | |
| NFR-005 | TC-A11Y-001, TC-A11Y-002, TC-A11Y-003 | |
| NFR-006 | TC-REL-001, TC-REL-002 | |
| NFR-007 | TC-RESP-001, TC-RESP-002 | |
| NFR-008 | TC-MNT-001 | Structural, read-only |
| NFR-009 | TC-CFG-002, TC-CFG-003 | Missing-config path needs env vars deliberately unset |
| NFR-010 | TC-SEC-008 | Needs a deploy origin — Q-007 |

## 3. Functional test cases

### Header entry point

| TC ID | Req ID | Title | Type | Priority | Preconditions | Steps | Expected result |
| ----- | ------ | ----- | ---- | -------- | ------------- | ----- | --------------- |
| TC-ENT-001 | FR-002 | Sign-in entry point visible when signed out | Happy | Must | App loaded, no session | `goto` the app root → `find "Sign in"` → `snapshot` | The header contains one interactive sign-in control; the role options are **not** yet on the page |
| TC-ENT-002 | FR-003 | Sign-in surface offers exactly two roles | Happy | Must | Signed out | Click the sign-in entry point → `snapshot` → count `role="radio"` nodes | Exactly two role options render, labelled `Buy` and `Sell`; neither is selected yet |

### Role selection

| TC ID | Req ID | Title | Type | Priority | Preconditions | Steps | Expected result |
| ----- | ------ | ----- | ---- | -------- | ------------- | ----- | --------------- |
| TC-ROL-001 | FR-004 | Buyer role can be selected | Happy | Must | Sign-in surface open | Click `Buy` → `snapshot` | `Buy` becomes selected; the sign-in button becomes enabled |
| TC-ROL-002 | FR-004 | Seller role can be selected | Happy | Must | Sign-in surface open | Click `Sell` → `snapshot` | `Sell` becomes selected; the sign-in button becomes enabled |
| TC-ROL-003 | FR-005 | Selecting seller clears buyer | Boundary | Must | `Buy` selected | Click `Sell` → `eval` the checked state of both options | Exactly one option is selected; `Buy` is deselected |
| TC-ROL-004 | FR-005 | Selecting buyer clears seller | Boundary | Must | `Sell` selected | Click `Buy` → `eval` the checked state of both options | Exactly one option is selected; `Sell` is deselected |
| TC-ROL-005 | FR-006 | Sign-in button disabled with no role | Negative | Must | Sign-in surface open, nothing selected | `eval "getByRole('button',{name:/sign in with google/i}).disabled"` | Returns `true`; attempting to click does not open a popup |
| TC-ROL-006 | FR-006 | Sign-in button enabled after selection | Happy | Must | Sign-in surface open, nothing selected | Click `Buy` → `eval` the button's disabled state | Returns `false` |
| TC-ROL-007 | FR-022 | Role selection resets on reload | Edge | Should | Role selected, still signed out | `reload` → `snapshot` | Both role options are unselected and the sign-in button is disabled again |

### Google sign-in

| TC ID | Req ID | Title | Type | Priority | Preconditions | Steps | Expected result |
| ----- | ------ | ----- | ---- | -------- | ------------- | ----- | --------------- |
| TC-AUTH-001 | FR-007 | Google popup opens and completes | Happy | Must | Role selected; persistent auth profile loaded (`state-load`) | Click `Sign in with Google` → `tab-list` → `tab-select` the Google tab | The Google chooser opens in a new tab; after the account is granted the popup closes and the header becomes the signed-in state |
| TC-AUTH-002 | FR-008 | Auth state change re-renders without reload | Happy | Must | Account A signed in | `eval "performance.getEntriesByType('navigation').length"` → `snapshot` | Exactly one navigation entry — no page reload occurred; the header shows the signed-in controls |
| TC-AUTH-006 | FR-007 | Google is the only provider offered | Boundary | Must | Sign-in surface open | `snapshot` → list every button on the surface | Only `Sign in with Google` exists; no email/password, phone, or other provider control |

### Signed-in header

| TC ID | Req ID | Title | Type | Priority | Preconditions | Steps | Expected result |
| ----- | ------ | ----- | ---- | -------- | ------------- | ----- | --------------- |
| TC-HDR-001 | FR-013 | Display name shown when the account has one | Happy | Must | Account A signed in | `snapshot` the header | The header shows the Google display name, not the email address |
| TC-HDR-002 | FR-013 | Email shown when the account has no display name | Edge | Must | Signed in as an account whose Google profile has no name | `snapshot` the header | The header shows the email address; no empty name element renders |
| TC-HDR-003 | FR-014 | Buyer badge shown | Happy | Must | Account A signed in as buyer | `find "Buyer"` | A `Buyer` role badge is visible in the header |
| TC-HDR-004 | FR-014 | Seller badge shown | Happy | Must | Account B signed in as seller | `find "Seller"` | A `Seller` role badge is visible; the `Buyer` badge is absent |
| TC-HDR-005 | FR-015 | Sign-out control present | Happy | Must | Any user signed in | `snapshot` the header | Exactly one sign-out control renders |
| TC-HDR-006 | FR-018 | Role reaches the UI layer | Happy | Must | Account B signed in as seller | `eval` the header's role badge text, and `eval` a role value exposed by the app | The badge reads `Seller` and the value the app exposes matches the stored role |

### User document in Firestore

| TC ID | Req ID | Title | Type | Priority | Preconditions | Steps | Expected result |
| ----- | ------ | ----- | ---- | -------- | ------------- | ----- | --------------- |
| TC-USR-001 | FR-009 | Document is read before any write | Happy | Must | A UID with no document | Sign in → `requests` / `console` shows the Firestore read | A read of `users/{uid}` occurs before any write to that path |
| TC-USR-002 | FR-010 | First sign-in creates the document | Happy | Must | Account A, no existing document | Sign in as buyer → `run-code` `readDoc` by email | The document exists and contains `email`, `displayName`, `photoURL`, `role`, `createdAt`, `lastLoginAt` |
| TC-USR-003 | FR-010 | Stored role matches the selection | Happy | Must | Account A, no existing document | Select `Sell` on a fresh account, sign in → `readDoc` | `role` is exactly `seller` |
| TC-USR-004 | FR-010 | `createdAt` is a Firestore server timestamp | Happy | Must | Document just created | `readDoc` | `createdAt` is a server-assigned `timestampValue`, not a client clock value |
| TC-USR-005 | FR-011 | Returning sign-in preserves the stored role | Boundary | Must | Account A already has `role: buyer` | Sign out, reload, select `Sell`, sign back in as Account A → `readDoc` | `role` is still `buyer`; the second selection is discarded (BR-004) |
| TC-USR-006 | FR-011 | Returning sign-in updates only `lastLoginAt` | Boundary | Must | Same as TC-USR-005 | `readDoc` before and after, diff the fields | `createdAt` and `role` are identical; only `lastLoginAt` advanced |
| TC-USR-007 | FR-012 | Document ID equals the UID | Happy | Must | Document exists | Read the UID from the signed-in session, compare with the `readDoc` path segment | The path segment matches the UID exactly |
| TC-USR-008 | FR-021 | Firestore write failure surfaces and is retryable | Error | Should | Firestore made unreachable (`route "**/firestore.googleapis.com/**" --status=503`) | Sign in as a UID with no document → `snapshot` | The user stays signed in, an error is shown with a retry affordance; on `unroute` and retry, `readDoc` returns the document |
| TC-USR-010 | FR-017 | Sign-out leaves the document intact | Happy | Must | Account A has a document | `readDoc` → sign out → `readDoc` again → diff | The document is unchanged; nothing deleted |
| TC-USR-011 | FR-023 | Profile persists outside the browser | Edge | Must | Account A signed in with a stored document | `close` the session → `open` a **fresh** browser against the same `--profile=` → `goto` the app → `readDoc` | The header shows the same name and role badge — the profile came from Firestore, not from local storage. **Note: `state-load` cannot substitute for the persistent profile here — see the correction in §1.** |

### Sign out

| TC ID | Req ID | Title | Type | Priority | Preconditions | Steps | Expected result |
| ----- | ------ | ----- | ---- | -------- | ------------- | ----- | --------------- |
| TC-OUT-001 | FR-016 | Sign out returns to the signed-out state | Happy | Must | Any user signed in | Click sign out → `snapshot` | The header shows the sign-in entry point again; the role badge, name, and sign-out control are all gone |
| TC-OUT-002 | FR-016 | Sign out does not silently re-authenticate | Negative | Must | Just signed out | `reload` → `snapshot` | Still signed out; `onAuthStateChanged` fires with `null` and does not restore the session |

## 4. Negative & edge cases

| TC ID | Req ID | Scenario | Expected result |
| ----- | ------ | -------- | --------------- |
| TC-NEG-001 | FR-007 | `Sign in with Google` clicked twice rapidly | The Google popup opens once; the button is disabled while authenticating; no duplicate `users/{uid}` writes |
| TC-NEG-002 | FR-007 | Popup blocked by the browser (`auth/popup-blocked`) | An error message naming the blocked popup is shown; the visitor stays signed out; the role selection survives so one click retries |
| TC-NEG-003 | FR-019 | Network failure during sign-in (`route` the Identity Toolkit endpoint to 503) | An error message is shown; no session is created; no user document is written |
| TC-NEG-004 | FR-019 | Credential conflict (`auth/account-exists-with-different-credential`) | The error is surfaced as readable text, not a raw error code; the visitor stays signed out |
| TC-NEG-005 | FR-019 | Firebase Auth reachable but misconfigured (`auth/operation-not-allowed`) | A clear message tells the user the Google provider is not enabled on `sdemo-5cbcd`; the app does not crash to a blank screen |
| TC-NEG-006 | FR-020 | The Google popup is closed without granting access (`auth/popup-closed-by-user`) | **No error message**; the visitor remains signed out; this is treated as a cancellation, not a failure |
| TC-NEG-007 | FR-021 | Firestore returns `unavailable` mid-write | The user remains signed in (NFR-006); the document is either fully written or absent — never a partial one |
| TC-NEG-008 | FR-005 | Both role options clicked within the same frame | The final state has exactly one selected role; the UI never shows both selected |
| TC-NEG-011 | FR-003 | Inspecting the sign-in surface for any third role option | Only `Buy` and `Sell` exist; no `Broker`, `Admin`, or `Both` control is rendered |

## 5. Non-functional test cases

| TC ID | Req ID | Category | Check | Pass criteria |
| ----- | ------ | -------- | ----- | ------------- |
| TC-PERF-001 | NFR-001 | Performance | `eval` the timestamp when the signed-in header first appears, relative to the moment the popup closes | Under 3 s — budget not confirmed by the user, see Q-016 |
| TC-SEC-002 | NFR-002 | Security | `grep -r "AIza\|VITE_FIREBASE\|apiKey"` over the tracked source, and read `.gitignore` | No Firebase key literal in committed source; the env file that holds it is ignored |
| TC-SEC-003 | NFR-003 | Security | Signed out, `run-code` a `readDoc` fetch against `users/{uid}` | **POC behaviour:** the read succeeds — no `permission-denied`. Recorded as known exposure, not a pass-worthy control |
| TC-SEC-004 | NFR-003 | Security | Signed in as Account B, `readDoc` Account A's document | **POC behaviour:** the read succeeds and Account B sees Account A's `role` and email. This is the exposure Q-014 must close |
| TC-SEC-005 | NFR-003 | Security | Signed in as Account B, `writeField` `role: "seller"` to Account A's document | **POC behaviour:** the write succeeds; `readDoc` confirms Account A's `role` changed. If this ever fails, someone has tightened the rules and Q-014 should be closed. **Restore Account A's original role before the run ends.** |
| TC-SEC-010 | NFR-003 | Security | Record the current rule state so any accidental tightening is noticed | The rules are wide open for the POC; if a future change denies access, TC-SEC-003 to TC-SEC-005 flip from pass to fail and flag it |
| TC-SEC-006 | FR-001 | Configuration | `requests` → inspect the Firebase project id sent to Identity Toolkit | The request targets project `sdemo-5cbcd` |
| TC-SEC-007 | NFR-004 | Security | Search the built bundle for `firebase-admin`, `service_account`, or a private key | None present in the client bundle |
| TC-SEC-008 | NFR-010 | Deployability | Run the sign-in flow from the deployed origin rather than `localhost` | Sign-in succeeds — fails with `auth/operation-not-supported-in-this-environment` if the origin is not an authorised domain |
| TC-SEC-009 | FR-012 | Security | Sign in twice as the same Google account, then list the `users` collection via the REST fetch | Exactly one document exists for that UID — no duplicate profile is created (BR-002) |
| TC-A11Y-001 | NFR-005 | Accessibility | `press Tab` from the top of the sign-in surface | Focus reaches `Buy`, then `Sell`, then `Sign in with Google`, in that order, with a visible focus indicator |
| TC-A11Y-002 | NFR-005 | Accessibility | `press Space` on a focused role option | The option becomes selected — role selection is operable without a mouse |
| TC-A11Y-003 | NFR-005 | Accessibility | `snapshot` the role group | The options expose radio semantics (`role="radio"` inside `role="radiogroup"`, or equivalent native radios), so selected state is announced; the sign-in button has an accessible name |
| TC-REL-001 | NFR-006 | Reliability | Firestore unreachable during sign-in | The user stays authenticated; the session survives; the error is retryable |
| TC-REL-002 | NFR-006 | Reliability | After a successful sign-in, `reload` | The user is still signed in and the role badge still renders |
| TC-REL-003 | FR-023 | Reliability | `localstorage-list` and `sessionstorage-list` after sign-in, then `reload` | The profile and role are **not** stored in browser storage — they are re-read from Firestore on load |
| TC-RESP-001 | NFR-007 | Responsive | `resize 360 740` → `eval "document.documentElement.scrollWidth > innerWidth"` | Returns `false` — no horizontal scroll at 360 px |
| TC-RESP-002 | NFR-007 | Responsive | At 360 px, complete a full sign-in | Role cards, the sign-in button, and the signed-in header are all visible and clickable without zooming |
| TC-MNT-001 | NFR-008 | Maintainability | Read the auth module source | `initializeApp`, `signInWithPopup`, and the profile read/write live outside any component file, in one module |
| TC-CFG-001 | FR-001 | Configuration | App boots with valid env vars | No `auth/invalid-api-key` or `auth/operation-not-supported-in-this-environment` error in `console` |
| TC-CFG-002 | NFR-009 | Configuration | Boot the app with the `VITE_FIREBASE_*` vars unset | A clear, visible message explains the missing configuration; no blank screen and no unhandled rejection |
| TC-CFG-003 | NFR-009 | Configuration | Boot the app with valid env vars | The app renders normally — the missing-config path did not persist |

## 6. BDD scenarios

```gherkin
Feature: Google sign-in with a buyer or seller role
  As a visitor to the real-estate site
  I want to sign in with Google and declare whether I am a buyer or a seller
  So that the site knows who I am and what I am here to do

  Scenario: First sign-in as a buyer
    Given I am signed out and on the home page
    When I open the sign-in surface and select "Buy"
    And I complete the Google popup as a new Google account
    Then I am signed in without a page reload
    And the header shows my name and a "Buyer" badge
    And a document exists at users/{my uid} with role "buyer"

  Scenario: First sign-in as a seller
    Given I am signed out and on the home page
    When I open the sign-in surface and select "Sell"
    And I complete the Google popup as a new Google account
    Then the header shows a "Seller" badge
    And a document exists at users/{my uid} with role "seller"

  Scenario: A role must be chosen before the popup opens
    Given I have opened the sign-in surface
    And I have not selected a role
    Then the "Sign in with Google" button is disabled

  Scenario: Only one role can be selected at a time
    Given I selected "Buy"
    When I select "Sell"
    Then only "Sell" is selected

  Scenario: Returning user keeps the role from their first sign-in
    Given I signed in earlier as a buyer
    And I sign out
    When I select "Sell" and sign in again with the same Google account
    Then my stored role is still "buyer"
    And my createdAt has not changed
    And only lastLoginAt was updated

  Scenario: Cancelling the Google popup is not an error
    Given I selected "Buy"
    When I open the Google popup and close it without granting access
    Then no error message is shown
    And I am still signed out

  Scenario: A blocked popup is reported clearly
    Given I selected "Buy"
    When the browser blocks the Google popup
    Then an error message tells me the popup was blocked
    And I am still signed out
    And my "Buy" selection is still in place so I can retry in one click

  Scenario: A Firestore failure does not sign me out
    Given Firestore is unreachable
    When I complete the Google popup
    Then I remain signed in
    And an error offers me a retry

  Scenario: Signing out leaves my profile alone
    Given I am signed in with a stored profile
    When I sign out
    Then I am shown the signed-out header
    And my document still exists unchanged

  Scenario: Another user can read my profile — known POC exposure
    Given I am signed in as user A with a stored profile
    And user B is signed in in another session
    When user B attempts to read user A's document
    Then Firestore allows the read and returns user A's role and email
    And this is recorded as the known POC exposure that Q-014 must close

  Scenario: My profile follows me to another browser
    Given I signed in on one browser and my profile was written to Firestore
    When I open a completely different browser with no local storage and sign in as the same account
    Then the same name and role badge appear
    And the profile came from Firestore, not from the first browser

  Scenario: Missing configuration fails loudly
    Given the VITE_FIREBASE environment variables are not set
    When the app loads
    Then a clear message explains what is missing
    And the app does not render a blank screen
```

## 7. Not directly testable

| Req ID | Why | How it will be verified |
| ------ | --- | ----------------------- |
| BR-008 | The requirement is that rules are **wide open**. The REST calls below prove one user can read another's document, but no browser test can prove the *absence* of every possible restriction | Read `firestore.rules` and confirm it imposes no `match` condition on `users/{uid}`. Re-run TC-SEC-003 to TC-SEC-005 after any rules change |
| BR-004 | Immutability of `role` is enforced by the app's read-then-write logic, not by Firestore rules — and with wide-open rules nothing stops a third party from editing the field | Verified indirectly by TC-USR-005; true enforcement needs the owner-only rules Q-014 will introduce |
| Q-008 (custom claims) | Whether the role later becomes a token claim is undecided; no requirement exists to test yet | Re-open as a new RFP once decided |

## 8. Open questions

| ID    | Question | Blocks |
| ----- | -------- | ------ |
| Q-001 | Confirm the collection is named `users` | TC-USR-002 to TC-USR-007 |
| Q-002 | Can a user switch role after first sign-in? Draft says no (BR-004) | TC-USR-005, TC-USR-006 |
| Q-007 | Which deploy origin will host the app, so its authorised domain can be registered? | TC-SEC-008 |
| Q-014 | **Open and important.** Wide-open rules mean anyone on the internet can read and rewrite every `users/{uid}` document — including real users' emails and roles. When does this get locked down, and what triggers it? | TC-SEC-003 to TC-SEC-005, TC-SEC-010 |
| Q-015 | ~~How does the harness assert Firestore contents?~~ **Answered:** read and written from the browser over the unauthenticated Firestore REST API. No service account, no CLI, no console. | — | Closed |
| Q-016 | Is 3 s the right sign-in budget, and should the measurement start at popup-open or popup-close? | TC-PERF-001 |
| Q-012 | Which Google accounts, and where are their credentials stored? `.playwright/auth-profile` and `.playwright/auth-state.json` hold a live session and must be gitignored | Every sign-in case |
| Q-013 | Owner name for the header tables | — |

**Resolved:** the Google popup uses a persistent profile with a one-time manual login; Firestore is read and written from the browser over the unauthenticated REST API.
