# Widget Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy source
COPY . .

# Build widget
RUN npm run build

# Clean up devDependencies to reduce image size
RUN npm prune --production



# Railway injects PORT, default to 3000
ENV PORT=3000

# Expose port
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://0.0.0.0:$PORT/metalogics-chatbot.iife.js || exit 1

# Serve widget statically with proper binding
CMD ["npm", "run", "start:prod"]
