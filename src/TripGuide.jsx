import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import useSavedCards from './hooks/useSavedCards';
import {
  CITIES, CITY_ACCENT, SECTION_META, TRIP_DAYS,
  searchCards,
} from './data';
import BottomNav    from './components/BottomNav';
import NowScreen    from './components/NowScreen';
import DaysScreen   from './components/DaysScreen';
import ExploreScreen from './components/ExploreScreen';
import SavedView    from './components/SavedView';
import { Card, WCCard } from './components/shared/Card';

// ─── SEARCH RESULTS (global overlay) ─────────────────────────────────────────

function SearchResults({ query, onNavigateToCity }) {
  const results = useMemo(() => searchCards(query), [query]);

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2" style={{ color: '#A89E96' }}>
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
      <p className="text-xs" style={{ color: '#A89E96' }}>{results.length} result{results.length !== 1 ? 's' : ''} for "{query}"</p>
      {Object.values(grouped).map(({ city, results: cityResults }) => {
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
              {cityResults.map(({ item, sectionKey, idx }) => {
                const type = item.type || (sectionKey === 'sporting' ? 'sport' : sectionKey === 'hotelZone' ? 'hotel' : sectionKey);
                const meta = SECTION_META[sectionKey];
                return (
                  <div key={`${city.id}:${sectionKey}:${idx}`} className="relative">
                    {meta && (
                      <div className="flex items-center gap-1 mb-1">
                        <meta.Icon size={10} style={{ color: '#A89E96' }} />
                        <span className="text-[10px] uppercase tracking-wider" style={{ color: '#A89E96' }}>{meta.label}</span>
                      </div>
                    )}
                    {item.type === 'wc'
                      ? <WCCard title={item.title} text={item.text} places={item.places} />
                      : <Card title={item.title} text={item.text} places={item.places} type={type} query={query} />
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

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function TripGuide() {
  const [activeScreen, setActiveScreen]       = useState('now');
  const [expandedDay, setExpandedDay]         = useState(null);
  const [exploreFilter, setExploreFilter]     = useState('all');
  const [exploreCityScope, setExploreCityScope] = useState('all');
  const [exploreSearch, setExploreSearch]     = useState('');
  const [searchOpen, setSearchOpen]           = useState(false);
  const [searchQuery, setSearchQuery]         = useState('');
  const [saved, toggleSave]                   = useSavedCards();
  const touchStartX                           = useRef(null);
  const searchRef                             = useRef(null);

  // ── Hash routing ─────────────────────────────────────────────────────────
  useEffect(() => {
    const parse = () => {
      const raw = window.location.hash.replace('#', '');
      if (!raw) {
        // Auto-detect current city during trip; otherwise default to 'now'
        return;
      }
      // New routes
      if (raw === 'now')     { setActiveScreen('now');    return; }
      if (raw === 'days')    { setActiveScreen('days');   return; }
      if (raw === 'explore') { setActiveScreen('explore'); return; }
      if (raw === 'saved')   { setActiveScreen('saved');  return; }
      if (raw === 'cheatsheet') { setActiveScreen('days'); return; } // legacy

      if (raw.startsWith('days/')) {
        const iso = raw.slice(5);
        const idx = TRIP_DAYS.findIndex(d => d.iso === iso);
        setActiveScreen('days');
        if (idx >= 0) setExpandedDay(idx);
        return;
      }

      if (raw.startsWith('explore/')) {
        const f = raw.slice(8);
        setActiveScreen('explore');
        setExploreFilter(f);
        return;
      }

      // Legacy city hashes — navigate to days view, expand first day for that city
      const city = CITIES.find(c => c.id === raw);
      if (city) {
        const idx = TRIP_DAYS.findIndex(d => d.city?.id === raw);
        setActiveScreen('days');
        if (idx >= 0) setExpandedDay(idx);
      }
    };
    parse();
    window.addEventListener('popstate', parse);
    return () => window.removeEventListener('popstate', parse);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  // ── Navigation ────────────────────────────────────────────────────────────
  function navigateTo(screen, extra) {
    const hash = extra ? `#${screen}/${extra}` : `#${screen}`;
    history.pushState(null, '', hash);
    setActiveScreen(screen);
    setSearchQuery('');
    setSearchOpen(false);
    if (screen !== 'days') setExpandedDay(null);
    if (screen === 'days' && extra) {
      const idx = TRIP_DAYS.findIndex(d => d.iso === extra);
      if (idx >= 0) setExpandedDay(idx);
    }
  }

  function navigateToCity(cityId) {
    const idx = TRIP_DAYS.findIndex(d => d.city?.id === cityId);
    navigateTo('days');
    if (idx >= 0) setExpandedDay(idx);
  }

  // ── Swipe gestures (between bottom nav tabs) ──────────────────────────────
  const SCREENS = ['now', 'days', 'explore', 'saved'];
  const handleTouchStart = e => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = e => {
    if (touchStartX.current === null || searchQuery) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 60) return;
    const idx = SCREENS.indexOf(activeScreen);
    if (dx < 0 && idx < SCREENS.length - 1) navigateTo(SCREENS[idx + 1]);
    if (dx > 0 && idx > 0)                   navigateTo(SCREENS[idx - 1]);
    touchStartX.current = null;
  };

  const handleNavChange = (screen) => {
    history.pushState(null, '', `#${screen}`);
    setActiveScreen(screen);
    setSearchQuery('');
    setSearchOpen(false);
    if (screen !== 'days') setExpandedDay(null);
  };

  const isSearching = searchOpen && searchQuery.length > 0;
  const today = new Date().toISOString().slice(0, 10);

  const SCREEN_TITLES = { now: 'World Cup 2026', days: 'Trip Schedule', explore: 'Explore', saved: 'Saved' };

  return (
    <div className="min-h-dvh" style={{ backgroundColor: '#FAF7F2', color: '#1A1714' }}>
      {/* HEADER */}
      <header
        className="sticky top-0 z-30 border-b"
        style={{ backgroundColor: '#F5F0E8', borderColor: '#E8E0D8' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              {searchOpen ? null : (
                <>
                  <h1
                    className="text-lg font-semibold leading-tight"
                    style={{ fontFamily: "'Cormorant Garant', Georgia, serif", color: '#1A1714' }}
                  >
                    {SCREEN_TITLES[activeScreen]}
                  </h1>
                  <p className="text-xs" style={{ color: '#A89E96' }}>
                    Pacific NW & California · 12–26 Jun
                  </p>
                </>
              )}
              {searchOpen && (
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search venues, restaurants, activities…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg px-3 py-1.5 text-sm outline-none"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8CECA', color: '#1A1714', minWidth: '220px' }}
                />
              )}
            </div>
            <button
              onClick={() => { setSearchOpen(o => !o); setSearchQuery(''); }}
              className="shrink-0 p-1.5 transition-colors hover:opacity-70"
              style={{ color: '#A89E96' }}
              aria-label={searchOpen ? 'Close search' : 'Search'}
            >
              {searchOpen ? <X size={18} /> : <Search size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main
        className="max-w-2xl mx-auto px-4 py-5"
        style={{ paddingBottom: 'max(88px, calc(72px + env(safe-area-inset-bottom)))' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isSearching ? (
          <SearchResults query={searchQuery} onNavigateToCity={navigateToCity} />
        ) : (
          <>
            {activeScreen === 'now' && (
              <NowScreen
                onNavigateDays={() => {
                  const idx = TRIP_DAYS.findIndex(d => d.iso === today);
                  navigateTo('days');
                  if (idx >= 0) setExpandedDay(idx);
                }}
              />
            )}
            {activeScreen === 'days' && (
              <DaysScreen
                expandedDay={expandedDay}
                setExpandedDay={setExpandedDay}
                saved={saved}
                onSave={toggleSave}
              />
            )}
            {activeScreen === 'explore' && (
              <ExploreScreen
                filter={exploreFilter}
                setFilter={setExploreFilter}
                cityScope={exploreCityScope}
                setCityScope={setExploreCityScope}
                searchQuery={exploreSearch}
                setSearchQuery={setExploreSearch}
                saved={saved}
                onSave={toggleSave}
              />
            )}
            {activeScreen === 'saved' && (
              <SavedView
                saved={saved}
                onSave={toggleSave}
                onNavigateToCity={navigateToCity}
              />
            )}
          </>
        )}
      </main>

      {/* BOTTOM NAV */}
      <BottomNav
        active={activeScreen}
        onChange={handleNavChange}
        savedCount={saved.size}
      />
    </div>
  );
}
