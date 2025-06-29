import { NextResponse } from 'next/server';
import { VOTING_CONTRACT, NEAR_RPC_URL } from '@/app/config';

// Fetch proposal details from NEAR RPC
async function fetchProposal(proposalId: string) {
  if (!VOTING_CONTRACT) {
    throw new Error('VOTING_CONTRACT environment variable not set');
  }

  const id = parseInt(proposalId);
  if (isNaN(id)) {
    throw new Error('Invalid proposal ID');
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
    throw new Error(`RPC request failed: ${res.status}`);
  }

  const json = await res.json();

  if (json.error) {
    throw new Error(`RPC error: ${json.error.message}`);
  }

  if (!json.result || !json.result.result || json.result.result.length === 0) {
    throw new Error(`Proposal ${proposalId} does not exist`);
  }

  // Convert byte array to string, then parse JSON
  const bytes = json.result.result;
  const raw = Buffer.from(bytes).toString("utf-8");
  const proposal = JSON.parse(raw);

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

    const proposal = await fetchProposal(proposalId);

    return NextResponse.json({ proposal });
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch proposal',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 