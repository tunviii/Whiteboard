import React from 'react';
import { X, User, Circle } from 'lucide-react';

export default function UsersSidebar({ isOpen, onClose, users }) {
  return (
    <div 
      className={`fixed top-0 right-0 h-full w-72 glass shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-white/40 flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-border/50 flex justify-between items-center bg-white/50">
        <h2 className="text-lg font-heading font-bold text-slate-800 flex items-center space-x-2">
          <User size={20} className="text-primary" />
          <span>Active Users</span>
        </h2>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 p-1.5 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {users.length === 0 ? (
          <p className="text-slate-500 text-sm text-center mt-4">Waiting for others to join...</p>
        ) : (
          users.map((user, idx) => {
            // Assign a deterministic pastel color based on the username string
            const colors = ['#6366F1', '#8B5CF6', '#F59E0B', '#22C55E', '#EF4444', '#3B82F6'];
            const colorIndex = user.username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
            const color = colors[colorIndex];
            const initials = user.username.substring(0, 2).toUpperCase();

            return (
              <div key={user.socketId || idx} className="flex items-center space-x-4 bg-white/60 p-3 rounded-xl border border-white/60 shadow-sm transition-all hover:bg-white/80">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
                  style={{ backgroundColor: color }}
                >
                  {initials}
                </div>
                <div className="flex-1 truncate">
                  <p className="font-semibold text-slate-700 truncate">{user.username}</p>
                  <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                    <Circle size={8} className="text-success fill-success" />
                    <span>Online</span>
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
