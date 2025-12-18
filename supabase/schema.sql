-- Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- DESIGNERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS designers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  avatar VARCHAR(10),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BRANDS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7) NOT NULL, -- hex color code
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PROVIDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ASSETS TABLE (Missing Assets)
-- =============================================
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_name VARCHAR(255) NOT NULL,
  provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'not-started' CHECK (status IN ('not-started', 'ongoing', 'completed', 'exported', 'uploaded')),
  designer_id UUID REFERENCES designers(id) ON DELETE SET NULL,
  found_by VARCHAR(255) NOT NULL,
  date_found DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ASSET_BRANDS TABLE (Many-to-Many with extra fields)
-- =============================================
CREATE TABLE IF NOT EXISTS asset_brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  reflected BOOLEAN DEFAULT FALSE,
  reflected_by VARCHAR(255),
  reflected_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(asset_id, brand_id)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_provider ON assets(provider_id);
CREATE INDEX IF NOT EXISTS idx_assets_designer ON assets(designer_id);
CREATE INDEX IF NOT EXISTS idx_asset_brands_asset ON asset_brands(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_brands_brand ON asset_brands(brand_id);

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_designers_updated_at
  BEFORE UPDATE ON designers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE designers ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_brands ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Allow all for authenticated users" ON designers FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON brands FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON providers FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON assets FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON asset_brands FOR ALL USING (true);

-- =============================================
-- SEED DATA (Optional - matches mockData)
-- =============================================

-- Insert Designers
INSERT INTO designers (id, name, avatar, email) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Alex Chen', 'AC', 'alex@company.com'),
  ('d1000000-0000-0000-0000-000000000002', 'Sarah Miller', 'SM', 'sarah@company.com'),
  ('d1000000-0000-0000-0000-000000000003', 'James Wilson', 'JW', 'james@company.com'),
  ('d1000000-0000-0000-0000-000000000004', 'Emma Davis', 'ED', 'emma@company.com')
ON CONFLICT DO NOTHING;

-- Insert Brands
INSERT INTO brands (id, name, color) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Casino Royal', '#6366f1'),
  ('b1000000-0000-0000-0000-000000000002', 'Lucky Spin', '#22c55e'),
  ('b1000000-0000-0000-0000-000000000003', 'Vegas Stars', '#f59e0b'),
  ('b1000000-0000-0000-0000-000000000004', 'Jackpot City', '#ec4899'),
  ('b1000000-0000-0000-0000-000000000005', 'Golden Palace', '#8b5cf6')
ON CONFLICT DO NOTHING;

-- Insert Providers
INSERT INTO providers (id, name) VALUES
  ('p1000000-0000-0000-0000-000000000001', 'Pragmatic Play'),
  ('p1000000-0000-0000-0000-000000000002', 'NetEnt'),
  ('p1000000-0000-0000-0000-000000000003', 'Microgaming'),
  ('p1000000-0000-0000-0000-000000000004', 'Evolution Gaming'),
  ('p1000000-0000-0000-0000-000000000005', 'Play''n GO'),
  ('p1000000-0000-0000-0000-000000000006', 'Yggdrasil'),
  ('p1000000-0000-0000-0000-000000000007', 'Red Tiger'),
  ('p1000000-0000-0000-0000-000000000008', 'Big Time Gaming')
ON CONFLICT DO NOTHING;

-- Insert Assets
INSERT INTO assets (id, game_name, provider_id, status, designer_id, found_by, date_found, notes, created_at, updated_at) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Sweet Bonanza', 'p1000000-0000-0000-0000-000000000001', 'ongoing', 'd1000000-0000-0000-0000-000000000001', 'Alex Chen', '2024-01-10', 'High priority - promotional material needed', '2024-01-10T10:00:00Z', '2024-01-12T14:30:00Z'),
  ('a1000000-0000-0000-0000-000000000002', 'Starburst XXXtreme', 'p1000000-0000-0000-0000-000000000002', 'completed', 'd1000000-0000-0000-0000-000000000002', 'Sarah Miller', '2024-01-08', 'All formats completed', '2024-01-08T09:00:00Z', '2024-01-14T16:00:00Z'),
  ('a1000000-0000-0000-0000-000000000003', 'Book of Dead', 'p1000000-0000-0000-0000-000000000005', 'not-started', NULL, 'James Wilson', '2024-01-12', 'Waiting for provider assets', '2024-01-12T11:00:00Z', '2024-01-12T11:00:00Z'),
  ('a1000000-0000-0000-0000-000000000004', 'Gates of Olympus', 'p1000000-0000-0000-0000-000000000001', 'exported', 'd1000000-0000-0000-0000-000000000003', 'Emma Davis', '2024-01-05', 'Exported to all formats, pending upload', '2024-01-05T08:00:00Z', '2024-01-13T10:00:00Z'),
  ('a1000000-0000-0000-0000-000000000005', 'Crazy Time', 'p1000000-0000-0000-0000-000000000004', 'uploaded', 'd1000000-0000-0000-0000-000000000004', 'Alex Chen', '2024-01-03', 'Live game assets - all complete', '2024-01-03T14:00:00Z', '2024-01-11T17:00:00Z'),
  ('a1000000-0000-0000-0000-000000000006', 'Mega Moolah', 'p1000000-0000-0000-0000-000000000003', 'ongoing', 'd1000000-0000-0000-0000-000000000001', 'Sarah Miller', '2024-01-14', 'Progressive jackpot - high priority', '2024-01-14T09:30:00Z', '2024-01-15T11:00:00Z'),
  ('a1000000-0000-0000-0000-000000000007', 'Vikings Go Berzerk', 'p1000000-0000-0000-0000-000000000006', 'not-started', NULL, 'James Wilson', '2024-01-15', '', '2024-01-15T10:00:00Z', '2024-01-15T10:00:00Z'),
  ('a1000000-0000-0000-0000-000000000008', 'Gonzo''s Quest Megaways', 'p1000000-0000-0000-0000-000000000007', 'completed', 'd1000000-0000-0000-0000-000000000002', 'Emma Davis', '2024-01-07', 'Megaways version assets', '2024-01-07T15:00:00Z', '2024-01-14T13:00:00Z')
ON CONFLICT DO NOTHING;

-- Insert Asset-Brand relationships
INSERT INTO asset_brands (asset_id, brand_id, reflected, reflected_by, reflected_at) VALUES
  -- Sweet Bonanza
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', TRUE, 'Alex Chen', '2024-01-15'),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', FALSE, NULL, NULL),
  -- Starburst XXXtreme
  ('a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', TRUE, 'Sarah Miller', '2024-01-14'),
  ('a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004', TRUE, 'Sarah Miller', '2024-01-14'),
  -- Book of Dead
  ('a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', FALSE, NULL, NULL),
  ('a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000005', FALSE, NULL, NULL),
  -- Gates of Olympus
  ('a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000002', TRUE, 'James Wilson', '2024-01-13'),
  ('a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000003', TRUE, 'James Wilson', '2024-01-13'),
  ('a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000004', FALSE, NULL, NULL),
  -- Crazy Time
  ('a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', TRUE, 'Emma Davis', '2024-01-11'),
  ('a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000002', TRUE, 'Emma Davis', '2024-01-11'),
  ('a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000005', TRUE, 'Emma Davis', '2024-01-11'),
  -- Mega Moolah
  ('a1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000004', FALSE, NULL, NULL),
  -- Vikings Go Berzerk
  ('a1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000001', FALSE, NULL, NULL),
  ('a1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000003', FALSE, NULL, NULL),
  -- Gonzo's Quest Megaways
  ('a1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000002', TRUE, 'Alex Chen', '2024-01-14'),
  ('a1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000005', FALSE, NULL, NULL)
ON CONFLICT DO NOTHING;
