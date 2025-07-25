import { NextResponse } from 'next/server';
import { VOTING_CONTRACT, NEAR_RPC_URL } from '@/app/config';

// Define proposal type
interface Proposal {
  id: number;
  title: string;
  description: string;
  status?: string;
  link?: string;
  deadline?: string;
  voting_power?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '5');

    if (isNaN(count) || count < 1 || count > 50) {
      return NextResponse.json({ error: 'count must be a number between 1 and 50' }, { status: 200 });
    }

    if (!VOTING_CONTRACT) {
      return NextResponse.json({ error: 'VOTING_CONTRACT environment variable not set' }, { status: 500 });
    }

    // First, get the total number of proposals
    const totalRes = await fetch(
      NEAR_RPC_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "1",
          method: "query",
          params: {
            request_type: "call_function",
            finality: "final",
            account_id: VOTING_CONTRACT,
            method_name: "get_num_proposals",
            args_base64: Buffer.from(JSON.stringify({})).toString("base64"),
          },
        }),
      }
    );

    if (!totalRes.ok) {
      return NextResponse.json({ error: `Failed to get proposal count: ${totalRes.status}` }, { status: 500 });
    }

    const totalJson = await totalRes.json();
    if (totalJson.error) {
      return NextResponse.json({ error: `RPC error getting count: ${totalJson.error.message}` }, { status: 500 });
    }

    const totalCount = JSON.parse(
      Buffer.from(totalJson.result.result).toString("utf-8")
    );

    if (totalCount === 0) {
      return NextResponse.json({ proposals: [] });
    }

    // Calculate the starting index for the most recent proposals
    const fromIndex = Math.max(0, totalCount - count);

    // Fetch proposals using get_proposals method
    const proposalsRes = await fetch(
      NEAR_RPC_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "1",
          method: "query",
          params: {
            request_type: "call_function",
            finality: "final",
            account_id: VOTING_CONTRACT,
            method_name: "get_proposals",
            args_base64: Buffer.from(
              JSON.stringify({
                from_index: fromIndex,
                limit: count,
              })
            ).toString("base64"),
          },
        }),
      }
    );

    if (!proposalsRes.ok) {
      return NextResponse.json({ error: `Failed to get proposals: ${proposalsRes.status}` }, { status: 500 });
    }

    const proposalsJson = await proposalsRes.json();
    if (proposalsJson.error) {
      return NextResponse.json({ error: `RPC error getting proposals: ${proposalsJson.error.message}` }, { status: 500 });
    }

    const proposals: Proposal[] = JSON.parse(
      Buffer.from(proposalsJson.result.result).toString("utf-8")
    );

    // Reverse to show most recent first and add IDs
    const proposalsWithIds = proposals
      .map((proposal: Proposal, index: number) => ({
        ...proposal,
        id: fromIndex + index,
      }))
      .reverse();

    return NextResponse.json({ 
      proposals: proposalsWithIds,
      totalCount,
      fromIndex,
      limit: count
    });
  } catch (error) {
    console.error('Error fetching recent proposals:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch recent proposals',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 