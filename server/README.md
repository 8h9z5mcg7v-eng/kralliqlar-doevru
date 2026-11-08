# Krallıq multiplayer API (MVP)

This service provides persistent player kingdoms, the shared 1,000-slot world, and alliance membership.

## Environment
- `DATABASE_URL`: PostgreSQL connection string (required)
- `PORT`: supplied by the hosting platform
- `ALLOWED_ORIGINS`: comma-separated browser origins; set to the published game origin in production

## Run
`npm install && npm start`

The service creates its tables from `schema.sql` on startup.

## Endpoints
- `GET /health`
- `GET /api/world`
- `POST /api/kingdoms/register` — `{ "username", "kingdomName", "password" }`
- `POST /api/kingdoms/login` — `{ "username", "password" }`
- `GET /api/me` — Bearer token
- `POST /api/alliances` — Bearer token, `{ "name", "tag" }`
- `POST /api/alliances/:id/join` — Bearer token
- `POST /api/alliances/leave` — Bearer token

The database enforces unique kingdom slots from 1 to 1000. The public map reads actual registered kingdoms; it does not fabricate online players.

## Deployment
Deploy this repository to Railway with the service root directory set to `/server`, attach a PostgreSQL database, and set `ALLOWED_ORIGINS` to the GitHub Pages game origin.
