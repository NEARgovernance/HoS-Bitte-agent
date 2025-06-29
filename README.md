# Governance Bot API Tools

This directory contains API endpoints for the NEAR governance bot functionality. These endpoints provide access to proposal data and event handling capabilities.

## Environment Variables

The following environment variables are required:

- `VOTING_CONTRACT`: The NEAR contract address for the voting system
- `NEAR_RPC_URL`: (Optional) NEAR RPC endpoint (defaults to testnet)
- `TELEGRAM_BOT_TOKEN`: Telegram bot token for notifications
- `MONGO_URI`: MongoDB connection string
- `WEBHOOK_URL`: Webhook URL for Telegram updates

## API Endpoints

### 1. Get Proposal Details
**GET** `/api/tools/get-proposal?proposalId={id}`

Gets detailed information about a specific proposal.

**Parameters:**
- `proposalId` (required): The ID of the proposal to get

**Response:**
```json
{
  "proposal": {
    "id": 123,
    "title": "Proposal Title",
    "description": "Proposal description...",
    "link": "https://example.com",
    "deadline": "2024-01-01T00:00:00Z",
    "voting_power": "1000000000000000000000000"
  }
}
```

### 2. Fetch Recent Proposals
**GET** `/api/tools/fetch-recent-proposals?count={number}`

Fetches the most recent proposals from the voting contract.

**Parameters:**
- `count` (optional): Number of proposals to fetch (1-50, default: 5)

**Response:**
```json
{
  "proposals": [
    {
      "id": 123,
      "title": "Proposal Title",
      "description": "Proposal description...",
      "status": "active"
    }
  ],
  "totalCount": 100,
  "fromIndex": 95,
  "limit": 5
}
```

### 3. Fetch Recent Active Proposals
**GET** `/api/tools/fetch-recent-active-proposals?count={number}`

Fetches the most recent proposals that have been approved for voting.

**Parameters:**
- `count` (optional): Number of proposals to fetch (1-50, default: 5)

**Response:**
```json
{
  "proposals": [
    {
      "id": 123,
      "title": "Proposal Title",
      "description": "Proposal description...",
      "snapshot_block": 12345678,
      "total_voting_power": "1000000000000000000000000"
    }
  ],
  "totalCount": 50,
  "fromIndex": 45,
  "limit": 5
}
```

### 4. Handle New Proposal Event
**POST** `/api/tools/handle-new-proposal`

Processes a new proposal submission event and formats a notification message.

**Request Body:**
```json
{
  "proposalId": "123",
  "eventDetails": {
    "title": "Proposal Title",
    "description": "Proposal description...",
    "link": "https://example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "proposalId": "123",
  "message": "📥 <b>New Proposal</b>\n\n<b>Proposal Title</b>\n\nProposal description...\n\n🗳️ <a href=\"https://near.vote/proposal/123\">VOTE HERE</a>",
  "proposal": {
    "id": 123,
    "title": "Proposal Title",
    "description": "Proposal description..."
  },
  "eventDetails": {
    "title": "Proposal Title",
    "description": "Proposal description..."
  }
}
```

### 5. Handle Proposal Approval Event
**POST** `/api/tools/handle-proposal-approval`

Processes a proposal approval event and formats a notification message.

**Request Body:**
```json
{
  "proposalId": "123",
  "eventDetails": {
    "title": "Proposal Title",
    "description": "Proposal description...",
    "link": "https://example.com"
  },
  "currentStatus": "Pending"
}
```

**Response:**
```json
{
  "success": true,
  "proposalId": "123",
  "message": "🗳️ <b>Proposal Approved for Voting</b>\n\n<b>Proposal Title</b>\n\nProposal description...\n\n📊 <b>Voting Snapshot:</b>\n   Block: 12345678\n   Total Power: 1000000000000000000000000 veNEAR\n\n🗳️ <a href=\"https://near.vote/proposal/123\">VOTE HERE</a>",
  "proposal": {
    "id": 123,
    "title": "Proposal Title",
    "description": "Proposal description...",
    "snapshot_block": 12345678
  },
  "eventDetails": {
    "title": "Proposal Title",
    "description": "Proposal description..."
  },
  "newStatus": "Approved"
}
```

### 6. Create NEAR Transaction
**GET** `/api/tools/create-near-transaction?receiverId={address}&amount={amount}`

Creates a NEAR transaction payload for transferring tokens.

**Parameters:**
- `receiverId` (required): The NEAR account ID to send tokens to
- `amount` (required): The amount of NEAR to send

**Response:**
```json
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
```

## Error Handling

All endpoints return appropriate HTTP status codes and error messages:

- `400`: Bad Request - Missing or invalid parameters
- `404`: Not Found - Proposal doesn't exist
- `500`: Internal Server Error - Server or RPC errors

Error responses include:
```json
{
  "error": "Error description",
  "details": "Additional error details"
}
```

## Configuration

The API uses centralized configuration from `@/app/config`:

- `NEAR_RPC_URL`: NEAR RPC endpoint (defaults to testnet)
- `VOTING_CONTRACT`: NEAR voting contract address

## Usage Examples

### Get Proposal Details
```bash
curl "http://localhost:3000/api/tools/get-proposal?proposalId=123"
```

### Handle a new proposal event
```bash
curl -X POST "http://localhost:3000/api/tools/handle-new-proposal" \
  -H "Content-Type: application/json" \
  -d '{
    "proposalId": "123",
    "eventDetails": {
      "title": "New Feature Proposal",
      "description": "This proposal suggests adding a new feature..."
    }
  }'
```

### Get recent active proposals
```bash
curl "http://localhost:3000/api/tools/fetch-recent-active-proposals?count=10"
``` 