import { MapPin, Star, ChevronRight, CalendarDays, Car } from 'lucide-react';
import { CARD_STYLE, SECTION_META, mapsUrl } from '../../data';
import Highlight from './Highlight';

export function PlacesList({ places, query, cardId, saved, onSave }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {places.map((place, i) => {
        const placeId = cardId ? `${cardId}:${i}` : null;
        const isSaved = placeId && saved?.has(placeId);
        return (
          <li key={i} className="flex items-center gap-2 rounded-lg px-3 py-2 border"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E0D8' }}>
            <MapPin size={12} className="shrink-0" style={{ color: '#A89E96' }} />
            <a
              href={mapsUrl(place.maps)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-0 flex items-baseline gap-1.5 transition-opacity hover:opacity-70"
            >
              <span className="text-sm font-medium" style={{ color: '#1A1714' }}>
                <Highlight text={place.name} query={query} />
              </span>
              {place.detail && (
                <span className="text-xs shrink-0" style={{ color: '#A89E96' }}>
                  · <Highlight text={place.detail} query={query} />
                </span>
              )}
            </a>
            {placeId && onSave && (
              <button
                onClick={(e) => { e.preventDefault(); onSave(placeId); }}
                className="shrink-0 transition-colors"
                style={{ color: isSaved ? '#C04E1A' : '#D8CECA' }}
                aria-label={isSaved ? 'Unsave' : 'Save'}
              >
                <Star size={13} fill={isSaved ? 'currentColor' : 'none'} />
              </button>
            )}
            <ChevronRight size={12} className="shrink-0" style={{ color: '#D8CECA' }} />
          </li>
        );
      })}
    </ul>
  );
}

export function Card({ title, text, places, type = 'culture', cardId, saved, onSave, query }) {
  const style = CARD_STYLE[type] || CARD_STYLE.culture;
  const hasPlaces = places && places.length > 0;
  const isSaved = !hasPlaces && saved?.has(cardId);

  return (
    <div
      className="rounded-xl px-3 py-2.5 border"
      style={{ backgroundColor: style.cardBg, borderColor: style.cardBorder, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold leading-snug" style={{ color: style.title }}>
          <Highlight text={title} query={query} />
        </p>
        {!hasPlaces && onSave && (
          <button
            onClick={() => onSave(cardId)}
            className="shrink-0 mt-0.5 transition-colors"
            style={{ color: isSaved ? '#C04E1A' : '#D8CECA' }}
            aria-label={isSaved ? 'Unsave' : 'Save'}
          >
            <Star size={13} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
      {text && (
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#6B6560' }}>
          <Highlight text={text} query={query} />
        </p>
      )}
      {hasPlaces && <PlacesList places={places} query={query} cardId={cardId} saved={saved} onSave={onSave} />}
    </div>
  );
}

export function WCCard({ title, text, places, cardId, saved, onSave }) {
  const hasPlaces = places && places.length > 0;
  const isSaved = !hasPlaces && saved?.has(cardId);
  return (
    <div
      className="rounded-xl px-3 py-3 border"
      style={{ backgroundColor: '#FDF5F0', borderColor: '#E8C0A0', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold leading-snug" style={{ color: '#C04E1A' }}>⚽ {title}</p>
        {!hasPlaces && onSave && (
          <button
            onClick={() => onSave(cardId)}
            className="shrink-0 mt-0.5 transition-colors"
            style={{ color: isSaved ? '#C04E1A' : '#D8CECA' }}
            aria-label={isSaved ? 'Unsave' : 'Save'}
          >
            <Star size={13} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
      {text && <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#8A5A2A' }}>{text}</p>}
      {hasPlaces && <PlacesList places={places} cardId={cardId} saved={saved} onSave={onSave} />}
    </div>
  );
}

export function OnYourDatesSection({ items, cityId, saved, onSave }) {
  return (
    <div className="rounded-xl p-3 border" style={{ backgroundColor: '#F5F0E8', borderColor: '#E8E0D8' }}>
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays size={13} style={{ color: '#6B6560' }} />
        <h3 className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#6B6560' }}>On Your Dates</h3>
      </div>
      <div className="grid gap-2">
        {items.map((item, i) => {
          const cardId = `${cityId}:dates:${i}`;
          return item.type === 'wc'
            ? <WCCard key={i} title={item.title} text={item.text} places={item.places} cardId={cardId} saved={saved} onSave={onSave} />
            : <Card key={i} title={item.title} text={item.text} places={item.places} type={item.type} cardId={cardId} saved={saved} onSave={onSave} />;
        })}
      </div>
    </div>
  );
}

export function HotelZoneCallout({ items, cityId, saved, onSave }) {
  return (
    <div className="rounded-xl p-3 border" style={{ backgroundColor: '#FBF7F4', borderColor: '#E8C8A0', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Car size={13} style={{ color: '#7A4A3A' }} />
        <h3 className="text-xs font-bold tracking-wider uppercase" style={{ color: '#7A4A3A' }}>Get out of the hotel zone</h3>
      </div>
      <div className="grid gap-2">
        {items.map((item, i) => {
          const cardId = `${cityId}:hotelZone:${i}`;
          return (
            <Card key={i} title={item.title} text={item.text} places={item.places} type="hotel" cardId={cardId} saved={saved} onSave={onSave} />
          );
        })}
      </div>
    </div>
  );
}

export function SectionCards({ items, type, cityId, sectionKey, saved, onSave, query }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="grid gap-2">
      {items.map((item, i) => (
        <Card
          key={i}
          title={item.title}
          text={item.text}
          places={item.places}
          type={type}
          cardId={`${cityId}:${sectionKey}:${i}`}
          saved={saved}
          onSave={onSave}
          query={query}
        />
      ))}
    </div>
  );
}

export function SectionDivider({ meta }) {
  const Icon = meta.Icon;
  return (
    <div
      className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
      style={{ backgroundColor: '#F5F0E8', border: '1px solid #E8E0D8' }}
    >
      <Icon size={14} style={{ color: meta.color }} />
      <span className="text-sm font-semibold" style={{ color: '#1A1714' }}>{meta.label}</span>
    </div>
  );
}

export function CityFullContent({ city, saved, onSave }) {
  const sections = city.sections;
  const sectionKeys = Object.keys(sections).filter(k => k !== 'dates' && k !== 'hotelZone');

  return (
    <div className="flex flex-col gap-4 pt-2">
      {sections.dates && (
        <OnYourDatesSection items={sections.dates} cityId={city.id} saved={saved} onSave={onSave} />
      )}
      {sections.hotelZone && (
        <HotelZoneCallout items={sections.hotelZone} cityId={city.id} saved={saved} onSave={onSave} />
      )}
      {sectionKeys.map(key => {
        const meta = SECTION_META[key];
        if (!meta || !sections[key]?.length) return null;
        const type = key === 'sporting' ? 'sport' : key === 'hotelZone' ? 'hotel' : key;
        return (
          <div key={key} className="flex flex-col gap-2">
            <SectionDivider meta={meta} />
            <SectionCards
              items={sections[key]}
              type={type}
              cityId={city.id}
              sectionKey={key}
              saved={saved}
              onSave={onSave}
            />
          </div>
        );
      })}
    </div>
  );
}
