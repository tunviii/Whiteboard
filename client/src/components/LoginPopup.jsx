import React, { useState } from 'react';
import { Palette, Sparkles, Paintbrush, Brush } from 'lucide-react';

export default function LoginPopup({ onJoinRoom }) {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');

  const handleCreate = () => {
    if (!name) return;
    const newRoomId = Math.random().toString(36).substring(2, 9);
    onJoinRoom({ name, roomId: newRoomId, isCreator: true });
  };

  const handleJoin = () => {
    if (!name || !roomId) return;
    onJoinRoom({ name, roomId, isCreator: false });
  };

  return (
    <div className="relative">
      {/* Decorative background blobs */}
      <div className="absolute -top-6 -left-6 w-24 h-24 bg-secondary rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-24 h-24 bg-accent rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      {/* Main Card */}
      <div className="glass rounded-[30px] p-8 md:p-10 max-w-md w-full relative z-10 border-t-4 border-t-primary border-l-2 border-l-secondary shadow-[0_20px_50px_rgba(99,102,241,0.2)] flex flex-col items-center">
        
        {/* Header Illustration / Icons */}
        <div className="flex items-center justify-center space-x-3 mb-6 relative">
          <div className="absolute -top-4 -right-4 animate-bounce">
            <Sparkles className="text-accent" size={24} />
          </div>
          <Palette className="text-primary" size={48} strokeWidth={1.5} />
          <Paintbrush className="text-secondary" size={40} strokeWidth={1.5} />
          <Brush className="text-success" size={32} strokeWidth={1.5} />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-center mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Collaborative Whiteboard
        </h1>
        <p className="text-center text-slate-500 mb-8 font-medium">
          Draw. Brainstorm. Collaborate.<br />
          Create ideas together in real time.
        </p>

        {/* Inputs */}
        <div className="w-full space-y-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Enter your name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans text-slate-700"
            />
          </div>

          <div className="flex items-center justify-center space-x-4 my-2">
            <div className="h-px bg-border flex-1"></div>
            <span className="text-slate-400 font-semibold text-sm">OR</span>
            <div className="h-px bg-border flex-1"></div>
          </div>

          <div className="relative">
            <input 
              type="text" 
              placeholder="Enter Room ID" 
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-5 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all font-sans text-slate-700"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full space-y-3 mt-8">
          <button 
            onClick={handleCreate}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold text-lg hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            Create Room
          </button>
          <button 
            onClick={handleJoin}
            className="w-full py-3 rounded-xl bg-white border-2 border-secondary text-secondary font-bold text-lg hover:bg-secondary/5 hover:-translate-y-1 transition-all duration-300"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}
