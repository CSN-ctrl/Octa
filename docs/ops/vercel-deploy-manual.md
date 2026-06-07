# Vercel Fuji deploy (manual)

Cloud agents do not have `VERCEL_TOKEN`. Run locally or in CI with secrets:

```bash
export VERCEL_TOKEN="<your-token>"
npm run vercel:env:fuji
npm run vercel:deploy:prod
```

Confirm env: `VITE_PHASE1_DASHBOARD_ONLY=true`, chain `43113`, R3F universe enabled.
