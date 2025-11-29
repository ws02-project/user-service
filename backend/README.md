# Backend README

## Express.js Backend with Asgardeo JWT Validation

This backend server validates JWT tokens from Asgardeo and implements role-based access control.

## Features

- **JWT Validation**: Validates access tokens using JWKS
- **RBAC**: Role-based access control middleware
- **CORS**: Enabled for frontend communication
- **Error Handling**: Proper error responses

## Endpoints

### Public Endpoint
```
GET /api/public
```
No authentication required. Returns a public message.

### Private Endpoint
```
GET /api/private
Authorization: Bearer <JWT_TOKEN>
```
Requires valid JWT token. Returns user information.

### Admin Endpoint
```
GET /api/admin
Authorization: Bearer <JWT_TOKEN>
```
Requires valid JWT token AND Admin role. Returns admin-specific data.

## Running the Server

```bash
npm start
```

Server will start on `http://localhost:8080`

## Development Mode

```bash
npm run dev
```

Uses nodemon for auto-reload on file changes.

## How JWT Validation Works

1. Client sends request with `Authorization: Bearer <token>` header
2. `checkJwt` middleware extracts and validates token using JWKS
3. If valid, token data is attached to `req.auth`
4. `checkRole` middleware (if present) checks for required roles
5. Request proceeds to route handler or returns error

## Environment Variables

Create a `.env` file with:

```
ASGARDEO_CLIENT_ID=your-client-id
ASGARDEO_JWKS_URI=your-jwks-uri
ASGARDEO_ISSUER=your-issuer-url
PORT=8080
```
