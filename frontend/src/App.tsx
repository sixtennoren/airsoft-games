import { BrowserRouter, Routes, Route } from "react-router-dom";
import Player from './pages/Player';
import Bomb from "./pages/Bomb";
import NotFound from "./pages/NotFound";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Player />} />
        <Route path="bomb" element={<Bomb />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
