#!/usr/bin/env bash
# E2E suite for the EstateX home page.
# Driven by playwright-cli (see .opencode/skills/playwright-cli).
# Each check maps to a TC ID in rfp/real-estate-homepage/test-cases.md and
# writes a screenshot to rfp/evidence/<TC-ID>-<slug>.png at assertion time.

set -uo pipefail

URL="${URL:-http://localhost:5175/}"
EVIDENCE="rfp/evidence"
S="e2e"
PASS=0
FAIL=0
FAILED_IDS=()

pass() { PASS=$((PASS+1)); printf '  \033[32mPASS\033[0m  %-13s %s\n' "$1" "$2"; }
fail() { FAIL=$((FAIL+1)); FAILED_IDS+=("$1"); printf '  \033[31mFAIL\033[0m  %-13s %s\n' "$1" "$2"; }
skip() { printf '  \033[33mSKIP\033[0m  %-13s %s\n' "$1" "$2"; SKIPPED+=("$1|$2"); }
head1() { printf '\n\033[1m%s\033[0m\n' "$1"; }
SKIPPED=()

cli() { playwright-cli -s="$S" --raw "$@" 2>/dev/null; }
shot() { playwright-cli -s="$S" screenshot --filename="$EVIDENCE/${1}-${2}.png" >/dev/null 2>&1; }
navigate() { cli goto "$URL" >/dev/null; }
# Scroll so evidence actually shows the section under test.
scroll_footer() { cli eval "window.scrollTo(0, document.body.scrollHeight)" >/dev/null; sleep 0.6; }
scroll_top() { cli eval "window.scrollTo(0, 0)" >/dev/null; sleep 0.4; }

# playwright-cli --raw returns strings wrapped in double quotes; strip one layer.
unquote() { local v="$1"; v="${v#\"}"; v="${v%\"}"; printf '%s' "$v"; }

# eq <TC ID> <slug> <description> <JS expression> <expected literal>
eq() {
  local id="$1" slug="$2" desc="$3" expr="$4" want="$5" out
  out=$(unquote "$(cli eval "(() => { try { return String(${expr}) } catch (e) { return 'ERR:'+e.message } })()")")
  if [ "$out" = "$want" ]; then pass "$id" "$desc"; else fail "$id" "$desc  [want: $want, got: $out]"; fi
  shot "$id" "$slug"
}

mkdir -p "$EVIDENCE"
rm -f "$EVIDENCE"/*.png "$EVIDENCE"/SKIPPED.md

echo "E2E: $URL"
echo "Evidence: $EVIDENCE/"

playwright-cli -s="$S" open "$URL" --browser=chrome >/dev/null 2>&1 || {
  echo "FATAL: could not open browser"; exit 1; }

# ---------------------------------------------------------------- Header
head1 "Header"
navigate
eq  TC-HDR-001 "header-logo-image"        "logo image present in header"       "!!document.querySelector('.brand img[src=\"/assets/logo.avif\"]')" "true"
eq  TC-HDR-002 "brand-href"               "brand links to home root"           "document.querySelector('.brand').getAttribute('href')" "/"
eq  TC-HDR-003 "nav-links"                "nav links present"                  "Array.from(document.querySelectorAll('.nav__link')).map(a=>a.innerText).join(',')" "Buy,Sell,About,Contact"
eq  TC-HDR-004 "nav-hrefs"                "every nav link has a target"        "Array.from(document.querySelectorAll('.nav__link')).every(a=>a.getAttribute('href'))" "true"
eq  TC-HDR-005 "auth-entry"               "auth entry point present"           "document.querySelector('[data-testid=sign-in-open]').innerText" "Sign in"
eq  TC-HDR-010 "no-rent-link"             "no Rent link (FR-027)"              "/Rent/i.test(document.querySelector('.nav').innerText)" "false"
eq  TC-HDR-011 "no-text-brand-header"     "header renders no text brand"       "document.querySelector('.brand').innerText.trim()" ""

# ---------------------------------------------------------------- Sections
head1 "Sections"
navigate
eq  TC-LST-001 "three-sections"          "all three sections render"          "['.header','.listings','.footer'].every(s=>document.querySelector(s))" "true"
eq  TC-LST-002 "section-order"           "order is header, listings, footer"  "(function(){var b=document.querySelector('.header').getBoundingClientRect();var l=document.querySelector('.listings').getBoundingClientRect();var f=document.querySelector('.footer').getBoundingClientRect();return b.top<l.top&&l.top<f.top})()" "true"

# Real console-error check: parse the "Errors: N" count from playwright-cli's
# console summary (grepping for "error" matches the word inside "Errors: 0").
CONSOLE_ERRORS=$(playwright-cli -s="$S" console 2>/dev/null | sed -n 's/.*(Errors: \([0-9]*\),.*/\1/p' | head -1)
CONSOLE_ERRORS="${CONSOLE_ERRORS:-unknown}"
if [ "$CONSOLE_ERRORS" = "0" ]; then pass TC-LST-003 "no console errors on load"
else fail TC-LST-003 "no console errors on load  [${CONSOLE_ERRORS} found]"; fi
shot TC-LST-003 console-clean

# ---------------------------------------------------------------- Listings
head1 "Listings section"
navigate
eq  TC-LST-004 "section-heading"         "section heading visible"            "document.querySelector('#listings-heading').innerText.length>0" "true"
eq  TC-LST-005 "count-matches"           "count matches dataset size"         "document.querySelector('.listings__sub').innerText.match(/of (\d+)/)[1]" "8"
eq  TC-LST-006 "one-card-per-item"       "one card per dataset item"          "document.querySelectorAll('.card').length" "8"
eq  TC-LST-007 "unique-card-identities"  "cards have unique identities"       "(new Set(Array.from(document.querySelectorAll('.card')).map(c=>c.getAttribute('href'))).size===8)" "true"

# ---------------------------------------------------------------- Card
head1 "Listing card"
navigate
eq  TC-CRD-001 "card-images"             "image present on every card"        "document.querySelectorAll('.card__image').length" "8"
eq  TC-CRD-002 "rupee-symbol"            "price shows rupee symbol"            "document.querySelector('.card__price').innerText.trim().charAt(0)" "₹"
eq  TC-CRD-003 "price-formatted"         "price is formatted, not raw"         "document.querySelector('.card__price').innerText.includes('28500000')" "false"
eq  TC-CRD-009 "indian-grouping"         "Indian digit grouping"               "document.querySelector('.card__price').innerText.trim()" "₹2,85,00,000"
eq  TC-CRD-004 "title-and-location"      "title and location shown"            "document.querySelector('.card__title').innerText.length>0 && document.querySelector('.card__location').innerText.length>0" "true"
eq  TC-CRD-005 "property-type"           "property type shown"                 "document.querySelector('.card__type').innerText" "Apartment"
eq  TC-CRD-006 "beds-baths-area"         "beds, baths, area shown"             "document.querySelectorAll('.card')[0].querySelectorAll('.card__specs li').length" "3"
eq  TC-CRD-007 "card-is-link"            "card is a single link"               "document.querySelectorAll('.card')[0].matches('a[href]')" "true"
eq  TC-CRD-008 "featured-badge"          "featured badge on featured cards"    "document.querySelectorAll('.card__badge').length" "3"
eq  TC-A11Y-003 "card-image-alt"         "images have alt text"               "Array.from(document.querySelectorAll('.card__image')).every(i=>i.alt&&i.alt.length>0)" "true"

# Logo asset + rendering (FR-028 / FR-029 / NFR-010)
eq  TC-CRD-010 "logo-loads-header"       "header logo image actually loads"    "document.querySelector('.brand img').naturalWidth" "390"
eq  TC-CRD-012 "logo-aspect-ratio"       "logo renders at intrinsic ratio"     "(function(){var r=document.querySelector('.brand img').getBoundingClientRect();return Math.abs(r.width/r.height - 390/146)<0.02})()" "true"
eq  TC-A11Y-005 "logo-accessible-name"   "logo decorative alt + link label"    "document.querySelector('.brand img').getAttribute('alt')==='' && document.querySelector('.brand').getAttribute('aria-label').length>0" "true"

scroll_footer
eq  TC-CRD-011 "logo-loads-footer"       "footer logo image actually loads"    "document.querySelector('.brand--footer img').naturalWidth" "390"
scroll_top

# ---------------------------------------------------------------- Filters
head1 "Filters"
navigate
eq  TC-FLT-001 "chip-options"            "chips = All + distinct types"       "Array.from(document.querySelectorAll('.chip')).map(c=>c.innerText).join(',')" "All,Apartment,Villa,House,Commercial"

playwright-cli -s="$S" --raw click "getByRole('button', { name: 'Apartment' })" >/dev/null 2>&1
eq  TC-FLT-002 "filter-apartment"        "Apartment filter narrows grid"       "document.querySelectorAll('.card').length" "4"
eq  TC-FLT-006 "count-filtered"          "count reflects filtered set"         "document.querySelector('.listings__sub').innerText.match(/Showing (\d+)/)[1]" "4"
eq  TC-FLT-005 "active-chip"             "active chip indicated"               "document.querySelector('.chip--active').innerText" "Apartment"
eq  TC-FLT-007 "count-eq-cards"          "count always equals cards"           "(function(){var c=+document.querySelector('.listings__sub').innerText.match(/Showing (\d+)/)[1];return c===document.querySelectorAll('.card').length})()" "true"
eq  TC-FLT-003 "no-reload"               "no page reload on filter"            "performance.getEntriesByType('navigation').length" "1"

playwright-cli -s="$S" --raw click "getByRole('button', { name: 'House' })" >/dev/null 2>&1
eq  TC-NEG-004 "mutually-exclusive"      "filters are mutually exclusive"      "document.querySelectorAll('.card').length" "2"

playwright-cli -s="$S" --raw click "getByRole('button', { name: 'All' })" >/dev/null 2>&1
eq  TC-FLT-004 "all-restores"            "All restores full dataset"           "document.querySelectorAll('.card').length" "8"

# ---------------------------------------------------------------- Footer
head1 "Footer"
navigate
scroll_footer
eq  TC-FTR-001 "footer-logo-image"       "brand logo image shown"              "!!document.querySelector('.brand--footer img[src=\"/assets/logo.avif\"]')" "true"
eq  TC-FTR-009 "no-text-brand-footer"    "footer renders no text brand"        "document.querySelector('.brand--footer').innerText.trim()" ""
eq  TC-FTR-002 "footer-description"      "description shown"                   "document.querySelector('.footer__desc').innerText.length>40" "true"
eq  TC-FTR-003 "footer-contact"          "contact details shown"               "document.querySelector('.footer__contact').innerText.length>20" "true"
eq  TC-FTR-004 "footer-columns"          "four link columns"                   "document.querySelectorAll('.footer__col').length" "4"
eq  TC-FTR-005 "columns-not-empty"       "no column is empty"                  "Array.from(document.querySelectorAll('.footer__col')).every(c=>c.querySelectorAll('ul li').length>0)" "true"
eq  TC-FTR-006 "newsletter-form"         "newsletter input + subscribe"        "!!document.querySelector('#newsletter-email') && !!document.querySelector('.footer__form button[type=submit]')" "true"
eq  TC-FTR-007 "social-links"            "social icon links shown"             "document.querySelectorAll('.footer__social a').length" "5"
eq  TC-FTR-008 "copyright-year"          "copyright bar has current year"      "document.querySelector('.footer__bar').innerText.includes(String(new Date().getFullYear()))" "true"

# ---------------------------------------------------------------- Negative
head1 "Negative & edge"
navigate
scroll_footer
eq  TC-NEG-016 "no-rental-wording"       "no rental wording (FR-027)"          "/(for\s*rent|rental|lease)/i.test(document.body.innerText)" "false"
eq  TC-NEG-009 "no-nan-prices"           "no NaN/undefined prices"             "Array.from(document.querySelectorAll('.card__price')).some(p=>/(NaN|undefined|null)/.test(p.innerText))" "false"
eq  TC-NEG-007 "badge-only-on-featured"  "non-featured cards have no badge"    "Array.from(document.querySelectorAll('.card')).filter(c=>!c.querySelector('.card__badge')).length" "5"

playwright-cli -s="$S" --raw fill "#newsletter-email" "" >/dev/null 2>&1
playwright-cli -s="$S" --raw click ".footer__form button[type=submit]" >/dev/null 2>&1
eq  TC-NEG-011 "empty-email-submit"      "empty email submit: no error"        "document.querySelector('.footer').getClientRects().length>0" "true"

# ---------------------------------------------------------------- Non-functional
head1 "Non-functional"
navigate
eq  TC-SEC-002 "no-third-party"          "no third-party requests"             "performance.getEntriesByType('resource').filter(r=>!r.name.startsWith(location.origin)).length" "0"
eq  TC-SEO-001 "single-h1"               "exactly one h1"                      "document.querySelectorAll('h1').length" "1"
eq  TC-SEO-002 "title-and-meta"          "title + meta description present"    "!!document.title && !!document.querySelector('meta[name=description]')?.content" "true"
eq  TC-MNT-002 "separate-components"     "three separate components rendered"  "['.header','.listings','.footer'].every(s=>document.querySelector(s))" "true"

cli resize 360 800 >/dev/null
navigate
eq  TC-RESP-001 "no-h-scroll-360"         "no horizontal scroll at 360px"       "document.documentElement.scrollWidth<=document.documentElement.clientWidth" "true"
eq  TC-HDR-006 "nav-collapsed-mobile"    "nav collapsed on mobile"             "getComputedStyle(document.querySelector('#primary-nav')).display" "none"
eq  TC-RESP-002 "toggle-visible-mobile"  "toggle visible on mobile"            "getComputedStyle(document.querySelector('.nav-toggle')).display!=='none'" "true"

playwright-cli -s="$S" --raw click ".nav-toggle" >/dev/null 2>&1
eq  TC-HDR-007 "toggle-opens-nav"        "toggle opens nav"                    "getComputedStyle(document.querySelector('#primary-nav')).display" "block"
playwright-cli -s="$S" --raw click ".nav-toggle" >/dev/null 2>&1
eq  TC-HDR-008 "toggle-closes-nav"       "toggle closes nav"                   "getComputedStyle(document.querySelector('#primary-nav')).display" "none"

cli resize 1440 900 >/dev/null

# ---------------------------------------------------------------- Skipped
head1 "Not browser-verifiable"
skip TC-NEG-005 "image failure fallback — mock images are inline data URIs; cannot fail over the network"
skip TC-NEG-015 "all images fail — same reason"
skip TC-NEG-006 "missing areaSqft field — needs fixture injection into the module"
skip TC-NEG-010 "duplicate listing id — needs fixture injection into the module"
skip TC-NEG-013 "empty dataset — needs fixture injection into the module"
skip TC-PERF-001 "render performance budget — no numeric budget set by user (Q-008)"

{
  echo "# Skipped E2E cases — no screenshot artifact"
  echo
  echo "Generated by \`e2e/run-e2e.sh\`. These cases are specified in"
  echo "\`rfp/real-estate-homepage/test-cases.md\` but do not execute in the browser,"
  echo "so they produce no evidence PNG. Fixing the gap requires a fixture seam in"
  echo "\`src/data/listings.js\` (or a numeric perf budget for TC-PERF-001)."
  echo
  echo "| TC ID | Reason |"
  echo "| ----- | ------ |"
  for entry in "${SKIPPED[@]}"; do
    printf '| %s | %s |\n' "${entry%%|*}" "${entry#*|}"
  done
} > "$EVIDENCE/SKIPPED.md"

playwright-cli -s="$S" close >/dev/null 2>&1

SHOT_COUNT=$(find "$EVIDENCE" -name '*.png' | wc -l | tr -d ' ')
printf '\n\033[1m──────────────────────────────\033[0m\n'
printf '  passed: \033[32m%d\033[0m   failed: \033[31m%d\033[0m   skipped: %d\n' "$PASS" "$FAIL" "${#SKIPPED[@]}"
printf '  evidence: \033[36m%d PNGs\033[0m in %s\n' "$SHOT_COUNT" "$EVIDENCE"
[ "$FAIL" -gt 0 ] && printf '  failed IDs: %s\n' "${FAILED_IDS[*]}"
printf '\033[1m──────────────────────────────\033[0m\n'
[ "$FAIL" -eq 0 ] || exit 1