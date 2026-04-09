import { useGameStore } from '../../shared/store/gameStore';
import { useCurrentTime, useTimeSpeed, useIsPaused, formatTime } from '../hooks/useGameStore';
import type { TimeSpeed } from '../../shared/store/types';

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const ZONE_LABELS: Record<string, string> = {
  desk_area: '工位区',
  meeting_room: '会议室',
  coffee_area: '咖啡角',
  reception: '前台',
  lunch_area: '餐厅',
};

export function TopBar() {
  const currentTime = useCurrentTime();
  const timeSpeed = useTimeSpeed();
  const now = new Date();
  const dateStr = `${now.getMonth() + 1}月${now.getDate()}日 ${WEEKDAYS[now.getDay()]}`;
  const isPaused = useIsPaused();
  const playerZone = useGameStore((s) => s.playerZone);

  const setSpeed = (speed: TimeSpeed) => useGameStore.getState().setSpeed(speed);
  const togglePause = () => useGameStore.getState().togglePause();

  return (
    <div className="top-bar">
      <div className="top-bar-section">
        <span className="logo">灵犀办公室</span>
        {playerZone && (
          <span className="player-zone-badge">
            {ZONE_LABELS[playerZone] ?? playerZone}
          </span>
        )}
      </div>
      <div className="top-bar-section">
        <span className="day-label">{dateStr}</span>
        <span className="time-display">{formatTime(currentTime)}</span>
      </div>
      <div className="top-bar-section speed-controls">
        <span className="controls-hint">WASD移动 | 滚轮缩放</span>
        <button
          className={`speed-btn ${isPaused ? 'active' : ''}`}
          onClick={togglePause}
          title="暂停"
        >
          ⏸
        </button>
        {([1, 2, 5] as TimeSpeed[]).map((speed) => (
          <button
            key={speed}
            className={`speed-btn ${!isPaused && timeSpeed === speed ? 'active' : ''}`}
            onClick={() => {
              if (isPaused) togglePause();
              setSpeed(speed);
            }}
            title={`${speed}x 速度`}
          >
            {speed}x
          </button>
        ))}
      </div>
    </div>
  );
}
