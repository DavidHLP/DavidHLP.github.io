---
{
  "archiveId": "X-1304",
  "title": "SQL Date Expression Dialect Boundaries: Spark SQL, Oracle, and MySQL",
  "en": "ENGINEERING NOTES",
  "category": "系统运维",
  "department": "工程笔记",
  "date": "2026-11-27",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "Distinguishing month arithmetic, truncation, format tokens, and year-boundary behavior across Spark SQL, Oracle, and MySQL in a dialect-first verification order.",
  "findings": [
    "Native wiki page: content/blog/legacy/note/en/sql-date-dialect-boundaries.md",
    "Source snapshot: database-written-test-review",
    "Evidence status: provisional"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/database-written-test-review.md",
  "pubDate": "2026-11-27T00:00:00.000Z",
  "tags": [
    "SQL",
    "Spark SQL",
    "Oracle",
    "MySQL",
    "Datetime",
    "en",
    "note"
  ],
  "draft": false,
  "lang": "en",
  "translationKey": "legacy/note/sql-date-dialect-boundaries",
  "kind": "concept",
  "status": "provisional",
  "sources": [
    "database-written-test-review"
  ],
  "related": [
    "database-written-test-review"
  ]
}
---

Seeing `date_format`, `trunc`, and `add_months` together in one expression does not automatically mean incompatible dialects were mixed. The reliable order is: **identify the engine dialect first, verify function signatures and format tokens next, and test the January year boundary.**

## Cross-Dialect Comparison for the Same Intent

Goal: extract **the four-digit year containing the previous month**.

| Engine | Month shift | Month-start truncation | Year format token | Documented baseline |
| --- | --- | --- | --- | --- |
| Spark SQL | `add_months(current_date(), -1)` | `trunc(..., 'MM')` | `date_format(..., 'yyyy')` | Spark 3.5.7 |
| Oracle | `ADD_MONTHS(CURRENT_DATE, -1)` | `TRUNC(..., 'MM')` | `TO_CHAR(..., 'YYYY')` | Oracle 19c |
| MySQL | `DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)` | Optional when extracting year | `DATE_FORMAT(..., '%Y')` | MySQL 8.4 |

### Spark SQL

In Spark SQL, `date_format`, `trunc`, and `add_months` combine legally:

```sql
-- Spark SQL
SELECT date_format(
    trunc(add_months(current_date(), -1), 'MM'),
    'yyyy'
) AS previous_month_year;
```

The steps are: take the current date, move back one month, truncate to the first day of that month, and format as a four-digit year string. The result is **the year of the previous month**, not "always the current year": in January it returns the prior year, while in other months it normally stays in the current year.

### Oracle

Oracle shares similar month-arithmetic and truncation names, but formats with `TO_CHAR` and selects `FROM dual`:

```sql
-- Oracle
SELECT TO_CHAR(
    TRUNC(ADD_MONTHS(CURRENT_DATE, -1), 'MM'),
    'YYYY'
) AS previous_month_year
FROM dual;
```

### MySQL

MySQL uses `%Y` rather than Spark/Oracle `yyyy` or `YYYY`, and extracting the year alone does not require truncating to the first day of the month:

```sql
-- MySQL
SELECT DATE_FORMAT(
    DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH),
    '%Y'
) AS previous_month_year;
```

## Fixed Inspection Order and Year-Boundary Counterexample

Follow four steps when evaluating date expressions:

1. **Confirm the engine**: lock down whether the query targets Spark SQL, Oracle, or MySQL and its version.
2. **Check functions and format tokens**: distinguish `yyyy`, `YYYY`, and `%Y`; never copy format strings across dialects unchecked.
3. **Check return types**: separate date values from formatted string outputs.
4. **Verify year and month-end boundaries**: use January as the minimal counterexample to verify crossing into the previous year.

## Evidence Boundaries and Unverified Items

- **Source facts**: Split from section 5 of [Database Written-Test Review](/blog/legacy/note/en/database-written-test-review/), citing the Spark 3.5.7, Oracle 19c, and MySQL 8.4 documentation references in `database-written-test-review`.
- **Unverified items**: These statements were not executed against live Spark 3.5.7, Oracle 19c, or MySQL 8.4 instances in this round; actual outputs and return types for year crossings, month-end dates (such as March 31 minus one month), and invalid format tokens remain unverified by live runs.

## Graduation Checks

- Execute all three date expressions against pinned Spark 3.5.7, Oracle 19c, and MySQL 8.4 instances
- Verify January year-boundary and month-end test cases along with return types
- Record actual engine behavior for mismatched format tokens (such as `yyyy`/`YYYY` in MySQL) and retain bidirectional links with the parent page
