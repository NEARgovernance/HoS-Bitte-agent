import { NextResponse } from 'next/server';
import { NEAR_RPC_URL } from '@/app/config';

// Convert yoctoNEAR to NEAR
function yoctoToNEAR(yoctoAmount: string): string {
  const amount = parseFloat(yoctoAmount);
  if (isNaN(amount)) return '0';
  return (amount / 1e24).toFixed(6);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    if (!accountId.trim()) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
    }

    // Fetch NEAR account balance
    const payload = {
      jsonrpc: "2.0",
      id: "1",
      method: "query",
      params: {
        request_type: "view_account",
        finality: "final",
        account_id: accountId,
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

    if (!json.result) {
      return NextResponse.json({ error: `Account ${accountId} not found` }, { status: 404 });
    }

    const accountBalance = json.result.amount || '0';
    const balanceInNEAR = yoctoToNEAR(accountBalance);

    return NextResponse.json({
      accountId: accountId,
      balance: {
        raw: accountBalance,
        nears: balanceInNEAR
      },
      metadata: {
        description: "NEAR account balance information",
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching account balance:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch account balance',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 