import React from 'react';
import LoginPopup from '../components/LoginPopup';
import { 
  Pencil, 
  PenTool, 
  Highlighter, 
  Paperclip, 
  Eraser, 
  Send,
  Palette,
  StickyNote,
  Ruler,
  Scissors
} from 'lucide-react';

const FloatingElement = ({ icon: Icon, color, size, top, left, delay, rotation }) => {
  return (
    <div 
      className="absolute animate-float opacity-70"
      style={{
        top,
        left,
        animationDelay: delay,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <Icon 
        size={size} 
        color={color} 
        strokeWidth={1.5}
        style={{
          filter: `drop-shadow(0px 10px 15px ${color}40)`,
        }}
      />
    </div>
  );
};

import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleJoinRoom = (data) => {
    navigate(`/room/${data.roomId}`, { state: { name: data.name } });
  };
  const floatingItems = [
    { icon: Pencil, color: '#F59E0B', size: 64, top: '15%', left: '10%', delay: '0s', rotation: -15 },
    { icon: Palette, color: '#8B5CF6', size: 80, top: '25%', left: '80%', delay: '1s', rotation: 25 },
    { icon: StickyNote, color: '#22C55E', size: 70, top: '70%', left: '15%', delay: '2s', rotation: 10 },
    { icon: Ruler, color: '#6366F1', size: 60, top: '80%', left: '75%', delay: '1.5s', rotation: -20 },
    { icon: Scissors, color: '#EF4444', size: 55, top: '10%', left: '60%', delay: '0.5s', rotation: 45 },
    { icon: Highlighter, color: '#F59E0B', size: 65, top: '50%', left: '5%', delay: '2.5s', rotation: 30 },
    { icon: Paperclip, color: '#8B5CF6', size: 40, top: '60%', left: '85%', delay: '0.2s', rotation: -40 },
    { icon: Eraser, color: '#6366F1', size: 50, top: '40%', left: '90%', delay: '1.8s', rotation: 15 },
    { icon: Send, color: '#22C55E', size: 60, top: '85%', left: '40%', delay: '0.8s', rotation: -10 },
    { icon: PenTool, color: '#EF4444', size: 70, top: '20%', left: '35%', delay: '2.2s', rotation: 55 },
  ];

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#F8FAFC]">
      {/* Background whiteboard grid */}
      <div className="absolute inset-0 canvas-dot-grid opacity-50"></div>
      
      {/* Background subtle doodles (using SVG) */}
      <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 100 200 Q 150 150 200 250 T 300 150" fill="transparent" stroke="#6366F1" strokeWidth="2" strokeDasharray="5,5" />
        <circle cx="80%" cy="30%" r="40" fill="transparent" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        <rect x="25%" y="65%" width="80" height="60" rx="10" fill="transparent" stroke="#22C55E" strokeWidth="2" />
        <path d="M 85% 75% L 90% 85% L 80% 85% Z" fill="transparent" stroke="#EF4444" strokeWidth="2" />
        <text x="50%" y="15%" fontFamily="Caveat, cursive" fontSize="24" fill="#8B5CF6" transform="rotate(-5, 500, 150)">Idea Brainstorming 🚀</text>
      </svg>

      {/* Floating Elements */}
      {floatingItems.map((item, idx) => (
        <FloatingElement key={idx} {...item} />
      ))}

      {/* Login Popup */}
      <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
        <LoginPopup onJoinRoom={handleJoinRoom} />
      </div>
    </div>
  );
}
