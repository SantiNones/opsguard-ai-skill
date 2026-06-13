'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { RequestComposer } from '@/components/request/RequestComposer';
import { DecisionSummary } from '@/components/decision/DecisionSummary';
import { WorkflowStepper } from '@/components/decision/WorkflowStepper';
import { ActionPacket } from '@/components/action/ActionPacket';
import { SystemDetails } from '@/components/system/SystemDetails';
import { mockResolve, exampleRequests } from '@/lib/mockResolve';
import { ResolveOpsRequestOutput } from '@/lib/types';

export default function Home() {
  const [request, setRequest] = useState('');
  const [output, setOutput] = useState<ResolveOpsRequestOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!request.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Call the API
      const response = await fetch('/api/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userRequest: request }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setOutput(result.data.output);
      } else {
        // API error - fallback to local mock resolver
        console.warn('API failed, falling back to mock:', result.error);
        const fallbackResult = mockResolve(request);
        setOutput(fallbackResult);
        if (result.error) {
          setError(`API unavailable. Using local fallback: ${result.error}`);
        }
      }
    } catch (err) {
      // Network or other error - fallback to local mock
      console.warn('Network error, falling back to mock:', err);
      const fallbackResult = mockResolve(request);
      setOutput(fallbackResult);
      setError('Network error. Using local fallback resolver.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-h-screen">
        <AppHeader />
        
        {/* Error Banner */}
        {error && (
          <div className="px-8 pt-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm text-amber-800">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-amber-600 hover:text-amber-800"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        <div className="flex-1 px-8 py-6">
          {/* 3-Column Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl">
            {/* Left: Request Panel */}
            <div className="space-y-6">
              <RequestComposer
                value={request}
                onChange={setRequest}
                onAnalyze={handleAnalyze}
                examples={exampleRequests}
                isAnalyzing={isAnalyzing}
              />
            </div>
            
            {/* Center: Decision Panel */}
            <div className="space-y-6">
              <DecisionSummary output={output} />
              <WorkflowStepper output={output} />
            </div>
            
            {/* Right: Action Panel */}
            <div className="space-y-6">
              <ActionPacket output={output} />
              <SystemDetails output={output} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
