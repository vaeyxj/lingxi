import { useSelectedEmployee, useSelectedEmployeeId } from '../hooks/useGameStore';
import { useGameStore } from '../../shared/store/gameStore';
import eventBus from '../../shared/EventBus';
import type { EmployeeActivity } from '../../shared/store/types';

const ACTIVITY_LABELS: Record<EmployeeActivity, string> = {
  arriving: '到达中',
  working: '工作中',
  meeting: '开会中',
  coffee_break: '喝咖啡',
  lunch: '午餐中',
  phone_call: '打电话',
  shopping: '购物中',
  restroom: '上卫生间',
  exercising: '健身中',
  idle: '空闲',
  walking: '移动中',
  departing: '离开中',
  gone: '已离开',
};

const ROLE_LABELS: Record<string, string> = {
  engineer: '工程师',
  designer: '设计师',
  pm: '产品经理',
  manager: '经理',
  intern: '实习生',
};

function AttributeBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="attribute-bar">
      <span className="attr-label">{label}</span>
      <div className="attr-track">
        <div
          className="attr-fill"
          style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }}
        />
      </div>
      <span className="attr-value">{Math.round(value)}</span>
    </div>
  );
}

export function EmployeeDetail() {
  const employee = useSelectedEmployee();
  const selectedId = useSelectedEmployeeId();

  if (!employee) {
    return (
      <div className="panel detail-panel">
        <div className="panel-header">员工详情</div>
        <div className="panel-body empty-state">
          <p>点击员工查看详情</p>
        </div>
      </div>
    );
  }

  const sendTo = (zoneType: string) => {
    if (selectedId) {
      eventBus.emit('employee:sendTo', selectedId, zoneType);
    }
  };

  const close = () => {
    useGameStore.getState().selectEmployee(null);
  };

  return (
    <div className="panel detail-panel">
      <div className="panel-header">
        <span>{employee.name}</span>
        <button className="close-btn" onClick={close}>x</button>
      </div>
      <div className="panel-body">
        <div className="detail-section">
          <div className="detail-role">{ROLE_LABELS[employee.role] ?? employee.role}</div>
          <div className="detail-activity">
            状态: {ACTIVITY_LABELS[employee.activity]}
          </div>
        </div>

        <div className="detail-section">
          <div className="section-title">属性</div>
          <AttributeBar label="精力" value={employee.attributes.energy} color="#4aea6a" />
          <AttributeBar label="心情" value={employee.attributes.mood} color="#eaaa4a" />
          <AttributeBar label="效率" value={employee.attributes.productivity} color="#4a9aea" />
        </div>

        <div className="detail-section">
          <div className="section-title">指令</div>
          <div className="action-buttons">
            <button className="action-btn" onClick={() => sendTo('desk_area')}>
              回工位
            </button>
            <button className="action-btn" onClick={() => sendTo('coffee_area')}>
              喝咖啡
            </button>
            <button className="action-btn" onClick={() => sendTo('meeting_room')}>
              去开会
            </button>
            <button className="action-btn" onClick={() => sendTo('lunch_area')}>
              去餐厅
            </button>
            <button className="action-btn" onClick={() => sendTo('phone_booth')}>
              打电话
            </button>
            <button className="action-btn" onClick={() => sendTo('supermarket')}>
              去超市
            </button>
            <button className="action-btn" onClick={() => sendTo('restroom')}>
              卫生间
            </button>
            <button className="action-btn" onClick={() => sendTo('gym')}>
              去健身
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
