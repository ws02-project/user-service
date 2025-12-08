# User Service

User authentication and management microservice with Asgardeo (WSO2 Identity) integration.

## Features

- **Asgardeo Integration**: JWT validation using JWKS (JSON Web Key Set)
- **User Sync**: Automatically creates/updates users from Asgardeo token claims
- **Role-Based Access Control (RBAC)**: User, Manager, Admin roles
- **gRPC Support**: Inter-service communication via gRPC
- **Event-Driven**: RabbitMQ event bus for user lifecycle events
- **PostgreSQL**: Persistent user storage with TypeORM

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Asgardeo      │────▶│  User Service   │
│   (React)       │     │   (OIDC/OAuth)  │     │  (Auth Gateway) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                        ┌───────────────────────────────┼───────────────────────────────┐
                        │                               │                               │
                        ▼                               ▼                               ▼
               ┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
               │  Task Service   │             │ Project Service │             │ Notification    │
               │  (gRPC Client)  │             │  (gRPC Client)  │             │    Service      │
               └─────────────────┘             └─────────────────┘             └─────────────────┘
```

## API Endpoints

### Public (Authenticated)
- `GET /api/v1/users/me` - Get current user profile
- `PATCH /api/v1/users/me` - Update current user profile

### Admin Only
- `GET /api/v1/users` - List all users (paginated)
- `GET /api/v1/users/:id` - Get user by ID
- `GET /api/v1/users/subject/:subject` - Get user by Asgardeo subject
- `GET /api/v1/users/organization/:organizationId` - Get users by organization
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user
- `GET /api/v1/users/statistics` - Get user statistics

### Health
- `GET /api/v1/health` - Health check

## gRPC Services

```protobuf
service UserService {
  rpc GetUser(GetUserRequest) returns (GetUserResponse);
  rpc GetUserBySubject(GetUserBySubjectRequest) returns (GetUserResponse);
  rpc GetUsers(GetUsersRequest) returns (GetUsersResponse);
  rpc SyncUser(SyncUserRequest) returns (SyncUserResponse);
  rpc ValidateToken(ValidateTokenRequest) returns (ValidateTokenResponse);
  rpc GetUsersByOrganization(GetUsersByOrganizationRequest) returns (GetUsersResponse);
}
```

## Environment Variables

```env
# Server
PORT=3002
GRPC_PORT=50053
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=userdb
DB_USER=useruser
DB_PASSWORD=userpass

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672

# Asgardeo (WSO2 Identity)
ASGARDEO_ISSUER=https://api.asgardeo.io/t/{org_name}/oauth2/token
ASGARDEO_JWKS_URI=https://api.asgardeo.io/t/{org_name}/oauth2/jwks
ASGARDEO_CLIENT_ID=your_client_id
ASGARDEO_AUDIENCE=your_audience
```

## Quick Start

### Development with Docker

```bash
# Start all services (PostgreSQL, RabbitMQ, User Service)
docker-compose up --build

# Or using the dev script
./scripts/dev.sh
```

### Local Development

```bash
# Install dependencies
pnpm install

# Start in development mode
pnpm dev:local
```

## Asgardeo Setup

1. Create an application in [Asgardeo Console](https://console.asgardeo.io/)
2. Configure OAuth2/OIDC settings
3. Get your Client ID and configure the JWKS URI
4. Set the environment variables

## Events Published

| Event | Routing Key | Description |
|-------|-------------|-------------|
| UserCreatedEvent | user.created | New user registered |
| UserUpdatedEvent | user.updated | User profile updated |
| UserRoleChangedEvent | user.role_changed | User role modified |
| UserStatusChangedEvent | user.status_changed | User status changed |

## Inter-Service Communication

Other services can validate tokens and get user info via gRPC:

```typescript
// Example: Task Service validating a token
const response = await userServiceClient.ValidateToken({ access_token: token });
if (response.valid) {
  console.log('User:', response.user);
}
```

## License

ISC

