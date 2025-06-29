import { NextResponse } from 'next/server';
import { VOTING_CONTRACT } from '@/app/config';
import { parseNearAmount } from "near-api-js/lib/utils/format";

// Convert Tgas to gas units (1 Tgas = 10^12 gas)
function tgasToGas(tgas: string): string {
  const tgasValue = parseFloat(tgas);
  if (isNaN(tgasValue)) {
    throw new Error('Invalid Tgas amount');
  }
  return (tgasValue * 1e12).toString();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const description = searchParams.get('description');
    const link = searchParams.get('link');
    const votingOptionsParam = searchParams.get('votingOptions');

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json({ 
        error: 'title and description are required' 
      }, { status: 400 });
    }

    if (!VOTING_CONTRACT) {
      return NextResponse.json({ 
        error: 'VOTING_CONTRACT environment variable not set' 
      }, { status: 500 });
    }

    // Validate voting options
    if (!votingOptionsParam) {
      return NextResponse.json({ 
        error: 'votingOptions is required' 
      }, { status: 400 });
    }

    // Parse voting options from comma-separated string
    const votingOptions = votingOptionsParam.split(',').map(option => option.trim());

    // Filter out empty voting options
    const filteredVotingOptions = votingOptions.filter((option: string) => 
      option && option.trim().length > 0
    );

    if (filteredVotingOptions.length === 0) {
      return NextResponse.json({ 
        error: 'At least one voting option is required' 
      }, { status: 400 });
    }

    // Create the proposal transaction payload
    const transactionPayload = {
      receiverId: VOTING_CONTRACT,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "create_proposal",
            gas: tgasToGas("100"), // 100 Tgas
            deposit: parseNearAmount("0.2"), // 0.2 NEAR
            args: {
              metadata: {
                title: title.trim(),
                description: description.trim(),
                link: link ? link.trim() : "",
                voting_options: filteredVotingOptions
              }
            }
          }
        }
      ]
    };

    return NextResponse.json({transactionPayload});

  } catch (error) {
    console.error('Error generating NEAR transaction payload:', error);
    return NextResponse.json({ error: 'Failed to generate NEAR transaction payload' }, { status: 500 });
  }
} 