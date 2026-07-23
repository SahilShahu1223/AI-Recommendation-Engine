-- =====================================================================
-- Smart Recommend AI — Database Schema
-- PostgreSQL 14+ (Neon / Supabase compatible)
-- =====================================================================

-- Drop tables in dependency order
DROP TABLE IF EXISTS recommendation_results CASCADE;
DROP TABLE IF EXISTS saved_recommendations CASCADE;
DROP TABLE IF EXISTS wishlist CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS credit_transactions CASCADE;
DROP TABLE IF EXISTS search_history CASCADE;
DROP TABLE IF EXISTS travel_history CASCADE;
DROP TABLE IF EXISTS recommendation_requests CASCADE;
DROP TABLE IF EXISTS kids_activities CASCADE;
DROP TABLE IF EXISTS kids_catalog_items CASCADE;
DROP TABLE IF EXISTS catalog_items CASCADE;
DROP TABLE IF EXISTS destinations CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ---------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id                     BIGSERIAL PRIMARY KEY,
  first_name             VARCHAR(100)      NOT NULL,
  last_name              VARCHAR(100)      NOT NULL,
  email                  VARCHAR(255)      NOT NULL UNIQUE,
  password_hash          VARCHAR(255)      NOT NULL,
  date_of_birth          DATE              NOT NULL,
  gender                 VARCHAR(32)       NOT NULL DEFAULT 'prefer_not_to_say'
    CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  country                VARCHAR(100)      NOT NULL,
  preferred_travel_style VARCHAR(32)       NOT NULL DEFAULT 'comfort'
    CHECK (preferred_travel_style IN ('budget', 'comfort', 'luxury', 'adventure', 'family', 'solo', 'backpacker')),
  credits                INTEGER           NOT NULL DEFAULT 5 CHECK (credits >= 0),
  plan                   VARCHAR(16)       NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'pro')),
  cancel_at_period_end   BOOLEAN           NOT NULL DEFAULT FALSE,
  current_period_end     DATE              DEFAULT NULL,
  avatar_url             VARCHAR(500)      DEFAULT NULL,
  bio                    VARCHAR(500)      DEFAULT NULL,
  is_active              BOOLEAN           NOT NULL DEFAULT TRUE,
  created_at             TIMESTAMPTZ       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMPTZ       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_country ON users (country);

-- ---------------------------------------------------------------------
-- REFRESH TOKENS / SESSIONS
-- ---------------------------------------------------------------------
CREATE TABLE sessions (
  id             BIGSERIAL PRIMARY KEY,
  user_id        BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token  VARCHAR(500) NOT NULL,
  user_agent     VARCHAR(255) DEFAULT NULL,
  ip_address     VARCHAR(64)  DEFAULT NULL,
  expires_at     TIMESTAMPTZ  NOT NULL,
  revoked        BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON sessions (user_id);
CREATE INDEX idx_sessions_token ON sessions (refresh_token);

-- ---------------------------------------------------------------------
-- DESTINATIONS
-- ---------------------------------------------------------------------
CREATE TABLE destinations (
  id                   BIGSERIAL PRIMARY KEY,
  name                 VARCHAR(150)  NOT NULL,
  country              VARCHAR(100)  NOT NULL,
  region               VARCHAR(100)  DEFAULT NULL,
  type                 VARCHAR(32)   NOT NULL CHECK (type IN ('domestic', 'international')),
  category             TEXT          DEFAULT NULL,
  best_season          TEXT          DEFAULT 'all_year',
  avg_cost_per_day_usd DECIMAL(10,2) DEFAULT NULL,
  budget_tier          VARCHAR(16)   DEFAULT 'medium'
    CHECK (budget_tier IN ('low', 'medium', 'high', 'luxury')),
  min_age_recommended  INTEGER       DEFAULT 0 CHECK (min_age_recommended >= 0),
  kid_friendly         BOOLEAN       NOT NULL DEFAULT FALSE,
  description          TEXT,
  image_url            VARCHAR(500)  DEFAULT NULL,
  popularity_score     DECIMAL(4,2)  DEFAULT 0,
  avg_rating           DECIMAL(3,2)  DEFAULT 0,
  rating_count         INTEGER       DEFAULT 0 CHECK (rating_count >= 0),
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dest_country ON destinations (country);
CREATE INDEX idx_dest_type ON destinations (type);
CREATE INDEX idx_dest_kid ON destinations (kid_friendly);

-- ---------------------------------------------------------------------
-- KIDS ACTIVITIES
-- ---------------------------------------------------------------------
CREATE TABLE kids_activities (
  id              BIGSERIAL PRIMARY KEY,
  destination_id  BIGINT       NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  title           VARCHAR(150) NOT NULL,
  activity_type   VARCHAR(32)  NOT NULL
    CHECK (activity_type IN ('theme_park', 'educational', 'wildlife', 'beach', 'adventure_mild', 'museum', 'water_park')),
  min_age         INTEGER      DEFAULT 0 CHECK (min_age >= 0),
  max_age         INTEGER      DEFAULT 17 CHECK (max_age >= 0),
  safety_notes    VARCHAR(500) DEFAULT NULL,
  description     TEXT,
  image_url       VARCHAR(500) DEFAULT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kids_dest ON kids_activities (destination_id);
CREATE INDEX idx_kids_age ON kids_activities (min_age, max_age);

-- ---------------------------------------------------------------------
-- TRAVEL HISTORY
-- ---------------------------------------------------------------------
CREATE TABLE travel_history (
  id               BIGSERIAL PRIMARY KEY,
  user_id          BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  destination_id   BIGINT       REFERENCES destinations(id) ON DELETE SET NULL,
  destination_name VARCHAR(150) NOT NULL,
  visited_on       DATE         DEFAULT NULL,
  notes            VARCHAR(500) DEFAULT NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hist_user ON travel_history (user_id);

-- ---------------------------------------------------------------------
-- RECOMMENDATION REQUESTS
-- ---------------------------------------------------------------------
CREATE TABLE recommendation_requests (
  id                  BIGSERIAL PRIMARY KEY,
  user_id             BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interests           VARCHAR(500) DEFAULT NULL,
  purpose             VARCHAR(255) DEFAULT NULL,
  budget_usd          DECIMAL(10,2) DEFAULT NULL,
  location_preference VARCHAR(150) DEFAULT NULL,
  travel_style        VARCHAR(50)  DEFAULT NULL,
  season              VARCHAR(50)  DEFAULT NULL,
  result_count        INTEGER      DEFAULT 0 CHECK (result_count >= 0),
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reqs_user ON recommendation_requests (user_id);

-- ---------------------------------------------------------------------
-- RECOMMENDATION RESULTS
-- ---------------------------------------------------------------------
CREATE TABLE recommendation_results (
  id             BIGSERIAL PRIMARY KEY,
  request_id     BIGINT       NOT NULL REFERENCES recommendation_requests(id) ON DELETE CASCADE,
  destination_id BIGINT       NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  score          DECIMAL(6,3) NOT NULL,
  reason         VARCHAR(500) DEFAULT NULL,
  rank_position  INTEGER      DEFAULT 0 CHECK (rank_position >= 0)
);

CREATE INDEX idx_results_req ON recommendation_results (request_id);

-- ---------------------------------------------------------------------
-- WISHLIST
-- ---------------------------------------------------------------------
CREATE TABLE wishlist (
  id             BIGSERIAL PRIMARY KEY,
  user_id        BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  destination_id BIGINT      NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  added_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, destination_id)
);

-- ---------------------------------------------------------------------
-- SAVED RECOMMENDATIONS
-- ---------------------------------------------------------------------
CREATE TABLE saved_recommendations (
  id             BIGSERIAL PRIMARY KEY,
  user_id        BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  destination_id BIGINT      NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  request_id     BIGINT      REFERENCES recommendation_requests(id) ON DELETE SET NULL,
  saved_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, destination_id)
);

-- ---------------------------------------------------------------------
-- REVIEWS & RATINGS
-- ---------------------------------------------------------------------
CREATE TABLE reviews (
  id             BIGSERIAL PRIMARY KEY,
  user_id        BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  destination_id BIGINT       NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  rating         DECIMAL(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title          VARCHAR(150) DEFAULT NULL,
  body           TEXT,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, destination_id)
);

CREATE INDEX idx_reviews_dest ON reviews (destination_id);

-- ---------------------------------------------------------------------
-- SEARCH HISTORY
-- ---------------------------------------------------------------------
CREATE TABLE search_history (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query      VARCHAR(255) NOT NULL,
  filters    JSONB        DEFAULT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_search_user ON search_history (user_id);

-- ---------------------------------------------------------------------
-- CREDIT TRANSACTIONS
-- ---------------------------------------------------------------------
CREATE TABLE credit_transactions (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount        INTEGER      NOT NULL,
  reason        VARCHAR(255) NOT NULL,
  balance_after INTEGER      NOT NULL CHECK (balance_after >= 0),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_credit_user ON credit_transactions (user_id);

-- ---------------------------------------------------------------------
-- KIDS CATALOG ITEMS
-- ---------------------------------------------------------------------
CREATE TABLE kids_catalog_items (
  id               BIGSERIAL PRIMARY KEY,
  category         VARCHAR(32)   NOT NULL
    CHECK (category IN ('movies', 'books', 'career', 'electronics', 'courses', 'fashion', 'restaurants', 'games', 'music')),
  title            VARCHAR(200)  NOT NULL,
  description      TEXT          NOT NULL,
  tags             VARCHAR(300)  DEFAULT NULL,
  price_label      VARCHAR(100)  DEFAULT NULL,
  price_usd        DECIMAL(10,2) DEFAULT NULL,
  budget_tier      VARCHAR(16)   DEFAULT 'medium'
    CHECK (budget_tier IN ('low', 'medium', 'high', 'luxury')),
  pros             JSONB         DEFAULT NULL,
  cons             JSONB         DEFAULT NULL,
  emoji            VARCHAR(32)   DEFAULT NULL,
  popularity_score DECIMAL(4,2)  DEFAULT 0,
  avg_rating       DECIMAL(3,2)  DEFAULT 0,
  rating_count     INTEGER       DEFAULT 0 CHECK (rating_count >= 0),
  region           VARCHAR(100)  DEFAULT NULL,
  age_group        VARCHAR(50)   DEFAULT NULL,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kids_catalog_category ON kids_catalog_items (category);

-- ---------------------------------------------------------------------
-- CATALOG ITEMS
-- ---------------------------------------------------------------------
CREATE TABLE catalog_items (
  id               BIGSERIAL PRIMARY KEY,
  category         VARCHAR(32)   NOT NULL
    CHECK (category IN ('movies', 'books', 'career', 'electronics', 'courses', 'fashion', 'restaurants', 'games', 'music')),
  title            VARCHAR(200)  NOT NULL,
  description      TEXT          NOT NULL,
  tags             VARCHAR(300)  DEFAULT NULL,
  price_label      VARCHAR(100)  DEFAULT NULL,
  price_usd        DECIMAL(10,2) DEFAULT NULL,
  budget_tier      VARCHAR(16)   DEFAULT 'medium'
    CHECK (budget_tier IN ('low', 'medium', 'high', 'luxury')),
  pros             JSONB         DEFAULT NULL,
  cons             JSONB         DEFAULT NULL,
  emoji            VARCHAR(32)   DEFAULT NULL,
  popularity_score DECIMAL(4,2)  DEFAULT 0,
  avg_rating       DECIMAL(3,2)  DEFAULT 0,
  rating_count     INTEGER       DEFAULT 0 CHECK (rating_count >= 0),
  region           VARCHAR(100)  DEFAULT NULL,
  audience         VARCHAR(100)  DEFAULT NULL,
  age_group        VARCHAR(50)   DEFAULT NULL,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_catalog_category ON catalog_items (category);

-- ---------------------------------------------------------------------
-- updated_at trigger for users
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
