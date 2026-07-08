import React, { useState } from 'react';
import { 
  MousePointer2, Hand, Pencil, Paintbrush, Eraser, 
  Minus, Square, Circle, ArrowRight, Type, StickyNote, 
  Image as ImageIcon, Undo2, Redo2, Trash2, Download, 
  Highlighter, Palette
} from 'lucide-react';

const ToolButton = ({ icon: Icon, isActive, onClick, title }) => (
  <div className="relative group flex items-center justify-center">
    <button
      onClick={onClick}
      className={`p-2 rounded-xl transition-all duration-200 ${
        isActive 
          ? 'bg-primary/10 text-primary shadow-inner scale-95' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 hover:scale-105'
      }`}
      title={title}
    >
      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
    </button>
    {/* Tooltip */}
    <div className="absolute top-full mt-2 hidden group-hover:block px-2 py-1 bg-slate-800 text-white text-xs rounded-md shadow-lg whitespace-nowrap z-50">
      {title}
    </div>
  </div>
);

const Divider = () => <div className="w-px h-6 bg-border mx-1" />;

export default function FloatingToolbar({ 
  onClear,
  activeTool,
  onToolChange,
  strokeWidth,
  onStrokeWidthChange,
  color,
  onColorChange,
  onUndo,
  onRedo,
  onExport
}) {
  const [showBrushControls, setShowBrushControls] = useState(false);

  const tools = [
    { id: 'selection', icon: MousePointer2, title: 'Selection' },
    { id: 'hand', icon: Hand, title: 'Hand Tool' },
    { id: 'divider-1' },
    { id: 'pencil', icon: Pencil, title: 'Pencil' },
    { id: 'brush', icon: Paintbrush, title: 'Brush' },
    { id: 'highlighter', icon: Highlighter, title: 'Highlighter' },
    { id: 'divider-2' },
    { id: 'line', icon: Minus, title: 'Line' },
    { id: 'rectangle', icon: Square, title: 'Rectangle' },
    { id: 'circle', icon: Circle, title: 'Circle' },
    { id: 'arrow', icon: ArrowRight, title: 'Arrow' },
    { id: 'divider-3' },
    { id: 'text', icon: Type, title: 'Text' },
    { id: 'sticky', icon: StickyNote, title: 'Sticky Note' },
    { id: 'image', icon: ImageIcon, title: 'Image Upload' },
    { id: 'divider-4' },
    { id: 'eraser', icon: Eraser, title: 'Eraser' },
  ];

  return (
    <div className="flex flex-col items-center">
      {/* Main Toolbar */}
      <div className="glass px-3 py-2 rounded-2xl flex items-center space-x-1 shadow-lg transform transition-transform duration-300">
        
        {tools.map((tool) => {
          if (tool.id.startsWith('divider')) return <Divider key={tool.id} />;
          return (
            <ToolButton
              key={tool.id}
              icon={tool.icon}
              title={tool.title}
              isActive={activeTool === tool.id}
              onClick={() => {
                onToolChange(tool.id);
                if (['pencil', 'brush', 'highlighter'].includes(tool.id)) {
                  setShowBrushControls(true);
                } else {
                  setShowBrushControls(false);
                }
              }}
            />
          );
        })}

        <Divider />
        
        {/* Actions */}
        <ToolButton icon={Undo2} title="Undo" onClick={onUndo} />
        <ToolButton icon={Redo2} title="Redo" onClick={onRedo} />
        <ToolButton 
          icon={Trash2} 
          title="Clear Canvas" 
          onClick={onClear}
        />
        <Divider />
        <ToolButton icon={Download} title="Export PNG" onClick={onExport} />
      </div>

      {/* Brush Controls Dropdown */}
      <div className={`mt-4 glass px-6 py-4 rounded-2xl shadow-lg transition-all duration-300 origin-top ${showBrushControls ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none absolute'}`}>
        <div className="flex items-center space-x-6">
          {/* Color Picker Mock */}
          <div className="flex flex-col space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Color</span>
            <div className="flex space-x-2">
              {['#000000', '#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#6366F1', '#8B5CF6'].map(c => (
                <button 
                  key={c}
                  className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => onColorChange(c)}
                />
              ))}
              <button className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-slate-50">
                <Palette size={12} className="text-slate-400" />
              </button>
            </div>
          </div>
          
          <div className="w-px h-10 bg-border"></div>

          {/* Stroke Width Slider */}
          <div className="flex flex-col space-y-2 min-w-[120px]">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stroke Width</span>
            <input 
              type="range" 
              min="1" max="20" 
              value={strokeWidth} 
              onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="w-px h-10 bg-border"></div>

          {/* Brush Preview */}
          <div className="flex flex-col space-y-2 items-center min-w-[80px]">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Preview</span>
            <div className="h-6 w-full flex items-center justify-center bg-slate-50 rounded border border-border overflow-hidden">
              <div 
                className="rounded-full bg-current transition-all duration-200"
                style={{ 
                  width: `${strokeWidth}px`, 
                  height: `${strokeWidth}px`,
                  color: color
                }}
              ></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
