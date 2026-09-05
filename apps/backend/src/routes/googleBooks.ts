import { Router } from 'express';

const router = Router();

interface GoogleVolume {
  id: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: { type: string; identifier: string }[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
}

interface OpenLibraryDoc {
  key: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  isbn?: string[];
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function searchOpenLibrary(q: string) {
  const url = new URL('https://openlibrary.org/search.json');
  url.searchParams.set('q', q);
  url.searchParams.set('limit', '8');

  const response = await fetchWithTimeout(url.toString(), 8000);
  if (!response.ok) throw new Error(`Open Library respondió ${response.status}`);

  const data = (await response.json()) as { docs?: OpenLibraryDoc[] };
  return (data.docs || [])
    .filter((doc) => doc.title)
    .map((doc) => ({
      externalId: doc.key,
      title: doc.title as string,
      author: doc.author_name?.join(', ') || 'Autor desconocido',
      coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : undefined,
      isbn: doc.isbn?.[0],
      publishedYear: doc.first_publish_year,
      description: undefined as string | undefined,
    }));
}

async function searchGoogleBooks(q: string) {
  const url = new URL('https://www.googleapis.com/books/v1/volumes');
  url.searchParams.set('q', q);
  url.searchParams.set('maxResults', '8');
  if (process.env.GOOGLE_BOOKS_API_KEY) {
    url.searchParams.set('key', process.env.GOOGLE_BOOKS_API_KEY);
  }

  const response = await fetchWithTimeout(url.toString(), 8000);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Books respondió ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = (await response.json()) as { items?: GoogleVolume[] };
  return (data.items || [])
    .filter((item) => item.volumeInfo?.title)
    .map((item) => {
      const info = item.volumeInfo!;
      const isbn = info.industryIdentifiers?.find((i) => i.type === 'ISBN_13' || i.type === 'ISBN_10')?.identifier;
      const cover = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;

      return {
        externalId: item.id,
        title: info.title as string,
        author: info.authors?.join(', ') || 'Autor desconocido',
        coverUrl: cover ? cover.replace('http://', 'https://') : undefined,
        isbn,
        publishedYear: info.publishedDate ? parseInt(info.publishedDate.slice(0, 4), 10) || undefined : undefined,
        description: info.description,
      };
    });
}

// GET /api/books/search?q=... - busca el libro primero en Google Books y,
// si esa llamada falla (timeout, bloqueo, sin salida a internet, etc.),
// reintenta en Open Library antes de rendirse.
router.get('/search', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  if (!q.trim()) return res.json([]);

  try {
    console.log(`[books] buscando en Google Books: "${q}"`);
    const results = await searchGoogleBooks(q);
    console.log(`[books] Google Books devolvió ${results.length} resultados`);
    return res.json(results);
  } catch (err) {
    console.error(`[books] Google Books falló: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    console.log(`[books] intentando con Open Library: "${q}"`);
    const results = await searchOpenLibrary(q);
    console.log(`[books] Open Library devolvió ${results.length} resultados`);
    return res.json(results);
  } catch (err) {
    console.error(`[books] Open Library también falló: ${err instanceof Error ? err.message : String(err)}`);
    return res.status(502).json({
      error: 'No se pudo contactar a Google Books ni a Open Library. Revisa la conexión a internet del contenedor backend.',
    });
  }
});

export default router;
