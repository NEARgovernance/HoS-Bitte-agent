import { NextResponse } from 'next/server';
import { VOTING_CONTRACT, NEAR_RPC_URL } from '@/app/config';
import { parseNearAmount } from "near-api-js/lib/utils/format";

// Convert Tgas to gas units (1 Tgas = 10^12 gas)
function tgasToGas(tgas: string): string | NextResponse {
  const tgasValue = parseFloat(tgas);
  if (isNaN(tgasValue)) {
    return NextResponse.json({ error: 'Invalid Tgas amount' }, { status: 400 });
  }
  return (tgasValue * 1e12).toString();
}

// Define proposal interface
interface Proposal {
  id: number;
  title: string;
  description: string;
  status: string;
  link?: string;
  deadline?: string;
  voting_power?: string;
  snapshot_block?: number;
  total_voting_power?: string;
}

// Validate proposal can be approved
async function validateProposalForApproval(proposalId: number): Promise<{ proposal: Proposal; canApprove: boolean } | NextResponse> {
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

    // Check if proposal is in a state that can be approved
    const canApprove = proposal.status === 'Created' ;
    
    return {
      proposal,
      canApprove
    };
  } catch (error) {
    console.error('Error validating proposal:', error);
    return NextResponse.json({ error: 'Failed to validate proposal' }, { status: 500 });
  }
}

// Check if user has approval permissions
async function checkApprovalPermissions(accountId: string): Promise<{ hasPermission: boolean; role?: string } | NextResponse> {
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
      method_name: "get_config",
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
      return NextResponse.json({ error: 'Failed to fetch contract configuration' }, { status: 500 });
    }

    // Convert byte array to string, then parse JSON
    const bytes = json.result.result;
    const raw = Buffer.from(bytes).toString("utf-8");
    const config = JSON.parse(raw);

    // Check if user is in the reviewer_ids list
    const reviewerIds = config.reviewer_ids || [];
    const hasPermission = reviewerIds.includes(accountId);

    // Also check if user is the owner
    const isOwner = config.owner_account_id === accountId;
    const isGuardian = (config.guardians || []).includes(accountId);

    const finalPermission = hasPermission || isOwner || isGuardian;
    let role = 'none';
    
    if (isOwner) {
      role = 'owner';
    } else if (isGuardian) {
      role = 'guardian';
    } else if (hasPermission) {
      role = 'reviewer';
    }

    return {
      hasPermission: finalPermission,
      role
    };
  } catch (error) {
    console.error('Error checking approval permissions:', error);
    // If we can't check permissions, assume no permission for security
    return { hasPermission: false };
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const proposalId = searchParams.get('proposalId');
    const accountId = searchParams.get('accountId');

    // Validate required fields
    if (!proposalId) {
      return NextResponse.json({ 
        error: 'proposalId is required' 
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

    // Validate proposal can be approved
    const validationResult = await validateProposalForApproval(id);
    if (validationResult instanceof NextResponse) {
      return validationResult;
    }
    const { proposal, canApprove } = validationResult;

    if (!canApprove) {
      return NextResponse.json({ 
        error: `Proposal ${id} cannot be approved. Current status: ${proposal.status}. Only proposals with status 'Pending' or 'Draft' can be approved.` 
      }, { status: 400 });
    }

    // Check approval permissions
    const permissionResult = await checkApprovalPermissions(accountId);
    if (permissionResult instanceof NextResponse) {
      return permissionResult;
    }
    const { hasPermission, role } = permissionResult;

    if (!hasPermission) {
      return NextResponse.json({ 
        error: `Account ${accountId} does not have permission to approve proposals. Required role: owner, guardian, or reviewer. Current role: ${role || 'none'}` 
      }, { status: 403 });
    }

    // Convert Tgas to gas units (approval typically uses 150 Tgas)
    const gasResult = tgasToGas("150");
    if (gasResult instanceof NextResponse) {
      return gasResult;
    }

    // Create the approve transaction payload
    const transactionPayload = {
      receiverId: VOTING_CONTRACT,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "approve_proposal",
            gas: gasResult, // 150 Tgas
            deposit: parseNearAmount("0.0125"), // Small deposit for approval
            args: {
              proposal_id: id,
              voting_start_time_sec: null
            }
          }
        }
      ]
    };

    return NextResponse.json({ 
      transactionPayload
    });

  } catch (error) {
    console.error('Error generating approval transaction payload:', error);
    return NextResponse.json({ error: 'Failed to generate approval transaction payload' }, { status: 500 });
  }
} 