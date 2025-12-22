FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy source files
COPY . ./

# Build arguments for Vite
ARG GEMINI_API_KEY
ARG VITE_GEMINI_API_KEY
# Make them available during build
ENV GEMINI_API_KEY=$GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

# Build frontend
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm install --only=production && npm cache clean --force

# Railway provides PORT
ENV PORT=3000

# Expose is optional
EXPOSE 3000

# Use our Express server
CMD ["node", "server.js"]
