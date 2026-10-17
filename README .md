# Website Builder — Project README

> A full-stack no-code website builder. Users sign up, pick a template, drag-and-drop blocks on a canvas, and publish their site to a live URL served from AWS S3 + CloudFront.

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend API | Node.js + Express |
| Database | PostgreSQL + Sequelize ORM |
| Authentication | JWT (jsonwebtoken + bcryptjs) |
| File uploads | Multer + Cloudinary |
| Site publishing | AWS S3 + CloudFront |
| Frontend | React (Vite) |
| Global state | Zustand |
| Drag and drop | @dnd-kit/core + @dnd-kit/sortable |
| HTTP client | Axios |
| Routing | React Router v6 |

---

## Project structure

```
website-builder/
├── website-builder-api/        ← Backend (Node.js)
│   ├── server.js               ← Entry point
│   ├── app.js                  ← Express setup
│   ├── .env                    ← Secrets (never commit)
│   └── src/
│       ├── config/
│       │   ├── database.js     ← PostgreSQL connection
│       │   ├── cloudinary.js   ← Image upload client
│       │   └── s3.js           ← AWS S3 client
│       ├── models/
│       │   ├── index.js        ← All associations (import from here)
│       │   ├── User.js
│       │   ├── Site.js
│       │   ├── Page.js
│       │   ├── Section.js
│       │   └── Asset.js
│       ├── middleware/
│       │   ├── auth.js         ← JWT guard (protects routes)
│       │   └── errorHandler.js ← Global error catcher
│       ├── routes/
│       │   ├── auth.js         ← POST /auth/register, /auth/login
│       │   ├── sites.js        ← CRUD + publish
│       │   ├── pages.js        ← Load/save editor state
│       │   └── assets.js       ← Image upload
│       └── services/
│           └── publishService.js ← Render HTML → S3 → CloudFront
│
└── website-builder/            ← Frontend (React + Vite)
    ├── index.html              ← App shell (add Google Fonts here)
    └── src/
        ├── api/
        │   └── client.js       ← Axios + JWT interceptor
        ├── store/
        │   ├── authStore.js    ← Login state (Zustand)
        │   └── editorStore.js  ← Sections array (Zustand)
        ├── data/
        │   └── templates.js    ← Preset section layouts
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── TemplatePage.jsx
        │   └── EditorPage.jsx
        ├── components/
        │   ├── editor/
        │   │   ├── Canvas.jsx          ← Drag-and-drop drop target
        │   │   ├── BlockPalette.jsx    ← Left panel
        │   │   ├── PropPanel.jsx       ← Right panel
        │   │   └── SortableSection.jsx ← Draggable block wrapper
        │   ├── blocks/
        │   │   └── BlockPreview.jsx    ← Inline block renderer
        │   └── ui/
        │       ├── Toolbar.jsx         ← Save status + publish
        │       └── PreviewModal.jsx    ← Viewport preview iframe
        └── App.jsx                     ← Routes + Protected wrapper
```

---

## File-by-file reference

### Backend — Config

#### `server.js`
**Goal:** Start the application.  
Calls `connectDB()` and waits for the database before starting `app.listen(PORT)`. If the DB connection fails, `process.exit(1)` stops the process immediately.

#### `app.js`
**Goal:** Wire the entire Express pipeline in one place.  
Applies `helmet` (security headers), `morgan` (request logging), `cors`, and `express.json()`. Mounts all route files. Registers `errorHandler` last — Express identifies it as the error handler by its 4-argument signature `(err, req, res, next)`.

#### `src/config/database.js`
**Goal:** Connect to PostgreSQL and sync all Sequelize models into real tables.  
Creates a Sequelize instance from `DATABASE_URL`. `authenticate()` tests the connection. `sync({ alter: true })` updates columns without dropping data — safe in development. In production, use migrations instead.

#### `src/config/cloudinary.js`
**Goal:** Configure the Cloudinary SDK once so any file can import the ready-to-use client.  
Reads `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` from `.env` and exports the configured v2 client.

#### `src/config/s3.js`
**Goal:** Configure AWS S3 client for publishing site HTML files.  
Creates `S3Client` with region and credentials from `.env`. Imported only by `publishService.js`.

---

### Backend — Models

> **Important:** Always import models from `src/models/index.js`, never directly from individual files. The `index.js` registers all associations — without it, `include` queries crash with *"X is not associated to Y"*.

```js
// ✅ correct
const { User, Site, Page, Section, Asset } = require('../models');

// ❌ wrong — associations not registered
const Page = require('../models/Page');
```

#### `src/models/index.js`
**Goal:** Register ALL model associations in one place.  
Requires all 5 models and calls `hasMany` / `belongsTo` for every relationship. `app.js` imports this once on startup so associations are ready before any request arrives.

**Relationships defined here:**
```
User    hasMany  Site     (user_id)
Site    hasMany  Page     (site_id)
Page    hasMany  Section  (page_id)
User    hasMany  Asset    (user_id)
```
All with `onDelete: 'CASCADE'` — deleting a site automatically removes its pages and sections.

#### `src/models/User.js`
**Goal:** Store accounts. Hash passwords automatically before saving.  
UUID primary key, unique email with `isEmail` validation, `password_hash` column. A `beforeCreate` hook runs `bcrypt.hash(password, 12)` so plain text is never stored. `validatePassword()` instance method is used on login.

#### `src/models/Site.js`
**Goal:** Represent each website a user creates.  
Stores `user_id` FK, `name`, unique `subdomain`, and nullable `published_at`. The subdomain is auto-generated from the site name + a short random suffix on creation.

#### `src/models/Page.js`
**Goal:** Represent a page within a site (home, about, contact…).  
Stores `site_id` FK, `slug`, `title`, `order`. A default home page is created automatically whenever a site is created.

#### `src/models/Section.js`
**Goal:** Store each content block of a page in a flexible schema.  
Stores `page_id` FK, `type` (hero / text / image / navbar / footer), `props` as **JSONB**, and `order`. The JSONB `props` column is the flexible heart of the builder — every block type stores different keys (title, subtitle, bg, links…) without extra columns.

#### `src/models/Asset.js`
**Goal:** Track every uploaded image with its CDN URL.  
Stores `user_id` FK, `url` (Cloudinary CDN URL), `filename`, `size_bytes`, `mimetype`. Created after each successful Cloudinary upload. The URL gets embedded into a section's `props.imageUrl`.

---

### Backend — Middleware

#### `src/middleware/auth.js`
**Goal:** Protect every private route by verifying the JWT token.  

Flow:
```
request → read "Authorization: Bearer <token>" header
        → jwt.verify(token, JWT_SECRET)
        → User.findByPk(decoded.userId)
        → attach req.user → next()
        
if missing / invalid / expired → 401
```

Used as the second argument on any protected route:
```js
router.get('/sites', auth, siteController.list);
```

#### `src/middleware/errorHandler.js`
**Goal:** Catch all unhandled errors in one place and return a clean JSON response.  
Handles `SequelizeValidationError` (→ 400), Multer `LIMIT_FILE_SIZE` (→ 400), and falls back to 500. Must always be the last `app.use()` in `app.js`.

---

### Backend — Routes

#### `src/routes/auth.js`
**Goal:** Register and log in users.

| Method | URL | What happens |
|---|---|---|
| POST | `/auth/register` | Create user (bcrypt hook hashes password), sign JWT, return `{ token }` |
| POST | `/auth/login` | Find user, `validatePassword()`, sign JWT, return `{ token }` |

Wrong password always returns `401 Invalid credentials` — never reveals whether the email exists.

#### `src/routes/sites.js`
**Goal:** CRUD for sites and the publish trigger.

| Method | URL | What happens |
|---|---|---|
| GET | `/sites` | List all sites for `req.user.id` |
| POST | `/sites` | Create site with auto subdomain, create default home page |
| DELETE | `/sites/:id` | Delete site (cascades to pages and sections) |
| POST | `/sites/:id/publish` | Call `publishService.publishSite()`, update `published_at`, return CloudFront URL |

All routes protected by `auth` middleware.

#### `src/routes/pages.js`
**Goal:** Load and save the editor state (the sections array).

| Method | URL | What happens |
|---|---|---|
| GET | `/sites/:siteId/pages` | List pages of a site |
| POST | `/sites/:siteId/pages` | Add a new page |
| GET | `/pages/:pageId/sections` | Load editor — returns ordered sections array |
| PUT | `/pages/:pageId/sections` | Save editor — delete old sections, bulkCreate new ones |
| DELETE | `/pages/:pageId` | Delete page (cascades to sections) |

Ownership is always verified via a `Page → Site WHERE user_id = req.user.id` JOIN.

#### `src/routes/assets.js`
**Goal:** Accept image uploads and return a CDN URL.

| Method | URL | What happens |
|---|---|---|
| POST | `/assets/upload` | multer reads file into memory → Cloudinary upload_stream → Asset.create() → return `{ url }` |

Validates file type (jpg, png, webp, gif only) and size (max 5 MB) before uploading.

---

### Backend — Services

#### `src/services/publishService.js`
**Goal:** Turn a site's sections into a deployed HTML page on S3 + CloudFront.

The publish pipeline:
```
publishSite(site)
  → buildHTML(siteId)
      → Page.findAll({ include: [Section] })   ← one DB query
      → sections.flatMap → renderers[type](props) ← each section → HTML string
      → wrap in <!DOCTYPE html> document
  → uploadToS3(subdomain, html)
      → PutObjectCommand({ Key: "sites/{subdomain}/index.html", ContentType: "text/html" })
  → invalidateCache(subdomain)
      → CreateInvalidationCommand({ Paths: ["/sites/{subdomain}/*"] })
  → return CloudFront URL
```

The `renderers` object maps each block type to a function:
```js
const renderers = {
  navbar: (props) => `<nav>...</nav>`,
  hero:   (props) => `<section>...</section>`,
  text:   (props) => `<section><p>...</p></section>`,
  image:  (props) => `<section><img>...</section>`,
  footer: (props) => `<footer>...</footer>`,
};
```

---

### Frontend — Stores (Zustand)

#### `src/store/authStore.js`
**Goal:** Single source of truth for login state across the whole React app.

State held:
- `token` — read from `localStorage` on init
- `isAuthenticated` — `!!token`

Actions:
- `login(email, password)` → `POST /auth/login` → saves token to `localStorage` + state
- `register(email, password)` → `POST /auth/register` → same
- `logout()` → clears `localStorage` + resets state

The `Protected` wrapper in `App.jsx` reads `isAuthenticated`. If false, redirects to `/login`.

#### `src/store/editorStore.js`
**Goal:** Hold the entire editor state so all four panels stay in sync without prop drilling.

State held:
- `sections[]` — array of `{ id, type, props }` objects
- `selectedId` — which section is currently selected
- `saveStatus` — `'saved' | 'saving' | 'unsaved'`

Actions:
- `addSection(type)` → appends with UUID + default props, sets `saveStatus: 'unsaved'`
- `updateSection(id, props)` → merges new props into the section, sets `saveStatus: 'unsaved'`
- `removeSection(id)` → filters out, clears `selectedId` if it was selected
- `reorderSections(newArr)` → replaces array after drag-and-drop
- `setSelected(id)` → updates `selectedId`, triggers `PropPanel` to re-render

Every mutation that changes `sections` sets `saveStatus: 'unsaved'`, which triggers the `EditorPage` debounced auto-save.

#### `src/api/client.js`
**Goal:** One axios instance that every component uses, with JWT auth handled automatically.

```js
// Request interceptor — runs before every request
config.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;

// Response interceptor — runs after every response
if (err.response?.status === 401) {
  localStorage.removeItem('token');
  window.location.href = '/login';
}
```

---

### Frontend — Pages

#### `LoginPage.jsx` → route `/login`
Controlled form. `handleSubmit` calls `authStore.login()`. On success: `navigate('/')`. On failure: shows `err.response.data.error` inline. Submit button disabled while loading.

#### `RegisterPage.jsx` → route `/register`
Three fields with client-side validation before the API call. Password strength bar updates on every keystroke (4 levels: too short / weak / good / strong). On success: shows green tick then redirects after 2 seconds.

#### `DashboardPage.jsx` → route `/` (Protected)
`useEffect` fetches `GET /sites` on mount. Maps sites to `SiteCard` components. "+ New site" calls `POST /sites` then navigates to `/templates` passing `siteId` in `location.state`.

#### `TemplatePage.jsx` → route `/templates` (Protected)
Reads `siteId` from `useLocation().state`. Shows a grid from the `TEMPLATES` array. `pick(template)` stamps each section with `uuidv4()`, loads into `editorStore`, saves to backend via `PUT /pages/:id/sections`, then navigates to `/editor/:pageId`.

#### `EditorPage.jsx` → route `/editor/:pageId` (Protected)
The core page. Two `useEffect` hooks:
1. **On mount** — `GET /pages/:pageId/sections` → `setSections()`
2. **On sections change** — if `saveStatus === 'unsaved'`, debounce 800ms → `PUT /pages/:pageId/sections` → set `saveStatus: 'saved'`

Renders: `Toolbar` + `BlockPalette` + `Canvas` + `PropPanel` in a 3-column flex layout.

---

### Frontend — Editor Components

#### `Canvas.jsx`
`DndContext` wraps `SortableContext`. `PointerSensor` activates after 8px of movement (prevents accidental drag on click). `onDragEnd` uses `arrayMove` to compute the new order then calls `reorderSections`.

#### `SortableSection.jsx`
`useSortable({ id: section.id })` returns:
- `setNodeRef` → on the outer wrapper div
- `listeners` + `attributes` → **only on the drag handle**, not the whole card
- `transform` + `transition` → applied as CSS to animate movement
- `isDragging` → fades the original card (opacity 0.4) while dragging

Card `onClick` → `setSelected(id)` (shows pink border, loads props in right panel).  
Delete button `onClick` → `event.stopPropagation()` (prevents select firing) then `removeSection(id)`.

#### `BlockPalette.jsx`
Static list of block types. Each item click calls `addSection(type)` which appends to `editorStore.sections` with a UUID and default props. The canvas re-renders immediately.

#### `PropPanel.jsx`
Reads `selectedId` from store, finds the section, renders different input fields per `section.type`. Every `onChange` calls `updateSection(id, { [key]: value })` which sets `saveStatus: 'unsaved'` and triggers auto-save.

#### `BlockPreview.jsx`
Switch on `section.type` → renders lightweight JSX preview using `section.props` values. Used inside `SortableSection` on the canvas. Same data as `publishService` renderers — what you see is what gets published.

#### `Toolbar.jsx`
Shows `saveStatus` in color (green = saved, amber = unsaved, gray = saving). Preview button opens `PreviewModal`. Publish button calls `POST /sites/:id/publish` and shows the returned live URL.

#### `PreviewModal.jsx`
```
sections → renderToHTML() → HTML string
         → new Blob([html], { type: 'text/html' })
         → URL.createObjectURL(blob)
         → <iframe src={blobUrl} />
```
Viewport toggle (desktop 1280px / tablet 768px / mobile 375px) resizes the iframe. `key={activeVP}` on the iframe forces React to unmount and remount it on each switch, re-rendering the HTML at the new width. No server call — preview is instant.

---

### Frontend — Data

#### `src/data/templates.js`
Static array of preset section layouts. No backend needed. Each template is:
```js
{
  id: 'landing',
  name: 'Landing page',
  preview: '#color',
  sections: [
    { type: 'navbar', props: { logo: 'My Brand', links: ['Home'] } },
    { type: 'hero',   props: { title: 'Welcome', bg: '#fff' } },
  ]
}
```
`TemplatePage` imports `TEMPLATES` and maps over it. New templates can be added here without touching the backend.

---

## Environment variables

### Backend `.env`
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgres://user:password@localhost:5432/website_builder
JWT_SECRET=your_long_random_secret_here
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
CLOUDFRONT_DOMAIN=https://d1234abcd.cloudfront.net
CLOUDFRONT_DISTRIBUTION_ID=E1ABCDEF123456
CLIENT_URL=http://localhost:5173
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:3000
```

> Never commit `.env` files. Add them to `.gitignore`.

---

## How to run locally

### Backend
```bash
cd website-builder-api
npm install
npm run dev        # nodemon server.js
```
Server starts on `http://localhost:3000`.

### Frontend
```bash
cd website-builder
npm install
npm run dev        # vite
```
App starts on `http://localhost:5173`.

### PostgreSQL
```bash
# with Docker:
docker run --name builder-db \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=website_builder \
  -p 5432:5432 -d postgres:16
```

---

## API endpoints — quick reference

| Method | URL | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create account, get token |
| POST | `/auth/login` | — | Sign in, get token |
| GET | `/sites` | ✓ | List user's sites |
| POST | `/sites` | ✓ | Create site |
| DELETE | `/sites/:id` | ✓ | Delete site |
| POST | `/sites/:id/publish` | ✓ | Publish to S3 + CloudFront |
| GET | `/sites/:siteId/pages` | ✓ | List pages of a site |
| POST | `/sites/:siteId/pages` | ✓ | Add a page |
| GET | `/pages/:pageId/sections` | ✓ | Load editor state |
| PUT | `/pages/:pageId/sections` | ✓ | Save editor state |
| DELETE | `/pages/:pageId` | ✓ | Delete a page |
| POST | `/assets/upload` | ✓ | Upload image, get CDN URL |

All authenticated routes require: `Authorization: Bearer <token>`

---

## Key rules to remember

1. **Always import models from `../models`** (the index), never from individual model files. Associations only register when `index.js` runs.

2. **`auth` middleware must be the second argument** on every protected route: `router.get('/path', auth, handler)`.

3. **`errorHandler` must be the last `app.use()`** in `app.js`. Express identifies it by the 4-argument signature.

4. **Auto-save triggers on `saveStatus === 'unsaved'`**. Every `editorStore` mutation that changes sections sets this. `EditorPage` watches it with a debounced `useEffect`.

5. **The `sections.props` column is JSONB** — each block type stores arbitrary JSON here. There is no separate column per property.

6. **Never put `listeners` on the whole card** in `SortableSection`. Put them only on the drag handle — otherwise clicking delete also starts a drag.

7. **`key={activeVP}` on the preview iframe** forces a full remount on viewport switch. Without it the iframe keeps the old layout at the new width.

---

*Built with The Bridge — Project 1: Website Generator*
