import { PhaserGame } from './game/PhaserGame';
import { TopBar } from './ui/components/TopBar';
import { EmployeeListPanel } from './ui/components/EmployeeListPanel';
import { EmployeeDetail } from './ui/components/EmployeeDetail';
import { ActivityLog } from './ui/components/ActivityLog';
import './ui/styles/global.css';
import './ui/styles/panels.css';

function App() {
  return (
    <div className="app-container">
      <PhaserGame />
      <div className="ui-overlay">
        <TopBar />
        <div className="main-area">
          <div className="sidebar-left">
            <EmployeeListPanel />
          </div>
          <div className="center-spacer" />
          <div className="sidebar-right">
            <EmployeeDetail />
            <ActivityLog />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
