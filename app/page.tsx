'use client';

import { useState } from 'react';
import { EmployeeRole, employees } from '@/data/enterprise/employees';
import { NavView, roleDefinitions, canAccessView } from '@/lib/roleConfig';
import { CreatedReviewCase, REVIEW_CASES_STORAGE_KEY } from '@/lib/reviewCases';
import { LandingScreen } from '@/components/landing/LandingScreen';
import { Sidebar } from '@/components/layout/Sidebar';
import { RequestConsole } from '@/components/views/RequestConsole';
import { ReviewQueue } from '@/components/views/ReviewQueue';
import { Knowledge } from '@/components/views/Knowledge';
import { Analytics } from '@/components/views/Analytics';
import { Settings } from '@/components/views/Settings';

export default function Home() {
  const [role, setRole] = useState<EmployeeRole | null>(null);
  const [selectedActorId, setSelectedActorId] = useState<string>('EMP-001');
  const [activeView, setActiveView] = useState<NavView>('console');
  const [createdReviewCases, setCreatedReviewCases] = useState<CreatedReviewCase[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(REVIEW_CASES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      return [];
    }
    return [];
  });

  const handleCreateReviewCase = (reviewCase: CreatedReviewCase) => {
    setCreatedReviewCases((current) => {
      const next = [reviewCase, ...current.filter((item) => item.id !== reviewCase.id)];
      window.localStorage.setItem(REVIEW_CASES_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleResolveReviewCase = (caseId: string) => {
    setCreatedReviewCases((current) => {
      const next = current.map((item) => item.id === caseId ? { ...item, status: 'resolved' as const } : item);
      window.localStorage.setItem(REVIEW_CASES_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleDeleteReviewCase = (caseId: string) => {
    setCreatedReviewCases((current) => {
      const next = current.filter((item) => item.id !== caseId);
      window.localStorage.setItem(REVIEW_CASES_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleEnter = (selectedRole: EmployeeRole) => {
    const def = roleDefinitions[selectedRole];
    setRole(selectedRole);
    setSelectedActorId(def.defaultPersona);
    setActiveView(def.defaultView);
  };

  const handleSwitchRole = () => {
    setRole(null);
  };

  const handleSelectView = (view: NavView) => {
    if (role && canAccessView(role, view)) {
      setActiveView(view);
    }
  };

  if (!role) {
    return <LandingScreen onEnter={handleEnter} />;
  }

  const def = roleDefinitions[role];
  const personaName = employees.find((e) => e.employeeId === selectedActorId)?.name ?? def.title;
  // Guard: if current view is not accessible to this role, fall back to default
  const safeView: NavView = canAccessView(role, activeView) ? activeView : def.defaultView;

  return (
    <div className="flex min-h-screen bg-[#fbf8f6]">
      <Sidebar
        role={role}
        activeView={safeView}
        onSelectView={handleSelectView}
        personaName={personaName}
        onSwitchRole={handleSwitchRole}
      />

      <main className="flex-1 flex flex-col min-h-screen min-w-0">
        {safeView === 'console' && (
          <RequestConsole
            role={role}
            selectedActorId={selectedActorId}
            onActorChange={setSelectedActorId}
            defaultResponseView={def.defaultResponseView}
            onCreateReviewCase={handleCreateReviewCase}
          />
        )}
        {safeView === 'review' && (
          <ReviewQueue
            role={role}
            selectedActorId={selectedActorId}
            createdCases={createdReviewCases}
            onResolveCreatedCase={handleResolveReviewCase}
            onDeleteCreatedCase={handleDeleteReviewCase}
          />
        )}
        {safeView === 'knowledge' && <Knowledge />}
        {safeView === 'analytics' && <Analytics />}
        {safeView === 'settings' && <Settings role={role} personaName={personaName} />}
      </main>
    </div>
  );
}
