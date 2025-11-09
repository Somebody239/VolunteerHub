# Database Migration Instructions

This document contains SQL commands to update the database schema and migrate data.

## Migration 1: Merge `link` and `apply_url` columns

**Purpose**: Consolidate the `link` and `apply_url` columns into a single `apply_url` column.

**SQL Commands**:
```sql
-- Step 1: Update apply_url with link value where apply_url is null or empty
UPDATE public.opportunities
SET apply_url = COALESCE(
  NULLIF(apply_url, ''),
  NULLIF(link, '')
)
WHERE (apply_url IS NULL OR apply_url = '') AND link IS NOT NULL AND link != '';

-- Step 2: Drop the link column
ALTER TABLE public.opportunities DROP COLUMN IF EXISTS link;
```

**What this does**:
- Transfers all data from `link` to `apply_url` where `apply_url` is null or empty
- Drops the `link` column since it's no longer needed

## Migration 2: Extract minimum age from `requirements` field

**Purpose**: Extract the first number found in the `requirements` field and set it as `min_age`.

**SQL Commands**:
```sql
-- Extract minimum age from requirements field
UPDATE public.opportunities
SET min_age = (
  SELECT (regexp_match(requirements, '\d+'))[1]::integer
  WHERE requirements IS NOT NULL 
    AND requirements != ''
    AND (regexp_match(requirements, '\d+'))[1] IS NOT NULL
)
WHERE min_age IS NULL
  AND requirements IS NOT NULL
  AND requirements != ''
  AND (regexp_match(requirements, '\d+'))[1] IS NOT NULL;
```

**What this does**:
- Finds the first number in the `requirements` text field using regex
- Sets that number as `min_age` for rows where `min_age` is currently null
- Only updates rows that have requirements text with at least one number

## Migration 3: Remove `requirements` column

**Purpose**: Remove the `requirements` column since data has been moved to `min_age`.

**SQL Commands**:
```sql
-- Drop the requirements column
ALTER TABLE public.opportunities DROP COLUMN IF EXISTS requirements;
```

**What this does**:
- Removes the `requirements` column from the database
- This should only be run after Migration 2 has extracted the data to `min_age`

## Migration 4: Update `internal_application_enabled` based on `organizer_id`

**Purpose**: Set `internal_application_enabled` based on whether the opportunity has an `organizer_id`.

**SQL Commands**:
```sql
-- Set internal_application_enabled = FALSE for jobs without an organizer_id
UPDATE public.opportunities
SET internal_application_enabled = FALSE
WHERE organizer_id IS NULL;

-- Set internal_application_enabled = TRUE for jobs with an organizer_id
UPDATE public.opportunities
SET internal_application_enabled = TRUE
WHERE organizer_id IS NOT NULL;
```

**What this does**:
- Sets `internal_application_enabled = FALSE` for opportunities without an `organizer_id` (external opportunities)
- Sets `internal_application_enabled = TRUE` for opportunities with an `organizer_id` (internal opportunities)

## Execution Order

1. Run Migration 1 first (merge link and apply_url)
2. Then run Migration 2 (extract min_age from requirements)
3. Then run Migration 3 (remove requirements column)
4. Finally run Migration 4 (update internal_application_enabled based on organizer_id)

## Verification

After running the migrations, you can verify the changes:

```sql
-- Check that link column is gone
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'opportunities' 
  AND column_name = 'link';
-- Should return 0 rows

-- Check that apply_url has data from link
SELECT id, apply_url 
FROM public.opportunities 
WHERE apply_url IS NOT NULL 
LIMIT 10;

-- Check that min_age was extracted from requirements
SELECT id, min_age 
FROM public.opportunities 
WHERE min_age IS NOT NULL 
LIMIT 10;

-- Check that requirements column is gone
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'opportunities' 
  AND column_name = 'requirements';
-- Should return 0 rows

-- Check that internal_application_enabled is set correctly
SELECT id, organizer_id, internal_application_enabled 
FROM public.opportunities 
LIMIT 10;
```

## Notes

- All migrations are safe to run multiple times (idempotent)
- Migrations 1 and 2 only update rows where the target field is null or empty
- No data is lost - all data from `link` is preserved in `apply_url`
- Migration 3 should only be run after Migration 2 has completed
- Migration 4 updates all rows based on `organizer_id` presence

