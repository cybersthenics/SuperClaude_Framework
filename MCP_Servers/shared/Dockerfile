# Shared Services Infrastructure - Production Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    jq \
    git \
    python3 \
    make \
    g++

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S superclaude -u 1001

# Create necessary directories
RUN mkdir -p /app/logs /app/cache /app/data && \
    chown -R superclaude:nodejs /app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Switch to non-root user
USER superclaude

# Expose ports
EXPOSE 8080 9090

# Environment variables
ENV NODE_ENV=production
ENV LOG_LEVEL=info
ENV CACHE_SIZE=512MB
ENV MAX_CONNECTIONS=1000

# Start the services
CMD ["node", "dist/services/index.js"]