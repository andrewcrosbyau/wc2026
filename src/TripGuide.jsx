import { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Star, Search, X, ChevronRight, Hotel, AlertTriangle, Check } from 'lucide-react';
import { supabase, getClientId, getUserName, setUserName } from './lib/supabase';
import {
  CITIES, CITY_ACCENT, SECTION_META, CARD_STYLE,
  HEADER_MATCHES, CHEAT_SHEET, SEATTLE_STAY_IDS,
} from './data';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function mapsUrl(q) {
  return `https://www.google.com/maps/search/?q=${q}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateLong(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
}

function formatDateChip(iso) {
  const d = new Date(iso + 'T12:00:00');
  return {
    day: d.getDate(),
    month: d.toLocaleDateString('en-AU', { month: 'short' }),
    weekday: d.toLocaleDateString('en-AU', { weekday: 'short' }),
  };
}

function getCityForDate(iso) {
  return CITIES.find(c => iso >= c.startDate && iso <= c.endDate) || null;
}

function Highlight({ text, query }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-100 rounded px-0.5" style={{ color: '#8A5A2A' }}>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── MULTI-USER SAVES HOOK ───────────────────────────────────────────────────

function useSavedCards(myName) {
  const [mySaved, setMySaved] = useState(new Set());
  const [theirSaved, setTheirSaved] = useState(new Set());
  const clientId = useRef(getClientId());

  useEffect(() => {
    supabase
      .from('saved_cards')
      .select('card_id, user_name')
      .then(({ data }) => {
        if (!data) return;
        const mine = new Set();
        const theirs = new Set();
        data.forEach(r => {
          if (myName && r.user_name === myName) mine.add(r.card_id);
          else if (r.user_name && r.user_name !== myName) theirs.add(r.card_id);
        });
        setMySaved(mine);
        setTheirSaved(theirs);
      });
  }, [myName]);

  const toggle = (cardId) => {
    if (!myName) return;
    setMySaved(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
        supabase.from('saved_cards').delete()
          .eq('client_id', clientId.current)
          .eq('card_id', cardId)
          .eq('user_name', myName);
      } else {
        next.add(cardId);
        supabase.from('saved_cards').insert({
          client_id: clientId.current,
          card_id: cardId,
          user_name: myName,
        });
      }
      return next;
    });
  };

  return { mySaved, theirSaved, toggle };
}

// ─── SAVE ID LOOKUP ───────────────────────────────────────────────────────────

function lookupSavedItem(id) {
  const parts = id.split(':');
  const [cityId, sectionKey, cardIdx, placeIdx] = parts;
  const city = CITIES.find(c => c.id === cityId);
  const item = city?.sections[sectionKey]?.[+cardIdx];
  if (!item) return null;
  if (placeIdx !== undefined) {
    const place = item.places?.[+placeIdx];
    return place ? { city, sectionKey, item, place, isPlace: true, id } : null;
  }
  return { city, sectionKey, item, isPlace: false, id };
}

// ─── SEARCH ───────────────────────────────────────────────────────────────────

function searchCards(query) {
  const q = query.toLowerCase();
  const results = [];
  CITIES.forEach(city => {
    Object.entries(city.sections).forEach(([sectionKey, items]) => {
      if (!Array.isArray(items)) return;
      items.forEach((item, idx) => {
        const haystack = [
          item.title || '',
          item.text || '',
          ...(item.places || []).map(p => `${p.name} ${p.detail || ''}`),
        ].join(' ').toLowerCase();
        if (haystack.includes(q)) results.push({ city, sectionKey, item, idx });
      });
    });
  });
  return results;
}

// ─── SAVE BUTTON ──────────────────────────────────────────────────────────────

function SaveButton({ id, mySaved, theirSaved, toggle }) {
  const isMine = mySaved.has(id);
  const isConfirmed = isMine && theirSaved.has(id);
  if (isConfirmed) {
    return (
      <button onClick={() => toggle(id)} className="shrink-0 transition-colors" style={{ color: '#4A7A5A' }} aria-label="Saved by both">
        <Check size={13} strokeWidth={2.5} />
      </button>
    );
  }
  return (
    <button onClick={() => toggle(id)} className="shrink-0 transition-colors" style={{ color: isMine ? '#C04E1A' : '#D8CECA' }} aria-label={isMine ? 'Unsave' : 'Save'}>
      <Star size={13} fill={isMine ? 'currentColor' : 'none'} />
    </button>
  );
}

// ─── PLACE ROW ────────────────────────────────────────────────────────────────

function PlacesList({ places, query, cardId, mySaved, theirSaved, toggle }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {places.map((place, i) => {
        const placeId = cardId ? `${cardId}:${i}` : null;
        return (
          <li key={i} className="flex items-center gap-2 rounded-lg px-3 py-2 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E0D8' }}>
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
                <span className="text-xs shrink-0" style={{ color: '#7A726C' }}>
                  · <Highlight text={place.detail} query={query} />
                </span>
              )}
            </a>
            {placeId && toggle && (
              <SaveButton id={placeId} mySaved={mySaved} theirSaved={theirSaved} toggle={toggle} />
            )}
            <ChevronRight size={12} className="shrink-0" style={{ color: '#D8CECA' }} />
          </li>
        );
      })}
    </ul>
  );
}

// ─── CARD COMPONENTS ──────────────────────────────────────────────────────────

function Card({ title, text, places, type = 'culture', cardId, mySaved, theirSaved, toggle, query }) {
  const style = CARD_STYLE[type] || CARD_STYLE.culture;
  const hasPlaces = places && places.length > 0;

  return (
    <div className="rounded-xl px-3 py-2.5 border" style={{ backgroundColor: style.cardBg, borderColor: style.cardBorder, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold leading-snug" style={{ color: style.title }}>
          <Highlight text={title} query={query} />
        </p>
        {!hasPlaces && toggle && cardId && (
          <SaveButton id={cardId} mySaved={mySaved} theirSaved={theirSaved} toggle={toggle} />
        )}
      </div>
      {text && (
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#4A4540' }}>
          <Highlight text={text} query={query} />
        </p>
      )}
      {hasPlaces && <PlacesList places={places} query={query} cardId={cardId} mySaved={mySaved} theirSaved={theirSaved} toggle={toggle} />}
    </div>
  );
}

function NoteCallout({ title, text, cardId, mySaved, theirSaved, toggle }) {
  return (
    <div className="flex gap-3 pl-3 pr-2 py-2" style={{ borderLeft: '3px solid #D8CECA' }}>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold leading-snug" style={{ color: '#4A4540' }}>{title}</p>
        {text && <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#7A726C' }}>{text}</p>}
      </div>
      {toggle && cardId && (
        <SaveButton id={cardId} mySaved={mySaved} theirSaved={theirSaved} toggle={toggle} />
      )}
    </div>
  );
}

function RunningCard({ title, text, cardId, mySaved, theirSaved, toggle }) {
  return (
    <div className="py-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium italic leading-snug" style={{ color: '#5A7A8A', fontFamily: "'Cormorant Garant', Georgia, serif", fontSize: '1rem' }}>{title}</p>
        {toggle && cardId && (
          <SaveButton id={cardId} mySaved={mySaved} theirSaved={theirSaved} toggle={toggle} />
        )}
      </div>
      {text && <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#7A726C' }}>{text}</p>}
    </div>
  );
}

function MatchTicket({ teams, venue, time, cityId }) {
  const accent = CITY_ACCENT[cityId] || CITY_ACCENT.vancouver;
  return (
    <div className="rounded-xl px-5 py-4" style={{ backgroundColor: '#C04E1A', color: '#FFFFFF' }}>
      <p className="text-2xl font-semibold leading-tight" style={{ fontFamily: "'Cormorant Garant', Georgia, serif" }}>
        ⚽ {teams}
      </p>
      <p className="text-xs mt-1.5 font-medium tracking-wide uppercase" style={{ color: 'rgba(255,255,255,0.75)' }}>
        {venue} · {time}
      </p>
    </div>
  );
}

// ─── SECTION LABEL ────────────────────────────────────────────────────────────

function SectionLabel({ label, color }) {
  return (
    <p className="text-[10px] tracking-[0.2em] uppercase font-medium" style={{ color: color || '#7A726C' }}>{label}</p>
  );
}

// ─── CITY VIEW ────────────────────────────────────────────────────────────────

function CityView({ city, savedProps, navigate }) {
  const { mySaved, theirSaved, toggle } = savedProps;
  const accent = CITY_ACCENT[city.id] || CITY_ACCENT.vancouver;
  const isSeattle = SEATTLE_STAY_IDS.includes(city.id);

  const renderDatesSection = (items) => {
    return items.map((item, i) => {
      const cardId = `${city.id}:dates:${i}`;
      if (item.type === 'wc') {
        return (
          <div key={i} className="rounded-xl px-5 py-4" style={{ backgroundColor: '#C04E1A', color: '#FFFFFF' }}>
            <p className="text-2xl font-semibold leading-tight" style={{ fontFamily: "'Cormorant Garant', Georgia, serif" }}>
              ⚽ {item.title}
            </p>
            {item.text && <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>{item.text}</p>}
            {item.places && <PlacesList places={item.places} cardId={cardId} mySaved={mySaved} theirSaved={theirSaved} toggle={toggle} />}
          </div>
        );
      }
      if (item.type === 'note') {
        return <NoteCallout key={i} title={item.title} text={item.text} cardId={cardId} mySaved={mySaved} theirSaved={theirSaved} toggle={toggle} />;
      }
      return (
        <Card key={i} title={item.title} text={item.text} places={item.places}
          type={item.type || 'sport'} cardId={cardId}
          mySaved={mySaved} theirSaved={theirSaved} toggle={toggle} />
      );
    });
  };

  const renderSection = (sectionKey, items) => {
    if (!items || items.length === 0) return null;
    const meta = SECTION_META[sectionKey];

    return items.map((item, i) => {
      const cardId = `${city.id}:${sectionKey}:${i}`;
      if (sectionKey === 'running') {
        return <RunningCard key={i} title={item.title} text={item.text} cardId={cardId} mySaved={mySaved} theirSaved={theirSaved} toggle={toggle} />;
      }
      if (item.type === 'note') {
        return <NoteCallout key={i} title={item.title} text={item.text} cardId={cardId} mySaved={mySaved} theirSaved={theirSaved} toggle={toggle} />;
      }
      const type = sectionKey === 'sporting' ? 'sport' : sectionKey === 'hotelZone' ? 'hotel' : (item.type || sectionKey);
      return (
        <Card key={i} title={item.title} text={item.text} places={item.places}
          type={type} cardId={cardId}
          mySaved={mySaved} theirSaved={theirSaved} toggle={toggle} />
      );
    });
  };

  const sectionOrder = ['dates', 'hotelZone', 'sporting', 'culture', 'running', 'food'];

  return (
    <div className="flex flex-col gap-8">
      {/* City header */}
      <div>
        {isSeattle && (
          <div className="flex gap-2 mb-3">
            {SEATTLE_STAY_IDS.map(id => {
              const stay = CITIES.find(c => c.id === id);
              if (!stay) return null;
              const isActive = city.id === id;
              const today = todayIso();
              const isPast = today > stay.endDate;
              return (
                <button
                  key={id}
                  onClick={() => navigate(id)}
                  className="text-xs px-3 py-1 rounded-full border transition-colors"
                  style={{
                    backgroundColor: isActive ? accent.hex : 'transparent',
                    borderColor: isActive ? accent.hex : '#D8CECA',
                    color: isActive ? '#FFFFFF' : isPast ? '#B0A8A0' : '#4A4540',
                  }}
                >
                  {stay.dates}{isPast ? ' ✓' : ''}
                </button>
              );
            })}
          </div>
        )}

        <h2 className="text-4xl font-semibold leading-tight" style={{ fontFamily: "'Cormorant Garant', Georgia, serif", color: accent.hex }}>
          {city.label}
        </h2>

        <div className="flex items-center gap-3 flex-wrap text-xs mt-2" style={{ color: '#4A4540' }}>
          <span className="flex items-center gap-1">
            <Hotel size={11} className="shrink-0" />
            {city.hotel}
          </span>
          {city.hotelNote && (
            <span className="flex items-center gap-1" style={{ color: '#C04E1A' }}>
              <AlertTriangle size={11} className="shrink-0" />
              {city.hotelNote}
            </span>
          )}
          <span style={{ color: '#7A726C' }}>{city.dates}</span>
        </div>
      </div>

      {sectionOrder.map(sectionKey => {
        const items = city.sections[sectionKey];
        if (!items || items.length === 0) return null;
        const meta = SECTION_META[sectionKey];

        const renderedItems = sectionKey === 'dates'
          ? renderDatesSection(items)
          : renderSection(sectionKey, items);

        return (
          <div key={sectionKey} className="flex flex-col gap-3">
            <SectionLabel label={meta.label} color={meta.color} />
            <div className={`flex flex-col ${sectionKey === 'running' ? 'gap-3' : 'gap-2'}`}>
              {renderedItems}
            </div>
            {isSeattle && sectionKey === 'hotelZone' && city.id === 'seattle2' && (
              <button
                onClick={() => navigate('seattle1')}
                className="flex items-center gap-1.5 text-xs mt-1 transition-opacity hover:opacity-70"
                style={{ color: CITY_ACCENT.seattle1.hex }}
              >
                <ChevronRight size={13} />
                Culture & food from your first Seattle stay (14–16 Jun) →
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── BRIEFING VIEW ────────────────────────────────────────────────────────────

const TRIP_START = '2026-06-12';
const TRIP_END   = '2026-06-26';

const ALL_DATES = Array.from({ length: 15 }, (_, i) => {
  const d = new Date('2026-06-12T12:00:00');
  d.setDate(d.getDate() + i);
  return d.toISOString().slice(0, 10);
});

function BriefingView({ briefingDate, setBriefingDate, savedProps, navigate }) {
  const { mySaved, theirSaved, toggle } = savedProps;
  const today = todayIso();
  const isPreTrip = today < TRIP_START;
  const isPostTrip = today > TRIP_END;

  const city = getCityForDate(briefingDate);
  const cheatEvents = CHEAT_SHEET.filter(e => e.iso === briefingDate);

  const mustDoPicks = useMemo(() => {
    if (!city) return { morning: [], afternoon: [], evening: [] };
    const picks = { morning: [], afternoon: [], evening: [] };
    Object.entries(city.sections).forEach(([sectionKey, items]) => {
      if (sectionKey === 'dates' || !Array.isArray(items)) return;
      items.forEach(item => {
        if (!item.mustDo) return;
        const slot = item.timing === 'morning' ? 'morning'
          : item.timing === 'afternoon' ? 'afternoon'
          : item.timing === 'evening' ? 'evening'
          : null;
        if (slot && picks[slot].length < 2) picks[slot].push(item);
      });
    });
    return picks;
  }, [city, briefingDate]);

  const dateStripRef = useRef(null);
  useEffect(() => {
    if (!dateStripRef.current) return;
    const idx = ALL_DATES.indexOf(briefingDate);
    if (idx >= 0) {
      const btn = dateStripRef.current.children[idx];
      if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [briefingDate]);

  if (isPreTrip) {
    const daysLeft = Math.ceil((new Date(TRIP_START) - new Date(today)) / 86400000);
    return (
      <div className="flex flex-col gap-8">
        <div className="pt-4">
          <p className="text-[10px] tracking-[0.2em] uppercase font-medium mb-2" style={{ color: '#7A726C' }}>Trip Countdown</p>
          <p className="text-4xl font-semibold" style={{ fontFamily: "'Cormorant Garant', Georgia, serif", color: '#C04E1A' }}>{daysLeft} days to go</p>
          <p className="text-sm mt-1" style={{ color: '#4A4540' }}>Pacific NW & Northern California · 12–26 Jun 2026</p>
        </div>
        <div className="flex flex-col gap-3">
          <SectionLabel label="Your Matches" color="#C04E1A" />
          {HEADER_MATCHES.map((m, i) => (
            <div key={i} className="rounded-xl px-5 py-4" style={{ backgroundColor: '#C04E1A', color: '#FFFFFF' }}>
              <p className="text-xl font-semibold" style={{ fontFamily: "'Cormorant Garant', Georgia, serif" }}>⚽ {m.teams}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.75)' }}>{m.venue} · {m.date}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Date strip */}
      <div ref={dateStripRef} className="flex gap-1.5 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
        {ALL_DATES.map(iso => {
          const chip = formatDateChip(iso);
          const isPast = iso < today;
          const isToday = iso === today;
          const isSelected = iso === briefingDate;
          return (
            <button
              key={iso}
              onClick={() => setBriefingDate(iso)}
              className="flex-none flex flex-col items-center px-2.5 py-2 rounded-lg transition-colors"
              style={{
                minWidth: 48,
                backgroundColor: isSelected ? '#C04E1A' : isToday ? '#FDF5F0' : 'transparent',
                border: isSelected ? 'none' : isToday ? '1px solid #E8C0A0' : '1px solid transparent',
                color: isSelected ? '#FFFFFF' : isPast ? '#B0A8A0' : '#1A1714',
              }}
            >
              <span className="text-sm font-semibold">{chip.day}</span>
              <span className="text-[10px]">{chip.month}</span>
              {isPast && !isSelected && <span className="text-[9px]" style={{ color: '#B0A8A0' }}>✓</span>}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-8 pt-2">
        {/* Date heading + city link */}
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-semibold tracking-[0.12em] uppercase" style={{ color: '#1A1714' }}>{formatDateLong(briefingDate)}</p>
          {city && (
            <button onClick={() => navigate(city.id)} className="text-xs flex items-center gap-0.5 shrink-0 transition-opacity hover:opacity-70" style={{ color: CITY_ACCENT[city.id]?.hex || '#6B6560' }}>
              {city.label} <ChevronRight size={12} />
            </button>
          )}
        </div>

        {/* Hotel */}
        {city && (
          <div>
            <p className="text-xs flex items-center gap-1.5" style={{ color: '#4A4540' }}>
              <Hotel size={11} className="shrink-0" style={{ color: '#7A726C' }} />
              {city.hotel}
            </p>
            {city.hotelNote && (
              <p className="text-xs mt-1 flex items-center gap-1.5" style={{ color: '#C04E1A' }}>
                <AlertTriangle size={11} className="shrink-0" />
                {city.hotelNote}
              </p>
            )}
          </div>
        )}

        {/* Events from cheat sheet */}
        {cheatEvents.length > 0 && (
          <div className="flex flex-col gap-3">
            <SectionLabel label="Events" color="#C04E1A" />
            {cheatEvents.map((ev, i) => {
              if (ev.type === 'wc') {
                return (
                  <div key={i} className="rounded-xl px-5 py-4" style={{ backgroundColor: '#C04E1A', color: '#FFFFFF' }}>
                    <p className="text-xl font-semibold leading-tight" style={{ fontFamily: "'Cormorant Garant', Georgia, serif" }}>⚽ {ev.event}</p>
                    {ev.note && <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.75)' }}>{ev.note}</p>}
                  </div>
                );
              }
              return (
                <div key={i} className="rounded-xl px-3 py-2.5 border" style={{ backgroundColor: '#F3F7F3', borderColor: '#B0CDB8' }}>
                  <p className="text-sm font-bold" style={{ color: '#4A7A5A' }}>{ev.event}</p>
                  {ev.note && <p className="text-xs mt-0.5" style={{ color: '#7A726C' }}>({ev.note})</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* Today's picks by timing */}
        {city && (Object.values(mustDoPicks).some(arr => arr.length > 0)) && (
          <div className="flex flex-col gap-4">
            <SectionLabel label="Today's Picks" color="#7A726C" />
            {['morning', 'afternoon', 'evening'].map(slot => {
              const picks = mustDoPicks[slot];
              if (!picks.length) return null;
              return (
                <div key={slot}>
                  <p className="text-[10px] tracking-[0.15em] uppercase mb-2" style={{ color: '#B0A8A0' }}>{slot}</p>
                  <div className="flex flex-col gap-1.5">
                    {picks.map((item, i) => (
                      <div key={i} className="flex items-baseline gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium" style={{ color: '#1A1714' }}>{item.title}</span>
                          {item.places && item.places[0] && (
                            <a
                              href={mapsUrl(item.places[0].maps)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs ml-1.5 transition-opacity hover:opacity-70"
                              style={{ color: '#7A726C' }}
                            >
                              {item.places[0].name} ↗
                            </a>
                          )}
                          {!item.places && item.text && (
                            <span className="text-xs ml-1.5" style={{ color: '#7A726C' }}>{item.text.slice(0, 60)}{item.text.length > 60 ? '…' : ''}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!city && (
          <p className="text-sm" style={{ color: '#7A726C' }}>No city scheduled for this date.</p>
        )}
      </div>
    </div>
  );
}

// ─── CHEAT SHEET ──────────────────────────────────────────────────────────────

function CheatSheet() {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-3xl font-semibold" style={{ fontFamily: "'Cormorant Garant', Georgia, serif", color: '#1A1714' }}>
        Cheat Sheet
      </h2>
      <div className="overflow-x-auto -mx-1">
        <table className="w-full min-w-[480px] text-xs border-separate border-spacing-y-1">
          <thead>
            <tr className="uppercase tracking-wider text-[10px]" style={{ color: '#7A726C' }}>
              <th className="text-left px-2 py-1 font-semibold">Date</th>
              <th className="text-left px-2 py-1 font-semibold">City</th>
              <th className="text-left px-2 py-1 font-semibold">Event</th>
            </tr>
          </thead>
          <tbody>
            {CHEAT_SHEET.map((row, i) => {
              const isWC = row.type === 'wc';
              return (
                <tr key={i} style={{ backgroundColor: isWC ? '#FDF5F0' : i % 2 === 0 ? '#FFFFFF' : '#F5F0E8' }}>
                  <td className="px-2 py-2 font-semibold whitespace-nowrap rounded-l-lg" style={{ color: isWC ? '#C04E1A' : '#1A1714' }}>
                    {isWC && <span className="mr-1">⚽</span>}{row.date}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap" style={{ color: isWC ? '#8A5A2A' : '#4A4540' }}>{row.city}</td>
                  <td className="px-2 py-2 rounded-r-lg leading-relaxed" style={{ color: isWC ? '#8A5A2A' : '#4A4540' }}>
                    {row.event}
                    {row.note && <span className="italic ml-1" style={{ color: '#7A726C' }}>({row.note})</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3 text-xs mt-1" style={{ color: '#7A726C' }}>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded inline-block" style={{ backgroundColor: '#E8C0A0' }} />
          World Cup match
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded inline-block" style={{ backgroundColor: '#E8E0D8' }} />
          Sport / local event
        </span>
      </div>
    </div>
  );
}

// ─── SAVED VIEW ───────────────────────────────────────────────────────────────

function SavedView({ mySaved, theirSaved, toggle, myName, navigate }) {
  const allSavedIds = useMemo(() => {
    const ids = new Set([...mySaved, ...theirSaved]);
    return [...ids];
  }, [mySaved, theirSaved]);

  const items = useMemo(() => allSavedIds.map(lookupSavedItem).filter(Boolean), [allSavedIds]);

  const confirmed = items.filter(x => mySaved.has(x.id) && theirSaved.has(x.id));
  const mineOnly  = items.filter(x => mySaved.has(x.id) && !theirSaved.has(x.id));
  const theirsOnly = items.filter(x => !mySaved.has(x.id) && theirSaved.has(x.id));

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: '#7A726C' }}>
        <Star size={32} style={{ color: '#D8CECA' }} />
        <p className="text-sm">No saved items yet</p>
        <p className="text-xs" style={{ color: '#D8CECA' }}>Tap the star on any venue to save it here</p>
      </div>
    );
  }

  const renderSavedItem = ({ item, sectionKey, id, place, isPlace, city }) => {
    if (isPlace) {
      return (
        <div key={id} className="flex items-center gap-2 rounded-lg px-3 py-2 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E0D8' }}>
          <MapPin size={12} className="shrink-0" style={{ color: '#7A726C' }} />
          <div className="flex-1 min-w-0">
            <a href={mapsUrl(place.maps)} target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">
              <span className="text-sm font-medium" style={{ color: '#1A1714' }}>{place.name}</span>
              {place.detail && <span className="text-xs ml-1.5" style={{ color: '#7A726C' }}>{place.detail}</span>}
            </a>
            <p className="text-xs mt-0.5" style={{ color: '#7A726C' }}>
              {SECTION_META[sectionKey]?.label}{item.title && ` · ${item.title}`}
            </p>
          </div>
          <SaveButton id={id} mySaved={mySaved} theirSaved={theirSaved} toggle={toggle} />
        </div>
      );
    }
    const type = item.type || (sectionKey === 'sporting' ? 'sport' : sectionKey === 'hotelZone' ? 'hotel' : sectionKey);
    return item.type === 'wc'
      ? (
        <div key={id} className="rounded-xl px-3 py-2.5 border" style={{ backgroundColor: '#FDF5F0', borderColor: '#E8C0A0' }}>
          <p className="text-sm font-bold" style={{ color: '#C04E1A' }}>⚽ {item.title}</p>
          {item.text && <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#8A5A2A' }}>{item.text}</p>}
        </div>
      )
      : (
        <Card key={id} title={item.title} text={item.text} places={item.places}
          type={type} cardId={id} mySaved={mySaved} theirSaved={theirSaved} toggle={toggle} />
      );
  };

  const GroupedSection = ({ title, color, items: sectionItems, icon }) => {
    if (!sectionItems.length) return null;
    const grouped = sectionItems.reduce((acc, x) => {
      const key = x.city.id;
      if (!acc[key]) acc[key] = { city: x.city, items: [] };
      acc[key].items.push(x);
      return acc;
    }, {});
    return (
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color }}>
          <span>{icon}</span> {title}
        </p>
        {Object.values(grouped).map(({ city, items: cityItems }) => {
          const accent = CITY_ACCENT[city.id] || CITY_ACCENT.vancouver;
          return (
            <div key={city.id}>
              <button onClick={() => navigate(city.id)} className="flex items-center gap-1 mb-1.5 hover:opacity-80 transition-opacity" style={{ color: accent.hex }}>
                <span className="text-sm font-semibold" style={{ fontFamily: "'Cormorant Garant', Georgia, serif" }}>{city.label}</span>
                <ChevronRight size={13} />
              </button>
              <div className="flex flex-col gap-2">{cityItems.map(renderSavedItem)}</div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-3xl font-semibold" style={{ fontFamily: "'Cormorant Garant', Georgia, serif", color: '#1A1714' }}>
        Saved
      </h2>
      <GroupedSection title="Both saved" color="#4A7A5A" icon="✓" items={confirmed} />
      <GroupedSection title={`${myName || 'My'} picks`} color="#C04E1A" icon="★" items={mineOnly} />
      <GroupedSection title="Their picks" color="#7A726C" icon="★" items={theirsOnly} />
    </div>
  );
}

// ─── SEARCH RESULTS ───────────────────────────────────────────────────────────

function SearchResults({ query, onNavigate, savedProps }) {
  const { mySaved, theirSaved, toggle } = savedProps;
  const results = useMemo(() => searchCards(query), [query]);

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2" style={{ color: '#7A726C' }}>
        <p className="text-sm">No results for "{query}"</p>
      </div>
    );
  }

  const grouped = results.reduce((acc, r) => {
    const key = r.city.id;
    if (!acc[key]) acc[key] = { city: r.city, results: [] };
    acc[key].results.push(r);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs" style={{ color: '#7A726C' }}>{results.length} result{results.length !== 1 ? 's' : ''} for "{query}"</p>
      {Object.values(grouped).map(({ city, results: cityResults }) => {
        const accent = CITY_ACCENT[city.id] || CITY_ACCENT.vancouver;
        return (
          <div key={city.id}>
            <button onClick={() => onNavigate(city.id)} className="flex items-center gap-1.5 mb-2 hover:opacity-80 transition-opacity" style={{ color: accent.hex }}>
              <span className="text-sm font-bold" style={{ fontFamily: "'Cormorant Garant', Georgia, serif" }}>{city.label}</span>
              <ChevronRight size={14} />
            </button>
            <div className="flex flex-col gap-2">
              {cityResults.map(({ item, sectionKey, idx }) => {
                const type = item.type || (sectionKey === 'sporting' ? 'sport' : sectionKey === 'hotelZone' ? 'hotel' : sectionKey);
                const meta = SECTION_META[sectionKey];
                const cardId = `${city.id}:${sectionKey}:${idx}`;
                return (
                  <div key={cardId} className="relative">
                    {meta && (
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-[10px] uppercase tracking-wider" style={{ color: '#7A726C' }}>{meta.label}</span>
                      </div>
                    )}
                    {item.type === 'wc'
                      ? <div className="rounded-xl px-3 py-2.5 border" style={{ backgroundColor: '#FDF5F0', borderColor: '#E8C0A0' }}>
                          <p className="text-sm font-bold" style={{ color: '#C04E1A' }}>⚽ {item.title}</p>
                          {item.text && <p className="text-xs mt-0.5" style={{ color: '#8A5A2A' }}>{item.text}</p>}
                        </div>
                      : <Card title={item.title} text={item.text} places={item.places}
                          type={type} cardId={cardId} query={query}
                          mySaved={mySaved} theirSaved={theirSaved} toggle={toggle} />
                    }
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── USER PICKER ──────────────────────────────────────────────────────────────

function UserPicker({ onPick }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6" style={{ backgroundColor: '#FAF7F2' }}>
      <h1 className="text-4xl font-semibold mb-2 text-center" style={{ fontFamily: "'Cormorant Garant', Georgia, serif", color: '#1A1714' }}>
        World Cup 2026
      </h1>
      <p className="text-sm mb-6 text-center" style={{ color: '#4A4540' }}>Pacific NW &amp; Northern California · 15 days</p>
      <p className="text-base mb-3" style={{ color: '#1A1714' }}>What's your name?</p>
      <input
        ref={inputRef}
        type="text"
        placeholder="e.g. Andy"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && value.trim() && onPick(value.trim())}
        className="w-full max-w-xs rounded-lg px-4 py-3 text-sm outline-none mb-4"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8CECA', color: '#1A1714' }}
      />
      <button
        onClick={() => value.trim() && onPick(value.trim())}
        disabled={!value.trim()}
        className="px-6 py-2.5 rounded-full text-sm font-medium transition-opacity"
        style={{
          backgroundColor: value.trim() ? '#C04E1A' : '#E8E0D8',
          color: value.trim() ? '#FFFFFF' : '#A89E96',
          cursor: value.trim() ? 'pointer' : 'default',
        }}
      >
        Let's go →
      </button>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function TripGuide() {
  const [myName, setMyName] = useState(() => getUserName());
  const [showPicker, setShowPicker] = useState(() => !getUserName());

  const today = todayIso();
  const defaultCity = (() => {
    const current = CITIES.find(c => today >= c.startDate && today <= c.endDate);
    return current?.id || 'vancouver';
  })();

  const [showBriefing, setShowBriefing] = useState(true);
  const [briefingDate, setBriefingDate] = useState(() => {
    if (today < TRIP_START) return TRIP_START;
    if (today > TRIP_END) return TRIP_END;
    return today;
  });
  const [activeCity, setActiveCity] = useState(defaultCity);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef(null);
  const touchStartX = useRef(null);

  const { mySaved, theirSaved, toggle } = useSavedCards(myName);
  const savedProps = { mySaved, theirSaved, toggle };
  const savedCount = mySaved.size;

  // Hash routing
  useEffect(() => {
    const parse = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash || hash === 'today') { setShowBriefing(true); setShowCheatSheet(false); setShowSaved(false); return; }
      if (hash.startsWith('today/')) {
        const iso = hash.slice(6);
        setShowBriefing(true); setShowCheatSheet(false); setShowSaved(false);
        if (ALL_DATES.includes(iso)) setBriefingDate(iso);
        return;
      }
      if (hash === 'cheatsheet') { setShowCheatSheet(true); setShowSaved(false); setShowBriefing(false); return; }
      if (hash === 'saved') { setShowSaved(true); setShowCheatSheet(false); setShowBriefing(false); return; }
      const [cityId] = hash.split('/');
      const match = CITIES.find(c => c.id === cityId);
      if (match) {
        setActiveCity(match.id);
        setShowBriefing(false); setShowCheatSheet(false); setShowSaved(false);
      }
    };
    parse();
    window.addEventListener('popstate', parse);
    return () => window.removeEventListener('popstate', parse);
  }, []);

  const navigate = (cityId) => {
    history.pushState(null, '', `#${cityId}`);
    setActiveCity(cityId);
    setShowBriefing(false); setShowCheatSheet(false); setShowSaved(false); setSearchQuery('');
  };

  const goToday = () => {
    history.pushState(null, '', '#today');
    setShowBriefing(true); setShowCheatSheet(false); setShowSaved(false); setSearchQuery('');
  };

  const goCheatSheet = () => {
    history.pushState(null, '', '#cheatsheet');
    setShowCheatSheet(true); setShowSaved(false); setShowBriefing(false); setSearchQuery('');
  };

  const goSaved = () => {
    history.pushState(null, '', '#saved');
    setShowSaved(true); setShowCheatSheet(false); setShowBriefing(false); setSearchQuery('');
  };

  const handleTouchStart = e => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = e => {
    if (touchStartX.current === null || showCheatSheet || showSaved || showBriefing || searchQuery) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 60) return;
    const idx = CITIES.findIndex(c => c.id === activeCity);
    if (dx < 0 && idx < CITIES.length - 1) navigate(CITIES[idx + 1].id);
    if (dx > 0 && idx > 0) navigate(CITIES[idx - 1].id);
    touchStartX.current = null;
  };

  const handlePickName = (name) => {
    setUserName(name);
    setMyName(name);
    setShowPicker(false);
  };

  const city = CITIES.find(c => c.id === activeCity);
  const isSearching = searchQuery.length > 0;

  // Time-gate nav styling
  const getCityNavStyle = (c) => {
    const isActive = !showCheatSheet && !showSaved && !showBriefing && !isSearching &&
      (activeCity === c.id || (SEATTLE_STAY_IDS.includes(c.id) && SEATTLE_STAY_IDS.includes(activeCity) && c.id === 'seattle1'));
    const accent = CITY_ACCENT[c.id] || CITY_ACCENT.vancouver;
    const isPast = today > c.endDate;
    const isCurrent = today >= c.startDate && today <= c.endDate;
    return {
      color: isActive ? accent.hex : isPast ? '#B0A8A0' : isCurrent ? accent.hex : '#4A4540',
      borderBottomColor: isActive ? accent.hex : 'transparent',
      opacity: isPast ? 0.75 : 1,
    };
  };

  // Seattle nav: show single button
  const seattleIsActive = !showCheatSheet && !showSaved && !showBriefing && !isSearching && SEATTLE_STAY_IDS.includes(activeCity);
  const seattleIsPast = today > '2026-06-20';
  const seattleIsCurrent = today >= '2026-06-14' && today <= '2026-06-20';
  const seattleNavStyle = {
    color: seattleIsActive ? CITY_ACCENT.seattle1.hex : seattleIsPast ? '#B0A8A0' : seattleIsCurrent ? CITY_ACCENT.seattle1.hex : '#4A4540',
    borderBottomColor: seattleIsActive ? CITY_ACCENT.seattle1.hex : 'transparent',
    opacity: seattleIsPast ? 0.75 : 1,
  };

  const handleSeattleNav = () => {
    if (seattleIsActive) {
      navigate(activeCity === 'seattle1' ? 'seattle2' : 'seattle1');
    } else {
      navigate(today >= '2026-06-18' ? 'seattle2' : 'seattle1');
    }
  };

  const nonSeattleCities = CITIES.filter(c => !SEATTLE_STAY_IDS.includes(c.id));

  return (
    <div className="min-h-dvh" style={{ backgroundColor: '#FAF7F2', color: '#1A1714' }}>
      {showPicker && <UserPicker onPick={handlePickName} />}

      {/* HEADER */}
      <header className="sticky top-0 z-30 px-4 pt-4 pb-2 border-b" style={{ backgroundColor: '#F5F0E8', borderColor: '#E8E0D8' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold leading-tight" style={{ fontFamily: "'Cormorant Garant', Georgia, serif", color: '#1A1714' }}>
                World Cup 2026 Trip Guide
              </h1>
              <p className="text-xs mt-0.5 flex items-center gap-2" style={{ color: '#7A726C' }}>
                Pacific NW &amp; California · 12–26 Jun
                {myName && (
                  <button
                    onClick={() => setShowPicker(true)}
                    className="rounded-full px-2 py-0.5 text-[10px] transition-opacity hover:opacity-70"
                    style={{ backgroundColor: '#E8E0D8', color: '#4A4540' }}
                  >
                    {myName}
                  </button>
                )}
              </p>
            </div>
          </div>

          {/* Persistent search bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#A89E96' }} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search venues, restaurants, activities…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg pl-8 pr-8 py-2 text-sm outline-none"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8CECA', color: '#1A1714' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#A89E96' }}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* CITY NAV */}
      {!isSearching && (
        <nav className="sticky top-[var(--header-h,0)] z-20 border-b" style={{ backgroundColor: '#F5F0E8', borderColor: '#E8E0D8' }}>
          <div className="max-w-2xl mx-auto">
            <div className="flex overflow-x-auto scrollbar-hide">
              {/* Today button */}
              <button
                onClick={goToday}
                className="flex-none px-3.5 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors"
                style={{
                  color: showBriefing && !isSearching ? '#C04E1A' : '#4A4540',
                  borderBottomColor: showBriefing && !isSearching ? '#C04E1A' : 'transparent',
                }}
              >
                Today
              </button>

              {/* Vancouver */}
              <button
                onClick={() => navigate('vancouver')}
                className="flex-none px-3.5 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors"
                style={getCityNavStyle(CITIES.find(c => c.id === 'vancouver'))}
              >
                Vancouver
                {today > '2026-06-14' && <span className="ml-0.5 text-[9px]">✓</span>}
              </button>

              {/* Seattle — merged single button */}
              <button
                onClick={handleSeattleNav}
                className="flex-none px-3.5 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors"
                style={seattleNavStyle}
              >
                Seattle{<span className="ml-1" style={{ color: '#C04E1A' }}>⚽</span>}
                {seattleIsPast && <span className="ml-0.5 text-[9px]">✓</span>}
              </button>

              {/* Remaining non-Seattle, non-Vancouver cities in order */}
              {['olympic', 'portland', 'craterlake', 'napa', 'sf'].map(id => {
                const c = CITIES.find(x => x.id === id);
                if (!c) return null;
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate(c.id)}
                    className="flex-none px-3.5 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors"
                    style={getCityNavStyle(c)}
                  >
                    {c.label}{c.match && <span className="ml-1" style={{ color: '#C04E1A' }}>⚽</span>}
                    {today > c.endDate && <span className="ml-0.5 text-[9px]">✓</span>}
                  </button>
                );
              })}

              <button
                onClick={goCheatSheet}
                className="flex-none px-3.5 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors"
                style={{
                  color: showCheatSheet && !isSearching ? '#1A1714' : '#4A4540',
                  borderBottomColor: showCheatSheet && !isSearching ? '#1A1714' : 'transparent',
                }}
              >
                📋 Cheat Sheet
              </button>
              <button
                onClick={goSaved}
                className="flex-none px-3.5 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-1"
                style={{
                  color: showSaved && !isSearching ? '#C04E1A' : '#4A4540',
                  borderBottomColor: showSaved && !isSearching ? '#C04E1A' : 'transparent',
                }}
              >
                <Star size={11} fill={savedCount > 0 ? 'currentColor' : 'none'} style={{ color: savedCount > 0 ? '#C04E1A' : undefined }} />
                Saved
                {savedCount > 0 && (
                  <span className="ml-0.5 rounded-full px-1.5 text-[10px] font-bold" style={{ backgroundColor: 'rgba(192,78,26,0.12)', color: '#C04E1A' }}>{savedCount}</span>
                )}
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* CONTENT */}
      <main className="max-w-2xl mx-auto px-4 py-5 pb-16" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {isSearching ? (
          <SearchResults query={searchQuery} onNavigate={navigate} savedProps={savedProps} />
        ) : showCheatSheet ? (
          <CheatSheet />
        ) : showSaved ? (
          <SavedView mySaved={mySaved} theirSaved={theirSaved} toggle={toggle} myName={myName} navigate={navigate} />
        ) : showBriefing ? (
          <BriefingView briefingDate={briefingDate} setBriefingDate={setBriefingDate} savedProps={savedProps} navigate={navigate} />
        ) : city ? (
          <CityView key={city.id} city={city} savedProps={savedProps} navigate={navigate} />
        ) : null}
      </main>

      <footer className="border-t text-center py-4 text-xs" style={{ borderColor: '#E8E0D8', color: '#7A726C' }}>
        Schedules current as of early June 2026 — confirm minor-league / WNBA times the week before.
      </footer>
    </div>
  );
}
