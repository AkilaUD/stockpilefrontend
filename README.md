# Stockpile frontend

Next.js 16 App Router app for Stockpile.lk. Source lives under `src/app/[locale]/`.

For the full local stack (API, Worker, env, Playwright), see the workspace
[`README.md`](../README.md).

```powershell
Copy-Item ..\.env.example .env.local   # set API_ORIGIN=http://localhost:5080
npm install
npm run dev                            # http://localhost:3000
```

Production builds need `API_ORIGIN` at **build** and **runtime** (rewrites are
captured at build time). CI: `.github/workflows/frontend-ci.yml`.
