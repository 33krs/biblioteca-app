import type { UserBook } from '../types';
import { hashColor, handwrittenSize, STATUS_CONFIG } from '../lib/covers';

interface Props {
  userBook: UserBook;
  onClick: () => void;
}

export const COVER_WIDTH = 132;
export const COVER_HEIGHT = 196;

export default function BookCover({ userBook, onClick }: Props) {
  const { book, status, customCoverUrl } = userBook;
  const ribbon = STATUS_CONFIG[status].ribbon;
  const color = hashColor(book.title);
  const coverUrl = customCoverUrl || book.defaultCoverUrl;

  return (
    <button
      onClick={onClick}
      className="relative flex-shrink-0 group"
      style={{ width: COVER_WIDTH, height: COVER_HEIGHT }}
      aria-label={`Abrir ${book.title}`}
    >
      <div
        className="w-full h-full rounded shadow-md overflow-hidden relative group-hover:-translate-y-1 transition-transform"
        style={{ backgroundColor: coverUrl ? 'transparent' : color }}
      >
        {coverUrl ? (
          <img src={coverUrl} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center px-4 py-6">
            <span
              className="font-hand text-center leading-tight line-clamp-5 break-words text-paper"
              style={{ fontSize: handwrittenSize(book.title) }}
            >
              {book.title}
            </span>
          </div>
        )}
        <div
          style={{
            backgroundColor: ribbon,
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)',
            width: 14,
            height: 28,
          }}
          className="absolute top-0 right-3"
        />
      </div>
    </button>
  );
}
