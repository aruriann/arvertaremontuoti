# Deployment Notes

## Project structure

```
arvertaremontuoti/          ← repo root
  index.html                ← frontend
  app.js
  styles.css
  404.html
  manifest.json
  robots.txt
  sitemap.xml
  .gitignore
  README.md
  CLAUDE.md                 ← Claude Code project instructions (must stay in root)

  docs/                     ← project documentation
    DEPLOYMENT_NOTES.md
    SECURITY_NOTES.md
    TEST.md
    TESTS.md

  backend/                  ← Node.js API
    package.json
    .env.example            ← committed (no secrets)
    .env                    ← NOT committed (real secrets)
    src/
      server.js
      app.js
      db.js
      routes/
      controllers/
      services/
      validators/
      middleware/
      scripts/
      sql/
```

---

## Local development

Frontend is served by VS Code Live Server (or any static server) on port 5500.
Backend runs on port 3000.

`app.js` uses a runtime check to pick the right API base URL:

```js
const API_BASE_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : '';
```

- **Locally:** frontend is on port 5500, backend on port 3000 — different origins.
  `API_BASE_URL` becomes `http://localhost:3000`, so the fetch goes directly to
  the backend. CORS allows this because `FRONTEND_ORIGIN=http://127.0.0.1:5500`
  is set in `backend/.env`.

- **Production:** frontend and API are on the same domain via nginx proxy.
  `API_BASE_URL` becomes `""`, so the fetch uses a relative `/api/leads` URL.
  nginx routes `/api/` to Node.js on `localhost:3000`. No CORS headers needed —
  it is a same-origin request from the browser's perspective.

**`FRONTEND_ORIGIN` values:**

| Environment | Value |
|---|---|
| Local dev | `http://127.0.0.1:5500` |
| Production | `https://arvertaremontuoti.lt` |

Set the correct value in `backend/.env` for each environment.

### Start backend locally

```bash
cd backend
npm run dev
# Server running on port: 3000
```

### Verify DB connection

```
GET http://localhost:3000/api/health
→ { "ok": true, "service": "arvertaremontuoti-api", "db": "up" }
```

### Test lead submission

Open index.html in Live Server, fill the calculator, submit the lead form.
Check PostgreSQL:

```sql
SELECT id, lead_type, city, contact, created_at FROM leads ORDER BY created_at DESC LIMIT 5;
```

---

## Hetzner VPS architecture

```
Browser
  │
  ▼  HTTPS :443
nginx  ─────────────────────────────────────────┐
  │                                             │
  │  location /        → static files           │
  │  /var/www/arvertaremontuoti/                 │
  │  (index.html, app.js, styles.css, ...)       │
  │                                             │
  │  location /api/    → proxy localhost:3000    │
  └────────────────────────────────────────────┘
                              │
                              ▼
                    PM2 → Node.js :3000
                    /opt/arvertaremontuoti-api/
                              │
                              ▼
                    PostgreSQL :5432 (localhost only)
```

Frontend static files are served directly by nginx — no Node.js involved.
The API is behind nginx proxy. PostgreSQL is never exposed to the internet.

---

## nginx config (future)

```nginx
# /etc/nginx/sites-available/arvertaremontuoti

server {
    listen 80;
    server_name arvertaremontuoti.lt www.arvertaremontuoti.lt;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name arvertaremontuoti.lt www.arvertaremontuoti.lt;

    root /var/www/arvertaremontuoti;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    # ssl_certificate lines managed by certbot
}
```

With this setup, API calls work correctly in both environments with no code
changes at deploy time — `API_BASE_URL` in `app.js` handles the difference
automatically based on `window.location.hostname`.

---

## Paths on the server

| What | Path |
|---|---|
| Frontend static files | `/var/www/arvertaremontuoti/` |
| Backend app | `/opt/arvertaremontuoti-api/backend/` |
| nginx config | `/etc/nginx/sites-available/arvertaremontuoti` |
| PM2 process name | `arvertaremontuoti-api` |
| PostgreSQL DB name | `arvertaremontuoti` |

---

## Deploy steps (future, first time)

```bash
# 1. On server: create DB
sudo -u postgres psql
CREATE DATABASE arvertaremontuoti;
CREATE USER apiuser WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE arvertaremontuoti TO apiuser;

# 2. Deploy backend
git clone <repo> /opt/arvertaremontuoti-api
cd /opt/arvertaremontuoti-api/backend
npm install --production
cp .env.example .env
nano .env          # fill real values
node src/scripts/initDb.js
pm2 start src/server.js --name arvertaremontuoti-api
pm2 save && pm2 startup

# 3. Deploy frontend
cp index.html app.js styles.css 404.html manifest.json robots.txt sitemap.xml \
   /var/www/arvertaremontuoti/

# 4. nginx + SSL
ln -s /etc/nginx/sites-available/arvertaremontuoti /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d arvertaremontuoti.lt -d www.arvertaremontuoti.lt

# 5. Verify
curl https://arvertaremontuoti.lt/api/health
```

## Update workflow (after first deploy)

```bash
# Frontend change:
scp app.js styles.css index.html user@<IP>:/var/www/arvertaremontuoti/

# Backend change:
ssh user@<IP>
cd /opt/arvertaremontuoti-api && git pull
cd backend && npm install --production
pm2 restart arvertaremontuoti-api
```
