# Migrations

We use Alembic. Models live in `backend/models/`; `alembic/env.py` reads
`DATABASE_URL` from the environment.

All commands run inside the backend container:

```bash
# Create a new migration from model changes
docker compose exec backend alembic revision --autogenerate -m "describe change"

# Apply migrations
docker compose exec backend alembic upgrade head

# Roll back one revision
docker compose exec backend alembic downgrade -1

# Stamp a DB at a specific revision without running migrations
docker compose exec backend alembic stamp <revision>
```

The `users` table pre-dates Alembic. Revision `737ca094f592` is the baseline
for it; existing dev databases were stamped at that revision so the schema
wasn't recreated.
