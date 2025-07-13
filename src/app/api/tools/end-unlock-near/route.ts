import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lockupId = searchParams.get('lockupId');

    // Validate required parameters
    if (!lockupId) {
      return NextResponse.json(
        { error: "lockupId is required" },
        { status: 400 }
      );
    }

    // Check if NEAR RPC URL is configured
    const nearRpcUrl = process.env.NEAR_RPC_URL || "https://rpc.testnet.near.org";

    try {
      // Get lockup contract state to validate unlock conditions
      const lockupStateResponse = await fetch(`${nearRpcUrl}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "dontcare",
          method: "query",
          params: {
            request_type: "call_function",
            finality: "final",
            account_id: lockupId,
            method_name: "get_venear_pending_balance",
            args_base64: "",
          },
        }),
      });

      const lockupStateData = await lockupStateResponse.json();
      
      if (lockupStateData.error) {
        return NextResponse.json(
          { error: "Failed to fetch lockup contract state" },
          { status: 400 }
        );
      }

      // Parse the pending balance
      const pendingBalance = Buffer.from(lockupStateData.result.result, "base64").toString();
      const pendingAmount = JSON.parse(pendingBalance);

      // Check if there's a pending unlock amount
      if (!pendingAmount || pendingAmount === "0") {
        return NextResponse.json(
          { error: "No pending unlock amount found" },
          { status: 400 }
        );
      }

      // Get unlock timestamp
      const unlockTimestampResponse = await fetch(`${nearRpcUrl}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "dontcare",
          method: "query",
          params: {
            request_type: "call_function",
            finality: "final",
            account_id: lockupId,
            method_name: "get_venear_unlock_timestamp",
            args_base64: "",
          },
        }),
      });

      const unlockTimestampData = await unlockTimestampResponse.json();
      
      if (unlockTimestampData.error) {
        return NextResponse.json(
          { error: "Failed to fetch unlock timestamp" },
          { status: 400 }
        );
      }

      // Parse the unlock timestamp
      const unlockTimestamp = Buffer.from(unlockTimestampData.result.result, "base64").toString();
      const unlockTimestampNs = JSON.parse(unlockTimestamp);

      // Check if unlock period has ended
      const currentTimeMs = new Date().getTime();
      const unlockTimeMs = parseFloat(unlockTimestampNs || "0") / 1e6;
      const untilUnlock = Math.max(0, unlockTimeMs - currentTimeMs);

      if (untilUnlock > 0) {
        return NextResponse.json(
          { error: "Unlock period has not ended yet" },
          { status: 400 }
        );
      }

    } catch (rpcError) {
      console.error("RPC error:", rpcError);
      return NextResponse.json(
        { error: "Failed to validate unlock conditions" },
        { status: 500 }
      );
    }

    // Create the transaction payload for end_unlock_near
    const transactionPayload = {
      receiverId: lockupId,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "end_unlock_near",
            gas: "100000000000000", // 100 Tgas
            deposit: "1",
            args: {},
          },
        },
      ],
    };

    return NextResponse.json({ transactionPayload });
  } catch (error) {
    console.error("Error in end-unlock-near:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 