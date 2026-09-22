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

# Prisma is a runtime dependency because the entrypoint applies the schema
# before starting Node. Other development dependencies stay out of the image.
COPY package*.json ./
COPY prisma ./prisma
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
RUN mkdir -p /app/uploads

EXPOSE 3000

# Wait for PostgreSQL, apply the schema, then start the API.
CMD ["sh", "-c", "until npx prisma db push --skip-generate --accept-data-loss; do echo 'Backend: waiting for database...'; sleep 2; done; node dist/index.js"]
