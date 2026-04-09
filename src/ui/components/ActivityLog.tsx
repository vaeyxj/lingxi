import { useActivityLog, formatTime } from '../hooks/useGameStore';

export function ActivityLog() {
  const log = useActivityLog();

  return (
    <div className="panel log-panel">
      <div className="panel-header">活动日志</div>
      <div className="panel-body log-body">
        {log.length === 0 ? (
          <div className="empty-state">暂无活动</div>
        ) : (
          log.map((entry) => (
            <div key={entry.id} className="log-entry">
              <span className="log-time">{formatTime(entry.timestamp)}</span>
              <span className="log-name">{entry.employeeName}</span>
              <span className="log-message">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
