/**
 * Fictitious Employee Contract Data
 * 
 * Contract information for enterprise context simulation.
 * No real personal data.
 */

export type ContractType = 'permanent' | 'fixed-term' | 'contractor' | 'internship';

export interface Contract {
  contractId: string;
  employeeId: string;
  contractType: ContractType;
  country: string;
  weeklyHours: number;
  remoteWorkAllowed: boolean;
  maxRemoteDaysPerWeek: number;
  vacationDaysPerYear: number;
  compensationBand: 'A' | 'B' | 'C' | 'D' | 'E'; // Band, not exact salary
  noticePeriodDays: number;
  contractStartDate: string;
  contractEndDate?: string; // For fixed-term
  benefits: string[];
}

/**
 * Mock contract dataset
 */
export const contracts: Contract[] = [
  {
    contractId: 'CNT-001',
    employeeId: 'EMP-001',
    contractType: 'permanent',
    country: 'Spain',
    weeklyHours: 40,
    remoteWorkAllowed: true,
    maxRemoteDaysPerWeek: 3,
    vacationDaysPerYear: 23,
    compensationBand: 'C',
    noticePeriodDays: 30,
    contractStartDate: '2022-03-15',
    benefits: ['health-insurance', 'meal-vouchers', 'transport-allowance'],
  },
  {
    contractId: 'CNT-002',
    employeeId: 'EMP-002',
    contractType: 'permanent',
    country: 'Spain',
    weeklyHours: 40,
    remoteWorkAllowed: true,
    maxRemoteDaysPerWeek: 2,
    vacationDaysPerYear: 25,
    compensationBand: 'D',
    noticePeriodDays: 30,
    contractStartDate: '2021-07-01',
    benefits: ['health-insurance', 'meal-vouchers', 'transport-allowance', 'bonus-plan'],
  },
  {
    contractId: 'CNT-003',
    employeeId: 'EMP-003',
    contractType: 'permanent',
    country: 'Spain',
    weeklyHours: 40,
    remoteWorkAllowed: true,
    maxRemoteDaysPerWeek: 3,
    vacationDaysPerYear: 25,
    compensationBand: 'E',
    noticePeriodDays: 60,
    contractStartDate: '2019-11-20',
    benefits: ['health-insurance', 'meal-vouchers', 'transport-allowance', 'bonus-plan', 'stock-options'],
  },
  {
    contractId: 'CNT-004',
    employeeId: 'EMP-004',
    contractType: 'permanent',
    country: 'Portugal',
    weeklyHours: 20,
    remoteWorkAllowed: true,
    maxRemoteDaysPerWeek: 5,
    vacationDaysPerYear: 22,
    compensationBand: 'B',
    noticePeriodDays: 15,
    contractStartDate: '2023-01-10',
    benefits: ['health-insurance', 'meal-vouchers'],
  },
  {
    contractId: 'CNT-005',
    employeeId: 'EMP-005',
    contractType: 'permanent',
    country: 'Spain',
    weeklyHours: 40,
    remoteWorkAllowed: false,
    maxRemoteDaysPerWeek: 0,
    vacationDaysPerYear: 25,
    compensationBand: 'E',
    noticePeriodDays: 60,
    contractStartDate: '2018-05-15',
    benefits: ['health-insurance', 'meal-vouchers', 'transport-allowance', 'bonus-plan', 'company-car'],
  },
  {
    contractId: 'CNT-006',
    employeeId: 'EMP-006',
    contractType: 'permanent',
    country: 'Spain',
    weeklyHours: 40,
    remoteWorkAllowed: true,
    maxRemoteDaysPerWeek: 2,
    vacationDaysPerYear: 25,
    compensationBand: 'D',
    noticePeriodDays: 30,
    contractStartDate: '2020-09-01',
    benefits: ['health-insurance', 'meal-vouchers', 'transport-allowance', 'bonus-plan'],
  },
  {
    contractId: 'CNT-007',
    employeeId: 'EMP-007',
    contractType: 'permanent',
    country: 'Spain',
    weeklyHours: 40,
    remoteWorkAllowed: true,
    maxRemoteDaysPerWeek: 2,
    vacationDaysPerYear: 25,
    compensationBand: 'D',
    noticePeriodDays: 30,
    contractStartDate: '2019-02-01',
    benefits: ['health-insurance', 'meal-vouchers', 'transport-allowance', 'bonus-plan'],
  },
  {
    contractId: 'CNT-008',
    employeeId: 'EMP-008',
    contractType: 'fixed-term',
    country: 'Denmark',
    weeklyHours: 40,
    remoteWorkAllowed: true,
    maxRemoteDaysPerWeek: 5,
    vacationDaysPerYear: 25,
    compensationBand: 'C',
    noticePeriodDays: 30,
    contractStartDate: '2023-06-15',
    contractEndDate: '2025-06-15',
    benefits: ['health-insurance', 'remote-work-allowance'],
  },
];

/**
 * Get contract by employee ID
 */
export function getContractByEmployeeId(employeeId: string): Contract | undefined {
  return contracts.find(c => c.employeeId === employeeId);
}

/**
 * Get compensation band label (not actual salary)
 */
export function getCompensationBandDescription(band: Contract['compensationBand']): string {
  const descriptions: Record<Contract['compensationBand'], string> = {
    'A': 'Entry level (band A)',
    'B': 'Junior level (band B)',
    'C': 'Mid level (band C)',
    'D': 'Senior level (band D)',
    'E': 'Executive level (band E)',
  };
  return descriptions[band];
}
