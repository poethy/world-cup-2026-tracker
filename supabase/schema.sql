-- World Cup 2026 Tracker - Database Schema
-- Run this in the Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== STICKERS TABLE =====
-- Public sticker catalog (open-source data)
CREATE TABLE IF NOT EXISTS stickers (
  id         SERIAL PRIMARY KEY,
  number     INTEGER NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  country    TEXT NOT NULL,
  country_code TEXT NOT NULL,
  page_number  INTEGER NOT NULL,
  position_in_page INTEGER NOT NULL,
  section_type TEXT NOT NULL DEFAULT 'regular',
  image_url  TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_stickers_country_code ON stickers(country_code);
CREATE INDEX IF NOT EXISTS idx_stickers_page_number ON stickers(page_number);
CREATE INDEX IF NOT EXISTS idx_stickers_section_type ON stickers(section_type);

-- ===== USER_STICKERS TABLE =====
-- Per-user collection tracking
CREATE TABLE IF NOT EXISTS user_stickers (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sticker_id INTEGER NOT NULL REFERENCES stickers(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'have',   -- 'have' | 'duplicate'
  marked_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, sticker_id)
);

-- Index for user collection queries
CREATE INDEX IF NOT EXISTS idx_user_stickers_user_id ON user_stickers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stickers_sticker_id ON user_stickers(sticker_id);

-- ===== ROW LEVEL SECURITY =====
-- Stickers are public (read-only for everyone)
ALTER TABLE stickers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stickers are publicly readable" ON stickers
  FOR SELECT USING (true);

-- User stickers are private (only owner can access)
ALTER TABLE user_stickers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own stickers" ON user_stickers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stickers" ON user_stickers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stickers" ON user_stickers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stickers" ON user_stickers
  FOR DELETE USING (auth.uid() = user_id);

-- ===== USER_PROFILES TABLE =====
-- Stores per-user preferences (album version, etc.)
-- Run this separately if the table doesn't exist yet:
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  album_version TEXT CHECK (album_version IN ('v1', 'v2', 'v3', 'v4')),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ===== UPDATED_AT TRIGGER =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_stickers_updated_at
  BEFORE UPDATE ON user_stickers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
