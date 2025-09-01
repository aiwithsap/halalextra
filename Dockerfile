# Single-stage build for simplicity and reliability
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (dev and prod) to ensure build works
RUN npm ci

# Copy all source files
COPY . .

# Build the application
RUN npm run build

# Clean up dev dependencies after build (keep vite for production)
RUN npm prune --production && npm install vite

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Start command
CMD ["npm", "start"]