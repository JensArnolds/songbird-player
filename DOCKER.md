# Docker Deployment Guide

Complete guide for running Songbird Frontend in Docker containers.

## Quick Start

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 2GB+ available RAM
- 5GB+ available disk space

### Production Deployment (External Database)

The default setup uses your existing `.env` file with an external database (Neon/Aiven):

```bash
# Start the application
docker compose up -d

# View logs
docker compose logs -f app

# Stop the application
docker compose down
```

Access the application at http://localhost:3222

### Production Deployment (Local PostgreSQL)

For local PostgreSQL database instead of external:

```bash
# Start app + PostgreSQL
docker compose -f docker-compose.local.yml up -d

# View logs
docker compose -f docker-compose.local.yml logs -f app

# Access PostgreSQL CLI
docker compose -f docker-compose.local.yml exec db psql -U songbird -d songbird

# Stop all services
docker compose -f docker-compose.local.yml down
```

## Architecture

### Default Setup (docker-compose.yml)

**Services:**
- **app** - Next.js application container
  - Port: 3222
  - Database: External (from .env)
  - Health check: `/api/health`
  - Auto-restart on failure

**Environment:**
- Loads all variables from `.env` file
- No manual configuration needed
- Works with existing Neon/Aiven database

### Local Database Setup (docker-compose.local.yml)

**Services:**
- **app** - Next.js application
- **db** - PostgreSQL 16 Alpine
  - Port: 5432 (exposed for local tools)
  - Persistent volume: `postgres_data`
  - Health check: `pg_isready`

## Makefile Commands

### Production (External Database)

```bash
make build      # Build Docker images
make up         # Start app (uses external DB)
make down       # Stop app
make restart    # Restart app
make logs       # View application logs
make shell      # Access app container shell
make migrate    # Run database migrations
```

### Production (Local Database)

```bash
make up-local   # Start app + local PostgreSQL
make down-local # Stop all services
make db-shell   # Access PostgreSQL CLI
```

### Utilities

```bash
make clean      # Remove all containers, volumes, and images
make help       # Show all available commands
```

## Environment Configuration

The Docker setup uses your existing `.env` file. No additional configuration needed.

**Required variables (already in your .env):**
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - NextAuth session secret
- `AUTH_DISCORD_ID` - Discord OAuth app ID
- `AUTH_DISCORD_SECRET` - Discord OAuth secret
- `NEXTAUTH_URL` - Application URL
- `NEXT_PUBLIC_API_URL` - External music API URL
- `STREAMING_KEY` - API authentication key

## Docker Image Details

**Multi-stage Build:**
1. **base** - Node.js 25.2.0 Alpine + PostgreSQL client
2. **deps** - Install dependencies
3. **builder** - Build Next.js application
4. **runner** - Production runtime (~450MB)

**Security:**
- Non-root user (nextjs:1001)
- Minimal attack surface (Alpine Linux)
- Read-only volume mounts
- Health checks enabled

**Optimizations:**
- Multi-stage build for smaller images
- Layer caching for faster builds
- Standalone Next.js output
- Automatic migrations on startup

## Database Management

### External Database (Neon/Aiven)

Migrations run automatically on container startup via the entrypoint script.

**Manual migration:**
```bash
docker compose exec app npx drizzle-kit push
```

### Local Database

**Access PostgreSQL:**
```bash
make db-shell
# or
docker compose -f docker-compose.local.yml exec db psql -U songbird -d songbird
```

**Backup database:**
```bash
docker compose -f docker-compose.local.yml exec db pg_dump -U songbird songbird > backup.sql
```

**Restore database:**
```bash
docker compose -f docker-compose.local.yml exec -T db psql -U songbird songbird < backup.sql
```

## Health Checks

The application includes built-in health monitoring:

```bash
curl http://localhost:3222/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-01T...",
  "uptime": 3600,
  "memory": {
    "heapUsed": 150,
    "heapTotal": 200,
    "rss": 300
  }
}
```

Docker automatically restarts the container if health checks fail.

## Troubleshooting

### Container won't start

```bash
# Check logs
docker compose logs app

# Common issues:
# 1. Port 3222 already in use - change PORT in .env
# 2. Missing .env file - ensure .env exists with required variables
# 3. Database connection failed - verify DATABASE_URL in .env
```

### Database connection failed

```bash
# For external database:
# 1. Verify DATABASE_URL format in .env
# 2. Check database is accessible from your network
# 3. Confirm SSL settings (?sslmode=require)

# For local database:
docker compose -f docker-compose.local.yml ps  # Verify db container is healthy
docker compose -f docker-compose.local.yml logs db  # Check database logs
```

### Migrations not running

```bash
# Run manually
docker compose exec app npx drizzle-kit push

# Check migration files exist
docker compose exec app ls -la /app/drizzle
```

### Fresh start (reset everything)

```bash
# WARNING: Deletes all data
docker compose down -v
docker compose -f docker-compose.local.yml down -v
docker system prune -a
docker compose up -d --build
```

## Production Deployment Checklist

- [x] `.env` file configured with production values
- [x] `AUTH_SECRET` is secure (not default value)
- [x] `NEXTAUTH_URL` set to production domain
- [x] Discord OAuth redirect configured: `https://yourdomain.com/api/auth/callback/discord`
- [ ] Reverse proxy configured (nginx/Caddy) for HTTPS
- [ ] Firewall rules configured (only expose 443, 80)
- [ ] Automated backups enabled (if using local database)
- [ ] Monitoring/alerting configured
- [ ] SSL certificates configured

## Reverse Proxy Setup

### Nginx

```nginx
server {
    listen 80;
    server_name starchildmusic.com;

    location / {
        proxy_pass http://localhost:3222;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Caddy

```caddy
starchildmusic.com {
    reverse_proxy localhost:3222
}
```

## Performance Monitoring

**Resource usage:**
```bash
docker stats
```

**Container logs:**
```bash
# Follow logs
docker compose logs -f app

# Last 100 lines
docker compose logs --tail=100 app

# Since timestamp
docker compose logs --since 2026-02-01T00:00:00 app
```

**Configure log rotation:**
```yaml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## CI/CD Integration

GitHub Actions workflow is included at `.github/workflows/docker-build.yml`:

- Builds and tests on push/PR
- Caches Docker layers
- Pushes to Docker Hub on main branch (configurable)

**Required secrets:**
- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub password/token
- `AUTH_SECRET` - For testing
- `AUTH_DISCORD_ID` - For testing
- `AUTH_DISCORD_SECRET` - For testing

## Security Best Practices

1. **Never commit `.env`** - Contains sensitive credentials
2. **Run as non-root** - Already configured (user `nextjs`)
3. **Use secrets management** - For production environments
4. **Update regularly** - Rebuild with latest base images
5. **Network isolation** - Use Docker networks for multi-service setups
6. **Scan images** - `docker scan songbird-frontend-app`

## Migration from Non-Docker

### Export existing data

If you have an existing deployment:

```bash
# Backup database (if using local PostgreSQL)
pg_dump -U postgres songbird > songbird_export.sql
```

### Import to Docker

```bash
# Start Docker services with local database
docker compose -f docker-compose.local.yml up -d db
sleep 10

# Import data
docker compose -f docker-compose.local.yml exec -T db psql -U songbird songbird < songbird_export.sql

# Start app
docker compose -f docker-compose.local.yml up -d app
```

## Support

For issues:
1. Check logs: `docker compose logs -f app`
2. Verify health: `curl http://localhost:3222/api/health`
3. Review this documentation
4. Check GitHub issues

## License

Same as main project (see [LICENSE](LICENSE))
