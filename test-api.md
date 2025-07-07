# API Testing Examples

This file contains examples of how to test the governance bot API endpoints.

## Prerequisites

1. Set up your environment variables in `.env.local`:
```env
VOTING_CONTRACT=your.voting.contract.near
NEAR_RPC_URL=https://rpc.testnet.near.org
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

### 4. Create NEAR Transaction

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

### 5. Get Votes for Proposal

```bash
# Get votes for a specific proposal
curl "http://localhost:3000/api/tools/get-votes?proposalId=123"

# Expected response:
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
    },
    {
      "voter": "user3.near",
      "vote": "Abstain",
      "voting_power": "250000000000000000000000",
      "timestamp": "2024-01-01T02:00:00Z"
    }
  ],
  "decisionSplit": {
    "total": 3,
    "yes": 1,
    "no": 1,
    "abstain": 1,
    "yesPercentage": "33.33",
    "noPercentage": "33.33",
    "abstainPercentage": "33.33"
  }
}
```

### 6. Get Delegators for Account

```bash
# Get delegators for a specific account
curl "http://localhost:3000/api/tools/get-delegators?accountId=delegate.near"

# Expected response:
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
    },
    {
      "delegator": "voter3.near",
      "delegated_power": "750000000000000000000000",
      "delegation_date": "2024-01-01T02:00:00Z"
    }
  ],
  "delegationStats": {
    "accountId": "delegate.near",
    "totalDelegators": 3,
    "totalDelegatedPower": "2250000000000000000000000",
    "averageDelegation": "750000000000000000000000"
  }
}
```

### 7. Create Proposal Transaction

```bash
# Create a new proposal transaction
curl "http://localhost:3000/api/tools/create-proposal?title=Add%20New%20Feature%20to%20Platform&description=This%20proposal%20suggests%20adding%20a%20new%20feature%20that%20will%20improve%20user%20experience%20and%20increase%20platform%20adoption.&link=https://forum.near.org/t/add-new-feature-proposal&votingOptions=Yes,No,Abstain"

# Expected response:
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
              "title": "Add New Feature to Platform",
              "description": "This proposal suggests adding a new feature that will improve user experience and increase platform adoption.",
              "link": "https://forum.near.org/t/add-new-feature-proposal",
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

```bash
# Vote "Yes" on proposal 123
curl "http://localhost:3000/api/tools/vote?proposalId=123&vote=Yes&accountId=voter.near&snapshotBlockHeight=12345678"

# Expected response:
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

# Vote "No" on proposal 456
curl "http://localhost:3000/api/tools/vote?proposalId=456&vote=No&accountId=delegate.near&snapshotBlockHeight=12345679"

# Expected response:
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
            "proposal_id": 456,
            "vote": "No",
            "merkle_proof": "eyJwcm9vZiI6InNvbWUtbWVya2xlLXByb29mLWRhdGEifQ==",
            "v_account": "delegate.near"
          }
        }
      }
    ]
  },
  "vote": {
    "proposalId": 456,
    "vote": "No",
    "votingPower": "500000000000000000000000"
  }
}

# Vote "Abstain" on proposal 789
curl "http://localhost:3000/api/tools/vote?proposalId=789&vote=Abstain&accountId=user.near&snapshotBlockHeight=12345680"

# Expected response:
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
            "proposal_id": 789,
            "vote": "Abstain",
            "voting_power": "2500000000000000000000000"
          }
        }
      }
    ]
  },
  "vote": {
    "proposalId": 789,
    "vote": "Abstain",
    "votingPower": "2500000000000000000000000"
  }
}
```

### 9. Get veNEAR Balance

```bash
# Get veNEAR balance for a specific account
curl "http://localhost:3000/api/tools/get-venear-balance?accountId=user.near"

# Expected response:
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

# Get veNEAR balance for a delegate account
curl "http://localhost:3000/api/tools/get-venear-balance?accountId=delegate.near"

# Expected response:
{
  "accountId": "delegate.near",
  "balance": {
    "raw": "5000000000000000000000000",
    "nears": "5.000000"
  },
  "lockedBalance": null,
  "unlockTime": null,
  "votingPower": {
    "raw": "5000000000000000000000000",
    "nears": "5.000000"
  },
  "delegationPower": {
    "raw": "3000000000000000000000000",
    "nears": "3.000000"
  },
  "totalPower": {
    "raw": "8000000000000000000000000",
    "nears": "8.000000"
  },
  "metadata": {
    "contract": "venear.near",
    "token": "veNEAR",
    "description": "Voting power and delegation information for House of Stake governance"
  }
}
```

### 10. Search Proposals

```bash
# Basic search by query
curl "http://localhost:3000/api/tools/search-proposal?q=treasury"

# Expected response:
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
    },
    {
      "id": 124,
      "title": "Budget Allocation for Q4",
      "description": "Proposal to allocate treasury funds for Q4 projects...",
      "status": "pending",
      "link": "https://example.com/proposal/124",
      "creation_time_ns": "1703980800000000000",
      "reviewer_id": "reviewer.near",
      "voting_start_time_ns": "1704067200000000000",
      "voting_duration_ns": "604800000000000"
    }
  ],
  "search": {
    "query": "treasury",
    "sortBy": "relevance",
    "totalFound": 2,
    "limit": 50
  },
  "statistics": {
    "totalFound": 2,
    "limit": 50
  },
  "metadata": {
    "contract": "voting.contract.near",
    "description": "Search results for House of Stake governance proposals"
  }
}

# Search with filters
curl "http://localhost:3000/api/tools/search-proposal?q=security"

# Expected response:
{
  "proposals": [
    {
      "id": 125,
      "title": "Security Upgrade Implementation",
      "description": "Proposal to implement critical security upgrades...",
      "status": "active",
      "link": "https://example.com/proposal/125",
      "creation_time_ns": "1703894400000000000",
      "reviewer_id": "reviewer.near",
      "voting_start_time_ns": "1703980800000000000",
      "voting_duration_ns": "604800000000000"
    }
  ],
  "search": {
    "query": "security",
    "totalFound": 1,
    "limit": 50
  },
  "statistics": {
    "totalFound": 1,
    "limit": 50
  },
  "metadata": {
    "contract": "voting.contract.near",
    "description": "Search results for House of Stake governance proposals"
  }
}

# Search by proposal ID
curl "http://localhost:3000/api/tools/search-proposal?q=123"

# Expected response:
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
    "query": "123",
    "sortBy": "relevance",
    "totalFound": 1,
    "limit": 50
  },
  "statistics": {
    "totalFound": 1,
    "limit": 50
  },
  "metadata": {
    "contract": "voting.contract.near",
    "description": "Search results for House of Stake governance proposals"
  }
}

# Search with multiple terms and sorting
curl "http://localhost:3000/api/tools/search-proposal?q=governance policy&limit=10"

# Expected response:
{
  "proposals": [
    {
      "id": 100,
      "title": "Governance Policy Update",
      "description": "Proposal to update governance policies and procedures...",
      "status": "completed",
      "link": "https://example.com/proposal/100",
      "creation_time_ns": "1703808000000000000",
      "reviewer_id": "reviewer.near",
      "voting_start_time_ns": "1703894400000000000",
      "voting_duration_ns": "604800000000000"
    },
    {
      "id": 127,
      "title": "New Governance Framework",
      "description": "Proposal for implementing new governance framework...",
      "status": "active",
      "link": "https://example.com/proposal/127",
      "creation_time_ns": "1703721600000000000",
      "reviewer_id": "reviewer.near",
      "voting_start_time_ns": "1703808000000000000",
      "voting_duration_ns": "604800000000000"
    }
  ],
  "search": {
    "query": "governance policy",
    "totalFound": 2,
    "limit": 10
  },
  "statistics": {
    "totalFound": 2,
    "limit": 10
  },
  "metadata": {
    "contract": "voting.contract.near",
    "description": "Search results for House of Stake governance proposals"
  }
}

# Search without query (get all proposals)
curl "http://localhost:3000/api/tools/search-proposal?limit=5"



# Expected response:
{
  "proposals": [
    {
      "id": 130,
      "title": "Latest Proposal",
      "description": "Most recent governance proposal...",
      "status": "active",
      "link": "https://example.com/proposal/130",
      "creation_time_ns": "1704153600000000000",
      "reviewer_id": "reviewer.near",
      "voting_start_time_ns": "1704240000000000000",
      "voting_duration_ns": "604800000000000"
    },
    {
      "id": 129,
      "title": "Second Latest Proposal",
      "description": "Second most recent proposal...",
      "status": "active",
      "link": "https://example.com/proposal/129",
      "creation_time_ns": "1704067200000000000",
      "reviewer_id": "reviewer.near",
      "voting_start_time_ns": "1704153600000000000",
      "voting_duration_ns": "604800000000000"
    }
  ],
  "search": {
    "query": null,
    "totalFound": 5,
    "limit": 5
  },
  "statistics": {
    "totalFound": 5,
    "limit": 5
  },
  "metadata": {
    "contract": "voting.contract.near",
    "description": "Search results for House of Stake governance proposals"
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

# Missing proposalId for votes
curl "http://localhost:3000/api/tools/get-votes"

# Expected response:
{
  "error": "proposalId is required"
}

# Missing accountId for delegators
curl "http://localhost:3000/api/tools/get-delegators"

# Expected response:
{
  "error": "accountId is required"
}

# Missing proposalId for vote
curl "http://localhost:3000/api/tools/vote?vote=Yes&accountId=voter.near&snapshotBlockHeight=12345678"

# Expected response:
{
  "error": "proposalId is required"
}

# Missing vote choice
curl "http://localhost:3000/api/tools/vote?proposalId=123&accountId=voter.near&snapshotBlockHeight=12345678"

# Expected response:
{
  "error": "vote is required (Yes, No, or Abstain)"
}

# Missing accountId
curl "http://localhost:3000/api/tools/vote?proposalId=123&vote=Yes&snapshotBlockHeight=12345678"

# Expected response:
{
  "error": "accountId is required"
}

# Missing snapshot block height
curl "http://localhost:3000/api/tools/vote?proposalId=123&vote=Yes&accountId=voter.near"

# Expected response:
{
  "error": "snapshotBlockHeight is required"
}

# Missing accountId for veNEAR balance
curl "http://localhost:3000/api/tools/get-venear-balance"

# Expected response:
{
  "error": "accountId is required"
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

# Invalid vote choice
curl "http://localhost:3000/api/tools/vote?proposalId=123&vote=Maybe&votingPower=1"

# Expected response:
{
  "error": "vote must be one of: Yes, No, Abstain"
}

# Invalid proposal ID for vote
curl "http://localhost:3000/api/tools/vote?proposalId=-1&vote=Yes&accountId=voter.near&snapshotBlockHeight=12345678"

# Expected response:
{
  "error": "proposalId must be a valid positive number"
}

# Invalid snapshot block height
curl "http://localhost:3000/api/tools/vote?proposalId=123&vote=Yes&accountId=voter.near&snapshotBlockHeight=0"

# Expected response:
{
  "error": "snapshotBlockHeight must be a valid positive number"
}

# Invalid account ID for veNEAR balance
curl "http://localhost:3000/api/tools/get-venear-balance?accountId="

# Expected response:
{
  "error": "Invalid account ID"
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

### Test Missing Required Fields for Proposal Creation

```bash
# Missing title for proposal creation
curl "http://localhost:3000/api/tools/create-proposal?description=Test%20description&votingOptions=Yes,No"

# Expected response:
{
  "error": "title and description are required"
}

# Missing voting options for proposal creation
curl "http://localhost:3000/api/tools/create-proposal?title=Test%20Proposal&description=Test%20description&votingOptions="

# Expected response:
{
  "error": "At least one voting option is required"
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

// Usage
try {
  const proposal = await fetchProposal('123');
  console.log('Proposal:', proposal);
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

// Fetch recent active proposals
async function getRecentActiveProposals(count = 5) {
  try {
    const response = await axios.get(`/api/tools/fetch-recent-active-proposals?count=${count}`);
    return response.data.proposals;
  } catch (error) {
    console.error('Error fetching active proposals:', error.response?.data?.error || error.message);
    throw error;
  }
}

// Get votes for a proposal
async function getVotes(proposalId) {
  try {
    const response = await axios.get(`/api/tools/get-votes?proposalId=${proposalId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching votes:', error.response?.data?.error || error.message);
    throw error;
  }
}

// Get delegators for an account
async function getDelegators(accountId) {
  try {
    const response = await axios.get(`/api/tools/get-delegators?accountId=${accountId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching delegators:', error.response?.data?.error || error.message);
    throw error;
  }
}

// Create a proposal transaction
async function createProposal(title, description, link, votingOptions) {
  try {
    const params = new URLSearchParams({
      title,
      description,
      votingOptions: votingOptions.join(',')
    });
    
    if (link) {
      params.append('link', link);
    }
    
    const response = await axios.get(`/api/tools/create-proposal?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error creating proposal:', error.response?.data?.error || error.message);
    throw error;
  }
}

// Vote on a proposal
async function voteOnProposal(proposalId, vote, accountId, snapshotBlockHeight) {
  try {
    const params = new URLSearchParams({
      proposalId: proposalId.toString(),
      vote,
      accountId,
      snapshotBlockHeight: snapshotBlockHeight.toString()
    });
    
    const response = await axios.get(`/api/tools/vote?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error voting on proposal:', error.response?.data?.error || error.message);
    throw error;
  }
}

// Get veNEAR balance for an account
async function getVeNEARBalance(accountId) {
  try {
    const response = await axios.get(`/api/tools/get-venear-balance?accountId=${accountId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching veNEAR balance:', error.response?.data?.error || error.message);
    throw error;
  }
}