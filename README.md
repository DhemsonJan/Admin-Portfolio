# Project Manager

A private, PIN-protected content manager for a developer portfolio, plus the public
site it powers. Projects live in a database and are rendered from it — there are no
hardcoded cards on the public pages.

- **Public site** — featured project, project grid, and per-project detail pages.
- **Project Manager** (`/admin/projects`) — dashboard, search/filter/sort,
  drag-and-drop ordering, full editing, image galleries, live preview, publishing.
- **Upload Project** (`/admin/projects/new`) — a short form for adding a project
  on its own; see [Adding a project](#adding-a-project).

## Quick start

```bash
npm install
npm run seed        # create the database and three example projects
npm run dev         # API on :4000, dashboard on :5173, admin on :5174
```

Open http://localhost:5173 for the public site and
http://localhost:5174/admin/projects for the Project Manager.

The admin lives in its own app, `Admin-Portfolio/`, but stays connected to the
dashboard: it talks to the same API server and shares components with
`client/src` through the `shared` alias in its Vite config.

The first launch needs a PIN. With no `ADMIN_PIN_HASH` set, the server accepts the
`ADMIN_PIN` from `.env` once, prints the bcrypt hash it generated, and refuses to
start until you paste that hash into `.env`. From then on the plaintext PIN is
ignored — only the hash is ever compared.

```bash
npm run pin:hash    # interactive; prints an ADMIN_PIN_HASH line
```

## Adding a project

Everything below happens in the browser — no source edits, no database access.

1. Open **Project Manager → Upload Project** (also linked from the dashboard and
   the Projects list).
2. Drop in a project image, or click to browse. PNG, JPG, JPEG and WEBP up to
   `MAX_UPLOAD_MB`. The image uploads immediately and a preview appears; use
   **Replace image** or **Remove** to change it. Oversized screenshots are
   downscaled to 2000px and re-encoded in the browser first, so what you see is
   what gets stored.
3. Fill in the project name, the live website URL, and the GitHub repository URL.
   A globe icon marks the website field and the GitHub mark marks the repository
   field, so they are hard to mix up.
4. Optionally add a description and technologies (press Enter to add a tag).
5. Choose **Save Draft** or **Publish Project**, and tick **Featured** to promote
   the project. The first featured project in the current order becomes the large
   case study at the top of the public page; any others stay in the grid. Up to
   `MAX_FEATURED` projects can be marked featured at once.

**Save Draft** only needs a name, so you can save work in progress.
**Publish Project** additionally requires an image, a website URL, and a GitHub
URL. If any of them is missing, nothing is saved: the offending fields are
highlighted and a message names what is still needed. Anything with a status of
`published` appears on the public site immediately; drafts are invisible until
published.

GitHub and live-site links appear on the project card, the featured project, and
the detail page. Each opens in a new tab, and each is simply omitted when its URL
is empty.

New projects are appended to the end of the manual ordering. The Projects list
defaults to **Custom order**, where rows can be dragged into place; the star in
each row features that project.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run API and Vite dev server together |
| `npm run build` | Build the client into `client/dist` |
| `npm start` | Serve API **and** the built client from one process on :4000 |
| `npm run seed` | Create/refresh schema and insert example projects |
| `npm run seed -- --reset` | Delete all projects and restore the starter set exactly |
| `npm run pin:hash` | Generate a PIN hash |

## Security model

The Project Manager is deployed in two places — on its own domain
(`admin-portfolio-orpin.vercel.app`) and under `/admin/` on the main
site — both running against the same cloud database. The PIN is the
boundary: only its bcrypt hash lives in the project's environment
variables, the plaintext PIN never reaches the browser, and failed
attempts are rate limited. The measures below keep that boundary tight.

The PIN never reaches the browser.

1. The browser `POST`s the PIN to `/api/auth/login`.
2. The server compares it against the bcrypt hash with `bcrypt.compare`.
3. On success it issues an opaque random token, stores **only** its SHA-256 hash in
   `admin_sessions`, and sets it as an `HttpOnly`, `SameSite=Strict` cookie
   (`Secure` automatically when `NODE_ENV=production`).
4. Every admin request is authorised by re-hashing the cookie and looking up the
   session. The raw token is unreadable from JavaScript and useless if the database
   leaks.

Other measures:

- **Rate limiting** is database-backed: 5 failures per IP in 15 minutes, then a
  15-minute lockout. This survives restarts, unlike an in-memory counter.
- **Uploads** are limited to 8 MB, filtered by extension *and* MIME type, and then
  verified by reading magic bytes — a `.png` containing PHP is rejected. Filenames
  are generated, never taken from the client.
- **Public APIs never expose drafts.** A draft requested by slug returns `404`, not
  `403`, so its existence is not disclosed.
- **Input is validated server-side** with length limits and allow-lists for
  slugs, categories, status, and year.

## Configuration

Copy `server/.env.example` to `server/.env`. Everything has a working default for
local development.

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `4000` | |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin for the API |
| `SERVE_CLIENT` | `true` | Serve `client/dist` from the API process |
| `EXPOSE_ADMIN` | `true` | Mount login, project mutations and uploads. Set on every deployment |
| `DB_CLIENT` | `sqlite` | `sqlite` or `postgres` |
| `SQLITE_FILE` | `./data/portfolio.db` | Relative to `server/` |
| `DATABASE_URL` | — | Required when `DB_CLIENT=postgres` |
| `DB_POOL_MAX` | `10` | Connections per process; keep low on serverless |
| `ADMIN_PIN_HASH` | — | bcrypt hash; preferred over plaintext |
| `ADMIN_PIN` | — | Dev-only first-run convenience |
| `SESSION_TTL_HOURS` | `12` | Sessions also expire on logout |
| `LOGIN_MAX_ATTEMPTS` | `5` | |
| `LOGIN_WINDOW_MINUTES` | `15` | |
| `LOGIN_LOCKOUT_MINUTES` | `15` | |
| `STORAGE_DRIVER` | `local` | `local`, `supabase`, or `s3` |
| `MAX_UPLOAD_MB` | `8` | |
| `MAX_GALLERY_IMAGES` | `8` | |
| `UPLOAD_DIR` | `./uploads` | Local driver only |
| `MAX_FEATURED` | `3` | Server-enforced |
| `COOKIE_SECURE` | `auto` | `true`/`false` to force |

## Uploads and deployment

### The shape of a deployment

The Project Manager runs from your machine, from `/admin/` on the
main site, and from its own domain. All three talk to the same
Postgres database, so publishing from anywhere updates every site
immediately:

```
your machine                              Vercel (one repo, two projects)
localhost:5173 -> localhost:4000        dhemsonjan-portfolio.vercel.app
  Project Manager + uploads                 /          public portfolio
        |                                   /admin/*     Project Manager
        +------> Supabase Postgres <-------+
                    Supabase Storage        admin-portfolio-orpin.vercel.app
                                              /            Project Manager (standalone)
                                              /api/*        its own serverless API
```

Both deployments mount the admin surface (`EXPOSE_ADMIN=true`), so
the Project Manager is reachable from either URL — it is protected
by the PIN, the bcrypt hash, and the rate limiter, not by obscurity.

`local` storage and `sqlite` both rely on a writable disk, which
serverless hosts do not have. Every deployment uses `postgres` plus
a cloud driver:

- `supabase` — set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. No extra npm
  package; the driver talks to the REST API.
- `s3` — `npm install @aws-sdk/client-s3` in `server/`, then set `S3_*`.
### Supabase setup

1. Create a project, then open **Storage** and add a bucket named `portfolio`
   with public read enabled.
2. Copy **Project URL** into `SUPABASE_URL`.
3. Copy the **service role** key into `SUPABASE_SERVICE_ROLE_KEY`. This bypasses
   row-level security — server only, never in client code or in Git.
4. Under **Project Settings → Database → Connection string**, copy the
   **Session pooler** URI (port `6543`), append `?pgbouncer=true`, and put your
   password into `DATABASE_URL`.

   Use the pooler, not the direct connection. Each serverless instance opens its
   own pool, and the direct URL runs out of connections once a few lambdas are
   warm.
5. Set in `server/.env`: `DB_CLIENT=postgres`, `STORAGE_DRIVER=supabase`,
   `SUPABASE_BUCKET=portfolio`.
6. `npm run seed` to create the schema and starter projects in the cloud database.

### Vercel

`vercel.ts` picks the configuration at build time from the
`DEPLOY_TARGET` environment variable, so one repo feeds two
different projects:

- **dhemsonjan-portfolio** (default, `DEPLOY_TARGET` unset) serves
  the prebuilt `client/dist` — the build step is a no-op because the
  dist is uploaded from your machine — with `/api/*` rewritten to the
  `api/index.js` function, the Project Manager at `/admin/`, and
  everything else falling back to `index.html` for client-side
  routing. `framework` is `null` so Vercel uses those values
  verbatim instead of guessing at the `client/` subdirectory.
- **admin-portfolio** sets `DEPLOY_TARGET=admin` (and
  `ADMIN_STANDALONE=true`) as project environment variables. The
  admin branch of `vercel.ts` then builds the Project Manager
  standalone into `Admin-Portfolio/dist` and serves it at `/`, with
  its own `/api/*` function so the session cookie stays same-origin.
  Its install command adds `--include=dev`: the project's
  `NODE_ENV=production` would otherwise make npm skip the dev
  dependencies (Vite) that the build needs.

Deploy both from the repo root:

```bash
vercel deploy --prod --yes                                    # public site
vercel deploy --prod --yes --project admin-portfolio ^
  --build-env DEPLOY_TARGET=admin                             # Project Manager
```

Environment variables on **admin-portfolio**:

| Variable | Value |
| --- | --- |
| `DEPLOY_TARGET` | `admin` — selects the admin branch of `vercel.ts` |
| `ADMIN_STANDALONE` | `true` — vite builds the app at `/` |
| `NODE_ENV` | `production` |
| `EXPOSE_ADMIN` | `true` — mounts the login and write routes |
| `SERVE_CLIENT` | `false` — Vercel serves the static output itself |
| `CLIENT_ORIGIN` | `https://admin-portfolio-orpin.vercel.app` |
| `ADMIN_PIN_HASH` | Your bcrypt hash (`npm run pin:hash`) |
| `DB_CLIENT`, `DATABASE_URL`, `DB_POOL_MAX` | Same as the public project |
| `STORAGE_DRIVER`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET` | Same as the public project |
| `MAIL_ENABLED`, `SMTP_*`, `MAIL_FROM`, `MAIL_TO` | Same as the public project |

The public project keeps the same variables, minus
`DEPLOY_TARGET`/`ADMIN_STANDALONE`, with `CLIENT_ORIGIN` pointing
at the main domain.

### Before going live

- Generate the PIN hash: `npm run pin:hash`, then set it as
  `ADMIN_PIN_HASH` on both Vercel projects and in `server/.env`
  for local development. Never set the plaintext `ADMIN_PIN`
  anywhere but a throwaway first run.
- Keep `NODE_ENV=development` in `server/.env`; it only ever runs
  locally.
- `/api/health` reports the active drivers and whether admin is
  mounted — a quick way to confirm what each deployment really has
  enabled.

### Two development conveniences to remove

The plaintext `ADMIN_PIN` in `server/.env`, and
`NODE_ENV=development`. Both are local-only.