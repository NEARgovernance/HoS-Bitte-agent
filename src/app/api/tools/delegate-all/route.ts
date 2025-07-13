import { NextResponse } from 'next/server';
import { VENEAR_CONTRACT_ID } from '@/app/config';

// Convert Tgas to gas units (1 Tgas = 10^12 gas)
function tgasToGas(tgas: string): string {
  const tgasValue = parseFloat(tgas);
  return (tgasValue * 1e12).toString();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const receiverId = searchParams.get('receiverId');

    if (!receiverId) {
      return NextResponse.json({ 
        error: 'receiverId parameter is required' 
      }, { status: 400 });
    }

    if (!VENEAR_CONTRACT_ID) {
      return NextResponse.json({ 
        error: 'VENEAR_CONTRACT_ID environment variable not set' 
      }, { status: 500 });
    }

    // Validate receiver ID format (basic NEAR account ID validation)
    const nearAccountIdRegex = /^[a-z0-9._-]+$/;
    if (!nearAccountIdRegex.test(receiverId) || receiverId.length < 2 || receiverId.length > 64) {
      return NextResponse.json({ 
        error: 'Invalid receiver ID format. Must be a valid NEAR account ID' 
      }, { status: 400 });
    }

    // Create the delegate all veNEAR transaction payload
    const transactionPayload = {
      receiverId: VENEAR_CONTRACT_ID,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "delegate_all",
            gas: tgasToGas("100"), // 100 Tgas
            deposit: "1", // 1 yoctoNEAR
            args: {
              receiver_id: receiverId
            }
          }
        }
      ]
    };

    return NextResponse.json({ 
      transactionPayload
    });

  } catch (error) {
    console.error('Error generating delegate all veNEAR transaction payload:', error);
    return NextResponse.json({ error: 'Failed to generate delegate all veNEAR transaction payload' }, { status: 500 });
  }
} 