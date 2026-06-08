import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import {
  TRIP_START, TRIP_END, HEADER_MATCHES, CHEAT_SHEET, CITIES, CITY_ACCENT, daysUntil,
} from '../data';
import { Card, WCCard } from './shared/Card';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function kickoffDatetime(matchDate, kickoffTime) {
  const [h, m] = kickoffTime.split(':').map(Number);
  const d = new Date(matchDate + 'T00:00:00');
  d.setHours(h, m, 0, 0);
  return d;
}

function formatCountdown(kickoff) {
  const diffMs = kickoff - Date.now();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin > 120) {
    const hrs = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return `Kickoff in ${hrs}h ${mins > 0 ? `${mins}m` : ''}`.trim();
  }
  if (diffMin > 0)   return `Kickoff in ${diffMin}m`;
  if (diffMin > -120) return 'Match in progress';
  return 'Match played';
}

function getTopPicks(city, excludeWC = false) {
  const picks = [];
  if (city.sections.dates) {
    for (const item of city.sections.dates) {
      if (excludeWC && item.type === 'wc') continue;
      picks.push({ ...item, _sectionKey: 'dates' });
      if (picks.length >= 2) break;
    }
  }
  const foodSection = city.sections.food || city.sections.hotelZone;
  if (foodSection?.[0]) {
    picks.push({ ...foodSection[0], _sectionKey: city.sections.food ? 'food' : 'hotelZone' });
  }
  if (city.sections.culture?.[0]) {
    picks.push({ ...city.sections.culture[0], _sectionKey: 'culture' });
  }
  return picks.slice(0, 4);
}

// ─── MATCH DAY HERO ───────────────────────────────────────────────────────────

function MatchDayHero({ match }) {
  const kickoff = kickoffDatetime(match.matchDate, match.kickoffTime);
  const [countdown, setCountdown] = useState(() => formatCountdown(kickoff));

  useEffect(() => {
    const id = setInterval(() => setCountdown(formatCountdown(kickoff)), 60000);
    return () => clearInterval(id);
  }, [kickoff]);

  const [h, m] = match.kickoffTime.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const timeDisplay = `${h12}:${String(m).padStart(2, '0')} ${ampm}`;

  return (
    <div
      className="rounded-2xl p-5 border"
      style={{ backgroundColor: '#FDF0E0', borderColor: '#E8C880' }}
    >
      <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#C04E1A' }}>
        ⚽ Match Day
      </p>
      <h2
        className="text-3xl font-semibold leading-tight mb-1"
        style={{ fontFamily: "'Cormorant Garant', Georgia, serif", color: '#1A1714' }}
      >
        {match.teams}
      </h2>
      <p className="text-sm mb-4" style={{ color: '#8A5A2A' }}>
        {match.venue} · {timeDisplay}
      </p>

      <div
        className="rounded-xl px-4 py-3 mb-4 text-center"
        style={{ backgroundColor: '#C04E1A' }}
      >
        <p className="text-lg font-bold text-white">{countdown}</p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {match.preMatch && (
          <div className="rounded-xl p-3 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E0D8' }}>
            <p className="text-[10px] font-bold tracking-wider uppercase mb-1" style={{ color: '#A89E96' }}>Pre-match</p>
            <p className="text-xs leading-relaxed" style={{ color: '#1A1714' }}>{match.preMatch}</p>
          </div>
        )}
        {match.transport && (
          <div className="rounded-xl p-3 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E0D8' }}>
            <p className="text-[10px] font-bold tracking-wider uppercase mb-1" style={{ color: '#A89E96' }}>Getting there</p>
            <p className="text-xs leading-relaxed" style={{ color: '#1A1714' }}>{match.transport}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PRE-TRIP STATE ───────────────────────────────────────────────────────────

function PreTripState({ onNavigateDays }) {
  const today = new Date().toDateString();
  const tripStart = new Date(TRIP_START);
  const daysLeft = Math.round((tripStart - new Date(today)) / 86400000);

  const upcomingRows = CHEAT_SHEET.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <section>
        <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#A89E96' }}>
          Trip Countdown
        </p>
        <div className="flex items-baseline gap-3">
          <span
            className="font-semibold leading-none"
            style={{ fontFamily: "'Cormorant Garant', Georgia, serif", fontSize: '72px', color: '#C04E1A' }}
          >
            {daysLeft}
          </span>
          <span
            className="text-3xl font-medium"
            style={{ fontFamily: "'Cormorant Garant', Georgia, serif", color: '#1A1714' }}
          >
            days to go
          </span>
        </div>
        <p className="text-sm mt-1" style={{ color: '#A89E96' }}>
          Pacific NW & Northern California · 12–26 Jun 2026
        </p>
      </section>

      <section>
        <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#A89E96' }}>Your Matches</p>
        <div className="flex flex-col gap-2">
          {HEADER_MATCHES.map((m, i) => (
            <div
              key={i}
              className="rounded-xl px-4 py-3 border flex items-start gap-3"
              style={{ backgroundColor: '#FDF5F0', borderColor: '#E8C0A0' }}
            >
              <span className="text-2xl mt-0.5">⚽</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base leading-snug" style={{ color: '#C04E1A' }}>{m.teams}</p>
                <p className="text-xs mt-0.5" style={{ color: '#8A5A2A' }}>{m.venue}</p>
                <p className="text-xs" style={{ color: '#A89E96' }}>{m.date} · {m.time}</p>
              </div>
              <span
                className="text-xs font-bold whitespace-nowrap pt-0.5"
                style={{ color: '#C04E1A' }}
              >
                {daysUntil(m.iso)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#A89E96' }}>Trip Preview</p>
          <button
            onClick={() => onNavigateDays()}
            className="text-xs flex items-center gap-0.5 hover:opacity-70 transition-opacity"
            style={{ color: '#C04E1A' }}
          >
            Full schedule <ChevronRight size={12} />
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          {upcomingRows.map((row, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl px-3 py-2.5 border"
              style={{
                backgroundColor: row.type === 'wc' ? '#FDF5F0' : '#FFFFFF',
                borderColor: row.type === 'wc' ? '#E8C0A0' : '#E8E0D8',
              }}
            >
              <div className="text-center min-w-[42px]">
                <p className="text-[10px] font-semibold" style={{ color: row.type === 'wc' ? '#C04E1A' : '#A89E96' }}>
                  {row.date.split(' ').slice(0, 2).join(' ')}
                </p>
                <p className="text-[10px]" style={{ color: '#A89E96' }}>{row.city.split(' ')[0]}</p>
              </div>
              <p className="text-xs leading-relaxed flex-1" style={{ color: row.type === 'wc' ? '#8A5A2A' : '#6B6560' }}>
                {row.type === 'wc' && <span className="mr-1">⚽</span>}
                {row.event}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── NORMAL DAY STATE ─────────────────────────────────────────────────────────

function NormalDayState({ city, onNavigateDays }) {
  const accent = CITY_ACCENT[city.id] || CITY_ACCENT.vancouver;
  const today = new Date();
  const formatted = today.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'long' });
  const picks = getTopPicks(city, false);

  return (
    <div className="flex flex-col gap-5">
      <section
        className="rounded-2xl px-4 py-4 border-l-4"
        style={{ backgroundColor: '#FFFFFF', borderLeftColor: accent.hex, border: '1px solid #E8E0D8', borderLeftWidth: '4px' }}
      >
        <p className="text-xs" style={{ color: '#A89E96' }}>{formatted}</p>
        <h2
          className="text-2xl font-semibold mt-0.5"
          style={{ fontFamily: "'Cormorant Garant', Georgia, serif", color: accent.hex }}
        >
          {city.label}
        </h2>
        <p className="text-xs mt-1" style={{ color: '#6B6560' }}>🏨 {city.hotel}</p>
        {city.hotelNote && (
          <p className="text-xs mt-0.5" style={{ color: '#C04E1A' }}>⚠️ {city.hotelNote}</p>
        )}
      </section>

      <section>
        <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#A89E96' }}>
          Today's Picks
        </p>
        <div className="flex flex-col gap-2">
          {picks.map((item, i) => {
            const cardId = `${city.id}:${item._sectionKey}:${i}`;
            return item.type === 'wc'
              ? <WCCard key={i} title={item.title} text={item.text} places={item.places} cardId={cardId} />
              : <Card key={i} title={item.title} text={item.text} places={item.places}
                  type={item.type || item._sectionKey} cardId={cardId} />;
          })}
        </div>
      </section>

      <button
        onClick={onNavigateDays}
        className="flex items-center justify-center gap-1.5 rounded-xl py-3 border text-sm font-medium transition-opacity hover:opacity-80"
        style={{ borderColor: accent.hex, color: accent.hex }}
      >
        See everything for today <ChevronRight size={14} />
      </button>
    </div>
  );
}

// ─── MATCH DAY STATE ──────────────────────────────────────────────────────────

function MatchDayState({ city, match, onNavigateDays }) {
  const picks = getTopPicks(city, true);

  return (
    <div className="flex flex-col gap-5">
      <MatchDayHero match={match} />

      {picks.length > 0 && (
        <section>
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#A89E96' }}>
            Also Today
          </p>
          <div className="flex flex-col gap-2">
            {picks.map((item, i) => {
              const cardId = `${city.id}:${item._sectionKey}:${i}`;
              return item.type === 'wc'
                ? null
                : <Card key={i} title={item.title} text={item.text} places={item.places}
                    type={item.type || item._sectionKey} cardId={cardId} />;
            })}
          </div>
        </section>
      )}

      <button
        onClick={onNavigateDays}
        className="flex items-center justify-center gap-1.5 rounded-xl py-3 border text-sm font-medium transition-opacity hover:opacity-80"
        style={{ borderColor: '#C04E1A', color: '#C04E1A' }}
      >
        See full day content <ChevronRight size={14} />
      </button>
    </div>
  );
}

// ─── POST-TRIP STATE ──────────────────────────────────────────────────────────

function PostTripState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <span style={{ fontSize: '48px' }}>⚽</span>
      <h2
        className="text-3xl font-semibold"
        style={{ fontFamily: "'Cormorant Garant', Georgia, serif", color: '#C04E1A' }}
      >
        Trip complete
      </h2>
      <p className="text-sm" style={{ color: '#6B6560' }}>
        Pacific NW & Northern California · 12–26 Jun 2026
      </p>
      <p className="text-sm" style={{ color: '#A89E96' }}>
        3 World Cup matches · 9 cities · 15 days
      </p>
    </div>
  );
}

// ─── NOW SCREEN ───────────────────────────────────────────────────────────────

export default function NowScreen({ onNavigateDays }) {
  const today = new Date().toISOString().slice(0, 10);
  const isPreTrip  = today < TRIP_START;
  const isPostTrip = today > TRIP_END;
  const currentCity = CITIES.find(c => today >= c.startDate && today <= c.endDate) || null;
  const isMatchDay = !!(currentCity?.match?.matchDate === today);

  return (
    <div className="flex flex-col gap-0">
      {isPreTrip  && <PreTripState onNavigateDays={onNavigateDays} />}
      {isPostTrip && <PostTripState />}
      {!isPreTrip && !isPostTrip && currentCity && isMatchDay && (
        <MatchDayState city={currentCity} match={currentCity.match} onNavigateDays={onNavigateDays} />
      )}
      {!isPreTrip && !isPostTrip && currentCity && !isMatchDay && (
        <NormalDayState city={currentCity} onNavigateDays={onNavigateDays} />
      )}
      {!isPreTrip && !isPostTrip && !currentCity && (
        <div className="py-12 text-center text-sm" style={{ color: '#A89E96' }}>
          Travel day — between cities
        </div>
      )}
    </div>
  );
}
