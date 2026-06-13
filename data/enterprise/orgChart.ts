/**
 * Organization Chart Data
 * 
 * Manager-direct report relationships for enterprise context.
 */

import { employees } from './employees';

export interface OrgRelationship {
  employeeId: string;
  managerId: string | null;
  directReports: string[]; // Employee IDs
  level: number; // 0 = CEO/top, 1 = direct reports, etc.
}

/**
 * Build org relationships from employee data
 */
export function buildOrgChart(): Map<string, OrgRelationship> {
  const chart = new Map<string, OrgRelationship>();
  
  // Initialize all employees
  for (const emp of employees) {
    chart.set(emp.employeeId, {
      employeeId: emp.employeeId,
      managerId: emp.managerId,
      directReports: [],
      level: 0,
    });
  }
  
  // Build direct reports
  for (const emp of employees) {
    if (emp.managerId) {
      const manager = chart.get(emp.managerId);
      if (manager) {
        manager.directReports.push(emp.employeeId);
      }
    }
  }
  
  // Calculate levels (simple BFS from top)
  let currentLevel = 0;
  let currentLevelEmployees = employees.filter(e => e.managerId === null);
  
  while (currentLevelEmployees.length > 0) {
    for (const emp of currentLevelEmployees) {
      const rel = chart.get(emp.employeeId);
      if (rel) {
        rel.level = currentLevel;
      }
    }
    
    // Next level = direct reports of current level
    const nextLevelIds = currentLevelEmployees.flatMap(e => {
      const rel = chart.get(e.employeeId);
      return rel?.directReports || [];
    });
    
    currentLevelEmployees = employees.filter(e => nextLevelIds.includes(e.employeeId));
    currentLevel++;
  }
  
  return chart;
}

/**
 * Get org relationship for an employee
 */
export function getOrgRelationship(employeeId: string): OrgRelationship | undefined {
  const chart = buildOrgChart();
  return chart.get(employeeId);
}

/**
 * Check if employee A manages employee B (directly or indirectly)
 */
export function isInManagementChain(managerId: string, employeeId: string): boolean {
  const chart = buildOrgChart();
  let current: OrgRelationship | undefined = chart.get(employeeId);
  
  while (current && current.managerId) {
    if (current.managerId === managerId) {
      return true;
    }
    current = chart.get(current.managerId);
  }
  
  return false;
}

/**
 * Get all reports in a manager's org (direct + indirect)
 */
export function getAllReportsInOrg(managerId: string): string[] {
  const chart = buildOrgChart();
  const manager = chart.get(managerId);
  if (!manager) return [];
  
  const allReports: string[] = [];
  const toProcess = [...manager.directReports];
  
  while (toProcess.length > 0) {
    const empId = toProcess.shift()!;
    allReports.push(empId);
    
    const emp = chart.get(empId);
    if (emp && emp.directReports.length > 0) {
      toProcess.push(...emp.directReports);
    }
  }
  
  return allReports;
}

/**
 * Get management chain for an employee (from their manager up)
 */
export function getManagementChain(employeeId: string): string[] {
  const chain: string[] = [];
  const chart = buildOrgChart();
  let current = chart.get(employeeId);
  
  while (current && current.managerId) {
    chain.push(current.managerId);
    current = chart.get(current.managerId);
  }
  
  return chain;
}

/**
 * Check if two employees are peers (same manager)
 */
export function arePeers(employeeIdA: string, employeeIdB: string): boolean {
  const chart = buildOrgChart();
  const empA = chart.get(employeeIdA);
  const empB = chart.get(employeeIdB);
  
  if (!empA || !empB) return false;
  
  return empA.managerId === empB.managerId && empA.managerId !== null;
}
