-- Migration: 0001_initial_schema.sql
-- Description: Baseline schema for BappaMap Mumbai with PostGIS support
-- Target DB: PostgreSQL 15+ with PostGIS 3.3+

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Create mandals table
CREATE TABLE IF NOT EXISTS mandals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    name_en VARCHAR(255) NOT NULL,
    name_mr VARCHAR(255) NOT NULL,
    locality_en VARCHAR(100) NOT NULL,
    locality_mr VARCHAR(100) NOT NULL,
    bmc_ward VARCHAR(10) NOT NULL,
    founded_year SMALLINT CHECK (founded_year BETWEEN 1800 AND 2100),
    location GEOGRAPHY(Point, 4326) NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    google_place_id VARCHAR(255),
    description_en TEXT,
    description_mr TEXT,
    current_crowd_level VARCHAR(20) DEFAULT 'moderate' 
        CHECK (current_crowd_level IN ('low', 'moderate', 'heavy', 'very_heavy')),
    avg_rating NUMERIC(3, 2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Create mandal_attributes table (Extensible attributes)
CREATE TABLE IF NOT EXISTS mandal_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mandal_id UUID NOT NULL REFERENCES mandals(id) ON DELETE CASCADE,
    attribute_key VARCHAR(50) NOT NULL,
    attribute_value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_mandal_attribute UNIQUE (mandal_id, attribute_key)
);

-- 3. Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mandal_id UUID NOT NULL REFERENCES mandals(id) ON DELETE CASCADE,
    author_display_name VARCHAR(100) DEFAULT 'Devotee' NOT NULL,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    crowd_observation VARCHAR(20) 
        CHECK (crowd_observation IN ('low', 'moderate', 'heavy', 'very_heavy')),
    comment TEXT CHECK (char_length(comment) <= 1000),
    moderation_status VARCHAR(20) DEFAULT 'pending' NOT NULL
        CHECK (moderation_status IN ('pending', 'published', 'flagged', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Create photos table
CREATE TABLE IF NOT EXISTS photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mandal_id UUID NOT NULL REFERENCES mandals(id) ON DELETE CASCADE,
    r2_key VARCHAR(255) NOT NULL UNIQUE,
    public_url VARCHAR(500) NOT NULL,
    caption VARCHAR(255),
    contributor_name VARCHAR(100) DEFAULT 'Devotee' NOT NULL,
    moderation_status VARCHAR(20) DEFAULT 'pending' NOT NULL
        CHECK (moderation_status IN ('pending', 'published', 'flagged', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Create crowd_reports table (Sliding-window crowd updates)
CREATE TABLE IF NOT EXISTS crowd_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mandal_id UUID NOT NULL REFERENCES mandals(id) ON DELETE CASCADE,
    crowd_level VARCHAR(20) NOT NULL
        CHECK (crowd_level IN ('low', 'moderate', 'heavy', 'very_heavy')),
    ip_hash VARCHAR(64) NOT NULL,
    reported_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Create submissions table (Quarantine inbox for new mandals & edits)
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_type VARCHAR(50) NOT NULL 
        CHECK (submission_type IN ('new_mandal', 'edit_mandal', 'crowd_update')),
    payload JSONB NOT NULL,
    ip_hash VARCHAR(64) NOT NULL,
    moderation_status VARCHAR(20) DEFAULT 'pending' NOT NULL
        CHECK (moderation_status IN ('pending', 'published', 'flagged', 'rejected')),
    reviewer_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    reviewed_at TIMESTAMPTZ
);

-- Performance and spatial indexes
CREATE INDEX IF NOT EXISTS idx_mandals_location ON mandals USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_mandals_slug ON mandals (slug);
CREATE INDEX IF NOT EXISTS idx_mandals_status ON mandals (is_active, current_crowd_level);
CREATE INDEX IF NOT EXISTS idx_mandals_metadata_gin ON mandals USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_reviews_mandal_status ON reviews (mandal_id, moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_mandal_status ON photos (mandal_id, moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crowd_reports_window ON crowd_reports (mandal_id, reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions (moderation_status, created_at DESC);
