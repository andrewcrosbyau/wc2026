import { useMemo } from 'react';
import { Star, MapPin, ChevronRight } from 'lucide-react';
import { CITY_ACCENT, SECTION_META, lookupSavedItem, mapsUrl } from '../data';
import { Card, WCCard } from './shared/Card';

export default function SavedView({ saved, onSave, onNavigateToCity }) {
  const savedItems = useMemo(() => {
    return [...saved].map(lookupSavedItem).filter(Boolean);
  }, [saved]);

  if (savedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: '#A89E96' }}>
        <Star size={32} style={{ color: '#D8CECA' }} />
        <p className="text-sm">No saved items yet</p>
        <p className="text-xs" style={{ color: '#D8CECA' }}>Tap the star on any venue to save it here</p>
      </div>
    );
  }

  const grouped = savedItems.reduce((acc, item) => {
    const key = item.city.id;
    if (!acc[key]) acc[key] = { city: item.city, items: [] };
    acc[key].items.push(item);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-5">
      <h2
        className="text-lg font-bold"
        style={{ fontFamily: "'Cormorant Garant', Georgia, serif", color: '#1A1714' }}
      >
        Saved — {savedItems.length} item{savedItems.length !== 1 ? 's' : ''}
      </h2>
      {Object.values(grouped).map(({ city, items }) => {
        const accent = CITY_ACCENT[city.id] || CITY_ACCENT.vancouver;
        return (
          <div key={city.id}>
            <button
              onClick={() => onNavigateToCity(city.id)}
              className="flex items-center gap-1.5 mb-2 hover:opacity-80 transition-opacity"
              style={{ color: accent.hex }}
            >
              <span className="text-sm font-bold" style={{ fontFamily: "'Cormorant Garant', Georgia, serif" }}>{city.label}</span>
              <ChevronRight size={14} />
            </button>
            <div className="grid gap-2">
              {items.map(({ item, sectionKey, id, place, isPlace }) => {
                if (isPlace) {
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 border"
                      style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E0D8', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                    >
                      <MapPin size={12} className="shrink-0" style={{ color: '#A89E96' }} />
                      <div className="flex-1 min-w-0">
                        <a
                          href={mapsUrl(place.maps)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:opacity-70 transition-opacity"
                        >
                          <span className="text-sm font-medium" style={{ color: '#1A1714' }}>{place.name}</span>
                          {place.detail && <span className="text-xs ml-1.5" style={{ color: '#A89E96' }}>{place.detail}</span>}
                        </a>
                        <p className="text-xs mt-0.5" style={{ color: '#A89E96' }}>
                          {SECTION_META[sectionKey]?.label}
                          {item.title && ` · ${item.title}`}
                        </p>
                      </div>
                      <button
                        onClick={() => onSave(id)}
                        className="shrink-0 transition-colors"
                        style={{ color: '#C04E1A' }}
                        aria-label="Unsave"
                      >
                        <Star size={13} fill="currentColor" />
                      </button>
                    </div>
                  );
                }
                const type = item.type || (sectionKey === 'sporting' ? 'sport' : sectionKey === 'hotelZone' ? 'hotel' : sectionKey);
                return item.type === 'wc'
                  ? <WCCard key={id} title={item.title} text={item.text} places={item.places} cardId={id} saved={saved} onSave={onSave} />
                  : <Card key={id} title={item.title} text={item.text} places={item.places} type={type} cardId={id} saved={saved} onSave={onSave} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
