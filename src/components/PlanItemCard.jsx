import { ExternalLink, Check, X } from 'lucide-react';

const CATEGORY_ICONS = {
  food: '🍽',
  culture: '🎭',
  sport: '⚽',
  wc: '⚽',
  running: '🏃',
  travel: '✈️',
  other: '📌',
};

export default function PlanItemCard({ item, onEdit, onDelete, onToggleDone, isPendingDelete }) {
  const icon = CATEGORY_ICONS[item.category] || '📌';
  const initials = item.created_by_name ? item.created_by_name[0].toUpperCase() : '?';
  const mapsLink = item.maps_query
    ? `https://www.google.com/maps/search/${encodeURIComponent(item.maps_query)}`
    : null;

  return (
    <div
      className="rounded-xl px-3 py-2.5 border flex items-start gap-2"
      style={{
        backgroundColor: item.is_system ? '#F5F0E8' : '#FFFFFF',
        borderColor: item.is_system ? '#D8CECA' : '#E8E0D8',
        opacity: isPendingDelete ? 0.4 : item.is_done ? 0.65 : 1,
        textDecoration: isPendingDelete ? 'line-through' : 'none',
      }}
    >
      <span className="text-sm mt-0.5 shrink-0">{icon}</span>

      <div
        className="flex-1 min-w-0"
        onClick={!item.is_system && onEdit ? () => onEdit(item) : undefined}
        style={{ cursor: !item.is_system && onEdit ? 'pointer' : 'default' }}
      >
        <p
          className="text-sm font-medium leading-snug"
          style={{
            color: '#1A1714',
            textDecoration: item.is_done && !isPendingDelete ? 'line-through' : 'none',
          }}
        >
          {item.title}
        </p>
        {item.note && (
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#A89E96' }}>{item.note}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
        {item.is_system ? (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ backgroundColor: '#E8E0D8', color: '#A89E96' }}
          >
            fixed
          </span>
        ) : (
          <>
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{ backgroundColor: '#F0E8E4', color: '#C04E1A' }}
            >
              {initials}
            </span>
            {mapsLink && (
              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-70"
                style={{ color: '#A89E96' }}
                onClick={e => e.stopPropagation()}
              >
                <ExternalLink size={12} />
              </a>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onToggleDone(item.id, item.is_done); }}
              className="transition-colors"
              style={{ color: item.is_done ? '#C04E1A' : '#D8CECA' }}
              aria-label="Toggle done"
            >
              <Check size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(item); }}
              className="transition-colors hover:opacity-70"
              style={{ color: '#D8CECA' }}
              aria-label="Delete"
            >
              <X size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
