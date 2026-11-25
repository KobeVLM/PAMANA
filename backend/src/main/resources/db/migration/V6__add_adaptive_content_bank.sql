-- Priority 3: tiered Content Bank.
--
-- Vocabulary words and syllable sets used to live in hardcoded Java arrays,
-- so every learner got the same distractors. This table stores a separate,
-- structured distractor pool per item and difficulty tier. The tier itself is
-- never chosen by a teacher or by the learner: AdaptiveTierResolver assigns it
-- from recent answer accuracy.
CREATE TABLE IF NOT EXISTS content_bank (
    id              UUID        PRIMARY KEY,
    activity        VARCHAR(16) NOT NULL,  -- 'vocabulary' | 'syllable'
    item_key        VARCHAR(80) NOT NULL,  -- word, or 'subLevel:setId'
    difficulty_tier VARCHAR(16) NOT NULL,  -- FOUNDATIONAL | STANDARD | CHALLENGE
    distractors     TEXT        NOT NULL,  -- comma-separated option labels
    context_word    VARCHAR(50),           -- multi-syllable context, when used
    CONSTRAINT uq_content_bank_item UNIQUE (activity, item_key, difficulty_tier)
);

-- Every read is an exact lookup of one item at one tier.
CREATE INDEX IF NOT EXISTS idx_content_bank_lookup
    ON content_bank (activity, item_key, difficulty_tier);
