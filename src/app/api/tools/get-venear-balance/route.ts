import { NextResponse } from 'next/server';
import { VENEAR_CONTRACT_ID, NEAR_RPC_URL } from '@/app/config';

// Define veNEAR balance type
interface VeNEARBalance {
  account_id: string;
  balance: string;
  locked_balance?: string;
  unlock_time?: string;
  voting_power?: string;
  delegation_power?: string;
  total_power?: string;
}

// Fetch veNEAR balance for an account
async function fetchVeNEARBalance(accountId: string): Promise<VeNEARBalance | NextResponse> {
  if (!VENEAR_CONTRACT_ID) {
    return NextResponse.json({ error: 'VENEAR_CONTRACT_ID environment variable not set' }, { status: 500 });
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
      account_id: VENEAR_CONTRACT_ID,
      method_name: "get_accounts",
      args_base64: Buffer.from(JSON.stringify({ account_id: accountId })).toString("base64"),
    },
  };

  try {
    const res = await fetch(NEAR_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `RPC request failed: ${res.status}` }, { status: 500 });
    }

    const json = await res.json();
    console.log(json);
    if (json.error) {
      return NextResponse.json({ error: `RPC error: ${json.error.message}` }, { status: 500 });
    }

    if (!json.result || !json.result.result || json.result.result.length === 0) {
      return NextResponse.json({ error: `No veNEAR balance found for account ${accountId}` }, { status: 404 });
    }

    // Convert byte array to string, then parse JSON
    const bytes = json.result.result;
    const raw = Buffer.from(bytes).toString("utf-8");
    const balanceData: VeNEARBalance = JSON.parse(raw);

    return balanceData;
  } catch (error) {
    console.error('Error fetching veNEAR balance:', error);
    return NextResponse.json({ error: 'Failed to fetch veNEAR balance' }, { status: 500 });
  }
}

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

    if (!VENEAR_CONTRACT_ID) {
      return NextResponse.json({ error: 'VENEAR_CONTRACT_ID environment variable not set' }, { status: 500 });
    }

    const result = await fetchVeNEARBalance(accountId);
    
    // Check if result is an error response
    if (result instanceof NextResponse) {
      return result;
    }

    const balanceData = result;

    // Calculate additional statistics
    const balanceInNEAR = yoctoToNEAR(balanceData.balance);
    const lockedBalanceInNEAR = balanceData.locked_balance ? yoctoToNEAR(balanceData.locked_balance) : '0';
    const votingPowerInNEAR = balanceData.voting_power ? yoctoToNEAR(balanceData.voting_power) : '0';
    const delegationPowerInNEAR = balanceData.delegation_power ? yoctoToNEAR(balanceData.delegation_power) : '0';
    const totalPowerInNEAR = balanceData.total_power ? yoctoToNEAR(balanceData.total_power) : '0';

    return NextResponse.json({ 
      accountId: balanceData.account_id,
      balance: {
        raw: balanceData.balance,
        nears: balanceInNEAR
      },
      lockedBalance: balanceData.locked_balance ? {
        raw: balanceData.locked_balance,
        nears: lockedBalanceInNEAR
      } : null,
      unlockTime: balanceData.unlock_time || null,
      votingPower: balanceData.voting_power ? {
        raw: balanceData.voting_power,
        nears: votingPowerInNEAR
      } : null,
      delegationPower: balanceData.delegation_power ? {
        raw: balanceData.delegation_power,
        nears: delegationPowerInNEAR
      } : null,
      totalPower: balanceData.total_power ? {
        raw: balanceData.total_power,
        nears: totalPowerInNEAR
      } : null,
      metadata: {
        contract: VENEAR_CONTRACT_ID,
        token: "veNEAR",
        description: "Voting power and delegation information for House of Stake governance"
      }
    });
  } catch (error) {
    console.error('Error fetching veNEAR balance:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch veNEAR balance',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 