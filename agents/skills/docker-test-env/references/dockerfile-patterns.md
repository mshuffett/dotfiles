# Dockerfile Patterns

Per-language Dockerfile templates for generating Dockerfiles when a codebase doesn't have one.

## Node.js (Multi-Stage)

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* bun.lockb* ./
RUN if [ -f pnpm-lock.yaml ]; then corepack enable && pnpm install --frozen-lockfile; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    elif [ -f bun.lockb ]; then npm install -g bun && bun install --frozen-lockfile; \
    else npm ci; fi

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
USER node
EXPOSE 3000
CMD ["npm", "start"]
```

## Next.js (Standalone Output)

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN if [ -f pnpm-lock.yaml ]; then corepack enable && pnpm install --frozen-lockfile; \
    else npm ci; fi

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
```

**Requires** `output: "standalone"` in `next.config.js`.

## Python (pip)

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
USER nobody
EXPOSE 8000
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:8000"]
```

## Python (Poetry)

```dockerfile
FROM python:3.12-slim
WORKDIR /app
RUN pip install poetry && poetry config virtualenvs.create false
COPY pyproject.toml poetry.lock ./
RUN poetry install --no-dev --no-interaction
COPY . .
USER nobody
EXPOSE 8000
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:8000"]
```

## Django

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN python manage.py collectstatic --noinput 2>/dev/null || true
USER nobody
EXPOSE 8000
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

## Go (Multi-Stage)

```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/app .

FROM alpine:3.19
RUN apk add --no-cache ca-certificates
COPY --from=builder /bin/app /bin/app
USER nobody
EXPOSE 8080
CMD ["/bin/app"]
```

## Static Site (nginx)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf 2>/dev/null || true
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Key Rules

1. **Always copy dependency manifests before source** — enables Docker layer caching
2. **Use slim/alpine base images** — smaller attack surface, faster pulls
3. **Run as non-root** (`USER node`, `USER nobody`) — security best practice
4. **Expose the correct port** — must match what the app listens on
5. **Use multi-stage builds** for compiled languages — keeps final image small
6. **Set `NODE_ENV=production`** for Node.js — enables optimizations, disables dev deps
