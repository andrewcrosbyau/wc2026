import { useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { TRIP_DAYS, CITY_ACCENT } from '../data';
import { CityFullContent } from './shared/Card';

function DayCard({ tripDay, index, isExpanded, onToggle, saved, onSave }) {
  const { iso, formatted, city, cheatRow } = tripDay;
  const today = new Date().toISOString().slice(0, 10);
  const isPast    = iso < today;
  const isToday   = iso === today;
  const isWC      = cheatRow?.type === 'wc';
  const accent    = city ? (CITY_ACCENT[city.id] || CITY_ACCENT.vancouver) : null;
  const cardRef   = useRef(null);

  useEffect(() => {
    if (isToday && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isToday]);

  return (
    <div
      ref={cardRef}
      className="rounded-2xl border overflow-hidden"
      style={{
        borderColor: isWC ? '#E8C0A0' : isToday ? accent?.hex || '#E8E0D8' : '#E8E0D8',
        opacity: isPast ? 0.55 : 1,
        borderLeftWidth: isWC || isToday ? '4px' : '1px',
        borderLeftColor: isWC ? '#C04E1A' : isToday ? accent?.hex || '#E8E0D8' : '#E8E0D8',
      }}
    >
      {/* Collapsed header — always visible */}
      <button
        onClick={() => onToggle(index)}
        className="w-full text-left px-4 py-3 flex items-start gap-3"
        style={{ backgroundColor: isWC ? '#FDF5F0' : '#FFFFFF' }}
      >
        <div className="min-w-[56px]">
          <p
            className="text-xs font-bold"
            style={{ color: isWC ? '#C04E1A' : isPast ? '#A89E96' : '#1A1714' }}
          >
            {isWC && '⚽ '}{formatted.split(' ').slice(0, 2).join(' ')}
          </p>
          <p className="text-[10px]" style={{ color: '#A89E96' }}>{formatted.split(' ')[2]}</p>
        </div>

        <div className="flex-1 min-w-0">
          {city && (
            <p
              className="text-xs font-semibold mb-0.5"
              style={{ color: accent?.hex || '#6B6560' }}
            >
              {city.label}
              {isToday && (
                <span
                  className="ml-2 rounded-full px-2 py-0.5 text-[9px] font-bold"
                  style={{ backgroundColor: accent?.hex || '#C04E1A', color: '#FFFFFF' }}
                >
                  TODAY
                </span>
              )}
            </p>
          )}
          {cheatRow ? (
            <p className="text-xs leading-snug" style={{ color: isWC ? '#8A5A2A' : '#6B6560' }}>
              {cheatRow.event}
              {cheatRow.note && (
                <span className="italic ml-1" style={{ color: '#A89E96' }}> ({cheatRow.note})</span>
              )}
            </p>
          ) : (
            <p className="text-xs" style={{ color: '#A89E96' }}>Free day</p>
          )}
        </div>

        <div className="shrink-0 mt-0.5" style={{ color: '#A89E96' }}>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && city && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: '#E8E0D8' }}>
          <div className="pt-3 pb-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: '#6B6560' }}>
            <span>🏨 {city.hotel}</span>
            {city.hotelNote && (
              <span className="flex items-center gap-1" style={{ color: '#C04E1A' }}>
                <AlertTriangle size={11} className="shrink-0" />
                {city.hotelNote}
              </span>
            )}
            {city.match && (
              <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                style={{ backgroundColor: '#FDF0E0', border: '1px solid #E8C880', color: '#8A5A2A' }}>
                ⚽ {city.match.teams} · {city.match.time}
              </span>
            )}
          </div>
          <CityFullContent city={city} saved={saved} onSave={onSave} />
        </div>
      )}
    </div>
  );
}

export default function DaysScreen({ expandedDay, setExpandedDay, saved, onSave }) {
  function handleToggle(index) {
    setExpandedDay(prev => (prev === index ? null : index));
  }

  return (
    <div className="flex flex-col gap-2">
      <h2
        className="text-lg font-bold mb-1"
        style={{ fontFamily: "'Cormorant Garant', Georgia, serif", color: '#1A1714' }}
      >
        Trip Schedule
      </h2>
      {TRIP_DAYS.map((day, i) => (
        <DayCard
          key={day.iso}
          tripDay={day}
          index={i}
          isExpanded={expandedDay === i}
          onToggle={handleToggle}
          saved={saved}
          onSave={onSave}
        />
      ))}
      <p className="text-xs text-center pt-2 pb-1" style={{ color: '#A89E96' }}>
        Schedules current as of early June 2026 — confirm minor-league / WNBA times the week before.
      </p>
    </div>
  );
}
