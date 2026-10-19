# <Feature Name> — Test Cases

| Field           | Value                            |
| --------------- | -------------------------------- |
| Requirements    | [`requirements.md`](./requirements.md) |
| Slug            | `<feature-slug>`                 |
| Date            | `<YYYY-MM-DD>`                   |
| Author          | `<name>`                         |
| Requirements ver| 0.1                              |

## 1. Test strategy

- **Levels in scope:** <unit / integration / E2E / manual>
- **Out of scope:** <what is not tested here and why>
- **Environment:** <staging URL, seed data, fixtures>
- **Test data:** <accounts, roles, sample records needed>
- **Entry/exit criteria:** <when the suite is considered done>

## 2. Traceability matrix

Every FR and NFR from `requirements.md` must appear here.

| Req ID | Test cases | Notes |
| ------ | ---------- | ----- |
| FR-001  | TC-XXX-001 |       |
| NFR-001 | TC-PERF-001 | Not directly testable — <reason> |

## 3. Functional test cases

### <Module name>

| TC ID | Req ID | Title | Type | Priority | Preconditions | Steps | Expected result |
| ----- | ------ | ----- | ---- | -------- | ------------- | ----- | --------------- |

## 4. Negative & edge cases

| TC ID | Req ID | Scenario | Expected result |
| ----- | ------ | -------- | --------------- |

## 5. Non-functional test cases

| TC ID | Req ID | Category | Check | Pass criteria |
| ----- | ------ | -------- | ----- | ------------- |

## 6. BDD scenarios

```gherkin
Feature: <Feature name>
  As a <role>
  I want <capability>
  So that <benefit>

  Scenario: <Happy path>
    Given <precondition>
    When <action>
    Then <expected outcome>

  Scenario: <Failure path>
    Given <precondition>
    When <action>
    Then <error outcome>
```

## 7. Not directly testable

| Req ID | Why | How it will be verified |
| ------ | --- | ----------------------- |

## 8. Open questions

| ID    | Question | Blocks |
| ----- | -------- | ------ |
| Q-001 |          | TC-XXX-001 |