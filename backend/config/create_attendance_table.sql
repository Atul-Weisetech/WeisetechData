-- Create the attendance table for the HR tool
CREATE TABLE IF NOT EXISTS `tbl_attendance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `empl_id` INT NOT NULL,
  `date` INT NOT NULL,
  `type` TINYINT NOT NULL COMMENT '0 = Clock In, 1 = Clock Out',
  `lat` VARCHAR(50) DEFAULT NULL,
  `log` VARCHAR(50) DEFAULT NULL,
  `created` INT NOT NULL,
  `updated` INT NOT NULL,
  `working_hours` DECIMAL(5,2) DEFAULT NULL,
  INDEX `idx_empl_date` (`empl_id`, `date`),
  INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data (optional)
-- INSERT INTO `tbl_attendance` (`empl_id`, `date`, `type`, `lat`, `log`, `created`, `updated`, `working_hours`) 
-- VALUES 
-- (1, 1700000000, 0, '12.9716', '77.5946', 1700000000, 1700000000, NULL),
-- (1, 1700020000, 1, '12.9716', '77.5946', 1700020000, 1700020000, 5.56);