# Widget Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the widget
RUN npm run build

# Install serve to serve static files
RUN npm install -g serve

# Expose port
EXPOSE $PORT

# Start the application serving the dist folder
CMD ["sh", "-c", "serve -s dist -l $PORT"]