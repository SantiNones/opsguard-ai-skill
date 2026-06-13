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

  const handleAnalyze = () => {
    if (!request.trim()) return;
    
    setIsAnalyzing(true);
    // Simulate processing delay
    setTimeout(() => {
      const result = mockResolve(request);
      setOutput(result);
      setIsAnalyzing(false);
    }, 600);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-h-screen">
        <AppHeader />
        
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
