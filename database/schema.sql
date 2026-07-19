-- =====================================================================
-- Smart Recommend AI — Database Schema
-- MySQL 8.0+
-- =====================================================================

CREATE DATABASE IF NOT EXISTS smart_recommend_ai
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE smart_recommend_ai;

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  first_name          VARCHAR(100)      NOT NULL,
  last_name           VARCHAR(100)      NOT NULL,
  email               VARCHAR(255)      NOT NULL UNIQUE,
  password_hash       VARCHAR(255)      NOT NULL,
  date_of_birth       DATE              NOT NULL,
  gender              ENUM('male','female','other','prefer_not_to_say') DEFAULT 'prefer_not_to_say',
  country             VARCHAR(100)      NOT NULL,
  preferred_travel_style ENUM('budget','comfort','luxury','adventure','family','solo','backpacker') DEFAULT 'comfort',
  credits             INT UNSIGNED      NOT NULL DEFAULT 5,
  plan                ENUM('free','pro') NOT NULL DEFAULT 'free',
  cancel_at_period_end BOOLEAN          NOT NULL DEFAULT FALSE,  -- TRUE once user cancels; plan stays 'pro' until current_period_end
  current_period_end  DATE              DEFAULT NULL,           -- when the current paid period (demo or real) ends
  avatar_url          VARCHAR(500)      DEFAULT NULL,
  bio                 VARCHAR(500)      DEFAULT NULL,
  is_active           BOOLEAN           NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMP         DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP         DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_country (country)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- REFRESH TOKENS / SESSIONS (for JWT session management + logout)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS sessions;
CREATE TABLE sessions (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  refresh_token VARCHAR(500)    NOT NULL,
  user_agent    VARCHAR(255)    DEFAULT NULL,
  ip_address    VARCHAR(64)     DEFAULT NULL,
  expires_at    TIMESTAMP       NOT NULL,
  revoked       BOOLEAN         NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_token (refresh_token(191))
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- DESTINATIONS (master catalog used by the recommendation engine)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS destinations;
CREATE TABLE destinations (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(150)  NOT NULL,
  country           VARCHAR(100)  NOT NULL,
  region            VARCHAR(100)  DEFAULT NULL,          -- e.g. 'South Asia', 'Europe'
  type              ENUM('domestic','international') NOT NULL,
  category           SET('beach','mountain','heritage','adventure','wildlife','city','wellness','romantic','family','budget','luxury') DEFAULT NULL,
  best_season       SET('winter','summer','monsoon','spring','autumn','all_year') DEFAULT 'all_year',
  avg_cost_per_day_usd DECIMAL(10,2) DEFAULT NULL,
  budget_tier       ENUM('low','medium','high','luxury') DEFAULT 'medium',
  min_age_recommended INT UNSIGNED DEFAULT 0,
  kid_friendly      BOOLEAN       NOT NULL DEFAULT FALSE,
  description       TEXT,
  image_url         VARCHAR(500)  DEFAULT NULL,
  popularity_score  DECIMAL(4,2)  DEFAULT 0,              -- 0-10, trending weight
  avg_rating        DECIMAL(3,2)  DEFAULT 0,
  rating_count      INT UNSIGNED  DEFAULT 0,
  created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_dest_country (country),
  INDEX idx_dest_type (type),
  INDEX idx_dest_kid (kid_friendly),
  FULLTEXT INDEX ft_dest_search (name, description)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- KIDS ACTIVITIES (linked to a destination, for the Kids section)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS kids_activities;
CREATE TABLE kids_activities (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  destination_id  BIGINT UNSIGNED NOT NULL,
  title           VARCHAR(150) NOT NULL,
  activity_type   ENUM('theme_park','educational','wildlife','beach','adventure_mild','museum','water_park') NOT NULL,
  min_age         INT UNSIGNED DEFAULT 0,
  max_age         INT UNSIGNED DEFAULT 17,
  safety_notes    VARCHAR(500) DEFAULT NULL,
  description     TEXT,
  image_url       VARCHAR(500) DEFAULT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
  INDEX idx_kids_dest (destination_id),
  INDEX idx_kids_age (min_age, max_age)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TRAVEL HISTORY (places the user has already been / logged)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS travel_history;
CREATE TABLE travel_history (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT UNSIGNED NOT NULL,
  destination_id  BIGINT UNSIGNED DEFAULT NULL,
  destination_name VARCHAR(150) NOT NULL,
  visited_on      DATE DEFAULT NULL,
  notes           VARCHAR(500) DEFAULT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE SET NULL,
  INDEX idx_hist_user (user_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- RECOMMENDATION REQUESTS (one row per "generate recommendations" call)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS recommendation_requests;
CREATE TABLE recommendation_requests (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           BIGINT UNSIGNED NOT NULL,
  interests         VARCHAR(500) DEFAULT NULL,
  purpose           VARCHAR(255) DEFAULT NULL,
  budget_usd        DECIMAL(10,2) DEFAULT NULL,
  location_preference VARCHAR(150) DEFAULT NULL,  -- NULL/blank = "no preference"
  travel_style      VARCHAR(50) DEFAULT NULL,
  season            VARCHAR(50) DEFAULT NULL,
  result_count      INT UNSIGNED DEFAULT 0,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reqs_user (user_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- RECOMMENDATION RESULTS (the destinations returned for a request)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS recommendation_results;
CREATE TABLE recommendation_results (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  request_id      BIGINT UNSIGNED NOT NULL,
  destination_id  BIGINT UNSIGNED NOT NULL,
  score           DECIMAL(6,3) NOT NULL,
  reason          VARCHAR(500) DEFAULT NULL,
  rank_position   INT UNSIGNED DEFAULT 0,
  FOREIGN KEY (request_id) REFERENCES recommendation_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
  INDEX idx_results_req (request_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- WISHLIST
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS wishlist;
CREATE TABLE wishlist (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT UNSIGNED NOT NULL,
  destination_id  BIGINT UNSIGNED NOT NULL,
  added_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
  UNIQUE KEY uq_wishlist (user_id, destination_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- SAVED RECOMMENDATIONS
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS saved_recommendations;
CREATE TABLE saved_recommendations (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT UNSIGNED NOT NULL,
  destination_id  BIGINT UNSIGNED NOT NULL,
  request_id      BIGINT UNSIGNED DEFAULT NULL,
  saved_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
  FOREIGN KEY (request_id) REFERENCES recommendation_requests(id) ON DELETE SET NULL,
  UNIQUE KEY uq_saved (user_id, destination_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- REVIEWS & RATINGS
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS reviews;
CREATE TABLE reviews (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT UNSIGNED NOT NULL,
  destination_id  BIGINT UNSIGNED NOT NULL,
  rating          DECIMAL(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title           VARCHAR(150) DEFAULT NULL,
  body            TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
  UNIQUE KEY uq_review (user_id, destination_id),
  INDEX idx_reviews_dest (destination_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- SEARCH HISTORY
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS search_history;
CREATE TABLE search_history (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  query       VARCHAR(255) NOT NULL,
  filters     JSON DEFAULT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_search_user (user_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- CREDIT TRANSACTIONS (audit trail for credit changes)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS credit_transactions;
CREATE TABLE credit_transactions (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  amount      INT NOT NULL,                 -- positive = credit, negative = debit
  reason      VARCHAR(255) NOT NULL,        -- e.g. 'signup_bonus', 'recommendation_generated'
  balance_after INT UNSIGNED NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_credit_user (user_id)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- KIDS CATALOG ITEMS — non-travel recommendation content (movies, books,
-- courses, games, music, restaurants, fashion, electronics) that is
-- specifically for children. Kept in its own table, completely separate
-- from `catalog_items`, so the main (adult) recommendation engine never
-- sees or serves this content. It is only ever read by the Kids page/API.
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS kids_catalog_items;
CREATE TABLE kids_catalog_items (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category          ENUM('movies','books','career','electronics','courses','fashion','restaurants','games','music') NOT NULL,
  title             VARCHAR(200) NOT NULL,
  description       TEXT NOT NULL,
  tags              VARCHAR(300) DEFAULT NULL,
  price_label       VARCHAR(100) DEFAULT NULL,
  price_usd         DECIMAL(10,2) DEFAULT NULL,
  budget_tier       ENUM('low','medium','high','luxury') DEFAULT 'medium',
  pros              JSON DEFAULT NULL,
  cons              JSON DEFAULT NULL,
  emoji             VARCHAR(32) DEFAULT NULL,
  popularity_score  DECIMAL(4,2) DEFAULT 0,
  avg_rating        DECIMAL(3,2) DEFAULT 0,
  rating_count      INT UNSIGNED DEFAULT 0,
  region            VARCHAR(100) DEFAULT NULL,
  age_group         VARCHAR(50)  DEFAULT NULL,        -- e.g. '3+', '6+', 'All'
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_kids_catalog_category (category),
  FULLTEXT INDEX ft_kids_catalog_search (title, description, tags)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- CATALOG ITEMS — generic recommendation catalog for the non-travel
-- categories (Movies, Books, Career, Electronics, Courses, Fashion,
-- Restaurants, Games, Music). Travel keeps its own richer `destinations`
-- table above since it needs location/age/season-specific fields; these
-- categories share one flexible schema instead of nine near-identical ones.
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS catalog_items;
CREATE TABLE catalog_items (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category          ENUM('movies','books','career','electronics','courses','fashion','restaurants','games','music') NOT NULL,
  title             VARCHAR(200) NOT NULL,
  description       TEXT NOT NULL,
  tags              VARCHAR(300) DEFAULT NULL,      -- comma-separated, used for interest matching
  price_label       VARCHAR(100) DEFAULT NULL,       -- human-readable, e.g. "$16 on Amazon"
  price_usd         DECIMAL(10,2) DEFAULT NULL,       -- numeric, used for budget matching
  budget_tier       ENUM('low','medium','high','luxury') DEFAULT 'medium',
  pros              JSON DEFAULT NULL,                -- array of strings
  cons              JSON DEFAULT NULL,                -- array of strings
  emoji             VARCHAR(32) DEFAULT NULL,
  popularity_score  DECIMAL(4,2) DEFAULT 0,
  avg_rating        DECIMAL(3,2) DEFAULT 0,
  rating_count      INT UNSIGNED DEFAULT 0,
  region            VARCHAR(100) DEFAULT NULL,        -- e.g. 'Global', 'India' (present on some migrated rows)
  audience          VARCHAR(100) DEFAULT NULL,        -- e.g. 'kids', 'adults', 'all' (present on some migrated rows)
  age_group         VARCHAR(50)  DEFAULT NULL,        -- e.g. '0-12', '13-17', '18+' (present on some migrated rows)
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_catalog_category (category),
  FULLTEXT INDEX ft_catalog_search (title, description, tags)
) ENGINE=InnoDB;
