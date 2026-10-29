# ==============================================================================
# Google Cloud Run Multi-Stage Dockerfile for OptiGreen
# Optimized for Google Cloud Console, Cloud Build, and Artifact Registry
# ==============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies including devDependencies for build
RUN npm ci

# Copy application source code
COPY . .

# Build Vite frontend and bundle server with esbuild
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Create unprivileged application user
RUN addgroup -g 1001 -S nodejs && adduser -S optigreen -u 1001

# Copy bundled server, built frontend assets, and production dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

USER optigreen

EXPOSE 8080

CMD ["node", "dist/server.cjs"]
