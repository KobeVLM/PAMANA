-- In-app telemetry for the Priority 2 replay button.
--
-- Answer events record *what the learner answered*. They cannot answer "how
-- often did this learner ask to hear the instruction again?", which is the
-- measurement criterion for the auditory-guidance refactoring. Replays are
-- therefore logged in their own append-only table instead of being mixed into
-- answer_events, where they would corrupt attempt numbers and progress.
CREATE TABLE IF NOT EXISTS replay_events (
    id             UUID        PRIMARY KEY,
    user_id        UUID        NOT NULL,
    run_id         UUID        NOT NULL,
    activity       VARCHAR(16) NOT NULL,
    item_type      VARCHAR(24) NOT NULL,
    item_key       VARCHAR(120) NOT NULL,
    step           VARCHAR(16),
    module_number  INTEGER,
    source         VARCHAR(24) NOT NULL,
    replayed_at    TIMESTAMP   NOT NULL DEFAULT now()
);

-- Dashboards group by learner (newest first) or by run; source is a common
-- filter when comparing NPC instructions with target-word replays.
CREATE INDEX IF NOT EXISTS idx_replay_events_run
    ON replay_events (run_id);

CREATE INDEX IF NOT EXISTS idx_replay_events_user_time
    ON replay_events (user_id, replayed_at DESC);

CREATE INDEX IF NOT EXISTS idx_replay_events_user_source
    ON replay_events (user_id, source);
