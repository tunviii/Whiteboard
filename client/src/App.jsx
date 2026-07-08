import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Whiteboard from './pages/Whiteboard'

function App() {
  return (
    <div className="w-full h-full relative">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/room/:roomId" element={<Whiteboard />} />
      </Routes>
    </div>
  )
}

export default App