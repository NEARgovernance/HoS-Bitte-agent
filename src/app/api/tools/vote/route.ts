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

// Validate proposal is active and can be voted on
async function validateProposalForVoting(proposalId: number): Promise<boolean | NextResponse> {
  if (!VOTING_CONTRACT) {
    return NextResponse.json({ error: 'VOTING_CONTRACT environment variable not set' }, { status: 500 });
  }

  const payload = {
    jsonrpc: "2.0",
    id: "1",
    method: "query",
    params: {
      request_type: "call_function",
      finality: "final",
      account_id: VOTING_CONTRACT,
      method_name: "get_proposal",
      args_base64: Buffer.from(JSON.stringify({ proposal_id: proposalId })).toString("base64"),
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
      return NextResponse.json({ error: `Proposal ${proposalId} does not exist` }, { status: 400 });
    }

    // Convert byte array to string, then parse JSON
    const bytes = json.result.result;
    const raw = Buffer.from(bytes).toString("utf-8");
    const proposal = JSON.parse(raw);

    // Check if proposal is active for voting
    if ( proposal.status !== 'Voting') {
      return NextResponse.json({ 
        error: `Proposal ${proposalId} is not active for voting. Current status: ${proposal.status}` 
      }, { status: 400 });
    }

    // Check if voting deadline has passed
    if (proposal.deadline) {
      const deadline = new Date(proposal.deadline);
      const now = new Date();
      if (now > deadline) {
        return NextResponse.json({ 
          error: `Voting deadline for proposal ${proposalId} has passed` 
        }, { status: 400 });
      }
    }

    return true;
  } catch (error) {
    console.error('Error validating proposal:', error);
    return NextResponse.json({ error: 'Failed to validate proposal' }, { status: 500 });
  }
}

// Check veNEAR balance and voting power
async function checkVeNearBalance(accountId: string): Promise<{ hasVotingPower: boolean; votingPower: string } | NextResponse> {
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
      method_name: "ft_balance_of",
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
      return NextResponse.json({ error: `No veNEAR balance found for ${accountId}` }, { status: 400 });
    }

    // Convert byte array to string, then parse JSON
    const bytes = json.result.result;
    const raw = Buffer.from(bytes).toString("utf-8");
    const balance = JSON.parse(raw);

    const votingPower = balance || '0';
    const hasVotingPower = BigInt(votingPower) > BigInt(0);

    return {
      hasVotingPower,
      votingPower
    };
  } catch (error) {
    console.error('Error checking veNEAR balance:', error);
    return NextResponse.json({ error: 'Failed to check veNEAR balance' }, { status: 500 });
  }
}

// Define existing vote interface
interface ExistingVote {
  proposal_id: number;
  vote: string | number;
  timestamp?: string;
  voting_power?: string;
}

// Check if user has already voted on the proposal
async function checkExistingVote(accountId: string, proposalId: number): Promise<{ hasVoted: boolean; existingVote?: ExistingVote } | NextResponse> {
  if (!VOTING_CONTRACT) {
    return NextResponse.json({ error: 'VOTING_CONTRACT environment variable not set' }, { status: 500 });
  }

  const payload = {
    jsonrpc: "2.0",
    id: "1",
    method: "query",
    params: {
      request_type: "call_function",
      finality: "final",
      account_id: VOTING_CONTRACT,
      method_name: "get_vote",
      args_base64: Buffer.from(JSON.stringify({ 
        account_id: accountId,
        proposal_id: proposalId,
      })).toString("base64"),
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

    // If no result or empty result, user hasn't voted
    if (!json.result || !json.result.result || json.result.result.length === 0) {
      return { hasVoted: false };
    }

    // Convert byte array to string, then parse JSON
    const bytes = json.result.result;
    const raw = Buffer.from(bytes).toString("utf-8");
    const existingVote = JSON.parse(raw);

    return {
      hasVoted: true,
      existingVote
    };
  } catch (error) {
    console.error('Error checking existing vote:', error);
    return NextResponse.json({ error: 'Failed to check existing vote' }, { status: 500 });
  }
}

// Fetch merkle proof and vAccount from veNEAR contract
async function getProof(accountId: string): Promise<{ merkleProof: string; vAccount: string } | NextResponse> {
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
      args_base64: Buffer.from(JSON.stringify({ 
        account_id: accountId,
      })).toString("base64"),
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
      return NextResponse.json({ error: `No proof found for account ${accountId}` }, { status: 400 });
    }

    // Convert byte array to string, then parse JSON
    const bytes = json.result.result;
    const raw = Buffer.from(bytes).toString("utf-8");
    const proofData = JSON.parse(raw);
    console.log(proofData);
    return {
      merkleProof: proofData[0],
      vAccount: proofData[1] 
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

    // Validate required fields
    if (!proposalId) {
      return NextResponse.json({ 
        error: 'proposalId is required' 
      }, { status: 400 });
    }

    if (!vote) {
      return NextResponse.json({ 
        error: 'vote is required (voting option text)' 
      }, { status: 400 });
    }

    if (!accountId) {
      return NextResponse.json({ 
        error: 'accountId is required' 
      }, { status: 400 });
    }


    // Validate proposal ID
    const id = parseInt(proposalId);
    if (isNaN(id) || id < 0) {
      return NextResponse.json({ 
        error: 'proposalId must be a valid positive number' 
      }, { status: 400 });
    }

    if (!VOTING_CONTRACT) {
      return NextResponse.json({ 
        error: 'VOTING_CONTRACT environment variable not set' 
      }, { status: 500 });
    }

    // Fetch proposal details
    const proposalPayload = {
      jsonrpc: "2.0",
      id: "1",
      method: "query",
      params: {
        request_type: "call_function",
        finality: "final",
        account_id: VOTING_CONTRACT,
        method_name: "get_proposal",
        args_base64: Buffer.from(JSON.stringify({ proposal_id: id })).toString("base64"),
      },
    };
    const proposalRes = await fetch(NEAR_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proposalPayload),
    });
    if (!proposalRes.ok) {
      return NextResponse.json({ error: `RPC request failed: ${proposalRes.status}` }, { status: 500 });
    }
    const proposalJson = await proposalRes.json();
    if (proposalJson.error) {
      return NextResponse.json({ error: `RPC error: ${proposalJson.error.message}` }, { status: 500 });
    }
    if (!proposalJson.result || !proposalJson.result.result || proposalJson.result.result.length === 0) {
      return NextResponse.json({ error: `Proposal ${proposalId} does not exist` }, { status: 400 });
    }
    const proposalBytes = proposalJson.result.result;
    const proposalRaw = Buffer.from(proposalBytes).toString("utf-8");
    const proposal = JSON.parse(proposalRaw);

    // Check if proposal has voting options
    if (!proposal.voting_options || !Array.isArray(proposal.voting_options)) {
      return NextResponse.json({ 
        error: 'Proposal does not have valid voting options' 
      }, { status: 400 });
    }


    // Find the index of the voting option
    const voteIndex = proposal.voting_options.findIndex((option: string) => option === vote);
    if (voteIndex === -1) {
      return NextResponse.json({ 
        error: `Invalid vote option "${vote}". Available options: ${proposal.voting_options.map((opt: string, idx: number) => `${idx}: "${opt}"`).join(', ')}` 
      }, { status: 400 });
    }

    // Validate proposal is active for voting
    const validationResult = await validateProposalForVoting(id);
    if (validationResult instanceof NextResponse) {
      return validationResult;
    }

    // Check veNEAR balance and voting power
    const balanceResult = await checkVeNearBalance(accountId);
    if (balanceResult instanceof NextResponse) {
      return balanceResult;
    }
    const { hasVotingPower, votingPower } = balanceResult;

    if (!hasVotingPower) {
      return NextResponse.json({ 
        error: `Account ${accountId} has no voting power. Current voting power: ${votingPower}` 
      }, { status: 400 });
    }

    // Check if user has already voted on this proposal
    const existingVoteResult = await checkExistingVote(accountId, id);
    if (existingVoteResult instanceof NextResponse) {
      return existingVoteResult;
    }
    const { hasVoted, existingVote } = existingVoteResult;

    if (hasVoted) {
      return NextResponse.json({ 
        error: `Account ${accountId} has already voted on proposal ${id}. Existing vote: ${JSON.stringify(existingVote)}` 
      }, { status: 400 });
    }

    // Fetch merkle proof and vAccount
    const proofResult = await getProof(accountId);
    if (proofResult instanceof NextResponse) {
      return proofResult;
    }
    const { merkleProof, vAccount } = proofResult;

    // Convert Tgas to gas units (House of Stake voting typically uses 200 Tgas)
    const gasResult = tgasToGas("200");
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
            gas: gasResult, // 200 Tgas
            deposit: parseNearAmount("0.00125"), // No deposit required for voting
            args: {
              proposal_id: id,
              vote: voteIndex,
              merkle_proof: merkleProof,
              v_account: vAccount,
            }
          }
        }
      ]
    };

    return NextResponse.json({ 
      transactionPayload,
      votingInfo: {
        accountId,
        votingPower,
        proposalId: id,
        vote: voteIndex,
        voteOption: vote,
        hasVoted: false,
        existingVote: null
      }
    });

  } catch (error) {
    console.error('Error generating vote transaction payload:', error);
    return NextResponse.json({ error: 'Failed to generate vote transaction payload' }, { status: 500 });
  }
} 