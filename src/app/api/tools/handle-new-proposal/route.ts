import { NextResponse } from 'next/server';
import { VOTING_CONTRACT, NEAR_RPC_URL } from '@/app/config';

// Fetch proposal details from NEAR RPC
async function fetchProposal(proposalId: string) {
  if (!VOTING_CONTRACT) {
    throw new Error('VOTING_CONTRACT environment variable not set');
  }

  const id = parseInt(proposalId);
  if (isNaN(id)) {
    throw new Error('Invalid proposal ID');
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
      args_base64: Buffer.from(JSON.stringify({ proposal_id: id })).toString("base64"),
    },
  };

  const res = await fetch(NEAR_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`RPC request failed: ${res.status}`);
  }

  const json = await res.json();

  if (json.error) {
    throw new Error(`RPC error: ${json.error.message}`);
  }

  if (!json.result || !json.result.result || json.result.result.length === 0) {
    throw new Error(`Proposal ${proposalId} does not exist`);
  }

  // Convert byte array to string, then parse JSON
  const bytes = json.result.result;
  const raw = Buffer.from(bytes).toString("utf-8");
  const proposal = JSON.parse(raw);

  return proposal;
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { proposalId, eventDetails } = body;

    if (!proposalId) {
      return NextResponse.json({ error: 'proposalId is required' }, { status: 400 });
    }

    if (!VOTING_CONTRACT) {
      return NextResponse.json({ error: 'VOTING_CONTRACT environment variable not set' }, { status: 500 });
    }

    console.log(`📝 Processing new proposal ${proposalId}`);

    let proposal = null;
    let title = eventDetails?.title || `Proposal #${proposalId}`;
    let description = eventDetails?.description || "";
    let link = eventDetails?.link;

    if (!eventDetails?.title || !eventDetails?.description) {
      try {
        proposal = await fetchProposal(proposalId);
        title = eventDetails?.title || proposal.title || `Proposal #${proposalId}`;
        description = eventDetails?.description || proposal.description || "";
        link = eventDetails?.link || proposal.link;
      } catch (error) {
        console.warn(
          `⚠️ Could not fetch full proposal details for ${proposalId}:`,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    // Format deadline (only if we fetched contract data)
    let deadlineText = "";
    if (proposal && (proposal.deadline || proposal.voting_end)) {
      const deadline = new Date(proposal.deadline || proposal.voting_end);
      const now = new Date();
      const timeLeft = deadline.getTime() - now.getTime();

      if (timeLeft > 0) {
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        deadlineText = `\n⏰ <b>Deadline:</b> ${days}d ${hours}h remaining`;
      }
    }

    // Format voting snapshot info (only if we fetched contract data)
    let snapshotText = "";
    if (
      proposal &&
      (proposal.snapshot_block || proposal.voting_power_snapshot)
    ) {
      const totalVotingPower = proposal.total_voting_power || "Unknown";
      snapshotText = `\n📊 <b>Voting Power:</b> ${totalVotingPower} veNEAR`;
    }

    // Build links section
    let linksText = `\n\n🗳️ <a href="https://near.vote/proposal/${proposalId}">VOTE HERE</a>`;
    if (link) {
      linksText += `\n🔗 <a href="${escapeHtml(link)}">More Info</a>`;
    }

    const message = `📥 <b>New Proposal</b>\n\n<b>${escapeHtml(
      title
    )}</b>\n\n${escapeHtml(
      description
    )}${deadlineText}${snapshotText}${linksText}`;

    // For now, we'll return the formatted message
    // In a real implementation, you would send this to Telegram chats
    return NextResponse.json({ 
      success: true,
      proposalId,
      message,
      proposal: proposal || null,
      eventDetails: eventDetails || null
    });

  } catch (error) {
    console.error('Error handling new proposal:', error);
    return NextResponse.json({ 
      error: 'Failed to handle new proposal',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 