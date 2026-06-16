'use client';

import { useRef, useState } from 'react';
import { EmployeeRole, employees } from '@/data/enterprise/employees';
import { ResponseView } from '@/lib/roleConfig';
import { CreatedReviewCase } from '@/lib/reviewCases';
import { AppHeader } from '@/components/layout/AppHeader';
import { RequestComposer } from '@/components/request/RequestComposer';
import { ActionPacket } from '@/components/action/ActionPacket';
import { EmployeeResponseComponent } from '@/components/response/EmployeeResponse';
import { HRReviewPacketComponent } from '@/components/response/HRReviewPacket';
import { ViewModeToggle } from '@/components/response/ViewModeToggle';
import { LoadingSequence } from '@/components/ui/LoadingSequence';
import { SystemDiagnostics } from '@/components/system/SystemDiagnostics';
import { EnterpriseContext } from '@/components/enterprise/EnterpriseContext';
import { RetrievalDiagnostics } from '@/components/system/RetrievalDiagnostics';
import { ConfidencePanel } from '@/components/system/ConfidencePanel';
import { ConfidentialityPanel } from '@/components/system/ConfidentialityPanel';
import { ObservabilityPanel } from '@/components/system/ObservabilityPanel';
import { SystemDetails } from '@/components/system/SystemDetails';
import { BellIcon, ChevronDownIcon, SparkleIcon } from '@/components/ui/Icons';
import { mockResolve } from '@/lib/mockResolve';
import { ResolveOpsRequestOutput, EmployeeResponse, HRReviewPacket } from '@/lib/types';

interface RequestConsoleProps {
  role: EmployeeRole;
  selectedActorId: string;
  onActorChange: (actorId: string) => void;
  defaultResponseView: ResponseView;
  onCreateReviewCase: (reviewCase: CreatedReviewCase) => void;
}

export function RequestConsole({
  role,
  selectedActorId,
  onActorChange,
  defaultResponseView,
  onCreateReviewCase,
}: RequestConsoleProps) {
  const [request, setRequest] = useState('');
  const [output, setOutput] = useState<ResolveOpsRequestOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ResponseView>(defaultResponseView);
  const [employeeResponse, setEmployeeResponse] = useState<EmployeeResponse | null>(null);
  const [hrReviewPacket, setHRReviewPacket] = useState<HRReviewPacket | null>(null);
  const latestRunRef = useRef(0);

  const [enterpriseContextData, setEnterpriseContextData] = useState<{
    actor?: { employeeId: string; name: string; role: string };
    targetEmployee?: { employeeId: string; name: string } | null;
    accessLevel: string;
    redactionsApplied: number;
    hasContext: boolean;
  } | null>(null);
  const [retrievalDiagnosticsData, setRetrievalDiagnosticsData] = useState<{
    selectedChunkCount: number;
    estimatedContextTokens: number;
    topRuleIds: string[];
    retrievalConfidence: 'low' | 'medium' | 'high';
    totalCandidateCount: number;
    excludedForBudget: string[];
  } | null>(null);
  const [confidenceData, setConfidenceData] = useState<{
    confidenceScore: number;
    confidenceLabel: 'low' | 'medium' | 'high';
    confidenceReasons: string[];
  } | null>(null);
  const [confidentialityData, setConfidentialityData] = useState<{
    sensitiveDataDetected: boolean;
    sensitiveCategories: string[];
    redactionsApplied: number;
    restrictedFields: string[];
    confidentialityLevel: 'low' | 'medium' | 'high';
  } | null>(null);
  const [observabilityData, setObservabilityData] = useState<{
    requestId: string;
    createdAt: string;
    resolverMode: 'ai' | 'fallback' | 'deterministic';
    fallbackReason?: string;
    latencyMs: number;
    modelName?: string;
    retrievalChunkCount: number;
    estimatedContextTokens: number;
    topRuleIds: string[];
    confidenceLabel: 'low' | 'medium' | 'high';
    confidentialityLevel: 'low' | 'medium' | 'high';
    redactionsApplied: number;
    requiresHumanReview: boolean;
    tokenUsageEstimate: {
      inputTokensEstimate: number;
      outputTokensEstimate: number;
      estimatedCostUsd: number;
    };
  } | null>(null);

  const handleAnalyze = async () => {
    if (!request.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setOutput(null);
    setEmployeeResponse(null);
    setHRReviewPacket(null);
    setEnterpriseContextData(null);
    setRetrievalDiagnosticsData(null);
    setConfidenceData(null);
    setConfidentialityData(null);
    setObservabilityData(null);
    const runId = latestRunRef.current + 1;
    latestRunRef.current = runId;
    const requestText = request.trim();
    const actorId = selectedActorId;

    try {
      const response = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userRequest: requestText, actorId }),
      });
      const result = await response.json();
      if (latestRunRef.current !== runId) return;

      if (result.success && result.data) {
        setOutput(result.data.output);
        if (result.data.enterpriseContext) setEnterpriseContextData(result.data.enterpriseContext);
        if (result.data.employeeResponse) setEmployeeResponse(result.data.employeeResponse);
        if (result.data.hrReviewPacket) setHRReviewPacket(result.data.hrReviewPacket);
        if (result.data.retrievalDiagnostics) setRetrievalDiagnosticsData(result.data.retrievalDiagnostics);
        if (result.data.confidence) setConfidenceData(result.data.confidence);
        if (result.data.confidentiality) setConfidentialityData(result.data.confidentiality);
        if (result.data.observability) setObservabilityData(result.data.observability);
      } else {
        const fallbackResult = mockResolve(requestText);
        setOutput(fallbackResult);
        if (result.error) setError(`API unavailable. Using local fallback: ${result.error}`);
      }
    } catch (err) {
      if (latestRunRef.current !== runId) return;
      console.warn('Network error, falling back to mock:', err);
      setOutput(mockResolve(requestText));
      setError('Network error. Using local fallback resolver.');
    } finally {
      if (latestRunRef.current === runId) setIsAnalyzing(false);
    }
  };

  const hasResult = !!output && (!!employeeResponse || !!hrReviewPacket);
  const diagnosticsCount = [
    enterpriseContextData,
    retrievalDiagnosticsData,
    confidenceData,
    confidentialityData,
    observabilityData,
  ].filter(Boolean).length;

  const selectedActor = employees.find((employee) => employee.employeeId === selectedActorId);
  const actorRoleLabel: Record<EmployeeRole, string> = {
    employee: 'Employee',
    manager: 'Manager',
    hr_ops: 'HR Operations',
    payroll_admin: 'Payroll Admin',
  };

  return (
    <>
      <AppHeader
        title="Request Console"
        subtitle="Ask a question or select a scenario to get started."
        right={
          <>
            {hasResult && <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />}
            <div className="relative">
              <select
                value={selectedActorId}
                onChange={(e) => onActorChange(e.target.value)}
                className="absolute inset-0 z-10 opacity-0 cursor-pointer w-full"
                aria-label="Acting persona"
              >
                {employees.map((emp) => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.name} — {actorRoleLabel[emp.role]}{emp.department ? ` · ${emp.department}` : ''}
                  </option>
                ))}
              </select>
              {selectedActor && (
                <div className="pointer-events-none og-btn-ghost flex flex-col items-start justify-center gap-1 pl-4 pr-10 py-2.5 min-h-[44px] w-[260px] sm:w-[310px] max-w-[calc(100vw-3rem)]">
                  <span className="text-[10px] leading-none font-bold uppercase tracking-[0.16em] text-stone-400">
                    {actorRoleLabel[selectedActor.role]}{selectedActor.department ? ` · ${selectedActor.department}` : ''}
                  </span>
                  <span className="block max-w-full truncate text-sm leading-tight font-bold text-stone-800">
                    {selectedActor.name} — {actorRoleLabel[selectedActor.role]}
                  </span>
                </div>
              )}
              <ChevronDownIcon className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button className="w-9 h-9 rounded-xl border border-[#f0e8e4] bg-white flex items-center justify-center text-stone-500 hover:text-brand-600 hover:border-brand-200 transition-colors">
              <BellIcon className="w-[18px] h-[18px]" />
            </button>
          </>
        }
      />

      <div className="flex-1 px-8 py-6 og-scroll overflow-y-auto">
        {error && (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2 max-w-7xl">
            <span className="text-sm text-amber-800">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-amber-600 hover:text-amber-800 text-sm">
              Dismiss
            </button>
          </div>
        )}

        <div className="max-w-[1500px] space-y-5">
          {/* Workflow row: Request -> Response -> Case */}
          <div className="og-panel p-4 lg:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start">
            {/* Left: Composer */}
            <div className="lg:col-span-4">
              <RequestComposer
                value={request}
                onChange={setRequest}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
              />
            </div>

            {/* Center: Response */}
            <div className="lg:col-span-5 space-y-4">
              <LoadingSequence isActive={isAnalyzing} />

              {!isAnalyzing && !hasResult && (
                <div className="og-card min-h-[300px] p-8 text-center flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-x-10 top-0 h-28 bg-[radial-gradient(circle,rgba(244,63,94,0.12),transparent_70%)]" />
                  <div className="w-14 h-14 rounded-3xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4 ring-1 ring-brand-100 shadow-sm relative">
                    <SparkleIcon className="w-6 h-6" />
                  </div>
                  <p className="text-base font-bold text-stone-950 mb-1">OpsGuard Response</p>
                  <p className="text-sm text-stone-500 max-w-xs mx-auto leading-relaxed">
                    Route a request to see how OpsGuard answers, drafts, escalates, or restricts.
                  </p>
                </div>
              )}

              {!isAnalyzing && hasResult && (
                <div className="og-fade-up space-y-4">
                  {viewMode === 'employee' && employeeResponse && (
                    <EmployeeResponseComponent response={employeeResponse} />
                  )}
                  {viewMode === 'hr' && hrReviewPacket && (
                    <HRReviewPacketComponent packet={hrReviewPacket} />
                  )}
                </div>
              )}
            </div>

            {/* Right: Review Case */}
            <div className="lg:col-span-3">
              <ActionPacket
                output={output}
                requestText={request}
                actorId={selectedActorId}
                actorRole={role}
                actorName={employees.find((employee) => employee.employeeId === selectedActorId)?.name ?? 'Unknown employee'}
                targetName={enterpriseContextData?.targetEmployee?.name ?? undefined}
                targetEmployeeId={enterpriseContextData?.targetEmployee?.employeeId ?? undefined}
                onCreateReviewCase={onCreateReviewCase}
              />
            </div>
          </div>
          </div>

          {/* Secondary: collapsed technical diagnostics */}
          {hasResult && (
            <SystemDiagnostics count={diagnosticsCount}>
              <EnterpriseContext context={enterpriseContextData} />
              <ConfidencePanel confidence={confidenceData} />
              <ConfidentialityPanel confidentiality={confidentialityData} />
              <RetrievalDiagnostics diagnostics={retrievalDiagnosticsData} />
              <ObservabilityPanel observability={observabilityData} />
              <SystemDetails output={output} />
            </SystemDiagnostics>
          )}
        </div>
      </div>
    </>
  );
}
