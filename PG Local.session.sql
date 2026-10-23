-- PixelForge: The Shared Sanctum
-- PostgreSQL schema for boards, canvas objects, collaboration, persistence and history.
-- Compatible with PostgreSQL 14+.
-- Run this entire file once against a fresh project database.
-- It creates schema objects but does not create a PostgreSQL role or database.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS pixelforge;
SET search_path TO pixelforge, public;

-- Enums
DO $$ BEGIN
  CREATE TYPE member_role AS ENUM ('owner', 'editor', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE canvas_object_type AS ENUM
    ('sticky_note', 'text', 'shape', 'freehand_stroke', 'image', 'group', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE revision_kind AS ENUM ('autosave', 'manual', 'restore', 'checkpoint');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE operation_kind AS ENUM
    ('create', 'update', 'delete', 'move', 'resize', 'reorder', 'clear', 'restore');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Application users. For guest-based access, display_name can be used without
-- requiring email/password authentication. Add auth tables/provider IDs later.
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name VARCHAR(80) NOT NULL,
  email VARCHAR(320) UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_display_name_not_blank CHECK (length(trim(display_name)) > 0)
);

CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL DEFAULT 'Untitled board',
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  -- Current schema version allows future serialization migrations.
  schema_version INTEGER NOT NULL DEFAULT 1 CHECK (schema_version > 0),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT boards_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT boards_settings_object CHECK (jsonb_typeof(settings) = 'object')
);

CREATE TABLE IF NOT EXISTS board_members (
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'editor',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ,
  PRIMARY KEY (board_id, user_id)
);

-- A canvas object is persisted in world coordinates. `data` holds Fabric-specific
-- serialized properties and custom PixelForge fields (stickyNoteData, brush data).
CREATE TABLE IF NOT EXISTS canvas_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  object_type canvas_object_type NOT NULL DEFAULT 'unknown',
  -- Stable client-generated ID makes upserts and collaboration operations safer.
  client_object_id TEXT,
  x DOUBLE PRECISION NOT NULL DEFAULT 0,
  y DOUBLE PRECISION NOT NULL DEFAULT 0,
  width DOUBLE PRECISION CHECK (width IS NULL OR width >= 0),
  height DOUBLE PRECISION CHECK (height IS NULL OR height >= 0),
  angle DOUBLE PRECISION NOT NULL DEFAULT 0,
  scale_x DOUBLE PRECISION NOT NULL DEFAULT 1 CHECK (scale_x > 0),
  scale_y DOUBLE PRECISION NOT NULL DEFAULT 1 CHECK (scale_y > 0),
  z_index INTEGER NOT NULL DEFAULT 0,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT canvas_objects_data_object CHECK (jsonb_typeof(data) = 'object'),
  CONSTRAINT canvas_objects_client_id_unique UNIQUE (board_id, client_object_id)
);

-- Append-only operation log. Store validated operations, not arbitrary executable data.
CREATE TABLE IF NOT EXISTS board_operations (
  id BIGSERIAL PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  client_operation_id TEXT,
  operation operation_kind NOT NULL,
  object_id UUID,
  base_revision BIGINT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT board_operations_payload_object CHECK (jsonb_typeof(payload) = 'object'),
  CONSTRAINT board_operations_client_id_unique UNIQUE (board_id, client_operation_id)
);

-- Revisions/snapshots for version history and restore.
CREATE TABLE IF NOT EXISTS board_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  revision_number BIGINT NOT NULL,
  kind revision_kind NOT NULL DEFAULT 'autosave',
  label VARCHAR(160),
  snapshot JSONB NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT board_revisions_snapshot_object CHECK (jsonb_typeof(snapshot) = 'object'),
  CONSTRAINT board_revisions_number_unique UNIQUE (board_id, revision_number)
);

-- Share links support guest collaboration. Store only a hash of the token in DB.
CREATE TABLE IF NOT EXISTS board_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  role member_role NOT NULL DEFAULT 'editor',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT board_share_links_role CHECK (role IN ('editor', 'viewer'))
);

-- Presence is ephemeral in a real-time system; this table is optional fallback
-- for debugging/last-seen state. Do not use it as the primary cursor transport.
CREATE TABLE IF NOT EXISTS board_presence (
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  cursor_x DOUBLE PRECISION,
  cursor_y DOUBLE PRECISION,
  cursor_color VARCHAR(32),
  display_name VARCHAR(80),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (board_id, session_id)
);

-- Uploaded image/media references. Store files in object storage or a file service,
-- not as large binary blobs in PostgreSQL. This table stores metadata and URL/key.
CREATE TABLE IF NOT EXISTS board_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  asset_type VARCHAR(40) NOT NULL DEFAULT 'image',
  storage_key TEXT NOT NULL,
  public_url TEXT,
  mime_type VARCHAR(120),
  byte_size BIGINT CHECK (byte_size IS NULL OR byte_size >= 0),
  width INTEGER CHECK (width IS NULL OR width >= 0),
  height INTEGER CHECK (height IS NULL OR height >= 0),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Common indexes for loading a board, members, history and activity.
CREATE INDEX IF NOT EXISTS idx_boards_owner_updated
  ON boards(owner_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_board_members_user
  ON board_members(user_id, joined_at DESC);
CREATE INDEX IF NOT EXISTS idx_canvas_objects_board_z
  ON canvas_objects(board_id, z_index)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_canvas_objects_board_updated
  ON canvas_objects(board_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_board_operations_board_created
  ON board_operations(board_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_board_revisions_board_created
  ON board_revisions(board_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_share_links_board
  ON board_share_links(board_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_presence_last_seen
  ON board_presence(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_board_assets_board
  ON board_assets(board_id, created_at DESC);

-- Keep updated timestamps and board activity current.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_boards_updated_at ON boards;
CREATE TRIGGER trg_boards_updated_at BEFORE UPDATE ON boards
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_canvas_objects_updated_at ON canvas_objects;
CREATE TRIGGER trg_canvas_objects_updated_at BEFORE UPDATE ON canvas_objects
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Board activity trigger. A separate board trigger keeps last_activity_at current
-- for object changes and operation appends.
CREATE OR REPLACE FUNCTION touch_board_activity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  target_board UUID;
BEGIN
  target_board := COALESCE(NEW.board_id, OLD.board_id);
  UPDATE boards SET last_activity_at = now(), updated_at = now()
    WHERE id = target_board;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_canvas_objects_board_activity ON canvas_objects;
CREATE TRIGGER trg_canvas_objects_board_activity
AFTER INSERT OR UPDATE OR DELETE ON canvas_objects
FOR EACH ROW EXECUTE FUNCTION touch_board_activity();

DROP TRIGGER IF EXISTS trg_board_operations_activity ON board_operations;
CREATE TRIGGER trg_board_operations_activity
AFTER INSERT ON board_operations
FOR EACH ROW EXECUTE FUNCTION touch_board_activity();

COMMIT;

-- ---------------------------------------------------------------------------
-- Example queries (run separately after creating a user and board).
-- ---------------------------------------------------------------------------
-- Create a guest/user:
-- INSERT INTO pixelforge.users (display_name) VALUES ('Aditya') RETURNING id;
--
-- Create a board (replace :owner_id with the UUID returned above):
-- INSERT INTO pixelforge.boards (name, owner_id)
-- VALUES ('My Shared Canvas', '00000000-0000-0000-0000-000000000000')
-- RETURNING id;
--
-- Add a member:
-- INSERT INTO pixelforge.board_members (board_id, user_id, role)
-- VALUES ('<board-uuid>', '<user-uuid>', 'editor');
--
-- Save a canvas object:
-- INSERT INTO pixelforge.canvas_objects
--   (board_id, object_type, client_object_id, x, y, width, height, data)
-- VALUES
--   ('<board-uuid>', 'sticky_note', 'client-object-1', -120, 250, 280, 200,
--    '{"type":"group","stickyNoteData":{"template":"sunny"},"objects":[]}'::jsonb)
-- ON CONFLICT (board_id, client_object_id)
-- DO UPDATE SET x=EXCLUDED.x, y=EXCLUDED.y, width=EXCLUDED.width,
--   height=EXCLUDED.height, data=EXCLUDED.data, deleted_at=NULL;
