-- Migration script to add Florist workflow columns and prepare table
-- Run this if the database schema already exists

USE flower_shop_db;

-- Add missing columns to payment table if they don't exist
ALTER TABLE payment 
ADD COLUMN IF NOT EXISTS employee_id BIGINT UNSIGNED NULL AFTER paid_at,
ADD COLUMN IF NOT EXISTS verified_at DATETIME NULL AFTER employee_id,
ADD COLUMN IF NOT EXISTS verified_result VARCHAR(50) NULL AFTER verified_at;

-- Add foreign key for employee_id if it doesn't exist
ALTER TABLE payment
ADD KEY IF NOT EXISTS idx_payment_employee (employee_id);

-- Note: Add foreign key constraint if needed (may fail if column already linked)
-- ALTER TABLE payment
-- ADD CONSTRAINT fk_payment_employee
--   FOREIGN KEY (employee_id) REFERENCES employee(employee_id)
--   ON UPDATE CASCADE ON DELETE SET NULL;

-- Create prepare table if it doesn't exist
CREATE TABLE IF NOT EXISTS prepare (
  prepare_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  employee_id BIGINT UNSIGNED NOT NULL,
  florist_photo_url VARCHAR(500) NULL,
  prepare_status ENUM('assigning','preparing','completed') NOT NULL DEFAULT 'assigning',
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_prepare_order (order_id),
  KEY idx_prepare_employee (employee_id),
  KEY idx_prepare_status (prepare_status),
  CONSTRAINT fk_prepare_order
    FOREIGN KEY (order_id) REFERENCES `order`(order_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_prepare_employee
    FOREIGN KEY (employee_id) REFERENCES employee(employee_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Verify the changes
SELECT 'Payment table columns:' as step;
SHOW COLUMNS FROM payment;

SELECT 'Prepare table created:' as step;
SHOW COLUMNS FROM prepare;
