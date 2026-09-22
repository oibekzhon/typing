# TypeSprint

A typing-speed test with accounts and a global leaderboard. React + Vite powers
the frontend, and Express + PostgreSQL powers the backend.

## Project structure

| Path          | What it is                                                       |
| ------------- | ---------------------------------------------------------------- |
| `backend/`  | Express API,`pg`, JWT auth. CommonJS.                          |
| `frontend/` | React 19 + Vite typing application.                              |
| `backend/`  | Express API, PostgreSQL access, JWT authentication, and results. |

## Local development

The typing test itself runs without the backend or a database:

```sh
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). For authentication and the global leaderboard,
run PostgreSQL locally with a database named `typingdb`, user `typinguser`, and
password `typingpass`. Copy `backend/.env.example` to `backend/.env`, then run
the API in another shell:

```sh
cd backend
npm install
npm run dev
```

The API runs on [http://localhost:4000](http://localhost:4000). The frontend uses the API URL from
`frontend/.env.example`.

## Tests

```sh
cd backend  && npm test    # route + unit tests, needs local PostgreSQL
cd frontend && npm test    # typing logic tests, no database
cd frontend && npm run lint
```

The backend suite talks to a real database and cleans up the accounts it
creates. It raises the auth rate limit through `AUTH_MAX_ATTEMPTS`, since every
request comes from one address.

## Things worth knowing

- **`VITE_API_URL` is baked in at build time**, not read at runtime. Set it to
  the backend's full URL before building for a split deployment.
- **Scores are computed in the browser.** The server rejects what is physically
  impossible (see `validateResult` in `backend/src/utils.js`) but cannot tell a
  real 150 WPM run from a forged one. A trustworthy leaderboard needs the
  keystroke stream replayed server-side.
- **The auth rate limiter counts in process memory**, so limits are per instance.
- **Arabic renders right-to-left but unshaped** - each character is its own
  `<span>`, and browsers do not join Arabic letters across elements.
