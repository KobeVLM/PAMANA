-- Per-answer telemetry.
--
-- The existing progress tables only keep the *latest* result per item
-- (word_mastery overwrites each step with 0 or 100), so they cannot answer
-- "how many wrong attempts did this item take?" or "how often was the audio
-- replayed?". This log keeps one row per answer so progress can be recomputed
-- as correct items / total items, and so the refactoring metrics tracked in
-- docs/MVP Validation Findings & Refactoring Priorities.md are measurable.
CREATE TABLE IF NOT EXISTS answer_events (
    id             UUID        PRIMARY KEY,
    user_id        UUID        NOT NULL,
    run_id         UUID        NOT NULL,
    activity       VARCHAR(16) NOT NULL,
    item_type      VARCHAR(24) NOT NULL,
    item_key       VARCHAR(80) NOT NULL,
    step           VARCHAR(16),
    module_number  INTEGER,
    attempt_number INTEGER     NOT NULL,
    is_correct     BOOLEAN     NOT NULL,
    answered_at    TIMESTAMP   NOT NULL DEFAULT now()
);

-- Lookups are always "this run" (progress read-back) or "this learner,
-- newest first" (telemetry and dashboards).
CREATE INDEX IF NOT EXISTS idx_answer_events_run
    ON answer_events (run_id);

CREATE INDEX IF NOT EXISTS idx_answer_events_user_time
    ON answer_events (user_id, answered_at DESC);
