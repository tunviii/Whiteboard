import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import FloatingToolbar from '../components/FloatingToolbar';
import ActiveUsers from '../components/ActiveUsers';
import RoomInfo from '../components/RoomInfo';
import ToastContainer from '../components/ToastContainer';
import Canvas from '../components/Canvas';
import UsersSidebar from '../components/UsersSidebar';
import socket from '../services/socket';

export default function Whiteboard() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract name and userId from location state (passed during navigate)
  const username = location.state?.username;
  const userId = location.state?.userId;

  useEffect(() => {
    // Redirect back to home if no username is provided (direct URL access without login)
    if (!username || !userId) {
      navigate('/');
    }
  }, [username, userId, navigate]);

  const [toasts, setToasts] = useState([]);
  const [users, setUsers] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Lifted state from Toolbar
  const [activeTool, setActiveTool] = useState('pencil');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [color, setColor] = useState('#6366F1');
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Inter, sans-serif');

  const canvasRef = useRef(null);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Socket Connection and User Tracking
  useEffect(() => {
    if (roomId && username && userId) {
      socket.emit('join-room', { roomId, username, userId });
      addToast(`Joined room: ${roomId}`, 'success');
    }

    const handleUsersUpdate = (activeUsers) => {
      setUsers(activeUsers);
    };

    socket.on('users', handleUsersUpdate);

    return () => {
      socket.emit('leave-room', { roomId });
      socket.off('users', handleUsersUpdate);
    };
  }, [roomId, username, userId]);

  const handleClearCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.clear();
      addToast('Canvas cleared', 'info');
    }
  };

  const handleUndo = () => canvasRef.current?.undo();
  const handleRedo = () => canvasRef.current?.redo();
  const handleCancelEdit = () => {
    canvasRef.current?.cancelEdit();
    setActiveTool('selection');
  };
  const handleExport = () => {
    canvasRef.current?.exportAsPNG();
    addToast('Export started', 'success');
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-white">
      {/* Infinite Canvas Background Grid */}
      <div className="absolute inset-0 canvas-dot-grid pointer-events-none opacity-50" style={{ minWidth: '300vw', minHeight: '300vh', transform: 'translate(-50vw, -50vh)' }}>
      </div>

      {/* The actual drawing canvas */}
      <Canvas 
        ref={canvasRef}
        activeTool={activeTool}
        strokeWidth={strokeWidth}
        color={color}
        fontSize={fontSize}
        fontFamily={fontFamily}
        socket={socket}
        roomId={roomId}
        username={username}
        identityColor={users.find(u => u.userId === userId)?.color || color}
      />

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-10">
        
        {/* Top Section */}
        <div className="flex justify-between items-start pointer-events-auto">
          {/* Top Left: Logo / Branding / Leave Room */}
          <div className="flex space-x-3">
            <button 
              onClick={() => navigate('/')}
              className="glass px-4 py-2 rounded-full font-bold text-slate-700 shadow-sm flex items-center space-x-2 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              <span>← Leave</span>
            </button>
            <div className="glass px-4 py-2 rounded-full font-bold text-primary shadow-sm flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-success"></div>
              <span>Live</span>
            </div>
          </div>

          {/* Top Right: Room Info & Active Users */}
          <div className="flex flex-col items-end space-y-4">
            <RoomInfo roomId={roomId} onCopy={() => {
              navigator.clipboard.writeText(roomId || '');
              addToast('Room copied to clipboard', 'success');
            }} />
            <ActiveUsers users={users} onToggleSidebar={() => setIsSidebarOpen(true)} />
          </div>
        </div>
      </div>
      
      {/* Floating Toolbar centered horizontally at top */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-auto z-20">
        <FloatingToolbar 
          activeTool={activeTool}
          onToolChange={setActiveTool}
          strokeWidth={strokeWidth}
          onStrokeWidthChange={setStrokeWidth}
          color={color}
          onColorChange={setColor}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          fontFamily={fontFamily}
          onFontFamilyChange={setFontFamily}
          onClear={handleClearCanvas}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onExport={handleExport}
          onCancelEdit={handleCancelEdit}
          onImageUpload={(file) => {
            if (canvasRef.current) {
              canvasRef.current.addImage(file);
            }
          }}
        />
      </div>

      {/* Right Sidebar for Active Users */}
      <UsersSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        users={users} 
        localSocketId={socket.id}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
