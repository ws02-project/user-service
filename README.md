# User Service

User authentication and management microservice with Asgardeo (WSO2 Identity) integration and RBAC.

## Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js 24 LTS |
| Language | TypeScript |
| Framework | Express.js |
| Database | PostgreSQL + TypeORM |
| API | REST + gRPC |
| Messaging | RabbitMQ |
| Auth | Asgardeo (OIDC/OAuth2) |
| Validation | Joi |
| Testing | Jest + Supertest |

## Ports

| Service | Port |
|---------|------|
| HTTP API | 3002 |
| gRPC | 50053 |

## Quick Start

### Docker (Recommended)

```bash
docker-compose up -d
```

### Local Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev:local
```

## API Endpoints

### REST API

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/health` | Health check | Public |
| GET | `/api/v1/users/me` | Current user profile | Authenticated |
| PATCH | `/api/v1/users/me` | Update profile | Authenticated |
| GET | `/api/v1/users` | List all users | Admin |
| GET | `/api/v1/users/:id` | Get user by ID | Admin |
| PATCH | `/api/v1/users/:id` | Update user | Admin |
| DELETE | `/api/v1/users/:id` | Delete user | Admin |
| GET | `/api/v1/users/statistics` | User statistics | Admin |

### gRPC Methods

| Method | Description |
|--------|-------------|
| GetUser | Get user by ID |
| GetUserBySubject | Get user by Asgardeo subject |
| GetUsers | List users |
| SyncUser | Create/update user from token |
| ValidateToken | Validate JWT token |
| GetUsersByOrganization | Get org users |

## Events Published

| Event | Routing Key |
|-------|-------------|
| User Created | `user.created` |
| User Updated | `user.updated` |
| Role Changed | `user.role_changed` |
| Status Changed | `user.status_changed` |

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=3002
GRPC_PORT=50053
SERVICE_NAME=user-service

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=userdb
DB_USER=useruser
DB_PASSWORD=userpass

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672

# Asgardeo
ASGARDEO_ISSUER=https://api.asgardeo.io/t/{org}/oauth2/token
ASGARDEO_JWKS_URI=https://api.asgardeo.io/t/{org}/oauth2/jwks
ASGARDEO_CLIENT_ID=your_client_id
ASGARDEO_AUDIENCE=your_audience
```

## Project Structure

```
src/
├── config/           # Configuration
├── controllers/      # HTTP handlers
├── services/         # Business logic (user, asgardeo)
├── models/           # Database entities
├── routes/           # API routes
├── validations/      # Joi schemas
├── grpc/             # gRPC server
├── messaging/        # RabbitMQ EventBus
├── middlewares/      # Auth, validation, error handling
├── utils/            # Utilities (logger, ApiError, catchAsync)
└── __tests__/        # Tests (unit + integration)
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start with Docker |
| `pnpm dev:local` | Start locally with hot reload |
| `pnpm build` | Build TypeScript |
| `pnpm start` | Start production |
| `pnpm test` | Run tests |
| `pnpm lint` | Lint code |
| `pnpm migration:run` | Run migrations |

## Testing

```bash
# Run all tests
pnpm test

# With coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

## License

ISC
