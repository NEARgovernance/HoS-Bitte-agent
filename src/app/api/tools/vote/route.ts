import { NextResponse } from 'next/server';
import { VOTING_CONTRACT, VENEAR_CONTRACT_ID, NEAR_RPC_URL } from '@/app/config';
import { parseNearAmount } from "near-api-js/lib/utils/format";

// Convert Tgas to gas units (1 Tgas = 10^12 gas)
function tgasToGas(tgas: string): string | NextResponse {
  const tgasValue = parseFloat(tgas);
  if (isNaN(tgasValue)) {
    return NextResponse.json({ error: 'Invalid Tgas amount' }, { status: 400 });
  }
  return (tgasValue * 1e12).toString();
}

// Fetch merkle proof and vAccount from veNEAR contract
async function getProof(accountId: string, snapshotBlockHeight: number): Promise<{ merkleProof: string; vAccount: string } | NextResponse> {
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
      method_name: "get_proof",
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
      return NextResponse.json({ error: `No proof found for account ${accountId}` }, { status: 404 });
    }

    // Convert byte array to string, then parse JSON
    const bytes = json.result.result;
    const raw = Buffer.from(bytes).toString("utf-8");
    const proofData = JSON.parse(raw);

    return {
      merkleProof: proofData.merkle_proof || proofData.proof,
      vAccount: proofData.v_account || accountId
    };
  } catch (error) {
    console.error('Error fetching proof:', error);
    return NextResponse.json({ error: 'Failed to fetch merkle proof' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const proposalId = searchParams.get('proposalId');
    const vote = searchParams.get('vote');
    const accountId = searchParams.get('accountId');
    const snapshotBlockHeight = searchParams.get('snapshotBlockHeight');

    // Validate required fields
    if (!proposalId) {
      return NextResponse.json({ 
        error: 'proposalId is required' 
      }, { status: 400 });
    }

    if (!vote) {
      return NextResponse.json({ 
        error: 'vote is required (Yes, No, or Abstain)' 
      }, { status: 400 });
    }

    if (!accountId) {
      return NextResponse.json({ 
        error: 'accountId is required' 
      }, { status: 400 });
    }

    if (!snapshotBlockHeight) {
      return NextResponse.json({ 
        error: 'snapshotBlockHeight is required' 
      }, { status: 400 });
    }

    // Validate vote value
    const validVotes = ['Yes', 'No', 'Abstain'];
    if (!validVotes.includes(vote)) {
      return NextResponse.json({ 
        error: 'vote must be one of: Yes, No, Abstain' 
      }, { status: 400 });
    }

    // Validate proposal ID
    const id = parseInt(proposalId);
    if (isNaN(id) || id < 0) {
      return NextResponse.json({ 
        error: 'proposalId must be a valid positive number' 
      }, { status: 400 });
    }

    // Validate snapshot block height
    const snapshotBlock = parseInt(snapshotBlockHeight);
    if (isNaN(snapshotBlock) || snapshotBlock <= 0) {
      return NextResponse.json({ 
        error: 'snapshotBlockHeight must be a valid positive number' 
      }, { status: 400 });
    }

    if (!VOTING_CONTRACT) {
      return NextResponse.json({ 
        error: 'VOTING_CONTRACT environment variable not set' 
      }, { status: 500 });
    }

    // Fetch merkle proof and vAccount
    const proofResult = await getProof(accountId, snapshotBlock);
    if (proofResult instanceof NextResponse) {
      return proofResult;
    }

    const { merkleProof, vAccount } = proofResult;

    // Convert Tgas to gas units
    const gasResult = tgasToGas("300");
    if (gasResult instanceof NextResponse) {
      return gasResult;
    }

    // Create the vote transaction payload
    const transactionPayload = {
      receiverId: VOTING_CONTRACT,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "vote",
            gas: gasResult, // 300 Tgas
            deposit: parseNearAmount("0"), // No deposit required for voting
            args: {
              proposal_id: id,
              vote: vote,
              merkle_proof: merkleProof,
              v_account: vAccount,
            }
          }
        }
      ]
    };

    return NextResponse.json({ 
      transactionPayload,
      vote: {
        proposalId: id,
        vote: vote,
        accountId: accountId,
        snapshotBlockHeight: snapshotBlock,
        merkleProof: merkleProof,
        vAccount: vAccount
      }
    });

  } catch (error) {
    console.error('Error generating vote transaction payload:', error);
    return NextResponse.json({ error: 'Failed to generate vote transaction payload' }, { status: 500 });
  }
} 