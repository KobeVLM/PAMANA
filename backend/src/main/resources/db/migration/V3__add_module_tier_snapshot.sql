-- Snapshot of Module 4's per-tier sentence accuracy at completion time.
--
-- Previously the PDF report recomputed tier accuracy from sentence_progress
-- rows. Those rows are deleted when a learner restarts a module, while
-- is_complete and accuracy are deliberately kept, so a completed report could
-- show 0.00% for both tiers. Persisting the values alongside the completion
-- makes the report independent of the (resettable) detail rows.
ALTER TABLE module_progress ADD COLUMN IF NOT EXISTS tier1_accuracy NUMERIC(5, 2);
ALTER TABLE module_progress ADD COLUMN IF NOT EXISTS tier2_accuracy NUMERIC(5, 2);
