import { NextResponse } from 'next/server';
import { VOTING_CONTRACT, NEAR_RPC_URL } from '@/app/config';

// Define delegator type
interface Delegator {
  delegator: string;
  delegated_power: string;
  delegation_date?: string;
}

// Fetch delegators for a specific account from NEAR RPC
async function fetchDelegators(accountId: string): Promise<Delegator[] | NextResponse> {
  if (!VOTING_CONTRACT) {
    return NextResponse.json({ error: 'VOTING_CONTRACT environment variable not set' }, { status: 500 });
  }

  if (!accountId || accountId.trim() === '') {
    return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
  }
  
  const payload = {
    jsonrpc: "2.0",
    id: "1",
    method: "query",
    params: {
      request_type: "call_function",
      finality: "final",
      account_id: VOTING_CONTRACT,
      method_name: "get_delegators",
      args_base64: Buffer.from(JSON.stringify({ account_id: accountId })).toString("base64"),
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
      return NextResponse.json({ error: `No delegators found for account ${accountId}` }, { status: 400 });
    }

  // Convert byte array to string, then parse JSON
  const bytes = json.result.result;
  const raw = Buffer.from(bytes).toString("utf-8");
  const delegators: Delegator[] = JSON.parse(raw);

  return delegators;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    if (!VOTING_CONTRACT) {
      return NextResponse.json({ error: 'VOTING_CONTRACT environment variable not set' }, { status: 500 });
    }

    const result = await fetchDelegators(accountId);
    
    // Check if result is an error response
    if (result instanceof NextResponse) {
      return result;
    }

    const delegators = result;

    // Calculate delegation statistics
    const totalDelegators = delegators.length;
    const totalDelegatedPower = delegators.reduce((sum: number, delegator: Delegator) => {
      return sum + (parseFloat(delegator.delegated_power || '0') || 0);
    }, 0);

    const delegationStats = {
      accountId,
      totalDelegators,
      totalDelegatedPower: totalDelegatedPower.toFixed(0),
      averageDelegation: totalDelegators > 0 ? (totalDelegatedPower / totalDelegators).toFixed(0) : '0'
    };

    return NextResponse.json({ 
      accountId,
      delegators,
      delegationStats
    });
  } catch (error) {
    console.error('Error fetching delegators:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch delegators',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 