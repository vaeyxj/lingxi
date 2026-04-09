import { useEmployees, useSelectedEmployeeId } from '../hooks/useGameStore';
import { useGameStore } from '../../shared/store/gameStore';
import eventBus from '../../shared/EventBus';
import type { EmployeeActivity } from '../../shared/store/types';

const ACTIVITY_LABELS: Record<EmployeeActivity, string> = {
  arriving: '到达中',
  working: '工作中',
  meeting: '开会中',
  coffee_break: '喝咖啡',
  lunch: '午餐中',
  idle: '空闲',
  walking: '移动中',
  departing: '离开中',
  gone: '已离开',
};

const ACTIVITY_COLORS: Record<EmployeeActivity, string> = {
  arriving: '#7bc67e',
  working: '#4a9aea',
  meeting: '#eaaa4a',
  coffee_break: '#c4a35a',
  lunch: '#d4956a',
  idle: '#888888',
  walking: '#aa6aea',
  departing: '#ea6a8a',
  gone: '#555555',
};

const ROLE_LABELS: Record<string, string> = {
  engineer: '工程师',
  designer: '设计师',
  pm: '产品经理',
  manager: '经理',
  intern: '实习生',
};

export function EmployeeListPanel() {
  const employees = useEmployees();
  const selectedId = useSelectedEmployeeId();
  const employeeList = Object.values(employees);

  const handleClick = (id: string) => {
    useGameStore.getState().selectEmployee(id);
    eventBus.emit('employee:clicked', id);
    eventBus.emit('camera:follow', id);
  };

  return (
    <div className="panel employee-list-panel">
      <div className="panel-header">员工列表</div>
      <div className="panel-body">
        {employeeList.map((emp) => (
          <div
            key={emp.id}
            className={`employee-item ${selectedId === emp.id ? 'selected' : ''}`}
            onClick={() => handleClick(emp.id)}
          >
            <div className="employee-item-left">
              <div className="employee-name">{emp.name}</div>
              <div className="employee-role">{ROLE_LABELS[emp.role] ?? emp.role}</div>
            </div>
            <div className="employee-item-right">
              <span
                className="activity-badge"
                style={{ backgroundColor: ACTIVITY_COLORS[emp.activity] }}
              >
                {ACTIVITY_LABELS[emp.activity]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
