# Base image Node 20
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and lock files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 8081

# Run with OTEL auto-instrumentation
CMD ["node", "-r", "@opentelemetry/auto-instrumentations-node/register", "dist/app.js"]
