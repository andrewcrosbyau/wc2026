import { Home, CalendarDays, Compass, Star } from 'lucide-react';

const TABS = [
  { id: 'now',     label: 'Now',     Icon: Home },
  { id: 'days',    label: 'Days',    Icon: CalendarDays },
  { id: 'explore', label: 'Explore', Icon: Compass },
  { id: 'saved',   label: 'Saved',   Icon: Star },
];

export default function BottomNav({ active, onChange, savedCount }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        backgroundColor: '#F5F0E8',
        borderColor: '#E8E0D8',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      <div className="max-w-2xl mx-auto flex">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          const showBadge = id === 'saved' && savedCount > 0;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="flex-1 flex flex-col items-center gap-0.5 pt-2 pb-1 transition-colors"
              style={{ color: isActive ? '#C04E1A' : '#A89E96' }}
            >
              <div className="relative">
                <Icon size={22} fill={isActive ? 'currentColor' : 'none'} strokeWidth={isActive ? 1.5 : 1.5} />
                {showBadge && (
                  <span
                    className="absolute -top-1 -right-1.5 rounded-full text-[9px] font-bold w-4 h-4 flex items-center justify-center"
                    style={{ backgroundColor: '#C04E1A', color: '#FFFFFF' }}
                  >
                    {savedCount > 9 ? '9+' : savedCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
