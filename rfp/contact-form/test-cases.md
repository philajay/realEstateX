# Contact Form (Enquiry Capture) — Test Cases

| Field            | Value                                            |
| ---------------- | ------------------------------------------------ |
| Requirements     | [`requirements.md`](./requirements.md)           |
| Slug             | `contact-form`                                   |
| Date             | `2026-10-19`                                     |
| Author           | `<name>`                                         |
| Requirements ver | 0.2                                              |

## 1. Test strategy

- **Levels in scope:** **E2E only** — driven through a real Chromium browser with `playwright-cli`, against the running app. Chosen by the user. No unit or integration suites are written here.
- **Out of scope:**
  - Unit tests of validation functions — no unit-test framework exists in this repo.
  - Firestore security-rule tests via the emulator — no emulator is set up.
  - Any test of an admin surface — none ships in this iteration (Q-011).
  - Deliverability of any admin notification — none ships in this iteration (Q-005).
- **Environment:** local Vite dev server (`npm run dev`) on the loopback origin, live Firebase project `sdemo-5cbcd`. **No sign-in is required to exercise this feature** (BR-004), so no Google account is needed for the majority of cases.
- **Test data:**
  - **Visitor** — a plain signed-out browser session. One additional run is needed signed in, for TC-ACC-004 only.
  - **Fixture enquiry** — created by the test itself, with a unique message string per run (for example a run marker) so a specific document can be identified without relying on a seeded database. Runs never delete or mutate another run's record.
  - **Newsletter state** — the footer's subscribe box, observed only to confirm the contact form leaves it untouched (TC-PRV-004).
- **Persistence verification (Q-007, decided).** The app has no read path for enquiries (BR-008), so a test cannot prove a document was written by looking at the UI. Storage cases read the collection through the **Firestore REST API with a service account supplied via environment variables** — never committed, never typed into the repo. A service-account key path (`GOOGLE_APPLICATION_CREDENTIALS`) plus `FIREBASE_PROJECT_ID` is the minimum the suite needs. The Firebase console remains the fallback for a manual look.
- **Entry/exit criteria:**
  - Entry — dev server up, Firebase env vars present, service-account credentials present in the environment for the storage cases.
  - Exit — every `Must` case has a verdict of Pass, Fail, or **Blocked**, and every `Blocked` case names the open question blocking it; no case is silently skipped.
- **Evidence convention:** `evidence/<TC ID>-<slug>.png`, one screenshot per executed case. Cases that cannot run get an entry in `evidence/SKIPPED.md` naming the blocking question.

## 2. Traceability matrix

Every FR and NFR from `requirements.md` must appear here.

| Req ID | Test cases | Notes |
| ------ | ---------- | ----- |
| FR-001  | TC-ACC-001 | `/contact` serves the form |
| FR-002  | TC-ACC-002 | Header link reaches the form |
| FR-003  | TC-FRM-001 | Exactly the three agreed fields |
| FR-004  | TC-A11Y-001 | Every field has an associated label |
| FR-005  | TC-ACC-003 | Signed-out visitor submits with no sign-in |
| FR-006  | TC-ACC-004, TC-SUB-007 | No identity stored, signed-in and anonymous identical |
| FR-007  | TC-FRM-002, TC-FRM-003, TC-FRM-004 | Empty and whitespace-only block the save |
| FR-008  | TC-FRM-005, TC-FRM-006 | Email format rejected / accepted; boundary awaits Q-002 |
| FR-009  | TC-FRM-007 | The offending field is named and marked |
| FR-010  | TC-SUB-001, TC-SUB-002 | One document, server-generated ID |
| FR-011  | TC-SUB-003, TC-FRM-008 | Stored values match the typed values, trimmed |
| FR-012  | TC-SUB-004 | `submittedAt` is server-assigned |
| FR-013  | TC-STA-001 | Confirmation replaces the form |
| FR-014  | TC-SUB-007, TC-SUB-008 | Every submitted field is persisted in full, and `status` is `new` |
| FR-015  | TC-STA-002, TC-SUB-005 | Control disabled in flight; no double document |
| FR-016  | TC-ERR-001, TC-ERR-002 | Failure surfaces; values retained |
| FR-017  | TC-PRV-001 | No enquiry readable on any public surface |
| FR-018  | TC-PRV-002, TC-PRV-003 | Independent of listings; no listings grid on `/contact` |
| FR-019  | TC-PRV-004 | Newsletter state untouched |
| FR-020  | TC-SUB-006 | Identical submissions are both stored |
| FR-021  | TC-REG-001, TC-REG-002 | Home and `/sell` unchanged |
| FR-022  | TC-FRM-009, TC-FRM-010 | Maximum lengths; oversize refused, never truncated |
| FR-023  | TC-ERR-004 | A stalled write releases the control and claims nothing |
| NFR-001 | TC-RSP-001 | 360 px, no horizontal scroll |
| NFR-002 | TC-A11Y-001, TC-A11Y-002, TC-A11Y-003 | Names, keyboard operation, announced errors |
| NFR-003 | TC-SEC-001, TC-SEC-002 | Credential and Admin SDK scans |
| NFR-004 | TC-ERR-003, TC-ERR-002 | No success state on failure; nothing cleared |
| NFR-005 | — | Not directly testable — see §7; recorded blocker, not a pass/fail behaviour |
| NFR-006 | — | Not directly testable — see §7; the policy it needs does not exist yet (Q-009) |
| NFR-007 | — | Not directly testable — see §7; structural, verified by code review |
| NFR-008 | TC-CFG-001 | Clear message when Firebase config is absent |
| NFR-009 | TC-STA-003 | One click, one outcome, one visible state change |

## 3. Functional test cases

### Access and anonymity

| TC ID      | Req ID  | Title                                                       | Type | Priority | Preconditions              | Steps                                                                                                    | Expected result |
| ---------- | ------- | ----------------------------------------------------------- | ---- | -------- | -------------------------- | ------------------------------------------------------------------------------------------------------- | --------------- |
| TC-ACC-001 | FR-001  | `/contact` serves the contact form                          | E2E | Must     | Dev server running; signed out | 1. Navigate directly to `/contact`.                                                                 | The contact page renders with a contact form. It is a real page, not a redirect to the listings homepage. |
| TC-ACC-002 | FR-002  | The header `Contact` link reaches the form                  | E2E | Must     | Dev server running; signed out | 1. Open the home route.<br>2. Click the `Contact` link in the header.                                              | The contact page renders with the form. The link does not land on the listings homepage. |
| TC-ACC-003 | FR-005  | A signed-out visitor submits with no sign-in                | E2E | Must     | Dev server running; signed out | 1. Open `/contact`.<br>2. Fill all three fields.<br>3. Submit.<br>4. Observe whether any sign-in prompt or redirect occurred. | The submission succeeds without a sign-in prompt, redirect, or modal. The visitor sees the confirmation. |
| TC-ACC-004 | FR-006  | A signed-in visitor's submission carries no identity         | E2E | Must     | Signed in with any role     | 1. Open `/contact` and submit a valid enquiry while signed in.<br>2. Read the stored document.<br>3. Compare with the same submission made from a signed-out session. | Neither document carries a UID, session token, email of the signed-in account, or any other identity field. The two documents are identical in shape. |

### Form and validation

| TC ID      | Req ID  | Title                                                       | Type | Priority | Preconditions              | Steps                                                                                                    | Expected result |
| ---------- | ------- | ----------------------------------------------------------- | ---- | -------- | -------------------------- | ------------------------------------------------------------------------------------------------------- | --------------- |
| TC-FRM-001 | FR-003  | The form exposes exactly three fields                        | E2E | Must     | Dev server running; signed out | 1. Open `/contact`.<br>2. Inspect the form controls.                                                                 | Name, email, and message are present. No phone, subject, or file-upload control exists. |
| TC-FRM-002 | FR-007  | Submitting an untouched form is refused                      | E2E | Must     | Dev server running; signed out | 1. Open a fresh `/contact` form.<br>2. Click submit without typing anything.                                                                 | The submission is refused, the empty required fields are named, and nothing is written to Firestore. |
| TC-FRM-003 | FR-007  | Each required field blocks the save on its own                | E2E | Must     | Dev server running; signed out | 1. Fill all three fields except one.<br>2. Submit.<br>3. Repeat for each field in turn.                                                                       | Every single omission is refused and names its own field. The enquiry count does not increase in any iteration. |
| TC-FRM-004 | FR-007  | Whitespace-only counts as empty                               | E2E | Must     | Dev server running; signed out | 1. Fill all fields except one, with spaces or tabs only in that field.<br>2. Submit.<br>3. Repeat per field.                                                    | Each whitespace-only field is treated as empty, exactly as in TC-FRM-003. Nothing is written. |
| TC-FRM-005 | FR-008  | An unusable email address is refused                         | E2E | Must     | Dev server running; signed out | 1. Fill name and message.<br>2. Set email to a value missing an `@`.<br>3. Submit.                                                                               | The submission is refused with the error on the email field. Nothing is written. |
| TC-FRM-006 | FR-008  | A normal email address is accepted                            | E2E | Must     | Dev server running; signed out | 1. Fill all three fields with ordinary values including a conventional email address.<br>2. Submit.<br>3. Read the stored document.                                       | The submission is accepted and the email is stored as typed. **Boundary forms** — plus-addressing, sub-domains, unusual but legal addresses — wait on Q-002 for the exact rule before being asserted. |
| TC-FRM-007 | FR-009  | The error names the offending field                           | E2E | Must     | Dev server running; signed out | 1. Fill everything except the message.<br>2. Submit.                                                                                                                | The message field is visibly marked and its own error is shown, rather than one generic failure message. |
| TC-FRM-008 | BR-005  | Stored values are trimmed, inner spacing is preserved          | E2E | Must     | Dev server running; signed out | 1. Fill each field with leading and trailing spaces plus deliberate double inner spacing.<br>2. Submit.<br>3. Read the stored document.                                  | The stored strings have no leading or trailing whitespace, and the inner double spacing is exactly as typed. |
| TC-FRM-009 | FR-022  | A value over its maximum length is refused                    | E2E | Must     | Dev server running; signed out | 1. Fill the form with a name over 100 characters, then submit.<br>2. Repeat with an email over 254 characters.<br>3. Repeat with a message over 2000 characters.<br>4. Read the collection after each attempt. | Each oversize submission is refused with an error naming that field and its limit. Nothing is written in any iteration. |
| TC-FRM-010 | FR-022  | A value at exactly its maximum length is accepted            | E2E | Must     | Dev server running; signed out | 1. Fill the name with exactly 100 characters and a valid email and message.<br>2. Submit.<br>3. Read the stored document.                                                        | The submission succeeds and the stored name is the full 100 characters, not truncated to a shorter value. |

### Submission and storage

> The cases in this section read the stored document through the REST verification path in §1. Every case creates its own enquiry and never touches another run's record.

| TC ID      | Req ID  | Title                                                       | Type | Priority | Preconditions              | Steps                                                                                                    | Expected result |
| ---------- | ------- | ----------------------------------------------------------- | ---- | -------- | -------------------------- | ------------------------------------------------------------------------------------------------------- | --------------- |
| TC-SUB-001 | FR-010  | A valid submission creates exactly one document              | E2E | Must     | Dev server running; signed out | 1. Record the enquiry count.<br>2. Fill all three fields with a unique marker value.<br>3. Submit.<br>4. Read the collection.                                       | The count increased by exactly one, and the new document carries the marker value. |
| TC-SUB-002 | FR-010, BR-003 | The document ID is server-generated                    | E2E | Must     | Dev server running; signed out | 1. Submit an enquiry.<br>2. Read the created document.<br>3. Inspect the request the client made.                                                                     | The client submits no ID of its own; the server assigns one. Nothing in the page source or network payload supplies an enquiry ID. |
| TC-SUB-003 | FR-011  | The stored values are the typed values                      | E2E | Must     | Dev server running; signed out | 1. Submit an enquiry with distinct values in each field.<br>2. Read the created document.<br>3. Compare field by field.                                              | `name`, `email`, and `message` equal what the visitor typed, modulo the trimming in TC-FRM-008. Nothing is dropped or substituted. |
| TC-SUB-004 | FR-012  | `submittedAt` is server-assigned                            | E2E | Must     | Dev server running; signed out | 1. Submit an enquiry.<br>2. Read the created document.<br>3. Compare the timestamp with the browser clock.                                                           | A submission timestamp is present and is a Firestore server-assigned timestamp, not a browser-clock string. |
| TC-SUB-005 | FR-015, BR-007 | A second click creates no second document             | E2E | Must     | Dev server running; signed out | 1. Fill a valid form.<br>2. Double-click submit.<br>3. Press submit again while the write is in flight.<br>4. Read the collection.                                   | Exactly one document exists. The submit control is disabled for the duration of the write. |
| TC-SUB-006 | FR-020, BR-005 | Identical repeat submissions are both stored          | E2E | Should   | Dev server running; signed out | 1. Submit an enquiry.<br>2. Submit a byte-identical enquiry again.<br>3. Read the collection.<br>4. Compare the two documents.                                             | Two separate documents exist with distinct server-generated IDs and identical field values. No de-duplication occurs. |
| TC-SUB-007 | FR-014, FR-006 | The document holds every submitted detail, and nothing identifying | E2E | Must | Dev server running; signed out | 1. Submit an enquiry.<br>2. Read the created document in full, listing every field present.                                                                           | Every value the visitor submitted is present and readable, so an admin surface can display all details. No UID, email of a signed-in account, IP, or user agent is present. |
| TC-SUB-008 | BR-011 | The stored document starts life as `new`              | E2E | Must     | Dev server running; signed out | 1. Submit an enquiry.<br>2. Read the created document.                                                                                                           | `status` is exactly `new`, and the document carries no other field beyond the ones listed in requirements §10. |

### States

| TC ID      | Req ID  | Title                                                       | Type | Priority | Preconditions              | Steps                                                                                                    | Expected result |
| ---------- | ------- | ----------------------------------------------------------- | ---- | -------- | -------------------------- | ------------------------------------------------------------------------------------------------------- | --------------- |
| TC-STA-001 | FR-013  | Success is confirmed and the form is replaced                | E2E | Must     | Dev server running; signed out | 1. Submit a valid enquiry.<br>2. Observe the page after the write resolves.                                                                                     | A confirmation is shown in place of the form. The submit control is no longer present. |
| TC-STA-002 | FR-015  | A submitting state is visible while the write is in flight    | E2E | Must     | Dev server running; slow or throttled network | 1. Fill a valid form.<br>2. Throttle the network so the write is slow.<br>3. Click submit and observe mid-flight.                                            | The submit control is disabled and the form indicates it is sending. The visitor cannot trigger a second submission. |
| TC-STA-003 | NFR-009 | One click produces one visible outcome                         | E2E | Should   | Dev server running; signed out | 1. Fill a valid form.<br>2. Click submit once.<br>3. Watch the page until it settles.                                                                              | Exactly one state change follows that click — one confirmation. No duplicate confirmation, no flickering error, no second write. |

### Errors

| TC ID      | Req ID  | Title                                                       | Type | Priority | Preconditions              | Steps                                                                                                    | Expected result |
| ---------- | ------- | ----------------------------------------------------------- | ---- | -------- | -------------------------- | ------------------------------------------------------------------------------------------------------- | --------------- |
| TC-ERR-001 | FR-016  | A failed write shows an error                                | E2E | Must     | Dev server running; Firestore reachable to the client but write failing | 1. Fill a valid form.<br>2. Cause the write to fail (block the request or deny it in rules).<br>3. Observe the page.                                | An error message is shown that tells the visitor the enquiry was not sent. |
| TC-ERR-002 | FR-016, NFR-004 | A failed write retains everything typed                | E2E | Must     | Dev server running; write failing | 1. Fill all three fields with distinctive values.<br>2. Cause the write to fail.<br>3. Inspect the form fields afterwards.                                        | Every field still holds what the visitor typed. Nothing was cleared, and no success state appeared. |
| TC-ERR-003 | NFR-004 | Retrying after a failure stores exactly one document          | E2E | Must     | Dev server running; failure then recovery | 1. Cause the first write to fail.<br>2. Restore the write path.<br>3. Click submit again without retyping.<br>4. Read the collection.                             | The retry succeeds, exactly one document exists, and it holds the originally typed values. |
| TC-ERR-004 | FR-023, BR-012 | A write that stalls releases the control            | E2E | Must     | Dev server running; Firestore endpoint answering with a persistent error | 1. Fill a valid form.<br>2. Cause the write to be rejected without settling (a 403 on the Firestore endpoint reproduces this — the SDK retries it indefinitely).<br>3. Wait longer than the documented bound.<br>4. Inspect the page. | The submit control is enabled again. The banner says the message may still be on its way — it does not claim the message was sent and does not claim it was lost. Every typed value is still in the form. |

### Privacy, isolation, and regression

| TC ID      | Req ID  | Title                                                       | Type | Priority | Preconditions              | Steps                                                                                                    | Expected result |
| ---------- | ------- | ----------------------------------------------------------- | ---- | -------- | -------------------------- | ------------------------------------------------------------------------------------------------------- | --------------- |
| TC-PRV-001 | FR-017  | No enquiry is readable on any public surface                | E2E | Must     | Dev server running; at least one enquiry exists | 1. Submit an enquiry with a unique marker in its message.<br>2. Visit the home route, `/sell`, and the footer.<br>3. Search the rendered page for the marker.     | The marker appears nowhere. No enquiry content is rendered to any visitor, on any surface. |
| TC-PRV-002 | FR-018  | A listings error does not block the contact form             | E2E | Must     | Dev server running; listings fetch failing | 1. Cause the listings fetch to fail.<br>2. Open `/contact`.<br>3. Fill and submit the form.                                                                         | The contact form renders and submits normally. The listings failure neither hides nor disables it. |
| TC-PRV-003 | FR-018  | `/contact` does not render the listings grid                 | E2E | Must     | Dev server running; listings present | 1. Open `/contact`.<br>2. Inspect the page for property cards or the listings empty state.                                                                           | No listings grid, no property cards, and no listings empty state appear on the contact page. |
| TC-PRV-004 | FR-019  | Contact submit leaves newsletter state untouched             | E2E | Must     | Dev server running; signed out | 1. Open a page containing the footer's newsletter box.<br>2. Note its state.<br>3. Submit a contact enquiry with the same email.<br>4. Return to the footer.                                   | The newsletter box is unchanged and shows no subscription confirmation caused by the contact form. |
| TC-REG-001  | FR-021  | The home route is unchanged                                  | E2E | Should   | Dev server running | 1. Open the home route.<br>2. Check the header, listings, and footer.                                                                                                  | The home route renders exactly as before. Nothing from the contact form leaks into it. |
| TC-REG-002  | FR-021  | The `/sell` route is unchanged                                | E2E | Should   | Dev server running; signed out | 1. Open `/sell`.<br>2. Check the surface that renders.                                                                                                                 | The seller route behaves as before. The contact form is not injected into it. |

## 4. Negative & edge cases

| TC ID      | Req ID  | Scenario                                                       | Expected result |
| ---------- | ------- | -------------------------------------------------------------- | --------------- |
| TC-FRM-002 | FR-007  | Nothing typed at all, submit clicked | Refused; the required fields are named; nothing written |
| TC-FRM-003 | FR-007  | Exactly one required field omitted | Refused; that specific field is named; nothing written |
| TC-FRM-004 | FR-007  | A field filled with spaces or tabs only | Treated as empty; refused; nothing written |
| TC-FRM-005 | FR-008  | Email missing an `@` | Refused with the error on the email field; nothing written |
| TC-FRM-009 | FR-022  | A field over its maximum length | Refused with a message naming the limit; nothing written |
| TC-FRM-010 | FR-022  | A field at exactly its maximum length | Accepted and stored in full |
| TC-SUB-006 | FR-020  | The same enquiry submitted twice | Two documents stored; no de-duplication |
| TC-SUB-005 | BR-007  | Submit double-clicked and pressed again mid-write | Exactly one document; control disabled in flight |
| TC-ERR-001 | FR-016  | Firestore rejects the write | An error is shown; the visitor is not told it succeeded |
| TC-ERR-002 | NFR-004 | Write fails after the visitor typed everything | Every typed value is still in the form |
| TC-ERR-003 | NFR-004 | Failure, then retry | One document with the originally typed values |
| TC-ERR-004 | FR-023 | Firestore keeps rejecting the write | The control comes back and the message claims neither success nor failure |
| TC-PRV-001 | FR-017  | Visitor searches public pages for another visitor's enquiry text | Not found anywhere |

## 5. Non-functional test cases

| TC ID      | Req ID  | Category         | Check                                                                  | Pass criteria |
| ---------- | ------- | ---------------- | ---------------------------------------------------------------------- | ------------- |
| TC-A11Y-001 | NFR-002, FR-004 | Accessibility | Every control on `/contact` has an accessible name                     | The accessibility snapshot lists name, email, and message each with a non-empty accessible name bound to its control |
| TC-A11Y-002 | NFR-002 | Accessibility  | The form is fully operable by keyboard only                           | Tab reaches all three fields and the submit control; submitting via keyboard works exactly as by mouse |
| TC-A11Y-003 | NFR-002 | Accessibility  | Validation errors are announced                                       | After a refused submission, the error for each offending field is present in the accessibility tree and associated with its input |
| TC-RSP-001  | NFR-001 | Responsive      | `/contact` at 360 px wide                                              | No horizontal scroll; all three fields and the submit control are reachable and usable |
| TC-SEC-001  | NFR-003 | Security        | Repository scan for committed credentials                             | No API key, service account, or Admin SDK credential is added to source control for this feature |
| TC-SEC-002  | NFR-003 | Security        | Production bundle scan for the Admin SDK                              | The client bundle contains no `firebase-admin` import and no service-account material |
| TC-CFG-001  | NFR-008 | Configuration   | Contact form behaviour when Firebase env vars are absent               | The visitor sees a clear message that the contact form is unavailable, not a silent no-op and not a raw SDK error |

## 6. BDD scenarios

```gherkin
Feature: Contact enquiry capture
  As a visitor to the site
  I want to send my details and a message through a contact form
  So that my enquiry is recorded without me having to write an email myself

  Scenario: A signed-out visitor sends an enquiry
    Given I am not signed in
    When I open /contact
    Then I see fields for name, email, and message
    When I fill all three fields and submit
    Then one enquiry is stored with my name, my email, my message, and a submission timestamp
    And I see a confirmation instead of the form

  Scenario: A required field is left empty
    Given I am on the contact form
    When I fill everything except the message and submit
    Then the message field is marked and its error is shown
    And no enquiry is stored

  Scenario: A field contains only whitespace
    Given I am on the contact form
    When I fill everything except the name, using spaces only in the name, and submit
    Then the submission is refused as if the name were empty
    And no enquiry is stored

  Scenario: The email address is unusable
    Given I am on the contact form
    When I fill everything except a usable email address and submit
    Then the email field is marked and its error is shown
    And no enquiry is stored

  Scenario: A field is longer than the limit
    Given I am on the contact form
    When I fill everything with a message longer than the allowed limit and submit
    Then the message field is marked and its error names the limit
    And no enquiry is stored

  Scenario: The visitor submits twice in a row
    Given I have filled the contact form with valid details
    When I click submit twice quickly
    Then exactly one enquiry is stored
    And the submit control is disabled while the write is in flight

  Scenario: The write never settles
    Given I have filled the contact form with valid details
    And the write to Firestore is rejected repeatedly without settling
    When I submit and wait
    Then the send control becomes available again
    And I am told my message may still be on its way, and not that it failed
    And every field still holds what I typed

  Scenario: The write fails
    Given I have filled the contact form with valid details
    And the write to Firestore fails
    When I submit
    Then I see an error telling me the enquiry was not sent
    And every field still holds what I typed
    And no success state is shown

  Scenario: An enquiry is private
    Given a visitor has submitted an enquiry containing a unique marker phrase
    When another visitor browses the home page, the seller surface, and the footer
    Then the marker phrase appears nowhere on any page

  Scenario: The form is separate from the newsletter box
    Given I am on a page containing the footer's newsletter box
    When I submit a contact enquiry using the same email address
    Then the newsletter box shows no subscription confirmation caused by that submission
```

## 7. Not directly testable

| Req ID | Why | How it will be verified |
| ------ | --- | ----------------------- |
| NFR-005 | The requirement is "Firestore rules must allow anonymous create and block update and delete". The rules do not exist yet and no emulator is configured, so a browser test can only observe the *absence* of an error, not the correctness of the rule. | Written by a human and reviewed; an emulator rule test is the follow-up once an emulator exists. Tracked as a release blocker in `requirements.md` Q-013. |
| NFR-006 | Consent copy and a retention period do not exist yet (Q-009), so there is nothing to assert against. | Product decision, then a copy and configuration review. |
| NFR-007 | The requirement is about code structure — Firestore calls living in one module. A browser cannot see module boundaries. | Code review of `src/lib/contact.js`. |

## 8. Open questions

| ID    | Question | Blocks |
| ----- | -------- | ------ |
| Q-008 | What anti-spam control applies to this public anonymous write path? | No automated case can be written until one is chosen — App Check, a rate limit, and a honeypot each need their own cases |
| Q-009 | How long are enquiries retained before deletion? | The consent line covers purpose; retention has no test and no product rule yet |
| Q-013 | The drafted `firestore.rules` still need review and deployment. | NFR-005 in §7 |
| Q-002 | Email rule is now fixed in BR-002. | TC-FRM-006 boundary cases now assertable |
| Q-010 | Is storing identical repeat submissions correct? | TC-SUB-006 |
| Q-014 | Owner name for the header table. | Cosmetic only |
