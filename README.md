# NEAR Governance Bot API

A comprehensive API for NEAR governance bot functionality, providing endpoints for proposal management, voting, account state queries, and blockchain interactions. Built for House of Stake (HoS) governance system.

## Features

- **Proposal Management**: Fetch, search, and create governance proposals
- **Voting System**: Vote on proposals with automatic merkle proof generation
- **Account State**: Comprehensive account balance and voting power queries
- **Delegation Tracking**: Monitor delegators and delegation statistics
- **AI-Powered Search**: Semantic search through proposals using OpenAI
- **Transaction Generation**: Create NEAR transaction payloads for governance actions

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- NEAR account with access to governance contracts
- OpenAI API key (for semantic search functionality)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd HoS-Bittie-agent-1

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
pnpm dev
```

### Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run tests
pnpm test
```

## Environment Variables

This project requires several environment variables to be configured. Create a `.env` file in the root directory with the following variables:

### Required Environment Variables

- `VOTING_CONTRACT`: The NEAR contract address for the voting system
  - Example: `voting.contract.near`
  - Used by: All governance-related endpoints

- `VENEAR_CONTRACT_ID`: The veNEAR contract address for voting power and delegation
  - Example: `venear.near`
  - Used by: Vote endpoint, balance endpoints

- `ACCOUNT_ID`: Your NEAR account ID for the AI plugin configuration
  - Example: `your-account.near`
  - Used by: AI plugin metadata

- `PLUGIN_URL`: The base URL for the AI plugin (used in OpenAPI spec)
  - Example: `http://localhost:3000` (development)
  - Example: `https://your-domain.com` (production)
  - Used by: AI plugin OpenAPI specification

### Optional Environment Variables

- `NEAR_RPC_URL`: NEAR RPC endpoint (defaults to testnet if not provided)
  - Example: `https://rpc.testnet.near.org` (testnet)
  - Example: `https://rpc.mainnet.near.org` (mainnet)
  - Used by: All blockchain interaction endpoints

- `OPENAI_API_KEY`: OpenAI API key for semantic search functionality
  - Required for: `/api/tools/search-proposal` endpoint
  - Used by: AI-powered proposal search

### Example `.env` File

```bash
# Required
VOTING_CONTRACT=voting.contract.near
VENEAR_CONTRACT_ID=venear.near
ACCOUNT_ID=your-account.near
PLUGIN_URL=http://localhost:3000

# Optional
NEAR_RPC_URL=https://rpc.testnet.near.org
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Environment Setup

1. **Copy the example**: Create a `.env` file in the project root
2. **Fill in your values**: Replace the placeholder values with your actual contract addresses and account IDs
3. **Restart the server**: After updating environment variables, restart your development server
4. **Verify configuration**: Test an endpoint to ensure all variables are properly set

### Network Configuration

- **Testnet**: Use testnet contract addresses and `https://rpc.testnet.near.org`
- **Mainnet**: Use mainnet contract addresses and `https://rpc.mainnet.near.org`

### Security Notes

- Never commit your `.env` file to version control
- Keep your API keys secure and rotate them regularly
- Use different accounts for development and production

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── ai-plugin/          # OpenAPI specification
│   │   └── tools/              # API endpoints
│   │       ├── get-proposal/           # Get proposal details
│   │       ├── get-recent-proposals/   # Fetch recent proposals
│   │       ├── get-recent-active-proposals/ # Fetch active proposals
│   │       ├── get-votes/              # Get proposal votes
│   │       ├── get-delegators/         # Get account delegators
│   │       ├── create-proposal/        # Create proposal transaction
│   │       ├── vote/                   # Vote on proposal
│   │       ├── get-account-balance/    # Get NEAR balance
│   │       ├── get-venear-balance/     # Get veNEAR balance
│   │       ├── get-account-state/      # Get comprehensive account state
│   │       ├── lookup-state/           # Alias for get-account-state
│   │       └── search-proposal/        # AI-powered proposal search
│   ├── config.ts               # Configuration and constants
│   ├── layout.tsx              # App layout
│   └── page.tsx                # Home page
├── public/                     # Static assets
└── package.json                # Dependencies and scripts
```

## Architecture

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **NEAR Protocol**: Blockchain integration via RPC calls
- **OpenAI**: AI-powered semantic search
- **OpenAPI 3.0**: Standard API specification for AI assistants

## API Documentation

The API follows OpenAPI 3.0 specification and is designed to work with AI assistants. Access the full specification at:

```
GET /api/ai-plugin
```

This endpoint returns the complete OpenAPI specification that can be consumed by AI assistants and other tools.

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

### 4. Get Votes for Proposal
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

### 5. Get Delegators for Account
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

### 6. Create Proposal Transaction
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

### 7. Vote on Proposal
**GET** `/api/tools/vote?proposalId={id}&vote={choice}&accountId={account}`

Creates a NEAR transaction payload for voting on a governance proposal. The endpoint automatically fetches the required merkle proof and vAccount from the veNEAR contract.

**Parameters:**
- `proposalId` (required): The ID of the proposal to vote on
- `vote` (required): The voting option text (e.g., "Yes", "No", "Lebron James", etc.)
- `accountId` (required): The NEAR account ID of the voter

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
            "vote": 0,
            "merkle_proof": "eyJwcm9vZiI6InNvbWUtbWVya2xlLXByb29mLWRhdGEifQ==",
            "v_account": "voter.near"
          }
        }
      }
    ]
  },
  "vote": {
    "proposalId": 123,
    "vote": 0,
    "accountId": "voter.near",
    "merkleProof": "eyJwcm9vZiI6InNvbWUtbWVya2xlLXByb29mLWRhdGEifQ==",
    "vAccount": "voter.near"
  }
}
```

### 8. Get veNEAR Balance
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

### 9. Get Account Balance
**GET** `/api/tools/get-account-balance?accountId={account}`

Gets the NEAR account balance for a given account ID.

**Parameters:**
- `accountId` (required): The NEAR account ID to get balance for

**Response:**
```json
{
  "accountId": "user.near",
  "balance": {
    "raw": "5000000000000000000000000",
    "nears": "5.000000"
  },
  "metadata": {
    "description": "NEAR account balance information",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### 10. Get veNEAR Balance
**GET** `/api/tools/get-venear-balance?accountId={account}`

Gets comprehensive veNEAR balance information including both token balance (using `ft_balance_of`) and detailed balance information (using `get_accounts`).

**Parameters:**
- `accountId` (required): The NEAR account ID to get veNEAR balance for

**Response:**
```json
{
  "accountId": "user.near",
  "tokenBalance": {
    "raw": "1000000000000000000000000",
    "nears": "1.000000",
    "method": "ft_balance_of",
    "description": "Standard fungible token balance"
  },
  "detailedBalance": {
    "raw": "1000000000000000000000000",
    "nears": "1.000000",
    "lockedBalance": {
      "raw": "500000000000000000000000",
      "nears": "0.500000"
    },
    "votingPower": {
      "raw": "1000000000000000000000000",
      "nears": "1.000000"
    },
    "delegationPower": {
      "raw": "0",
      "nears": "0.000000"
    },
    "totalPower": {
      "raw": "1000000000000000000000000",
      "nears": "1.000000"
    },
    "unlockTime": "2025-01-01T00:00:00Z",
    "method": "get_accounts",
    "description": "Detailed balance with voting and delegation power"
  },
  "metadata": {
    "contract": "venear.near",
    "token": "veNEAR",
    "hasDetailedData": true,
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### 11. Get Account State
**GET** `/api/tools/lookup-state?accountId={account}`

Gets comprehensive account state including veNEAR balance, voting power, delegation status, and governance statistics.

**Parameters:**
- `accountId` (required): The NEAR account ID to get state for

**Response:**
```json
{
  "accountId": "user.near",
  "accountBalance": {
    "raw": "5000000000000000000000000",
    "nears": "5.000000"
  },
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
  "delegation": {
    "isDelegator": false,
    "isDelegate": true,
    "delegatedTo": null,
    "delegatorsCount": 5,
    "totalDelegatedPower": {
      "raw": "3000000000000000000000000",
      "nears": "3.000000"
    }
  },
  "voting": {
    "lastVote": {
      "proposal_id": 123,
      "vote": "Yes",
      "timestamp": "2024-01-01T00:00:00Z"
    },
    "statistics": {
      "total_votes": 15,
      "yes_votes": 10,
      "no_votes": 3,
      "abstain_votes": 2,
      "participation_rate": 75.5
    }
  },
  "lockup": {
    "isLockupDeployed": true,
    "lockupId": "lockup.user.near",
    "lockupBalance": {
      "raw": "2000000000000000000000000",
      "nears": "2.000000"
    },
    "lockupInfoReady": true,
    "lockedAmount": {
      "raw": "1500000000000000000000000",
      "nears": "1.500000"
    },
    "lockupLiquidOwnersBalance": {
      "raw": "500000000000000000000000",
      "nears": "0.500000"
    },
    "lockupLiquidAmount": {
      "raw": "300000000000000000000000",
      "nears": "0.300000"
    },
    "withdrawableAmount": {
      "raw": "200000000000000000000000",
      "nears": "0.200000"
    },
    "lockupPendingAmount": {
      "raw": "0",
      "nears": "0.000000"
    },
    "lockupUnlockTimestampNs": "1704067200000000000",
    "untilUnlock": "2024-12-31T23:59:59Z",
    "registrationCost": {
      "raw": "100000000000000000000000",
      "nears": "0.100000"
    },
    "lockupCost": {
      "raw": "50000000000000000000000",
      "nears": "0.050000"
    },
    "stakingPool": "staking.pool.near",
    "knownDepositedBalance": {
      "raw": "1800000000000000000000000",
      "nears": "1.800000"
    }
  },
  "metadata": {
    "contract": "venear.near",
    "votingContract": "voting.contract.near",
    "token": "veNEAR",
    "description": "Comprehensive account state for House of Stake governance",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### 12. Search Proposals
**GET** `/api/tools/search-proposal?q={query}&limit={limit}`

Searches through all governance proposals using AI-powered semantic search with vector embeddings for better relevance. Supports full-text search across titles and descriptions.

**Parameters:**
- `q` (optional): Search query to find proposals by title, description, or ID
- `limit` (optional): Maximum number of proposals to return (1-100, default: 50)


**Response:**
```json
{
  "proposals": [
    {
      "id": 123,
      "title": "Treasury Funding Proposal",
      "description": "This proposal requests funding for community initiatives...",
      "status": "active",
      "link": "https://example.com/proposal/123",
      "creation_time_ns": "1704067200000000000",
      "reviewer_id": "reviewer.near",
      "voting_start_time_ns": "1704153600000000000",
      "voting_duration_ns": "604800000000000"
    }
  ],
  "search": {
    "query": "treasury funding",
    "totalFound": 5,
    "limit": 50
  },
  "statistics": {
    "totalFound": 5,
    "limit": 50
  },
  "metadata": {
    "contract": "voting.contract.near",
    "description": "Search results for House of Stake governance proposals"
  }
}
```

### Get account balance
```bash
curl "http://localhost:3000/api/tools/get-account-balance?accountId=user.near"
```

### Get veNEAR balance
```bash
curl "http://localhost:3000/api/tools/get-venear-balance?accountId=user.near"
```

### Get account state
```bash
curl "http://localhost:3000/api/tools/lookup-state?accountId=user.near"
```

### Search proposals
```bash
curl "http://localhost:3000/api/tools/search-proposal?q=treasury&limit=20"
```

## JavaScript Usage Examples

### Get veNEAR Balance

```javascript
// Get comprehensive veNEAR balance
const getVeNEARBalance = async (accountId) => {
  const response = await fetch(`/api/tools/get-venear-balance?accountId=${accountId}`);
  const data = await response.json();
  console.log('veNEAR token balance:', data.tokenBalance.nears, 'NEAR');
  if (data.detailedBalance) {
    console.log('veNEAR voting power:', data.detailedBalance.votingPower.nears, 'NEAR');
    console.log('veNEAR locked balance:', data.detailedBalance.lockedBalance.nears, 'NEAR');
  }
  return data;
};

// Get veNEAR balance with error handling
const getVeNEARBalanceWithErrorHandling = async (accountId) => {
  try {
    const response = await fetch(`/api/tools/get-venear-balance?accountId=${accountId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Error fetching veNEAR balance:', error);
    return null;
  }
};

// Compare token balance with detailed balance
const compareVeNEARBalances = async (accountId) => {
  const balanceData = await getVeNEARBalanceWithErrorHandling(accountId);
  
  if (balanceData) {
    console.log('veNEAR token balance (ft_balance_of):', balanceData.tokenBalance.nears, 'NEAR');
    if (balanceData.detailedBalance) {
      console.log('veNEAR detailed balance (get_accounts):', balanceData.detailedBalance.nears, 'NEAR');
      console.log('Difference:', (parseFloat(balanceData.tokenBalance.nears) - parseFloat(balanceData.detailedBalance.nears)).toFixed(6), 'NEAR');
      console.log('Voting power:', balanceData.detailedBalance.votingPower.nears, 'NEAR');
      console.log('Delegation power:', balanceData.detailedBalance.delegationPower.nears, 'NEAR');
    } else {
      console.log('No detailed balance data available');
    }
  }
};
```

### Get Account State

```javascript
// Get comprehensive account state
const getAccountState = async (accountId) => {
  const response = await fetch(`/api/tools/get-account-state?accountId=${accountId}`);
  const data = await response.json();
  console.log('Account state:', data);
  console.log('Voting power:', data.votingPower.nears, 'NEAR');
  console.log('Delegation status:', data.delegation.isDelegate ? 'Delegate' : 'Voter');
  console.log('Total votes cast:', data.voting.statistics.total_votes);
};

// Get account state with error handling
const getAccountStateWithErrorHandling = async (accountId) => {
  try {
    const response = await fetch(`/api/tools/get-account-state?accountId=${accountId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Error fetching account state:', error);
    return null;
  }
};

// Check delegation status
const checkDelegationStatus = async (accountId) => {
  const data = await getAccountStateWithErrorHandling(accountId);
  if (data) {
    if (data.delegation.isDelegator) {
      console.log(`Account is delegating to: ${data.delegation.delegatedTo}`);
    } else if (data.delegation.isDelegate) {
      console.log(`Account is a delegate with ${data.delegation.delegatorsCount} delegators`);
      console.log(`Total delegated power: ${data.delegation.totalDelegatedPower.nears} NEAR`);
    } else {
      console.log('Account is voting directly');
    }
  }
};

// Get voting statistics
const getVotingStats = async (accountId) => {
  const data = await getAccountStateWithErrorHandling(accountId);
  if (data) {
    const stats = data.voting.statistics;
    console.log(`Voting participation: ${stats.participation_rate}%`);
    console.log(`Votes cast: ${stats.total_votes}`);
    console.log(`Yes votes: ${stats.yes_votes}`);
    console.log(`No votes: ${stats.no_votes}`);
    console.log(`Abstain votes: ${stats.abstain_votes}`);
  }
};

// Get lockup information
const getLockupInfo = async (accountId) => {
  const data = await getAccountStateWithErrorHandling(accountId);
  if (data) {
    const lockup = data.lockup;
    console.log(`Lockup deployed: ${lockup.isLockupDeployed}`);
    console.log(`Lockup ID: ${lockup.lockupId}`);
    console.log(`Lockup balance: ${lockup.lockupBalance.nears} NEAR`);
    console.log(`Locked amount: ${lockup.lockedAmount.nears} NEAR`);
    console.log(`Withdrawable amount: ${lockup.withdrawableAmount.nears} NEAR`);
    console.log(`Staking pool: ${lockup.stakingPool}`);
    console.log(`Until unlock: ${lockup.untilUnlock}`);
  }
};

// Check lockup status
const checkLockupStatus = async (accountId) => {
  const data = await getAccountStateWithErrorHandling(accountId);
  if (data) {
    const lockup = data.lockup;
    if (lockup.isLockupDeployed) {
      console.log('Account has lockup deployed');
      console.log(`Total lockup balance: ${lockup.lockupBalance.nears} NEAR`);
      console.log(`Locked for voting: ${lockup.lockedAmount.nears} NEAR`);
      console.log(`Available for withdrawal: ${lockup.withdrawableAmount.nears} NEAR`);
      console.log(`Liquid balance: ${lockup.lockupLiquidAmount.nears} NEAR`);
    } else {
      console.log('Account does not have lockup deployed');
    }
  }
};
```

### Search Proposals

```javascript
// Search proposals using semantic search
const searchProposals = async (query) => {
  const response = await fetch(`/api/tools/search-proposal?q=${encodeURIComponent(query)}`);
  const data = await response.json();
  console.log('Search results:', data.proposals);
  console.log('Total found:', data.search.totalFound);
};

// Advanced search with filters
const advancedSearch = async () => {
  const params = new URLSearchParams({
    q: 'treasury funding',
    limit: '25'
  });
  
  const response = await fetch(`/api/tools/search-proposal?${params}`);
  const data = await response.json();
  
  console.log(`Found ${data.search.totalFound} proposals`);
  
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
- `OPENAI_API_KEY`: OpenAI API key for semantic search embeddings (required)

## Usage Examples

### Get Proposal Details
```bash
curl "http://localhost:3000/api/tools/get-proposal?proposalId=123"
```

### Get recent active proposals
```bash
curl "http://localhost:3000/api/tools/fetch-recent-active-proposals?count=10"
``` 

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Test Examples

See `test-api.md` for comprehensive API testing examples including:

- **Success cases**: All endpoints with valid parameters
- **Error cases**: Missing parameters, invalid inputs, network errors
- **Edge cases**: Boundary conditions and unusual inputs
- **JavaScript examples**: Using fetch API and axios

### Manual Testing

```bash
# Start the development server
pnpm dev

# Test the OpenAPI specification
curl http://localhost:3000/api/ai-plugin

# Test a simple endpoint
curl "http://localhost:3000/api/tools/get-account-balance?accountId=test.near"
```

## Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/new-endpoint`
3. **Make your changes**: Follow the existing code patterns
4. **Add tests**: Include tests for new functionality
5. **Update documentation**: Update README.md and test-api.md
6. **Submit a pull request**: Include a clear description of changes

### Code Style

- Use TypeScript for type safety
- Follow existing naming conventions
- Add proper error handling
- Include JSDoc comments for complex functions
- Update OpenAPI specification for new endpoints

### Testing Guidelines

- Test all endpoints with valid and invalid inputs
- Include error handling tests
- Test edge cases and boundary conditions
- Verify OpenAPI specification accuracy
- Test with both testnet and mainnet configurations

## Troubleshooting

### Common Issues

**Environment Variables Not Set**
```
Error: VOTING_CONTRACT environment variable not set
```
Solution: Check your `.env` file and ensure all required variables are set.

**RPC Connection Issues**
```
Error: RPC request failed: 500
```
Solution: Verify your `NEAR_RPC_URL` and network connectivity.

**OpenAI API Errors**
```
Error: OpenAI API key not configured
```
Solution: Set your `OPENAI_API_KEY` in the `.env` file.

**Build Errors**
```
Error: TypeScript compilation failed
```
Solution: Run `pnpm install` and check for missing dependencies.

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=* pnpm dev
```

### Network Configuration

- **Testnet**: Use testnet contract addresses and RPC endpoint
- **Mainnet**: Use mainnet contract addresses and RPC endpoint
- **Local**: Use local NEAR node for development

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:

- Create an issue on GitHub
- Check the troubleshooting section
- Review the test examples in `test-api.md`
- Consult the NEAR documentation for blockchain-specific questions