import { useState, useCallback, useEffect } from 'react';
import { LandingPage } from './ui/components/LandingPage';
import { PhaserGame } from './game/PhaserGame';
import { TopBar } from './ui/components/TopBar';
import { EmployeeListPanel } from './ui/components/EmployeeListPanel';
import { EmployeeDetail } from './ui/components/EmployeeDetail';
import { ActivityLog } from './ui/components/ActivityLog';
import './ui/styles/global.css';
import './ui/styles/landing.css';
import './ui/styles/panels.css';

function App() {
  const [entered, setEntered] = useState(false);
  const [gameReady, setGameReady] = useState(false);

  if (!entered) {
    return <LandingPage onEnter={() => setEntered(true)} />;
  }

  return <GameView onReady={() => setGameReady(true)} ready={gameReady} />;
}

function GameView({ onReady, ready }: { onReady: () => void; ready: boolean }) {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [hudVisible, setHudVisible] = useState(true);

  const toggleLeft = useCallback(() => setLeftOpen((v) => !v), []);
  const toggleRight = useCallback(() => setRightOpen((v) => !v), []);
  const hideAll = useCallback(() => {
    setHudVisible(false);
    setLeftOpen(false);
    setRightOpen(false);
  }, []);
  const showHud = useCallback(() => setHudVisible(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'h' || e.key === 'H') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        setHudVisible((v) => {
          if (!v) return true;
          setLeftOpen(false);
          setRightOpen(false);
          return false;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="app-container">
      <PhaserGame onGameReady={() => onReady()} />

      {/* Loading overlay */}
      {!ready && (
        <div className="game-loading">
          <div className="game-loading-text">加载世界中...</div>
        </div>
      )}

      <div className={`hud ${hudVisible ? 'hud-visible' : 'hud-hidden'}`}>
        <TopBar
          leftOpen={leftOpen}
          rightOpen={rightOpen}
          onToggleLeft={toggleLeft}
          onToggleRight={toggleRight}
          onHideAll={hideAll}
        />
      </div>

      <div className={`slide-panel slide-left ${leftOpen ? 'open' : ''}`}>
        <EmployeeListPanel />
      </div>

      <div className={`slide-panel slide-right ${rightOpen ? 'open' : ''}`}>
        <EmployeeDetail />
        <ActivityLog />
      </div>

      {!hudVisible && (
        <div className="immersion-hint" onClick={showHud}>
          <div className="immersion-hint-bar" />
          <span className="immersion-hint-text">点击此处或按 H 键显示菜单</span>
        </div>
      )}
    </div>
  );
}

export default App;
