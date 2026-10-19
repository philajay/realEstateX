# Real Estate Website Home Page — Requirements

| Field       | Value                          |
| ----------- | ------------------------------ |
| Slug        | `real-estate-homepage`         |
| Status      | Draft                          |
| Version     | 0.3                            |
| Date        | `2026-10-19`                   |
| Owner       | `<name>`                       |
| Test cases  | [`test-cases.md`](./test-cases.md) |

## 1. Overview

The landing page of the real estate website, targeted at the **Indian market**. It is a React single-page home page composed of three sections — a header, a listings section, and a footer. The header carries branding and navigation, the listings section showcases properties for **sale only** from a local mocked dataset with client-side filtering, and the footer carries company links, newsletter signup, and social links. Prices are shown in Indian Rupees using the Indian digit grouping convention. No live backend is involved in this iteration.

## 2. Problem statement

The site has no public entry point. Anyone landing on the domain has nothing to see, no way to discover that properties exist, and no way to navigate to anything else. Until this page ships there is no surface at all for the listings that will eventually be published, so the business cannot demonstrate or test its inventory. Not shipping it means every other feature (detail pages, enquiry, auth) has nowhere to link from, and every downstream piece of work is blocked on a landing page.

## 3. Goals

- Give a first-time visitor an immediate, scannable view of available properties.
- Let a visitor narrow the visible properties without leaving the page.
- Establish a reusable header/footer shell that later pages inherit.
- Produce a mockable, backend-free page so the layout can be reviewed before any API exists.

## 4. Non-goals

- Explicitly out: a property detail page — cards link to a placeholder target only (see Q-002).
- Explicitly out: authentication, saved favourites, enquiry/contact forms — no user data is captured in this iteration.
- Explicitly out: server-side rendering, CMS editing, analytics instrumentation.

## 5. Actors

| Actor                      | Description                                                                   | Permissions                                        |
| -------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------- |
| Visitor (prospective buyer/renter) | Anonymous user landing on the home page                                | View listings, filter listings, use header/footer navigation |
| Listing editor             | Person who will eventually publish listings; not a user of this page          | None in this iteration — data is mocked in code     |

## 6. Glossary

| Term              | Definition                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| Listing           | A single property record shown as one card in the listings section                              |
| Mock dataset      | The hardcoded array of listing objects the page renders from; not fetched over the network       |
| Filter chip       | A control in the listings section that narrows the visible listings to one property type        |
| Featured          | A boolean flag on a listing that causes a badge to render on its card                           |
| Sale-only          | The site lists properties that are for sale; no rental or lease listings appear anywhere        |
| Indian grouping    | The digit grouping used for Rupee amounts, e.g. `28,50,000` rather than `2,850,000`            |
| Mobile breakpoint | The viewport width at or below which the header collapses into a hamburger menu                  |

## 7. User flows

### Browse listings

1. User lands on the home page.
2. Header renders at the top with brand and navigation.
3. User scrolls to the listings section.
4. User sees the section heading, the result count, and one card per listing.
5. User scans cards for image, price, title, location, and specifications.

### Filter listings

1. User is in the listings section showing all listings.
2. User selects a property-type filter chip.
3. The grid updates in place to show only matching listings; the count updates to match.
4. User selects the `All` chip; every listing returns.

### Navigate the site

1. User selects a header navigation link, or a footer link column item.
2. The browser follows the link target.
3. User reaches the footer and submits a newsletter email, or opens a social link.

## 8. Functional requirements

| ID       | Requirement                                                                                          | Priority | Notes                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| FR-001   | The page renders the header, listings section, and footer, in that order, without a page reload.        | Must     | Fixed section order, BR-005                                                                                  |
| FR-002   | The header displays the brand logo as a link back to the home page.                                      | Must     | Logo is an image asset, not text — see FR-028                                                               |
| FR-003   | The header displays navigation links for Buy, Sell, About, and Contact.                              | Must     | Link targets are placeholders — see Q-003; no Rent link, see FR-027                                  |
| FR-004   | The header displays an authentication entry point (sign in / register).                                 | Must     | Link target is a placeholder, no auth flow — see Q-003                                                      |
| FR-005   | Below the mobile breakpoint the header collapses into a toggle; activating it shows the nav, and activating it again hides the nav. | Must     | No authentication is performed to expand the menu                                                            |
| FR-006   | The listings section displays a section heading and the number of listings currently shown.               | Must     | Count reflects the filtered set, not the full dataset                                                         |
| FR-007   | The listings section renders exactly one card per item in the mock dataset.                              | Must     | Data source is the local mock — BR-001                                                                       |
| FR-008   | Each listing card displays the property image.                                                            | Must     |                                                                                                              |
| FR-009   | Each listing card displays the price formatted with a currency symbol and thousands separators.         | Must     | BR-002                                                                                                       |
| FR-010   | Each listing card displays title, location, and property type.                                         | Must     | Sale status is implied by the whole site — see FR-027 rather than per-card badge                    |
| FR-011   | Each listing card displays bedroom count, bathroom count, and area in square feet.                        | Must     |                                                                                                              |
| FR-012   | Each listing card is a single link targeting that listing's detail page.                                   | Should   | Detail page does not exist yet — placeholder target, Q-002                                                    |
| FR-013   | A listing card displays a Featured badge when and only when the listing is marked featured.               | Should   | BR-004                                                                                                       |
| FR-014   | The user can filter the visible listings by property type using filter chips.                             | Must     | Options derived from the dataset — BR-007; dimensions assumed — Q-009                                        |
| FR-015   | Selecting a filter chip updates the visible listings in place, with no page reload.                        | Must     |                                                                                                              |
| FR-016   | Selecting the `All` chip clears the active filter and shows every listing.                                 | Must     | BR-003                                                                                                       |
| FR-017   | When the active filter matches zero listings, an empty-state message is shown in place of the card grid.    | Must     |                                                                                                              |
| FR-018   | The displayed listing count reflects the filtered set, not the full dataset size.                         | Must     |                                                                                                              |
| FR-019   | The footer displays the brand logo, a short description, and contact details.                            | Must     | Logo is an image asset, not text — see FR-028                                                               |
| FR-020   | The footer displays grouped navigation link columns.                                                       | Must     | Group names and link targets are placeholders — Q-003                                                        |
| FR-021   | The footer displays a newsletter email input with a subscribe control.                                     | Should   | No backend; submission behaviour unspecified — Q-005                                                          |
| FR-022   | The footer displays social media icon links.                                                               | Should   | Destinations are placeholders                                                                                 |
| FR-023   | The footer displays a copyright and legal bar.                                                             | Must     |                                                                                                              |
| FR-024   | If a listing image fails to load, the card renders a fallback placeholder without breaking layout.         | Must     |                                                                                                              |
| FR-025   | If an optional listing field is missing, the card omits that field and renders the rest without error.     | Must     | Confirms no field is dereferenced unguarded                                                                    |
| FR-026   | Each price is displayed in Indian Rupees using the Indian digit grouping convention.                     | Must     | Added in v0.2 for Indian market — e.g. `₹28,50,000`, not `₹2,850,000` and not `$2,850,000`                 |
| FR-027   | No rental or lease content appears anywhere on the page — every listing shown is for sale.              | Must     | Added in v0.2 — no `For Rent` badge, no Rent navigation link, no rental copy in the footer                |
| FR-028   | The header and the footer both render the brand logo from the image asset `assets/logo.avif`, and that image is the entire brand lockup — no separate text brand is rendered alongside it. | Must     | Added in v0.3. Replaces the earlier CSS-drawn "E" mark plus "EstateX" wordmark                            |
| FR-029   | The logo image is rendered at its intrinsic aspect ratio with declared dimensions, so it does not shift surrounding layout while loading. | Should   | Added in v0.3. Guards NFR-001                                                                               |

## 9. Business rules

| ID     | Rule                                                                                          | Applies to                       |
| ------ | --------------------------------------------------------------------------------------------- | -------------------------------- |
| BR-001 | Listing data is read from a local mocked array in source code; the page makes no network calls for listings. | FR-007                    |
| BR-002 | Prices render in Indian Rupees with the `₹` symbol and Indian digit grouping, regardless of the raw value. | FR-009, FR-026       |
| BR-003 | At most one property-type filter may be active at a time; filters are mutually exclusive.       | FR-014, FR-016                  |
| BR-004 | The Featured badge renders only when the listing's `featured` field is exactly `true`.           | FR-013                          |
| BR-005 | Section order on the page is fixed: header, then listings, then footer.                           | FR-001                          |
| BR-006 | The mock dataset contains at least six listings, covering at least three property types, all for sale. | FR-007, FR-014, FR-027 |
| BR-007 | Filter chips consist of an `All` option plus one option per distinct property type present in the dataset. | FR-014              |
| BR-008 | Every listing location is an Indian city or locality.                                        | FR-010              |
| BR-009 | The logo is served as a static asset from the app's public directory at `/assets/logo.avif`, not imported through the bundler, so it resolves at a stable unhashed URL. | FR-028 |

## 10. Data model

### Listing

| Field        | Type    | Constraints                                                             |
| ------------ | ------- | ----------------------------------------------------------------------- |
| `id`         | string  | Required, unique — used as the React key and card identity              |
| `title`      | string  | Required                                                                 |
| `price`      | number  | Required, non-negative, in Rupees                                       |
| `type`       | string  | Required — drives the filter options, BR-007                            |
| `location`   | string  | Required, an Indian city or locality — BR-008                           |
| `bedrooms`   | number  | Required, non-negative integer                                           |
| `bathrooms`  | number  | Required, non-negative                                                   |
| `areaSqft`   | number  | Optional — omitted without error, FR-025                                |
| `image`      | string  | Required — image URL; failure is handled, FR-024                        |
| `featured`   | boolean | Optional, defaults to not featured, BR-004                              |

## 11. API / interface

No network interface in this iteration.

| Method | Path              | Purpose                       | Auth | Errors |
| ------ | ----------------- | ----------------------------- | ---- | ------ |
| n/a    | Local mock module | Supplies the `Listing[]` array | n/a  | Image load failure only, handled per FR-024 |

## 12. UI / UX notes

- **Sections:** header at the top, listings in the middle, footer at the bottom. Only the listings section scrolls with content; the header and footer are in normal document flow for this iteration.
- **States:**
  - *Populated* — heading, count, filter chips, card grid.
  - *Filtered* — same layout with a reduced grid and a highlighted active chip.
  - *Empty* — the message "No properties match this filter", with the `All` chip still available to reset. Required by FR-017.
  - *Image failure* — per-card fallback, FR-024.
  - *Loading and network-error states are not applicable*, because data is synchronous and local (BR-001).
- **Responsive behaviour:** at desktop width the card grid shows multiple columns and the header nav is horizontal; at mobile width the nav collapses to a toggle (FR-005) and the grid reduces to a single column. Exact breakpoints are `[NEEDS-CLARIFICATION]` — see Q-011.
- **Copy:** all brand names, taglines, contact details, and footer column names are placeholder copy pending the real brand (Q-006). Market context is Indian: Rupee prices with Indian digit grouping, Indian place names in listing locations (BR-008), and an Indian phone format for contact details.

## 13. Non-functional requirements

| ID       | Category      | Requirement                                                                                          | Priority |
| -------- | ------------- | --------------------------------------------------------------------------------------------------- | -------- |
| NFR-001  | Performance   | The listings section renders the full mock dataset with no perceptible delay and no visible layout shift. | Must     |
| NFR-002  | Accessibility | Every interactive control is reachable and operable by keyboard, and every control has an accessible name. | Must     |
| NFR-003  | Accessibility | Every listing image carries an `alt` attribute describing the property.                             | Must     |
| NFR-004  | Accessibility | Text and interactive elements meet WCAG 2.1 AA contrast. Target level assumed — see Q-007.            | Must     |
| NFR-005  | Accessibility | The page is usable at a 360px-wide viewport with no horizontal scrolling of the page body.             | Must     |
| NFR-006  | Reliability   | The page renders without throwing when the mock dataset is empty.                                     | Must     |
| NFR-007  | Maintainability | The page is built with React and component-scoped styling only; no UI framework beyond React is introduced. | Must     |
| NFR-008  | Security      | No personal data leaves the browser in this iteration; the newsletter input performs no network submission. | Must     |
| NFR-009  | SEO           | The page has exactly one `h1`, a descriptive `title`, and a meta description.                          | Should   |
| NFR-010  | Accessibility | The logo is exposed to assistive technology with an accessible name, and is not announced twice. The image carries an empty `alt` and the wrapping link carries the `aria-label`. | Must     |

## 14. Dependencies & integrations

| Dependency                | Purpose                              | Owner       | Status                              |
| ------------------------- | ------------------------------------ | ----------- | ----------------------------------- |
| React                     | UI component model                   | Frontend    | Confirmed — user selected React     |
| Vite                     | Dev server and build                 | Frontend    | Assumed, see Q-008                  |
| Mock listing dataset      | Supplies `Listing[]` to the listings section | Frontend | In progress — to be created         |
| Listing images            | Card imagery                         | Design      | `[NEEDS-CLARIFICATION]` — source unspecified, Q-004 |
| Brand logo                | `public/assets/logo.avif` (390×146, AVIF, alpha, ~5 KB) | Design | Confirmed — supplied, wired in v0.3 |

## 15. Out of scope

- Property detail page — no route exists yet; cards use a placeholder target (Q-002).
- Live listings API — data is mocked in source per BR-001.
- Authentication and the sign-in flow — the header shows an entry point only (FR-004).
- Favourites / shortlisting, enquiry and contact forms — nothing captures user intent.
- Pagination, infinite scroll, and sort controls — the full mock set is rendered at once (FR-007).
- Rental and lease listings — the site is sale-only in this iteration (FR-027). Reinstating rentals needs its own FRs.
- Admin or CMS screens for creating listings.
- Analytics, tracking pixels, and A/B testing.
- Internationalisation and currency conversion beyond the symbol stored per listing.
- SEO landing pages and sitemap generation.

## 16. Assumptions & open questions

| ID    | Question / Assumption                                                                                                                        | Impact                                                                                              | Status            |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------- |
| Q-001 | `[NEEDS-CLARIFICATION]` The user specified only header, listings section, and footer. Is a hero/banner section (headline + search bar) also wanted? | Changes scope and adds a fourth section to FR-001 | Open |
| Q-002 | `[NEEDS-CLARIFICATION]` What should a listing card link to? There is no detail page yet — a dead `#` link, or a route stub? | Affects FR-012; a dead link is a poor UX if the page ships publicly | Open |
| Q-003 | `[NEEDS-CLARIFICATION]` What are the real destinations for header and footer links? Currently assumed to be placeholder anchors. | Affects FR-003, FR-004, FR-020; dead links in a header are visible to every user | Open |
| Q-004 | `[NEEDS-CLARIFICATION]` Where do listing images come from — a placeholder image service, bundled local assets, or user-supplied photography? | Affects FR-008, FR-024, and whether tests can run offline | Open |
| Q-005 | `[NEEDS-CLARIFICATION]` What should the newsletter form do on submit, given there is no backend? Currently assumed to be a no-op. | Affects FR-021; a submit that silently does nothing is confusing | Open |
| Q-006 | `[NEEDS-CLARIFICATION]` What are the real brand tagline, contact details, and footer column names? The logo image was supplied in v0.3, but the surrounding copy is still placeholder. | Affects FR-002, FR-019, FR-020 | Open |
| Q-007 | Assumption: accessibility target is WCAG 2.1 AA. Confirm. | Affects NFR-004 | Open |
| Q-008 | Assumption: Vitest for unit tests and Playwright for E2E. Confirm, and confirm Vite as the build tool. | Affects the test strategy and environment section of the test plan | Open |
| Q-009 | `[NEEDS-CLARIFICATION]` Should filtering cover more than property type — price range, location, bedrooms? Currently only property type is assumed. | Affects FR-014, BR-003, BR-007 | Open |
| Q-010 | `[NEEDS-CLARIFICATION]` Are sort or pagination controls wanted for larger datasets, or is rendering the whole dataset acceptable? | Affects FR-007 and the out-of-scope list | Open |
| Q-011 | `[NEEDS-CLARIFICATION]` What are the exact responsive breakpoints? Currently assumed to follow common desktop/tablet/mobile practice. | Affects FR-005, NFR-005 | Open |
| Q-012 | Assumption: the priority of this feature is **High**, so the core three sections are tagged Must and the card/footer enhancements Should. Confirm. | Gates the MoSCoW split across section 8 | Open |
| Q-013 | `[NEEDS-CLARIFICATION]` Should prices use the shorthand an Indian buyer expects (`₹2.85 Cr`, `₹98 L`) instead of the full grouped value (`₹2,85,00,000`)? The full grouped value is currently implemented. | Affects FR-026 and its test cases — copy is the most visible thing on the page | Open |
| Q-014 | `[NEEDS-CLARIFICATION]` The Rent navigation link was removed in v0.2. Confirm rentals are out of scope entirely, or that the link should stay for a future rentals section. | Affects FR-003 and FR-027 | Open |

## 17. Acceptance criteria

| ID       | Criterion                                                                                                      | Covers                     |
| -------- | -------------------------------------------------------------------------------------------------------------- | -------------------------- |
| AC-001   | On load, the page shows a header, a listings section, and a footer in that order, with no console errors.         | FR-001                     |
| AC-002   | The listings section shows one card per mock listing, each with image, price in ₹ with Indian grouping, title, location, type, beds, baths, and area. | FR-007 – FR-011, FR-026 |
| AC-003   | Selecting a property-type chip reduces the grid to matching listings only, updates the count, and does not reload the page. | FR-014 – FR-016, FR-018 |
| AC-004   | A filter that matches nothing shows an empty-state message instead of cards, and `All` restores the full grid.   | FR-017, FR-016             |
| AC-005   | At mobile width the header nav is collapsed and the toggle expands and collapses it.                            | FR-005                     |
| AC-006   | The footer shows the logo, contact details, link columns, social links, and a copyright bar.              | FR-019 – FR-023, FR-028   |
| AC-007   | A listing whose image fails to load still renders a card with an intact layout.                                 | FR-024                     |
| AC-008   | The page is fully keyboard operable and every image has descriptive alt text.                                   | NFR-002, NFR-003           |
| AC-009   | The page renders without throwing when the mock dataset is empty.                                               | NFR-006                    |
| AC-010   | No rental content appears on the page, and every price is shown in ₹ with Indian digit grouping.             | FR-026, FR-027             |
| AC-011   | The header and the footer both display the logo image loaded from `/assets/logo.avif`, at the correct aspect ratio, with an accessible name on the wrapping link. | FR-028, FR-029, NFR-010 |

## 18. Change log

| Date        | Version | Change         | By     |
| ----------- | ------- | -------------- | ------ |
| 2026-10-19  | 0.1     | Initial draft  | `<name>` |
| 2026-10-19  | 0.2     | Retargeted to the Indian market: prices in ₹ with Indian digit grouping (FR-026 added, BR-002 revised); sale-only, status removed from the card and data model (FR-027 added, FR-010 revised, BR-006 revised); Rent navigation link removed (FR-003 revised, Q-014 raised); Indian place names enforced (BR-008 added); Q-013 raised on Cr/Lakh shorthand | `<name>` |
| 2026-10-19  | 0.3     | Brand logo changed to the supplied `logo.avif` asset. FR-002 and FR-019 revised from text brand to image; FR-028 and FR-029 added; BR-009 added (served from `public/`, not bundled); NFR-010 added (logo accessible name); AC-011 added; brand markup deduplicated into a single `Logo` component; dead `.brand__mark` / `.brand__name` / `.brand__accent` CSS removed; Q-006 narrowed to surrounding copy only | `<name>` |
| 2026-10-19  | 0.4     | FR-004 delivered by `rfp/firebase-google-signin-roles` — the header sign-in placeholder is now a `<button>` carrying `data-testid=sign-in-open`, which opens the Google sign-in surface in place. TC-HDR-005 selector updated to match | `<name>` |