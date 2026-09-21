# TypeSprint

A typing-speed test with accounts and a global leaderboard. React + Vite on the
front, Express + PostgreSQL behind it.

## Layout

| Path | What it is |
|---|---|
| `backend/` | Express API, `pg`, JWT auth. CommonJS. |
| `frontend/` | React 19 + Vite SPA, and an Express server that serves the build. |
| `docker/postgres/init.sql` | Schema and indexes applied on first container start. |
| `docker-compose.yml` | db + backend + frontend, the whole stack. |

## Running it with Docker

```sh
cp .env.example backend/.env    # then edit JWT_SECRET
docker compose up --build
```

Frontend on <http://localhost>, API on <http://localhost:4000>, postgres on 5432.

If something already owns 5432 (a local postgres install usually does), create a
`docker-compose.override.yml` - it is gitignored and the tracked compose file
stays untouched:

```yaml
services:
  db:
    ports:
      - '5433:5432'
```

...then point `DATABASE_URL` in `backend/.env` at `localhost:5433`.

## Running it for development

```sh
docker compose up -d db                       # just the database
cd backend  && npm install && npm run dev     # :4000
cd frontend && npm install && npm run dev     # :5173, proxies to :4000
```

`backend/.env` needs at least `DATABASE_URL`. `JWT_SECRET` falls back to a
throwaway value in development; in production the server refuses to start
without one. See [.env.example](.env.example).

## Tests

```sh
cd backend  && npm test    # 19 route + unit tests, needs the db running
cd frontend && npm test    # 12 tests, no db
cd frontend && npm run lint
```

The backend suite talks to a real database and cleans up the accounts it
creates. It raises the auth rate limit through `AUTH_MAX_ATTEMPTS`, since every
request comes from one address.

## Things worth knowing

- **`VITE_API_URL` is baked in at build time**, not read at runtime. It defaults
  to `/api`, which is right when one host serves both the app and the API.
- **Scores are computed in the browser.** The server rejects what is physically
  impossible (see `validateResult` in `backend/src/utils.js`) but cannot tell a
  real 150 WPM run from a forged one. A trustworthy leaderboard needs the
  keystroke stream replayed server-side.
- **The auth rate limiter counts in process memory**, so limits are per
  instance. More than one replica means moving it to Redis.
- **Arabic renders right-to-left but unshaped** - each character is its own
  `<span>`, and browsers do not join Arabic letters across elements.

## Deploying

`railway.json` at the root starts the backend. `frontend/railway.json` is for a
second service whose Root Directory is `frontend` - see
[frontend/README.md](frontend/README.md).
