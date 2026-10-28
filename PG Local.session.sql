
-- =====================================================
-- PIXELFORGE: REVISED POSTGRESQL DATABASE
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. CANVAS ROOMS
-- One record for each collaborative canvas.

CREATE TABLE IF NOT EXISTS canvas_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    room_id VARCHAR(100) NOT NULL UNIQUE,

    room_name VARCHAR(200) NOT NULL DEFAULT 'Untitled Canvas',

    created_by VARCHAR(100),

    -- Complete Fabric.js canvas JSON.
    -- Supports different shape types without schema changes.
    canvas_data JSONB NOT NULL DEFAULT
        '{"objects": [], "version": "6"}'::JSONB,

    -- Latest encoded Yjs document state.
    yjs_state BYTEA,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canvas_rooms_updated
ON canvas_rooms (updated_at DESC);


-- 2. CANVAS OBJECTS
-- Optional object-level storage for querying individual objects.
-- All object types share the same table.

CREATE TABLE IF NOT EXISTS canvas_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    room_id UUID NOT NULL
        REFERENCES canvas_rooms(id) ON DELETE CASCADE,

    object_id VARCHAR(150) NOT NULL,

    object_type VARCHAR(50) NOT NULL,

    -- Coordinates, dimensions, color, points, text, etc.
    properties JSONB NOT NULL DEFAULT '{}'::JSONB,

    created_by VARCHAR(100),

    updated_by VARCHAR(100),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- An object ID must be unique within its canvas.
    UNIQUE (room_id, object_id)
);

CREATE INDEX IF NOT EXISTS idx_canvas_objects_room
ON canvas_objects (room_id);

CREATE INDEX IF NOT EXISTS idx_canvas_objects_type
ON canvas_objects (room_id, object_type);

CREATE INDEX IF NOT EXISTS idx_canvas_objects_properties
ON canvas_objects USING GIN (properties);


-- 3. CANVAS REVISIONS
-- Stores snapshots for history and restoration.

CREATE TABLE IF NOT EXISTS canvas_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    room_id UUID NOT NULL
        REFERENCES canvas_rooms(id) ON DELETE CASCADE,

    revision_number BIGINT NOT NULL,

    created_by VARCHAR(100),

    revision_note TEXT,

    -- Snapshot of the complete canvas at this revision.
    snapshot JSONB NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (room_id, revision_number)
);

CREATE INDEX IF NOT EXISTS idx_canvas_revisions_history
ON canvas_revisions (room_id, created_at DESC);


-- 4. YJS UPDATE LOG
-- Append-only storage for encoded collaboration updates.
-- The application/Yjs layer is responsible for merging them.

CREATE TABLE IF NOT EXISTS canvas_yjs_updates (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    room_id UUID NOT NULL
        REFERENCES canvas_rooms(id) ON DELETE CASCADE,

    update_data BYTEA NOT NULL,

    client_id VARCHAR(150),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canvas_yjs_updates_room
ON canvas_yjs_updates (room_id, id);


-- 5. OPTIONAL: CANVAS MEMBERS
-- Basic room membership records.
-- Authentication and authorization are enforced by the backend.

CREATE TABLE IF NOT EXISTS canvas_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    room_id UUID NOT NULL
        REFERENCES canvas_rooms(id) ON DELETE CASCADE,

    user_id VARCHAR(150) NOT NULL,

    display_name VARCHAR(100),

    role VARCHAR(20) NOT NULL DEFAULT 'editor'
        CHECK (role IN ('owner', 'editor', 'viewer')),

    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (room_id, user_id)
);


-- 6. AUTOMATIC updated_at TRIGGER

CREATE OR REPLACE FUNCTION update_canvas_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_canvas_rooms_updated
ON canvas_rooms;

CREATE TRIGGER trg_canvas_rooms_updated
BEFORE UPDATE ON canvas_rooms
FOR EACH ROW
EXECUTE FUNCTION update_canvas_timestamp();

DROP TRIGGER IF EXISTS trg_canvas_objects_updated
ON canvas_objects;

CREATE TRIGGER trg_canvas_objects_updated
BEFORE UPDATE ON canvas_objects
FOR EACH ROW
EXECUTE FUNCTION update_canvas_timestamp();
