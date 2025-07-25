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

// Get liquid balance for a lockup
async function getLiquidBalance(lockupId: string): Promise<{ liquidAmount: string } | NextResponse> {
  const payload = {
    jsonrpc: "2.0",
    id: "1",
    method: "query",
    params: {
      request_type: "call_function",
      finality: "final",
      account_id: lockupId,
      method_name: "get_venear_liquid_balance",
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
      return NextResponse.json({ error: 'Failed to get liquid balance' }, { status: 500 });
    }

    // Convert byte array to string, then parse JSON
    const bytes = json.result.result;
    const raw = Buffer.from(bytes).toString("utf-8");
    const liquidAmount = JSON.parse(raw);

    return { liquidAmount };
  } catch (error) {
    console.error('Error getting liquid balance:', error);
    return NextResponse.json({ error: 'Failed to get liquid balance' }, { status: 500 });
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
      method_name: "get_venear_liquid_owners_balance",
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
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

    // Get liquid balance
    const liquidResult = await getLiquidBalance(lockupId);
    if (liquidResult instanceof NextResponse) {
      return liquidResult;
    }
    const { liquidAmount } = liquidResult;

    // Get liquid owner's balance
    const ownersBalanceResult = await getLiquidOwnersBalance(lockupId);
    if (ownersBalanceResult instanceof NextResponse) {
      return ownersBalanceResult;
    }
    const { liquidOwnersBalance } = ownersBalanceResult;

    // Calculate withdrawable amount (minimum of liquid amount and owner's balance)
    const withdrawableAmount = BigInt(liquidOwnersBalance) > BigInt(liquidAmount) 
      ? liquidAmount 
      : liquidOwnersBalance;

    // Check if withdrawable amount is sufficient (at least 1 NEAR = 10^24 yoctoNEAR)
    const minAmount = "1000000000000000000000000"; // 1 NEAR in yoctoNEAR
    if (BigInt(withdrawableAmount) < BigInt(minAmount)) {
      return NextResponse.json({ 
        error: 'Insufficient withdrawable balance',
        withdrawableAmount,
        liquidAmount,
        liquidOwnersBalance,
        minimumRequired: minAmount
      }, { status: 200 });
    }

    // Create the withdraw transaction payload
    const transactionPayload = {
      receiverId: lockupId,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "transfer",
            gas: tgasToGas("100"), // 100 Tgas
            deposit: "0", // No deposit needed for transfer
            args: {
              amount: withdrawableAmount,
              receiver_id: accountId
            }
          }
        }
      ]
    };

    return NextResponse.json({ 
      transactionPayload
    });

  } catch (error) {
    console.error('Error generating withdraw transaction payload:', error);
    return NextResponse.json({ error: 'Failed to generate withdraw transaction payload' }, { status: 500 });
  }
} 