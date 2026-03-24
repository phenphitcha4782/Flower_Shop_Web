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

-- Add average_rating column to employee table if it doesn't exist
ALTER TABLE employee
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) NOT NULL DEFAULT 0.00 AFTER phone;

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

-- Create delivery table if it doesn't exist
CREATE TABLE IF NOT EXISTS delivery (
  delivery_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  employee_id BIGINT UNSIGNED NOT NULL,
  rider_photo_url VARCHAR(500) NULL,
  delivery_status ENUM('assigning','delivering','completed','cancelled') NOT NULL DEFAULT 'assigning',
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_delivery_order (order_id),
  KEY idx_delivery_employee (employee_id),
  KEY idx_delivery_status (delivery_status),
  CONSTRAINT fk_delivery_order
    FOREIGN KEY (order_id) REFERENCES `order`(order_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_delivery_employee
    FOREIGN KEY (employee_id) REFERENCES employee(employee_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Create order_review table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_review (
  review_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  rating_product INT UNSIGNED NULL CHECK (rating_product >= 0 AND rating_product <= 5),
  rating_rider INT UNSIGNED NULL CHECK (rating_rider >= 0 AND rating_rider <= 5),
  comment TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_order_review_order (order_id),
  KEY idx_order_review_product (rating_product),
  KEY idx_order_review_rider (rating_rider),
  CONSTRAINT fk_order_review_order
    FOREIGN KEY (order_id) REFERENCES `order`(order_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- Create complaints table for low-rated orders
CREATE TABLE IF NOT EXISTS complaints (
  complaint_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  employee_id BIGINT UNSIGNED NOT NULL,
  employee_role VARCHAR(50) NOT NULL,
  order_code VARCHAR(50) NOT NULL,
  rating INT UNSIGNED NOT NULL CHECK (rating >= 0 AND rating <= 5),
  rating_type ENUM('product','delivery') NOT NULL,
  reason TEXT NULL,
  status ENUM('pending','in-progress','resolved') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_complaints_employee (employee_id),
  KEY idx_complaints_order (order_id),
  KEY idx_complaints_status (status),
  KEY idx_complaints_rating (rating),
  CONSTRAINT fk_complaints_order
    FOREIGN KEY (order_id) REFERENCES `order`(order_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_complaints_employee
    FOREIGN KEY (employee_id) REFERENCES employee(employee_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Verify the changes
SELECT 'Payment table columns:' as step;
SHOW COLUMNS FROM payment;

SELECT 'Prepare table created:' as step;
SHOW COLUMNS FROM prepare;

SELECT 'Delivery table created:' as step;
SHOW COLUMNS FROM delivery;

SELECT 'Order review table created:' as step;
SHOW COLUMNS FROM order_review;

SELECT 'Complaints table created:' as step;
SHOW COLUMNS FROM complaints;
