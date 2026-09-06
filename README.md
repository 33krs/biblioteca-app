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

- `POST /api/auth/register` — `{ email, password, name? }` → `{ token, user }`
- `POST /api/auth/login` — `{ email, password }` → `{ token, user }`
- `GET /api/auth/me` — con `Authorization: Bearer <token>`, devuelve el usuario

El token es un JWT (7 días de expiración) que el frontend guarda en
`localStorage` y envía en cada petición a `/api/shelf/*`. Hace falta definir
`JWT_SECRET` en `apps/backend/.env` (ver `.env.example` para generar uno) —
sin esa variable el backend no arranca. Si usas `docker compose up`, define
`JWT_SECRET` en tu shell o en un `.env` junto a `docker-compose.yml` (sin
key, `docker compose` se niega a levantar el servicio `backend`).

### Recuperación de contraseña

- `POST /api/auth/forgot-password` — `{ email }` → genera un token de
  reseteo (válido 1 hora) si el email existe. Siempre responde 200 con el
  mismo mensaje, exista o no la cuenta, para no filtrar qué emails están
  registrados.
- `POST /api/auth/reset-password` — `{ token, password }` → si el token es
  válido y no expiró, actualiza la contraseña y lo invalida.

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

## Próximos pasos (roadmap)

1. **Migrar el almacenamiento de portadas** de disco local (multer) a
   Cloudinary o S3 para el despliegue en producción.
2. **HTTPS + dominio** cuando se despliegue en un servidor real: agregar un
   reverse proxy (Nginx/Caddy) delante y certificados con Let's Encrypt.
3. **CI**: correr `npm run test` y los builds en cada push/PR.
4. **Envío real de emails** para la recuperación de contraseña: hoy el link
   de reseteo solo se loguea en la consola del backend (ver sección de
   arriba), falta conectar un proveedor (Resend, SendGrid, SMTP...).
