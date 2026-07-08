import React from 'react';
import { Copy } from 'lucide-react';

export default function RoomInfo({ roomId, onCopy }) {
  return (
    <div className="glass px-4 py-2 rounded-xl flex items-center space-x-3 shadow-sm border border-border">
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Room ID</span>
        <span className="text-sm font-semibold text-slate-700 font-mono">{roomId || 'Loading...'}</span>
      </div>
      <div className="w-px h-6 bg-border"></div>
      <button 
        onClick={onCopy}
        className="text-primary hover:text-secondary hover:bg-primary/10 p-1.5 rounded-lg transition-colors flex items-center space-x-1"
        title="Copy Invite Link"
      >
        <Copy size={16} />
        <span className="text-sm font-medium">Invite</span>
      </button>
    </div>
  );
}
