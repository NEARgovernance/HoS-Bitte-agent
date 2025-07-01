import { NextResponse } from 'next/server';
import { VOTING_CONTRACT, NEAR_RPC_URL } from '@/app/config';

// Define proposal type
interface Proposal {
  id: number;
  title: string;
  description: string;
  link?: string;
  deadline?: string;
  voting_power?: string;
  status?: string;
  snapshot_block?: number;
  total_voting_power?: string;
}

// Fetch proposal details from NEAR RPC
async function fetchProposal(proposalId: string): Promise<Proposal | NextResponse> {
  if (!VOTING_CONTRACT) {
    return NextResponse.json({ error: 'VOTING_CONTRACT environment variable not set' }, { status: 500 });
  }

  const id = parseInt(proposalId);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid proposal ID' }, { status: 400 });
  }
  
  const payload = {
    jsonrpc: "2.0",
    id: "1",
    method: "query",
    params: {
      request_type: "call_function",
      finality: "final",
      account_id: VOTING_CONTRACT,
      method_name: "get_proposal",
      args_base64: Buffer.from(JSON.stringify({ proposal_id: id })).toString("base64"),
    },
  };

  const res = await fetch(NEAR_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    return NextResponse.json({ error: `RPC request failed: ${res.status}` }, { status: 500 });
  }

  const json = await res.json();

  if (json.error) {
    return NextResponse.json({ error: `RPC error: ${json.error.message}` }, { status: 500 });
  }

  if (!json.result || !json.result.result || json.result.result.length === 0) {
    return NextResponse.json({ error: `Proposal ${proposalId} does not exist` }, { status: 404 });
  }

  // Convert byte array to string, then parse JSON
  const bytes = json.result.result;
  const raw = Buffer.from(bytes).toString("utf-8");
  const proposal: Proposal = JSON.parse(raw);

  return proposal;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const proposalId = searchParams.get('proposalId');

    if (!proposalId) {
      return NextResponse.json({ error: 'proposalId is required' }, { status: 400 });
    }

    if (!VOTING_CONTRACT) {
      return NextResponse.json({ error: 'VOTING_CONTRACT environment variable not set' }, { status: 500 });
    }

    const result = await fetchProposal(proposalId);
    
    // Check if result is an error response
    if (result instanceof NextResponse) {
      return result;
    }

    const proposal = result;

    return NextResponse.json({ proposal });
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch proposal',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 