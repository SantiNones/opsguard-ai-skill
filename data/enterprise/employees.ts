/**
 * Fictitious Enterprise Employee Data
 * 
 * Spanish/European mock employees for enterprise context simulation.
 * No real personal data. Used for access control and permissioning demos.
 */

export type EmployeeRole = 'employee' | 'manager' | 'hr_ops' | 'payroll_admin';

export interface Employee {
  employeeId: string;
  name: string;
  email: string;
  role: EmployeeRole;
  department: string;
  country: string;
  managerId: string | null;
  employmentType: 'full-time' | 'part-time' | 'contract';
  startDate: string; // ISO date
  payrollRegion: 'ES' | 'EU' | 'GLOBAL';
  isActive: boolean;
}

/**
 * Mock employee dataset - 8 fictitious Spanish/European employees
 */
export const employees: Employee[] = [
  // Normal Employees
  {
    employeeId: 'EMP-001',
    name: 'Ana García López',
    email: 'ana.garcia@company.es',
    role: 'employee',
    department: 'Engineering',
    country: 'Spain',
    managerId: 'EMP-003',
    employmentType: 'full-time',
    startDate: '2022-03-15',
    payrollRegion: 'ES',
    isActive: true,
  },
  {
    employeeId: 'EMP-002',
    name: 'Carlos Ruiz Hernández',
    email: 'carlos.ruiz@company.es',
    role: 'employee',
    department: 'Engineering',
    country: 'Spain',
    managerId: 'EMP-003',
    employmentType: 'full-time',
    startDate: '2021-07-01',
    payrollRegion: 'ES',
    isActive: true,
  },
  // Manager
  {
    employeeId: 'EMP-003',
    name: 'Laura Martín Sánchez',
    email: 'laura.martin@company.es',
    role: 'manager',
    department: 'Engineering',
    country: 'Spain',
    managerId: 'EMP-005',
    employmentType: 'full-time',
    startDate: '2019-11-20',
    payrollRegion: 'ES',
    isActive: true,
  },
  // Another Employee
  {
    employeeId: 'EMP-004',
    name: 'Elena Fernández Costa',
    email: 'elena.fernandez@company.es',
    role: 'employee',
    department: 'Marketing',
    country: 'Portugal',
    managerId: 'EMP-005',
    employmentType: 'part-time',
    startDate: '2023-01-10',
    payrollRegion: 'EU',
    isActive: true,
  },
  // Another Manager
  {
    employeeId: 'EMP-005',
    name: 'Miguel Torres Vega',
    email: 'miguel.torres@company.es',
    role: 'manager',
    department: 'Operations',
    country: 'Spain',
    managerId: null,
    employmentType: 'full-time',
    startDate: '2018-05-15',
    payrollRegion: 'ES',
    isActive: true,
  },
  // HR Ops
  {
    employeeId: 'EMP-006',
    name: 'Marta Ruiz Delgado',
    email: 'marta.ruiz@company.es',
    role: 'hr_ops',
    department: 'Human Resources',
    country: 'Spain',
    managerId: 'EMP-005',
    employmentType: 'full-time',
    startDate: '2020-09-01',
    payrollRegion: 'ES',
    isActive: true,
  },
  // Payroll Admin
  {
    employeeId: 'EMP-007',
    name: 'Diego Costa Blanco',
    email: 'diego.costa@company.es',
    role: 'payroll_admin',
    department: 'Finance',
    country: 'Spain',
    managerId: 'EMP-005',
    employmentType: 'full-time',
    startDate: '2019-02-01',
    payrollRegion: 'ES',
    isActive: true,
  },
  // Remote Employee
  {
    employeeId: 'EMP-008',
    name: 'Sofia Andersen',
    email: 'sofia.andersen@company.eu',
    role: 'employee',
    department: 'Engineering',
    country: 'Denmark',
    managerId: 'EMP-003',
    employmentType: 'full-time',
    startDate: '2023-06-15',
    payrollRegion: 'EU',
    isActive: true,
  },
];

/**
 * Get employee by ID
 */
export function getEmployeeById(employeeId: string): Employee | undefined {
  return employees.find(e => e.employeeId === employeeId);
}

/**
 * Get direct reports for a manager
 */
export function getDirectReports(managerId: string): Employee[] {
  return employees.filter(e => e.managerId === managerId);
}

/**
 * Get all employees with a specific role
 */
export function getEmployeesByRole(role: EmployeeRole): Employee[] {
  return employees.filter(e => e.role === role);
}

/**
 * Find employee by name (fuzzy match for request parsing)
 */
export function findEmployeeByName(nameQuery: string): Employee | undefined {
  const normalized = nameQuery.toLowerCase().trim();
  return employees.find(e => 
    e.name.toLowerCase().includes(normalized) ||
    e.email.toLowerCase().includes(normalized)
  );
}
