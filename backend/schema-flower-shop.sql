-- Flower Shop database design (MySQL 8+)
-- This script creates a complete schema for the current backend API
-- and supports the new customization flow for bouquet/vase orders.

CREATE DATABASE IF NOT EXISTS flower_shop_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE flower_shop_db;

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- -----------------------------------------------------
-- Master: geography and branch
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS region (
  region_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  region_name VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_region_name (region_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS province (
  province_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  region_id INT UNSIGNED NOT NULL,
  province_name VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_province_name (province_name),
  KEY idx_province_region (region_id),
  CONSTRAINT fk_province_region
    FOREIGN KEY (region_id) REFERENCES region(region_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS branch (
  branch_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  province_id INT UNSIGNED NOT NULL,
  branch_name VARCHAR(120) NOT NULL,
  branch_address VARCHAR(255) NULL,
  phone VARCHAR(20) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_branch_name (branch_name),
  KEY idx_branch_province (province_id),
  CONSTRAINT fk_branch_province
    FOREIGN KEY (province_id) REFERENCES province(province_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Master: catalog
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS product_type (
  product_type_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_type_name VARCHAR(80) NOT NULL,
  UNIQUE KEY uq_product_type_name (product_type_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product (
  product_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_type_id INT UNSIGNED NOT NULL,
  product_name VARCHAR(150) NOT NULL,
  product_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  product_img VARCHAR(500) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_product_type (product_type_id),
  KEY idx_product_active (is_active),
  CONSTRAINT fk_product_type
    FOREIGN KEY (product_type_id) REFERENCES product_type(product_type_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS branch_container (
  branch_container_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  branch_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  stock_qty INT UNSIGNED NOT NULL DEFAULT 0,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_branch_product (branch_id, product_id),
  KEY idx_branch_container_product (product_id),
  CONSTRAINT fk_branch_container_branch
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_branch_container_product
    FOREIGN KEY (product_id) REFERENCES product(product_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS flower_type (
  flower_type_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  flower_name VARCHAR(100) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_flower_name (flower_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bouquet_style (
  bouquet_style_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bouquet_style_name VARCHAR(80) NOT NULL,
  UNIQUE KEY uq_bouquet_style_name (bouquet_style_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vase_color (
  vase_color_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vase_color_name VARCHAR(80) NOT NULL,
  hex CHAR(7) NULL,
  UNIQUE KEY uq_vase_color_name (vase_color_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS promotion (
  promotion_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  promotion_name VARCHAR(120) NOT NULL,
  description VARCHAR(500) NULL,
  discount_type ENUM('percent','fixed') NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Customer and order domain
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS customer (
  customer_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(150) NULL,
  phone VARCHAR(20) NULL,
  points DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_customer_phone (phone)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customer_address (
  customer_address_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  province_id INT UNSIGNED NULL,
  receiver_name VARCHAR(150) NULL,
  receiver_phone VARCHAR(20) NULL,
  receiver_address VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_customer_address_customer (customer_id),
  KEY idx_customer_address_province (province_id),
  CONSTRAINT fk_customer_address_customer
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_customer_address_province
    FOREIGN KEY (province_id) REFERENCES province(province_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `order` (
  order_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_code VARCHAR(32) NOT NULL,
  branch_id INT UNSIGNED NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  promotion_id INT UNSIGNED NULL,
  customer_note VARCHAR(500) NULL,
  order_status ENUM('received','preparing','shipping','completed','cancelled') NOT NULL DEFAULT 'received',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  florist_photo_url VARCHAR(500) NULL,
  rider_photo_url VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_order_code (order_code),
  KEY idx_order_branch_created_at (branch_id, created_at),
  KEY idx_order_customer (customer_id),
  KEY idx_order_status (order_status),
  CONSTRAINT fk_order_branch
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_order_customer
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_order_promotion
    FOREIGN KEY (promotion_id) REFERENCES promotion(promotion_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS shopping_cart (
  shopping_cart_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  qty INT UNSIGNED NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NULL,
  price_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  line_note VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_shopping_cart_order (order_id),
  KEY idx_shopping_cart_product (product_id),
  CONSTRAINT fk_shopping_cart_order
    FOREIGN KEY (order_id) REFERENCES `order`(order_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_shopping_cart_product
    FOREIGN KEY (product_id) REFERENCES product(product_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Payment domain
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS payment_method (
  payment_method_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_method_name VARCHAR(50) NOT NULL,
  UNIQUE KEY uq_payment_method_name (payment_method_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment (
  payment_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  payment_method_id INT UNSIGNED NOT NULL,
  paid_amount DECIMAL(12,2) NULL,
  paid_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payment_order (order_id),
  KEY idx_payment_method (payment_method_id),
  CONSTRAINT fk_payment_order
    FOREIGN KEY (order_id) REFERENCES `order`(order_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_payment_method
    FOREIGN KEY (payment_method_id) REFERENCES payment_method(payment_method_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_evidence (
  payment_evidence_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_id BIGINT UNSIGNED NOT NULL,
  trans_ref VARCHAR(120) NOT NULL,
  sender_name VARCHAR(150) NULL,
  bank VARCHAR(100) NULL,
  slip_time DATETIME NULL,
  raw_response JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payment_evidence_trans_ref (trans_ref),
  KEY idx_payment_evidence_payment (payment_id),
  CONSTRAINT fk_payment_evidence_payment
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_card_evidence (
  payment_card_evidence_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_id BIGINT UNSIGNED NOT NULL,
  trans_ref VARCHAR(120) NULL,
  card_last4 VARCHAR(8) NULL,
  card_brand VARCHAR(50) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_payment_card_evidence_payment (payment_id),
  CONSTRAINT fk_payment_card_evidence_payment
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Customization domain
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS bouquet_customization (
  bouquet_customization_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shopping_cart_id BIGINT UNSIGNED NOT NULL,
  bouquet_style_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_bouquet_customization_cart (shopping_cart_id),
  KEY idx_bouquet_customization_style (bouquet_style_id),
  CONSTRAINT fk_bouquet_customization_cart
    FOREIGN KEY (shopping_cart_id) REFERENCES shopping_cart(shopping_cart_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_bouquet_customization_style
    FOREIGN KEY (bouquet_style_id) REFERENCES bouquet_style(bouquet_style_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vase_customization (
  vase_customization_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shopping_cart_id BIGINT UNSIGNED NOT NULL,
  vase_color_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_vase_customization_cart (shopping_cart_id),
  KEY idx_vase_customization_color (vase_color_id),
  CONSTRAINT fk_vase_customization_cart
    FOREIGN KEY (shopping_cart_id) REFERENCES shopping_cart(shopping_cart_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_vase_customization_color
    FOREIGN KEY (vase_color_id) REFERENCES vase_color(vase_color_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS flower_detail (
  flower_detail_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shopping_cart_id BIGINT UNSIGNED NOT NULL,
  flower_type_id INT UNSIGNED NOT NULL,
  flower_role ENUM('main','filler') NULL,
  weight_grams INT UNSIGNED NULL,
  stem_count INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_flower_detail_cart (shopping_cart_id),
  KEY idx_flower_detail_type (flower_type_id),
  CONSTRAINT fk_flower_detail_cart
    FOREIGN KEY (shopping_cart_id) REFERENCES shopping_cart(shopping_cart_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_flower_detail_type
    FOREIGN KEY (flower_type_id) REFERENCES flower_type(flower_type_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- New table for step-by-step custom arrangement flow.
-- Supports bouquet normal, bouquet money-envelope, and vase flow.
CREATE TABLE IF NOT EXISTS arrangement_customization (
  arrangement_customization_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shopping_cart_id BIGINT UNSIGNED NOT NULL,
  product_mode ENUM('bouquet','vase') NOT NULL,
  bouquet_kind ENUM('normal','money-envelope') NULL,
  vase_material ENUM('glass','ceramic','clay') NULL,
  vase_shape ENUM('cylinder','bottle','round') NULL,
  wrapper_paper ENUM('kraft','clear','pastel') NULL,
  ribbon_style ENUM('style-1','style-2') NULL,
  ribbon_color ENUM('blue','red') NULL,
  money_package INT UNSIGNED NULL,
  money_fold_style ENUM('fan','rose','heart','star') NULL,
  has_card TINYINT(1) NOT NULL DEFAULT 0,
  card_template ENUM('classic','minimal','romantic') NULL,
  card_message VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_arrangement_customization_cart (shopping_cart_id),
  CONSTRAINT fk_arrangement_customization_cart
    FOREIGN KEY (shopping_cart_id) REFERENCES shopping_cart(shopping_cart_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT chk_arrangement_money_package
    CHECK (money_package IS NULL OR money_package IN (20, 50, 100, 500, 1000))
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Back-office users
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS employee_role (
  role_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL,
  UNIQUE KEY uq_employee_role_name (role_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employee (
  employee_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(60) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT UNSIGNED NOT NULL,
  branch_id INT UNSIGNED NULL,
  name VARCHAR(120) NOT NULL,
  surname VARCHAR(120) NULL,
  phone VARCHAR(20) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_employee_username (username),
  KEY idx_employee_role (role_id),
  KEY idx_employee_branch (branch_id),
  CONSTRAINT fk_employee_role
    FOREIGN KEY (role_id) REFERENCES employee_role(role_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_employee_branch
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS executive (
  executive_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(60) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(120) NOT NULL,
  surname VARCHAR(120) NULL,
  phone VARCHAR(20) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_executive_username (username)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Baseline seed data
-- -----------------------------------------------------

INSERT INTO product_type (product_type_id, product_type_name)
VALUES
  (1, 'bouquet'),
  (2, 'vase')
ON DUPLICATE KEY UPDATE product_type_name = VALUES(product_type_name);

INSERT INTO bouquet_style (bouquet_style_id, bouquet_style_name)
VALUES
  (1, 'round'),
  (2, 'long')
ON DUPLICATE KEY UPDATE bouquet_style_name = VALUES(bouquet_style_name);

INSERT INTO payment_method (payment_method_id, payment_method_name)
VALUES
  (1, 'cash'),
  (2, 'transfer'),
  (3, 'credit')
ON DUPLICATE KEY UPDATE payment_method_name = VALUES(payment_method_name);

INSERT INTO employee_role (role_id, role_name)
VALUES
  (1, 'manager'),
  (2, 'cashier'),
  (3, 'florist'),
  (4, 'rider')
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name);

-- Optional sample flower catalog
INSERT INTO flower_type (flower_name)
VALUES
  ('Rose'),
  ('Tulip'),
  ('Lily'),
  ('Gypsophila'),
  ('Cutter')
ON DUPLICATE KEY UPDATE flower_name = VALUES(flower_name);
