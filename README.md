# DoodleBoard 🎨

DoodleBoard is a modern, real-time collaborative whiteboard application built for brainstorming, sketching, and remote teamwork. Think of it as a blend of FigJam, Miro, and Excalidraw, designed with a premium, glassmorphic UI.

## Features

- **Real-Time Multiplayer**: Work together with teammates instantly. Live cursors track where everyone is looking, and all drawing and object placement is synced in real-time across all connected clients.
- **Infinite Canvas Engine**: Pan (Spacebar or Hand Tool) and zoom your way across an infinite workspace.
- **Advanced Drawing Tools**: Powered by `perfect-freehand`, the pencil, brush, and highlighter tools generate smooth, variable-width, pressure-sensitive strokes that feel natural.
- **Rich Media Elements**:
  - **Sticky Notes**: Drop beautiful, paper-like sticky notes onto the canvas. Customize their color and typography (font size and style).
  - **Text Boxes**: Insert floating text anywhere.
  - **Image Uploads**: Drop local images directly onto the canvas for moodboarding.
- **Smart Object Manipulation**: The Selection Tool allows you to click, drag, and drop any media element (Text, Sticky Note, Image, or Shape) seamlessly.
- **Precision Eraser**: A bounding-box intersection eraser allows you to delete exact strokes, shapes, and media elements with a single click or drag.
- **Undo / Redo History**: Safely undo mistakes or redo actions with a robust state history stack.
- **Customizable Styling**: Adjust stroke widths for drawing tools, or swap to Font Size (S, M, L, XL) and Font Style (Sans, Serif, Cursive) when typing.

## Technologies Used

### Frontend
- **React (Vite)**: The core UI library for building the interface, chosen for its fast rendering and modularity.
- **Tailwind CSS**: Used extensively for the modern, premium aesthetic, including the glassmorphic `glass` utility classes and responsive layouts.
- **Lucide-React**: Clean, consistent SVG iconography.
- **Perfect-Freehand**: A sophisticated algorithm that converts pointer input points into buttery-smooth SVG paths, mimicking real-world pressure sensitivity.

### Backend
- **Node.js & Express**: A lightweight server to handle room generation and API routing.
- **Socket.io**: The backbone of the real-time collaboration. It manages WebSocket connections, rooms, and broadcasts cursor positions and canvas state updates to all peers with extremely low latency.

## Architecture & Implementation Highlights

### The Canvas Engine (`Canvas.jsx`)
The whiteboard does not use an HTML `<canvas>` tag. Instead, it is a highly-optimized React-driven `<svg>` engine.
- **Rendering**: Every stroke, shape, and text box is stored as a JavaScript object in state. React maps over this state array to render pure SVG elements (`<path>`, `<rect>`, `<text>`). This allows infinite scaling (zooming) without any pixelation or loss of quality.
- **ForeignObjects**: For complex HTML elements like the Sticky Notes, the app uses SVG `<foreignObject>` tags. This allows us to embed fully functional HTML (like `div`s with Tailwind shadows and gradients) directly inside the scalable SVG coordinate system.
- **Coordinates & Panning**: A custom `getPointerPosition` function translates native screen coordinates (`e.clientX`) into the virtual canvas coordinate space, taking into account the current `pan` offset and `zoom` level.

### Drag & Drop
To make text and sticky notes draggable without interfering with SVG mechanics:
1. When the **Selection Tool** is active, a `pointerdown` event loops backwards through the rendered objects to find the top-most intersecting bounding box.
2. The browser's native text-highlighting (I-beam cursor) is explicitly disabled via CSS (`user-select: none`) on finalized elements so that the mouse click can safely capture the element (`setPointerCapture`).
3. As the mouse moves, the object's local `x` and `y` coordinates are updated in the state array, re-rendering it in real-time.

### Real-time Sync
- When a user draws a stroke or moves a sticky note, the frontend updates locally instantly for zero-latency feedback.
- Simultaneously, it emits a `draw-progress` event via `Socket.io` containing the object's data.
- The server broadcasts this to everyone else in the room, placing it in a `remoteElements` state on their end, ensuring everyone stays perfectly in sync.

## Getting Started

1. **Install Dependencies**:
   Navigate to both the `/client` and `/server` directories and run:
   ```bash
   npm install
   ```
2. **Start the Server**:
   ```bash
   cd server
   npm run dev
   ```
3. **Start the Client**:
   ```bash
   cd client
   npm run dev
   ```
4. Open the application in your browser and create a room!
