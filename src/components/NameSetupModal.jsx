import { useState } from 'react';

const PRESETS = ['Andy', 'Will'];

export default function NameSetupModal({ open, onSave }) {
  const [selected, setSelected] = useState(null);
  const [customName, setCustomName] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [error, setError] = useState(false);

  if (!open) return null;

  const effectiveName = showCustom ? customName.trim() : (selected || '');

  function handlePreset(name) {
    setSelected(name);
    setShowCustom(false);
    setCustomName('');
    setError(false);
  }

  function handleOther() {
    setSelected(null);
    setShowCustom(true);
    setError(false);
  }

  function handleSave() {
    if (!effectiveName) { setError(true); return; }
    onSave(effectiveName);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#FAF7F2' }}
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-8 text-center">
        <div>
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: '#A89E96' }}
          >
            World Cup 2026 Trip Guide
          </p>
          <h1
            className="text-4xl font-semibold"
            style={{ fontFamily: "'Cormorant Garant', Georgia, serif", color: '#1A1714' }}
          >
            Who are you?
          </h1>
        </div>

        <div className="flex gap-3 w-full">
          {PRESETS.map(name => (
            <button
              key={name}
              onClick={() => handlePreset(name)}
              className="flex-1 rounded-2xl py-4 text-lg font-semibold border-2 transition-all"
              style={{
                fontFamily: "'Cormorant Garant', Georgia, serif",
                backgroundColor: selected === name ? '#C04E1A' : '#FFFFFF',
                color: selected === name ? '#FFFFFF' : '#1A1714',
                borderColor: selected === name ? '#C04E1A' : '#E8E0D8',
              }}
            >
              {name}
            </button>
          ))}
          <button
            onClick={handleOther}
            className="flex-1 rounded-2xl py-4 text-base font-medium border-2 transition-all"
            style={{
              backgroundColor: showCustom ? '#C04E1A' : '#FFFFFF',
              color: showCustom ? '#FFFFFF' : '#6B6560',
              borderColor: showCustom ? '#C04E1A' : '#E8E0D8',
            }}
          >
            Other
          </button>
        </div>

        {showCustom && (
          <input
            type="text"
            placeholder="Your name"
            value={customName}
            onChange={e => { setCustomName(e.target.value); setError(false); }}
            autoFocus
            className="w-full rounded-xl px-4 py-3 text-sm outline-none border"
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: error ? '#C04E1A' : '#D8CECA',
              color: '#1A1714',
            }}
          />
        )}

        {error && (
          <p className="text-xs -mt-4" style={{ color: '#C04E1A' }}>Give it a name</p>
        )}

        <button
          onClick={handleSave}
          className="w-full rounded-2xl py-4 text-base font-semibold transition-all"
          style={{
            backgroundColor: effectiveName ? '#C04E1A' : '#E8E0D8',
            color: effectiveName ? '#FFFFFF' : '#A89E96',
          }}
        >
          Let's go
        </button>
      </div>
    </div>
  );
}
