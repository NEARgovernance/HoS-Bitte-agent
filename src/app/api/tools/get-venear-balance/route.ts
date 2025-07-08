import { NextResponse } from 'next/server';
import { VENEAR_CONTRACT_ID, NEAR_RPC_URL } from '@/app/config';

// Convert yoctoNEAR to NEAR
function yoctoToNEAR(yoctoAmount: string): string {
  const amount = parseFloat(yoctoAmount);
  if (isNaN(amount)) return '0';
  return (amount / 1e24).toFixed(6);
}

// Fetch veNEAR token balance using ft_balance_of (standard fungible token interface)
async function fetchVeNEARTokenBalance(accountId: string): Promise<{ balance: string } | NextResponse> {
  if (!VENEAR_CONTRACT_ID) {
    return NextResponse.json({ error: 'VENEAR_CONTRACT_ID environment variable not set' }, { status: 500 });
  }

  const payload = {
    jsonrpc: "2.0",
    id: "1",
    method: "query",
    params: {
      request_type: "call_function",
      finality: "final",
      account_id: VENEAR_CONTRACT_ID,
      method_name: "ft_balance_of",
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
    if (json.error) {
      return NextResponse.json({ error: `RPC error: ${json.error.message}` }, { status: 500 });
    }

    if (!json.result || !json.result.result || json.result.result.length === 0) {
      return { balance: '0' }; // Return 0 balance instead of error
    }

    // Convert byte array to string, then parse JSON
    const bytes = json.result.result;
    const raw = Buffer.from(bytes).toString("utf-8");
    const balanceData = JSON.parse(raw);

    return { balance: balanceData || '0' };
  } catch (error) {
    console.error('Error fetching veNEAR token balance:', error);
    return { balance: '0' }; // Return 0 balance on error
  }
}

// Define detailed balance interface
interface DetailedBalance {
  balance?: string;
  locked_balance?: string;
  voting_power?: string;
  delegation_power?: string;
  total_power?: string;
  unlock_time?: string;
}

// Fetch detailed veNEAR balance information using get_accounts
async function fetchVeNEARDetailedBalance(accountId: string): Promise<DetailedBalance | null | NextResponse> {
  if (!VENEAR_CONTRACT_ID) {
    return NextResponse.json({ error: 'VENEAR_CONTRACT_ID environment variable not set' }, { status: 500 });
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
    if (json.error) {
      return NextResponse.json({ error: `RPC error: ${json.error.message}` }, { status: 500 });
    }

    if (!json.result || !json.result.result || json.result.result.length === 0) {
      return null; // Return null instead of error for no data
    }

    // Convert byte array to string, then parse JSON
    const bytes = json.result.result;
    const raw = Buffer.from(bytes).toString("utf-8");
    const balanceData = JSON.parse(raw);

    return balanceData;
  } catch (error) {
    console.error('Error fetching detailed veNEAR balance:', error);
    return null; // Return null on error
  }
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

    // Fetch both token balance and detailed balance
    const [tokenBalanceResult, detailedBalanceResult] = await Promise.all([
      fetchVeNEARTokenBalance(accountId),
      fetchVeNEARDetailedBalance(accountId)
    ]);

    // Handle token balance result
    if (tokenBalanceResult instanceof NextResponse) {
      return tokenBalanceResult;
    }

    // Handle detailed balance result
    if (detailedBalanceResult instanceof NextResponse) {
      return detailedBalanceResult;
    }

    const tokenBalance = tokenBalanceResult.balance;
    const detailedBalance = detailedBalanceResult;

    // Calculate NEAR values
    const tokenBalanceInNEAR = yoctoToNEAR(tokenBalance);
    const detailedBalanceInNEAR = detailedBalance ? yoctoToNEAR(detailedBalance.balance || '0') : '0';
    const lockedBalanceInNEAR = detailedBalance ? yoctoToNEAR(detailedBalance.locked_balance || '0') : '0';
    const votingPowerInNEAR = detailedBalance ? yoctoToNEAR(detailedBalance.voting_power || '0') : '0';
    const delegationPowerInNEAR = detailedBalance ? yoctoToNEAR(detailedBalance.delegation_power || '0') : '0';
    const totalPowerInNEAR = detailedBalance ? yoctoToNEAR(detailedBalance.total_power || '0') : '0';

    return NextResponse.json({ 
      accountId: accountId,
      tokenBalance: {
        raw: tokenBalance,
        nears: tokenBalanceInNEAR,
        method: "ft_balance_of",
        description: "Standard fungible token balance"
      },
      detailedBalance: detailedBalance ? {
        raw: detailedBalance.balance || '0',
        nears: detailedBalanceInNEAR,
        lockedBalance: {
          raw: detailedBalance.locked_balance || '0',
          nears: lockedBalanceInNEAR
        },
        votingPower: {
          raw: detailedBalance.voting_power || '0',
          nears: votingPowerInNEAR
        },
        delegationPower: {
          raw: detailedBalance.delegation_power || '0',
          nears: delegationPowerInNEAR
        },
        totalPower: {
          raw: detailedBalance.total_power || '0',
          nears: totalPowerInNEAR
        },
        unlockTime: detailedBalance.unlock_time,
        method: "get_accounts",
        description: "Detailed balance with voting and delegation power"
      } : null,
      metadata: {
        contract: VENEAR_CONTRACT_ID,
        token: "veNEAR",
        hasDetailedData: !!detailedBalance,
        timestamp: new Date().toISOString()
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