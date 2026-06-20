/**
 * Role Configuration for the demo workspace experience.
 *
 * Maps each landing role to:
 *  - a default enterprise persona (actorId from data/enterprise/employees)
 *  - the navigation views that role can access
 *  - the default response view (employee vs HR review)
 *
 * This is demo-only state — there is no real auth. It drives which
 * workspace surfaces a role "enters" after selecting a role card.
 */

import { EmployeeRole } from '@/data/enterprise/employees';

export type NavView =
  | 'console'
  | 'review'
  | 'knowledge'
  | 'analytics'
  | 'settings';

export type ResponseView = 'employee' | 'hr';

export interface RoleDefinition {
  role: EmployeeRole;
  title: string;
  shortLabel: string;
  description: string;
  defaultPersona: string; // actorId
  views: NavView[];
  defaultView: NavView;
  defaultResponseView: ResponseView;
}

export const NAV_LABELS: Record<NavView, string> = {
  console: 'Request Console',
  review: 'Review Queue',
  knowledge: 'Policy Library',
  analytics: 'Analytics',
  settings: 'Settings',
};

export const roleDefinitions: Record<EmployeeRole, RoleDefinition> = {
  employee: {
    role: 'employee',
    title: 'Employee',
    shortLabel: 'Employee',
    description: 'Ask questions and get guidance on HR policies and processes.',
    defaultPersona: 'EMP-001', // Ana García López
    views: ['console', 'knowledge'],
    defaultView: 'console',
    defaultResponseView: 'employee',
  },
  manager: {
    role: 'manager',
    title: 'Manager',
    shortLabel: 'Manager',
    description: 'Support your team and handle requests that require your review.',
    defaultPersona: 'EMP-003', // Laura Martín Sánchez
    views: ['console', 'review', 'knowledge'],
    defaultView: 'console',
    defaultResponseView: 'hr',
  },
  hr_ops: {
    role: 'hr_ops',
    title: 'HR Operations',
    shortLabel: 'HR Ops',
    description: 'Review and resolve cases that require human attention.',
    defaultPersona: 'EMP-006', // Marta Ruiz Delgado
    views: ['console', 'review', 'knowledge', 'analytics', 'settings'],
    defaultView: 'console',
    defaultResponseView: 'hr',
  },
  payroll_admin: {
    role: 'payroll_admin',
    title: 'Payroll Admin',
    shortLabel: 'Payroll Admin',
    description: 'Manage payroll-related requests and employee data securely.',
    defaultPersona: 'EMP-007', // Diego Costa Blanco
    views: ['console', 'review', 'analytics'],
    defaultView: 'console',
    defaultResponseView: 'hr',
  },
};

export const roleOrder: EmployeeRole[] = ['employee', 'manager', 'hr_ops', 'payroll_admin'];

export function canAccessView(role: EmployeeRole, view: NavView): boolean {
  return roleDefinitions[role].views.includes(view);
}
