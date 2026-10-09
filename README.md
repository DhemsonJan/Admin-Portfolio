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

The Project Manager runs on your own machine and is not deployed. The public
site sets `EXPOSE_ADMIN=false`, which leaves `/api/auth/login` and every
project-mutation route out of the build — there is no remote PIN to guess. The
measures below protect the local CMS.

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
| `EXPOSE_ADMIN` | `true` | Mount login, project mutations and uploads. `false` on the public deployment |
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

The Project Manager is a **local tool**, not part of the public site. Both
processes talk to the same Postgres database, so publishing from your machine
updates the live site immediately:

```
your machine                              Vercel (public)
localhost:5173 -> localhost:4000           yoursite.com -> static client
  full admin + uploads                      /api/*     -> serverless function
        |                                    (EXPOSE_ADMIN=false)
        +--------> Supabase Postgres <-------+
                     Supabase Storage
```

The public deployment sets `EXPOSE_ADMIN=false`. That omits `/api/auth/*` and
every write route from the build entirely, so there is no login page and no PIN
to attack — content only reaches the public site through your machine.

`local` storage and `sqlite` both rely on a writable disk, which serverless
hosts do not have. For a public deployment use `postgres` plus a cloud driver:

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

`vercel.json` pins the build: `npm run build` into `client/dist`, with `/api/*`
rewritten to the `api/index.js` function and everything else falling back to
`index.html` for client-side routing. `framework` is `null` so Vercel uses those
values verbatim instead of guessing at the `client/` subdirectory.

Add these environment variables on the project:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `EXPOSE_ADMIN` | `false` |
| `SERVE_CLIENT` | `false` — Vercel serves the static output itself |
| `CLIENT_ORIGIN` | `https://yourdomain.com` |
| `DB_CLIENT` | `postgres` |
| `DATABASE_URL` | Pooled connection string |
| `STORAGE_DRIVER` | `supabase` |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET` | As above |

Do **not** set `ADMIN_PIN` or `ADMIN_PIN_HASH` on Vercel — there is no admin
surface there to unlock.

### Before going live

- Generate the PIN hash for your machine: `npm run pin:hash`, then paste it into
  `server/.env` as `ADMIN_PIN_HASH` and delete the plaintext `ADMIN_PIN`.
- Keep `NODE_ENV=development` in `server/.env`; it only ever runs locally.
- `/api/health` reports the active drivers and whether admin is mounted — a quick
  way to confirm the public deployment really has it disabled.

### Two development conveniences to remove

The plaintext `ADMIN_PIN` in `server/.env`, and `NODE_ENV=development`. Both are
local-only now that the admin surface never leaves your machine.