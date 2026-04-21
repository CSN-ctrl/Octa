# ChaosStar — production deployment (current tree)

**Last updated:** 2026 (Octa-only repository layout)

The **only** application code shipped in this repository is the Octa web client:

`ChaosStar/stuff/Octa-758dd321db5a23889f15871624cfb035465e77ab/`

Older versions of this guide described a Go VM (`chaosstarvm`), AvalancheGo forks, and a separate Go backend. Those components **are not in this repo** anymore. If you need that stack, recover it from git history or a separate repository.

---

## Build the Octa app

From the repository root:

```bash
cd ChaosStar/stuff/Octa-758dd321db5a23889f15871624cfb035465e77ab
npm ci
npm run build
```

The static site is emitted to `dist/`. Deploy that directory to your host (Vercel, Netlify, Cloudflare Pages, S3 + CloudFront, nginx, etc.).

Use `npm install` instead of `npm ci` only if you intentionally omit a lockfile.

---

## Environment and Supabase

- Copy or create env files as described in the Octa app’s `README.md` (typically `VITE_*` variables and Supabase URL/anon key).
- Apply database migrations using the Supabase CLI or your hosted project workflow (`supabase/` in the Octa directory).

---

## Example: nginx for a static SPA

After copying `dist/` to the server (for example `/var/www/octa`):

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/octa;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Add TLS (for example Certbot) before production traffic.

---

## Historical reference

If you are reading an old export or PDF that mentions `chaosstarvm`, systemd units named `chaosstarvm.service`, or `go test ./actions/...`, those instructions applied to **removed** code and are **not valid** for the current tree.

See also [README.md](README.md) and [QUICK_START.md](QUICK_START.md).
