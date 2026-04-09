import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { phaserConfig } from './config';
import { BootScene } from './scenes/BootScene';
import { OfficeScene } from './scenes/OfficeScene';

interface PhaserGameProps {
  onGameReady?: (game: Phaser.Game) => void;
}

export function PhaserGame({ onGameReady }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const game = new Phaser.Game({
      ...phaserConfig,
      parent: containerRef.current,
      scene: [BootScene, OfficeScene],
    });

    gameRef.current = game;
    onGameReady?.(game);

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="phaser-container"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    />
  );
}
