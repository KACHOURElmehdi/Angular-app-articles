# Backend (Node + Express + Prisma + SQLite)

Minimal RealWorld-compatible API used by the Angular frontend. Lives entirely in `backend/` so the frontend stays untouched.

## Project Layout
```
backend/
  .env.example        # sample environment
  prisma/
    schema.prisma     # SQLite models
    seed.js           # optional demo data
  src/
    server.js         # app entry
    config.js         # env handling
    prisma.js         # Prisma client
    middleware/       # auth, validation, error handler
    routes/           # auth, articles, profiles, tags
    utils/            # formatters, slug helper
```

## Quick Start
1) `cd backend`
2) `cp .env.example .env` and set `JWT_SECRET` (and optional SSL paths below).
3) `npm install`
4) `npm run migrate`   # creates `dev.db` and generates Prisma client
5) `npm run seed`      # optional: demo user + two articles
6) `npm run dev`       # starts on port 3000 by default

### Making the Angular app use this API (no frontend code changes)
- Add `127.0.0.1 api.realworld.show` to your hosts file.
- Generate a local cert (example):
  ```
  mkdir -p certs
  openssl req -x509 -newkey rsa:2048 -nodes -keyout certs/key.pem -out certs/cert.pem -subj "/CN=api.realworld.show" -days 365
  ```
- Set in `.env`: `SSL_KEY_FILE=./certs/key.pem` and `SSL_CERT_FILE=./certs/cert.pem`.
- Start backend with `npm run dev`; Angular calls to `https://api.realworld.show/api` will now hit your local server.

If HTTPS setup is inconvenient, temporarily change the Angular `api.interceptor.ts` base URL to `http://localhost:3000/api` while developing.

## Environment
- `PORT` (default 3000)
- `JWT_SECRET` (required)
- `DATABASE_URL` (defaults to local SQLite `file:./dev.db`)
- Optional `SSL_KEY_FILE` / `SSL_CERT_FILE` to serve HTTPS.

## Endpoints (JSON only, all under `/api`)
- Auth: `POST /users` (register), `POST /users/login`, `GET /user`, `PUT /user`
  - Aliases: `/auth/register`, `/auth/login`, `/auth/me`
- Profiles: `GET /profiles/:username`, `POST /profiles/:username/follow`, `DELETE /profiles/:username/follow`
- Articles:
  - `GET /articles` (filters: `tag`, `author`, `favorited`, `limit`, `offset`, `status`)
  - `GET /articles/feed` (followed authors, auth required)
  - `GET /articles/:slug`
  - `POST /articles`
  - `PUT /articles/:slug`
  - `DELETE /articles/:slug`
  - `POST /articles/:slug/favorite`, `DELETE /articles/:slug/favorite`
- Comments: `GET /articles/:slug/comments`, `POST /articles/:slug/comments`, `DELETE /articles/:slug/comments/:id`
- Tags: `GET /tags`

Request shapes follow the RealWorld spec, e.g. `{ "user": {...} }`, `{ "article": {...} }`, `{ "comment": {...} }`.

## Seed Data
After `npm run seed`, you get:
- User: `demo@example.com` / `password` (token returned on login)
- Two sample articles tagged with `angular`, `node`, `sqlite`

## Example cURL Calls
```bash
# register
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"user":{"username":"alice","email":"alice@example.com","password":"secret123"}}'

# login
TOKEN=$(curl -s -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"user":{"email":"alice@example.com","password":"secret123"}}' | jq -r .user.token)

# current user
curl -H "Authorization: Token $TOKEN" http://localhost:3000/api/user

# create article
curl -X POST http://localhost:3000/api/articles \
  -H "Authorization: Token $TOKEN" -H "Content-Type: application/json" \
  -d '{"article":{"title":"My first post","description":"intro","body":"hello world","tagList":["angular","demo"]}}'

# list articles with a tag
curl "http://localhost:3000/api/articles?tag=angular&limit=10&offset=0"

# add a comment
curl -X POST http://localhost:3000/api/articles/your-slug/comments \
  -H "Authorization: Token $TOKEN" -H "Content-Type: application/json" \
  -d '{"comment":{"body":"Nice article!"}}'
```

## Notes
- Passwords are hashed with bcryptjs.
- JWT is expected in `Authorization: Token <jwt>` or `Bearer <jwt>`.
- Basic validation is in place; errors return `{ "errors": { "body": ["message"] } }`.
