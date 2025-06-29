import { NextResponse } from 'next/server';
import { VOTING_CONTRACT, NEAR_RPC_URL } from '@/app/config';

// Fetch votes for a specific proposal from NEAR RPC
async function fetchVotes(proposalId: string) {
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
      method_name: "get_votes",
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
    throw new Error(`No votes found for proposal ${proposalId}`);
  }

  // Convert byte array to string, then parse JSON
  const bytes = json.result.result;
  const raw = Buffer.from(bytes).toString("utf-8");
  const votes = JSON.parse(raw);

  return votes;
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

    const votes = await fetchVotes(proposalId);

    // Calculate decision split statistics
    const totalVotes = votes.length;
    const yesVotes = votes.filter((vote: any) => vote.vote === 'Yes').length;
    const noVotes = votes.filter((vote: any) => vote.vote === 'No').length;
    const abstainVotes = votes.filter((vote: any) => vote.vote === 'Abstain').length;
    
    const decisionSplit = {
      total: totalVotes,
      yes: yesVotes,
      no: noVotes,
      abstain: abstainVotes,
      yesPercentage: totalVotes > 0 ? ((yesVotes / totalVotes) * 100).toFixed(2) : '0.00',
      noPercentage: totalVotes > 0 ? ((noVotes / totalVotes) * 100).toFixed(2) : '0.00',
      abstainPercentage: totalVotes > 0 ? ((abstainVotes / totalVotes) * 100).toFixed(2) : '0.00'
    };

    return NextResponse.json({ 
      proposalId,
      votes,
      decisionSplit
    });
  } catch (error) {
    console.error('Error fetching votes:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch votes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 