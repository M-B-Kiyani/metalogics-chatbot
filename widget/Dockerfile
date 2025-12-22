# Widget Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Build widget
RUN npm run build

# Install serve globally
RUN npm install -g serve@14.2.1

# Railway injects PORT, default to 3000
ENV PORT=3000

# Expose port
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/metalogics-chatbot.iife.js || exit 1

# Serve widget statically with proper binding
CMD ["sh", "-c", "serve -s dist -l 0.0.0.0:${PORT:-3000} --cors"]
