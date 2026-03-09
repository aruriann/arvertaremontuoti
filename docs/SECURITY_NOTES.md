# Security Notes

## .env — never commit real secrets

`backend/.env` is in `.gitignore` and must never be committed.
`backend/.env.example` is committed and contains only placeholder values.

If `.env` was ever committed by mistake:
```bash
git rm --cached backend/.env
git commit -m "remove accidentally committed .env"
# Then rotate ALL secrets that were exposed (DB password, tokens)
```

Verify nothing sensitive is tracked:
```bash
git ls-files backend/.env   # must return nothing
git log --all --full-history -- backend/.env  # check history too
```

---

## Rotate exposed secrets immediately

If a real password or token was ever in git history, assume it is compromised.

1. PostgreSQL — change the DB user password:
   ```sql
   ALTER USER apiuser WITH PASSWORD 'new_strong_password';
   ```
   Then update `DATABASE_URL` in `.env`.

2. Telegram bot token — revoke via `@BotFather` → `/revoke` → create new token.

3. Any other token/key in `.env` — treat as compromised, regenerate.

---

## PostgreSQL — localhost only

PostgreSQL must never be exposed to the internet.
Check that `pg_hba.conf` and `postgresql.conf` only allow local connections.

```bash
# postgresql.conf
listen_addresses = 'localhost'
```

From the app, always connect via `localhost` in `DATABASE_URL`, not a public IP.

---

## Server — non-root user

Never run the Node.js process as root.
After setting up the VPS:

```bash
adduser deploy
usermod -aG sudo deploy
# Use deploy user for all app operations
```

PM2 and the Node process run as `deploy`, not `root`.

---

## HTTPS

Use Let's Encrypt via certbot. Certbot renews automatically.

```bash
certbot --nginx -d arvertaremontuoti.lt -d www.arvertaremontuoti.lt
# Auto-renewal is set up by certbot. Verify with:
systemctl status certbot.timer
```

Never serve the API or frontend over plain HTTP in production.
nginx config redirects all HTTP → HTTPS (301).

---

## Firewall

On the VPS, only expose ports 22 (SSH), 80 (HTTP→redirect), 443 (HTTPS).
Block everything else.

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

Port 3000 (Node.js) and 5432 (PostgreSQL) must NOT be open externally.
They are accessed only via nginx proxy and localhost respectively.

---

## Rate limiting

`express-rate-limit` is configured on `POST /api/leads`:
- 10 requests per 15 minutes per IP.

If spam becomes a problem, tighten the window or add IP blocking at nginx level.

---

## What is safe to commit

| File | Commit? |
|---|---|
| `backend/.env.example` | ✅ yes — only placeholders |
| `backend/.env` | ❌ never |
| `backend/src/**` | ✅ yes |
| `backend/node_modules/` | ❌ never |
| `index.html`, `app.js`, `styles.css` | ✅ yes |
| `.gitignore` | ✅ yes |
| `DEPLOYMENT_NOTES.md` | ✅ yes |
| `SECURITY_NOTES.md` | ✅ yes |
