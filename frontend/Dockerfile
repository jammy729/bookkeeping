# Frontend Production Dockerfile
# Multi-stage build: Vite build → nginx serving
# Build context: repository root

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Enable corepack to use pnpm
RUN corepack enable

# Copy workspace config + lockfiles
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY frontend/package.json ./frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy frontend source code
COPY frontend ./frontend/

# Build the app (VITE_API_URL is injected at build time)
ARG VITE_API_URL=/api
RUN pnpm --filter bookkeeping-frontend build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
