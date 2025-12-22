# Widget Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build widget
RUN npm run build

# Install serve
RUN npm install -g serve

# Railway injects PORT
ENV PORT=3000

# Optional, for humans
EXPOSE 3000

# Serve widget statically (correct binding)
CMD ["sh", "-c", "serve -s dist -l tcp://0.0.0.0:${PORT}"]
