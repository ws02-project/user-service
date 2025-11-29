# Backend - Express.js API

Detailed backend documentation with JWT validation and RBAC.

## Quick Start
```bash
npm install
npm start
```

## Endpoints
- `GET /api/public` - No auth
- `GET /api/private` - JWT required
- `GET /api/admin` - JWT + Admin role required

See main README.md for full documentation.
