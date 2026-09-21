-- =====================================================================
-- AI-BASED MULTILINGUAL MASS COMMUNICATION PLATFORM
-- MODULE 1: AUDIENCE DATABASE & CAMPAIGN MANAGEMENT SCHEMA (MySQL 8.0+)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `mass_comm_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `mass_comm_db`;

-- ---------------------------------------------------------------------
-- 1. AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `roles` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `role_name` VARCHAR(50) NOT NULL UNIQUE, -- 'SUPER_ADMIN', 'ADMIN', 'CAMPAIGN_MANAGER', 'COMMUNICATION_TEAM'
    `description` VARCHAR(255) NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `admins` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `role_id` BIGINT NOT NULL DEFAULT 1,
    `full_name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `last_login_at` DATETIME NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_admin_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. MASTER DATA TABLES (Geography, Languages, Occupations, Org Hierarchy)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `countries` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `code` VARCHAR(10) NOT NULL UNIQUE, -- e.g., 'IN', 'US'
    `phone_code` VARCHAR(10) NULL,      -- e.g., '+91'
    `is_active` BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `states` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `country_id` BIGINT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(20) NOT NULL,        -- e.g., 'KA', 'MH', 'TN'
    `is_active` BOOLEAN DEFAULT TRUE,
    CONSTRAINT `fk_states_country` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `districts` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `state_id` BIGINT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(20) NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    CONSTRAINT `fk_districts_state` FOREIGN KEY (`state_id`) REFERENCES `states` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `languages` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,       -- e.g., 'English', 'Kannada', 'Hindi'
    `code` VARCHAR(20) NOT NULL UNIQUE, -- e.g., 'en', 'kn', 'hi', 'ta', 'te'
    `native_name` VARCHAR(100) NOT NULL,-- e.g., 'ಕನ್ನಡ', 'हिन्दी'
    `is_active` BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `occupations` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,-- e.g., 'Teacher', 'Doctor', 'Farmer', 'Student'
    `description` TEXT NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `organizations` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(200) NOT NULL,
    `code` VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'EDU_DEPT', 'HEALTH_DEPT'
    `description` TEXT NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `organization_units` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT NOT NULL,
    `parent_unit_id` BIGINT NULL,       -- Self-referencing FK for department/unit/team hierarchy
    `name` VARCHAR(200) NOT NULL,       -- e.g., 'Primary Education', 'Bengaluru Zone'
    `code` VARCHAR(50) NOT NULL,
    `unit_type` VARCHAR(50) NULL,       -- 'DIVISION', 'DEPARTMENT', 'ZONE', 'TEAM'
    `is_active` BOOLEAN DEFAULT TRUE,
    CONSTRAINT `fk_org_units_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_org_units_parent` FOREIGN KEY (`parent_unit_id`) REFERENCES `organization_units` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. RECIPIENT DATABASE & COMMUNICATION PREFERENCES
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `recipients` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `external_reference_id` VARCHAR(100) NULL UNIQUE,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NULL,
    `email` VARCHAR(255) NULL UNIQUE,
    `phone_number` VARCHAR(20) NULL UNIQUE,
    `date_of_birth` DATE NULL,
    `gender` ENUM('MALE', 'FEMALE', 'NON_BINARY', 'OTHER', 'PREFER_NOT_TO_SAY') DEFAULT 'PREFER_NOT_TO_SAY',
    `occupation_id` BIGINT NULL,
    `organization_id` BIGINT NULL,
    `organization_unit_id` BIGINT NULL,
    `state_id` BIGINT NULL,
    `district_id` BIGINT NULL,
    `city` VARCHAR(100) NULL,
    `pincode` VARCHAR(10) NULL,
    `preferred_language_id` BIGINT NULL,
    `timezone` VARCHAR(50) DEFAULT 'Asia/Kolkata',
    `status` ENUM('ACTIVE', 'INACTIVE', 'BLOCKED') DEFAULT 'ACTIVE',
    `consent_status` ENUM('OPTED_IN', 'OPTED_OUT', 'PENDING') DEFAULT 'OPTED_IN',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_recipients_occ` FOREIGN KEY (`occupation_id`) REFERENCES `occupations` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_recipients_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_recipients_org_unit` FOREIGN KEY (`organization_unit_id`) REFERENCES `organization_units` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_recipients_state` FOREIGN KEY (`state_id`) REFERENCES `states` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_recipients_district` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_recipients_lang` FOREIGN KEY (`preferred_language_id`) REFERENCES `languages` (`id`) ON DELETE SET NULL,
    INDEX `idx_recipients_search` (`state_id`, `district_id`, `preferred_language_id`, `occupation_id`, `status`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `recipient_channel_preferences` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `recipient_id` BIGINT NOT NULL,
    `channel` ENUM('EMAIL', 'SMS', 'WHATSAPP', 'PUSH', 'WEB', 'SOCIAL') NOT NULL,
    `is_enabled` BOOLEAN DEFAULT TRUE,
    `consent_status` ENUM('OPTED_IN', 'OPTED_OUT', 'PENDING') DEFAULT 'OPTED_IN',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_recipient_channel` (`recipient_id`, `channel`),
    CONSTRAINT `fk_channel_pref_recipient` FOREIGN KEY (`recipient_id`) REFERENCES `recipients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `recipient_engagement_events` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `recipient_id` BIGINT NOT NULL,
    `campaign_id` BIGINT NULL,
    `channel` VARCHAR(30) NOT NULL, -- 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH'
    `event_type` ENUM('SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'REPLIED', 'FAILED', 'UNSUBSCRIBED', 'PARTICIPATED') NOT NULL,
    `event_timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `metadata` JSON NULL, -- captures link url, device info, failure reason, etc.
    CONSTRAINT `fk_engagement_recipient` FOREIGN KEY (`recipient_id`) REFERENCES `recipients` (`id`) ON DELETE CASCADE,
    INDEX `idx_eng_recipient_type` (`recipient_id`, `event_type`, `event_timestamp`)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. AUDIENCE SEGMENTATION (Static and Dynamic Rule Engine)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `audience_segments` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `segment_type` ENUM('STATIC', 'DYNAMIC') NOT NULL DEFAULT 'DYNAMIC',
    `status` ENUM('ACTIVE', 'ARCHIVED', 'DRAFT') DEFAULT 'ACTIVE',
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_segment_admin` FOREIGN KEY (`created_by`) REFERENCES `admins` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `audience_segment_rules` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `segment_id` BIGINT NOT NULL,
    `field_name` VARCHAR(100) NOT NULL, -- 'state_id', 'preferred_language_id', 'occupation_id', 'age', 'organization_id', 'engagement'
    `operator` VARCHAR(30) NOT NULL,   -- 'EQUALS', 'NOT_EQUALS', 'IN', 'GREATER_THAN', 'LESS_THAN', 'BETWEEN', 'CONTAINS'
    `field_value` JSON NOT NULL,        -- e.g., ["Karnataka"], 18, {"min_opens": 3, "days": 30}
    `logical_group` VARCHAR(20) DEFAULT 'AND', -- 'AND', 'OR'
    `rule_order` INT NOT NULL DEFAULT 1,
    CONSTRAINT `fk_rules_segment` FOREIGN KEY (`segment_id`) REFERENCES `audience_segments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `audience_segment_members` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `segment_id` BIGINT NOT NULL,
    `recipient_id` BIGINT NOT NULL,
    `added_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_segment_recipient` (`segment_id`, `recipient_id`),
    CONSTRAINT `fk_seg_member_segment` FOREIGN KEY (`segment_id`) REFERENCES `audience_segments` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_seg_member_recipient` FOREIGN KEY (`recipient_id`) REFERENCES `recipients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. TEMPLATES & CONTENT LIBRARIES
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `communication_templates` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `template_type` ENUM('AWARENESS', 'EMERGENCY_ALERT', 'EDUCATIONAL', 'ORGANIZATIONAL_ANNOUNCEMENT') NOT NULL,
    `channel` ENUM('EMAIL', 'SMS', 'WHATSAPP', 'PUSH', 'WEB', 'SOCIAL') NOT NULL,
    `language_id` BIGINT NOT NULL,
    `subject_template` VARCHAR(500) NULL,
    `body_template` TEXT NOT NULL,
    `variables` JSON NULL, -- ['title', 'recipient_name', 'location', 'date', 'action_url']
    `version` INT NOT NULL DEFAULT 1,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') DEFAULT 'PUBLISHED',
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_template_lang` FOREIGN KEY (`language_id`) REFERENCES `languages` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_template_admin` FOREIGN KEY (`created_by`) REFERENCES `admins` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `content_library` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `category` VARCHAR(100) NOT NULL, -- 'Public Health', 'Disaster Management', 'Education', 'Civic Alerts'
    `content_type` VARCHAR(50) DEFAULT 'TEXT', -- 'TEXT', 'MARKDOWN', 'HTML', 'RICH_MEDIA'
    `content` TEXT NOT NULL,
    `language_id` BIGINT NOT NULL,
    `tags` JSON NULL,                 -- ["dengue", "prevention", "health_guidelines"]
    `status` ENUM('ACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE',
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_content_lang` FOREIGN KEY (`language_id`) REFERENCES `languages` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_content_admin` FOREIGN KEY (`created_by`) REFERENCES `admins` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. CAMPAIGN MANAGEMENT, SCHEDULING & MULTILINGUAL CONTENTS
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `campaign_types` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL UNIQUE, -- 'AWARENESS', 'EMERGENCY_ALERT', 'EDUCATIONAL', 'ORGANIZATIONAL_ANNOUNCEMENT'
    `description` TEXT NULL,
    `default_priority` ENUM('LOW', 'NORMAL', 'HIGH', 'CRITICAL') DEFAULT 'NORMAL',
    `is_active` BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `campaigns` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `campaign_code` VARCHAR(50) NOT NULL UNIQUE,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `campaign_type_id` BIGINT NOT NULL,
    `objective` TEXT NULL,
    `priority` ENUM('LOW', 'NORMAL', 'HIGH', 'CRITICAL') DEFAULT 'NORMAL',
    `status` ENUM('DRAFT', 'READY_FOR_REVIEW', 'VALIDATED', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'CANCELLED') DEFAULT 'DRAFT',
    `start_at` DATETIME NULL,
    `end_at` DATETIME NULL,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_campaigns_type` FOREIGN KEY (`campaign_type_id`) REFERENCES `campaign_types` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_campaigns_admin` FOREIGN KEY (`created_by`) REFERENCES `admins` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `campaign_audiences` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `campaign_id` BIGINT NOT NULL,
    `segment_id` BIGINT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_campaign_segment` (`campaign_id`, `segment_id`),
    CONSTRAINT `fk_camp_aud_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_camp_aud_segment` FOREIGN KEY (`segment_id`) REFERENCES `audience_segments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `campaign_contents` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `campaign_id` BIGINT NOT NULL,
    `language_id` BIGINT NOT NULL,
    `channel` ENUM('EMAIL', 'SMS', 'WHATSAPP', 'PUSH', 'WEB', 'SOCIAL') NOT NULL,
    `subject` VARCHAR(500) NULL,
    `title` VARCHAR(500) NULL,
    `body` TEXT NOT NULL,
    `ai_generated` BOOLEAN DEFAULT FALSE,
    `version` INT DEFAULT 1,
    `status` ENUM('DRAFT', 'APPROVED', 'REJECTED') DEFAULT 'APPROVED',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_camp_content_lang_chan` (`campaign_id`, `language_id`, `channel`),
    CONSTRAINT `fk_camp_content_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_camp_content_lang` FOREIGN KEY (`language_id`) REFERENCES `languages` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `campaign_schedules` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `campaign_id` BIGINT NOT NULL,
    `schedule_type` ENUM('SEND_NOW', 'SCHEDULED', 'RECURRING') NOT NULL DEFAULT 'SEND_NOW',
    `scheduled_at` DATETIME NULL,
    `timezone` VARCHAR(50) DEFAULT 'Asia/Kolkata',
    `recurrence_rule` JSON NULL, -- e.g., {"frequency": "DAILY", "until": "2026-12-31"}
    `status` ENUM('PENDING', 'PROCESSING', 'EXECUTED', 'CANCELLED') DEFAULT 'PENDING',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_camp_sched_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. AUDIT LOGGING & COMPLIANCE
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `admin_id` BIGINT NULL,
    `action` VARCHAR(100) NOT NULL,       -- e.g., 'CREATE_CAMPAIGN', 'UPDATE_AUDIENCE_RULES', 'SCHEDULE_CAMPAIGN'
    `entity_type` VARCHAR(100) NOT NULL,  -- e.g., 'CAMPAIGN', 'AUDIENCE_SEGMENT', 'RECIPIENT'
    `entity_id` BIGINT NULL,
    `old_values` JSON NULL,
    `new_values` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_audit_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
    INDEX `idx_audit_entity` (`entity_type`, `entity_id`),
    INDEX `idx_audit_admin` (`admin_id`, `created_at`)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8. SEED DATA FOR IMMEDIATE DEMO & TESTING
-- ---------------------------------------------------------------------

INSERT INTO `roles` (`id`, `role_name`, `description`) VALUES 
(1, 'SUPER_ADMIN', 'Platform Master Administrator with full privileges'),
(2, 'ADMIN', 'Operational administrator for campaign & audience management'),
(3, 'CAMPAIGN_MANAGER', 'Can manage campaigns, content, and schedules'),
(4, 'COMMUNICATION_TEAM', 'Can create drafts and content templates')
ON DUPLICATE KEY UPDATE `description`=VALUES(`description`);

-- Initial Admin (Password: 'Admin@12345' hashed using standard bcrypt placeholder)
INSERT INTO `admins` (`id`, `role_id`, `full_name`, `email`, `password_hash`, `phone`, `is_active`) VALUES
(1, 1, 'System Administrator', 'admin@masscomm.gov.in', '$2b$12$e8YV6mRk5Hfg80hZqM0i0.q4q8oK3NlUvG3y2kP2D2o9L9zYf9gma', '+919876543210', TRUE)
ON DUPLICATE KEY UPDATE `full_name`=VALUES(`full_name`);

INSERT INTO `countries` (`id`, `name`, `code`, `phone_code`) VALUES 
(1, 'India', 'IN', '+91')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `states` (`id`, `country_id`, `name`, `code`) VALUES 
(1, 1, 'Karnataka', 'KA'),
(2, 1, 'Tamil Nadu', 'TN'),
(3, 1, 'Maharashtra', 'MH'),
(4, 1, 'Delhi', 'DL'),
(5, 1, 'Telangana', 'TS')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `districts` (`id`, `state_id`, `name`, `code`) VALUES 
(1, 1, 'Bengaluru Urban', 'BLR_U'),
(2, 1, 'Mysuru', 'MYS'),
(3, 2, 'Chennai', 'CHN'),
(4, 3, 'Mumbai City', 'MUM'),
(5, 5, 'Hyderabad', 'HYD')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `languages` (`id`, `name`, `code`, `native_name`) VALUES 
(1, 'English', 'en', 'English'),
(2, 'Hindi', 'hi', 'हिन्दी'),
(3, 'Kannada', 'kn', 'ಕನ್ನಡ'),
(4, 'Tamil', 'ta', 'தமிழ்'),
(5, 'Telugu', 'te', 'తెలుగు'),
(6, 'Marathi', 'mr', 'मराठी')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `occupations` (`id`, `name`, `description`) VALUES 
(1, 'Teacher / Educator', 'Primary and secondary education staff'),
(2, 'Healthcare Worker', 'Doctors, nurses, paramedics, health officers'),
(3, 'Farmer / Agriculturalist', 'Farmers, agritech workers and cultivators'),
(4, 'Government Official', 'State and district administrative staff'),
(5, 'Student', 'Higher education and university students'),
(6, 'Citizen / General Public', 'General residents')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `organizations` (`id`, `name`, `code`, `description`) VALUES 
(1, 'Department of School Education', 'EDU_DEPT', 'Oversees state schools and curriculum'),
(2, 'Department of Health & Family Welfare', 'HEALTH_DEPT', 'State healthcare administration'),
(3, 'Disaster Management Authority', 'NDMA_STATE', 'State emergency response unit')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `organization_units` (`id`, `organization_id`, `parent_unit_id`, `name`, `code`, `unit_type`) VALUES 
(1, 1, NULL, 'Primary Education Directorate', 'PRI_EDU', 'DIRECTORATE'),
(2, 1, 1, 'Bengaluru South Zone', 'BLR_S_ZONE', 'ZONE'),
(3, 2, NULL, 'Epidemic Control & Public Health', 'EPI_HEALTH', 'DIVISION'),
(4, 3, NULL, 'Rapid Response Cell', 'RRC_HQ', 'UNIT')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `campaign_types` (`id`, `name`, `code`, `description`, `default_priority`) VALUES 
(1, 'Awareness Campaign', 'AWARENESS', 'Public health, social drives, vaccination & hygiene campaigns', 'NORMAL'),
(2, 'Emergency Alert', 'EMERGENCY_ALERT', 'Floods, cyclones, earthquakes, disease outbreaks', 'CRITICAL'),
(3, 'Educational Notification', 'EDUCATIONAL', 'Scholarships, exam schedules, teacher training alerts', 'NORMAL'),
(4, 'Organizational Announcement', 'ORGANIZATIONAL_ANNOUNCEMENT', 'Internal department circulars, policy updates', 'HIGH')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Sample Recipients
INSERT INTO `recipients` (`id`, `external_reference_id`, `first_name`, `last_name`, `email`, `phone_number`, `date_of_birth`, `gender`, `occupation_id`, `organization_id`, `organization_unit_id`, `state_id`, `district_id`, `city`, `pincode`, `preferred_language_id`, `status`, `consent_status`) VALUES 
(1, 'EMP001', 'Ravi', 'Kumar', 'ravi.kumar@example.com', '9876543210', '1988-05-14', 'MALE', 1, 1, 2, 1, 1, 'Bengaluru', '560001', 3, 'ACTIVE', 'OPTED_IN'),
(2, 'EMP002', 'Priya', 'Sharma', 'priya.sharma@example.com', '9876543211', '1992-11-20', 'FEMALE', 2, 2, 3, 2, 3, 'Chennai', '600001', 4, 'ACTIVE', 'OPTED_IN'),
(3, 'EMP003', 'Anand', 'Patil', 'anand.patil@example.com', '9876543212', '1985-02-10', 'MALE', 3, NULL, NULL, 1, 2, 'Mysuru', '570001', 3, 'ACTIVE', 'OPTED_IN'),
(4, 'EMP004', 'Sunita', 'Deshmukh', 'sunita.d@example.com', '9876543213', '1995-07-30', 'FEMALE', 2, 2, 3, 3, 4, 'Mumbai', '400001', 6, 'ACTIVE', 'OPTED_IN'),
(5, 'EMP005', 'Karthik', 'Reddy', 'karthik.r@example.com', '9876543214', '1990-09-18', 'MALE', 4, 3, 4, 5, 5, 'Hyderabad', '500001', 5, 'ACTIVE', 'OPTED_IN')
ON DUPLICATE KEY UPDATE `first_name`=VALUES(`first_name`);

-- Preferences for Recipients
INSERT INTO `recipient_channel_preferences` (`recipient_id`, `channel`, `is_enabled`, `consent_status`) VALUES
(1, 'EMAIL', TRUE, 'OPTED_IN'),
(1, 'SMS', TRUE, 'OPTED_IN'),
(1, 'WHATSAPP', TRUE, 'OPTED_IN'),
(2, 'EMAIL', TRUE, 'OPTED_IN'),
(2, 'WHATSAPP', TRUE, 'OPTED_IN'),
(3, 'SMS', TRUE, 'OPTED_IN'),
(4, 'EMAIL', TRUE, 'OPTED_IN'),
(4, 'PUSH', TRUE, 'OPTED_IN'),
(5, 'SMS', TRUE, 'OPTED_IN'),
(5, 'WHATSAPP', TRUE, 'OPTED_IN')
ON DUPLICATE KEY UPDATE `is_enabled`=VALUES(`is_enabled`);

-- Sample Templates
INSERT INTO `communication_templates` (`id`, `name`, `description`, `template_type`, `channel`, `language_id`, `subject_template`, `body_template`, `variables`, `version`, `status`, `created_by`) VALUES
(1, 'Urgent Flood Alert (English)', 'Standard emergency template for heavy rainfall and flooding', 'EMERGENCY_ALERT', 'SMS', 1, 'URGENT: Flood Alert', 'URGENT FLOOD ALERT: {{title}}. High water levels reported in {{location}}. Immediate evacuation advisory in effect for date {{date}}. Details: {{action_url}}', '["title", "location", "date", "action_url"]', 1, 'PUBLISHED', 1),
(2, 'Urgent Flood Alert (Kannada)', 'Kannada emergency alert for flood conditions', 'EMERGENCY_ALERT', 'SMS', 3, 'ತುರ್ತು ಪ್ರವಾಹ ಮುನ್ನೆಚ್ಚರಿಕೆ', 'ತುರ್ತು ಪ್ರವಾಹ ಎಚ್ಚರಿಕೆ: {{title}}. {{location}} ಪ್ರದೇಶದಲ್ಲಿ ಭಾರಿ ಮಳೆ ಎಚ್ಚರಿಕೆ ದಿನಾಂಕ: {{date}}. ಅಧಿಕೃತ ಸೂಚನೆಗಳನ್ನು ಪಾಲಿಸಿ.', '["title", "location", "date"]', 1, 'PUBLISHED', 1),
(3, 'Dengue Prevention Drive', 'Educational awareness broadcast for disease prevention', 'AWARENESS', 'WHATSAPP', 1, 'Dengue Prevention & Care', 'Dear {{recipient_name}}, protect your family from Dengue! Prevent water stagnation in {{location}} during monsoon. For health helpline call 104.', '["recipient_name", "location"]', 1, 'PUBLISHED', 1)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Sample Content Library items
INSERT INTO `content_library` (`id`, `title`, `description`, `category`, `content_type`, `content`, `language_id`, `tags`, `status`, `created_by`) VALUES
(1, 'Dengue Vector Control Guidelines', 'Verified medical advisory on controlling mosquito breeding during monsoon', 'Public Health', 'TEXT', 'Empty flower pots, clean water coolers weekly, apply mosquito repellents, and consult a doctor immediately if high fever persists.', 1, '["health", "dengue", "prevention"]', 'ACTIVE', 1),
(2, 'ಡೆಂಗ್ಯೂ ತಡೆಗಟ್ಟುವಿಕೆ ಮಾರ್ಗಸೂಚಿಗಳು', 'ಡೆಂಗ್ಯೂ ರೋಗ ನಿಯಂತ್ರಣಕ್ಕಾಗಿ ಸರ್ಕಾರಿ ಮಾರ್ಗಸೂಚಿ', 'Public Health', 'TEXT', 'ನಿಮ್ಮ ಸುತ್ತಮುತ್ತಲಿನ ಪರಿಸರದಲ್ಲಿ ನೀರು ನಿಲ್ಲದಂತೆ ನೋಡಿಕೊಳ್ಳಿ. ವಾರಕ್ಕೊಮ್ಮೆ ನೀರಿನ ತೊಟ್ಟಿಗಳನ್ನು ಸ್ವಚ್ಛಗೊಳಿಸಿ.', 3, '["ಆರೋಗ್ಯ", "ಡೆಂಗ್ಯೂ"]', 'ACTIVE', 1)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);


CREATE TABLE content_quality_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    campaign_content_id BIGINT NOT NULL,
    sentiment VARCHAR(20),          -- POSITIVE / NEUTRAL / NEGATIVE
    tone VARCHAR(50),
    clarity_score INT,
    grammar_ok BOOLEAN,
    factual_ok BOOLEAN,
    compliance_ok BOOLEAN,
    overall_score INT,
    status ENUM('APPROVED','REJECTED') DEFAULT 'APPROVED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_qr_content FOREIGN KEY (campaign_content_id) REFERENCES campaign_contents(id) ON DELETE CASCADE
) ENGINE=InnoDB;