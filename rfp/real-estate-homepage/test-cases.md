# Real Estate Website Home Page — Test Cases

| Field            | Value                            |
| ---------------- | -------------------------------- |
| Requirements     | [`requirements.md`](./requirements.md) |
| Slug             | `real-estate-homepage`           |
| Date             | `2026-10-19`                     |
| Author           | `<name>`                         |
| Requirements ver | 0.3                              |

## 1. Test strategy

- **Levels in scope:** unit (components and pure formatting logic), integration (components wired to the mock dataset), E2E (full page in a browser), manual (visual, responsive, and copy review).
- **Out of scope:** performance and load testing beyond a local dev build; cross-browser coverage beyond Chromium and Firefox — no engine or browser matrix was confirmed by the user (Q-008). SEO checks are limited to on-page tags, not crawl or Core Web Vitals scoring.
- **Environment:** local dev server. No staging URL exists for this feature. The page makes no backend calls (BR-001), so no environment configuration or API keys are needed.
- **Test data:** the in-repo mock listing dataset, which per BR-006 must contain at least six listings across at least three property types, all for sale, with Indian place names per BR-008 and prices in Rupees. Negative cases use purpose-built fixture variants — empty dataset, single-type dataset, duplicate `id`, missing `areaSqft`, failing image URL, `featured: "true"` as a string.
- **Entry/exit criteria:** the page renders with no console errors, all Must-priority FRs have passing tests, and every Should-priority FR has at least one test executed (pass or fail). Exit requires no open Critical or High defects.
- **Permission coverage:** not applicable in this iteration. The page has no authenticated roles and no gated capability — every visitor sees the same header, listings, and footer, and no content is hidden per role. The sign in / register control (FR-004) is a link only and grants nothing. Permission test cases must be added when auth lands.
- **Automation:** this document is the specification. Executable tests are written later against `playwright-cli` (see `.opencode/skills/playwright-cli`) — the E2E and integration rows below map directly onto browser commands, and the unit rows map onto plain function calls. The suite lives at `e2e/run-e2e.sh` and writes a screenshot per executed case to `rfp/evidence/<TC-ID>-<slug>.png`, captured at the moment of assertion on both pass and fail. Cases listed in `rfp/evidence/SKIPPED.md` produce no artifact.
- **Coverage ratio per requirement:** every FR has at least one happy-path case; requirements with a state machine, formatting rule, or failure mode also carry boundary, negative, and error/recovery cases.

## 2. Traceability matrix

Every FR and NFR from `requirements.md` must appear here.

| Req ID | Test cases                                                                                                                                                | Notes                                                 |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| FR-001 | TC-LST-001, TC-LST-002, TC-LST-003                                                                                                                       |                                                       |
| FR-002 | TC-HDR-001, TC-HDR-002, TC-CRD-010                                                                                                                    | Logo is an image, not text — assert the img element, not innerText                                  |
| FR-003 | TC-HDR-003, TC-HDR-004                                                                                                                                 | Targets pending Q-003 — assert `href` present. No Rent link, per FR-027. |
| FR-004 | TC-HDR-005                                                                                                                                             | Superseded by `rfp/firebase-google-signin-roles` — the placeholder link is now a live button that opens the sign-in surface (its FR-002) |
| FR-005 | TC-HDR-006, TC-HDR-007, TC-HDR-008, TC-HDR-009, TC-NEG-014                                                                                             | Breakpoint pending Q-011                              |
| FR-006 | TC-LST-004, TC-LST-005                                                                                                                                 |                                                       |
| FR-007 | TC-LST-006, TC-LST-007, TC-NEG-010, TC-NEG-013                                                                                                        |                                                       |
| FR-008 | TC-CRD-001                                                                                                                                              | Image source pending Q-004                            |
| FR-009 | TC-CRD-002, TC-CRD-003, TC-CRD-009, TC-DAT-005, TC-NEG-009                                                                                         | Formatting rule is BR-002; grouping rule is FR-026                                                         |
| FR-010 | TC-CRD-004, TC-CRD-005, TC-DAT-009                                                                                                                | Type shown; no status badge — sale status is site-wide, per FR-027                                       |
| FR-011 | TC-CRD-006                                                                                                                                              |                                                       |
| FR-012 | TC-CRD-007                                                                                                                                              | Target unresolved — Q-002 blocks asserting `href`   |
| FR-013 | TC-CRD-008, TC-NEG-007, TC-NEG-008                                                                                                                     | Strict check is BR-004                                |
| FR-014 | TC-FLT-002, TC-FLT-005, TC-DAT-001                                                                                                                     | Filter dimensions pending Q-009                       |
| FR-015 | TC-FLT-003                                                                                                                                              |                                                       |
| FR-016 | TC-FLT-004, TC-NEG-002                                                                                                                                 |                                                       |
| FR-017 | TC-NEG-001, TC-NEG-002, TC-NEG-003                                                                                                                     |                                                       |
| FR-018 | TC-FLT-006, TC-FLT-007, TC-NEG-003                                                                                                                     |                                                       |
| FR-019 | TC-FTR-001, TC-FTR-002, TC-FTR-003, TC-CRD-011                                                                                                          | Logo is an image, not text — TC-FTR-001 revised accordingly                                       |
| FR-020 | TC-FTR-004, TC-FTR-005                                                                                                                                 | Targets pending Q-003                                 |
| FR-021 | TC-FTR-006, TC-NEG-011, TC-NEG-012                                                                                                                     | Submit behaviour pending Q-005                        |
| FR-022 | TC-FTR-007                                                                                                                                              |                                                       |
| FR-023 | TC-FTR-008                                                                                                                                              |                                                       |
| FR-024 | TC-NEG-005, TC-NEG-015                                                                                                                                 |                                                       |
| FR-025 | TC-NEG-006                                                                                                                                              |                                                       |
| FR-026 | TC-CRD-009                                                                                                                                              | Copy depends on Q-013 (full grouped value vs Cr/Lakh shorthand) — assert Indian grouping, not exact copy |
| FR-027 | TC-NEG-016, TC-DAT-004, TC-HDR-010                                                                                                                     |                                                       |
| FR-028 | TC-HDR-011, TC-FTR-009, TC-CRD-010                                                                                                                     |                                                       |
| FR-029 | TC-CRD-012                                                                                                                                              |                                                       |
| NFR-001 | TC-PERF-001, TC-PERF-002                                                                                                                              | Budget not quantified by the user — see Q-008        |
| NFR-002 | TC-HDR-009, TC-A11Y-001, TC-A11Y-002                                                                                                                   |                                                       |
| NFR-003 | TC-A11Y-003                                                                                                                                             |                                                       |
| NFR-004 | TC-A11Y-004, TC-A11Y-005                                                                                                                               | Target level assumed — see Q-007                     |
| NFR-005 | TC-RESP-001, TC-RESP-002                                                                                                                               |                                                       |
| NFR-006 | TC-NEG-013, TC-REL-001                                                                                                                                  |                                                       |
| NFR-007 | TC-MNT-001, TC-MNT-002                                                                                                                                 | Framework choice not confirmed — see Q-008            |
| NFR-008 | TC-SEC-001, TC-SEC-002                                                                                                                                 | No dependency scan performed                           |
| NFR-009 | TC-SEO-001, TC-SEO-002                                                                                                                                 |                                                       |
| NFR-010 | TC-A11Y-005                                                                                                                                             | Decorative `alt=""` + `aria-label` on the wrapping link, per WAI-ARIA                          |

## 3. Functional test cases

### Header

| TC ID       | Req ID | Title                                       | Type        | Priority | Preconditions                     | Steps                                                                              | Expected result                                                                                     |
| ----------- | ------ | ------------------------------------------- | ----------- | -------- | --------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| TC-HDR-001  | FR-002 | Brand logo image is present in the header   | Integration | High     | Page loaded                       | Load page; inspect `.brand`                                                                 | `.brand` contains an `img` whose `src` is `/assets/logo.avif`                                       |
| TC-HDR-011  | FR-028 | Header renders no separate text brand       | Integration | High     | Page loaded                       | Read the visible text of `.brand`                                                            | `.brand` renders no brand text — the logo image is the only brand element                          |
| TC-HDR-002  | FR-002 | Brand links back to the home page           | E2E         | High     | Page loaded                       | Inspect the brand element                                                             | Brand element is an anchor whose target is the home page root                                      |
| TC-HDR-003  | FR-003 | All navigation links are present            | Integration | High     | Page loaded at desktop width      | Load page; read the header navigation                                                | Links for Buy, Sell, About, and Contact are all present and visible; no Rent link exists        |
| TC-HDR-004  | FR-003 | Each navigation link has a target           | E2E         | Medium   | Page loaded at desktop width      | Read the `href` of each navigation link                                               | Every navigation link has a non-empty target attribute                                             |
| TC-HDR-005  | FR-004 | Authentication entry point is present       | Integration | High     | Page loaded                       | Load page; inspect the header                                                         | `[data-testid=sign-in-open]` renders the text `Sign in` — a `<button>`, not a link, since it opens the sign-in surface in place |
| TC-HDR-006  | FR-005 | Nav is collapsed by default on mobile       | E2E         | High     | Viewport set to mobile width      | Load page at mobile width                                                              | Navigation links are not visible; the menu toggle is visible                                       |
| TC-HDR-007  | FR-005 | Toggle opens the navigation                 | E2E         | High     | Viewport at mobile width, nav closed | Activate the menu toggle                                                            | Navigation links become visible                                                                     |
| TC-HDR-008  | FR-005 | Toggle closes the navigation                | E2E         | High     | Viewport at mobile width, nav open   | Activate the menu toggle a second time                                             | Navigation links are hidden again                                                                   |
| TC-HDR-009  | FR-005 | Toggle is operable by keyboard              | E2E         | High     | Viewport at mobile width, nav closed | Tab to the toggle; press Enter                                                       | The toggle receives focus visibly, and activating it opens the navigation                           |
| TC-HDR-010  | FR-027 | No Rent link in the header navigation       | Integration | High     | Page loaded                       | Read all header navigation links                                                       | No navigation link reads "Rent"; the nav is Buy, Sell, About, Contact                            |

### Listings section

| TC ID      | Req ID | Title                                         | Type        | Priority | Preconditions        | Steps                                                    | Expected result                                                                   |
| ---------- | ------ | --------------------------------------------- | ----------- | -------- | -------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| TC-LST-001 | FR-001 | All three sections render                      | E2E         | High     | Page loaded          | Load page                                                  | Header, listings section, and footer are all present                             |
| TC-LST-002 | FR-001 | Section order is header, listings, footer      | E2E         | High     | Page loaded          | Compare vertical position of each section                | Header is above the listings section, which is above the footer                  |
| TC-LST-003 | FR-001 | No console errors on load                      | E2E         | High     | Console capture on   | Load page; record console output                          | No error-level messages are logged                                                |
| TC-LST-004 | FR-006 | Section heading is visible                     | Integration | High     | Page loaded          | Inspect the listings section                               | A heading identifying the listings section is visible                            |
| TC-LST-005 | FR-006 | Count matches dataset size on first render     | Integration | High     | Default mock dataset  | Load page; read the displayed count and compare to dataset length | The count equals the number of listings in the mock dataset                 |
| TC-LST-006 | FR-007 | One card renders per dataset item              | Integration | High     | Default mock dataset  | Load page; count the rendered cards                        | The number of rendered cards equals the number of dataset items                  |
| TC-LST-007 | FR-007 | Cards render with unique identities             | Integration | High     | Default mock dataset  | Load page; inspect console for duplicate-key warnings       | Every card renders once and no duplicate-key warning is logged                   |

### Listing card

| TC ID      | Req ID | Title                                       | Type        | Priority | Preconditions                | Steps                                          | Expected result                                                                     |
| ---------- | ------ | ------------------------------------------- | ----------- | -------- | ---------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| TC-CRD-001 | FR-008 | Card shows the property image               | Integration | High     | Default mock dataset         | Inspect the first card                         | An image element is present and its source matches the listing's `image` value    |
| TC-CRD-002 | FR-009 | Price shows a currency symbol                | Integration | High     | Default mock dataset         | Read the price text on each card                | Each price is prefixed with the listing's currency symbol                        |
| TC-CRD-003 | FR-009 | Price is formatted, not rendered raw        | Unit        | High     | Dataset with a multi-digit price  | Render a card for a price of 1250000                                                    | The displayed price is a formatted string with the ₹ symbol and separators, not the raw number     |
| TC-CRD-009 | FR-026 | Price uses Indian digit grouping             | Unit        | High     | Dataset with price 28500000  | Format the price 28500000                             | Output is `₹28,50,000` — grouping in thousands/lakhs/crores, not `2,850,000`     |
| TC-CRD-004 | FR-010 | Card shows title and location                | Integration | High     | Default mock dataset         | Read the first card                            | The listing's title and location are both visible on the card                     |
| TC-CRD-005 | FR-010 | Card shows the property type                 | Integration | High     | Default mock dataset         | Read the type on the first card                         | The listing's property type is visible on the card                                                  |
| TC-CRD-006 | FR-011 | Card shows beds, baths, and area             | Integration | High     | Default mock dataset         | Read the specifications row of a card           | Bedroom count, bathroom count, and area in square feet are all visible           |
| TC-CRD-007 | FR-012 | Card is a single link                        | Integration | Medium   | Default mock dataset         | Inspect the card structure                      | The card is wrapped in one anchor; no nested interactive elements                 |
| TC-CRD-008 | FR-013 | Featured listing shows a badge               | Integration | Medium   | Dataset containing a featured listing | Load page; find the featured listing's card       | The featured card displays a Featured badge and non-featured cards do not         |
| TC-CRD-010 | FR-002 | Logo image actually loads                     | E2E         | High     | Page loaded                       | Read `naturalWidth` on the logo `img`                                                    | `naturalWidth > 0` — the asset resolves at `/assets/logo.avif` rather than 404ing     |
| TC-CRD-011 | FR-019 | Footer logo image actually loads              | E2E         | High     | Page loaded                       | Read `naturalWidth` on the footer logo `img`                                              | `naturalWidth > 0` — the footer logo resolves rather than 404ing                        |
| TC-CRD-012 | FR-029 | Logo renders at its intrinsic aspect ratio    | E2E         | Medium   | Page loaded, logo image decoded  | Compare the rendered `width`/`height` of the logo `img`                                   | Rendered ratio matches the intrinsic 390:146 ratio within rounding tolerance          |

### Filters

| TC ID      | Req ID | Title                                       | Type        | Priority | Preconditions                    | Steps                                                              | Expected result                                                                    |
| ---------- | ------ | ------------------------------------------- | ----------- | -------- | -------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| TC-FLT-001 | BR-007 | Filter options derive from the dataset      | Unit        | High     | Mock dataset loaded              | Derive filter options from the dataset                            | Options are `All` plus one per distinct property type, with `All` appearing once  |
| TC-FLT-002 | FR-014 | Selecting a type chip filters the grid      | Integration | High     | Page loaded, no filter active    | Select a property-type chip                                       | Only cards of that property type are rendered                                    |
| TC-FLT-003 | FR-015 | Filtering does not reload the page           | E2E         | High     | Page loaded                      | Select a chip; observe whether a navigation or reload occurs     | The grid updates in place; no page load occurs                                   |
| TC-FLT-004 | FR-016 | The All chip restores the full dataset       | Integration | High     | A type chip is active            | Select the `All` chip                                            | Every listing in the dataset is rendered again                                    |
| TC-FLT-005 | FR-014 | The active chip is indicated                 | Integration | Medium   | Page loaded                      | Select a chip                                                      | The selected chip is visually distinguishable from unselected chips              |
| TC-FLT-006 | FR-018 | Count reflects the filtered set              | Integration | High     | Page loaded                      | Select a chip                                                      | The displayed count equals the number of matching listings                        |
| TC-FLT-007 | FR-018 | Count always equals rendered cards           | Integration | High     | Page loaded                      | Step through each filter option                                   | After each selection, the displayed count equals the number of cards on screen    |

### Footer

| TC ID      | Req ID | Title                                  | Type        | Priority | Preconditions | Steps                                    | Expected result                                                        |
| ---------- | ------ | -------------------------------------- | ----------- | -------- | ------------- | ---------------------------------------- | ---------------------------------------------------------------------- |
| TC-FTR-001 | FR-019 | Brand logo image shown                    | Integration | High     | Page loaded   | Inspect the footer                       | `.brand--footer` contains the logo `img` sourced from `/assets/logo.avif`                          |
| TC-FTR-002 | FR-019 | Short description is shown             | Integration | Medium   | Page loaded   | Inspect the footer                       | A descriptive paragraph about the site is visible                     |
| TC-FTR-003 | FR-019 | Contact details are shown              | Integration | High     | Page loaded   | Inspect the footer                       | Contact details are visible                                             |
| TC-FTR-004 | FR-020 | Link columns are shown                 | Integration | High     | Page loaded   | Inspect the footer                       | Four grouped link columns are rendered                                 |
| TC-FTR-005 | FR-020 | Every column has at least one link     | Integration | Medium   | Page loaded   | Count items per link column              | No column renders empty                                                |
| TC-FTR-006 | FR-021 | Newsletter input and control are shown | Integration | Medium   | Page loaded   | Inspect the footer                       | An email input and a subscribe control are visible                    |
| TC-FTR-007 | FR-022 | Social icon links are shown            | Integration | Medium   | Page loaded   | Inspect the footer                       | Social media icon links are visible                                     |
| TC-FTR-008 | FR-023 | Copyright bar is shown                 | Integration | High     | Page loaded, current date known | Read the footer bottom bar             | The copyright bar is visible and contains the current year             |
| TC-FTR-009 | FR-028 | Footer renders no separate text brand   | Integration | High     | Page loaded   | Read the visible text of `.brand--footer`                                | No brand text is rendered — the logo image is the only brand element                |

### Mock data and business rules

| TC ID      | Req ID | Title                                        | Type | Priority | Preconditions               | Steps                                                                    | Expected result                                                              |
| ---------- | ------ | -------------------------------------------- | ---- | -------- | --------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| TC-DAT-001 | BR-001 | Listings are served with no network request   | E2E  | High     | Network capture enabled     | Load the page and record all requests                                      | No request is made to fetch listing data; listings render from bundled data  |
| TC-DAT-002 | BR-006 | Dataset has the minimum listing count         | Unit | High     | Mock dataset imported       | Count dataset entries                                                      | The dataset contains at least six listings                                  |
| TC-DAT-003 | BR-006 | Dataset covers at least three property types  | Unit | High     | Mock dataset imported       | Collect the distinct `type` values                                          | At least three distinct property types are present                           |
| TC-DAT-004 | BR-006 | Dataset contains no rental listings          | Unit | High     | Mock dataset imported       | Scan every listing for rental or lease status                                         | Every listing is a sale property; no listing is offered for rent or lease        |
| TC-DAT-005 | BR-002 | Prices below 1000 render correctly            | Unit | Medium   | Price formatter             | Format a price of fewer than four digits                                     | Output shows the currency symbol and no thousands separator                   |
| TC-DAT-009 | BR-008 | Every location is an Indian place            | Unit | Medium   | Mock dataset imported       | Read every listing's `location`                                                     | Every location is an Indian city or locality; no non-Indian place name appears  |
| TC-DAT-006 | BR-005 | Section order is fixed                       | E2E  | High     | Page loaded                 | Compare the DOM position of the three sections                              | Order is header, then listings section, then footer                         |

## 4. Negative & edge cases

| TC ID      | Req ID | Scenario                                                                                | Expected result                                                                             |
| ---------- | ------ | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| TC-NEG-001 | FR-017 | A filter is applied that matches no listings in the dataset                             | The card grid is replaced by the empty-state message; zero cards are rendered                |
| TC-NEG-002 | FR-017 | The user is in the empty state and wants to recover                                    | The `All` chip remains available and selecting it restores the full grid                    |
| TC-NEG-003 | FR-018 | The filter matches no listings                                                         | The displayed count reads 0                                                                  |
| TC-NEG-004 | BR-003 | The user selects a second property-type chip while one is already active               | The second selection replaces the first; results reflect one type only, not a combination    |
| TC-NEG-005 | FR-024 | A listing image URL returns a network error                                           | The card renders a fallback placeholder; layout dimensions are unchanged from other cards     |
| TC-NEG-006 | FR-025 | A listing is missing its optional `areaSqft` field                                    | The area field is omitted from that card; every other field renders and no error is thrown  |
| TC-NEG-007 | FR-013 | A listing has `featured: false`                                                        | No Featured badge is rendered on that card                                                   |
| TC-NEG-008 | BR-004 | A listing has `featured` set to the string `"true"` rather than boolean `true`         | No Featured badge is rendered — the check is strict                                           |
| TC-NEG-009 | BR-002 | A listing has a price of 0                                                             | The price renders as a formatted zero with currency symbol, never blank, `NaN`, or `undefined` |
| TC-NEG-010 | FR-007 | The mock dataset contains two listings with the same `id`                              | The page renders; React logs no duplicate-key warning                                        |
| TC-NEG-011 | FR-021 | Subscribe is activated with an empty email field                                       | No network request is made and no uncaught error is thrown                                   |
| TC-NEG-012 | FR-021 | Subscribe is activated with a malformed email value                                    | No network request is made and no uncaught error is thrown                                   |
| TC-NEG-013 | NFR-006 | The mock dataset is empty (`[]`)                                                      | All three sections still render and the listings section shows the empty state                |
| TC-NEG-014 | FR-005 | The mobile menu toggle is activated twice in rapid succession                         | The navigation returns to the closed state; state does not desync                            |
| TC-NEG-015 | FR-024 | Every listing image fails to load                                                     | All cards render with fallbacks and the grid layout remains intact                           |
| TC-NEG-016 | FR-027 | Scan the full rendered page text for rental content                                     | No "Rent", "Rental", "Lease", or "for rent" string appears in the header, listings section, footer, or document title |

## 5. Non-functional test cases

| TC ID          | Req ID | Category        | Check                                                                 | Pass criteria                                                                 |
| -------------- | ------ | --------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| TC-PERF-001    | NFR-001 | Performance     | Load the page and observe the listings section                        | All mock listings render promptly with no perceptible wait or spinner            |
| TC-PERF-002    | NFR-001 | Performance     | Observe layout while the listings section renders                      | No visible layout shift in the listings grid during initial render              |
| TC-A11Y-001    | NFR-002 | Accessibility   | Tab from the top of the document                                       | Every interactive control (nav links, auth entry, chips, card links, newsletter input, subscribe, social links, toggle) receives focus in DOM order |
| TC-A11Y-002    | NFR-002 | Accessibility   | Inspect the accessible name of each interactive control                | No control is unnamed or named only by an icon                                  |
| TC-A11Y-003    | NFR-003 | Accessibility   | Inspect every listing image                                             | Each image has a non-empty `alt` describing the property                        |
| TC-A11Y-005    | NFR-010 | Accessibility   | Inspect the logo image and its wrapping link                             | The logo `img` has `alt=""` (decorative) and the wrapping link has a non-empty `aria-label`, so the brand is announced once |
| TC-A11Y-004    | NFR-004 | Accessibility   | Measure contrast of body and secondary text                            | Contrast ratio ≥ 4.5:1                                                          |
| TC-A11Y-005    | NFR-004 | Accessibility   | Measure contrast of control borders and the focus indicator            | Contrast ratio ≥ 3:1 and the focus indicator is visible against the background |
| TC-RESP-001    | NFR-005 | Responsive       | Load the page at a 360px-wide viewport                                 | The page body does not scroll horizontally                                      |
| TC-RESP-002    | NFR-005 | Responsive       | At a 360px-wide viewport, inspect all three sections                   | Header, listings, and footer are legible and every control is reachable         |
| TC-REL-001     | NFR-006 | Reliability      | Render the page with an empty mock dataset                             | No error is thrown; all three sections render; listings shows the empty state   |
| TC-MNT-001     | NFR-007 | Maintainability  | Inspect the project's runtime dependencies                              | No UI or component framework is present beyond React                            |
| TC-MNT-002     | NFR-007 | Maintainability  | Inspect the component tree                                              | Header, listings section, and footer are separate components                    |
| TC-SEC-001     | NFR-008 | Security         | Submit the newsletter form with any input                              | No request carrying the entered value leaves the browser                         |
| TC-SEC-002     | NFR-008 | Security         | Record all network requests on page load                               | Only first-party assets are requested; no third-party trackers                 |
| TC-SEO-001     | NFR-009 | SEO              | Count `h1` elements                                                     | Exactly one `h1` exists and it describes the page                              |
| TC-SEO-002     | NFR-009 | SEO              | Read the document `title` and meta description                         | Both are present, non-empty, and describe a real estate home page               |

## 6. BDD scenarios

```gherkin
Feature: Browse and filter property listings on the home page
  As a prospective buyer or renter
  I want to scan available properties on the home page
  So that I can find a property that fits what I am looking for

  Scenario: The home page presents all three sections
    Given the application is running with the default mock dataset
    When I load the home page
    Then I see the header
    And I see the listings section
    And I see the footer
    And the sections appear in that order

  Scenario: Listings render from the mocked data
    Given the application is running with the default mock dataset
    When I load the home page
    Then one listing card is rendered for each item in the dataset
    And each card shows the image, price, title, location, and property type
    And each card shows the bedroom count, bathroom count, and area
    And the displayed count matches the number of cards rendered

  Scenario: Prices are shown in Rupees with Indian digit grouping
    Given the application is running with a listing priced at 28500000
    When I load the home page
    Then that card shows the price as "₹28,50,000"
    And no price anywhere on the page uses a non-Rupee currency symbol

  Scenario: The site lists sale properties only
    Given the application is running with the default mock dataset
    When I load the home page
    Then no card displays a "For Rent" or rental badge
    And the header navigation contains no "Rent" link
    And the footer contains no rental wording

  Scenario: Filter the listings by property type
    Given the application is running with the default mock dataset
    And no filter is active
    When I select a property-type filter chip
    Then only listings of that type are rendered
    And the displayed count matches the filtered set
    And the page does not reload

  Scenario: Clear the filter
    Given a property-type filter chip is active
    When I select the "All" chip
    Then every listing in the dataset is rendered again
    And the displayed count matches the full dataset

  Scenario: Filter selection is mutually exclusive
    Given a property-type filter chip is active
    When I select a different property-type chip
    Then only listings of the newly selected type are rendered
    And the results are not a combination of both types

  Scenario: No listings match the filter
    Given the application is running with a dataset where the filter type has no listings
    And no filter is active
    When I select that property-type filter chip
    Then I see an empty-state message instead of listing cards
    And the displayed count reads 0
    And the "All" chip is still available so I can recover

  Scenario: A listing image fails to load
    Given the application is running with a dataset containing an unreachable image URL
    When I load the home page
    Then that card still renders with a fallback placeholder
    And the card keeps the same layout as the other cards

  Scenario: The mock dataset is empty
    Given the application is running with an empty mock dataset
    When I load the home page
    Then the header, listings section, and footer all render
    And the listings section shows the empty state
    And no error is thrown

  Scenario: Navigate using the header on mobile
    Given I am viewing the home page at a mobile viewport width
    Then the navigation links are collapsed behind a menu toggle
    When I activate the menu toggle
    Then the navigation links become visible
    When I activate the menu toggle again
    Then the navigation links are hidden again

  Scenario: Reach the footer
    Given the application is running with the default mock dataset
    When I scroll to the bottom of the home page
    Then I see the brand name, description, and contact details
    And I see the grouped navigation link columns
    And I see the newsletter signup and social links
    And I see the copyright bar
```

## 7. Not directly testable

| Req ID | Why                                                                                                                                                    | How it will be verified                                                                          |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| NFR-001 | "No perceptible delay" and "no visible layout shift" are subjective and were never quantified with a numeric budget by the user (Q-008).      | Measured with the browser Performance panel; a numeric pass threshold is to be set when the budget is confirmed. |
| NFR-007 | The requirement that no UI framework beyond React is introduced is partly a codebase-governance rule, not a runtime behaviour.           | Verified once at review time by inspecting `package.json`; not asserted per run.                  |
| NFR-008 | "No personal data leaves the browser" is a negative property. Absence of a transmission cannot be proven exhaustively by an automated test. | Network capture confirms the known entry points (newsletter submit) transmit nothing; confirmed by design review that no analytics or third-party scripts are included. |

## 8. Open questions

| ID    | Question                                                                                                                             | Blocks                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Q-001 | Should a hero/banner section be added? The stated scope is header, listings, footer only.                                            | Scope — new FRs and scenarios for the hero if added                                                        |
| Q-002 | What should a listing card link to while no detail page exists?                                                                      | TC-CRD-007 — cannot assert a `href` until this is answered                                               |
| Q-003 | What are the real destinations for the header and footer links?                                                                       | TC-HDR-004, TC-FTR-004 — dead links cannot be signed off                                                     |
| Q-004 | Where do listing images come from?                                                                                                   | TC-CRD-001, TC-NEG-005 — determines whether tests can run without network access                          |
| Q-005 | What should the newsletter form do on submit with no backend?                                                                          | TC-NEG-011, TC-NEG-012 — currently asserted only as "no network request"                                   |
| Q-006 | What are the real brand name, tagline, contact details, and footer column names?                                                       | TC-HDR-001, TC-FTR-001 – TC-FTR-003 — copy assertions must be updated to final text                      |
| Q-007 | Is WCAG 2.1 AA the correct accessibility target?                                                                                      | TC-A11Y-004, TC-A11Y-005                                                                                 |
| Q-008 | Confirm the test tooling (Vitest, Playwright) and set a numeric performance budget.                                                   | TC-PERF-001, TC-PERF-002, and the environment section of this plan                                          |
| Q-009 | Should filtering cover more than property type?                                                                                      | TC-FLT-002, TC-FLT-006 — additional filters need their own FRs and cases                                    |
| Q-010 | Are sort or pagination controls needed?                                                                                               | TC-LST-006 — affects whether rendering everything at once is acceptable                                   |
| Q-011 | What are the exact responsive breakpoints?                                                                                           | TC-HDR-006 – TC-HDR-009, TC-RESP-001                                                                       |
| Q-012 | Confirm the feature priority is High, so the three core sections are Must and card/footer enhancements are Should.                     | The Priority column across section 3                                                                        |
| Q-013 | Should prices use the `₹2.85 Cr` / `₹98 L` shorthand instead of the full grouped value `₹2,85,00,000`?                                              | TC-CRD-009 — the exact expected string cannot be asserted until this is decided                           |
| Q-014 | Is the Rent navigation link removed for good, or will rentals return later?                                                                                 | TC-HDR-010, TC-NEG-016                                                                                      |