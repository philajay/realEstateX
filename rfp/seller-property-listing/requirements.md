# Seller Property Listing (Create, Edit, Active/Inactive) — Requirements

| Field       | Value                                            |
| ----------- | ------------------------------------------------ |
| Slug        | `seller-property-listing`                       |
| Status      | Draft                                            |
| Version     | 0.1                                              |
| Date        | `2026-10-19`                                     |
| Owner       | `<name>`                                         |
| Priority    | High                                             |
| Scope       | Add / edit / activate / deactivate a listing     |
| Firebase project | `sdemo-5cbcd`                               |
| Test cases  | [`test-cases.md`](./test-cases.md)               |

## 1. Overview

A signed-in **seller** can publish a property of their own: open a listing form, fill it in, and save it to Cloud Firestore. The saved listing carries a status of **active** or **inactive**, which the seller can flip so a property disappears from buyer-facing surfaces without being deleted. A seller can also re-open any listing they own, change its fields, and save the update. Every listing is permanently tied to the seller's Firebase UID, so one seller can never see or edit another seller's listing. This iteration covers create, edit, and the active/inactive toggle; it does not cover deletion, image upload, or moderation.

## 2. Problem statement

Today the site shows **hard-coded dummy listing data** on the homepage (`src/data/listings.js`) that no person owns and nobody can change. A seller who wants to put a property on the site has no way to do it — there is no form, no save, and no record that is theirs. Sign-in already exists and already stores a `seller` role, so the identity needed to hang a listing off is in place, but nothing consumes it yet. Until this ships, every property shown to a buyer is fiction, the seller role is inert, and any real listing data would have to be inserted into source code and redeployed by hand.

## 3. Goals

- Let a signed-in seller create a property listing through a form and persist it to Firestore.
- Tie every listing to the seller's UID so ownership is unambiguous from the record itself.
- Let a seller mark a listing active or inactive, and let that status actually gate buyer-facing visibility.
- Let a seller edit an existing listing they own and see the change persisted.
- Replace the dummy-data path for seller-owned listings so real records and dummy data are not confused.

## 4. Non-goals

- Explicitly out: listing deletion (hard delete). Status `inactive` covers hiding for now (BR-010).
- Explicitly out: image upload. The listing carries an image **URL** string only (Q-003).
- Explicitly out: any admin, moderation, approval, or review queue.
- Explicitly out: buyers' enquiry, contact, favourites, or saved searches.

## 5. Actors

| Actor   | Description                                                        | Permissions in this iteration                                                              |
| ------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Seller  | Signed-in user whose stored `role` is `seller`                       | Create a listing, read and edit **own** listings, change own listing status                |
| Buyer   | Signed-in user whose stored `role` is `buyer`                       | None in this iteration — cannot reach the seller form or any seller write path              |
| Visitor | Not signed in                                                       | Read the public homepage only; cannot reach the seller form or any seller write path         |
| Admin   | Firebase project operator                                           | Manage Firestore console and rules. Not an application role                                 |

## 6. Glossary

| Term              | Definition                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------ |
| Listing           | One property record a seller publishes                                                    |
| Active listing    | A listing with `status: "active"` — eligible to appear on buyer-facing surfaces           |
| Inactive listing  | A listing with `status: "inactive"` — retained, hidden, and restorable to active           |
| Owner             | The seller whose UID is stored on the listing document                                      |
| Seller UID        | The Firebase Auth UID of the signed-in seller; stored as `ownerId` on every listing         |
| Draft             | The user's stated intent, not a saved state — no partial listing is ever persisted (BR-006) |

## 7. User flows

### Create a listing

1. Seller is signed in with the `seller` role and opens the seller listing surface.
2. The listing form appears with every field empty and the status control on `active`.
3. Seller fills title, description, price, property type, bedrooms, bathrooms, area, city/locality, address, and image URL.
4. Seller clicks `Save`; the app writes a new document to `listings/{autoId}` with `ownerId` taken from the signed-in user and `createdAt` as a server timestamp.
5. The form clears and the seller's listing list shows the new listing.

### Edit a listing

1. Seller opens one of their own listings from their listing list.
2. The form is pre-filled with the stored values.
3. Seller changes any field and clicks `Save`; the app updates the same document, leaving `ownerId` and `createdAt` untouched.
4. The updated values are shown in the seller's listing list.

### Deactivate and reactivate

1. Seller activates a status control on one of their own listings.
2. The stored `status` flips between `active` and `inactive` and is persisted.
3. An `inactive` listing is not shown on buyer-facing surfaces; it remains in the seller's own list and can be switched back.

## 8. Functional requirements

| ID       | Requirement                                                                                                                          | Priority | Notes                                    |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------- | ---------------------------------------- |
| FR-001   | A signed-out visitor cannot reach the seller listing surface or any listing write path.                                                 | Must     | BR-004                                   |
| FR-002   | A signed-in user whose role is `buyer` cannot reach the seller listing surface or any listing write path.                               | Must     | BR-004                                   |
| FR-003   | A signed-in user whose role is `seller` can reach the seller listing surface from the app.                                              | Must     |                                          |
| FR-004   | The seller listing surface provides a listing form containing fields for title, description, price, property type, bedrooms, bathrooms, area, city/locality, address, and image URL. | Must     | Default field set, per Q-002             |
| FR-005   | The listing form provides a status control that can be set to `active` or `inactive`.                                                   | Must     | Defaults to `active` on a new form (BR-003) |
| FR-006   | A listing cannot be saved while any required field is empty.                                                                          | Must     | BR-001 — required set in §10             |
| FR-007   | Price, bedrooms, bathrooms, and area are validated as non-negative numbers and reject non-numeric input.                                | Must     | BR-002                                   |
| FR-008   | Saving a valid form creates a new Firestore document in the `listings` collection with a server-generated document ID.                   | Must     | BR-005                                   |
| FR-009   | Every created listing stores `ownerId` taken from the signed-in seller's Firebase UID.                                                  | Must     | BR-004; owner is never client-chosen     |
| FR-010   | Every created listing stores a `createdAt` server timestamp.                                                                          | Must     | Not the browser clock                    |
| FR-011   | After a successful create the form clears to its initial empty state.                                                                  | Must     | Prevents accidental double submit        |
| FR-012   | The seller's listing surface lists only listings whose `ownerId` equals the signed-in seller's UID.                                      | Must     | BR-004                                   |
| FR-013   | Opening one of the seller's own listings loads its stored values into the form.                                                         | Must     |                                          |
| FR-014   | Saving from an edit updates the same Firestore document rather than creating a new one.                                                  | Must     | No duplicate listing is created          |
| FR-015   | An edit leaves the stored `ownerId` and `createdAt` unchanged.                                                                         | Must     | BR-007                                   |
| FR-016   | Changing the status control and saving persists the new `status` value to Firestore.                                                    | Must     | BR-003                                   |
| FR-017   | Only `active` listings are shown on buyer-facing surfaces.                                                                             | Must     | `inactive` is hidden, not deleted        |
| FR-018   | The seller can switch an `inactive` listing back to `active`.                                                                          | Must     |                                          |
| FR-019   | A seller attempting to read or write a listing whose `ownerId` is a different UID is rejected and no data changes.                        | Must     | BR-004                                   |
| FR-020   | A save that fails at Firestore shows an error message and the form retains the entered values.                                          | Should   | No silent loss of typed data             |
| FR-021   | A seller can have multiple listings, and each is independently editable.                                                                | Should   |                                          |
| FR-022   | Listings are read from Firestore rather than from a module-level constant, so a saved listing survives a page reload.                      | Must     | Replaces the dummy-data path             |
| FR-023   | The app shows a distinct loading state while listings are being fetched.                                                               | Should   |                                          |
| FR-024   | The app shows a distinct empty state when the signed-in seller has no listings.                                                         | Should   |                                          |

## 9. Business rules

| ID       | Rule                                                                                                          | Applies to             |
| -------- | ------------------------------------------------------------------------------------------------------------- | ---------------------- |
| BR-001   | Every field marked required in §10 must be non-empty before a listing can be saved.                           | FR-006                 |
| BR-002   | Price, bedrooms, bathrooms, and area are non-negative numbers; bedrooms and bathrooms are whole numbers.      | FR-007                 |
| BR-003   | `status` is exactly `active` or `inactive`; no other value is written. A new listing defaults to `active`.     | FR-005, FR-016        |
| BR-004   | A listing's `ownerId` is set from the signed-in session at write time and is never taken from form input. A seller may only read and write listings where `ownerId` equals their own UID. | FR-002, FR-009, FR-012, FR-019 |
| BR-005   | Document IDs are server-generated. The client never supplies or reuses a listing ID on create.                 | FR-008                 |
| BR-006   | A listing is saved whole. There is no partial save, no autosave, and no draft document.                        | FR-008, FR-014        |
| BR-007   | An edit updates only the mutable field set; `ownerId`, `createdAt`, and the document ID are immutable.         | FR-014, FR-015         |
| BR-008   | Inactive listings are retained in Firestore and remain restorable by their owner; only their visibility changes. | FR-017, FR-018         |
| BR-009   | A seller can hold any number of listings; no per-seller cap is imposed in this iteration.                      | FR-021                 |
| BR-010   | No delete path exists in this iteration. Hiding is done by setting `status` to `inactive`.                      | FR-017                 |

## 10. Data model

Single collection. Document path: `listings/{autoId}`. `autoId` is server-generated.

| Entity     | Field          | Type      | Constraints                                                                 |
| ---------- | -------------- | --------- | --------------------------------------------------------------------------- |
| `listings` | *(document)*   | Document  | ID = Firestore auto ID (BR-005); path segment is an assumption — Q-004       |
| `listings` | `ownerId`      | string    | Firebase Auth UID of the seller; immutable after creation (BR-004, BR-007)   |
| `listings` | `title`        | string    | Required (BR-001)                                                           |
| `listings` | `description`  | string    | Required (BR-001)                                                           |
| `listings` | `price`        | number    | Required; non-negative (BR-001, BR-002)                                     |
| `listings` | `propertyType` | string    | Required (BR-001); enum values not yet fixed — Q-005                        |
| `listings` | `bedrooms`     | number    | Required; non-negative whole number (BR-001, BR-002)                        |
| `listings` | `bathrooms`    | number    | Required; non-negative whole number (BR-001, BR-002)                        |
| `listings` | `area`         | number    | Required; non-negative (BR-001, BR-002); unit not yet fixed — Q-005         |
| `listings` | `areaUnit`     | string    | **Not yet specified** — placeholder in the form, see Q-005                  |
| `listings` | `city`         | string    | Required (BR-001)                                                           |
| `listings` | `address`      | string    | Required (BR-001)                                                           |
| `listings` | `imageUrl`     | string    | Required (BR-001); a URL string only, no upload (Q-003)                      |
| `listings` | `status`       | string    | Enum `active` \| `inactive` (BR-003); defaults to `active`                   |
| `listings` | `createdAt`    | timestamp | `serverTimestamp()`; set once on create, immutable (FR-010, BR-007)          |
| `listings` | `updatedAt`    | timestamp | `serverTimestamp()`; rewritten on every successful save                       |

Fields `areaUnit` and `propertyType` enum are placeholders so the form renders something sane; they are not user-confirmed (Q-005).

## 11. API / interface

Firebase SDK calls made by the client. No custom backend exists.

| Call         | Target                    | Purpose                                       | Auth            | Errors                                                            |
| ------------ | ------------------------- | --------------------------------------------- | --------------- | ----------------------------------------------------------------- |
| `getDocs`    | `listings`, `ownerId ==`  | Load the seller's own listings (FR-012)       | Owner's session | `permission-denied`, `unavailable`                                |
| `addDoc`     | `listings`                | Create a listing (FR-008)                     | Owner's session | `permission-denied`, `unavailable`                                |
| `getDoc`     | `listings/{docId}`        | Load one listing into the edit form (FR-013)  | Owner's session | `permission-denied`, `unavailable`, `not-found`                   |
| `updateDoc`  | `listings/{docId}`        | Save an edit or status change (FR-014, FR-016)| Owner's session | `permission-denied`, `unavailable`                                |

Firestore security rules are inherited from the sign-in RFP's POC decision — currently wide open (BR-008 of that document, Q-014 there). Ownership is enforced in application code here (BR-004), which is not sufficient for production; see Q-006.

## 12. UI / UX notes

- **Surface:** a seller-only route reachable from the signed-in header. Route shape is not yet fixed — Q-007.
- **Form layout:** one column on mobile, single card on desktop. Fields grouped as *Basics* (title, propertyType, price, bedrooms, bathrooms, area), *Location* (city, address), *Media* (imageUrl), *Status*.
- **States:**
  - *Initial create* — all fields empty, status `active`, `Save` enabled but blocked by validation until required fields are filled.
  - *Editing* — form pre-filled from the stored document, `Save` labelled as an update.
  - *Loading* — a visible loading indicator while the seller's listings are fetched (FR-023).
  - *Empty* — a message telling the seller they have no listings yet (FR-024).
  - *Validation error* — the offending field is marked and named; no Firestore call is made.
  - *Save error* — an inline message naming the failure; the form keeps its values (FR-020).
  - *Saved* — a confirmation, then the list updates without a full page reload.
- **Copy:** status labels read `Active` / `Inactive` in the UI and are stored lowercase. The form must not imply that a listing goes live instantly if moderation is ever added (currently nothing is moderated).
- **Accessibility:** every input has a programmatically associated label; validation messages are announced; the form is fully keyboard operable (NFR-005).
- **Responsive:** usable from 360 px wide to desktop with no horizontal scroll (NFR-006).

## 13. Non-functional requirements

| ID       | Category        | Requirement                                                                                                          | Priority |
| -------- | --------------- | --------------------------------------------------------------------------------------------------------------------- | -------- |
| NFR-001  | Performance     | The seller's listing list renders within 3 seconds of a Firestore query completing on the local dev environment.      | Should   |
| NFR-002  | Performance     | Saving a listing shows feedback within 2 seconds of the click, even on failure.                                       | Should   |
| NFR-003  | Security       | No Firebase API key or project credential is committed to source control.                                            | Must     |
| NFR-004  | Security       | No Firebase Admin SDK or service-account credential is present in the client bundle.                                   | Must     |
| NFR-005  | Accessibility  | Every form control has an accessible name, the form is keyboard operable, and validation errors are announced.         | Should   |
| NFR-006  | Responsive     | The seller listing surface works from 360 px to desktop with no horizontal scroll.                                     | Should   |
| NFR-007  | Reliability    | A Firestore write failure never silently drops the user's typed values and never shows a success state.               | Must     |
| NFR-008  | Security       | **Known gap:** listing ownership is enforced only in client code. Firestore rules that enforce `ownerId == auth.uid` must exist before any non-test seller uses this (Q-006). | Must     |
| NFR-009  | Maintainability| Firestore read/write calls for listings live in a single module outside the components so they can be stubbed in tests. | Should   |
| NFR-010  | Configuration  | The app targets project `sdemo-5cbcd` and shows a clear message rather than a blank screen when config is absent.       | Should   |

## 14. Dependencies & integrations

| Dependency                              | Purpose                                              | Owner            | Status                                              |
| --------------------------------------- | ---------------------------------------------------- | ---------------- | --------------------------------------------------- |
| Firebase Authentication (Google)        | Supplies the seller UID written as `ownerId`          | Firebase project | Done — see [`firebase-google-signin-roles`](../firebase-google-signin-roles/requirements.md) |
| Cloud Firestore                        | Listing storage                                      | Firebase project | Available, rules wide open (Q-006)                  |
| Stored `users/{uid}.role == "seller"`   | The gate for reaching the seller surface             | This feature     | Consumed here for the first time                     |
| Dummy listings module (`src/data/listings.js`) | Source of today's fake homepage data          | Existing         | To be retired for seller-owned listings (FR-022)    |
| Firebase Storage                        | Image hosting                                        | —                | **Not used in this iteration** — URL string only (Q-003) |

## 15. Out of scope

- Deleting a listing; hiding via `status: "inactive"` is the only removal path (BR-010).
- Image upload — the form takes an image URL string only (Q-003).
- Admin review, approval, spam handling, or any moderation queue.
- Bulk import/export of listings, CSV upload.
- Editing price history, view counts, lead tracking, or enquiry threads.
- Buyer-facing enquiry, contact form, favourites, or saved searches.
- Geographic targeting, geocoding, or map placement of an address.
- Duplicate-listing detection — the same property can be published twice (Q-008).
- Native iOS or Android apps.

## 16. Assumptions & open questions

| ID    | Question / Assumption                                                                                                                       | Impact                                                                                              | Status |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------ |
| Q-001 | **Assumption** — the "seller" role is read from the existing `users/{uid}.role` document written by the sign-in feature; this feature creates no new role system. Confirm. | If wrong, the whole gate in FR-002/FR-003 is built on the wrong field. | Open |
| Q-002 | **Assumption** — the form field set is title, description, price, propertyType, bedrooms, bathrooms, area, city, address, image URL, status. The user said "put defaults, I will refine later". | A changed field set means a data-model migration once documents exist. | Open |
| Q-003 | **Assumption** — listing media is an image **URL** string, not an upload. Is Firebase Storage needed later? | An upload path changes the field from `imageUrl` to a Storage reference and adds a dependency. | Open |
| Q-004 | **Assumption** — the collection is named `listings`, keyed by an auto-generated ID. Confirm the name. | Renaming after data exists means a migration. | Open |
| Q-005 | `propertyType` enum values and the `area` unit (sq ft / sq m) are placeholders. Fix the allowed values and the unit. | Unvalidated free text lets inconsistent data into the collection; mixed units need conversion on the buyer side. | Open |
| Q-006 | Listing ownership is enforced in client code only, because Firestore rules are wide open (inherited from the sign-in RFP). When are `ownerId == auth.uid` rules added? | Until then any client can read or rewrite any seller's listing. Release blocker before real sellers. | Open |
| Q-007 | Is the seller surface a dedicated route (e.g. `/sell`), a modal from the header, or a new tab in the signed-in header menu? | Determines the route, the entry point, and back-button behaviour. | Open |
| Q-008 | Should identical listings be rejected as duplicates (same owner + title + address)? | Either a uniqueness rule or a deliberate "no duplicate detection" decision is needed. | Open |
| Q-009 | **Assumption** — the homepage continues to show dummy listings alongside real active listings during transition. Confirm whether dummy data is removed at launch. | If both render together, buyers see fake and real properties mixed, which is a credibility problem. | Open |
| Q-010 | Should a seller's listing be immediately live on save, or should there be a short "submitted" state before `active`? | A moderation step later would make every save path invalid. | Open |
| Q-011 | Which Google account will the E2E tests authenticate with as the seller, and how is it stored? | E2E cannot run unattended against live Firebase without it. | Open |
| Q-012 | Owner name for the header table. | Cosmetic only. | Open |
| Q-013 | Is `description` allowed to be long-form rich text or markdown, or plain text only? | Decides the input type and whether rendering must sanitise input. | Open |
| Q-014 | Can a seller edit the `status` from the edit form, or only via a separate control on the listing card? | Affects the edit flow and whether a status change needs its own save path. | Open |

## 17. Acceptance criteria

| ID       | Criterion                                                                                                       | Covers                                 |
| -------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| AC-001   | A signed-in seller can open the listing form, fill every field, and save; a new document appears in Firestore.     | FR-003, FR-004, FR-008, FR-009, FR-010 |
| AC-002   | A signed-out visitor and a signed-in buyer can neither open the seller surface nor cause any listing write.          | FR-001, FR-002                         |
| AC-003   | Saving with any required field empty is blocked and no Firestore document is created.                             | FR-006                                 |
| AC-004   | Price, bedrooms, bathrooms, and area reject negative and non-numeric input.                                        | FR-007                                 |
| AC-005   | Every stored listing has `ownerId` equal to the creating seller's UID, regardless of what the form contained.       | FR-009, BR-004                         |
| AC-006   | After a successful create the form is empty again and the new listing appears in the seller's list.               | FR-011, FR-012                         |
| AC-007   | The seller's list shows only their own listings.                                                                  | FR-012                                 |
| AC-008   | Opening an own listing loads its stored values into the form.                                                      | FR-013                                 |
| AC-009   | Saving an edit updates the same document — no second document is created — and `ownerId` and `createdAt` are unchanged. | FR-014, FR-015, BR-007           |
| AC-010   | Flipping status to `Inactive` and saving persists `status: "inactive"` and the listing disappears from buyer-facing surfaces. | FR-016, FR-017, BR-003          |
| AC-011   | Flipping back to `Active` restores the listing to buyer-facing surfaces without recreating it.                      | FR-018, BR-008                         |
| AC-012   | A seller cannot read or modify a listing owned by a different UID, and the data does not change.                   | FR-019, BR-004                         |
| AC-013   | A failed save shows an error and the form keeps everything the seller typed.                                        | FR-020, NFR-007                        |
| AC-014   | A listing saved in one session is still present after a full page reload, read from Firestore.                     | FR-022                                 |
| AC-015   | A seller with no listings sees an empty state, and sees a loading state while the query runs.                       | FR-023, FR-024                         |
| AC-016   | A seller can create, edit, and hold more than one listing independently.                                            | FR-021, BR-009                         |
| AC-017   | The surface is fully usable by keyboard and at 360 px wide with no horizontal scroll.                               | NFR-005, NFR-006                       |
| AC-018   | No committed credential or Admin SDK appears in the client bundle, and Firestore rules enforcing `ownerId` are a recorded release blocker. | NFR-003, NFR-004, NFR-008 |

## 18. Change log

| Date       | Version | Change      | By     |
| ---------- | ------- | ----------- | ------ |
| 2026-10-19 | 0.1     | Initial draft | `<name>` |