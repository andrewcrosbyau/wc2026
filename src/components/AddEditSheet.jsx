import { useState } from 'react';
import { X } from 'lucide-react';
import { TRIP_DAYS } from '../data';

const SLOTS = [
  { id: 'morning',   label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening',   label: 'Evening' },
  { id: 'anytime',   label: 'Anytime' },
];

const CATEGORIES = [
  { id: 'food',    label: '🍽 Food' },
  { id: 'culture', label: '🎭 Culture' },
  { id: 'sport',   label: '⚽ Sport' },
  { id: 'running', label: '🏃 Running' },
  { id: 'travel',  label: '✈️ Travel' },
  { id: 'other',   label: '📌 Other' },
];

const EMPTY = {
  title: '', note: '', date: '', slot: '', category: 'other', maps_query: '', source_card_id: '',
};

// Inner form — always mounts fresh, no effect needed for initialization
function SheetContent({ mode, initialValues, onSave, onClose }) {
  const [form, setForm] = useState(() => ({ ...EMPTY, ...initialValues }));
  const [titleError, setTitleError] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  function set(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
    if (key === 'title') setTitleError(false);
  }

  function handleSave() {
    if (!form.title.trim()) { setTitleError(true); return; }
    onSave({
      title:          form.title.trim(),
      note:           form.note.trim() || null,
      date:           form.date || TRIP_DAYS[0].iso,
      slot:           form.slot || 'anytime',
      category:       form.category || 'other',
      maps_query:     form.maps_query.trim() || null,
      source_card_id: form.source_card_id || null,
    });
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl overflow-y-auto"
      style={{
        backgroundColor: '#FAF7F2',
        maxHeight: '92dvh',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
      }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 pt-3 pb-3 border-b"
        style={{ backgroundColor: '#FAF7F2', borderColor: '#E8E0D8' }}
      >
        <div className="w-8 h-1 rounded-full mx-auto mb-3" style={{ backgroundColor: '#D8CECA' }} />
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: '#1A1714' }}>
            {mode === 'edit' ? 'Edit item' : 'Add to plan'}
          </h2>
          <button onClick={onClose} style={{ color: '#A89E96' }} aria-label="Close">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 py-5 flex flex-col gap-5">
        {/* Title */}
        <div>
          <label className="text-xs font-semibold tracking-wider uppercase block mb-1.5" style={{ color: '#A89E96' }}>
            Title <span style={{ color: '#C04E1A' }}>*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="What's the plan?"
            autoFocus={!initialValues?.title}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border"
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: titleError ? '#C04E1A' : '#D8CECA',
              color: '#1A1714',
            }}
          />
          {titleError && <p className="text-xs mt-1" style={{ color: '#C04E1A' }}>Give it a name</p>}
        </div>

        {/* Note */}
        <div>
          <label className="text-xs font-semibold tracking-wider uppercase block mb-1.5" style={{ color: '#A89E96' }}>Note</label>
          <textarea
            value={form.note}
            onChange={e => set('note', e.target.value)}
            placeholder="Any details…"
            rows={2}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border resize-none"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#D8CECA', color: '#1A1714' }}
          />
        </div>

        {/* Day */}
        <div>
          <label className="text-xs font-semibold tracking-wider uppercase block mb-1.5" style={{ color: '#A89E96' }}>Day</label>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {TRIP_DAYS.map(day => {
              const isSelected = form.date === day.iso;
              const isPast = day.iso < today;
              const parts = day.formatted.split(' ');
              return (
                <button
                  key={day.iso}
                  onClick={() => set('date', day.iso)}
                  className="flex-none flex flex-col items-center rounded-xl px-2.5 py-2 min-w-[44px] border-2 transition-all"
                  style={{
                    backgroundColor: isSelected ? '#C04E1A' : '#FFFFFF',
                    borderColor:     isSelected ? '#C04E1A' : '#E8E0D8',
                    opacity: isPast && !isSelected ? 0.45 : 1,
                  }}
                >
                  <span className="text-[9px]" style={{ color: isSelected ? 'rgba(255,255,255,0.75)' : '#A89E96' }}>
                    {parts[0]}
                  </span>
                  <span className="text-sm font-bold" style={{ color: isSelected ? '#FFFFFF' : '#1A1714' }}>
                    {parts[1]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Slot */}
        <div>
          <label className="text-xs font-semibold tracking-wider uppercase block mb-1.5" style={{ color: '#A89E96' }}>Slot</label>
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: '#E8E0D8' }}>
            {SLOTS.map(s => (
              <button
                key={s.id}
                onClick={() => set('slot', s.id)}
                className="flex-1 py-2.5 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: form.slot === s.id ? '#C04E1A' : '#FFFFFF',
                  color:           form.slot === s.id ? '#FFFFFF' : '#6B6560',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-semibold tracking-wider uppercase block mb-1.5" style={{ color: '#A89E96' }}>Category</label>
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => set('category', c.id)}
                className="rounded-full px-3 py-1.5 text-xs font-medium border transition-all"
                style={{
                  backgroundColor: form.category === c.id ? '#C04E1A' : '#FFFFFF',
                  color:           form.category === c.id ? '#FFFFFF' : '#6B6560',
                  borderColor:     form.category === c.id ? '#C04E1A' : '#E8E0D8',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="text-xs font-semibold tracking-wider uppercase block mb-1.5" style={{ color: '#A89E96' }}>Location</label>
          <input
            type="text"
            value={form.maps_query}
            onChange={e => set('maps_query', e.target.value)}
            placeholder="Place name or search term"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#D8CECA', color: '#1A1714' }}
          />
        </div>
      </div>

      {/* Footer */}
      <div
        className="sticky bottom-0 px-4 pt-3 pb-2 flex gap-3"
        style={{ backgroundColor: '#FAF7F2', borderTop: '1px solid #E8E0D8' }}
      >
        <button
          onClick={onClose}
          className="flex-1 rounded-xl py-3 text-sm font-medium border"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E0D8', color: '#6B6560' }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 rounded-xl py-3 text-sm font-semibold"
          style={{ backgroundColor: '#C04E1A', color: '#FFFFFF' }}
        >
          {mode === 'edit' ? 'Save changes' : 'Add to plan'}
        </button>
      </div>
    </div>
  );
}

// Outer gate — no hooks, safe early return
export default function AddEditSheet({ open, mode, initialValues, onSave, onClose }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <SheetContent mode={mode} initialValues={initialValues} onSave={onSave} onClose={onClose} />
    </>
  );
}
