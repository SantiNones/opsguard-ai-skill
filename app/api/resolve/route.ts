import { NextRequest, NextResponse } from 'next/server';
import { resolveOpsRequest } from '@/lib/resolveOpsRequest';
import { ResolveOpsRequestOutput } from '@/lib/types';

export interface ResolveRequestBody {
  userRequest: string;
}

export interface ResolveResponse {
  success: boolean;
  data?: {
    output: ResolveOpsRequestOutput;
    processingTimeMs: number;
    safetyOverridesApplied: boolean;
    mode: 'ai' | 'fallback';
    fallbackReason?: string;
  };
  error?: string;
  message?: string;
}

/**
 * POST /api/resolve
 * 
 * Resolves an HR Operations request using policy retrieval and safety rules.
 * Returns a structured decision with route, risk level, and review packet.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ResolveResponse>> {
  try {
    // Parse request body
    let body: ResolveRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
        },
        { status: 400 }
      );
    }

    // Validate request
    const { userRequest } = body;

    if (!userRequest || typeof userRequest !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid userRequest field',
        },
        { status: 400 }
      );
    }

    if (userRequest.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'userRequest cannot be empty',
        },
        { status: 400 }
      );
    }

    if (userRequest.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          error: 'userRequest exceeds maximum length of 2000 characters',
        },
        { status: 400 }
      );
    }

    // Process the request
    const result = await resolveOpsRequest(userRequest);

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        data: {
          output: result.output,
          processingTimeMs: result.processingTimeMs,
          safetyOverridesApplied: result.safetyOverridesApplied,
          mode: result.mode,
          fallbackReason: result.fallbackReason,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    // Log error for monitoring (but don't expose details)
    console.error('Error in /api/resolve:', error);

    // Return generic error without stack trace
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your request.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/resolve
 * 
 * Returns API status and documentation.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      status: 'operational',
      version: '0.2.0',
      description: 'OpsGuard HR Operations Resolution API',
      endpoints: {
        'POST /api/resolve': {
          description: 'Resolve an HR operations request',
          body: {
            userRequest: 'string (required) - The employee request text',
          },
          response: {
            success: 'boolean',
            data: {
              output: 'ResolveOpsRequestOutput',
              processingTimeMs: 'number',
              safetyOverridesApplied: 'boolean',
              mode: 'ai | fallback',
              fallbackReason: 'string (optional)',
            },
          },
        },
      },
      supportedRoutes: [
        'answer_directly',
        'ask_for_info',
        'draft_action',
        'escalate',
      ],
      riskLevels: ['low', 'medium', 'high'],
    },
    { status: 200 }
  );
}
