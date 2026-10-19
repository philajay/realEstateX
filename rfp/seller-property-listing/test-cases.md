# Seller Property Listing — Test Cases

| Field            | Value                                            |
| ---------------- | ------------------------------------------------ |
| Requirements     | [`requirements.md`](./requirements.md)           |
| Slug             | `seller-property-listing`                       |
| Date             | `2026-10-19`                                     |
| Author           | `<name>`                                         |
| Requirements ver | 0.1                                              |

## 1. Test strategy

- **Levels in scope:** **E2E only** — driven through a real Chromium browser with `playwright-cli`, against the running app. Chosen by the user. No unit or integration suites are written here.
- **Out of scope:**
  - Unit tests of Firestore wrapper functions — no unit-test framework exists in this repo.
  - Component-level tests — no test runner is configured.
  - Firestore security-rule tests via emulator — no emulator is set up; rules are wide open (Q-006), so a rule test would assert nothing today.
  - Firestore REST/console checks are **not** used as a substitute for UI assertions; the seller-facing surface is the contract under test.
- **Environment:** local Vite dev server (`npm run dev`) on the loopback origin, live Firebase project `sdemo-5cbcd`, Google sign-in through the existing sign-in feature.
- **Test data:**
  - **Seller account** — a Google account whose stored `users/{uid}.role` is `seller`. Credentials come from the environment, never committed. **Blocked on Q-011.**
  - **Buyer account** — a second Google account with `role: buyer`, used only for the negative permission cases.
  - **Fixture listing** — created by the test itself rather than seeded, so ownership is unambiguous. Runs use a fresh listing per test; no test deletes or mutates another test's record.
  - **Dummy homepage listings** — the existing `src/data/listings.js` entries, used only to confirm coexistence behaviour under Q-009.
- **Entry/exit criteria:**
  - Entry — dev server up, Firebase env vars present, seller and buyer accounts available.
  - Exit — every `Must` case has an evidence screenshot in `evidence/` and a recorded Pass/Fail/Blocked verdict; every `Blocked` case names the open question that blocks it; no case is silently skipped.
- **Evidence convention:** `evidence/<TC ID>-<slug>.png`, one screenshot per executed case. Cases that cannot run get an entry in `evidence/SKIPPED.md` naming the blocking question.

## 2. Traceability matrix

| Req ID | Test cases | Notes |
| ------ | ---------- | ----- |
| FR-001  | TC-ACC-001, TC-ACC-004 | Signed-out blocked at the surface and at the write path |
| FR-002  | TC-ACC-002, TC-ACC-004 | Buyer role blocked |
| FR-003  | TC-ACC-003, TC-FRM-001 | Seller reaches the surface and the form |
| FR-004  | TC-FRM-001, TC-FRM-002 | Every default field present with an accessible name |
| FR-005  | TC-STS-001, TC-STS-002 | Status control offers exactly active/inactive, defaults active |
| FR-006  | TC-FRM-003, TC-FRM-004, TC-FRM-005 | Empty-required blocks the save; no document written |
| FR-007  | TC-FRM-006, TC-FRM-007, TC-FRM-008, TC-FRM-009, TC-FRM-010 | Numeric type, sign, whole-number, and boundary |
| FR-008  | TC-CRT-001, TC-CRT-002 | Create writes one document with a server-generated ID |
| FR-009  | TC-CRT-003, TC-OWN-004 | `ownerId` from session, not from form input |
| FR-010  | TC-CRT-004 | `createdAt` present and server-assigned |
| FR-011  | TC-CRT-005 | Form clears after a successful create |
| FR-012  | TC-OWN-003, TC-EDT-006 | List contains only the seller's own listings |
| FR-013  | TC-EDT-001 | Stored values pre-fill the form |
| FR-014  | TC-EDT-002, TC-EDT-003 | Same document updated, no duplicate created |
| FR-015  | TC-EDT-004 | `ownerId` and `createdAt` untouched by an edit |
| FR-016  | TC-STS-003, TC-STS-004 | Status change persists to Firestore |
| FR-017  | TC-VIS-001, TC-VIS-002, TC-STS-005 | Inactive hidden from buyers; active shown |
| FR-018  | TC-STS-006 | Reactivation restores visibility without recreating |
| FR-019  | TC-OWN-001, TC-OWN-002 | Cross-owner read and write both rejected |
| FR-020  | TC-ERR-001, TC-ERR-003 | Failure surfaces, values retained, retry works |
| FR-021  | TC-CRT-006, TC-EDT-005 | Two listings, independently editable |
| FR-022  | TC-CRT-007, TC-VIS-003 | Data read from Firestore; survives reload |
| FR-023  | TC-STA-001 | Loading state observable during fetch |
| FR-024  | TC-STA-002 | Empty state for a seller with no listings |
| NFR-001 | TC-PERF-001 | List render budget measured in-browser |
| NFR-002 | TC-PERF-002 | Save-feedback budget measured in-browser |
| NFR-003 | TC-SEC-001 | Repo scan for committed credentials |
| NFR-004 | TC-SEC-002 | Bundle scan for Admin SDK / service account |
| NFR-005 | TC-A11Y-001, TC-A11Y-002 | Accessible names, keyboard operation, announced errors |
| NFR-006 | TC-RSP-001 | 360 px with no horizontal scroll |
| NFR-007 | TC-ERR-002, TC-ERR-003 | Never a success state on a failed write |
| NFR-008 | — | Not directly testable — see §7; this is a recorded blocker, not a pass/fail behaviour |
| NFR-009 | — | Not directly testable — see §7; structural, verified by code review |
| NFR-010 | TC-CFG-001 | Clear message when Firebase config is absent |

## 3. Functional test cases

### Access control

| TC ID     | Req ID  | Title                                        | Type | Priority | Preconditions                          | Steps                                                                                                      | Expected result |
| --------- | ------- | -------------------------------------------- | ---- | -------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------- |
| TC-ACC-001 | FR-001 | Signed-out visitor cannot open seller surface | E2E | Must     | Dev server running; signed out           | 1. Open the app home.<br>2. Navigate directly to the seller surface by URL.<br>3. Click any header entry point to it. | The seller surface never renders. The visitor is refused or redirected, and no listing form is present anywhere on the page. |
| TC-ACC-002 | FR-002 | Buyer cannot open seller surface             | E2E | Must     | Signed in with `role: buyer`            | 1. Open the seller surface directly by URL.<br>2. Attempt to trigger a save through any control that is reachable. | The seller surface never renders for a buyer. No listing document is created or changed by the attempt. |
| TC-ACC-003 | FR-003 | Seller can reach the seller surface          | E2E | Must     | Signed in with `role: seller`           | 1. Open the app.<br>2. Use the seller entry point from the signed-in header.                                 | The seller listing surface renders with the form and the seller's own listings. |
| TC-ACC-004 | FR-001, FR-002 | No write path is reachable without the seller role | E2E | Must | Signed out, then re-signed in as a buyer | 1. While signed out, load the seller surface URL.<br>2. Sign in as a buyer.<br>3. Re-request the seller surface URL. | Both attempts fail the same way as TC-ACC-001 and TC-ACC-002. The listing count is identical before and after, proving no write slipped through. |

### Form and validation

| TC ID     | Req ID  | Title                                                    | Type | Priority | Preconditions                       | Steps                                                                                                    | Expected result |
| --------- | ------- | -------------------------------------------------------- | ---- | -------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------- |
| TC-FRM-001 | FR-003, FR-004 | Form exposes every default field | E2E | Must | Signed in as seller                 | 1. Open the seller surface.<br>2. Inspect the form controls.                                                                                     | Title, description, price, property type, bedrooms, bathrooms, area, city, address, image URL, and status are all present and each has an accessible name. |
| TC-FRM-002 | FR-004  | New form starts empty with status active                | E2E | Must     | Seller has at least one listing     | 1. Open a fresh create form.                                                                             | Every field is empty and the status control reads `Active`. |
| TC-FRM-003 | FR-006  | Save is blocked while a required field is empty         | E2E | Must     | Signed in as seller                 | 1. Open a new form.<br>2. Click `Save` without filling anything.                                                                              | The save is refused, an error naming the empty required fields is shown, and no listing document is created. |
| TC-FRM-004 | FR-006  | Each required field blocks the save on its own          | E2E | Must     | Signed in as seller                 | 1. Fill all required fields except one.<br>2. Click `Save`.<br>3. Repeat for every required field in turn.                                                            | Every single omission is refused. The saved-listing count does not increase in any of the iterations. |
| TC-FRM-005 | FR-006  | The offending field is identified                        | E2E | Must     | Signed in as seller                 | 1. Fill all required fields except `city`.<br>2. Click `Save`.                                                                                    | The error names the `city` field specifically and marks that control, rather than showing one generic failure message. |
| TC-FRM-006 | FR-007  | Non-numeric price is rejected                           | E2E | Must     | Signed in as seller                 | 1. Fill a complete valid form but set price to `abc`.<br>2. Click `Save`.                                                                        | The save is refused with a validation message on the price field. No document is written. |
| TC-FRM-007 | FR-007  | Negative price is rejected                              | E2E | Must     | Signed in as seller                 | 1. Fill a complete valid form but set price to a negative value.<br>2. Click `Save`.                                                               | The save is refused. No document is written. |
| TC-FRM-008 | FR-007  | Fractional bedrooms is rejected                         | E2E | Must     | Signed in as seller                 | 1. Fill a complete valid form but set bedrooms to a fractional value.<br>2. Click `Save`.                                                          | The save is refused because bedrooms must be a whole number. No document is written. |
| TC-FRM-009 | FR-007  | Zero is accepted for numeric fields                     | E2E | Should   | Signed in as seller                 | 1. Fill a complete valid form with price, bedrooms, bathrooms, and area all `0`.<br>2. Click `Save`.                                                                     | The save succeeds — zero is non-negative, not missing. The stored values are `0`, not blank or null. |
| TC-FRM-010 | FR-007  | Numeric values are stored as numbers, not text          | E2E | Must     | Signed in as seller                 | 1. Save a listing with a valid numeric price.<br>2. Read the stored document.                                                                  | The numeric fields are stored as numbers, not quoted strings. |

### Create

| TC ID     | Req ID  | Title                                        | Type | Priority | Preconditions                    | Steps                                                                                | Expected result |
| --------- | ------- | -------------------------------------------- | ---- | -------- | --------------------------------- | ------------------------------------------------------------------------------------ | --------------- |
| TC-CRT-001 | FR-008  | Saving a valid form creates one document     | E2E | Must     | Signed in as seller              | 1. Record the seller's listing count.<br>2. Fill a complete valid form.<br>3. Click `Save`.                                                     | Exactly one new document exists in `listings`. The count increased by one. |
| TC-CRT-002 | FR-008  | The document ID is server-generated           | E2E | Must     | A listing was just created       | 1. Read the created document.<br>2. Attempt the same create again with identical field values.                                                  | The document ID is not client-supplied — the client submits no ID and the server assigns one. A second save creates a second, independently identified document. |
| TC-CRT-003 | FR-009  | `ownerId` matches the signed-in seller        | E2E | Must     | Seller signed in, UID known      | 1. Save a listing.<br>2. Read the created document.<br>3. Compare `ownerId` with the signed-in UID.                                              | `ownerId` equals the signed-in seller's Firebase UID exactly. |
| TC-CRT-004 | FR-010  | `createdAt` is a server timestamp             | E2E | Must     | A listing was just created       | 1. Save a listing.<br>2. Read the created document.                                                                                             | `createdAt` exists and holds a Firestore server-assigned timestamp, not a browser-clock string. |
| TC-CRT-005 | FR-011  | The form clears after a successful save       | E2E | Must     | A valid listing was just saved   | 1. After TC-CRT-001, inspect the form.                                                                                                          | Every field is back to empty and the status control reads `Active` again. |
| TC-CRT-006 | FR-021, BR-009 | A seller can hold more than one listing    | E2E | Should   | Seller has one listing            | 1. Save a second listing with different values.<br>2. Inspect the seller's list.                                                               | Two distinct listings are listed. Neither replaced or overwrote the other. |
| TC-CRT-007 | FR-022  | A saved listing survives a page reload       | E2E | Must     | A listing was just saved          | 1. Reload the page.<br>2. Open the seller surface.<br>3. Look for the saved listing.                                                             | The listing is still there, with the values that were saved, read back from Firestore. |

### Edit

| TC ID     | Req ID  | Title                                            | Type | Priority | Preconditions                     | Steps                                                                                     | Expected result |
| --------- | ------- | ------------------------------------------------ | ---- | -------- | ---------------------------------- | ------------------------------------------------------------------------------------------ | --------------- |
| TC-EDT-001 | FR-013  | Opening an own listing pre-fills the form        | E2E | Must     | Seller has a listing               | 1. Open the seller surface.<br>2. Open that listing for editing.<br>3. Compare each field with the stored values. | Every form field shows the stored value for that listing, not empty and not another listing's values. |
| TC-EDT-002 | FR-014  | An edit updates the same document                | E2E | Must     | One listing exists                 | 1. Record the listing count and the document ID.<br>2. Edit the title.<br>3. Save.<br>4. Re-read the document. | The document count is unchanged and the same document ID now holds the new title. No second document was created. |
| TC-EDT-003 | FR-014  | A second edit does not duplicate the listing      | E2E | Must     | One listing exists                 | 1. Edit and save the price.<br>2. Edit and save the title.<br>3. Count the documents for this seller.              | Exactly one document exists. Both edits are present in that single document. |
| TC-EDT-004 | FR-015  | An edit leaves `ownerId` and `createdAt` intact   | E2E | Must     | A listing exists and is open      | 1. Record `ownerId` and `createdAt`.<br>2. Change several fields and save.<br>3. Re-read the document.            | `ownerId` and `createdAt` are byte-for-byte what they were. Only the edited fields changed. |
| TC-EDT-005 | FR-021  | Listings are edited independently                  | E2E | Should   | Seller has two listings            | 1. Edit listing A's title and save.<br>2. Open listing B and check its title.<br>3. Re-open listing A.             | Listing B is unchanged, and listing A holds only the new title. Editing one does not leak into the other. |
| TC-EDT-006 | FR-012  | The seller's list holds only their own listings    | E2E | Must     | Seller has listings                | 1. Open the seller surface.<br>2. Read the `ownerId` of every listed listing.                                                                       | Every listed listing has an `ownerId` equal to the signed-in seller's UID. |

### Status: active / inactive

| TC ID     | Req ID  | Title                                                     | Type | Priority | Preconditions                        | Steps                                                                                          | Expected result |
| --------- | ------- | --------------------------------------------------------- | ---- | -------- | ------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------- |
| TC-STS-001 | FR-005, BR-003 | The status control offers exactly active and inactive | E2E | Must | Signed in as seller                  | 1. Inspect the status control.<br>2. Select the other option.                                                                                       | Exactly two options are offered, `Active` and `Inactive`. Selecting one clears the other. |
| TC-STS-002 | FR-005, BR-003 | A new listing defaults to active                     | E2E | Must     | A fresh create form                  | 1. Open a new form.<br>2. Save without touching the status control.<br>3. Read the stored document.                                                        | The stored `status` is exactly `active` — lowercase, as specified in BR-003. |
| TC-STS-003 | FR-016 | Deactivating persists to Firestore                  | E2E | Must     | An active listing exists             | 1. Set the listing to `Inactive`.<br>2. Save.<br>3. Reload and re-read the document.                                                                   | The stored `status` is exactly `inactive` and stays that way after a reload. |
| TC-STS-004 | FR-016 | Reactivating persists to Firestore                   | E2E | Must     | An inactive listing exists           | 1. Set the listing to `Active`.<br>2. Save.<br>3. Reload and re-read the document.                                                                      | The stored `status` is exactly `active` and stays that way after a reload. |
| TC-STS-005 | FR-017, BR-008 | An inactive listing is retained, not deleted      | E2E | Must     | An inactive listing exists           | 1. After TC-STS-003, confirm the listing is still in the seller's own list.<br>2. Read the document.                                                     | The document still exists and is still restorable. Only its visibility changed — nothing was deleted. |
| TC-STS-006 | FR-018 | Reactivating restores the listing                   | E2E | Must     | An inactive listing exists           | 1. Re-activate the listing.<br>2. Reload.<br>3. Confirm the same document is now buyer-visible.                                                          | The same document — same ID — is visible to buyers again. It was not recreated. |

### Buyer-facing visibility

| TC ID     | Req ID  | Title                                                     | Type | Priority | Preconditions                                    | Steps                                                                          | Expected result |
| --------- | ------- | --------------------------------------------------------- | ---- | -------- | --------------------------------------------------- | ------------------------------------------------------------------------------- | --------------- |
| TC-VIS-001 | FR-017  | An inactive listing is absent from buyer surfaces        | E2E | Must     | A seller listing is inactive; buyer is signed in    | 1. Deactivate the listing and confirm it saved.<br>2. Open the buyer-facing listing surfaces.<br>3. Search for that listing's title. | The listing does not appear anywhere a buyer can see it. |
| TC-VIS-002 | FR-017  | An active listing appears on buyer surfaces               | E2E | Must     | A seller listing is active; buyer is signed in      | 1. Activate the listing and confirm it saved.<br>2. Open the buyer-facing listing surfaces.<br>3. Search for that listing's title.   | The listing appears with its saved values, so the toggle genuinely gates visibility rather than only changing a stored string. |
| TC-VIS-003 | FR-022  | Buyer-visible data is read from Firestore                | E2E | Must     | An active seller listing exists                      | 1. Note the listing's saved values.<br>2. Open the buyer surface.<br>3. Confirm the displayed values match.                    | The values shown to a buyer are the persisted ones. No seller listing is sourced from a hard-coded module constant. |

### Ownership

| TC ID     | Req ID  | Title                                                    | Type | Priority | Preconditions                                   | Steps                                                                                                   | Expected result |
| --------- | ------- | -------------------------------------------------------- | ---- | -------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | --------------- |
| TC-OWN-001 | FR-019  | A seller cannot open another seller's listing            | E2E | Must     | Seller A and seller B both have listings          | 1. Sign in as seller B.<br>2. Open the seller surface.<br>3. Attempt to open seller A's listing by its document ID. | Seller A's listing never loads. Seller B's list does not contain it, and no edit form appears for it. |
| TC-OWN-002 | FR-019  | A cross-owner write changes nothing                     | E2E | Must     | Seller A's listing exists; seller B signed in     | 1. Sign in as seller B.<br>2. Attempt any reachable write against seller A's document ID.<br>3. Re-read that document as seller A. | The attempt is refused and the stored document is unchanged — same `ownerId`, same `status`, same field values. |
| TC-OWN-003 | FR-012, BR-004 | A seller's list is scoped to their own UID           | E2E | Must     | Seller A and seller B both have listings          | 1. Sign in as seller A and record the list.<br>2. Sign in as seller B and record the list.<br>3. Compare the two lists. | The two lists are disjoint. Neither seller sees the other's listings. |
| TC-OWN-004 | FR-009, BR-004 | `ownerId` cannot be spoofed through form input        | E2E | Must     | Seller A signed in; seller B has a listing         | 1. Sign in as seller A.<br>2. Put seller B's UID into any form control that could carry it, or tamper with the write request.<br>3. Read the created document. | The stored `ownerId` is seller A's UID regardless. The write is taken from the session, not from anything the client can set (BR-004). |

### Loading and empty states

| TC ID     | Req ID  | Title                                          | Type | Priority | Preconditions                    | Steps                                                                     | Expected result |
| --------- | ------- | ---------------------------------------------- | ---- | -------- | --------------------------------- | --------------------------------------------------------------------------- | --------------- |
| TC-STA-001 | FR-023  | A loading state is shown while listings fetch   | E2E | Should   | Signed in as seller; network throttle active | 1. Throttle the network.<br>2. Open the seller surface.<br>3. Observe the surface before the query resolves. | A visible loading indicator appears, distinct from both the empty state and the populated list. |
| TC-STA-002 | FR-024  | An empty state is shown with no listings       | E2E | Should   | Signed in as a seller with no listings | 1. Open the seller surface.<br>2. Observe the area where the list would be. | A message explains there are no listings yet, and it is distinguishable from the loading state. |

## 4. Negative & edge cases

| TC ID     | Req ID              | Scenario                                                  | Expected result |
| --------- | ------------------- | --------------------------------------------------------- | --------------- |
| TC-ERR-001 | FR-020             | A Firestore save fails while the seller is typing a new listing. | An error message naming the failure is shown, and every field still holds what the seller typed. Nothing appears to have succeeded. |
| TC-ERR-002 | NFR-007            | The write fails *after* the UI has already shown feedback. | The UI never shows a success state for a write that did not land. The listing count does not change. |
| TC-ERR-003 | FR-020, NFR-007    | The seller retries after a failed save, with the network restored. | The retry succeeds using the retained form values, and exactly one document is created — not two. |
| TC-NEG-001 | FR-006, BR-001      | A required field containing only whitespace.                | Treated as empty. The save is refused and the whitespace-only field is named in the error. |
| TC-NEG-002 | FR-007, BR-002      | A price that is enormous or otherwise nonsensical but numeric. | Either accepted as a valid number or refused by an explicit rule — but never stored as `NaN`, `undefined`, or `Infinity`. |
| TC-NEG-003 | FR-006              | A double-click on `Save`.                                   | Exactly one document is created. A second click while the first save is in flight does not duplicate. |
| TC-NEG-004 | FR-022              | The page is reloaded immediately after clicking `Save`, before the seller sees confirmation. | After the reload the listing is present exactly once. The write completed before the reload or not at all — never a half-written record. |
| TC-NEG-005 | FR-013              | A listing's document no longer exists by the time it is opened for editing. | The failure is surfaced as an error, not as an empty form that would silently create a new listing on save. |
| TC-NEG-006 | FR-005, BR-003      | A tampered write request carrying `status` other than `active` or `inactive`. | The value is rejected or coerced to a valid enum. Nothing else is stored in `status`. |
| TC-NEG-007 | FR-020              | The seller navigates away while a save is in flight.        | The app does not report a successful save that never landed, and does not crash on the unmounted screen. |

## 5. Non-functional test cases

| TC ID      | Req ID  | Category        | Check                                                                     | Pass criteria |
| ---------- | ------- | --------------- | -------------------------------------------------------------------------- | ------------- |
| TC-PERF-001 | NFR-001 | Performance     | Time from the Firestore listings query resolving to the seller's list being painted. | Under 3 seconds on the local dev environment. Measured in-browser, not asserted on a fixed copy string. |
| TC-PERF-002 | NFR-002 | Performance     | Time from clicking `Save` to any visible feedback — success or error.       | Under 2 seconds in both the success and the failure case. A failure must not hang without feedback. |
| TC-SEC-001 | NFR-003 | Security        | Repository scan for committed Firebase credentials in tracked source.       | No API key, project ID credential, or service-account JSON outside an ignored env file. |
| TC-SEC-002 | NFR-004 | Security        | Production bundle scan for `firebase-admin` or a service-account private key. | Neither appears in the client bundle. |
| TC-A11Y-001 | NFR-005 | Accessibility   | Every form control on the seller surface has a programmatic accessible name.  | No control is unnamed or named only by placeholder text; the accessibility snapshot shows a name for each. |
| TC-A11Y-002 | NFR-005 | Accessibility   | The form can be completed and saved using the keyboard alone, and a validation failure is announced. | Focus order reaches every control; `Tab`/`Shift+Tab` complete the flow; the invalid field receives focus or is announced on failure. |
| TC-RSP-001 | NFR-006 | Responsive       | The seller surface at a 360 px viewport width.                              | No horizontal scrollbar; every form control is reachable and usable; the save control is visible without horizontal panning. |
| TC-CFG-001 | NFR-010 | Configuration    | The app starts with Firebase env vars absent.                               | A clear message explains the missing configuration instead of a blank screen or an unhandled exception. |

## 6. BDD scenarios

```gherkin
Feature: Seller property listing
  As a seller
  I want to publish and maintain my own property listings
  So that buyers can see the properties I actually have

  Scenario: Create a listing
    Given I am signed in with the role "seller"
    And I have no draft saved
    When I fill every required field of the listing form with valid values
    And I click "Save"
    Then a new document exists in the listings collection
    And its "ownerId" is my Firebase user id
    And its "createdAt" is a server timestamp
    And its "status" is "active"
    And the form is empty again
    And the new listing appears in my list

  Scenario: Create is refused when a required field is empty
    Given I am signed in with the role "seller"
    And I have recorded my current listing count
    When I fill every required field except "city"
    And I click "Save"
    Then the error names the "city" field
    And no document is created
    And my listing count is unchanged

  Scenario: Create is refused for a non-numeric price
    Given I am signed in with the role "seller"
    When I fill a complete form with price "abc"
    And I click "Save"
    Then the save is refused with a validation message on the price field
    And no document is created

  Scenario: Edit an existing listing
    Given I am signed in with the role "seller"
    And I own a listing titled "Old title"
    When I open that listing for editing
    Then the form is pre-filled with the stored values
    When I change the title to "New title" and save
    Then the same document now holds "New title"
    And no second document exists
    And its "ownerId" and "createdAt" are unchanged

  Scenario: Deactivate a listing
    Given I am signed in with the role "seller"
    And I own an active listing
    When I set its status to "Inactive" and save
    Then the stored status is "inactive"
    And the listing still exists and is still restorable
    And the listing is not visible to a buyer
    And the listing is still listed in my own list

  Scenario: Reactivate a listing
    Given I own an inactive listing
    When I set its status to "Active" and save
    Then the stored status is "active"
    And the same document is visible to a buyer again

  Scenario: A saved listing survives a reload
    Given I have just saved a listing
    When I reload the page
    And I open the seller listing surface
    Then the listing is listed with the values I saved

  Scenario: A buyer cannot reach the seller surface
    Given I am signed in with the role "buyer"
    And I have recorded the current listing count
    When I try to open the seller listing surface
    Then the seller listing surface does not render
    And the listing count is unchanged

  Scenario: A seller cannot open another seller's listing
    Given seller A owns a listing
    And I am signed in as seller B
    When I try to open seller A's listing by its document id
    Then seller A's listing does not load
    And seller A's listing is unchanged

  Scenario: A failed save keeps the seller's input
    Given I am signed in with the role "seller"
    And the Firestore write will fail
    When I fill a complete form and click "Save"
    Then an error message is shown
    And no success state is shown
    And every field still holds what I typed

  Scenario: Retrying after a failure creates exactly one listing
    Given a save has failed and my form still holds my input
    And the Firestore write will now succeed
    When I click "Save" again
    Then exactly one document is created

  Scenario: A seller with no listings
    Given I am signed in as a seller who has never saved a listing
    When I open the seller listing surface
    Then an empty state explains that I have no listings yet
```

## 7. Not directly testable

| Req ID  | Why                                                                                                                                       | How it will be verified                                                                                                                                                    |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-008 | This is a *recorded blocker*, not an observable behaviour. Ownership is enforced in client code, so no browser test can prove enforcement — the very code under test would be the enforcement. Today a compliant test passes and a non-compliant one also passes. | A Firestore rules test that attempts a cross-owner write and expects a `permission-denied`. It becomes testable the day rules exist (Q-006). Until then it is a release blocker, not a passing check. |
| NFR-009 | Structural, not behavioural. "Lives in a single module" is a property of the source layout, not of anything a browser can observe.                         | Code review of the listing Firestore module, plus a test-suite double confirming components hold no direct SDK calls.                                                            |

## 8. Open questions

| ID    | Question                                                                              | Blocks |
| ----- | ------------------------------------------------------------------------------------- | ------ |
| Q-004 | The collection name is assumed to be `listings`. Every case that reads or counts stored documents depends on it. | TC-CRT-001, TC-CRT-002, TC-CRT-004, TC-EDT-002, TC-EDT-003, TC-EDT-004, TC-OWN-002, TC-OWN-003, TC-OWN-004, TC-STS-002, TC-STS-003, TC-STS-004, TC-VIS-003 |
| Q-007 | Where does the seller surface live — a route, a modal, or a header menu tab? The route is unknown, so every navigation step is provisional. | TC-ACC-001, TC-ACC-002, TC-ACC-003, TC-ACC-004, and the `Given` block of every BDD scenario |
| Q-011 | Which Google account authenticates as the seller in E2E, and how are its credentials supplied? Nothing in this suite can run until this is answered. | Every case — the whole suite is blocked |
| Q-001 | Is the seller role read from `users/{uid}.role` as the sign-in feature writes it? If not, the permission cases assert the wrong thing. | TC-ACC-002, TC-ACC-003, TC-ACC-004, and the fixture setup for every case |
| Q-005 | What are the allowed `propertyType` values and the `area` unit? TC-NEG-002 and any boundary case on area are provisional until these are fixed. | TC-NEG-002, TC-FRM-009 |
| Q-006 | With Firestore rules wide open, TC-OWN-002 can only prove the *UI* refused the write — it cannot prove the write is impossible. The test's stated pass criteria may need weakening until rules exist. | TC-OWN-001, TC-OWN-002, TC-OWN-004 |
| Q-003 | Is media an image URL or a Firebase Storage upload? The form field and TC-FRM-001's field list both change if an upload is added. | TC-FRM-001 |
| Q-009 | Does the homepage keep showing the dummy listings alongside real active ones? If dummy data is removed at launch, TC-VIS-001 and TC-VIS-002 need a different search target. | TC-VIS-001, TC-VIS-002, TC-VIS-003 |