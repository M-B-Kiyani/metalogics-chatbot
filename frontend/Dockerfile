FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install deps
RUN npm install

# Copy source
COPY . .

# Build frontend
RUN npm run build

# Railway provides PORT
ENV PORT=3000

# Expose is optional
EXPOSE 3000

# Serve static build correctly
CMD ["sh", "-c", "npx serve -s dist -l tcp://0.0.0.0:${PORT}"]
