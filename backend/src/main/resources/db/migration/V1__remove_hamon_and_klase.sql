-- Remove legacy "Hamon ng Pamana" and "Klase / Teacher Mode" features.
-- The application no longer exposes these features; this migration drops the
-- corresponding tables and columns from existing databases.

-- Klase Mode classroom + teacher data
DROP TABLE IF EXISTS klases;

-- Hamon ng Pamana challenge sessions
DROP TABLE IF EXISTS hamon_sessions;

-- Classroom linkage previously stored on the user
ALTER TABLE users DROP COLUMN IF EXISTS klase_id;

-- Hamon failure counter previously tracked per mastered word
ALTER TABLE word_mastery DROP COLUMN IF EXISTS hamon_fail_count;
