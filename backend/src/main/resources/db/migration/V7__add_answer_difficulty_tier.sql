-- Record which adaptive tier was served with each answer, so the Priority 3
-- improvement can be measured as accuracy and completion per tier rather than
-- only as a subjective evaluator score.
ALTER TABLE answer_events
    ADD COLUMN IF NOT EXISTS difficulty_tier VARCHAR(16) NOT NULL DEFAULT 'STANDARD';

CREATE INDEX IF NOT EXISTS idx_answer_events_user_tier
    ON answer_events (user_id, difficulty_tier);
