/**
 * Demo Scenario Groups
 *
 * Grouped scenarios for the RequestComposer demo panel.
 * Each group shows a distinct OpsGuard capability.
 */

export interface Scenario {
  label: string;
  text: string;
  persona?: string;        // recommended actorId
  expectedOutcome?: string; // for demo tooltip
}

export interface ScenarioGroup {
  group: string;
  color: string;           // tailwind text color class
  bgColor: string;         // tailwind bg color class for selected
  borderColor: string;     // tailwind border color class for selected
  scenarios: Scenario[];
}

export const scenarioGroups: ScenarioGroup[] = [
  {
    group: 'Auto-answer',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-300',
    scenarios: [
      {
        label: 'Vacation carryover',
        text: 'Can I carry over my 5 unused vacation days to next year?',
        persona: 'EMP-001',
        expectedOutcome: 'answer_directly',
      },
    ],
  },
  {
    group: 'Live data lookup',
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-300',
    scenarios: [
      {
        label: 'My vacation balance',
        text: 'How many vacation days do I have left?',
        persona: 'EMP-001',
        expectedOutcome: 'answer_directly',
      },
      {
        label: "Team member's balance",
        text: "What is Carlos's vacation balance?",
        persona: 'EMP-003',
        expectedOutcome: 'answer_directly',
      },
      {
        label: 'Payroll reports',
        text: 'Show me my last payroll reports',
        persona: 'EMP-001',
        expectedOutcome: 'answer_directly',
      },
    ],
  },
  {
    group: 'Time Operations',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    scenarios: [
      {
        label: 'Missed clock-in',
        text: 'I forgot to clock in yesterday. How do I fix this?',
        persona: 'EMP-001',
        expectedOutcome: 'draft_action',
      },
      {
        label: 'Overtime correction',
        text: 'I forgot to clock in yesterday and worked 2 hours overtime. How do I report this?',
        persona: 'EMP-001',
        expectedOutcome: 'draft_action',
      },
      {
        label: 'Payroll cutoff risk',
        text: 'Can you correct my timesheet from last month? Payroll is closing today.',
        persona: 'EMP-001',
        expectedOutcome: 'escalate',
      },
      {
        label: 'Team member attendance',
        text: 'Show me Carlos’s time entries from this week.',
        persona: 'EMP-001',
        expectedOutcome: 'restrict_access',
      },
    ],
  },
  {
    group: 'Escalate',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    scenarios: [
      {
        label: 'Payroll bank update',
        text: "I need to update my bank account for this month's payroll. The cutoff is tomorrow.",
        persona: 'EMP-001',
        expectedOutcome: 'escalate',
      },
      {
        label: 'Remote work abroad',
        text: 'Can I work remotely from Portugal next month?',
        persona: 'EMP-001',
        expectedOutcome: 'escalate',
      },
    ],
  },
  {
    group: 'Deny / Redact',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    scenarios: [
      {
        label: "Colleague's salary",
        text: "What is Ana's salary?",
        persona: 'EMP-002',
        expectedOutcome: 'escalate',
      },
    ],
  },
];

/** Flat list for backward compat with components expecting ExampleRequest[] */
export const exampleRequestsFromGroups = scenarioGroups.flatMap(g =>
  g.scenarios.map(s => ({ label: s.label, text: s.text }))
);
