import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3">
      <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center animate-pulse">
        <span className="text-xl">✈️</span>
      </div>
      <p className="text-neutral-400 text-sm">Loading SplitSync...</p>
    </div>
  );
}

