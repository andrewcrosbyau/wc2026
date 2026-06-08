import { useState, useMemo } from 'react';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { EXPLORE_ITEMS, SECTION_META, CITY_ACCENT, CITIES, TRIP_START, TRIP_END } from '../data';
import { Card, WCCard } from './shared/Card';

const FILTER_TABS = [
  { id: 'all',     label: 'All' },
  { id: 'food',    label: 'Food' },
  { id: 'culture', label: 'Culture' },
  { id: 'sport',   label: 'Sport' },
  { id: 'running', label: 'Running' },
];

const FILTER_TO_SECTION = {
  food: 'food',
  culture: 'culture',
  sport: 'sporting',
  running: 'running',
};

function ExploreItem({ entry, isExpanded, onToggle, saved, onSave }) {
  const { cityLabel, sectionKey, item, cardId, cityId } = entry;
  const meta   = SECTION_META[sectionKey];
  const accent = CITY_ACCENT[cityId] || CITY_ACCENT.vancouver;
  const isSaved = saved?.has(cardId);
  const hasPlaces = item.places?.length > 0;

  return (
    <div className="rounded-xl border overflow-hidden"
      style={{ borderColor: '#E8E0D8', backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <button
        onClick={() => onToggle(cardId)}
        className="w-full text-left px-3 py-3 flex items-start gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            {meta && (
              <span
                className="text-[10px] font-bold tracking-wider uppercase rounded-full px-2 py-0.5"
                style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
              >
                {meta.label}
              </span>
            )}
            <span className="text-[10px]" style={{ color: accent.hex, fontWeight: 600 }}>{cityLabel}</span>
            {isSaved && <span className="text-[10px]" style={{ color: '#C04E1A' }}>★ Saved</span>}
          </div>
          <p className="text-sm font-semibold leading-snug" style={{ color: '#1A1714' }}>
            {item.type === 'wc' && '⚽ '}{item.title}
          </p>
          {!isExpanded && item.text && (
            <p className="text-xs mt-0.5 leading-relaxed line-clamp-1" style={{ color: '#A89E96' }}>
              {item.text}
            </p>
          )}
          {!isExpanded && hasPlaces && (
            <p className="text-xs mt-0.5" style={{ color: '#A89E96' }}>
              {item.places[0].name}{item.places.length > 1 ? ` +${item.places.length - 1} more` : ''}
            </p>
          )}
        </div>
        <div className="shrink-0 mt-1" style={{ color: '#A89E96' }}>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 border-t" style={{ borderColor: '#F0EBE6' }}>
          <div className="pt-2">
            {item.type === 'wc'
              ? <WCCard title={item.title} text={item.text} places={item.places} cardId={cardId} saved={saved} onSave={onSave} />
              : <Card title={item.title} text={item.text} places={item.places}
                  type={item.type || sectionKey} cardId={cardId} saved={saved} onSave={onSave} />
            }
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExploreScreen({ filter, setFilter, cityScope, setCityScope, searchQuery, setSearchQuery, saved, onSave }) {
  const [expandedId, setExpandedId] = useState(null);

  const today = new Date().toISOString().slice(0, 10);
  const currentCity = CITIES.find(c => today >= c.startDate && today <= c.endDate) || null;

  const filtered = useMemo(() => {
    let items = EXPLORE_ITEMS;

    if (filter !== 'all') {
      const targetSection = FILTER_TO_SECTION[filter];
      items = items.filter(e => e.sectionKey === targetSection);
    }

    if (cityScope === 'current' && currentCity) {
      items = items.filter(e => e.cityId === currentCity.id);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(e => {
        const haystack = [
          e.item.title || '',
          e.item.text || '',
          ...(e.item.places || []).map(p => `${p.name} ${p.detail || ''}`),
        ].join(' ').toLowerCase();
        return haystack.includes(q);
      });
    }

    // Saved items float to top
    return [...items].sort((a, b) => {
      const aSaved = saved?.has(a.cardId) ? 0 : 1;
      const bSaved = saved?.has(b.cardId) ? 0 : 1;
      return aSaved - bSaved;
    });
  }, [filter, cityScope, searchQuery, saved, currentCity]);

  function handleToggle(cardId) {
    setExpandedId(prev => prev === cardId ? null : cardId);
  }

  const showCityToggle = today >= TRIP_START && today <= TRIP_END && currentCity;

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#A89E96' }} />
        <input
          type="text"
          placeholder="Search venues, restaurants, activities…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full rounded-xl pl-8 pr-8 py-2.5 text-sm outline-none border"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E0D8', color: '#1A1714' }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: '#A89E96' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
        {FILTER_TABS.map(tab => {
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className="flex-none rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap"
              style={{
                backgroundColor: isActive ? '#C04E1A' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#6B6560',
                border: isActive ? '1px solid #C04E1A' : '1px solid #E8E0D8',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* City scope toggle — only show during trip */}
      {showCityToggle && (
        <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: '#E8E0D8' }}>
          <button
            onClick={() => setCityScope('all')}
            className="flex-1 py-2 text-xs font-medium transition-colors"
            style={{
              backgroundColor: cityScope === 'all' ? '#C04E1A' : '#FFFFFF',
              color: cityScope === 'all' ? '#FFFFFF' : '#6B6560',
            }}
          >
            All Cities
          </button>
          <button
            onClick={() => setCityScope('current')}
            className="flex-1 py-2 text-xs font-medium transition-colors"
            style={{
              backgroundColor: cityScope === 'current' ? '#C04E1A' : '#FFFFFF',
              color: cityScope === 'current' ? '#FFFFFF' : '#6B6560',
            }}
          >
            {currentCity?.label || 'Current City'}
          </button>
        </div>
      )}

      {/* Results count */}
      <p className="text-xs" style={{ color: '#A89E96' }}>
        {filtered.length} {filtered.length === 1 ? 'place' : 'places'}
        {searchQuery ? ` for "${searchQuery}"` : ''}
      </p>

      {/* Item list */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: '#A89E96' }}>
            No results{searchQuery ? ` for "${searchQuery}"` : ''}
          </div>
        ) : (
          filtered.map(entry => (
            <ExploreItem
              key={entry.cardId}
              entry={entry}
              isExpanded={expandedId === entry.cardId}
              onToggle={handleToggle}
              saved={saved}
              onSave={onSave}
            />
          ))
        )}
      </div>
    </div>
  );
}
