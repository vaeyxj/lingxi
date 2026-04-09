import { useGameStore } from '../../shared/store/gameStore';

const ZONE_LABELS: Record<string, string> = {
  desk_area: '工位区',
  meeting_room: '会议室',
  coffee_area: '咖啡角',
  reception: '前台',
  lunch_area: '餐厅',
  supermarket: '超市',
  restroom: '卫生间',
  gym: '健身房',
  phone_booth: '电话房',
};

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

interface TopBarProps {
  leftOpen: boolean;
  rightOpen: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onHideAll: () => void;
}

export function TopBar({ leftOpen, rightOpen, onToggleLeft, onToggleRight, onHideAll }: TopBarProps) {
  const now = new Date();
  const dateStr = `${now.getMonth() + 1}月${now.getDate()}日 ${WEEKDAYS[now.getDay()]}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const playerZone = useGameStore((s) => s.playerZone);

  return (
    <div className="top-bar">
      <div className="top-bar-section">
        <span className="logo">灵栖世界</span>
        {playerZone && (
          <span className="player-zone-badge">
            {ZONE_LABELS[playerZone] ?? playerZone}
          </span>
        )}
      </div>

      <div className="top-bar-section">
        <span className="day-label">{dateStr}</span>
        <span className="time-display">{timeStr}</span>
      </div>

      <div className="top-bar-section top-bar-actions">
        <button
          className={`hud-btn ${leftOpen ? 'active' : ''}`}
          onClick={onToggleLeft}
        >
          员工
        </button>
        <button
          className={`hud-btn ${rightOpen ? 'active' : ''}`}
          onClick={onToggleRight}
        >
          详情
        </button>
        <span className="top-bar-divider" />
        <button className="hud-btn hud-btn-hide" onClick={onHideAll}>
          沉浸
        </button>
      </div>
    </div>
  );
}
