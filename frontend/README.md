# Frontend

React + Vite. `npm run dev` for HMR, `npm test` for the typing-maths tests,
`npm run lint` for oxlint.

`npm run build` bakes `VITE_API_URL` into the bundle - it is a build-time
value, not a runtime one. It defaults to `/api`, which is right whenever the
same host serves both the app and the API (nginx.conf and the Dockerfile do).
A split deploy has to set it to the API's full URL *before* building.

## Railway

`railway.json` here is for a second service whose Root Directory is `frontend`
(the repo root `railway.json` only starts the backend). That service needs
`VITE_API_URL` set to the backend service's public URL, and the backend needs
this service's URL in its `CORS_ORIGIN`.
