import { Search } from 'lucide-react';

interface HeaderProps {
  total: number;
  readCount: number;
  query: string;
  onQueryChange: (q: string) => void;
  onLogout: () => void;
}

export default function Header({ total, readCount, query, onQueryChange, onLogout }: HeaderProps) {
  return (
    <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
      <div>
        <h1 className="font-display text-4xl font-semibold text-paper">Mi biblioteca</h1>
        <p className="font-label mt-1 text-sm text-muted">
          {total} libros en la estantería · {readCount} leídos
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar título o autor"
            className="font-sans pl-9 pr-3 py-2 rounded text-sm border w-56 bg-panel text-paper border-border focus:outline-none"
          />
        </div>
        <button onClick={onLogout} className="font-sans text-xs text-muted underline">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
