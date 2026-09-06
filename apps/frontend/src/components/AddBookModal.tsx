import { useEffect, useState } from 'react';
import { X, Search, Loader2, AlertCircle } from 'lucide-react';
import { searchBooks } from '../lib/api';
import type { GoogleBookResult, NewBookPayload } from '../types';

interface Props {
  onClose: () => void;
  onAdd: (payload: NewBookPayload) => void;
}

export default function AddBookModal({ onClose, onAdd }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GoogleBookResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<GoogleBookResult | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');

  useEffect(() => {
    if (query.trim().length < 3 || selected) {
      setResults([]);
      setSearchError(null);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const found = await searchBooks(query.trim(), controller.signal);
        setResults(found);
        if (found.length === 0) setSearchError('Sin resultados para esa búsqueda.');
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setResults([]);
        setSearchError(e instanceof Error ? e.message : 'No se pudo buscar en Google Books.');
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, selected]);

  function pickResult(r: GoogleBookResult) {
    setSelected(r);
    setTitle(r.title);
    setAuthor(r.author);
    setResults([]);
  }

  function clearSelection() {
    setSelected(null);
    setTitle('');
    setAuthor('');
    setQuery('');
  }

  function submit() {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      author: author.trim() || 'Autor desconocido',
      coverUrl: selected?.coverUrl,
      isbn: selected?.isbn,
      publishedYear: selected?.publishedYear,
      description: selected?.description,
      externalId: selected?.externalId,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="rounded-lg p-6 w-96 max-w-[90vw] bg-panel">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-paper">Añadir libro</h3>
          <button onClick={onClose} aria-label="Cerrar">
            <X size={18} className="text-muted" />
          </button>
        </div>

        {!selected && (
          <>
            <label className="font-sans text-xs block mb-1 text-muted">Buscar en Google Books</label>
            <div className="relative mb-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Título o autor..."
                autoFocus
                className="font-sans w-full pl-8 pr-8 py-2 rounded border text-sm bg-ink text-paper border-border focus:outline-none"
              />
              {searching && (
                <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted animate-spin" />
              )}

              {/* Menú desplegable de resultados */}
              {(results.length > 0 || (searchError && !searching)) && (
                <div className="absolute left-0 right-0 top-full mt-1 z-10 rounded border border-border bg-ink shadow-lg max-h-56 overflow-y-auto">
                  {results.map((r) => (
                    <button
                      key={r.externalId}
                      onClick={() => pickResult(r)}
                      className="w-full flex items-center gap-3 p-2 text-left hover:bg-panel transition-colors"
                    >
                      <div className="w-8 h-11 flex-shrink-0 rounded-sm overflow-hidden bg-panel">
                        {r.coverUrl && <img src={r.coverUrl} alt={r.title} className="w-full h-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-sans text-xs text-paper truncate">{r.title}</p>
                        <p className="font-sans text-xs text-muted truncate">{r.author}</p>
                      </div>
                    </button>
                  ))}

                  {searchError && (
                    <div className="flex items-start gap-2 p-2 text-left">
                      <AlertCircle size={14} className="text-oxblood mt-0.5 flex-shrink-0" />
                      <p className="font-sans text-xs text-muted">{searchError}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="font-sans text-xs text-muted mb-4 mt-2">
              ¿No lo encuentras? Escribe el título y autor a mano abajo.
            </p>
          </>
        )}

        {selected && (
          <div className="flex items-center gap-3 mb-4 p-2 rounded border border-border">
            <div className="w-10 h-14 flex-shrink-0 rounded-sm overflow-hidden bg-ink">
              {selected.coverUrl && <img src={selected.coverUrl} alt={selected.title} className="w-full h-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-sans text-sm text-paper truncate">{selected.title}</p>
              <p className="font-sans text-xs text-muted truncate">{selected.author}</p>
            </div>
            <button onClick={clearSelection} className="font-sans text-xs text-muted underline flex-shrink-0">
              Cambiar
            </button>
          </div>
        )}

        <label className="font-sans text-xs block mb-1 text-muted">Título</label>
        <input
          aria-label="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="font-sans w-full px-3 py-2 rounded border text-sm mb-3 bg-ink text-paper border-border focus:outline-none"
        />
        <label className="font-sans text-xs block mb-1 text-muted">Autor</label>
        <input
          aria-label="Autor"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="font-sans w-full px-3 py-2 rounded border text-sm mb-4 bg-ink text-paper border-border focus:outline-none"
        />
        <button onClick={submit} className="font-sans w-full py-2 rounded text-sm font-medium bg-brass text-ink">
          Añadir a la estantería
        </button>
      </div>
    </div>
  );
}
