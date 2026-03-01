import React, { useState } from 'react';

export default function OnboardingScreen({ onComplete }) {
  const [name, setName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!upiId.trim()) { setError('Please enter your UPI ID or payment handle.'); return; }
    setLoading(true);
    setError('');
    await onComplete({ name: name.trim(), upiId: upiId.trim() });
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">✈️</span>
        </div>
        <h2 className="text-white font-bold text-base">Welcome to SplitSync</h2>
        <p className="text-neutral-400 text-xs mt-1">Set up your profile to start splitting group travel costs.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Your Name</label>
          <input
            type="text"
            placeholder="e.g. Rahul Sharma"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 focus:border-emerald-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition-colors placeholder:text-neutral-600"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">UPI ID / Payment Handle</label>
          <input
            type="text"
            placeholder="e.g. rahul@kotak or $rahul"
            value={upiId}
            onChange={e => setUpiId(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 focus:border-emerald-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition-colors placeholder:text-neutral-600"
          />
          <p className="text-[10px] text-neutral-500 mt-1">Used to generate payment request links for your group.</p>
        </div>

        {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-2.5 rounded-lg text-sm transition-colors"
        >
          {loading ? 'Saving...' : 'Continue →'}
        </button>
      </form>
    </div>
  );
}
