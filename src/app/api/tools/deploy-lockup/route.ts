import { NextResponse } from 'next/server';
import { VENEAR_CONTRACT_ID, NEAR_RPC_URL } from '@/app/config';

// Convert Tgas to gas units (1 Tgas = 10^12 gas)
function tgasToGas(tgas: string): string | NextResponse {
  const tgasValue = parseFloat(tgas);
  if (isNaN(tgasValue)) {
    return NextResponse.json({ error: 'Invalid Tgas amount' }, { status: 400 });
  }
  return (tgasValue * 1e12).toString();
}

// Get lockup deployment cost from veNEAR contract
async function getLockupDeploymentCost(): Promise<{ cost: string } | NextResponse> {
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
      method_name: "get_lockup_deployment_cost",
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
      return NextResponse.json({ error: 'Failed to get lockup deployment cost' }, { status: 500 });
    }

    // Convert byte array to string, then parse JSON
    const bytes = json.result.result;
    const raw = Buffer.from(bytes).toString("utf-8");
    const cost = JSON.parse(raw);

    return { cost };
  } catch (error) {
    console.error('Error getting lockup deployment cost:', error);
    return NextResponse.json({ error: 'Failed to get lockup deployment cost' }, { status: 500 });
  }
}

export async function GET() {
  try {
    if (!VENEAR_CONTRACT_ID) {
      return NextResponse.json({ 
        error: 'VENEAR_CONTRACT_ID environment variable not set' 
      }, { status: 500 });
    }

    // Get lockup deployment cost
    const costResult = await getLockupDeploymentCost();
    if (costResult instanceof NextResponse) {
      return costResult;
    }
    const { cost } = costResult;
    // Create the deploy lockup transaction payload
    const transactionPayload = {
      receiverId: VENEAR_CONTRACT_ID,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "deploy_lockup",
            gas: tgasToGas("100"), // 100 Tgas
            deposit: cost, // Dynamic cost from contract
            args: {}
          }
        }
      ]
    };

    return NextResponse.json({ 
      transactionPayload
    });

  } catch (error) {
    console.error('Error generating lockup deployment transaction payload:', error);
    return NextResponse.json({ error: 'Failed to generate lockup deployment transaction payload' }, { status: 500 });
  }
} 