FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source files
COPY . ./

# Build frontend
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm ci --only=production && npm cache clean --force

# Railway provides PORT
ENV PORT=3000

# Expose is optional
EXPOSE 3000

# Use our Express server
CMD ["node", "server.js"]
