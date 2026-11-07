-- Migration: Add username and gender to users table, make email optional.
-- Supports username-based authentication and adventurer character customization.

-- 1. Add username column if it does not already exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50);

-- 2. Backfill username for existing accounts
-- 2a. Populate username from email prefix (e.g., "juan" from "juan@example.com")
UPDATE users
SET username = SUBSTRING(LOWER(SPLIT_PART(email, '@', 1)), 1, 40)
WHERE (username IS NULL OR TRIM(username) = '')
  AND email IS NOT NULL
  AND TRIM(email) <> '';

-- 2b. Disambiguate colliding usernames by appending part of their UUID
UPDATE users u1
SET username = SUBSTRING(u1.username, 1, 40) || '_' || SUBSTRING(u1.id::text, 1, 6)
WHERE u1.username IN (
    SELECT username
    FROM users
    WHERE username IS NOT NULL
    GROUP BY username
    HAVING COUNT(*) > 1
);

-- 2c. Fallback for any accounts without email or still lacking a username
UPDATE users
SET username = 'user_' || SUBSTRING(id::text, 1, 8)
WHERE username IS NULL OR TRIM(username) = '';

-- 3. Enforce NOT NULL and UNIQUE on username
ALTER TABLE users ALTER COLUMN username SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_users_username'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT uq_users_username UNIQUE (username);
    END IF;
END $$;

-- 4. Add gender column with default 'Lalaki' and backfill existing rows
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'Lalaki';
UPDATE users SET gender = 'Lalaki' WHERE gender IS NULL;

-- 5. Make email optional (drop NOT NULL constraint)
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
