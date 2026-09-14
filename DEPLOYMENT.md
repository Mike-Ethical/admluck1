# Deploy AdmLuck with Supabase and Render

## 1. Initialize Supabase

1. Open the Supabase dashboard and select the project.
2. Open **SQL Editor** and run
   `supabase/migrations/20260914180000_create_admluck_state.sql`.
3. Open **Project Settings → API Keys**.
4. Copy the project URL and create a server-only secret key.

The secret key bypasses row-level security. Keep it only in the web service
environment and never expose it through Vite, browser code, source control, or
screenshots.

## 2. Deploy the web service

The repository includes a Render Blueprint in `render.yaml`.

1. Push or merge the deployment branch to GitHub.
2. In Render, choose **New → Blueprint** and connect this repository.
3. Enter the environment values requested by the Blueprint:
   - `SUPABASE_URL`: the Supabase project URL.
   - `SUPABASE_SECRET_KEY`: the server-only Supabase secret key.
   - `APP_URL`: the Render service URL. This can be updated after the first
     service URL is assigned.
   - `GEMINI_API_KEY`: optional until Gemini-backed features are enabled.
4. Deploy the Blueprint.

Render generates `SESSION_SECRET`, sets Node 22, builds with
`npm ci && npm run build`, and starts the service with `npm start`.

Keep the service at one running instance. The current persistence layer stores
the application state as one serialized row and does not coordinate writes
across multiple server instances.

## 3. Verify the deployment

Open `/api/health` on the deployed service. A connected deployment returns:

```json
{
  "status": "ok",
  "database": "supabase"
}
```

If the health endpoint reports `memory`, the Supabase variables are absent. If
startup reports that persistence is not initialized, apply the SQL migration
before redeploying.

## Local commands

```bash
nvm use
npm ci
npm run build
npm start
```

Without Supabase variables, local development intentionally uses temporary
in-memory state. Production requires `SESSION_SECRET` and should always be
configured with Supabase.
