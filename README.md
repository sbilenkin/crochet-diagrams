# Crochet Scribbles

A web app for drafting crochet diagrams. Drag crochet stitch symbols onto a
canvas, snap them together at anchor points to build chains and stitch
clusters, and save diagrams to your account as named projects.

## Tech stack

- **Frontend:** React 19 + TypeScript + Vite, Zustand for state,
  [react-konva](https://konvajs.org/docs/react/) for the canvas, Bootstrap 5
  for styling, React Router v7.
- **Backend:** FastAPI + SQLAlchemy 2.0 (sync) + psycopg2, JWT auth via
  `python-jose`, passwords hashed with bcrypt.
- **Database:** PostgreSQL 15, schema managed with Alembic.
- **Dev orchestration:** Docker Compose for db + backend; Vite dev server
  runs the frontend on the host.

## Prerequisites

- Docker Desktop (or Docker Engine + Compose v2)
- Node.js 20+ and npm, for the frontend dev server

## First-time setup

1. Create a `.env` file in the repo root:

   ```env
   POSTGRES_USER=devuser
   POSTGRES_PASSWORD=devpass
   POSTGRES_DB=devdb
   JWT_SECRET_KEY=dev-insecure-change-me
   JWT_ALGORITHM=HS256
   JWT_EXPIRE_MINUTES=1440
   ```

2. Start the database and backend:

   ```bash
   docker compose up -d --build
   ```

   The backend listens on `http://localhost:8000`, Postgres on
   `localhost:5434` (mapped to container `5432`).

3. Apply migrations:

   ```bash
   docker compose exec backend alembic upgrade head
   ```

   If you have an existing dev DB that pre-dates Alembic and already has a
   `users` table, stamp the baseline first so Alembic doesn't try to recreate
   it: `docker compose exec backend alembic stamp 737ca094f592`.

4. Install frontend deps and start the dev server:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   App at `http://localhost:5173`. Sign up, log in, and you'll land on the
   projects list.

## Useful commands

Frontend (from `frontend/`):

| Command            | Purpose                          |
|--------------------|----------------------------------|
| `npm run dev`      | Vite dev server with HMR         |
| `npm run build`    | Production build                 |
| `npm run typecheck`| `tsc --noEmit`                   |
| `npm run lint`     | ESLint                           |

Backend (from repo root):

| Command                                                       | Purpose                     |
|---------------------------------------------------------------|-----------------------------|
| `docker compose up -d`                                        | Start db + backend          |
| `docker compose logs -f backend`                              | Tail backend logs           |
| `docker compose exec backend alembic upgrade head`            | Apply migrations            |
| `docker compose exec backend alembic revision --autogenerate -m "msg"` | New migration from model diff |
| `docker compose exec db psql -U devuser -d devdb`             | psql shell                  |

More migration notes in [`backend/MIGRATIONS.md`](backend/MIGRATIONS.md).

## Project layout

```
backend/
  main.py            FastAPI app: /login, /signup, /health; mounts projects router
  auth.py            JWT issue/verify, get_current_user dependency
  db/database.py     SQLAlchemy engine + Session, reads DATABASE_URL
  models/            ORM models (User, Project, ProjectData)
  schemas/           Pydantic request/response models
  routes/projects.py CRUD for /api/projects, all auth-gated
  alembic/           Migration env + versions/
frontend/src/
  api/               fetch wrapper with bearer-token injection + typed endpoints
  stores/canvasStore.ts  Zustand store: symbols, connections, viewport, dirty
  components/        DiagramCanvas, SymbolNode, AnchorOverlay, ConnectionOverlay, ...
  pages/             ProjectsListPage, EditorPage
  types/canvas.ts    Shared canvas/anchor/serialization types
docker-compose.yml
CROCHET_DIAGRAM_BUILDER_PLAN.md  Design doc / roadmap
```

## Auth flow

`POST /login` returns `{access_token, token_type, user}`. The frontend stores
the token in `sessionStorage` and the API client attaches it as
`Authorization: Bearer …` on every request. A 401 clears the token and
redirects to `/login`. All `/api/projects*` routes require a valid token and
are scoped to the token's user; cross-user access returns 404.

## Canvas data

Diagrams serialize to JSON and live in the `project_data.canvas_json` JSONB
column:

```jsonc
{
  "version": 1,
  "symbols": [{ "id": "…", "type": "chain", "x": 100, "y": 200, "rotation": 0 }],
  "connections": [
    { "from": { "symbolId": "…", "anchor": "top" },
      "to":   { "symbolId": "…", "anchor": "bottom" } }
  ],
  "viewport": { "offsetX": 0, "offsetY": 0, "zoom": 1 }
}
```

The editor debounces writes: after ~3s of no further changes, `dirty` flips
the auto-save and the canvas is PUT to
`/api/projects/{id}/canvas`. The save indicator in the header reflects
saving / saved / unsaved / error state.
