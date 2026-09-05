import type { ReadingStatus } from '../types';

const OPTIONS: [ReadingStatus | 'ALL', string][] = [
  ['ALL', 'Todos'],
  ['TO_READ', 'Por leer'],
  ['READING', 'Leyendo'],
  ['READ', 'Leído'],
];

interface Props {
  value: ReadingStatus | 'ALL';
  onChange: (v: ReadingStatus | 'ALL') => void;
}

export default function FilterTabs({ value, onChange }: Props) {
  return (
    <div className="flex gap-1 mb-6">
      {OPTIONS.map(([key, label]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`font-label px-4 py-2 text-sm rounded-t-md transition-colors ${
            value === key ? 'bg-brass text-ink' : 'bg-panel text-muted'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
