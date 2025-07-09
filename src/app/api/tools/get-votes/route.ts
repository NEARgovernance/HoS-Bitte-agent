import { NextResponse } from 'next/server';
import { VOTING_CONTRACT, NEAR_RPC_URL } from '@/app/config';

// Define vote type
interface Vote {
  voter: string;
  vote: 'Yes' | 'No' | 'Abstain';
  voting_power: string;
  timestamp?: string;
}

// Define proposal type (from get-proposal)
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
  votes?: Vote[];
}

// Fetch proposal details from NEAR RPC (same as get-proposal)
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
      return NextResponse.json({ error: `Proposal ${proposalId} does not exist` }, { status: 400 });
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

    // Extract votes from proposal data
    const votes = proposal.votes || [];

    // Calculate decision split statistics
    const totalVotes = votes.length;
    const yesVotes = votes.filter((vote: Vote) => vote.vote === 'Yes').length;
    const noVotes = votes.filter((vote: Vote) => vote.vote === 'No').length;
    const abstainVotes = votes.filter((vote: Vote) => vote.vote === 'Abstain').length;
    
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
      decisionSplit,
      proposal: {
        id: proposal.id,
        title: proposal.title,
        description: proposal.description,
        status: proposal.status,
        deadline: proposal.deadline,
        total_voting_power: proposal.total_voting_power
      }
    });
  } catch (error) {
    console.error('Error fetching votes:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch votes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 