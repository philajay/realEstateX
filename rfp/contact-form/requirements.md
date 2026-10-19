# Contact Form (Enquiry Capture) — Requirements

| Field       | Value                                            |
| ----------- | ------------------------------------------------ |
| Slug        | `contact-form`                                   |
| Status      | Draft — implemented in this branch |                   |
| Version     | 0.2                                              |
| Date        | `2026-10-19`                                     |
| Owner       | `<name>`                                         |
| Priority    | Medium                                           |
| Scope       | Capture a contact enquiry from any visitor and save it for later admin review |
| Firebase project | `sdemo-5cbcd`                               |
| Test cases  | [`test-cases.md`](./test-cases.md)               |

## 1. Overview

Any visitor — signed in or not — can open a dedicated **contact form** at `/contact`, enter a name, an email address, and a message, and submit it. A valid submission is written as one document in Cloud Firestore with a server-generated ID and a server-assigned timestamp. The stored document carries every field the visitor typed, so an **admin** can later read back the complete detail of each enquiry. Nothing about the enquiry is shown to any other visitor: the form is write-only from the app's point of view in this iteration.

## 2. Problem statement

There is no contact form on the site today. `src/data/navigation.js` already advertises a `Contact` link pointing at `/contact`, but `src/App.jsx` only routes `/sell` and everything else falls through to the listings homepage, so that link goes nowhere. The footer offers a `mailto:` and a `tel:` link and a newsletter box, none of which captures a message, an intent, or a contactable person. A visitor who wants to reach EstateX therefore has to write an email from their own mail client, and if they do not, the enquiry is lost with no record anywhere. There is also nowhere to hang an admin surface later: no enquiry data is being collected to display. Until this ships, every contact attempt leaves the product with no data, no trace, and no answer.

## 3. Goals

- Give any visitor a working way to send their details and message through the site itself.
- Persist every valid enquiry to Firestore with enough fields for an admin to see all details (FR-014).
- Keep the form open to anonymous visitors — no sign-in friction on the way in (BR-004).
- Never show a success state for a submission that was not stored, and never discard what the visitor typed.
- Leave the stored data shaped so a later admin surface can list and read enquiries without a migration.

## 4. Non-goals

- Explicitly out: an admin UI. The user said the admin view will be built later — records are captured now so it has something to show (Q-011).
- Explicitly out: sending an email or notification to the admin on submission (Q-005).
- Explicitly out: replying to the enquiry from inside the app, or any enquiry thread (Q-006).
- Explicitly out: spam defence beyond what Firestore rules allow — no CAPTCHA, no rate limit, no honeypot in this iteration (Q-008).
- Explicitly out: file attachments on the contact form.
- Explicitly out: a newsletter signup as a side effect of sending an enquiry (FR-017).

## 5. Actors

| Actor    | Description                                              | Permissions in this iteration                                            |
| -------- | -------------------------------------------------------- | ------------------------------------------------------------------------ |
| Visitor  | Anyone using the site, signed in or signed out            | Open `/contact`, fill and submit the form, read the success or error state |
| Admin    | Person who later reads the enquiries                     | **None in the application today** — reads the collection out of band (Q-011) |
| Signed-in user | A visitor who happens to also be signed in          | Exactly the same as `Visitor`; signing in changes nothing (FR-004)       |

## 6. Glossary

| Term            | Definition                                                                 |
| --------------- | -------------------------------------------------------------------------- |
| Enquiry         | One contact submission: a name, an email, and a message                    |
| Enquiry document| The Firestore record of one enquiry, at `contactEnquiries/{autoId}` (Q-001) |
| Anonymous submit| A submission made with no sign-in, storing no identity (BR-004)            |
| Admin           | The role that reads enquiries later; not an application role in this RFP    |

## 7. User flows

### Submit an enquiry (happy path)

1. Visitor follows the `Contact` link in the header, or opens `/contact` directly, without signing in.
2. A form appears with an empty name field, an empty email field, and an empty message field.
3. Visitor types all three and clicks submit.
4. The app writes one document holding `name`, `email`, `message`, and a server timestamp; the submit control is disabled while this happens.
5. The form is replaced by a confirmation that the enquiry was received.

### Submit with a problem

1. Visitor leaves any one field empty or whitespace-only, or types an unusable email address.
2. The submission is refused, the offending field is marked and named, and nothing is written to Firestore.
3. Visitor corrects the field and submits again; the corrected values are what get stored.

### Submission fails at Firestore

1. Visitor submits an otherwise valid form.
2. The write fails.
3. An error is shown and the form keeps everything the visitor typed, so the message can be retried without retyping.

## 8. Functional requirements

| ID       | Requirement                                                                                                              | Priority | Notes                                            |
| -------- | ------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------ |
| FR-001   | The app serves a contact form at the dedicated `/contact` route.                                                          | Must     | Route shape fixed by the user                    |
| FR-002   | `/contact` is reachable through the `Contact` navigation link that already exists in the header.                          | Must     | Link exists today but resolves to the homepage    |
| FR-003   | The form exposes exactly three fields: name, email, and message.                                                         | Must     | Field set chosen by the user; no phone/subject    |
| FR-004   | Every field has a label programmatically associated with its control.                                                     | Must     | NFR-002                                          |
| FR-005   | A signed-out visitor can open `/contact` and submit the form; no sign-in is required or prompted.                          | Must     | BR-004                                           |
| FR-006   | A submission stores no Firebase UID and no other identity; a signed-in visitor's submission is indistinguishable from an anonymous one. | Must | BR-004                                           |
| FR-007   | A submission is refused while any of the three fields is empty or contains only whitespace.                                | Must     | BR-001                                           |
| FR-008   | A submission is refused when the email field is not a usable email address.                                                | Must     | BR-002; exact pattern is Q-002                   |
| FR-009   | A validation failure names the specific offending field and marks that control, rather than showing one generic message.     | Must     |                                                  |
| FR-010   | A valid submission creates exactly one document in the enquiry collection, with a server-generated document ID.             | Must     | BR-003                                           |
| FR-011   | The created document stores the submitted name, email, and message exactly as typed, with leading and trailing whitespace removed. | Must | BR-005                                           |
| FR-012   | The created document stores a server-assigned submission timestamp; the browser clock is never used.                        | Must     |                                                  |
| FR-013   | After a successful submission the visitor sees a confirmation instead of the form.                                         | Must     | Copy is Q-004                                    |
| FR-014   | Every field the visitor submitted is persisted, so an admin surface can later display the complete detail of each enquiry.  | Must     | This is the point of the feature                 |
| FR-015   | The submit control is disabled while a submission is in flight, and a second click cannot create a second document.         | Must     | BR-007                                           |
| FR-016   | A submission that fails shows an error and the form retains every entered value.                                           | Must     | NFR-004                                          |
| FR-017   | Enquiries are never rendered on any public surface; no visitor can read another visitor's enquiry through the app.            | Must     | BR-008                                           |
| FR-018   | The contact page renders the contact form independently of the listings fetch — a listings error does not block it, and the listings grid is not shown on `/contact`. | Must | FR-016 shape collision risk in `App.jsx` |
| FR-019   | Submitting the contact form does not change newsletter state and does not add the visitor to any mailing list.               | Must     | The footer newsletter box is separate             |
| FR-020   | Two identical submissions are stored as two separate documents; no duplicate detection is applied.                        | Should   | Assumption — Q-010                               |
| FR-021   | Opening `/contact` leaves the home route and `/sell` working exactly as they did.                                          | Should   | Regression guard                                 |
| FR-022   | A submission is refused when name, email, or message exceeds its maximum length — 100, 254, and 2000 characters respectively. An over-long value is refused, never silently truncated. | Must | Added at implementation — Q-003          |
| FR-023   | A write that has not settled within 15 seconds releases the submit control and shows a message saying the enquiry may still be on its way. It claims neither success nor failure. | Must | Added at implementation — found by testing: the SDK retries a rejected write indefinitely, so the button would otherwise stay disabled forever |

## 9. Business rules

| ID       | Rule                                                                                                                            | Applies to                        |
| -------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| BR-001   | Name, email, and message are all required. A value that is empty or only whitespace counts as missing.                          | FR-007                           |
| BR-002   | The email field must hold one `@`, a domain with at least one dot, no whitespace, and no leading or trailing dot or hyphen in the domain. Plus-addressing and sub-domains are accepted. | FR-008                  |
| BR-003   | Document IDs are server-generated. The client never supplies, reuses, or guesses an enquiry ID.                                  | FR-010                           |
| BR-004   | Submission is anonymous. Sign-in is never required, and no UID, session token, IP address, or user agent is stored on the document. | FR-005, FR-006                   |
| BR-005   | Stored strings are the submitted values with leading and trailing whitespace removed; inner spacing is untouched.                  | FR-011                           |
| BR-006   | An enquiry is written whole. There is no partial save, no autosave, and no draft document.                                        | FR-010                           |
| BR-007   | One click produces at most one document. The submit control is disabled for the duration of the write.                             | FR-015                           |
| BR-008   | Enquiries are write-only from the app's perspective in this iteration. No application read path for enquiries exists.             | FR-017                           |
| BR-009   | Admin viewing is out of scope for this iteration. The documents are captured now purely so a later admin surface has data to read. | FR-014                           |
| BR-010   | Name is capped at 100 characters, email at 254, and message at 2000. A value over its cap is refused, not truncated.               | FR-022                           |
| BR-011   | Every enquiry is created with `status: "new"`, so the later admin surface can triage without a migration.                        | FR-014, FR-022                   |
| BR-012   | A write is given 15 seconds to settle. On timeout the control is released and the visitor is told the message may still arrive — never that it was lost, because the write may still complete afterwards. A late success still shows the confirmation. | FR-013, FR-023 |

## 10. Data model

Single collection. Document path: `contactEnquiries/{autoId}`. `autoId` is server-generated.

| Entity            | Field         | Type      | Constraints                                                          |
| ----------------- | ------------- | --------- | -------------------------------------------------------------------- |
| `contactEnquiries`| *(document)*  | Document  | ID = Firestore auto ID (BR-003)                                       |
| `contactEnquiries`| `name`        | string    | Required, non-whitespace, trimmed; max 100 characters (BR-001, BR-005, BR-010) |
| `contactEnquiries`| `email`       | string    | Required, must match BR-002, trimmed, max 254 characters             |
| `contactEnquiries`| `message`     | string    | Required, non-whitespace, trimmed; max 2000 characters (BR-001, BR-005, BR-010) |
| `contactEnquiries`| `status`      | string    | Always `"new"` on create (BR-011); mutable by a future admin surface  |
| `contactEnquiries`| `submittedAt` | timestamp | `serverTimestamp()`; set once on create, immutable (FR-012)            |

No `uid`, `userAgent`, `ip`, or `source` field is written in this iteration. A `source` field (which page or listing the enquiry came from) remains a candidate for a later iteration — see Q-012.

## 11. API / interface

Firebase SDK calls made by the client. No custom backend exists.

| Call      | Target             | Purpose                             | Auth              | Errors                                     |
| --------- | ------------------ | ----------------------------------- | ----------------- | ------------------------------------------ |
| `addDoc`  | `contactEnquiries` | Save one enquiry (FR-010)           | None — anonymous  | `permission-denied`, `unavailable`          |

There is no read call in this iteration, because there is no application surface that displays enquiries (BR-008).

Rules for this collection are drafted in [`firestore.rules`](../../../firestore.rules) at the repo root: anonymous `create` is allowed only for a document whose fields, types, and sizes match §10, and `read`, `update`, and `delete` are denied. **The file is not deployed** — see Q-013.

## 12. UI / UX notes

- **Surface:** a dedicated `/contact` route, following the existing `/sell` route pattern in `App.jsx`. The header's `Contact` link already points here (FR-002).
- **Form layout:** one column on mobile, a single card on desktop, matching the existing seller form's visual language.
- **States:**
  - *Initial* — three empty fields, submit enabled but blocked by validation until all three are filled.
  - *Validation error* — the specific field is marked and named; no Firestore call is made.
  - *Submitting* — the submit control is disabled and reads `Sending…`; a second click does nothing (FR-015).
  - *Success* — the heading changes to `Message sent` and the form is replaced by a confirmation reading "Thanks — we have your message … It has been recorded along with the email address you gave us" (FR-013). It promises no response time and claims no email was sent (Q-004).
  - *Submit error* — an inline message naming the failure; the form keeps its values (FR-016). Offline is called out on its own: "You appear to be offline, so your message was not sent."
  - *Stalled* — after 15 seconds the control is released and the banner reads "This is taking longer than expected. Your message may still be on its way — please do not send it again just yet" (FR-023).
  - *Unconfigured* — when Firebase env vars are missing the form is replaced by "The contact form is unavailable" (NFR-008).
- **Consent line:** a line under the fields reads "We use these details only to respond to your enquiry" and states the 2000-character message limit. Retention is still undefined (Q-009).
- **Accessibility:** every input has a programmatically associated label; validation messages are announced; the form is fully keyboard operable (NFR-002).
- **Responsive:** usable from 360 px wide to desktop with no horizontal scroll (NFR-001).
- **Not to be confused with:** the footer's newsletter email box. The two are separate forms with separate outcomes, and neither may update the other's state (FR-019).

## 13. Non-functional requirements

| ID       | Category        | Requirement                                                                                                            | Priority |
| -------- | --------------- | ---------------------------------------------------------------------------------------------------------------------- | -------- |
| NFR-001  | Responsive      | The contact page works from 360 px to desktop with no horizontal scroll.                                                | Should   |
| NFR-002  | Accessibility   | Every form control has an accessible name, the form is keyboard operable, and validation errors are announced.            | Should   |
| NFR-003  | Security       | No Firebase credential is committed to source control and no Admin SDK or service account appears in the client bundle. | Must     |
| NFR-004  | Reliability     | A failed write never shows a success state and never clears the visitor's typed values.                                 | Must     |
| NFR-005  | Security       | **Known gap:** this is an anonymous public write path with no rate limit, CAPTCHA, or honeypot. `firestore.rules` limits it to create-only with a checked document shape, but nothing limits how often one client may submit. App Check or a rate limit must be added before real traffic (Q-008, Q-013). | Must |
| NFR-006  | Privacy        | The form collects personal data — name, email, and a free-text message — from anonymous visitors. A consent line ships with the form; a retention period is still undefined and must exist before real traffic (Q-009). | Must |
| NFR-007  | Maintainability| Firestore calls for enquiries live in a single module outside the components so they can be stubbed in tests.             | Should   |
| NFR-008  | Configuration  | When Firebase is unconfigured the contact form shows a clear message instead of silently failing the submission.           | Should   |
| NFR-009  | Reliability     | The submit path is idempotent from the visitor's point of view: one click, one outcome, one visible state change.            | Should   |

## 14. Dependencies & integrations

| Dependency                              | Purpose                                            | Owner            | Status                                                     |
| --------------------------------------- | -------------------------------------------------- | ---------------- | ---------------------------------------------------------- |
| Cloud Firestore                          | Enquiry storage                                    | Firebase project | Available; `firestore.rules` drafted but not deployed (Q-013)  |
| Existing `/sell` route pattern            | Template for adding `/contact`                     | Existing         | In place                                                    |
| Existing `Contact` nav link (`/contact`)   | Entry point to the form                           | Existing         | Exists today but resolves to the homepage (FR-002)         |
| Firebase Authentication                  | —                                                  | —                | **Not used** — submission is anonymous (BR-004)             |
| Firebase Storage                         | —                                                  | —                | **Not used** — no attachments                              |
| Admin surface                            | Reads the stored enquiries                         | Future RFP       | **Not built in this iteration** (Q-011)                    |
| Email / notification service             | Tells the admin an enquiry arrived                 | Future           | **Not built in this iteration** (Q-005)                    |

## 15. Out of scope

- An admin UI, admin role, or any in-app list of enquiries — the user will build it later (Q-011).
- Sending an email, Slack message, or any notification when an enquiry arrives (Q-005).
- Replying to an enquiry, or any two-way thread (Q-006).
- File attachments or image upload on the form.
- Anti-spam beyond Firestore rules — no CAPTCHA, honeypot, or rate limiting (Q-008, NFR-005).
- Enquiry status tracking (`new` / `read` / `replied`) and assignment to an admin (Q-006).
- Search, filtering, sorting, or export of enquiries.
- Attaching an enquiry to a specific property listing, and capturing which page the visitor came from (Q-012).
- Contact-form delivery by SMS or WhatsApp.
- Native iOS or Android apps.

## 16. Assumptions & open questions

| ID    | Question / Assumption                                                                                                                             | Impact                                                                                        | Status |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------ |
| Q-001 | The collection is named `contactEnquiries`, keyed by an auto-generated ID, matching the `listings` pattern.                                          | Renaming after enquiries exist means a migration.                                              | Resolved 2026-10-19 — implemented; reverse it before the first enquiry lands if you prefer another name |
| Q-002 | The exact rule defining a usable email address.                                                                                                                     | Decides BR-002 and the boundary tests. A too-loose rule stores junk; a too-strict one blocks real enquiries. | Resolved 2026-10-19 — one `@`, a dotted domain, no whitespace, no leading/trailing dot or hyphen. Plus-addressing and sub-domains accepted |
| Q-003 | Maximum lengths for name and message, and whether oversize is rejected or truncated.                                                                                | Without a cap, one visitor can write an arbitrarily large document.                              | Resolved 2026-10-19 — name 100, email 254, message 2000; oversize refused, never truncated (BR-010, FR-022) |
| Q-004 | What the success confirmation says, and whether it promises a reply.                                                                                              | Copy that promises a response nobody has committed to creates support complaints.                | Resolved 2026-10-19 — confirms receipt, promises no response time, claims no email was sent |
| Q-005 | Whether an email or notification reaches the admin on submission.                                                                                                 | Changes the write path from one Firestore call to a Cloud Function trigger.                      | Open — not built. Polling the collection is enough for now |
| Q-006 | Whether the later admin surface needs a `status` or an assignee field.                                                                                            | A status field added later is additive; one that should have existed at capture time is not — an enquiry submitted today cannot be retroactively marked read. | Resolved 2026-10-19 — `status: "new"` is now written at capture time (BR-011). Assignee still undecided |
| Q-007 | How an E2E test proves a submission reached Firestore, given no application read path exists.                                                                      | This is the verification strategy for the whole suite; see `test-cases.md` §1.                   | Resolved 2026-10-19 — REST read with a service account from environment variables, never committed |
| Q-008 | What stops spam on a public anonymous write path — App Check, a rate limit, a honeypot, or an accept-the-risk decision.                                               | Without a decision, the collection can be flooded and Firestore costs can run away.               | **Open — release blocker.** `firestore.rules` caps the damage per document but nothing caps how many arrive |
| Q-009 | Consent copy and the retention period for enquiries.                                                                                                              | Personal data from anonymous users with no stated retention is a compliance exposure (NFR-006).   | Partly resolved 2026-10-19 — a consent line ships with the form. **Retention period still open** |
| Q-010 | Identical repeat submissions are all stored and none is rejected as a duplicate.                                                                                   | If duplicates should be blocked, BR-005 and FR-020 change and a matching rule is needed.          | Assumption kept — confirm |
| Q-011 | The admin view is deferred to a later iteration; no admin-facing screen ships here. The user's words: "baad main banayiengee".                                      | If an admin screen is actually expected now, the role model, a route, and permission tests all move into scope. | Assumption kept — confirm |
| Q-012 | Whether the enquiry records which page or listing the visitor came from.                                                                                          | Adds a field that can only be captured at submit time; it cannot be reconstructed later.         | Open — not built |
| Q-013 | Who writes the Firestore security rules for `contactEnquiries`, and by when?                                                                                        | Until create-only rules are deployed, anyone can also update or delete enquiries (NFR-005).      | Partly resolved 2026-10-19 — rules drafted in `firestore.rules`. **Not deployed; needs review** |
| Q-014 | Owner name for the header table.                                                                                                                                  | Cosmetic only.                                                                                   | Open |
| Q-015 | Whether `/contact` is linked from anywhere besides the header.                                                                                                     | More entry points means more chance of a visitor missing the form.                                  | Open — header link only for now; the footer still offers `mailto:` and `tel:` |

## 17. Acceptance criteria

| ID       | Criterion                                                                                            | Covers                                 |
| -------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------- |
| AC-001   | A signed-out visitor can open `/contact` from the header link and sees a form with name, email, and message. | FR-001, FR-002, FR-003, FR-005  |
| AC-002   | A valid submission creates exactly one document holding all three submitted values and a server timestamp. | FR-010, FR-011, FR-012, FR-014, FR-006 |
| AC-003   | A submission with any field empty or whitespace-only is refused, names the offending field, and writes nothing. | FR-007, FR-009, BR-001          |
| AC-004   | A submission with an unusable email address is refused and writes nothing.                              | FR-008, BR-002                        |
| AC-005   | A successful submission shows a confirmation instead of the form.                                     | FR-013                                |
| AC-006   | A click while a write is in flight produces no second document.                                        | FR-015, BR-007                        |
| AC-007   | A failed submission shows an error and leaves every typed value in the form.                            | FR-016, NFR-004                       |
| AC-008   | No identity is stored on the document, and a signed-in visitor's submission is indistinguishable from an anonymous one. | FR-006, BR-004                 |
| AC-009   | No enquiry is readable through any public surface of the app.                                          | FR-017, BR-008                        |
| AC-010   | A listings fetch error does not block the contact form, and `/contact` does not render the listings grid. | FR-018                            |
| AC-011   | Submitting the contact form leaves the footer's newsletter box untouched.                                | FR-019                                |
| AC-012   | The contact page is keyboard operable and has no horizontal scroll at 360 px.                            | NFR-001, NFR-002                      |
| AC-013   | No committed credential or Admin SDK appears in the client bundle, and create-only Firestore rules for the enquiry collection are recorded as a release blocker. | NFR-003, NFR-005, Q-013 |
| AC-014   | Home and `/sell` behave exactly as before once `/contact` is added.                                     | FR-021                                |
| AC-015   | A name over 100 characters, an email over 254, or a message over 2000 is refused and nothing is written. | FR-022, BR-010                   |
| AC-016   | Every stored enquiry carries `status: "new"`.                                                          | BR-011                                |
| AC-017   | A write that stalls releases the submit control within the documented bound, says the message may still be on its way, and keeps every typed value. | FR-023, BR-012        |

## 18. Change log

| Date       | Version | Change      | By     |
| ---------- | ------- | ----------- | ------ |
| 2026-10-19 | 0.2     | Implemented. Resolved Q-001, Q-002, Q-003, Q-004, Q-006, Q-007; partly resolved Q-009 and Q-013. Added FR-022, BR-010, BR-011, AC-015, AC-016. Testing surfaced an indefinitely retried write that left the button disabled forever, so FR-023 and BR-012 were added with AC-017. | `<name>` |
| 2026-10-19 | 0.1     | Initial draft | `<name>` |