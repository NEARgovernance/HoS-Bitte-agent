import { NextResponse } from 'next/server';
import { VOTING_CONTRACT, NEAR_RPC_URL } from '@/app/config';

// Fetch delegators for a specific account from NEAR RPC
async function fetchDelegators(accountId: string) {
  if (!VOTING_CONTRACT) {
    throw new Error('VOTING_CONTRACT environment variable not set');
  }

  if (!accountId || accountId.trim() === '') {
    throw new Error('Invalid account ID');
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
    throw new Error(`RPC request failed: ${res.status}`);
  }

  const json = await res.json();

  if (json.error) {
    throw new Error(`RPC error: ${json.error.message}`);
  }

  if (!json.result || !json.result.result || json.result.result.length === 0) {
    throw new Error(`No delegators found for account ${accountId}`);
  }

  // Convert byte array to string, then parse JSON
  const bytes = json.result.result;
  const raw = Buffer.from(bytes).toString("utf-8");
  const delegators = JSON.parse(raw);

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

    const delegators = await fetchDelegators(accountId);

    // Calculate delegation statistics
    const totalDelegators = delegators.length;
    const totalDelegatedPower = delegators.reduce((sum: number, delegator: any) => {
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