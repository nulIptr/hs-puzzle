
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameBoard } from './components/GameBoard';
import { LeaderboardPage } from './components/LeaderboardPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GameBoard />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        {/* 兜底: 未知路径回主页 */}
        <Route path="*" element={<GameBoard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
