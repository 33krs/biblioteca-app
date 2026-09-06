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
  valoración, reseña, notas, portada personalizada). Esta separación es la que
  permite escalar a multiusuario más adelante sin duplicar el catálogo.

Hoy la app corre en **modo single-user**: el backend crea automáticamente un
usuario local (`local-user`) al arrancar, así que no hace falta loguearse.

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

1. **Autenticación real** (JWT o sesiones) para pasar a multiusuario — el
   modelo de datos ya lo soporta, solo falta la capa de auth y filtrar por
   el usuario logueado en vez del usuario local fijo.
2. Integración con Google Books
3. **Migrar el almacenamiento de portadas** de disco local (multer) a
   Cloudinary o S3 para el despliegue en producción.
4. **HTTPS + dominio** cuando se despliegue en un servidor real: agregar un
   reverse proxy (Nginx/Caddy) delante y certificados con Let's Encrypt.
