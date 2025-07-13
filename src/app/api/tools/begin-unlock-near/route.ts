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

    // Create the transaction payload for begin_unlock_near
    const transactionPayload = {
      receiverId: lockupId,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "begin_unlock_near",
            gas: "100000000000000", // 100 Tgas
            deposit: "1",
            args: {},
          },
        },
      ],
    };

    return NextResponse.json({ transactionPayload });
  } catch (error) {
    console.error("Error in begin-unlock-near:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 