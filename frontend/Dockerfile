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

# Use our Express server instead of serve
CMD ["npm", "start"]
