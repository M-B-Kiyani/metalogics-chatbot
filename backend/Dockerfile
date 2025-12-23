# Backend Dockerfile
FROM node:20-alpine

# Install curl for health check
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE $PORT

# Health check script that uses PORT environment variable
RUN echo '#!/bin/sh\ncurl -f http://0.0.0.0:${PORT:-3000}/health || exit 1' > /healthcheck.sh && chmod +x /healthcheck.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD /healthcheck.sh

# Start the application
CMD ["npm", "start"]