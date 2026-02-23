import React, { useState } from 'react';

export default function SettingsScreen({ profile, onSave, onBack }) {
  const [name, setName] = useState(profile?.name || '');
  const [upiId, setUpiId] = useState(profile?.upi_id || '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !upiId.trim()) return;
    setLoading(true);
    await onSave({ name: name.trim(), upiId: upiId.trim() });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <button
          onClick={onBack}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-white font-semibold text-sm">Edit Profile</h3>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-3 bg-neutral-800/50 rounded-xl p-3 border border-neutral-700/50">
        <div className="w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold text-lg">
          {name.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="text-white font-semibold text-sm">{name || 'Your Name'}</p>
          <p className="text-neutral-400 text-xs">{upiId || 'No payment handle'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Display Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 focus:border-emerald-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">UPI ID / Payment Handle</label>
          <input
            type="text"
            placeholder="e.g. rahul@kotak or $rahul (Venmo)"
            value={upiId}
            onChange={e => setUpiId(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 focus:border-emerald-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition-colors placeholder:text-neutral-600"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !name.trim() || !upiId.trim()}
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold py-2.5 rounded-xl text-sm transition-colors"
        >
          {saved ? '✓ Saved!' : loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
