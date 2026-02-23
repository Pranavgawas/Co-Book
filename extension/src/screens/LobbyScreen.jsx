import React, { useState } from 'react';

export default function LobbyScreen({ session, members, profile, myUserId, onLockForPayment, onLeave }) {
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const perPerson = members.length > 0 ? Math.ceil(session.total_cost / members.length) : session.total_cost;

  const copyInviteLink = () => {
    // Full shareable link — friends open this, see session ID, paste into extension
    const link = `Join my CoBook session to split the cost!\n\nSession ID: ${session.id}\n\nInstall CoBook extension, click "Join a Session" and paste this ID:\nhttps://chromewebstore.google.com/cobook`;
    navigator.clipboard.writeText(link).catch(() => {
      const el = document.createElement('textarea');
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(session.id).catch(() => {});
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const isHost = session.host_id === myUserId;

  return (
    <div className="flex flex-col gap-3">
      {/* Property Info */}
      <div className="bg-neutral-800/50 rounded-xl p-3 border border-neutral-700/50">
        <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Booking</p>
        <p className="text-white font-semibold text-sm truncate">{session.property_title || 'Airbnb Property'}</p>
        <div className="flex justify-between items-center mt-2">
          <span className="text-neutral-400 text-xs">Total Cost</span>
          <span className="text-white font-bold">₹{Number(session.total_cost).toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-emerald-400 text-xs">Per Person ({members.length} people)</span>
          <span className="text-emerald-400 font-bold text-sm">₹{perPerson.toLocaleString()}</span>
        </div>
      </div>

      {/* Friends / Members List */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs text-neutral-400 font-semibold uppercase tracking-widest">Group Members</p>
          <span className="text-[10px] text-neutral-500">{members.length} joined</span>
        </div>
        <div className="space-y-1.5 max-h-32 overflow-y-auto">
          {members.map(member => (
            <div key={member.user_id} className="flex items-center gap-2 bg-neutral-800/50 rounded-lg p-2 border border-neutral-700/40">
              <div className="w-7 h-7 rounded-full bg-emerald-500/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0">
                {(member.profiles?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">
                  {member.profiles?.name || 'Unknown'}
                  {member.user_id === myUserId && <span className="text-neutral-500 text-[10px] ml-1">(you)</span>}
                  {member.user_id === session.host_id && <span className="text-amber-400 text-[10px] ml-1">host</span>}
                </p>
                <p className="text-neutral-500 text-[10px] truncate">{member.profiles?.upi_id || 'No UPI set'}</p>
              </div>
              <span className="text-[10px] text-neutral-400">₹{perPerson.toLocaleString()}</span>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-xs text-neutral-600 text-center py-3">No members yet. Invite your friends!</p>
          )}
        </div>
      </div>

      {/* Session ID — the shareable code friends paste into Join */}
      <div className="bg-neutral-800/70 rounded-xl p-2.5 border border-neutral-700/50">
        <p className="text-[10px] text-neutral-500 mb-1.5 uppercase tracking-widest">Session ID — share with friends</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-[11px] text-emerald-400 font-mono truncate bg-neutral-900/60 px-2 py-1 rounded-lg border border-neutral-700/50">
            {session.id}
          </code>
          <button
            onClick={copySessionId}
            className="flex-shrink-0 bg-neutral-700 hover:bg-neutral-600 text-white px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors"
          >
            {copiedId ? '✓' : 'Copy'}
          </button>
        </div>
        <p className="text-[10px] text-neutral-600 mt-1.5">Friends: install CoBook → click "Join a Session" → paste this ID</p>
      </div>

      <button
        onClick={copyInviteLink}
        className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-emerald-500/50 text-white font-semibold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
      >
        {copied ? (
          <><svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          <span className="text-emerald-400">WhatsApp Message Copied!</span></>
        ) : (
          <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          Copy Invite Message for WhatsApp</>
        )}
      </button>

      <div className="flex gap-2">
        {isHost && (
          <button
            onClick={onLockForPayment}
            disabled={members.length < 2}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-2.5 rounded-xl text-xs transition-colors"
          >
            🔒 Lock & Collect Payment
          </button>
        )}
        <button
          onClick={onLeave}
          className="bg-neutral-800 hover:bg-red-500/20 hover:border-red-500/40 border border-neutral-700 text-neutral-400 hover:text-red-400 font-semibold py-2 px-3 rounded-xl text-xs transition-colors"
          title="Leave session"
        >
          ✕
        </button>
      </div>
      {isHost && members.length < 2 && (
        <p className="text-[10px] text-center text-neutral-600">Need at least 2 members to lock for payment.</p>
      )}
      {!isHost && <p className="text-[10px] text-center text-neutral-500">Waiting for host to lock and request payment...</p>}
    </div>
  );
}
