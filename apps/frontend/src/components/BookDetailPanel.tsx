import { useRef, useState } from 'react';
import { Star, X, Upload, ImageOff } from 'lucide-react';
import type { UserBook, ReadingStatus } from '../types';
import { hashColor, handwrittenSize, STATUS_CONFIG } from '../lib/covers';

interface Props {
  userBook: UserBook;
  onClose: () => void;
  onSave: (patch: Partial<UserBook>) => void;
  onDelete: () => void;
  onUploadCover: (file: File) => void;
}

export default function BookDetailPanel({ userBook, onClose, onSave, onDelete, onUploadCover }: Props) {
  const { book } = userBook;
  const [status, setStatus] = useState<ReadingStatus>(userBook.status);
  const [rating, setRating] = useState(userBook.rating ?? 0);
  const [review, setReview] = useState(userBook.review ?? '');
  const [notes, setNotes] = useState(userBook.notes ?? '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const coverUrl = userBook.customCoverUrl || book.defaultCoverUrl;
  const color = hashColor(book.title);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onUploadCover(file);
  }

  function save() {
    onSave({ status, rating, review, notes });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="h-full overflow-y-auto p-6 bg-panel"
        style={{ width: 420, maxWidth: '90vw' }}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="font-display text-2xl leading-snug text-paper">{book.title}</h2>
            <p className="font-sans text-sm mt-1 text-muted">{book.author}</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar">
            <X size={20} className="text-muted" />
          </button>
        </div>

        <div
          className="rounded overflow-hidden mb-3 shadow-lg mx-auto"
          style={{ width: 160, height: 236, backgroundColor: coverUrl ? 'transparent' : color }}
        >
          {coverUrl ? (
            <img src={coverUrl} alt={book.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center px-4">
              <span
                className="font-hand text-center leading-tight text-paper"
                style={{ fontSize: handwrittenSize(book.title) + 4 }}
              >
                {book.title}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-center mb-6">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="font-sans px-3 py-1.5 rounded border text-xs flex items-center gap-1 border-border text-paper"
          >
            <Upload size={13} /> Subir portada
          </button>
          {userBook.customCoverUrl && (
            <button
              onClick={() => onSave({ customCoverUrl: null })}
              className="font-sans px-3 py-1.5 rounded border text-xs flex items-center gap-1 border-border text-muted"
            >
              <ImageOff size={13} /> Quitar
            </button>
          )}
        </div>

        <p className="font-label text-xs mb-2 text-muted">Estado de lectura</p>
        <div className="flex gap-2 mb-6">
          {(Object.entries(STATUS_CONFIG) as [ReadingStatus, { label: string; ribbon: string }][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setStatus(key)}
              className="font-label flex-1 py-2 rounded text-xs font-medium transition-colors"
              style={{
                backgroundColor: status === key ? cfg.ribbon : '#1B2430',
                color: status === key ? '#1B2430' : '#9C9484',
              }}
            >
              {cfg.label}
            </button>
          ))}
        </div>

        <p className="font-sans text-xs mb-2 text-muted">Mi valoración</p>
        <div className="flex gap-1 mb-6">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} aria-label={`${n} estrellas`}>
              <Star size={22} fill={n <= rating ? '#C9A45C' : 'none'} className="text-brass" />
            </button>
          ))}
        </div>

        <p className="font-sans text-xs mb-2 text-muted">Reseña</p>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={4}
          placeholder="¿Qué te pareció el libro?"
          className="font-sans w-full rounded border p-3 text-sm mb-6 bg-ink text-paper border-border focus:outline-none"
        />

        <p className="font-sans text-xs mb-2 text-muted">Notas y referencias</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Citas, referencias, próximas relecturas..."
          className="font-sans w-full rounded border p-3 text-sm mb-6 bg-ink text-paper border-border focus:outline-none"
        />

        <div className="flex gap-2">
          <button onClick={save} className="font-sans flex-1 py-2 rounded text-sm font-medium bg-brass text-ink">
            Guardar
          </button>
          <button onClick={onDelete} className="font-sans px-4 py-2 rounded text-sm border border-oxblood text-red-300">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
