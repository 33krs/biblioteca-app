import { Plus } from 'lucide-react';
import type { UserBook } from '../types';
import BookCover, { COVER_WIDTH, COVER_HEIGHT } from './BookCover';

interface Props {
  books: UserBook[];
  onSelect: (id: string) => void;
  onAdd: () => void;
  perRow?: number;
}

function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

const PLANK_STYLE = { background: 'linear-gradient(180deg, #7a5a3f 0%, #6B4A34 40%, #4E3626 100%)', height: 14 };

export default function ShelfView({ books, onSelect, onAdd, perRow = 6 }: Props) {
  const shelves = chunk(books, perRow);

  return (
    <div className="space-y-10">
      {shelves.map((row, idx) => (
        <div key={idx}>
          <div className="flex items-end gap-4 px-2" style={{ minHeight: COVER_HEIGHT + 14 }}>
            {row.map((ub) => (
              <BookCover key={ub.id} userBook={ub} onClick={() => onSelect(ub.id)} />
            ))}
          </div>
          <div className="shadow-lg rounded-sm" style={PLANK_STYLE} />
        </div>
      ))}

      {books.length === 0 && (
        <p className="font-sans text-center py-10 text-muted">No hay libros que coincidan con la búsqueda.</p>
      )}

      <div>
        <div className="flex items-end gap-4 px-2" style={{ minHeight: COVER_HEIGHT + 14 }}>
          <button
            onClick={onAdd}
            className="border-2 border-dashed rounded flex items-center justify-center border-border text-muted hover:border-solid"
            style={{ width: COVER_WIDTH, height: COVER_HEIGHT }}
            aria-label="Añadir libro"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="shadow-lg rounded-sm" style={PLANK_STYLE} />
      </div>
    </div>
  );
}
