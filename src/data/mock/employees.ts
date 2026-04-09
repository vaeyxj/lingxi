import type { EmployeeRole } from '../../shared/store/types';

export interface EmployeeData {
  id: string;
  name: string;
  role: EmployeeRole;
  avatar: string;
  deskId: string;
}

export const mockEmployees: EmployeeData[] = [
  { id: 'emp-01', name: '张三', role: 'engineer', avatar: 'engineer', deskId: 'desk-01' },
  { id: 'emp-02', name: '李四', role: 'designer', avatar: 'designer', deskId: 'desk-02' },
  { id: 'emp-03', name: '王五', role: 'pm', avatar: 'pm', deskId: 'desk-03' },
  { id: 'emp-04', name: '赵六', role: 'engineer', avatar: 'engineer', deskId: 'desk-04' },
  { id: 'emp-05', name: '钱七', role: 'manager', avatar: 'manager', deskId: 'desk-05' },
  { id: 'emp-06', name: '孙八', role: 'intern', avatar: 'intern', deskId: 'desk-06' },
  { id: 'emp-07', name: '周九', role: 'engineer', avatar: 'engineer', deskId: 'desk-07' },
  { id: 'emp-08', name: '吴十', role: 'designer', avatar: 'designer', deskId: 'desk-08' },
];
