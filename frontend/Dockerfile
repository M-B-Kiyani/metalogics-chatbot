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

# Expose port
EXPOSE $PORT

# Set default port if not provided
ENV PORT=3000

# Start the application
CMD ["sh", "-c", "npx serve -s dist -p $PORT"]