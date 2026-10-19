# Firebase Google Sign-In with Buyer/Seller Roles — Requirements

| Field       | Value                          |
| ----------- | ------------------------------ |
| Slug        | `firebase-google-signin-roles` |
| Status      | Draft                          |
| Version     | 0.2                            |
| Date        | `2026-10-19`                   |
| Owner       | `<name>`                       |
| Scope       | Proof of concept (POC)         |
| Firebase project | `sdemo-5cbcd`            |
| Test cases  | [`test-cases.md`](./test-cases.md) |

## 1. Overview

This is a **proof of concept** for authentication on the real-estate site. A visitor signs in with their Google account through Firebase Authentication, and before the Google popup is launched they declare whether they are a **buyer** or a **seller**. On successful sign-in the app writes a single profile document to Cloud Firestore keyed by the Firebase user UID, carrying the chosen role alongside the Google profile fields. The stored role is what every later screen will read to decide what a person can see and do. Nothing beyond sign-in, sign-out, and role persistence is built in this iteration.

## 2. Problem statement

Users cannot log in at all — there is no authentication surface anywhere in the app. Every capability planned for this product (buyers browsing and enquiring, sellers publishing listings) needs to know *who* the person is and *which side of the market* they are on before any of it can be personalised or gated. Without a stable identifier there is no place to hang a saved-search, a listing, or an enquiry, so all of that work stays blocked. Not shipping this means the team cannot demo who-is-who on any screen, and identity has to be retrofitted later into every feature at once.

## 3. Goals

- Let any visitor authenticate with Google in as few clicks as possible.
- Capture a buyer/seller role at the moment of first sign-in and store it durably.
- Establish one stable identifier (the Firebase UID) that all later features key off.
- Prove the Firestore read/write pattern — create on first login, update on repeat — before other collections depend on it.
- Keep the surface deliberately small enough to demo and throw away if the approach is wrong.

## 4. Non-goals

- Explicitly out: any capability beyond sign-in, sign-out, and role storage. The user said "will define later" for the feature list, so nothing is assumed on their behalf (Q-011).
- Explicitly out: production hardening. This is a POC — no audit logging, no data-retention policy, no abuse handling.
- Explicitly out: custom claims, session-token role claims, or any server-side enforcement of the role (Q-008).

## 5. Actors

| Actor   | Description                                                                          | Permissions in this iteration                                              |
| ------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Buyer   | A person looking to buy a property; selects the `Buy` role before signing in          | Authenticate, read own user document, update own `lastLoginAt`, sign out     |
| Seller  | A person looking to sell or list a property; selects the `Sell` role before signing in | Authenticate, read own user document, update own `lastLoginAt`, sign out     |
| Visitor | Anyone browsing the site who has not signed in                                        | View the sign-in surface, select a role, start Google sign-in                |
| Admin   | Firebase project operator                                                            | Manage the Firebase console — authorised domains, providers, rules. Not an app user |

## 6. Glossary

| Term            | Definition                                                                                    |
| --------------- | --------------------------------------------------------------------------------------------- |
| UID             | Firebase Authentication's immutable user identifier; the document ID of the user profile        |
| Role            | The market side of a user — `buyer` or `seller`                                                |
| Sign-in surface | The UI where a visitor picks a role and then triggers the Google popup                          |
| User document   | The Firestore profile record at `users/{uid}`                                                  |
| First sign-in   | The authentication event for a UID that has no user document yet                               |
| Returning sign-in | Any authentication for a UID that already has a user document                                |
| Server timestamp | `serverTimestamp()` — a Firestore-assigned write time, immune to client clock skew            |
| Authorised domain | A domain registered in the Firebase console; an unregistered origin makes the popup fail      |
| POC             | Proof of concept — built to validate the approach, not to ship                                |

## 7. User flows

### First-time sign-in as a buyer

1. Visitor clicks the sign-in entry point in the header.
2. The sign-in surface opens, showing two role options — `Buy` and `Sell` — neither selected.
3. Visitor clicks `Buy`; it becomes selected and the `Sign in with Google` button becomes enabled.
4. Visitor clicks `Sign in with Google`; the Google account chooser popup opens.
5. Visitor picks a Google account and grants access.
6. The popup closes, the app writes `users/{uid}`, and the header switches to the signed-in state with the user's name and a `Buyer` badge.
7. The sign-in surface is gone; the visitor now browses as a buyer.

### First-time sign-in as a seller

Identical to the above with `Sell` selected, and the badge reads `Seller`.

### Returning sign-in

1. Visitor selects a role and signs in with the same Google account as before.
2. The app finds the existing `users/{uid}` document.
3. The stored role wins — the role picked at step 1 is discarded (BR-004).
4. Only `lastLoginAt` is written.

### Sign out

1. Visitor clicks the sign-out control in the header.
2. The Firebase session ends and the header returns to the signed-out state.
3. The `users/{uid}` document is left exactly as it was.

## 8. Functional requirements

| ID       | Requirement                                                                                                                                    | Priority | Notes                                                    |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------- |
| FR-001   | The app initialises Firebase from `VITE_FIREBASE_*` environment variables, targeting Firebase project `sdemo-5cbcd`.                            | Must     | BR-006                                                    |
| FR-002   | A signed-out visitor sees a sign-in entry point in the site header.                                                                             | Must     | Replaces the placeholder link from the homepage RFP       |
| FR-003   | The sign-in surface offers exactly two role options, `Buy` and `Sell`, representing `buyer` and `seller`.                                       | Must     | No third role; see Q-009                                  |
| FR-004   | A visitor may select a role before the Google sign-in flow is started.                                                                           | Must     | BR-001                                                    |
| FR-005   | Selecting one role clears any previously selected role.                                                                                          | Must     | Radio semantics — never both at once                      |
| FR-006   | The `Sign in with Google` button is disabled until a role is selected.                                                                           | Must     | BR-001                                                    |
| FR-007   | Activating `Sign in with Google` opens the Firebase Google provider popup.                                                                       | Must     | BR-007 — Google is the only provider                      |
| FR-008   | After authentication the app subscribes to Firebase Auth state and re-renders the signed-in UI without a page reload.                           | Must     | `onAuthStateChanged`                                      |
| FR-009   | After authentication the app reads `users/{uid}` from Firestore to determine whether the user document already exists.                            | Must     | One read, before any write                                |
| FR-010   | If `users/{uid}` does not exist, the app creates it with `email`, `displayName`, `photoURL`, the selected `role`, and a `createdAt` server timestamp. | Must     | BR-003                                                    |
| FR-011   | If `users/{uid}` exists, the app leaves the stored `role` and `createdAt` untouched and updates `lastLoginAt` only.                                 | Must     | BR-004                                                    |
| FR-012   | The Firestore document ID is the Firebase Auth UID.                                                                                            | Must     | BR-002                                                    |
| FR-013   | The signed-in header shows the user's display name, falling back to the email address when the display name is absent.                            | Must     | Google accounts may carry no display name                 |
| FR-014   | The signed-in header shows the user's role as a visible badge.                                                                                  | Must     | Renders `Buyer` or `Seller`                               |
| FR-015   | The signed-in header shows a sign-out control.                                                                                                  | Must     |                                                          |
| FR-016   | Activating sign-out ends the Firebase session and returns the UI to the signed-out state.                                                        | Must     |                                                          |
| FR-017   | Sign-out does not delete or modify the `users/{uid}` document.                                                                                  | Must     | BR-005                                                    |
| FR-018   | The app reads the signed-in user's role from the Firestore document and exposes it to the UI.                                                     | Must     | The mechanism later screens use to gate on role           |
| FR-019   | A sign-in attempt that fails shows an error message and leaves the visitor signed out.                                                          | Must     | Covers popup-blocked, network, credential conflict        |
| FR-020   | Dismissing the Google popup without granting access is treated as a cancellation — no error message, visitor stays signed out.                       | Must     | Must not be confused with failure                         |
| FR-021   | A Firestore write failure after successful authentication leaves the user authenticated, surfaces an error, and offers a retry.                     | Should   | Auth and Firestore are separate systems — see NFR-006     |
| FR-022   | The selected role is held in memory for the current page load only and resets on reload.                                                        | Should   | No role is remembered for a visitor who has not signed in |
| FR-023   | User profile data is held in Firestore, not in browser storage, so it survives a reload, a cache clear, and a different browser or device.             | Must     | Firestore is the source of truth for the profile           |

## 9. Business rules

| ID       | Rule                                                                                                      | Applies to             |
| -------- | --------------------------------------------------------------------------------------------------------- | ---------------------- |
| BR-001   | A role must be selected before the Google popup can be launched; the sign-in button stays disabled until then. | FR-004, FR-006      |
| BR-002   | The UID is the sole unique identifier — one Google account maps to exactly one user document.                 | FR-009, FR-012        |
| BR-003   | `role` accepts exactly `buyer` or `seller`; no other value is written.                                       | FR-003, FR-010        |
| BR-004   | The first sign-in fixes the stored role; it is immutable thereafter and later UI selections are discarded.     | FR-011                 |
| BR-005   | Sign-out clears local session state only — no Firestore document is deleted or edited.                       | FR-016, FR-017        |
| BR-006   | All Firebase configuration comes from `VITE_FIREBASE_*` environment variables; no key is committed to source.  | FR-001                 |
| BR-007   | Google is the only authentication provider in this iteration.                                                 | FR-007                 |
| BR-008   | **POC decision:** Firestore rules are left wide open — any client may read or write any `users/{uid}` document. The app still writes only its own document (FR-010, FR-011), but nothing enforces it. This must be replaced by owner-only rules before any real user data lands (Q-014). | FR-009, FR-010, FR-011 |

## 10. Data model

Single collection. Document path: `users/{uid}`.

| Entity   | Field        | Type      | Constraints                                                                   |
| -------- | ------------ | --------- | ----------------------------------------------------------------------------- |
| `users`  | *(document)* | Document  | ID = Firebase Auth UID (BR-002)                                              |
| `users`  | `email`      | string    | From the Firebase Auth profile                                                |
| `users`  | `displayName`| string    | From the Firebase Auth profile; may be empty (FR-013)                        |
| `users`  | `photoURL`   | string    | From the Firebase Auth profile; may be empty                                  |
| `users`  | `role`       | string    | Enum `buyer` \| `seller` (BR-003); written once, never updated (BR-004)       |
| `users`  | `createdAt`  | timestamp | `serverTimestamp()`; set on creation only                                     |
| `users`  | `lastLoginAt`| timestamp | `serverTimestamp()`; rewritten on every sign-in                              |

Collection name `users` is an assumption — see Q-001.

## 11. API / interface

Firebase SDK calls made by the client. No custom backend exists in this iteration.

| Call                | Target                    | Purpose                                        | Auth            | Errors                                                                                                          |
| ------------------- | ------------------------- | ---------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------- |
| `initializeApp`     | Firebase app config       | Boot the SDK from env vars (FR-001)            | None            | `auth/invalid-api-key`, `auth/operation-not-supported-in-this-environment` if env vars are absent                |
| `signInWithPopup`   | `auth`, `GoogleAuthProvider` | Launch the Google account chooser (FR-007)  | None            | `auth/popup-blocked`, `auth/popup-closed-by-user`, `auth/cancelled-popup-request`, `auth/network-request-failed`, `auth/account-exists-with-different-credential` |
| `onAuthStateChanged`| `auth`                    | Drive signed-in / signed-out rendering (FR-008)| None            | Listener fires with `null` on sign-out                                                                            |
| `getDoc`            | `users/{uid}`             | Existence check before write (FR-009)          | Owner's session | `permission-denied`                                                                                              |
| `setDoc`            | `users/{uid}`             | Create the profile on first sign-in (FR-010)   | Owner's session | `permission-denied`, `unavailable`                                                                               |
| `updateDoc`         | `users/{uid}`             | Refresh `lastLoginAt` (FR-011)                 | Owner's session | `permission-denied`, `unavailable`                                                                               |
| `signOut`           | `auth`                    | End the session (FR-016)                       | Owner's session | None surfaced                                                                                                    |

## 12. UI / UX notes

- **Entry point:** the header sign-in control. The homepage RFP currently renders a placeholder sign-in link (its FR-004) — this feature replaces it (Q-006).
- **Sign-in surface:** a panel or route with two role cards, `Buy` and `Sell`, each stating plainly what it means; a `Sign in with Google` button beneath them. Copy must not imply the role can be changed later (BR-004).
- **States:**
  - *Initial* — two unselected role cards, sign-in button disabled.
  - *Role selected* — one card visually selected, sign-in button enabled.
  - *Authenticating* — button shows a spinner and is disabled to prevent double submits.
  - *Error* — an inline message naming the failure (`popup blocked`, `network error`, etc.) with the role cards still selected so the visitor can retry in one click.
  - *Signed in* — header shows avatar, display name or email, role badge, sign-out control.
- **Accessibility:** role options must be keyboard operable and expose radio semantics so a screen reader announces "selected" (NFR-005).
- **Responsive:** usable at 360 px wide and on desktop; no horizontal scroll (NFR-007).
- **Persistence:** no role survives a reload for a signed-out visitor (FR-022).

## 13. Non-functional requirements

| ID       | Category      | Requirement                                                                                            | Priority |
| -------- | ------------- | ----------------------------------------------------------------------------------------------------- | -------- |
| NFR-001  | Performance   | Sign-in completes and the signed-in header renders within 3 seconds of Google returning the user.        | Should   |
| NFR-002  | Security      | No Firebase API key or project credential is committed to source control; config lives in a gitignored env file. | Must     |
| NFR-003  | Security      | **POC decision:** Firestore rules are wide open — no read or write restriction is enforced on `users/{uid}`. Replacing this with owner-only rules is a release blocker, not a nicety (Q-014). | Must     |
| NFR-004  | Security      | No Firebase Admin SDK, service account, or server-side credential is present in the client bundle.     | Must     |
| NFR-005  | Accessibility | Role options are keyboard operable and expose radio semantics; the sign-in button has an accessible name. | Should   |
| NFR-006  | Reliability   | A Firestore write failure never signs the user out and never leaves a half-written document.           | Should   |
| NFR-007  | Responsive    | The sign-in surface and signed-in header work from 360 px to desktop with no horizontal scroll.        | Should   |
| NFR-008  | Maintainability | Firebase initialisation and profile writing live outside components, in a single module, so they can be swapped or stubbed. | Should |
| NFR-009  | Configuration | The app targets project `sdemo-5cbcd` and, if env vars are missing, shows a clear message instead of a blank screen. | Should |
| NFR-010  | Deployability | The deployment origin is registered as an authorised domain in the Firebase console, and sign-in works from that origin. | Must |

## 14. Dependencies & integrations

| Dependency                                        | Purpose                                                    | Owner                | Status                              |
| ------------------------------------------------- | ---------------------------------------------------------- | -------------------- | ----------------------------------- |
| Firebase Authentication, Google provider           | Identity; supplies the UID                                 | Firebase project     | To be enabled in console (Q-005)   |
| Cloud Firestore                                    | Role and profile storage                                   | Firebase project     | To be created (Q-004)               |
| Google OAuth client / authorised domains           | Lets the popup succeed on `localhost` and the deploy host  | Firebase project     | To be configured (NFR-010)          |
| Firestore security rules                           | None — rules stay wide open for the POC              | Firebase project     | Deliberately unset (BR-008, Q-014)   |
| Environment variables (`VITE_FIREBASE_*`)          | Supplies the web app config to the client                  | Deployer             | Values not captured yet (Q-007)     |
| Google Play Games / Games on Firebase — **not used** | —                                                          | —                    | Explicitly not a Games project     |

## 15. Out of scope

- Email/password, phone, Apple, Facebook, or any provider other than Google (BR-007).
- Custom claims and server-side role enforcement — the role is application data, not a token claim (Q-008).
- Any change of role after first sign-in (BR-004).
- Admin users, staff roles, moderation, or impersonation.
- Account deletion, profile editing, avatar upload, display-name editing.
- Email verification, MFA, suspicious-login alerts, re-authentication prompts.
- Native iOS or Android apps; token refresh handling beyond the SDK default.
- Buyer/seller-specific navigation, menus, or gated content — the role is stored, nothing consumes it yet (FR-018 only exposes it).

## 16. Assumptions & open questions

| ID    | Question / Assumption                                                                                                     | Impact                                                                                                       | Status             |
| ----- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------ |
| Q-001 | **Assumption** — the profile collection is named `users`, keyed by UID. Confirm the name.                                    | Renaming the collection after data exists means a migration.                                                  | Open               |
| Q-002 | **Assumption** — the first sign-in fixes the role and it is immutable. Can a user switch from buyer to seller later, and how? | If switchable, FR-011 and BR-004 change and an edit flow is needed.                                           | Open               |
| Q-003 | ~~Owner-only, or wide open?~~ **Answered:** wide open for the POC. Recorded as BR-008 and NFR-003. The cost is real exposure — see Q-014. | — | Closed |
| Q-004 | **Assumption** — Firestore is in production mode, not test mode.                                                            | In test mode the app is limited to 30-day-old documents and a fixed region.                                   | Open               |
| Q-005 | **Assumption** — the Google provider is enabled on `sdemo-5cbcd`.                                                           | If disabled, every sign-in fails with `operation-not-allowed`.                                                 | Open               |
| Q-006 | The homepage header's placeholder sign-in link becomes this entry point. Confirm, or does a new page get its own route?      | Determines whether a route is added or an existing control is upgraded.                                       | Open               |
| Q-007 | The `VITE_FIREBASE_*` values for `sdemo-5cbcd` — where does the deploy target read them from, and what is it?               | Blocks any test run against a non-localhost origin.                                                           | Open               |
| Q-008 | Should the role become a **custom claim** later so it is enforced server-side, or stay app data?                              | Affects whether the Firestore-read approach survives into production.                                         | Open               |
| Q-009 | Should there be a third role such as `broker`, `admin`, or `both`?                                                          | BR-003 and FR-003 are written for exactly two.                                                                | Open               |
| Q-010 | Is the sign-in surface a modal, a route, or a dedicated page?                                                                | Changes the flow and the back-button behaviour.                                                               | Open               |
| Q-011 | **Assumption** — the concrete capability list was deferred ("will define later"); this document covers authentication only.  | Any feature the user had in mind beyond sign-in is absent and needs a follow-up RFP.                          | Open               |
| Q-012 | Which Google account(s) will the E2E tests authenticate with, and how are its credentials stored?                             | E2E against a live project cannot run unattended without this.                                                 | Open               |
| Q-013 | Owner name for the header table.                                                                                            | Cosmetic only.                                                                                                | Open               |
| Q-014 | Wide-open Firestore rules (BR-008) mean any client, anywhere on the internet, can read and rewrite every `users/{uid}` document. **When does this get locked down, and what is the trigger?** A POC with test accounts is survivable; the first real user is not. | Unbounded data exposure once real accounts exist.                                                            | Open               |
| Q-015 | ~~How the test harness asserts Firestore contents.~~ **Answered:** read and written from the browser over the unauthenticated Firestore REST API — no service account, no CLI, no manual console step. This works only *because* the rules are wide open, so it is coupled to Q-014. | — | Closed |

## 17. Acceptance criteria

| ID       | Criterion                                                                                                          | Covers                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| AC-001   | A visitor can select `Buy`, enable `Sign in with Google`, complete the Google popup, and land signed in without a page reload. | FR-002, FR-004, FR-006, FR-007, FR-008 |
| AC-002   | The same flow works with `Sell` selected, and the header badge reads `Seller`.                                       | FR-004, FR-014                         |
| AC-003   | Both role options cannot be selected at the same time.                                                              | FR-003, FR-005                         |
| AC-004   | `users/{uid}` exists after a first sign-in with `role`, `email`, `displayName`, `photoURL`, and `createdAt`.           | FR-009, FR-010, FR-012                 |
| AC-005   | Signing in again with the same account changes only `lastLoginAt`; `role` and `createdAt` are untouched.              | FR-011                                 |
| AC-006   | The signed-in header shows a name, a role badge, and a working sign-out control.                                       | FR-013, FR-014, FR-015, FR-016         |
| AC-007   | After sign-out the header is back to the signed-out state and the user document still exists unchanged.               | FR-016, FR-017                         |
| AC-008   | Cancelling the Google popup produces no error and no session; a genuine failure produces an error and no session.     | FR-019, FR-020                         |
| AC-009   | A Firestore failure leaves the user signed in, shows an error, and succeeds on retry.                                  | FR-021, NFR-006                        |
| AC-010   | Firestore rules impose no access restriction, and this is a known, recorded POC exposure to be closed before real users (Q-014).             | NFR-003                                |
| AC-011   | The app targets `sdemo-5cbcd`, holds no committed credentials, and shows a clear message when config is absent.       | FR-001, NFR-002, NFR-004, NFR-009      |
| AC-012   | The sign-in surface is fully usable by keyboard and at 360 px wide with no horizontal scroll.                           | NFR-005, NFR-007                       |
| AC-013   | A profile created in one browser session is present for the same account on a different browser with no local state.                    | FR-023                                 |

## 18. Change log

| Date       | Version | Change            | By     |
| ---------- | ------- | ----------------- | ------ |
| 2026-10-19 | 0.1     | Initial draft     | `<name>` |
| 2026-10-19 | 0.2     | Firestore rules set wide open per Q-003 (BR-008, NFR-003, AC-010 revised); added FR-023 / AC-013 for Firestore-backed profile persistence; Q-003 closed, Q-014 and Q-015 raised | `<name>` |
