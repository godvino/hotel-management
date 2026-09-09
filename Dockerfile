# Use official lightweight Node.js 20 LTS Alpine image
FROM node:20-alpine AS base

# Install curl for healthcheck
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Copy package manifests
COPY package*.json ./

# Install only production dependencies cleanly
RUN npm ci --only=production && npm cache clean --force

# Copy application source code
COPY . .

# Ensure non-root node user owns application files
RUN chown -R node:node /app

# Switch to non-root user for security
USER node

# Expose web port
EXPOSE 5000

# Health check to ensure service is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api || exit 1

# Start server
CMD ["node", "server.js"]
