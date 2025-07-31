import { NextResponse } from 'next/server';
import { VENEAR_CONTRACT_ID, NEAR_RPC_URL } from '@/app/config';

// Convert Tgas to gas units (1 Tgas = 10^12 gas)
function tgasToGas(tgas: string): string {
  const tgasValue = parseFloat(tgas);
  return (tgasValue * 1e12).toString();
}

// Get lockup account ID for a user
async function getLockupAccountId(accountId: string): Promise<{ lockupId: string } | NextResponse> {
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
      method_name: "get_lockup_account_id",
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
      return NextResponse.json({ error: 'Failed to get lockup account ID' }, { status: 500 });
    }

    // Convert byte array to string, then parse JSON
    const bytes = json.result.result;
    const raw = Buffer.from(bytes).toString("utf-8");
    const lockupId = JSON.parse(raw);

    return { lockupId };
  } catch (error) {
    console.error('Error getting lockup account ID:', error);
    return NextResponse.json({ error: 'Failed to get lockup account ID' }, { status: 500 });
  }
}

// Get liquid owner's balance for a lockup
async function getLiquidOwnersBalance(lockupId: string): Promise<{ liquidOwnersBalance: string } | NextResponse> {
  const payload = {
    jsonrpc: "2.0",
    id: "1",
    method: "query",
    params: {
      request_type: "call_function",
      finality: "final",
      account_id: lockupId,
      method_name: "get_liquid_owners_balance",
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
      return NextResponse.json({ error: 'Failed to get liquid owner balance' }, { status: 500 });
    }

    // Convert byte array to string, then parse JSON
    const bytes = json.result.result;
    const raw = Buffer.from(bytes).toString("utf-8");
    const liquidOwnersBalance = JSON.parse(raw);

    return { liquidOwnersBalance };
  } catch (error) {
    console.error('Error getting liquid owner balance:', error);
    return NextResponse.json({ error: 'Failed to get liquid owner balance' }, { status: 500 });
  }
}

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
    const amount = searchParams.get('amount');

    if (!accountId) {
      return NextResponse.json({ 
        error: 'accountId parameter is required' 
      }, { status: 200 });
    }

    if (!amount) {
      return NextResponse.json({ 
        error: 'amount parameter is required' 
      }, { status: 200 });
    }

    if (!VENEAR_CONTRACT_ID) {
      return NextResponse.json({ 
        error: 'VENEAR_CONTRACT_ID environment variable not set' 
      }, { status: 500 });
    }

    // Get lockup account ID
    const lockupResult = await getLockupAccountId(accountId);
    if (lockupResult instanceof NextResponse) {
      return lockupResult;
    }
    const { lockupId } = lockupResult;

    if (!lockupId) {
      return NextResponse.json({ 
        error: 'No lockup found for this account' 
      }, { status: 200 });
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

    // Get liquid owner's balance
    const ownersBalanceResult = await getLiquidOwnersBalance(lockupId);
    if (ownersBalanceResult instanceof NextResponse) {
      return ownersBalanceResult;
    }
    const { liquidOwnersBalance } = ownersBalanceResult;

    // Check if liquid owner's balance is sufficient for the requested amount
    if (BigInt(liquidOwnersBalance) < BigInt(amount)) {
      return NextResponse.json({ 
        error: 'Insufficient liquid owner balance to stake',
        liquidOwnersBalance,
        requestedAmount: amount
      }, { status: 200 });
    }

    // Create the deposit and stake transaction payload
    const transactionPayload = {
      receiverId: lockupId,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "deposit_and_stake",
            gas: tgasToGas("200"), // 200 Tgas
            deposit: "1", // 1 yoctoNEAR
            args: {
              amount: amount
            }
          }
        }
      ]
    };

    return NextResponse.json({ 
      transactionPayload
    });

  } catch (error) {
    console.error('Error generating deposit and stake transaction payload:', error);
    return NextResponse.json({ error: 'Failed to generate deposit and stake transaction payload' }, { status: 500 });
  }
} 