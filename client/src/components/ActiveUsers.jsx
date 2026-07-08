import React from 'react';
import { Pencil, Users } from 'lucide-react';

const Avatar = ({ name, color, zIndex }) => {
  const initials = name ? name.substring(0, 2).toUpperCase() : '??';
  
  return (
    <div className="relative group cursor-pointer" style={{ zIndex }}>
      {/* Avatar Circle */}
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md border-2 border-white transition-transform group-hover:scale-110"
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>
      
      {/* Online Indicator */}
      <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-white shadow-sm"></div>
      
      {/* Tooltip */}
      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-1 bg-slate-800 text-white text-xs rounded-md shadow-lg whitespace-nowrap">
        {name}
      </div>
    </div>
  );
};

export default function ActiveUsers({ users, onToggleSidebar }) {
  // Show max 3 avatars, others are represented by +N
  const maxDisplay = 3;
  const displayUsers = users.slice(0, maxDisplay);
  const extraCount = Math.max(0, users.length - maxDisplay);

  return (
    <div className="flex items-center -space-x-3" onClick={onToggleSidebar}>
      {displayUsers.map((user, idx) => {
        return (
          <Avatar 
            key={user.socketId || idx} 
            name={user.username} 
            color={user.color || '#6366F1'} 
            zIndex={displayUsers.length - idx} 
          />
        );
      })}
      
      {extraCount > 0 ? (
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 font-bold text-xs shadow-md border-2 border-white z-0 hover:bg-slate-200 cursor-pointer">
          +{extraCount}
        </div>
      ) : (
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-primary shadow-md border-2 border-white z-0 hover:bg-slate-50 cursor-pointer transition-transform hover:scale-110"
          title="View all users"
        >
          <Users size={18} />
        </div>
      )}
    </div>
  );
}
