# Governance Bot API Tools

This directory contains API endpoints for the NEAR governance bot functionality. These endpoints provide access to proposal data and event handling capabilities.

## Environment Variables

The following environment variables are required:

- `VOTING_CONTRACT`: The NEAR contract address for the voting system
- `NEAR_RPC_URL`: (Optional) NEAR RPC endpoint (defaults to testnet)

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

### 4. Create NEAR Transaction
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

### 5. Get Votes for Proposal
**GET** `/api/tools/get-votes?proposalId={id}`

Gets all votes for a specific proposal to track decision split.

**Parameters:**
- `proposalId` (required): The ID of the proposal to get votes for

**Response:**
```json
{
  "proposalId": "123",
  "votes": [
    {
      "voter": "user1.near",
      "vote": "Yes",
      "voting_power": "1000000000000000000000000",
      "timestamp": "2024-01-01T00:00:00Z"
    },
    {
      "voter": "user2.near",
      "vote": "No",
      "voting_power": "500000000000000000000000",
      "timestamp": "2024-01-01T01:00:00Z"
    }
  ],
  "decisionSplit": {
    "total": 2,
    "yes": 1,
    "no": 1,
    "abstain": 0,
    "yesPercentage": "50.00",
    "noPercentage": "50.00",
    "abstainPercentage": "0.00"
  }
}
```

### 6. Get Delegators for Account
**GET** `/api/tools/get-delegators?accountId={account}`

Gets all delegators for a specific account to provide voter-delegate context.

**Parameters:**
- `accountId` (required): The NEAR account ID to get delegators for

**Response:**
```json
{
  "accountId": "delegate.near",
  "delegators": [
    {
      "delegator": "voter1.near",
      "delegated_power": "1000000000000000000000000",
      "delegation_date": "2024-01-01T00:00:00Z"
    },
    {
      "delegator": "voter2.near",
      "delegated_power": "500000000000000000000000",
      "delegation_date": "2024-01-01T01:00:00Z"
    }
  ],
  "delegationStats": {
    "accountId": "delegate.near",
    "totalDelegators": 2,
    "totalDelegatedPower": "1500000000000000000000000",
    "averageDelegation": "750000000000000000000000"
  }
}
```

### 7. Create Proposal Transaction
**GET** `/api/tools/create-proposal?title={title}&description={description}&link={link}&votingOptions={options}`

Creates a NEAR transaction payload for creating a new governance proposal.

**Parameters:**
- `title` (required): The title of the proposal
- `description` (required): The description of the proposal
- `link` (optional): Link to additional information
- `votingOptions` (required): Comma-separated list of voting options (e.g., "Yes,No,Abstain")

**Response:**
```json
{
  "transactionPayload": {
    "receiverId": "voting.contract.near",
    "actions": [
      {
        "type": "FunctionCall",
        "params": {
          "methodName": "create_proposal",
          "gas": "100000000000000",
          "deposit": "200000000000000000000000",
          "args": {
            "metadata": {
              "title": "Proposal Title",
              "description": "Detailed description of the proposal...",
              "link": "https://forum.near.org/t/proposal-discussion",
              "voting_options": ["Yes", "No", "Abstain"]
            }
          }
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

### Get recent active proposals
```bash
curl "http://localhost:3000/api/tools/fetch-recent-active-proposals?count=10"
``` 