FROM node:20-alpine AS build
WORKDIR /app

# Prisma's native query engine requires OpenSSL on Alpine.
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl

# Prisma is a runtime dependency because the entrypoint deploys migrations
# before starting Node. Other development dependencies stay out of the image.
COPY package*.json ./
COPY prisma ./prisma
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
RUN mkdir -p /app/uploads

EXPOSE 3000

# Compose waits for PostgreSQL health. Migration failures must stop the container.
CMD ["sh", "-c", "npm run prisma:deploy && node dist/index.js"]
