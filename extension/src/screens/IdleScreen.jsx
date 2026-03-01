import React, { useState } from 'react';

export default function IdleScreen({ profile, onCreateSession, onJoinSession }) {
  const [joinId, setJoinId] = useState('');
  const [showJoin, setShowJoin] = useState(false);

  const handleJoin = (e) => {
    e.preventDefault();
    if (joinId.trim()) onJoinSession(joinId.trim());
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Welcome */}
      <div className="flex items-center gap-3 bg-neutral-800/50 rounded-xl p-3 border border-neutral-700/50">
        <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
          {profile?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm truncate">{profile?.name || 'User'}</p>
          <p className="text-neutral-400 text-[10px] truncate">{profile?.upi_id || 'No payment handle set'}</p>
        </div>
      </div>

      {/* Primary Action */}
      <button
        onClick={onCreateSession}
        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        Start New Session
      </button>

      <div className="relative flex items-center gap-2">
        <div className="h-px flex-1 bg-neutral-700" />
        <span className="text-neutral-500 text-[10px] uppercase tracking-widest">or</span>
        <div className="h-px flex-1 bg-neutral-700" />
      </div>

      {/* Join Session */}
      {!showJoin ? (
        <button
          onClick={() => setShowJoin(true)}
          className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          Join a Session
        </button>
      ) : (
        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            autoFocus
            type="text"
            placeholder="Paste Session ID..."
            value={joinId}
            onChange={e => setJoinId(e.target.value)}
            className="flex-1 bg-neutral-800 border border-neutral-700 focus:border-emerald-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition-colors placeholder:text-neutral-600"
          />
          <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-3 py-2 rounded-lg text-sm transition-colors">Go</button>
        </form>
      )}

      <p className="text-center text-[10px] text-neutral-600">
        Navigate to a travel listing then start a session.
      </p>
    </div>
  );
}
