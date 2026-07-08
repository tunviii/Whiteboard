import React, { useState, useEffect } from 'react';
import { Palette, Sparkles, Paintbrush, Brush } from 'lucide-react';

export default function LoginPopup({ onJoinRoom }) {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    // Generate or retrieve persistent user identity
    let storedUserId = sessionStorage.getItem('whiteboard_userId');
    const storedName = sessionStorage.getItem('whiteboard_username');

    if (!storedUserId) {
      storedUserId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('whiteboard_userId', storedUserId);
    }

    setUserId(storedUserId);
    if (storedName) setName(storedName);
  }, []);

  const handleCreate = () => {
    if (!name) return;
    sessionStorage.setItem('whiteboard_username', name.trim());
    const newRoomId = Math.random().toString(36).substring(2, 9);
    onJoinRoom({ name, roomId: newRoomId, isCreator: true, userId });
  };

  const handleJoin = () => {
    if (!name || !roomId) return;
    sessionStorage.setItem('whiteboard_username', name.trim());
    onJoinRoom({ name, roomId, isCreator: false, userId });
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Decorative background blobs */}
      <div className="absolute -top-6 -left-6 w-24 h-24 bg-secondary rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-24 h-24 bg-accent rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      {/* Main Card */}
      <div className="glass rounded-[30px] p-8 md:p-10 w-full relative z-10 border-t-4 border-t-primary border-l-2 border-l-secondary shadow-[0_20px_50px_rgba(99,102,241,0.2)] flex flex-col items-center">
        
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
          DoodleBoard
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
              placeholder="Your Name (Required)" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans text-slate-700"
            />
          </div>

          <div className="relative">
            <input 
              type="text" 
              placeholder="Room ID (Leave blank to create)" 
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-5 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all font-sans text-slate-700"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full mt-8">
          <button 
            onClick={handleJoin}
            disabled={!name || !roomId}
            className={`w-full py-3 rounded-xl font-bold text-lg transition-all duration-300 ${!name || !roomId ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white hover:shadow-lg hover:-translate-y-1'}`}
          >
            Join Room
          </button>
          
          <div className="flex items-center justify-center space-x-4 my-4">
            <div className="h-px bg-border flex-1"></div>
            <span className="text-slate-400 font-semibold text-sm">OR</span>
            <div className="h-px bg-border flex-1"></div>
          </div>
          
          <button 
            onClick={handleCreate}
            disabled={!name}
            className={`w-full py-3 rounded-xl border-2 font-bold text-lg transition-all duration-300 ${!name ? 'border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-secondary text-secondary hover:bg-secondary/5 hover:-translate-y-1'}`}
          >
            Create New Room
          </button>
        </div>
      </div>
    </div>
  );
}
