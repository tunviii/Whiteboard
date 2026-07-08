import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
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

const Canvas = forwardRef(({ activeTool, strokeWidth, color }, ref) => {
  const [history, setHistory] = useState([[]]);
  const [historyStep, setHistoryStep] = useState(0);
  const [currentElement, setCurrentElement] = useState(null);
  const svgRef = useRef(null);
  
  const currentLines = history[historyStep] || [];

  const updateHistory = (newLines) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newLines);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  useImperativeHandle(ref, () => ({
    clear: () => updateHistory([]),
    undo: () => setHistoryStep((prev) => Math.max(0, prev - 1)),
    redo: () => setHistoryStep((prev) => Math.min(history.length - 1, prev + 1)),
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
        // Fill white background
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
        // Simplified bounding box check for shapes
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
      updateHistory(filteredLines);
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

    if (['pencil', 'brush', 'highlighter'].includes(activeTool)) {
      setCurrentElement({
        type: 'freehand',
        points: [point],
        tool: activeTool,
        color,
        strokeWidth,
      });
    } else if (['line', 'rectangle', 'circle', 'arrow'].includes(activeTool)) {
      setCurrentElement({
        type: 'shape',
        tool: activeTool,
        start: point,
        end: point,
        color,
        strokeWidth,
      });
    }
  };

  const handlePointerMove = (e) => {
    if (e.buttons !== 1) return;
    const point = [e.clientX, e.clientY, e.pressure || 0.5];

    if (activeTool === 'eraser') {
      eraseAtPoint(point);
      return;
    }

    if (!currentElement) return;

    if (currentElement.type === 'freehand') {
      setCurrentElement((prev) => ({
        ...prev,
        points: [...prev.points, point]
      }));
    } else if (currentElement.type === 'shape') {
      setCurrentElement((prev) => ({
        ...prev,
        end: point
      }));
    }
  };

  const handlePointerUp = (e) => {
    if (!currentElement) return;
    updateHistory([...currentLines, currentElement]);
    setCurrentElement(null);
  };
  
  const allElements = currentElement ? [...currentLines, currentElement] : currentLines;

  return (
    <svg 
      ref={svgRef}
      className="absolute inset-0 w-full h-full touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        cursor: activeTool === 'hand' ? 'grab' 
              : activeTool === 'selection' ? 'default' 
              : activeTool === 'eraser' ? 'cell'
              : 'crosshair'
      }}
    >
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill={color} />
        </marker>
      </defs>

      {allElements.map((el, i) => {
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
    </svg>
  );
});

export default Canvas;
