-- Add reference_id to link notification to e.g. performance warning (for "View full details")
-- Run once. If column already exists, you'll get a duplicate column error (safe to ignore).
ALTER TABLE tbl_notifications
  ADD COLUMN reference_id INT NULL COMMENT 'e.g. performance_warning id' AFTER type;
