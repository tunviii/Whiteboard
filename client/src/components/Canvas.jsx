import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { getStroke } from 'perfect-freehand';

// Helper to convert perfect-freehand stroke points to SVG path data
const getSvgPathFromStroke = (stroke) => {
  if (!stroke.length) return '';
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q']
  );
  d.push('Z');
  return d.join(' ');
};

// Distance helper for eraser
const dist = (p1, p2) => Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));

const Canvas = forwardRef(({ activeTool, strokeWidth, color, socket, roomId, username }, ref) => {
  const [history, setHistory] = useState([[]]);
  const [historyStep, setHistoryStep] = useState(0);
  const [currentElement, setCurrentElement] = useState(null);
  const [remoteElements, setRemoteElements] = useState({});
  const [remoteCursors, setRemoteCursors] = useState({});
  const [localPointer, setLocalPointer] = useState(null);
  const svgRef = useRef(null);
  
  const currentLines = history[historyStep] || [];

  // Socket setup
  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit('sync-request', { roomId });

    socket.on('sync-response', (elements) => {
      setHistory([elements]);
      setHistoryStep(0);
    });

    socket.on('draw-progress', ({ socketId, element }) => {
      setRemoteElements((prev) => ({ ...prev, [socketId]: element }));
    });

    socket.on('draw-end', ({ socketId }) => {
      setRemoteElements((prev) => {
        const updated = { ...prev };
        delete updated[socketId];
        return updated;
      });
    });

    socket.on('element-added', (element) => {
      setHistory((prevHistory) => {
        const step = prevHistory.length - 1;
        const newLines = [...(prevHistory[step] || []), element];
        return [...prevHistory, newLines];
      });
      setHistoryStep((prev) => prev + 1);
    });

    socket.on('elements-updated', (elements) => {
      setHistory((prevHistory) => [...prevHistory, elements]);
      setHistoryStep((prev) => prev + 1);
    });

    socket.on('cursor-update', ({ socketId, pointer, username, color }) => {
      setRemoteCursors((prev) => ({ ...prev, [socketId]: { pointer, username, color } }));
    });

    return () => {
      socket.off('sync-response');
      socket.off('draw-progress');
      socket.off('draw-end');
      socket.off('element-added');
      socket.off('elements-updated');
      socket.off('cursor-update');
    };
  }, [socket, roomId]);

  const updateHistory = (newLines, shouldEmit = false) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newLines);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);

    if (shouldEmit && socket && roomId) {
      socket.emit('update-elements', { roomId, elements: newLines });
    }
  };

  useImperativeHandle(ref, () => ({
    clear: () => updateHistory([], true),
    undo: () => {
      if (historyStep > 0) {
        const newStep = historyStep - 1;
        setHistoryStep(newStep);
        if (socket && roomId) {
          socket.emit('update-elements', { roomId, elements: history[newStep] });
        }
      }
    },
    redo: () => {
      if (historyStep < history.length - 1) {
        const newStep = historyStep + 1;
        setHistoryStep(newStep);
        if (socket && roomId) {
          socket.emit('update-elements', { roomId, elements: history[newStep] });
        }
      }
    },
    exportAsPNG: () => {
      if (!svgRef.current) return;
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = svgRef.current.clientWidth;
        canvas.height = svgRef.current.clientHeight;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'whiteboard.png';
        link.href = pngUrl;
        link.click();
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  }));

  const eraseAtPoint = (point) => {
    const eraserSize = 20;
    const filteredLines = currentLines.filter(line => {
      if (line.type === 'freehand') {
        return !line.points.some(p => dist(p, point) < eraserSize);
      } else if (line.type === 'shape') {
        const minX = Math.min(line.start[0], line.end[0]);
        const maxX = Math.max(line.start[0], line.end[0]);
        const minY = Math.min(line.start[1], line.end[1]);
        const maxY = Math.max(line.start[1], line.end[1]);
        const isInside = point[0] >= minX - eraserSize && point[0] <= maxX + eraserSize &&
                         point[1] >= minY - eraserSize && point[1] <= maxY + eraserSize;
        return !isInside;
      }
      return true;
    });

    if (filteredLines.length !== currentLines.length) {
      updateHistory(filteredLines, true);
    }
  };

  const handlePointerDown = (e) => {
    if (activeTool === 'hand' || activeTool === 'selection') return;
    
    e.target.setPointerCapture(e.pointerId);
    const point = [e.clientX, e.clientY, e.pressure || 0.5];

    if (activeTool === 'eraser') {
      eraseAtPoint(point);
      return;
    }

    let newElement = null;
    if (['pencil', 'brush', 'highlighter'].includes(activeTool)) {
      newElement = { type: 'freehand', points: [point], tool: activeTool, color, strokeWidth };
    } else if (['line', 'rectangle', 'circle', 'arrow'].includes(activeTool)) {
      newElement = { type: 'shape', tool: activeTool, start: point, end: point, color, strokeWidth };
    }
    
    if (newElement) {
      setCurrentElement(newElement);
      if (socket && roomId) {
        socket.emit('draw-progress', { roomId, element: newElement });
      }
    }
  };

  const handlePointerMove = (e) => {
    const point = [e.clientX, e.clientY, e.pressure || 0.5];
    setLocalPointer(point);

    if (socket && roomId) {
      socket.emit('cursor-move', { roomId, pointer: point, username, color });
    }

    if (e.buttons !== 1) return;

    if (activeTool === 'eraser') {
      eraseAtPoint(point);
      return;
    }

    if (!currentElement) return;

    let updatedElement = { ...currentElement };
    if (currentElement.type === 'freehand') {
      updatedElement.points = [...currentElement.points, point];
    } else if (currentElement.type === 'shape') {
      updatedElement.end = point;
    }

    setCurrentElement(updatedElement);
    if (socket && roomId) {
      socket.emit('draw-progress', { roomId, element: updatedElement });
    }
  };

  const handlePointerUp = (e) => {
    if (!currentElement) return;
    
    if (socket && roomId) {
      socket.emit('draw-end', { roomId });
      socket.emit('add-element', { roomId, element: currentElement });
    }
    
    updateHistory([...currentLines, currentElement], false); // Server handles broadcast, we just update local history stack
    setCurrentElement(null);
  };
  
  // Combine local elements with ongoing remote elements
  const allElements = [
    ...currentLines, 
    ...(currentElement ? [currentElement] : []),
    ...Object.values(remoteElements)
  ];

  return (
    <svg 
      ref={svgRef}
      className="absolute inset-0 w-full h-full touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={() => setLocalPointer(null)}
      style={{
        cursor: 'none'
      }}
    >
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill={color} />
        </marker>
      </defs>

      {allElements.map((el, i) => {
        if (!el) return null;
        if (el.type === 'freehand') {
          const strokeOptions = {
            size: el.strokeWidth * (el.tool === 'highlighter' ? 3 : el.tool === 'brush' ? 1.5 : 1),
            thinning: el.tool === 'brush' ? 0.7 : el.tool === 'pencil' ? 0.2 : 0,
            smoothing: 0.5,
            streamline: 0.5,
            simulatePressure: el.tool !== 'highlighter',
          };
          const pathData = getSvgPathFromStroke(getStroke(el.points, strokeOptions));
          return (
            <path
              key={i}
              d={pathData}
              fill={el.color}
              opacity={el.tool === 'highlighter' ? 0.4 : 1}
              style={{ mixBlendMode: el.tool === 'highlighter' ? 'multiply' : 'normal' }}
            />
          );
        } else if (el.type === 'shape') {
          const { start, end, tool, strokeWidth, color } = el;
          const minX = Math.min(start[0], end[0]);
          const minY = Math.min(start[1], end[1]);
          const width = Math.abs(end[0] - start[0]);
          const height = Math.abs(end[1] - start[1]);

          if (tool === 'rectangle') {
            return <rect key={i} x={minX} y={minY} width={width} height={height} fill="none" stroke={color} strokeWidth={strokeWidth} rx={8} />;
          } else if (tool === 'circle') {
            const rx = width / 2;
            const ry = height / 2;
            const cx = minX + rx;
            const cy = minY + ry;
            return <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={color} strokeWidth={strokeWidth} />;
          } else if (tool === 'line') {
            return <line key={i} x1={start[0]} y1={start[1]} x2={end[0]} y2={end[1]} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />;
          } else if (tool === 'arrow') {
            return (
              <line 
                key={i} x1={start[0]} y1={start[1]} x2={end[0]} y2={end[1]} 
                stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" 
                markerEnd="url(#arrowhead)" 
              />
            );
          }
        }
        return null;
      })}
      
      {/* Remote Cursors */}
      {Object.entries(remoteCursors).map(([id, cursor]) => (
        <g 
          key={id} 
          transform={`translate(${cursor.pointer[0]}, ${cursor.pointer[1]})`} 
          className="transition-transform duration-75 ease-out pointer-events-none"
        >
          {/* Custom Cursor Pointer SVG */}
          <path d="M0,0 L20,10 L10,13 L6,22 Z" fill={cursor.color} stroke="white" strokeWidth="2" />
          
          <foreignObject x="10" y="20" width="150" height="40">
            <div 
              className="inline-block px-2 py-1 rounded-md text-white text-xs font-bold shadow-md whitespace-nowrap" 
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.username}
            </div>
          </foreignObject>
        </g>
      ))}

      {/* Local Cursor */}
      {localPointer && (
        <g 
          transform={`translate(${localPointer[0]}, ${localPointer[1]})`} 
          className="pointer-events-none"
        >
          <path d="M0,0 L20,10 L10,13 L6,22 Z" fill={color} stroke="white" strokeWidth="2" />
          <foreignObject x="10" y="20" width="150" height="40">
            <div 
              className="inline-block px-2 py-1 rounded-md text-white text-xs font-bold shadow-md whitespace-nowrap" 
              style={{ backgroundColor: color }}
            >
              {username} (You)
            </div>
          </foreignObject>
        </g>
      )}
    </svg>
  );
});

export default Canvas;
