import type { EmployeeData } from '../mock/employees';
import { mockEmployees } from '../mock/employees';

export interface IEmployeeService {
  getAll(): Promise<EmployeeData[]>;
  getById(id: string): Promise<EmployeeData | undefined>;
}

class MockEmployeeService implements IEmployeeService {
  async getAll(): Promise<EmployeeData[]> {
    return mockEmployees;
  }

  async getById(id: string): Promise<EmployeeData | undefined> {
    return mockEmployees.find((e) => e.id === id);
  }
}

export const employeeService: IEmployeeService = new MockEmployeeService();
