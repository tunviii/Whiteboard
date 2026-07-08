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

const dist = (p1, p2) => Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));

const Canvas = forwardRef(({ activeTool, strokeWidth, color, fontSize, fontFamily, socket, roomId, username, identityColor }, ref) => {
  const [history, setHistory] = useState([[]]);
  const [historyStep, setHistoryStep] = useState(0);
  const [currentElement, setCurrentElement] = useState(null);
  const [remoteElements, setRemoteElements] = useState({});
  const [remoteCursors, setRemoteCursors] = useState({});
  const [localPointer, setLocalPointer] = useState(null);
  
  // Dragging State
  const [draggingElementIndex, setDraggingElementIndex] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Selection and Resize State
  const [selectedElementIndex, setSelectedElementIndex] = useState(null);
  const [resizeState, setResizeState] = useState(null);
  
  // Infinite Canvas State
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  
  // Multimedia State
  const [editingElement, setEditingElement] = useState(null);
  
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

  // Spacebar pan toggle
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !editingElement && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        setIsSpaceDown(true);
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpaceDown(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [editingElement]);

  // Handle Wheel for Zoom/Pan
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const handleWheel = (e) => {
      e.preventDefault();
      if (e.ctrlKey) {
        // Zoom
        const zoomFactor = -e.deltaY * 0.01;
        setZoom(prevZoom => {
          const newZoom = Math.min(Math.max(prevZoom + zoomFactor, 0.1), 5);
          const rect = el.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          setPan(prevPan => ({
            x: mouseX - (mouseX - prevPan.x) * (newZoom / prevZoom),
            y: mouseY - (mouseY - prevPan.y) * (newZoom / prevZoom)
          }));
          return newZoom;
        });
      } else {
        // Pan
        setPan(prevPan => ({ x: prevPan.x - e.deltaX, y: prevPan.y - e.deltaY }));
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const updateHistory = (newLines, shouldEmit = false) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newLines);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
    if (shouldEmit && socket && roomId) {
      socket.emit('update-elements', { roomId, elements: newLines });
    }
  };

  const deleteElement = (index) => {
    const newLines = [...currentLines];
    newLines.splice(index, 1);
    updateHistory(newLines, true);
  };

  useEffect(() => {
    if (editingElement) {
      finalizeEditingElement();
    }
  }, [activeTool]);


  useImperativeHandle(ref, () => ({
    clear: () => updateHistory([], true),
    cancelEdit: () => setEditingElement(null),
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
      alert("Basic export maintained. In a full app, this would render the entire bounds regardless of pan.");
    },
    addImage: (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const img = new Image();
        img.onload = () => {
          // Place image in center of current view
          const rect = svgRef.current.getBoundingClientRect();
          const x = (rect.width / 2 - pan.x) / zoom - (img.width / 2);
          const y = (rect.height / 2 - pan.y) / zoom - (img.height / 2);
          
          const newElement = {
            type: 'image',
            x, y,
            width: img.width,
            height: img.height,
            dataUrl
          };
          
          updateHistory([...currentLines, newElement], false);
          if (socket && roomId) {
            socket.emit('add-element', { roomId, element: newElement });
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  }));

  const getPointerPosition = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    return [x, y, e.pressure || 0.5];
  };

  const handlePointerDown = (e) => {
    // Let the user click inside the active textarea without finalizing
    if (e.target.tagName === 'TEXTAREA' || e.target.closest('#editing-overlay')) {
      return;
    }

    // Commit any active text edit if they clicked outside
    if (editingElement) {
      finalizeEditingElement();
    }
    
    // Middle click, spacebar, or hand tool for panning
    if (e.button === 1 || e.button === 2 || activeTool === 'hand' || isSpaceDown || e.altKey || e.shiftKey || (e.ctrlKey && activeTool==='selection')) {
      setIsPanning(true);
      return;
    }
    
    const point = getPointerPosition(e);

    // If selection tool is active, attempt to select an element for dragging or resizing
    if (activeTool === 'selection') {
      
      // Check for resize handles first
      if (selectedElementIndex !== null) {
        const el = currentLines[selectedElementIndex];
        if (el && (el.type === 'text' || el.type === 'sticky')) {
          const w = el.width || (el.type === 'sticky' ? 250 : 150);
          const h = el.height || (el.type === 'sticky' ? 250 : 40);
          const handles = {
            'tl': [el.x, el.y],
            'tr': [el.x + w, el.y],
            'bl': [el.x, el.y + h],
            'br': [el.x + w, el.y + h]
          };
          for (const [handle, hp] of Object.entries(handles)) {
            if (dist(point, hp) < 20 / zoom) { // Scaled hit radius
              setResizeState({
                handle,
                initialPointer: point,
                initialFontSize: el.fontSize || 24,
                initialWidth: w,
                initialHeight: h,
                initialX: el.x,
                initialY: el.y
              });
              try { e.target.setPointerCapture(e.pointerId); } catch(err){}
              return; // Stop here, we are resizing
            }
          }
        }
      }

      // Find the top-most element that intersects the click point (running backwards through array)
      let clickedIndex = -1;
      for (let i = currentLines.length - 1; i >= 0; i--) {
        const line = currentLines[i];
        let isHit = false;
        
        if (line.type === 'freehand') {
          // Bounding box for freehand to make selecting easier
          if (line.points && line.points.length > 0) {
            const minX = Math.min(...line.points.map(p => p[0]));
            const maxX = Math.max(...line.points.map(p => p[0]));
            const minY = Math.min(...line.points.map(p => p[1]));
            const maxY = Math.max(...line.points.map(p => p[1]));
            isHit = point[0] >= minX - 10 && point[0] <= maxX + 10 && point[1] >= minY - 10 && point[1] <= maxY + 10;
          }
        } else if (line.type === 'shape') {
          const minX = Math.min(line.start[0], line.end[0]);
          const maxX = Math.max(line.start[0], line.end[0]);
          const minY = Math.min(line.start[1], line.end[1]);
          const maxY = Math.max(line.start[1], line.end[1]);
          isHit = point[0] >= minX - 10 && point[0] <= maxX + 10 && point[1] >= minY - 10 && point[1] <= maxY + 10;
        } else if (line.type === 'text') {
          const w = line.width || 300; 
          const h = line.height || 100;  
          isHit = point[0] >= line.x - 10 && point[0] <= line.x + w + 10 && point[1] >= line.y - 10 && point[1] <= line.y + h + 10;
        } else if (line.type === 'sticky' || line.type === 'image') {
          const w = line.width || (line.type === 'sticky' ? 250 : 200);
          const h = line.height || (line.type === 'sticky' ? 250 : 100);
          isHit = point[0] >= line.x - 20 && point[0] <= line.x + w + 20 && point[1] >= line.y - 20 && point[1] <= line.y + h + 20;
        }

        if (isHit) {
          clickedIndex = i;
          break;
        }
      }

      if (clickedIndex !== -1) {
        try {
          e.target.setPointerCapture(e.pointerId);
        } catch (err) {
          try { svgRef.current.setPointerCapture(e.pointerId); } catch (e) {}
        }
        setDraggingElementIndex(clickedIndex);
        setSelectedElementIndex(clickedIndex); // Mark as selected
        const el = currentLines[clickedIndex];
        
        // Calculate offset based on element type
        if (el.type === 'text' || el.type === 'sticky' || el.type === 'image') {
          setDragOffset({ x: point[0] - el.x, y: point[1] - el.y });
        } else if (el.type === 'shape') {
          setDragOffset({ x: point[0] - el.start[0], y: point[1] - el.start[1] });
        } else if (el.type === 'freehand') {
          setDragOffset({ x: point[0] - el.points[0][0], y: point[1] - el.points[0][1] });
        }
      } else {
        setSelectedElementIndex(null);
      }
      return;
    }
    
    if (activeTool === 'text' || activeTool === 'sticky') {
      e.preventDefault(); // Prevent browser focus shift on mouseup
      setEditingElement({
        type: activeTool,
        x: point[0],
        y: point[1],
        width: activeTool === 'sticky' ? 250 : 150,
        height: activeTool === 'sticky' ? 250 : 40,
        text: '',
        color: color,
        fontSize: fontSize,
        fontFamily: fontFamily
      });
      return;
    }
    
    e.target.setPointerCapture(e.pointerId);

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

  const eraseAtPoint = (point) => {
    const eraserSize = 20 / zoom;
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
      } else if (line.type === 'text') {
        const w = 500; 
        const h = 100;  
        return !(point[0] >= line.x - 20 && point[0] <= line.x + w && point[1] >= line.y - h && point[1] <= line.y + h/2);
      } else if (line.type === 'sticky' || line.type === 'image') {
        const w = line.width || (line.type === 'sticky' ? 250 : 200); 
        const h = line.height || (line.type === 'sticky' ? 250 : 100);
        return !(point[0] >= line.x - 20 && point[0] <= line.x + w + 20 && point[1] >= line.y - 20 && point[1] <= line.y + h + 20);
      }
      return true;
    });

    if (filteredLines.length !== currentLines.length) {
      updateHistory(filteredLines, true);
    }
  };

  const handlePointerMove = (e) => {
    const point = getPointerPosition(e);
    
    if (isPanning) {
      setPan({
        x: pan.x + e.movementX,
        y: pan.y + e.movementY
      });
      return;
    }

    if (resizeState !== null && selectedElementIndex !== null) {
      const newLines = [...currentLines];
      const el = { ...newLines[selectedElementIndex] };
      const dx = point[0] - resizeState.initialPointer[0];
      const dy = point[1] - resizeState.initialPointer[1];
      
      // Calculate a scale factor based on drag distance for the specific handle
      let dragDist = 0;
      if (resizeState.handle === 'br') dragDist = (dx + dy) / 2;
      else if (resizeState.handle === 'bl') dragDist = (-dx + dy) / 2;
      else if (resizeState.handle === 'tr') dragDist = (dx - dy) / 2;
      else if (resizeState.handle === 'tl') dragDist = (-dx - dy) / 2;
      
      const scale = Math.max(0.2, 1 + (dragDist / 100));
      
      el.fontSize = Math.max(8, Math.round(resizeState.initialFontSize * scale));
      el.width = Math.max(50, resizeState.initialWidth * scale);
      el.height = Math.max(20, resizeState.initialHeight * scale);
      
      // If dragging top/left handles, we must also adjust x/y to keep bottom/right fixed
      if (resizeState.handle === 'tl') {
        el.x = resizeState.initialX + (resizeState.initialWidth - el.width);
        el.y = resizeState.initialY + (resizeState.initialHeight - el.height);
      } else if (resizeState.handle === 'tr') {
        el.y = resizeState.initialY + (resizeState.initialHeight - el.height);
      } else if (resizeState.handle === 'bl') {
        el.x = resizeState.initialX + (resizeState.initialWidth - el.width);
      }
      
      newLines[selectedElementIndex] = el;
      
      // Temporarily update state for fast local rendering without hitting the undo stack yet
      const newHistory = [...history];
      newHistory[historyStep] = newLines;
      setHistory(newHistory);
      
      if (socket && roomId) {
        socket.emit('draw-progress', { roomId, element: el });
      }
      return;
    }

    if (draggingElementIndex !== null) {
      // Calculate new position
      const newLines = [...currentLines];
      const el = { ...newLines[draggingElementIndex] };
      
      const dx = point[0] - dragOffset.x;
      const dy = point[1] - dragOffset.y;

      if (el.type === 'text' || el.type === 'sticky' || el.type === 'image') {
        el.x = dx;
        el.y = dy;
      } else if (el.type === 'shape') {
        const shapeDx = dx - el.start[0];
        const shapeDy = dy - el.start[1];
        el.start = [dx, dy];
        el.end = [el.end[0] + shapeDx, el.end[1] + shapeDy];
      } else if (el.type === 'freehand') {
        const fDx = dx - el.points[0][0];
        const fDy = dy - el.points[0][1];
        el.points = el.points.map(p => [p[0] + fDx, p[1] + fDy, p[2]]);
      }

      newLines[draggingElementIndex] = el;
      
      // Temporarily update state for fast local rendering without hitting the undo stack yet
      const newHistory = [...history];
      newHistory[historyStep] = newLines;
      setHistory(newHistory);

      if (socket && roomId) {
        socket.emit('update-elements', { roomId, elements: newLines });
      }
      return;
    }

    setLocalPointer(point);
    if (socket && roomId) {
      socket.emit('cursor-move', { roomId, pointer: point, username, color: identityColor });
    }

    if (e.buttons !== 1 || isPanning) return;

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
    try { e.target.releasePointerCapture(e.pointerId); } catch(err){}
    
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (resizeState !== null) {
      updateHistory(currentLines, true);
      setResizeState(null);
      return;
    }
    
    if (draggingElementIndex !== null) {
      // Releasing drag creates a new history step to allow undoing the drag
      const newHistory = history.slice(0, historyStep);
      newHistory.push(currentLines);
      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
      
      setDraggingElementIndex(null);
      e.target.releasePointerCapture(e.pointerId);
      return;
    }
    
    if (!currentElement) return;
    
    if (socket && roomId) {
      socket.emit('draw-end', { roomId });
      socket.emit('add-element', { roomId, element: currentElement });
    }
    
    updateHistory([...currentLines, currentElement], false);
    setCurrentElement(null);
  };
  
  const finalizeEditingElement = () => {
    if (editingElement && editingElement.text.trim()) {
      const finalElement = { ...editingElement, width: 250, height: 250 }; 
      updateHistory([...currentLines, finalElement], false);
      if (socket && roomId) {
        socket.emit('add-element', { roomId, element: finalElement });
      }
    }
    setEditingElement(null);
  };

  const allElements = [
    ...currentLines, 
    ...(currentElement ? [currentElement] : []),
    ...Object.values(remoteElements)
  ];

  return (
    <div 
      className="absolute inset-0 w-full h-full overflow-hidden touch-none" 
      style={{ cursor: isPanning || isSpaceDown || activeTool === 'hand' ? 'grab' : (activeTool === 'text' || activeTool === 'sticky' ? 'text' : 'none') }}
    >
      <svg 
        ref={svgRef}
        className="w-full h-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => { setLocalPointer(null); setIsPanning(false); }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={color} />
          </marker>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
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

              if (tool === 'rectangle') return <rect key={i} x={minX} y={minY} width={width} height={height} fill="none" stroke={color} strokeWidth={strokeWidth} rx={8} />;
              if (tool === 'circle') return <ellipse key={i} cx={minX + width/2} cy={minY + height/2} rx={width/2} ry={height/2} fill="none" stroke={color} strokeWidth={strokeWidth} />;
              if (tool === 'line') return <line key={i} x1={start[0]} y1={start[1]} x2={end[0]} y2={end[1]} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />;
              if (tool === 'arrow') return <line key={i} x1={start[0]} y1={start[1]} x2={end[0]} y2={end[1]} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" markerEnd="url(#arrowhead)" />;
            } else if (el.type === 'text') {
              return (
                <foreignObject key={i} x={el.x} y={el.y} width={el.width || 150} height={el.height || 40} style={{ pointerEvents: 'none' }}>
                  <div 
                    className="w-full h-full select-none cursor-none overflow-hidden" 
                    style={{ 
                      color: el.color, 
                      fontSize: `${el.fontSize || 24}px`, 
                      fontFamily: el.fontFamily || "Inter, sans-serif",
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word',
                      lineHeight: '1.2'
                    }}
                  >
                    {el.text}
                  </div>
                </foreignObject>
              );
            } else if (el.type === 'sticky') {
              return (
                <foreignObject key={i} x={el.x} y={el.y} width="250" height="250" className="group" style={{ pointerEvents: 'none' }}>
                  <div 
                    className="w-full h-full p-5 shadow-lg rounded-sm rounded-br-3xl text-slate-800 leading-relaxed break-words overflow-hidden border border-black/10 transition-all duration-200 group-hover:shadow-2xl relative select-none cursor-none" 
                    style={{ 
                      backgroundColor: el.color === '#000000' || el.color === '#FFFFFF' ? '#FEF08A' : el.color,
                      backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)',
                      fontSize: `${el.fontSize || 24}px`,
                      fontFamily: el.fontFamily || "Inter, sans-serif"
                    }}
                  >
                    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                      <div className="absolute bottom-0 right-0 w-8 h-8 bg-black/5 rounded-tl-3xl"></div>
                    </div>
                    {el.text}
                    
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteElement(i); }}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="absolute top-2 right-2 p-1.5 bg-red-500/50 hover:bg-red-500 text-white rounded-full transition-opacity duration-200 z-50 cursor-pointer shadow-sm pointer-events-auto"
                      title="Delete Note"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                </foreignObject>
              );
            } else if (el.type === 'image') {
              return <image key={i} href={el.dataUrl} x={el.x} y={el.y} width={el.width} height={el.height} />;
            }
            return null;
          })}

          {/* Render Selection Bounding Box & Handles */}
          {selectedElementIndex !== null && currentLines[selectedElementIndex] && (currentLines[selectedElementIndex].type === 'text' || currentLines[selectedElementIndex].type === 'sticky') && (() => {
            const el = currentLines[selectedElementIndex];
            const w = el.width || (el.type === 'sticky' ? 250 : 150);
            const h = el.height || (el.type === 'sticky' ? 250 : 40);
            return (
              <g pointerEvents="none">
                <rect x={el.x} y={el.y} width={w} height={h} fill="none" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4" />
                <circle cx={el.x} cy={el.y} r="6" fill="white" stroke="#3B82F6" strokeWidth="2" />
                <circle cx={el.x + w} cy={el.y} r="6" fill="white" stroke="#3B82F6" strokeWidth="2" />
                <circle cx={el.x} cy={el.y + h} r="6" fill="white" stroke="#3B82F6" strokeWidth="2" />
                <circle cx={el.x + w} cy={el.y + h} r="6" fill="white" stroke="#3B82F6" strokeWidth="2" />
              </g>
            );
          })()}
          
          {/* Editing overlay moved OUTSIDE SVG to fix interaction bugs */}


          {/* Remote Cursors */}
          {Object.entries(remoteCursors).map(([id, cursor]) => (
            <g 
              key={id} 
              transform={`translate(${cursor.pointer[0]}, ${cursor.pointer[1]}) scale(${1/zoom})`} 
              className="transition-transform duration-75 ease-out pointer-events-none"
            >
              <path d="M0,0 L20,10 L10,13 L6,22 Z" fill={cursor.color} stroke="white" strokeWidth="2" />
              <foreignObject x="10" y="20" width="150" height="40">
                <div className="inline-block px-2 py-1 rounded-md text-white text-xs font-bold shadow-md whitespace-nowrap" style={{ backgroundColor: cursor.color }}>
                  {cursor.username}
                </div>
              </foreignObject>
            </g>
          ))}
        </g>
      </svg>
      
      {/* Active Editing Overlay (OUTSIDE SVG to guarantee normal HTML interaction) */}
      {editingElement && (
        <div 
          id="editing-overlay"
          className="absolute top-0 left-0 z-40 origin-top-left"
          style={{ 
            transform: `translate(${pan.x + editingElement.x * zoom}px, ${pan.y + editingElement.y * zoom}px) scale(${zoom})`,
            width: `${editingElement.width || (editingElement.type === 'sticky' ? 250 : 150)}px`,
            height: `${editingElement.height || (editingElement.type === 'sticky' ? 250 : 40)}px`
          }}
          onPointerDown={(e) => e.stopPropagation()} // Stop bubbling to SVG container
        >
          {editingElement.type === 'text' ? (
            <textarea
              autoFocus
              className="w-full h-full bg-transparent border-2 border-primary border-dashed focus:outline-none resize-none overflow-hidden"
              style={{ 
                color: editingElement.color, 
                fontSize: `${editingElement.fontSize || 24}px`, 
                fontFamily: editingElement.fontFamily || 'Inter, sans-serif'
              }}
              value={editingElement.text}
              onChange={(e) => {
                const target = e.target;
                setEditingElement({ 
                  ...editingElement, 
                  text: target.value,
                  width: Math.max(editingElement.width || 150, target.scrollWidth),
                  height: Math.max(editingElement.height || 40, target.scrollHeight)
                });
              }}
              onKeyDown={(e) => { if(e.key === 'Escape') { finalizeEditingElement(); } }}
              placeholder="Enter text..."
            />
          ) : (
            <div 
              className="w-[250px] h-[250px] p-5 shadow-2xl rounded-sm rounded-br-3xl border-2 border-primary relative" 
              style={{ 
                backgroundColor: editingElement.color === '#000000' || editingElement.color === '#FFFFFF' ? '#FEF08A' : editingElement.color,
                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)',
                fontSize: `${editingElement.fontSize || 24}px`, 
                fontFamily: editingElement.fontFamily || 'Inter, sans-serif'
              }}
            >
              <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-black/5 rounded-tl-3xl"></div>
              </div>
              <textarea
                autoFocus
                className="w-full h-full bg-transparent border-none outline-none resize-none text-slate-800 leading-relaxed relative z-10"
                value={editingElement.text}
                onChange={(e) => setEditingElement({ ...editingElement, text: e.target.value })}
                onKeyDown={(e) => { if(e.key === 'Escape') { finalizeEditingElement(); } }}
                placeholder="Type a note..."
              />
            </div>
          )}
        </div>
      )}
      
      {/* Local Cursor Overlay (Outside SVG Transform so it doesn't scale weirdly) */}
      {localPointer && !isPanning && activeTool !== 'hand' && activeTool !== 'text' && activeTool !== 'sticky' && (
        <div 
          className="absolute top-0 left-0 pointer-events-none z-50"
          style={{ transform: `translate(${localPointer[0]}px, ${localPointer[1]}px)` }}
        >
          <svg width="150" height="60" className="overflow-visible">
            <path d="M0,0 L20,10 L10,13 L6,22 Z" fill={identityColor} stroke="white" strokeWidth="2" />
            <foreignObject x="10" y="20" width="150" height="40">
              <div className="inline-block px-2 py-1 rounded-md text-white text-xs font-bold shadow-md whitespace-nowrap" style={{ backgroundColor: identityColor }}>
                {username} (You)
              </div>
            </foreignObject>
          </svg>
        </div>
      )}
    </div>
  );
});

export default Canvas;
