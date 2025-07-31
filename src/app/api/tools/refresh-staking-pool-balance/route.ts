import { NextResponse } from 'next/server';
import { VENEAR_CONTRACT_ID, NEAR_RPC_URL } from '@/app/config';

// Convert Tgas to gas units (1 Tgas = 10^12 gas)
function tgasToGas(tgas: string): string {
  const tgasValue = parseFloat(tgas);
  return (tgasValue * 1e12).toString();
}

// Get lockup account ID for a user

// Get staking pool account ID for a lockup
async function getStakingPoolAccountId(lockupId: string): Promise<{ stakingPool: string } | NextResponse> {
  const payload = {
    jsonrpc: "2.0",
    id: "1",
    method: "query",
    params: {
      request_type: "call_function",
      finality: "final",
      account_id: lockupId,
      method_name: "get_staking_pool_account_id",
      args_base64: Buffer.from(JSON.stringify({})).toString("base64"),
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
      return NextResponse.json({ error: 'Failed to get staking pool account ID' }, { status: 500 });
    }

    // Convert byte array to string, then parse JSON
    const bytes = json.result.result;
    const raw = Buffer.from(bytes).toString("utf-8");
    const stakingPool = JSON.parse(raw);

    return { stakingPool };
  } catch (error) {
    console.error('Error getting staking pool account ID:', error);
    return NextResponse.json({ error: 'Failed to get staking pool account ID' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId)
    }

    if (!lockupId) {
      return NextResponse.json({ 
        error: 'accountId parameter is required' 
      }, { status: 200 });
    }

    if (!VENEAR_CONTRACT_ID) {
      return NextResponse.json({ 
        error: 'VENEAR_CONTRACT_ID environment variable not set' 
      }, { status: 500 });
    }

    // Get lockup account ID
    const lockupId = searchParams.get("lockupId");

    }

    // Get staking pool account ID
    const stakingPoolResult = await getStakingPoolAccountId(lockupId);
    if (stakingPoolResult instanceof NextResponse) {
      return stakingPoolResult;
    }
    const { stakingPool } = stakingPoolResult;

    if (!stakingPool) {
      return NextResponse.json({ 
        error: 'No staking pool found for this lockup' 
      }, { status: 200 });
    }

    // Create the refresh staking pool balance transaction payload
    const transactionPayload = {
      receiverId: lockupId,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "refresh_staking_pool_balance",
            gas: tgasToGas("100"), // 100 Tgas
            deposit: "1", // 1 yoctoNEAR
            args: {}
          }
        }
      ]
    };

    return NextResponse.json({ 
      transactionPayload
    });

  } catch (error) {
    console.error('Error generating refresh staking pool balance transaction payload:', error);
    return NextResponse.json({ error: 'Failed to generate refresh staking pool balance transaction payload' }, { status: 500 });
  }
} 