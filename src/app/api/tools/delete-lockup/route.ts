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

// Get locked amount for a lockup
async function getLockedAmount(lockupId: string): Promise<{ lockedAmount: string } | NextResponse> {
  const payload = {
    jsonrpc: "2.0",
    id: "1",
    method: "query",
    params: {
      request_type: "call_function",
      finality: "final",
      account_id: lockupId,
      method_name: "get_venear_locked_balance",
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
      return NextResponse.json({ error: 'Failed to get locked amount' }, { status: 500 });
    }

    // Convert byte array to string, then parse JSON
    const bytes = json.result.result;
    const raw = Buffer.from(bytes).toString("utf-8");
    const lockedAmount = JSON.parse(raw);

    return { lockedAmount };
  } catch (error) {
    console.error('Error getting locked amount:', error);
    return NextResponse.json({ error: 'Failed to get locked amount' }, { status: 500 });
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

    // Get locked amount
    const lockedResult = await getLockedAmount(lockupId);
    if (lockedResult instanceof NextResponse) {
      return lockedResult;
    }
    const { lockedAmount } = lockedResult;

    // Check if locked amount is "0"
    if (lockedAmount !== "0") {
      return NextResponse.json({ 
        error: 'Cannot delete lockup: locked amount is not zero',
        lockedAmount
      }, { status: 200 });
    }

    // Create the delete lockup transaction payload
    const transactionPayload = {
      receiverId: lockupId,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "delete_lockup",
            gas: tgasToGas("200"), // 200 Tgas
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
    console.error('Error generating lockup deletion transaction payload:', error);
    return NextResponse.json({ error: 'Failed to generate lockup deletion transaction payload' }, { status: 500 });
  }
} 