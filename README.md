# Tijara.dz — دليل المتاجر الإلكترونية الجزائري

Algerian e-commerce directory platform: sellers create store pages, buyers browse, and an AI assistant helps find stores.

## Architecture

| Layer     | Tech                          | Location     | Production host |
|-----------|-------------------------------|--------------|-----------------|
| Frontend  | React 19 + Vite 8 + Firebase  | `frontend/`  | Vercel          |
| Backend   | Express.js (Node 18+)         | `backend/`   | Render          |
| Database  | Firebase Firestore + Auth     | —            | Firebase (Google) |
| AI        | OpenAI API (optional)         | backend      | via env var     |
| Images    | imgbb / Cloudinary / catbox   | backend      | via env vars    |

The frontend is a SPA that talks to Firebase directly for data and to the Express backend for two features:

- `/api/ai-agent` — AI intent extraction for the AI Assistant
- `/api/upload-image` — image hosting (base64 upload, server relays to imgbb/Cloudinary/catbox)

## Local Development

Prerequisites: Node.js 18+, npm, and a Firebase project.

1. Install all dependencies (root, backend, frontend):

   ```bash
   npm run install-all
   ```

2. Configure Firebase (public config):

   ```bash
   cp frontend/.env.example frontend/.env
   # Fill in your Firebase values (Project settings -> General in Firebase console)
   ```

3. Configure the backend:

   ```bash
   cp backend/.env.example backend/.env
   # Optional: add OPENAI_API_KEY, IMGBB_API_KEY / CLOUDINARY_* keys
   ```

4. Start both servers (frontend on `http://localhost:5173`, backend on `http://localhost:5000`):

   ```bash
   npm run dev
   ```

5. Deploy Firestore rules and indexes (optional but recommended):

   ```bash
   npx firebase-tools deploy --only firestore
   ```

## Deployment

### 1. Backend → Render (free)

1. Push this repo to GitHub.
2. Go to [render.com](https://render.com) → **New → Blueprint** and select the repo.
   - Render reads `render.yaml` automatically: web service `tijara-dz-backend`, root dir `backend`, start command `node server.js`.
3. Render will ask you to set the **secret** env vars (marked `sync: false`):
   - `OPENAI_API_KEY` (optional, for the AI assistant)
   - `OPENAI_MODEL` (optional, default `gpt-4.1-mini`)
   - `IMGBB_API_KEY` (optional, image upload)
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_PRESET` (optional alternative)
4. After the first deploy, Render gives you a URL like `https://tijara-dz-backend.onrender.com`.
5. Update the `CORS_ORIGIN` env var on Render to your **actual Vercel frontend URL** (e.g. `https://tijara-dz.vercel.app`).

Alternatively, deploy manually: **New → Web Service** → select repo → root directory `backend` → build `npm install` → start `node server.js` → add the same env vars.

### 2. Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → import the same GitHub repo.
2. **Root directory**: `frontend`
3. Framework preset: **Vite** (auto-detected).
4. Build command: `npm run build` — output directory: `dist` (auto-detected).
5. Add these **Environment Variables** (same values as your local `frontend/.env`):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_API_URL` = your Render URL, e.g. `https://tijara-dz-backend.onrender.com`
6. Deploy. `frontend/vercel.json` handles SPA fallback automatically.

### 3. Firebase (one-time setup)

- Create the Firebase project (or reuse `tijara-dz-8`).
- Enable **Email/Password** authentication in Firebase console → Authentication → Sign-in method.
- Deploy Firestore rules & indexes:

  ```bash
  npx firebase-tools deploy --only firestore
  ```

- Create at least one admin document to unlock the admin dashboard:

  ```
  Collection: admins
  Document ID: <uid of the admin user>
  Field: role = "admin"
  ```

### 4. Post-deploy checks

- `https://<your-app>.vercel.app` loads the site.
- `https://<your-backend>.onrender.com/api/message` returns `{"status":"success",...}`.
- On the site, the AI Assistant and image uploads work (they call `VITE_API_URL`).
- CORS errors mean the `CORS_ORIGIN` on Render doesn't match your Vercel URL.

## Env var summary

| Var (backend)              | Purpose                            | Required |
|----------------------------|------------------------------------|----------|
| `PORT`                     | Port (Render sets it automatically)| No       |
| `NODE_ENV`                 | Environment mode                   | No       |
| `CORS_ORIGIN`              | Comma-separated allowed frontends  | Yes (prod) |
| `OPENAI_API_KEY`           | AI Assistant                        | No (fallback works) |
| `OPENAI_MODEL`             | AI model name                      | No       |
| `IMGBB_API_KEY`            | Image upload (imgbb)               | No       |
| `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_UPLOAD_PRESET` | Image upload (Cloudinary) | No |

| Var (frontend)             | Purpose                            | Required |
|----------------------------|------------------------------------|----------|
| `VITE_FIREBASE_*`          | Firebase public config             | Yes      |
| `VITE_API_URL`             | Backend base URL (prod)            | Yes (prod) |

> All secrets live only in platform env vars. `.env` files are gitignored; never commit them.

## Scripts

| Command (root)     | What it does                              |
|--------------------|-------------------------------------------|
| `npm run install-all` | Installs root + backend + frontend deps |
| `npm run dev`      | Runs backend (nodemon) + frontend (Vite) concurrently |
| `npm run dev:backend` | Backend only                        |
| `npm run dev:frontend` | Frontend only                      |

## License

Private project — all rights reserved.
