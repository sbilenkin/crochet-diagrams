# Crochet Diagram Builder — Implementation Plan

## Project Overview

A web application that lets users visually build crochet diagrams by dragging and dropping universal crochet symbols onto a freeform canvas. Symbols snap/connect to each other (e.g., attaching a double crochet to a magic ring). Users can save diagrams as projects, reload them, and edit them later.

**Existing stack:**
- **Frontend:** React (separate `frontend/` directory, runs via dev server)
- **Backend:** Python FastAPI (separate `backend/` directory)
- **Database:** PostgreSQL in Docker
- **Infrastructure:** `docker-compose.yml` starts Postgres + backend server
- **Current state:** User auth is implemented (signup/login endpoints, users table)

---

## Architecture Decisions

### Canvas Technology
Use **HTML5 Canvas** via the **Konva.js** library (`react-konva` for React bindings). Konva provides built-in support for dragging, hit detection, layering, and event handling — all critical for this app. Do NOT use raw SVG or plain HTML drag-and-drop; they become slow with many elements.

### Symbol Format
Each crochet symbol should be stored as an **SVG path/image** and rendered onto the Konva canvas as a `Konva.Image` or `Konva.Group`. Keep a registry of all supported symbols in a shared config file so both the palette UI and canvas renderer reference the same source of truth.

### Connection/Snap System
Symbols have **anchor points** — predefined attachment positions (top, bottom, left, right, or stitch-specific points). When a user drags a symbol near another symbol's anchor, it snaps into place. Connections are stored as edges in a graph structure: `{ fromSymbolId, fromAnchor, toSymbolId, toAnchor }`.

### State Management
Use **Zustand** (lightweight) or React Context + `useReducer` for canvas state. The state must be serializable to JSON for saving/loading. Avoid keeping canvas state only inside Konva — maintain a parallel data model.

---

## Data Model

### Existing Table
```
users
├── id (UUID, PK)
├── email (VARCHAR, UNIQUE)
├── password_hash (VARCHAR)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### New Tables

```
projects
├── id (UUID, PK)
├── user_id (UUID, FK → users.id, ON DELETE CASCADE)
├── name (VARCHAR, NOT NULL)
├── description (TEXT, nullable)
├── thumbnail (TEXT, nullable)         -- base64 or URL of a small preview image
├── created_at (TIMESTAMP, DEFAULT NOW)
└── updated_at (TIMESTAMP, DEFAULT NOW)

project_data
├── id (UUID, PK)
├── project_id (UUID, FK → projects.id, ON DELETE CASCADE, UNIQUE)
└── canvas_json (JSONB, NOT NULL)      -- full serialized canvas state
```

**Why separate `project_data`?** Listing projects (name, thumbnail, date) should be fast and not require loading the full canvas blob. The `canvas_json` column can be large.

### canvas_json Schema

The `canvas_json` JSONB column stores the full diagram state:

```json
{
  "version": 1,
  "canvas": {
    "width": 2000,
    "height": 2000,
    "zoom": 1.0,
    "offsetX": 0,
    "offsetY": 0
  },
  "symbols": [
    {
      "id": "sym_uuid_1",
      "type": "magic_ring",
      "x": 400,
      "y": 300,
      "rotation": 0,
      "anchors": {
        "top": { "connectedTo": null },
        "slot_1": { "connectedTo": "sym_uuid_2:bottom" },
        "slot_2": { "connectedTo": "sym_uuid_3:bottom" }
      }
    },
    {
      "id": "sym_uuid_2",
      "type": "double_crochet",
      "x": 400,
      "y": 240,
      "rotation": 0,
      "anchors": {
        "bottom": { "connectedTo": "sym_uuid_1:slot_1" },
        "top": { "connectedTo": null }
      }
    }
  ],
  "connections": [
    {
      "from": { "symbolId": "sym_uuid_1", "anchor": "slot_1" },
      "to": { "symbolId": "sym_uuid_2", "anchor": "bottom" }
    }
  ]
}
```

---

## Crochet Symbol Registry

Create a file at `frontend/src/config/crochetSymbols.ts` that defines all supported symbols. Start with these standard symbols:

| Symbol Key        | Display Name     | Description                            | Anchor Points                     |
|-------------------|------------------|----------------------------------------|-----------------------------------|
| `chain`           | Chain (ch)       | Basic chain stitch                     | left, right                       |
| `slip_stitch`     | Slip Stitch (sl st) | Joining stitch                      | bottom, top                       |
| `single_crochet`  | Single Crochet (sc) | Short stitch                        | bottom, top                       |
| `half_double`     | Half Double (hdc)| Medium-height stitch                   | bottom, top                       |
| `double_crochet`  | Double Crochet (dc) | Tall stitch                         | bottom, top                       |
| `treble_crochet`  | Treble Crochet (tr) | Very tall stitch                    | bottom, top                       |
| `magic_ring`      | Magic Ring       | Adjustable starting ring               | slot_1 through slot_12 (radial)   |
| `increase`        | Increase (inc)   | Two stitches in one                    | bottom, top_left, top_right       |
| `decrease`        | Decrease (dec)   | Two stitches merged into one           | bottom_left, bottom_right, top    |

Each entry should include:
- `key` — unique identifier
- `displayName` — shown in the palette UI
- `svgPath` — path to the SVG asset in `frontend/src/assets/symbols/`
- `anchors` — array of `{ name, offsetX, offsetY }` relative to the symbol's center
- `width` / `height` — default dimensions on the canvas
- `category` — for grouping in the palette (e.g., "basic", "advanced", "structural")

**SVG assets:** Place actual crochet symbol SVGs in `frontend/src/assets/symbols/`. Use standard crochet diagram notation. These can initially be simple geometric representations and refined later.

---

## Implementation Phases

Work through these phases in order. Each phase should result in working, testable functionality.

---

### Phase 0: Convert Frontend to TypeScript

**Goal:** Migrate the existing JavaScript/JSX frontend to TypeScript before building any new features. The codebase is small, so do this all at once.

#### Tasks

1. **Install TypeScript and type dependencies:**
   ```
   npm install --save-dev typescript @types/react @types/react-dom @types/node
   ```

2. **Add `tsconfig.json`** to the `frontend/` root with strict mode enabled. Use the standard React + Vite (or CRA) TypeScript config as a base. Key settings:
   - `"strict": true`
   - `"jsx": "react-jsx"`
   - `"moduleResolution": "bundler"` (for Vite) or `"node"` (for CRA)
   - `"include": ["src"]`

3. **Rename all existing `.js` / `.jsx` files** to `.ts` / `.tsx` (use `.tsx` for any file containing JSX).

4. **Add type annotations to existing code:**
   - Type all component props (use `interface` for props objects)
   - Type state variables (useState, useReducer)
   - Type API response data
   - Type event handlers
   - For the existing auth system: type the user object, login/signup request and response shapes, and any auth context or token storage

5. **Fix any type errors** that surface. Common issues in small React apps:
   - Implicit `any` on event handlers → add `React.ChangeEvent<HTMLInputElement>`, `React.FormEvent`, etc.
   - Missing return types on utility functions
   - `null` vs `undefined` in optional values

6. **Verify the app builds and runs** with no TypeScript errors before moving on.

#### Acceptance Criteria
- [ ] All `.js` / `.jsx` files are renamed to `.ts` / `.tsx`
- [ ] `tsconfig.json` exists with strict mode
- [ ] `npm run build` (or equivalent) succeeds with zero type errors
- [ ] App runs in dev server and existing login/signup functionality works exactly as before

---

### Phase 1: Canvas with Drag-and-Drop Symbols

**Goal:** A user can see a palette of crochet symbols, drag them onto a canvas, and move them around freely.

#### Frontend Tasks

1. **Install dependencies:**
   ```
   npm install react-konva konva zustand
   npm install --save-dev @types/konva
   ```

2. **Create the symbol registry** at `frontend/src/config/crochetSymbols.ts` with the symbols listed above. Create placeholder SVGs for each (simple geometric shapes are fine initially — a circle for magic ring, a T-shape for double crochet, etc.).

3. **Build the canvas store** (`frontend/src/stores/canvasStore.ts`) using Zustand:
   - State: `symbols[]`, `connections[]`, `canvasOffset`, `zoom`, `selectedSymbolId`
   - Actions: `addSymbol(type, x, y)`, `moveSymbol(id, x, y)`, `selectSymbol(id)`, `deleteSymbol(id)`, `clearCanvas()`

4. **Build the SymbolPalette component** (`frontend/src/components/SymbolPalette.tsx`):
   - Sidebar or top bar showing available symbols grouped by category
   - Each symbol shows its icon and display name
   - Click or drag from the palette to add a symbol to the canvas center (or drop position)

5. **Build the DiagramCanvas component** (`frontend/src/components/DiagramCanvas.tsx`):
   - Uses `<Stage>` and `<Layer>` from react-konva
   - Renders each symbol from the store as a draggable Konva node
   - Supports pan (drag empty area) and zoom (scroll wheel)
   - Click a symbol to select it (visual highlight); press Delete/Backspace to remove it

6. **Build the EditorPage** (`frontend/src/pages/EditorPage.tsx`):
   - Layout: sidebar palette on the left, canvas filling the rest
   - Top toolbar with: project name (editable), Save button (disabled until Phase 2), Undo/Redo buttons (disabled until Phase 3)

#### Backend Tasks
None for this phase.

#### Acceptance Criteria
- [ ] Symbols appear in a palette sidebar
- [ ] Clicking a palette symbol adds it to the canvas
- [ ] Symbols on the canvas can be dragged freely
- [ ] Canvas supports pan and zoom
- [ ] Symbols can be selected and deleted
- [ ] All state lives in Zustand store, not just in Konva internals

---

### Phase 2: Symbol Snapping and Connections

**Goal:** Symbols snap to each other's anchor points and connections are tracked in state.

#### Frontend Tasks

1. **Render anchor points** — when a symbol is selected or being dragged, show small circles at each anchor position. Color-code: green = available, gray = occupied.

2. **Implement snap logic** in the `onDragMove` / `onDragEnd` handler:
   - While dragging, check proximity of the dragged symbol's anchors to all other symbols' available anchors
   - If any pair is within a threshold (e.g., 20px), snap the dragged symbol's position so the anchors align exactly
   - On drop within threshold: create a connection in the store
   - On drag away from a connected anchor: break the connection

3. **Update the store** with connection actions:
   - `connectSymbols(fromId, fromAnchor, toId, toAnchor)`
   - `disconnectSymbols(fromId, fromAnchor)`

4. **Move connected symbols together** — when a symbol is dragged and it has connections, move the entire connected group as a unit. This prevents connections from visually breaking. Implement this as a graph traversal from the dragged node.

5. **Visual connection indicators** — draw subtle lines or highlights between connected anchors so the user can see the diagram structure.

#### Acceptance Criteria
- [ ] Anchor points are visible when interacting with symbols
- [ ] Dragging a symbol near a compatible anchor causes a snap
- [ ] Connections are stored in the Zustand state
- [ ] Connected symbols move together when dragged
- [ ] Connections can be broken by dragging apart

---

### Phase 3: Save and Load Projects

**Goal:** Users can save their diagram to the database and load it again later.

#### Database Tasks

1. **Create a migration** to add the `projects` and `project_data` tables defined above. Use Alembic if already set up, or raw SQL migration files if not.

#### Backend Tasks

1. **Add Pydantic models** for request/response:
   - `ProjectCreate`: `{ name, description? }`
   - `ProjectUpdate`: `{ name?, description? }`
   - `ProjectSummary`: `{ id, name, description, thumbnail, created_at, updated_at }`
   - `ProjectFull`: `{ id, name, description, canvas_json, created_at, updated_at }`

2. **Add API endpoints** (all require authentication):

   | Method | Path                        | Description                     |
   |--------|-----------------------------|---------------------------------|
   | GET    | `/api/projects`             | List current user's projects    |
   | POST   | `/api/projects`             | Create a new project            |
   | GET    | `/api/projects/{id}`        | Get project with full canvas data |
   | PUT    | `/api/projects/{id}`        | Update project metadata         |
   | PUT    | `/api/projects/{id}/canvas` | Save canvas JSON                |
   | DELETE | `/api/projects/{id}`        | Delete a project                |

3. **Authorization:** Every project endpoint must verify that the project belongs to the authenticated user. Return 404 (not 403) for projects that don't belong to the user, to avoid leaking existence.

#### Frontend Tasks

1. **Build the ProjectsListPage** (`frontend/src/pages/ProjectsListPage.tsx`):
   - Grid or list of the user's saved projects
   - Each card shows: name, thumbnail (or placeholder), last edited date
   - Click to open in editor; button to delete (with confirmation)
   - "New Project" button that creates a project and navigates to the editor

2. **Wire up Save in the EditorPage:**
   - Save button calls `PUT /api/projects/{id}/canvas` with the serialized Zustand state
   - Auto-save on a debounced interval (e.g., every 30 seconds if changes exist)
   - Show a save indicator (e.g., "Saved" / "Unsaved changes")

3. **Wire up Load in the EditorPage:**
   - When navigating to `/editor/{projectId}`, fetch `GET /api/projects/{id}` and hydrate the Zustand store from `canvas_json`

4. **Routing:**
   - `/projects` → ProjectsListPage (requires auth)
   - `/editor/:projectId` → EditorPage (requires auth)
   - `/login` and `/signup` → existing auth pages
   - Redirect unauthenticated users to `/login`

#### Acceptance Criteria
- [ ] User can create a new project from the projects list
- [ ] Canvas state is saved to the database and persists across page reloads
- [ ] User can open a saved project and see their diagram exactly as they left it
- [ ] Auto-save works with a visual indicator
- [ ] Projects list shows all user's projects with metadata
- [ ] Deleting a project works with confirmation
- [ ] Users cannot access other users' projects

---

### Phase 4: Undo/Redo

**Goal:** Users can undo and redo canvas actions.

#### Frontend Tasks

1. **Implement an undo/redo middleware for the Zustand store.** Keep a history stack of canvas state snapshots (or use action-based undo with inverse operations). Cap the history at ~50 entries to limit memory.

2. **Track undoable actions:** addSymbol, moveSymbol, deleteSymbol, connectSymbols, disconnectSymbols. Do NOT track zoom/pan in undo history.

3. **Keyboard shortcuts:** `Ctrl+Z` for undo, `Ctrl+Shift+Z` (or `Ctrl+Y`) for redo.

4. **Wire up the toolbar buttons** that were stubbed in Phase 1.

#### Acceptance Criteria
- [ ] Undo reverses the last canvas action
- [ ] Redo re-applies an undone action
- [ ] Keyboard shortcuts work
- [ ] Undo history does not include pan/zoom
- [ ] Undo stack has a reasonable limit

---

### Phase 5: Export as Image/PDF

**Goal:** Users can export their diagram as a PNG or PDF.

#### Frontend Tasks

1. **PNG export:** Use `stage.toDataURL()` from Konva to capture the canvas as a PNG. Trigger a browser download.

2. **PDF export:** Use a library like `jspdf` to create a PDF and embed the canvas image. Alternatively, use the backend (see below).

3. **Add Export buttons** to the editor toolbar with a dropdown: "Export as PNG" / "Export as PDF".

4. **Thumbnail generation:** When saving a project, also generate a small thumbnail using `stage.toDataURL()` at reduced resolution and save it to the `thumbnail` field.

#### Backend Tasks (optional, for server-side PDF)

1. If client-side PDF is insufficient, add a `POST /api/projects/{id}/export` endpoint that takes format as a parameter and returns the file.

#### Acceptance Criteria
- [ ] User can download their diagram as a PNG
- [ ] User can download their diagram as a PDF
- [ ] Project thumbnails generate automatically on save

---

## File Structure (New and Modified Files)

```
frontend/
├── src/
│   ├── assets/
│   │   └── symbols/              # SVG files for each crochet symbol
│   │       ├── chain.svg
│   │       ├── single_crochet.svg
│   │       ├── double_crochet.svg
│   │       ├── magic_ring.svg
│   │       └── ...
│   ├── config/
│   │   └── crochetSymbols.ts     # Symbol registry (types, anchors, paths)
│   ├── stores/
│   │   └── canvasStore.ts        # Zustand store for canvas state
│   ├── components/
│   │   ├── SymbolPalette.tsx      # Sidebar with draggable symbol icons
│   │   ├── DiagramCanvas.tsx      # Konva canvas with symbols
│   │   ├── AnchorPoint.tsx        # Visual anchor point indicator
│   │   ├── SymbolNode.tsx         # Individual symbol on canvas
│   │   ├── ProjectCard.tsx        # Card in project list
│   │   └── SaveIndicator.tsx      # "Saved" / "Unsaved changes" display
│   ├── pages/
│   │   ├── EditorPage.tsx         # Main diagram editor
│   │   └── ProjectsListPage.tsx   # User's project gallery
│   ├── hooks/
│   │   ├── useSnapLogic.ts        # Anchor proximity detection + snapping
│   │   └── useUndoRedo.ts         # Undo/redo middleware for store
│   └── api/
│       └── projects.ts            # API client functions for project CRUD

backend/
├── models/
│   └── project.py                 # SQLAlchemy models for projects + project_data
├── schemas/
│   └── project.py                 # Pydantic request/response schemas
├── routes/
│   └── projects.py                # FastAPI router with project endpoints
└── migrations/
    └── add_projects_tables.sql    # Database migration
```

---

## Key Technical Notes for Implementation

1. **Keep canvas state serializable.** Everything in the Zustand store must be plain JSON — no class instances, no Konva node references, no functions. The store is the source of truth; Konva renders from it.

2. **Symbol IDs** should be generated client-side using `crypto.randomUUID()` so symbols can be referenced immediately without waiting for a server round-trip.

3. **Anchor compatibility** — not every anchor should connect to every other anchor. A `top` anchor connects to a `bottom` anchor; a magic ring `slot` connects to a stitch `bottom`. Define compatibility rules in the symbol registry.

4. **Performance** — for diagrams with 100+ symbols, avoid re-rendering the entire Konva stage on every state change. Use React.memo on SymbolNode and only update nodes whose data changed.

5. **Auth token handling** — the existing auth system presumably returns a JWT or session token. Ensure all new API calls include this token. Store it in a way the API client module can access (e.g., localStorage or a global auth store).

6. **CORS** — if not already configured, ensure FastAPI has CORS middleware allowing the frontend dev server origin.

7. **Migration safety** — the new tables reference `users.id`. Make sure the FK matches the existing column type exactly (UUID vs integer, etc.).

8. **TypeScript throughout** — the entire frontend is TypeScript (converted in Phase 0). All new files must be `.ts` / `.tsx`. Define shared types (e.g., `CanvasSymbol`, `Connection`, `AnchorPoint`, `Project`) in a `frontend/src/types/` directory and import them wherever needed. Avoid `any` — use `unknown` with type guards if the shape is uncertain.
