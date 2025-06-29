# API Testing Examples

This file contains examples of how to test the governance bot API endpoints.

## Prerequisites

1. Set up your environment variables in `.env.local`:
```env
VOTING_CONTRACT=your.voting.contract.near
NEAR_RPC_URL=https://rpc.testnet.near.org
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
MONGO_URI=your_mongodb_connection_string
WEBHOOK_URL=your_webhook_url
```

2. Start your Next.js development server:
```bash
npm run dev
# or
pnpm dev
```

## Testing Examples

### 1. Get a Specific Proposal

```bash
# Test with a valid proposal ID
curl "http://localhost:3000/api/tools/get-proposal?proposalId=1"

# Expected response:
{
  "proposal": {
    "id": 1,
    "title": "Example Proposal",
    "description": "This is an example proposal...",
    "link": "https://example.com",
    "deadline": "2024-12-31T23:59:59Z",
    "voting_power": "1000000000000000000000000"
  }
}
```

### 2. Fetch Recent Proposals

```bash
# Get the 5 most recent proposals (default)
curl "http://localhost:3000/api/tools/fetch-recent-proposals"

# Get the 10 most recent proposals
curl "http://localhost:3000/api/tools/fetch-recent-proposals?count=10"

# Expected response:
{
  "proposals": [
    {
      "id": 5,
      "title": "Latest Proposal",
      "description": "This is the latest proposal...",
      "status": "active"
    },
    {
      "id": 4,
      "title": "Previous Proposal",
      "description": "This is a previous proposal...",
      "status": "completed"
    }
  ],
  "totalCount": 5,
  "fromIndex": 0,
  "limit": 10
}
```

### 3. Fetch Recent Active Proposals

```bash
# Get the 5 most recent approved proposals (default)
curl "http://localhost:3000/api/tools/fetch-recent-active-proposals"

# Get the 3 most recent approved proposals
curl "http://localhost:3000/api/tools/fetch-recent-active-proposals?count=3"

# Expected response:
{
  "proposals": [
    {
      "id": 3,
      "title": "Active Proposal",
      "description": "This proposal is currently active for voting...",
      "snapshot_block": 12345678,
      "total_voting_power": "5000000000000000000000000"
    }
  ],
  "totalCount": 3,
  "fromIndex": 0,
  "limit": 3
}
```

### 4. Handle New Proposal Event

```bash
curl -X POST "http://localhost:3000/api/tools/handle-new-proposal" \
  -H "Content-Type: application/json" \
  -d '{
    "proposalId": "123",
    "eventDetails": {
      "title": "New Feature Proposal",
      "description": "This proposal suggests adding a new feature to the platform that will improve user experience and increase engagement.",
      "link": "https://forum.near.org/t/new-feature-proposal"
    }
  }'

# Expected response:
{
  "success": true,
  "proposalId": "123",
  "message": "📥 <b>New Proposal</b>\n\n<b>New Feature Proposal</b>\n\nThis proposal suggests adding a new feature to the platform that will improve user experience and increase engagement.\n\n🗳️ <a href=\"https://near.vote/proposal/123\">VOTE HERE</a>\n🔗 <a href=\"https://forum.near.org/t/new-feature-proposal\">More Info</a>",
  "proposal": null,
  "eventDetails": {
    "title": "New Feature Proposal",
    "description": "This proposal suggests adding a new feature to the platform that will improve user experience and increase engagement.",
    "link": "https://forum.near.org/t/new-feature-proposal"
  }
}
```

### 5. Handle Proposal Approval Event

```bash
curl -X POST "http://localhost:3000/api/tools/handle-proposal-approval" \
  -H "Content-Type: application/json" \
  -d '{
    "proposalId": "123",
    "eventDetails": {
      "title": "New Feature Proposal",
      "description": "This proposal suggests adding a new feature to the platform that will improve user experience and increase engagement.",
      "link": "https://forum.near.org/t/new-feature-proposal"
    },
    "currentStatus": "Pending"
  }'

# Expected response:
{
  "success": true,
  "proposalId": "123",
  "message": "🗳️ <b>Proposal Approved for Voting</b>\n\n<b>New Feature Proposal</b>\n\nThis proposal suggests adding a new feature to the platform that will improve user experience and increase engagement.\n\n📊 <b>Voting Snapshot:</b>\n   Block: 12345678\n   Total Power: 1000000000000000000000000 veNEAR\n\n🗳️ <a href=\"https://near.vote/proposal/123\">VOTE HERE</a>\n🔗 <a href=\"https://forum.near.org/t/new-feature-proposal\">More Info</a>",
  "proposal": {
    "id": 123,
    "title": "New Feature Proposal",
    "description": "This proposal suggests adding a new feature to the platform that will improve user experience and increase engagement.",
    "snapshot_block": 12345678,
    "total_voting_power": "1000000000000000000000000"
  },
  "eventDetails": {
    "title": "New Feature Proposal",
    "description": "This proposal suggests adding a new feature to the platform that will improve user experience and increase engagement.",
    "link": "https://forum.near.org/t/new-feature-proposal"
  },
  "newStatus": "Approved"
}
```

### 6. Create NEAR Transaction

```bash
# Create a transaction to send 1 NEAR
curl "http://localhost:3000/api/tools/create-near-transaction?receiverId=user.near&amount=1"

# Expected response:
{
  "transactionPayload": {
    "receiverId": "user.near",
    "actions": [
      {
        "type": "Transfer",
        "params": {
          "deposit": "1000000000000000000000000"
        }
      }
    ]
  }
}

# Create a transaction to send 0.5 NEAR
curl "http://localhost:3000/api/tools/create-near-transaction?receiverId=user.near&amount=0.5"

# Expected response:
{
  "transactionPayload": {
    "receiverId": "user.near",
    "actions": [
      {
        "type": "Transfer",
        "params": {
          "deposit": "500000000000000000000000"
        }
      }
    ]
  }
}
```

## Error Testing

### Test Missing Parameters

```bash
# Missing proposalId
curl "http://localhost:3000/api/tools/get-proposal"

# Expected response:
{
  "error": "proposalId is required"
}

# Missing receiverId
curl "http://localhost:3000/api/tools/create-near-transaction?amount=1"

# Expected response:
{
  "error": "receiverId and amount are required parameters"
}
```

### Test Invalid Parameters

```bash
# Invalid proposal ID
curl "http://localhost:3000/api/tools/get-proposal?proposalId=invalid"

# Expected response:
{
  "error": "Failed to fetch proposal",
  "details": "Invalid proposal ID"
}

# Invalid count parameter
curl "http://localhost:3000/api/tools/fetch-recent-proposals?count=100"

# Expected response:
{
  "error": "count must be a number between 1 and 50"
}
```

### Test Missing Environment Variables

```bash
# If VOTING_CONTRACT is not set
curl "http://localhost:3000/api/tools/get-proposal?proposalId=1"

# Expected response:
{
  "error": "VOTING_CONTRACT environment variable not set"
}
```

## JavaScript/TypeScript Examples

### Using fetch API

```javascript
// Fetch a proposal
async function fetchProposal(proposalId) {
  const response = await fetch(`/api/tools/get-proposal?proposalId=${proposalId}`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error);
  }
  
  return data.proposal;
}

// Handle new proposal event
async function handleNewProposal(proposalId, eventDetails) {
  const response = await fetch('/api/tools/handle-new-proposal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      proposalId,
      eventDetails
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error);
  }
  
  return data;
}

// Usage
try {
  const proposal = await fetchProposal('123');
  console.log('Proposal:', proposal);
  
  const result = await handleNewProposal('123', {
    title: 'Test Proposal',
    description: 'This is a test proposal'
  });
  console.log('Message:', result.message);
} catch (error) {
  console.error('Error:', error.message);
}
```

### Using axios

```javascript
import axios from 'axios';

// Fetch recent proposals
async function getRecentProposals(count = 5) {
  try {
    const response = await axios.get(`/api/tools/fetch-recent-proposals?count=${count}`);
    return response.data.proposals;
  } catch (error) {
    console.error('Error fetching proposals:', error.response?.data?.error || error.message);
    throw error;
  }
}

// Handle proposal approval
async function handleProposalApproval(proposalId, eventDetails, currentStatus) {
  try {
    const response = await axios.post('/api/tools/handle-proposal-approval', {
      proposalId,
      eventDetails,
      currentStatus
    });
    return response.data;
  } catch (error) {
    console.error('Error handling approval:', error.response?.data?.error || error.message);
    throw error;
  }
}
```

## Integration with Telegram Bot

These API endpoints can be integrated with a Telegram bot to send notifications:

```javascript
// Example: Send proposal notification to Telegram
async function sendProposalNotification(proposalId, eventDetails) {
  try {
    // Get formatted message from API
    const result = await handleNewProposal(proposalId, eventDetails);
    
    // Send to Telegram (you would implement this)
    await sendTelegramMessage(result.message);
    
    console.log('Notification sent successfully');
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}
``` 