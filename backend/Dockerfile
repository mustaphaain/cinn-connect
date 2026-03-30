FROM node:22-slim AS deps
WORKDIR /app

# Install dependencies first for better caching
COPY package.json ./
RUN npm install

FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Keep image small: only production runtime deps + dist
COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Fly sets PORT; default matches local fallback
ENV PORT=3001
EXPOSE 3001

CMD ["node", "dist/index.js"]
