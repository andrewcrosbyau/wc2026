import { useRef, useEffect } from 'react';
import { Plus, WifiOff } from 'lucide-react';
import { TRIP_DAYS, CITY_ACCENT } from '../data';
import PlanItemCard from './PlanItemCard';

const SLOTS = [
  { id: 'morning',   label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening',   label: 'Evening' },
  { id: 'anytime',   label: 'Anytime' },
];

function DateStrip({ activePlanDate, setActivePlanDate, itemsByDate, systemItemsByDate }) {
  const stripRef = useRef(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const el = stripRef.current?.querySelector('[data-active="true"]');
    if (el) el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [activePlanDate]);

  return (
    <div
      ref={stripRef}
      className="flex gap-1.5 overflow-x-auto scrollbar-hide py-2.5 px-1"
      style={{ backgroundColor: '#F5F0E8', borderBottom: '1px solid #E8E0D8' }}
    >
      {TRIP_DAYS.map(day => {
        const isActive  = day.iso === activePlanDate;
        const isPast    = day.iso < today;
        const isToday   = day.iso === today;
        const hasUser   = (itemsByDate?.get(day.iso)?.length ?? 0) > 0;
        const hasWC     = systemItemsByDate?.get(day.iso)?.some(i => i.category === 'wc') ?? false;
        const [dow, num] = day.formatted.split(' ');

        return (
          <button
            key={day.iso}
            data-active={isActive}
            onClick={() => setActivePlanDate(day.iso)}
            className="flex-none flex flex-col items-center rounded-xl px-2 pt-1.5 pb-1 min-w-[38px] border-2 transition-all"
            style={{
              backgroundColor: isActive ? '#C04E1A' : isToday ? '#FDF5F0' : '#FFFFFF',
              borderColor:     isActive ? '#C04E1A' : isToday ? '#E8C0A0' : '#E8E0D8',
              opacity: isPast && !isActive ? 0.5 : 1,
            }}
          >
            <span className="text-[9px]" style={{ color: isActive ? 'rgba(255,255,255,0.7)' : '#A89E96' }}>
              {dow}
            </span>
            <span className="text-sm font-bold leading-tight" style={{ color: isActive ? '#FFFFFF' : isToday ? '#C04E1A' : '#1A1714' }}>
              {num}
            </span>
            <span className="text-[9px] h-3 leading-3 flex items-center">
              {hasWC
                ? <span>⚽</span>
                : hasUser
                  ? <span style={{ color: isActive ? 'rgba(255,255,255,0.8)' : '#C04E1A' }}>•</span>
                  : null
              }
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function PlanScreen({
  activePlanDate, setActivePlanDate,
  itemsByDate, systemItemsByDate,
  isOnline,
  onEdit, onDelete, onToggleDone,
  pendingDeletes,
  onOpenSheet,
}) {
  const today   = new Date().toISOString().slice(0, 10);
  const tripDay = TRIP_DAYS.find(d => d.iso === activePlanDate);
  const accent  = tripDay?.city ? (CITY_ACCENT[tripDay.city.id] || CITY_ACCENT.vancouver) : null;

  const userItems = itemsByDate?.get(activePlanDate) ?? [];
  const sysItems  = systemItemsByDate?.get(activePlanDate) ?? [];

  // Horizontal swipe between days
  const touchStartX = useRef(null);
  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 60) return;
    const idx = TRIP_DAYS.findIndex(d => d.iso === activePlanDate);
    if (dx < 0 && idx < TRIP_DAYS.length - 1) setActivePlanDate(TRIP_DAYS[idx + 1].iso);
    if (dx > 0 && idx > 0)                    setActivePlanDate(TRIP_DAYS[idx - 1].iso);
    touchStartX.current = null;
  }

  return (
    <div className="-mx-4">
      <DateStrip
        activePlanDate={activePlanDate}
        setActivePlanDate={setActivePlanDate}
        itemsByDate={itemsByDate}
        systemItemsByDate={systemItemsByDate}
      />

      <div className="px-4 pt-4">
        {/* Day heading */}
        <div className="mb-4">
          <h3
            className="text-xl font-semibold"
            style={{ fontFamily: "'Cormorant Garant', Georgia, serif", color: accent?.hex || '#1A1714' }}
          >
            {tripDay?.formatted ?? activePlanDate}
            {activePlanDate === today && (
              <span
                className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: '#C04E1A', color: '#FFFFFF', fontFamily: 'sans-serif', verticalAlign: 'middle' }}
              >
                TODAY
              </span>
            )}
          </h3>
          {tripDay?.city && (
            <p className="text-xs mt-0.5" style={{ color: '#A89E96' }}>{tripDay.city.label}</p>
          )}
        </div>

        {/* Offline banner */}
        {!isOnline && (
          <div
            className="mb-4 rounded-xl px-3 py-2.5 flex items-center gap-2"
            style={{ backgroundColor: '#FDF5F0', border: '1px solid #E8C0A0' }}
          >
            <WifiOff size={13} style={{ color: '#C04E1A' }} />
            <p className="text-xs" style={{ color: '#8A5A2A' }}>
              You're offline — changes will sync when you reconnect
            </p>
          </div>
        )}

        {/* Slot sections */}
        <div
          className="flex flex-col gap-5 pb-4"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {SLOTS.map(slot => {
            const slotSys  = sysItems.filter(i => i.slot === slot.id);
            const slotUser = userItems.filter(i => i.slot === slot.id);
            const isEmpty  = slotSys.length === 0 && slotUser.length === 0;

            return (
              <div key={slot.id}>
                <p
                  className="text-[10px] font-bold tracking-widest uppercase mb-2"
                  style={{ color: '#A89E96' }}
                >
                  {slot.label}
                </p>
                <div className="flex flex-col gap-1.5">
                  {slotSys.map(item => (
                    <PlanItemCard
                      key={item.id}
                      item={item}
                      isPendingDelete={false}
                      onToggleDone={() => {}}
                      onEdit={() => {}}
                      onDelete={() => {}}
                    />
                  ))}
                  {slotUser.map(item => (
                    <PlanItemCard
                      key={item.id}
                      item={item}
                      isPendingDelete={pendingDeletes?.has(item.id) ?? false}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onToggleDone={onToggleDone}
                    />
                  ))}
                  {isEmpty && (
                    <div
                      className="rounded-xl px-3 py-2 border border-dashed"
                      style={{ borderColor: '#E8E0D8' }}
                    >
                      <p className="text-xs" style={{ color: '#D8CECA' }}>Nothing yet</p>
                    </div>
                  )}
                  <button
                    onClick={() => isOnline && onOpenSheet({ date: activePlanDate, slot: slot.id })}
                    disabled={!isOnline}
                    className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70 py-1"
                    style={{ color: isOnline ? '#C04E1A' : '#A89E96' }}
                  >
                    <Plus size={12} />
                    {isOnline ? 'Add' : 'Offline'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
