# Multi-stage build for production-optimized Docker image

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm ci --save-dev && \
    npm install -g npm@latest

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Install a simple HTTP server for production
RUN npm install -g serve

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create a .env.production file template
COPY .env.example .env.production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["serve", "-s", "dist", "-l", "3000"]
