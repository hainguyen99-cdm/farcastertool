## Multi-stage Dockerfile for NestJS backend
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3003
# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev
# Copy built artifacts
COPY --from=build /app/dist ./dist
# Ensure uploads directory exists at runtime
RUN mkdir -p ./uploads

EXPOSE 3003
CMD ["node", "dist/main.js"]


