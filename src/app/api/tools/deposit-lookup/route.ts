import { NextRequest, NextResponse } from "next/server";
import { VENEAR_CONTRACT_ID, NEAR_RPC_URL } from '@/app/config';

// Helper to convert NEAR to yoctoNEAR
function toYocto(amount: number): string {
  return (BigInt(Math.floor(amount * 1e24))).toString();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const amountStr = searchParams.get('amount');

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }
    if (!amountStr) {
      return NextResponse.json({ error: 'amount is required' }, { status: 400 });
    }
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
    }
    if (!VENEAR_CONTRACT_ID) {
      return NextResponse.json({ error: 'VENEAR_CONTRACT_ID environment variable not set' }, { status: 500 });
    }
    const nearRpcUrl = NEAR_RPC_URL || "https://rpc.testnet.near.org";

    // Fetch lockupId using get_lockup_account_id
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
    const res = await fetch(nearRpcUrl, {
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
      return NextResponse.json({ error: 'Failed to get lockupId' }, { status: 500 });
    }
    const bytes = json.result.result;
    const raw = Buffer.from(bytes).toString("utf-8");
    const lockupId = JSON.parse(raw);
    if (!lockupId) {
      return NextResponse.json({ error: 'No lockupId found for this account' }, { status: 400 });
    }

    // Create the transfer transaction payload
    const transactionPayload = {
      receiverId: lockupId,
      actions: [
        {
          type: "Transfer",
          params: {
            deposit: toYocto(amount),
          },
        },
      ],
    };

    return NextResponse.json({ transactionPayload });
  } catch (error) {
    console.error('Error generating deposit lookup transaction payload:', error);
    return NextResponse.json({ error: 'Failed to generate deposit lookup transaction payload' }, { status: 500 });
  }
} 