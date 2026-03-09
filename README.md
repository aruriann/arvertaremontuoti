# Ar verta remontuoti?

Calculator that helps drivers decide if repairing a car is economically worth it.

**Live site:** [arvertaremontuoti.lt](https://arvertaremontuoti.lt)

## Stack

- Frontend: HTML + CSS + Vanilla JS (no frameworks)
- Backend: Node.js + Express
- Database: PostgreSQL

## Structure

```
/               → static frontend (served by nginx in production)
/backend        → Node.js API (Express + pg)
/docs           → project documentation
```

## Local development

**Frontend** — open with VS Code Live Server or any static server.

**Backend:**

```bash
cd backend
cp .env.example .env   # fill in real values
npm install
npm run db:init        # creates tables (run once)
npm run dev            # starts on port 3000
```

Check: `http://localhost:3000/api/health`

## Documentation

- [Deployment notes](docs/DEPLOYMENT_NOTES.md) — Hetzner VPS setup, nginx config, deploy steps
- [Security notes](docs/SECURITY_NOTES.md) — .env rules, secrets rotation, firewall
- [Manual tests](docs/TESTS.md) — test checklist for calculator and lead form
- [Test cases](docs/TEST.md) — detailed test scenarios
