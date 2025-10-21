## Multi-stage Dockerfile for Next.js frontend
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true
RUN npm ci --legacy-peer-deps

FROM node:20-alpine AS build
WORKDIR /app
ARG BACKEND_URL
ENV BACKEND_URL=${BACKEND_URL}
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000
# Use already-resolved dependencies from deps stage to avoid network during runtime image
COPY --from=deps /app/node_modules ./node_modules
# Copy required runtime assets
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.mjs ./next.config.mjs
# Copy package.json for start script (no npm install here)
COPY package*.json ./
ENV BACKEND_URL=${BACKEND_URL}

EXPOSE 3000
CMD ["npm", "run", "start"]


