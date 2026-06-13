'use client';

import React, { useState } from 'react';
import { ResolveOpsRequestOutput } from '@/lib/types';
import { copyToClipboard, formatSlackMessage, formatTeamsMessage, formatTicket } from '@/lib/copyPacket';

interface ActionPacketProps {
  output: ResolveOpsRequestOutput | null;
}

export function ActionPacket({ output }: ActionPacketProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (format: 'slack' | 'teams' | 'ticket') => {
    if (!output) return;
    
    let text: string;
    switch (format) {
      case 'slack':
        text = formatSlackMessage(output);
        break;
      case 'teams':
        text = formatTeamsMessage(output);
        break;
      case 'ticket':
        text = formatTicket(output);
        break;
    }
    
    await copyToClipboard(text);
    setCopied(format);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!output) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
            Action Packet
          </h2>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">
              Analysis results will appear here
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
          Action Packet
        </h2>
        
        {/* Review Packet Preview */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Summary</p>
              <p className="text-sm text-gray-800">{output.reviewPacket?.summary}</p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Recommended Action</p>
              <p className="text-sm font-medium text-gray-900">{output.reviewPacket?.recommendedAction}</p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Approver</p>
              <p className="text-sm text-gray-800">{output.reviewPacket?.approver}</p>
            </div>
            
            {output.reviewPacket?.missingFields && output.reviewPacket.missingFields.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Missing Fields</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  {output.reviewPacket.missingFields.map((field, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      {field}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        {/* Copy Buttons */}
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Copy to</p>
          
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleCopy('slack')}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
              </svg>
              {copied === 'slack' ? 'Copied!' : 'Slack'}
            </button>
            
            <button
              onClick={() => handleCopy('teams')}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.625 8.625h-5.25V3.375a3.375 3.375 0 0 1 6.75 0v1.875a1.5 1.5 0 0 1-1.5 1.5h.001zm0 1.5v9.375a3.375 3.375 0 0 1-3.375 3.375h-9.375a3.375 3.375 0 0 1-3.375-3.375V9.375a3.375 3.375 0 0 1 3.375-3.375h9.375a3.375 3.375 0 0 1 3.375 3.375h.001zm-12.375 9a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25zm0-3.75a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25zm3.75 3.75a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25zm0-3.75a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25zm3.75 3.75a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25zm0-3.75a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25z"/>
              </svg>
              {copied === 'teams' ? 'Copied!' : 'Teams'}
            </button>
            
            <button
              onClick={() => handleCopy('ticket')}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {copied === 'ticket' ? 'Copied!' : 'Ticket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
