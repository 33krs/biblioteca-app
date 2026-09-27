# Mi biblioteca

Aplicación web para gestionar una biblioteca personal con estética de estantería:
portadas horizontales (con opción de subir tu propia imagen o dejar el título
escrito a mano), estado de lectura, valoraciones, reseñas y notas.

## Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Zustand
- **Backend**: Node.js + Express + TypeScript + Prisma
- **Base de datos**: PostgreSQL
- **Despliegue**: Docker

## Estructura

```
biblioteca-app/
├── apps/
│   ├── frontend/   # React + Vite + Tailwind + Zustand
│   └── backend/    # Node + Express + Prisma
├── docker-compose.yml
└── package.json    # workspaces npm
```


## Modelo de datos

- `Book`: datos "universales" del libro (título, autor, portada por defecto).
- `UserBook`: la relación de un usuario con un libro (estado de lectura,
  valoración, reseña, notas, portada personalizada). Esta separación evita
  duplicar el catálogo entre usuarios distintos que tengan el mismo libro.

## Autenticación

La app es multiusuario: hay que registrarse/iniciar sesión para ver y editar
tu propia estantería (cada usuario solo ve y modifica sus propios libros).

- `POST /api/auth/register` — `{ email, password, name? }` → `{ user }`
- `POST /api/auth/login` — `{ email, password }` → `{ user }`
- `POST /api/auth/logout` — cierra la sesión actual
- `GET /api/auth/me` — devuelve el usuario de la sesión actual

La sesión usa un JWT de siete días en una cookie `HttpOnly`, limitada a `/api`,
con `SameSite=Lax` y `Secure` en producción. El frontend no guarda credenciales
en `localStorage`. El backend entrega además una cookie CSRF legible por el
frontend; las operaciones autenticadas `POST`, `PATCH` y `DELETE` deben enviar
su valor en el encabezado `X-CSRF-Token`.

Hace falta definir `JWT_SECRET` en `apps/backend/.env` (ver `.env.example`
para generar uno) — sin esa variable el backend no arranca. Si usas `docker
compose up`, define `JWT_SECRET` en tu shell o en un `.env` junto a
`docker-compose.yml` (sin key, `docker compose` se niega a levantar el servicio
`backend`).

### Recuperación de contraseña

- `POST /api/auth/forgot-password` — `{ email }` → genera un token de
  reseteo (válido 1 hora) si el email existe. Siempre responde 200 con el
  mismo mensaje, exista o no la cuenta, para no filtrar qué emails están
  registrados.
- `POST /api/auth/reset-password` — `{ token, password }` → si el token es
  válido y no expiró, actualiza la contraseña, lo invalida y revoca las
  sesiones existentes.

Hoy no hay ningún proveedor de email conectado: el link de reseteo se loguea
en la consola del backend (`apps/backend/src/lib/mailer.ts`). Para producción
hay que reemplazar esa función por un envío real (Resend, SendGrid, SMTP...);
las rutas no cambian. El frontend arma la pantalla de "nueva contraseña" leyendo
`?resetToken=...` de la URL (`FRONTEND_URL` en `apps/backend/.env` controla el
dominio con el que se arma ese link).

## Búsqueda con Google Books

Al añadir un libro puedes buscarlo por título o autor: el backend consulta la
API pública de Google Books y te muestra resultados con portada para elegir.
Si no encuentras el libro, siempre puedes escribir título y autor a mano (en
ese caso la portada por defecto será el título escrito a mano que ya tenías).

No hace falta ninguna API key para que funcione, pero Google limita las
peticiones sin key a una cuota más baja por día. Si vas a usar la app seguido,
puedes conseguir una gratis en Google Cloud Console (habilitando "Books API")
y ponerla en `GOOGLE_BOOKS_API_KEY` dentro de `apps/backend/.env` (o como
variable de entorno del servicio `backend` en `docker-compose.yml`).

## Tests

- **Backend** (`apps/backend`): tests de integración con Vitest + Supertest
  contra una base de datos real de prueba (`biblioteca_test`, se crea sola la
  primera vez). Requiere que el contenedor `db` de `docker-compose.yml` esté
  corriendo. La búsqueda de libros se testea con `fetch` mockeado, para no
  depender de la disponibilidad/cuota de Google Books ni de Open Library.
- **Frontend** (`apps/frontend`): tests de componentes y del store con Vitest
  + Testing Library, mockeando la capa `lib/api.ts` (sin red real).

```bash
npm run test            # backend + frontend
npm run test:backend
npm run test:frontend
```

### Quality checks

Antes de abrir un pull request, ejecuta la validación completa:

```bash
npm run quality       # formato, lint, tipos, tests y builds
npm run format:check
npm run lint
npm run typecheck
npm run build
```

Estos mismos checks se ejecutan automáticamente en GitHub Actions para cada
push a `main` y cada pull request.

## PostgreSQL con Docker

La configuración de Docker Compose utiliza PostgreSQL 18.6 y guarda sus datos
en el volumen `pgdata18`. Este volumen tiene una identidad distinta del volumen
`pgdata` usado anteriormente por PostgreSQL 16: **no montes el volumen anterior
en un contenedor PostgreSQL 18**, porque los formatos físicos entre versiones
mayores no son compatibles.

### Variables de entorno

Copia el ejemplo de configuración y reemplaza los valores indicados:

```bash
cp .env.example .env
```

- `POSTGRES_DB`, `POSTGRES_USER` y `POSTGRES_PORT` tienen valores locales
  predeterminados en Compose.
- `POSTGRES_PASSWORD` y `JWT_SECRET` son obligatorios y no tienen valores
  predeterminados.
- `FRONTEND_URL` usa `http://localhost:8080` de forma predeterminada.

No confirmes `.env` ni respaldos de bases de datos en Git.

### Inicio local desde cero

Para una instalación nueva, crea `.env` y levanta los servicios:

```bash
docker compose up -d --build
docker compose ps
```

PostgreSQL inicializará una base vacía en el nuevo volumen `pgdata18`. El
volumen anterior permanece separado y no se elimina automáticamente.

### Migración lógica de PostgreSQL 16 a 18

Una actualización mayor requiere una exportación y restauración lógica. Antes
de modificar o detener definitivamente el entorno PostgreSQL 16:

1. Crea un directorio local ignorado por Git y genera el respaldo desde el
   contenedor PostgreSQL 16 todavía operativo:

   ```bash
   mkdir -p backups
   docker compose exec -T db pg_dump \
     -U "${POSTGRES_USER:-biblioteca}" \
     -d "${POSTGRES_DB:-biblioteca}" \
     --format=custom --no-owner --no-acl \
     > backups/biblioteca-pg16.dump
   ```

2. Verifica que el archivo exista, no esté vacío y pueda ser listado:

   ```bash
   test -s backups/biblioteca-pg16.dump
   docker compose exec -T db pg_restore --list \
     < backups/biblioteca-pg16.dump > /dev/null
   ```

3. Detén PostgreSQL 16 **sin ejecutar** `docker compose down --volumes` y
   conserva tanto el respaldo como el volumen `pgdata` anterior.
4. Con esta configuración, levanta primero PostgreSQL 18 en `pgdata18`:

   ```bash
   docker compose up -d db
   docker compose ps db
   ```

5. Restaura el respaldo en la base nueva y revisa cualquier error antes de
   iniciar el backend:

   ```bash
   docker compose exec -T db pg_restore \
     -U "${POSTGRES_USER:-biblioteca}" \
     -d "${POSTGRES_DB:-biblioteca}" \
     --no-owner --no-acl --exit-on-error \
     < backups/biblioteca-pg16.dump
   ```

6. Compara los conteos de las tablas relevantes y ejecuta las pruebas de la
   aplicación antes de retirar el entorno anterior.

Si PostgreSQL 16 se ejecuta desde otra copia del repositorio o con otro nombre
de proyecto Compose, identifica el nombre real del contenedor y del volumen con
`docker compose ps` y `docker volume ls`. No asumas sus nombres ni renombres el
volumen físico.

### Bases existentes y línea base de Prisma

Una base existente puede contener las tablas de la aplicación sin la tabla
`_prisma_migrations` si fue creada anteriormente con `prisma db push`. En ese
caso:

1. Conserva y verifica un respaldo antes de cualquier operación.
2. Compara el esquema real con las migraciones versionadas en
   `apps/backend/prisma/migrations` y corrige cualquier diferencia.
3. Sólo si ambos esquemas son equivalentes, marca las migraciones existentes
   como aplicadas, en orden cronológico, mediante `prisma migrate resolve`.
4. Ejecuta `prisma migrate deploy` y valida datos, índices y restricciones.

Nunca marques una migración como aplicada únicamente porque existan tablas con
nombres similares. Una línea base incorrecta puede ocultar diferencias de
esquema y provocar fallos en despliegues posteriores.

### Rollback

Si la validación de PostgreSQL 18 falla, detén los servicios nuevos sin borrar
volúmenes, vuelve a la configuración PostgreSQL 16 y monta exclusivamente el
volumen `pgdata` anterior con PostgreSQL 16. El volumen `pgdata18` y el respaldo
deben conservarse para diagnóstico. No escribas en ambas bases durante el
rollback y no elimines ningún volumen hasta confirmar la integridad y el origen
de los datos activos.
