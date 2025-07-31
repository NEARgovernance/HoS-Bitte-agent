import { NextResponse } from 'next/server';
import { VENEAR_CONTRACT_ID, NEAR_RPC_URL } from '@/app/config';

// Convert Tgas to gas units (1 Tgas = 10^12 gas)
function tgasToGas(tgas: string): string {
  const tgasValue = parseFloat(tgas);
  return (tgasValue * 1e12).toString();
}

// Get lockup account ID for a user

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const stakingPoolAccountId = searchParams.get('stakingPoolAccountId');

    if (!accountId)
    }

    if (!lockupId) {
      return NextResponse.json({ 
        error: 'accountId parameter is required' 
      }, { status: 200 });
    }

    if (!stakingPoolAccountId) {
      return NextResponse.json({ 
        error: 'stakingPoolAccountId parameter is required' 
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

    // Create the select staking pool transaction payload
    const transactionPayload = {
      receiverId: lockupId,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "select_staking_pool",
            gas: tgasToGas("100"), // 100 Tgas
            deposit: "1", // 1 yoctoNEAR
            args: {
              staking_pool_account_id: stakingPoolAccountId
            }
          }
        }
      ]
    };

    return NextResponse.json({ 
      transactionPayload
    });

  } catch (error) {
    console.error('Error generating select staking pool transaction payload:', error);
    return NextResponse.json({ error: 'Failed to generate select staking pool transaction payload' }, { status: 500 });
  }
} 