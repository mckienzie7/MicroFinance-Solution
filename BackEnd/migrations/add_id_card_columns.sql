-- Migration: Add ID card columns to users table
-- Date: 2025-01-22
-- Description: Add columns for storing front and back ID card image paths

-- Add id_card_front_path column
ALTER TABLE users ADD COLUMN id_card_front_path VARCHAR(255) DEFAULT NULL;

-- Add id_card_back_path column  
ALTER TABLE users ADD COLUMN id_card_back_path VARCHAR(255) DEFAULT NULL;

-- Add indexes for better performance (optional)
CREATE INDEX idx_users_id_card_front ON users(id_card_front_path);
CREATE INDEX idx_users_id_card_back ON users(id_card_back_path);

-- Add comments to document the columns
ALTER TABLE users MODIFY COLUMN id_card_front_path VARCHAR(255) DEFAULT NULL COMMENT 'Path to user ID card front image';
ALTER TABLE users MODIFY COLUMN id_card_back_path VARCHAR(255) DEFAULT NULL COMMENT 'Path to user ID card back image';