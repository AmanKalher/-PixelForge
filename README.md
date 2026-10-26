# PixelForge Backend: The Shared Sanctum

Production-ready backend for **PixelForge**, a real-time collaborative infinite whiteboard.
Built with **Node.js + Express** and **Socket.IO**, backed by **PostgreSQL** (`pixelforge` schema).

---

## 🏗 System Architecture

```mermaid
graph TD
    ClientA[Frontend Client A (Fabric.js)] <-->|Socket.IO: Cursors, Operations, Sync| Gateway[Socket.IO Server]
    ClientB[Frontend Client B (Fabric.js)] <-->|Socket.IO: Cursors, Operations, Sync| Gateway
    ClientA -->|REST API: Boards, History, Assets| Express[Express REST API]
    ClientB -->|REST API: Boards, History, Assets| Express

    Gateway --> Presence[Presence & Room Handler]
    Gateway --> OpEngine[Operation Broadcast & Persistence]
    
    Express --> BoardCtrl[Board Controller]
    Express --> ObjCtrl[Object Controller]
    Express --> RevCtrl[Revision Controller]
    Express --> ShareCtrl[Share Controller]
    Express --> AssetCtrl[Asset Controller]

    OpEngine --> DB[(PostgreSQL 14+ / Memory Fallback)]
    BoardCtrl --> DB
    ObjCtrl --> DB
    RevCtrl --> DB
    ShareCtrl --> DB
    AssetCtrl --> DB
```

---

## 🌟 Key Responsibilities (Member 3: Collaboration & Backend)

1. **Real-time Collaboration (`Socket.IO`)**:
   - Multi-user board rooms (`boardId`).
   - Ultra-low latency cursor broadcasting (`cursor-move` / `cursor-update`).
   - Live canvas mutation operations (`create`, `update`, `delete`, `move`, `resize`, `reorder`).
   - Active collaborator presence synchronization (`join-board`, `leave-board`, `collaborators-update`).

2. **Persistence & REST APIs (`Express`)**:
   - Board CRUD and metadata management (`/api/boards`).
   - World-coordinate canvas object sync (`/api/boards/:id/objects`).
   - Revision history timelines and one-click snapshot restores (`/api/boards/:id/revisions`).
   - Shareable link token generation & resolution with guest roles (`/api/boards/:id/share`).
   - Media and image asset uploading (`/api/boards/:id/assets`).

3. **Database & Resilience (`PostgreSQL` + Fallback)**:
   - Full implementation of `database/PG Local.session.sql`.
   - Automated migration script (`npm run db:init`).
   - Resilient in-memory fallback store ensuring non-breaking operation even when PostgreSQL is not yet configured.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **PostgreSQL**: v14+ (optional, fallback in-memory store activates automatically if unavailable)

### 2. Installation
```bash
cd backend
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# PostgreSQL Connection
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=pixelforge
```

### 4. Database Initialization (Optional if using PostgreSQL)
Run the automated schema runner to create tables, indexes, and triggers:
```bash
npm run db:init
```

### 5. Running the Backend
```bash
# Production start
npm start

# Development mode with hot-reload
npm run dev
```

The server starts at `http://localhost:5000`.
Health check: `GET http://localhost:5000/api/health`.

---

## 📡 Socket.IO Real-Time Protocol

| Event (Client -> Server) | Payload | Description |
|---|---|---|
| `join-board` | `{ boardId, user: { name, color, id? } }` | Joins a board room and receives active collaborators. |
| `cursor-move` | `{ boardId, cursor: { x, y } }` | Streams local pointer coordinates in world units. |
| `user-update` | `{ boardId, name?, color? }` | Updates display name or cursor badge color. |
| `canvas-operation` | `{ boardId, operation: BoardOperationPayload }` | Broadcasts mutation (`create`, `update`, `delete`, `reorder`). |
| `sync-canvas` | `{ boardId, objects: CanvasObject[] }` | Full canvas state synchronization. |
| `create-revision` | `{ boardId, kind, label, snapshot }` | Creates a snapshot checkpoint. |
| `leave-board` | `{}` | Disconnects from current room. |

| Event (Server -> Client) | Payload | Description |
|---|---|---|
| `collaborators-update` | `Collaborator[]` | Full list of active participants with cursor positions. |
| `user-joined` | `Collaborator` | Emitted when a peer enters the room. |
| `user-left` | `{ collaboratorId }` | Emitted when a peer disconnects or leaves. |
| `cursor-update` | `{ collaboratorId, name, color, cursor }` | Real-time position update of a peer cursor. |
| `operation-broadcast` | `BoardOperationPayload` | Canvas mutation from remote collaborator. |
| `canvas-synced` | `{ objects, timestamp }` | Canvas state synchronized. |
| `revision-created` | `BoardRevision` | Notification of a new version snapshot. |

---

## 🔌 REST API Endpoints

### Boards
- `GET /api/boards` - List all active boards
- `POST /api/boards` - Create a new board
- `GET /api/boards/:id` - Get board details, canvas objects, and recent revisions
- `PATCH /api/boards/:id` - Update board name or settings
- `DELETE /api/boards/:id` - Archive board

### Canvas Objects
- `GET /api/boards/:boardId/objects` - Get all canvas objects for a board
- `POST /api/boards/:boardId/objects` - Upsert a single canvas object
- `POST /api/boards/:boardId/objects/sync` - Batch upsert canvas objects
- `DELETE /api/boards/:boardId/objects/:objectId` - Soft delete an object
- `DELETE /api/boards/:boardId/objects` - Clear all objects on canvas

### Revisions & Time-Travel
- `GET /api/boards/:boardId/revisions` - List revision snapshots
- `POST /api/boards/:boardId/revisions` - Create manual or autosave snapshot
- `GET /api/boards/:boardId/revisions/:revisionId` - Inspect a snapshot
- `POST /api/boards/:boardId/revisions/:revisionId/restore` - Restore board to a snapshot

### Share Links
- `POST /api/boards/:id/share` - Generate share link token
- `GET /api/share/:token` - Validate share token and retrieve board metadata

### Assets / Uploads
- `POST /api/boards/:id/assets/upload` - Upload image asset (`multipart/form-data`)
- `GET /api/boards/:id/assets` - List uploaded media for board

---

## 🧪 Testing

Run the automated collaboration test:
```bash
npm test
```
This tests:
1. REST API endpoints (`/api/health`, `/api/boards`, `/api/boards/:id/objects`).
2. Multiple concurrent Socket.IO clients connecting to the same room.
3. Live cursor coordinate broadcast between simulated users.
4. Mutation operation broadcasting and persistence.
