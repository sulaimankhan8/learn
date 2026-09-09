# ==========================================
# STAGE 1: Dependency resolution & compilation
# ==========================================
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ==========================================
# STAGE 2: Hardened Minimal Production Runner
# ==========================================
FROM node:20-alpine AS runner

LABEL maintainer="docker-mastery-course"
LABEL version="1.0.0"

# Install dumb-init for Linux PID 1 signal forwarding
RUN apk add --no-cache dumb-init

WORKDIR /usr/src/app

ENV NODE_ENV=production \
    PORT=3000

# Copy only production dependencies from deps stage
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node src/ ./src/

# Security: Run as unprivileged user
USER node

EXPOSE 3000

HEALTHCHECK --interval=20s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "src/server.js"]
