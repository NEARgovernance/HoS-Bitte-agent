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

### 8. Vote on Proposal
**GET** `/api/tools/vote?proposalId={id}&vote={choice}&accountId={account}&snapshotBlockHeight={block}`

Creates a NEAR transaction payload for voting on a governance proposal. The endpoint automatically fetches the required merkle proof and vAccount from the veNEAR contract.

**Parameters:**
- `proposalId` (required): The ID of the proposal to vote on
- `vote` (required): The vote choice ("Yes", "No", or "Abstain")
- `accountId` (required): The NEAR account ID of the voter
- `snapshotBlockHeight` (required): The snapshot block height for the proposal

**Response:**
```json
{
  "transactionPayload": {
    "receiverId": "voting.contract.near",
    "actions": [
      {
        "type": "FunctionCall",
        "params": {
          "methodName": "vote",
          "gas": "300000000000000",
          "deposit": "0",
          "args": {
            "proposal_id": 123,
            "vote": "Yes",
            "merkle_proof": "eyJwcm9vZiI6InNvbWUtbWVya2xlLXByb29mLWRhdGEifQ==",
            "v_account": "voter.near"
          }
        }
      }
    ]
  },
  "vote": {
    "proposalId": 123,
    "vote": "Yes",
    "accountId": "voter.near",
    "snapshotBlockHeight": 12345678,
    "merkleProof": "eyJwcm9vZiI6InNvbWUtbWVya2xlLXByb29mLWRhdGEifQ==",
    "vAccount": "voter.near"
  }
}
```

### 9. Get veNEAR Balance
**GET** `/api/tools/get-venear-balance?accountId={account}`

Gets veNEAR balance and voting power information for a specific account.

**Parameters:**
- `accountId` (required): The NEAR account ID to get veNEAR balance for

**Response:**
```json
{
  "accountId": "user.near",
  "balance": {
    "raw": "1000000000000000000000000",
    "nears": "1.000000"
  },
  "lockedBalance": {
    "raw": "500000000000000000000000",
    "nears": "0.500000"
  },
  "unlockTime": "2024-12-31T23:59:59Z",
  "votingPower": {
    "raw": "1000000000000000000000000",
    "nears": "1.000000"
  },
  "delegationPower": {
    "raw": "200000000000000000000000",
    "nears": "0.200000"
  },
  "totalPower": {
    "raw": "1200000000000000000000000",
    "nears": "1.200000"
  },
  "metadata": {
    "contract": "venear.near",
    "token": "veNEAR",
    "description": "Voting power and delegation information for House of Stake governance"
  }
}
```

### 10. Search Proposals
**GET** `/api/tools/search-proposal?q={query}&status={status}&sort={sort}&limit={limit}&searchType={type}`

Searches through all governance proposals using AI-powered semantic search, traditional keyword search, or hybrid search. Supports full-text search across titles, descriptions, and status with vector embeddings for better relevance.

**Parameters:**
- `q` (optional): Search query to find proposals by title, description, or ID
- `status` (optional): Filter by proposal status (e.g., "active", "completed", "pending")
- `sort` (optional): Sort order for results - "relevance", "newest", "oldest", "id" (default: relevance)
- `limit` (optional): Maximum number of proposals to return (1-100, default: 50)
- `searchType` (optional): Search type - "semantic" (AI-powered), "traditional" (keyword-based), "hybrid" (combines both, default)

**Response:**
```json
{
  "proposals": [
    {
      "id": 123,
      "title": "Treasury Funding Proposal",
      "description": "This proposal requests funding for community initiatives...",
      "status": "active"
    }
  ],
  "search": {
    "query": "treasury funding",
    "status": "active",
    "sortBy": "relevance",
    "searchType": "hybrid",
    "totalFound": 5,
    "limit": 50
  },
  "statistics": {
    "totalFound": 5,
    "limit": 50,
    "statusCounts": {
      "active": 3,
      "completed": 2
    },

  },
  "metadata": {
    "contract": "voting.contract.near",
    "description": "Search results for House of Stake governance proposals"
  }
}
```

### Search proposals
```bash
# Hybrid search (default)
curl "http://localhost:3000/api/tools/search-proposal?q=treasury&status=active&sort=relevance&limit=20"

# Semantic search only
curl "http://localhost:3000/api/tools/search-proposal?q=treasury&searchType=semantic&limit=20"

# Traditional keyword search only
curl "http://localhost:3000/api/tools/search-proposal?q=treasury&searchType=traditional&limit=20"
```

## JavaScript Usage Examples

### Search Proposals

```javascript
// Basic search by query (hybrid by default)
const searchProposals = async (query) => {
  const response = await fetch(`/api/tools/search-proposal?q=${encodeURIComponent(query)}`);
  const data = await response.json();
  console.log('Search results:', data.proposals);
  console.log('Total found:', data.search.totalFound);
  console.log('Search type used:', data.search.searchType);
};

// Semantic search only
const semanticSearch = async (query) => {
  const response = await fetch(`/api/tools/search-proposal?q=${encodeURIComponent(query)}&searchType=semantic`);
  const data = await response.json();
  console.log('Semantic search results:', data.proposals);
  console.log('Search type:', data.search.searchType);
};

// Traditional keyword search only
const traditionalSearch = async (query) => {
  const response = await fetch(`/api/tools/search-proposal?q=${encodeURIComponent(query)}&searchType=traditional`);
  const data = await response.json();
  console.log('Traditional search results:', data.proposals);
  console.log('Search type:', data.search.searchType);
};

// Advanced search with filters
const advancedSearch = async () => {
  const params = new URLSearchParams({
    q: 'treasury funding',
    status: 'active',
    sort: 'relevance',
    limit: '25'
  });
  
  const response = await fetch(`/api/tools/search-proposal?${params}`);
  const data = await response.json();
  
  console.log(`Found ${data.search.totalFound} proposals`);
  console.log('Status breakdown:', data.statistics.statusCounts);

  
  // Process search results
  data.proposals.forEach(proposal => {
    console.log(`Proposal ${proposal.id}: ${proposal.title}`);
    console.log(`Status: ${proposal.status}`);

  });
};

// Search by proposal ID
const searchById = async (id) => {
  const response = await fetch(`/api/tools/search-proposal?q=${id}`);
  const data = await response.json();
  return data.proposals[0]; // Should return the specific proposal
};

// Search with error handling
const searchWithErrorHandling = async (query) => {
  try {
    const response = await fetch(`/api/tools/search-proposal?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Error searching proposals:', error);
    return null;
  }
};
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
- `OPENAI_API_KEY`: OpenAI API key for semantic search embeddings (required for semantic and hybrid search)

## Usage Examples

### Get Proposal Details
```bash
curl "http://localhost:3000/api/tools/get-proposal?proposalId=123"
```

### Get recent active proposals
```bash
curl "http://localhost:3000/api/tools/fetch-recent-active-proposals?count=10"
``` 

 