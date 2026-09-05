import { useEffect, useState } from 'react';
import { useLibraryStore } from './store/useLibraryStore';
import Header from './components/Header';
import FilterTabs from './components/FilterTabs';
import ShelfView from './components/ShelfView';
import BookDetailPanel from './components/BookDetailPanel';
import AddBookModal from './components/AddBookModal';

export default function App() {
  const { books, filter, query, setFilter, setQuery, load, addBook, updateBook, deleteBook, uploadCover, loading, error } =
    useLibraryStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = books.filter((b) => {
    const matchesStatus = filter === 'ALL' || b.status === filter;
    const q = query.trim().toLowerCase();
    const matchesQuery = q === '' || b.book.title.toLowerCase().includes(q) || b.book.author.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const selected = books.find((b) => b.id === selectedId) || null;
  const readCount = books.filter((b) => b.status === 'READ').length;

  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Header total={books.length} readCount={readCount} query={query} onQueryChange={setQuery} />
        <FilterTabs value={filter} onChange={setFilter} />

        {loading && <p className="font-sans text-muted">Cargando estantería...</p>}
        {error && <p className="font-sans text-red-300">{error}</p>}

        {!loading && !error && <ShelfView books={filtered} onSelect={setSelectedId} onAdd={() => setAddOpen(true)} />}
      </div>

      {addOpen && <AddBookModal onClose={() => setAddOpen(false)} onAdd={addBook} />}

      {selected && (
        <BookDetailPanel
          userBook={selected}
          onClose={() => setSelectedId(null)}
          onSave={(patch) => updateBook(selected.id, patch)}
          onDelete={() => deleteBook(selected.id)}
          onUploadCover={(file) => uploadCover(selected.id, file)}
        />
      )}
    </div>
  );
}
