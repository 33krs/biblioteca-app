FROM node:20-alpine
WORKDIR /app

# Los motores de Prisma necesitan openssl; Alpine no lo trae instalado por defecto
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
# db push crea/actualiza las tablas directamente a partir de schema.prisma.
# El "until" reintenta hasta que Postgres esté realmente aceptando conexiones
# (evita la condición de carrera al primer arranque de docker compose).
CMD ["sh", "-c", "until npx prisma db push --skip-generate --accept-data-loss; do echo 'Backend: esperando la base de datos...'; sleep 2; done; node dist/index.js"]
