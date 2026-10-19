---
name: create-rfp
description: Use when the user asks to create an RFP, requirements doc, requirement specification, PRD, or test cases for a feature — e.g. "create rfp for property listing", "write requirements and test cases for X", "new requirement doc". Runs a guided interview, then creates a branch rfp/<feature-slug> and writes rfp/<feature-slug>/requirements.md and rfp/<feature-slug>/test-cases.md in the project root.
---

# Create RFP

Turn a rough feature idea into two artifacts in the project root:

```
rfp/
└── <feature-slug>/
    ├── requirements.md
    └── test-cases.md
```

The `<feature-slug>` is derived from the requirement itself, not typed by the user.

## Non-negotiable rules

1. **Never invent requirements.** If something was not stated by the user, do not write it as a decided fact. Put it in *Assumptions & Open Questions* marked `[NEEDS-CLARIFICATION]`.
2. **Always interview first.** Do not create any file until the user has answered the intake. A folder built on guessed requirements is worse than no folder.
3. **Traceability is mandatory.** Every test case carries a `Req ID` that exists in `requirements.md`. Every FR/NFR in `requirements.md` has at least one test case (or is listed in *Not directly testable* with a reason).
4. **Use the templates.** Copy from `templates/` in this skill folder, then fill them in. Do not write requirements/test cases from scratch — the templates carry the section order.
5. **Preserve the user's words.** Requirements, rule names, and domain terms should be traceable to what the user said. Rename with care; never silently re-scope.

## Step 1 — Interview the user

Ask in **two rounds max**. Round 1 in plain chat (open-ended prose), round 2 with the `question` tool (fixed choices). Say up front that "skip" or a rough answer is fine — you will draft and flag the gaps.

**Round 1 — ask in chat, numbered, user may answer in any form:**

1. What is the feature called, in one line?
2. What problem does it solve, and what breaks today without it?
3. Who uses it? (roles, plus admin/support if any)
4. What must the feature do? List the concrete capabilities.
5. What are the rules or constraints? (pricing, permissions, limits, validations, edge cases you already know about)
6. What is explicitly **out of scope**?
7. Any stack, deadline, or compliance constraint (auth, payments, PII, mobile, performance)?

**Round 2 — ask via the `question` tool**, one question per gap that Round 1 left open. Typical gap questions:

- Priority (critical / high / medium / low) — gates the MoSCoW split.
- Primary test levels to write (unit / integration / E2E / manual) — gates what goes in the test strategy.
- Environments or fixtures the tests assume (staging URL, seed data, roles).
- Target platforms (web / iOS / Android / responsive).

Do not re-ask anything already answered. If the user replies "just build it", fill gaps with `[NEEDS-CLARIFICATION]` and proceed.

## Step 2 — Derive the folder name

Slugify the feature name: lowercase, kebab-case, 2–5 words, ASCII only, no dates or version numbers.

- "Property Listing & Inquiry" → `property-listing-inquiry`
- "Rent payment webhook" → `rent-payment-webhook`

Strip filler words (*page*, *feature*, *system*, *module*, *v2*). If the slug is too generic (`payments`, `notifications`), add the domain noun (`rent-payment-webhook`, not `payments`).

If `rfp/<slug>/` already exists, do not overwrite. Tell the user and offer `<slug>-2`.

## Step 3 — Create the branch

Every requirement gets its own branch, named `rfp/<slug>`, so specs and their implementation stay reviewable in isolation.

1. Confirm the project is a git repository (`git rev-parse --is-inside-work-tree`). If it is not, skip this step and say so in the report — do not run `git init` without being asked.
2. `git switch -c rfp/<slug>` from the current branch. Never switch away from a branch that has uncommitted changes.
3. If the branch already exists, switch to it and tell the user it was reused. Never reset or force-update it.

Do not commit or push. Creating the branch is the last git action this skill takes — commits and pushes belong to the user unless they ask.

## Step 4 — Write requirements.md

1. Get today's date: `date +%Y-%m-%d` (never hardcode it).
2. Create `rfp/<slug>/`.
3. Read `templates/requirements-template.md`.
4. Write the filled copy to `rfp/<slug>/requirements.md`.
5. Delete every section that genuinely does not apply — an empty section is worse than a missing one. Keep *Assumptions & Open Questions*, it is never empty in practice.

ID scheme, keep it strict and consistent with the test cases file:

| Prefix   | Meaning                          | Example       |
| -------- | -------------------------------- | ------------- |
| `FR-###` | Functional requirement           | `FR-004`      |
| `BR-###` | Business rule                    | `BR-002`      |
| `NFR-###`| Non-functional requirement       | `NFR-001`     |
| `AC-###` | Acceptance criterion             | `AC-003`      |

Number sequentially within each prefix, never reuse a number, never renumber after editing — stale traceability is worse than a gap.

Write each functional requirement as **one verifiable behaviour**, not a bundle. "User can search listings" is not a requirement; "User can filter listings by city, price range, and bedrooms, and results update without a page reload" is.

## Step 5 — Write test-cases.md

1. Read `templates/test-cases-template.md`.
2. Write the filled copy to `rfp/<slug>/test-cases.md`.
3. Build it **from** `requirements.md`, not from your memory of the interview — re-read the file first so the IDs match exactly.

Rules:

- IDs are `TC-<module>-###` (e.g. `TC-AUTH-001`).
- Each TC row: `TC ID | Req ID | Title | Type | Priority | Preconditions | Steps | Expected result`.
- Cover **happy path, boundary, negative, permission, and error/recovery** for every requirement. A requirements-to-tests traceability matrix that shows only happy paths is an incomplete deliverable.
- The traceability matrix must list **every** FR/NFR ID from `requirements.md`. An ID missing from the matrix is a hole — add a TC or mark it not directly testable with a reason.
- Gherkin blocks: one `Feature:` per user story, `Scenario:` per behaviour, use `Given/When/Then/And`. Keep scenarios independent.
- Do not assert on exact timings, magic numbers, or copy that the requirements never fixed.

## Step 6 — Report back

Print, concisely:

- The two paths created.
- The slug and why it was chosen.
- The branch created.
- The FR / BR / NFR / TC counts.
- **Open questions** needing the user's answer (this is the important part — it is what they must act on next).

Then tell the user to restart opencode if the skill was newly created (skills load at startup).

## Maintaining an existing RFP

If `rfp/<slug>/requirements.md` already exists and the user asks for changes, edit in place:

- Switch to `rfp/<slug>` first if it exists — an edit belongs on that requirement's branch, never on a new one. If no such branch exists, create it from the current branch rather than starting a fresh `rfp/<slug>-2`.
- New requirements get the next free ID. Never renumber.
- After any `requirements.md` change, update `test-cases.md`: new/changed requirements need new or revised TCs, and the traceability matrix must be rebuilt.
- Append a short entry to the *Change log* table in `requirements.md`.