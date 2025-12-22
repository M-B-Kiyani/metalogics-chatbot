# Frontend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Set default port
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the application with explicit command
CMD ["sh", "-c", "exec npx serve -s dist -p \"${PORT:-3000}\""]