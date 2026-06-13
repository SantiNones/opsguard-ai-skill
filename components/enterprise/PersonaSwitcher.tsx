'use client';

import { employees, EmployeeRole } from '@/data/enterprise/employees';

interface PersonaSwitcherProps {
  selectedActorId: string;
  onSelectActor: (actorId: string) => void;
}

const roleLabels: Record<EmployeeRole, string> = {
  employee: 'Employee',
  manager: 'Manager',
  hr_ops: 'HR Ops',
  payroll_admin: 'Payroll Admin',
};

const roleColors: Record<EmployeeRole, string> = {
  employee: 'bg-blue-100 text-blue-800',
  manager: 'bg-purple-100 text-purple-800',
  hr_ops: 'bg-green-100 text-green-800',
  payroll_admin: 'bg-orange-100 text-orange-800',
};

export function PersonaSwitcher({ selectedActorId, onSelectActor }: PersonaSwitcherProps) {
  const selectedEmployee = employees.find(e => e.employeeId === selectedActorId);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Viewing As</h3>
        <span className="text-xs text-gray-500">Enterprise Context Demo</span>
      </div>
      
      <select
        value={selectedActorId}
        onChange={(e) => onSelectActor(e.target.value)}
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {employees.map((employee) => (
          <option key={employee.employeeId} value={employee.employeeId}>
            {employee.name} — {roleLabels[employee.role]}
          </option>
        ))}
      </select>
      
      {selectedEmployee && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleColors[selectedEmployee.role]}`}>
              {roleLabels[selectedEmployee.role]}
            </span>
            <span className="text-xs text-gray-500">
              {selectedEmployee.department} • {selectedEmployee.country}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {selectedEmployee.email}
          </p>
        </div>
      )}
    </div>
  );
}
