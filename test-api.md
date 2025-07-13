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

### 4. Get Delegators for Account

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

### 5. Create Proposal Transaction

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

### 6. Vote on Proposal

```bash
# Vote "Yes" on proposal 123 (with veNEAR balance check)
curl "http://localhost:3000/api/tools/vote?proposalId=123&vote=Yes&accountId=voter.near"

# Expected response:
{
  "transactionPayload": {
    "receiverId": "voting.contract.near",
    "actions": [
      {
        "type": "FunctionCall",
        "params": {
          "methodName": "vote",
          "gas": "200000000000000",
          "deposit": "1250000000000000000000",
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
  "votingInfo": {
    "accountId": "voter.near",
    "votingPower": "1000000000000000000000000",
    "proposalId": 123,
    "vote": 0,
    "voteOption": "Yes",
    "hasVoted": false,
    "existingVote": null
  }
}

# Vote "No" on proposal 456 (with veNEAR balance check)
curl "http://localhost:3000/api/tools/vote?proposalId=456&vote=No&accountId=delegate.near"

# Expected response:
{
  "transactionPayload": {
    "receiverId": "voting.contract.near",
    "actions": [
      {
        "type": "FunctionCall",
        "params": {
          "methodName": "vote",
          "gas": "200000000000000",
          "deposit": "1250000000000000000000",
          "args": {
            "proposal_id": 456,
            "vote": 1,
            "merkle_proof": "eyJwcm9vZiI6InNvbWUtbWVya2xlLXByb29mLWRhdGEifQ==",
            "v_account": "delegate.near"
          }
        }
      }
    ]
  },
  "votingInfo": {
    "accountId": "delegate.near",
    "votingPower": "5000000000000000000000000",
    "proposalId": 456,
    "vote": 1,
    "voteOption": "No",
    "hasVoted": false,
    "existingVote": null
  }
}

# Error case: Account with no voting power
curl "http://localhost:3000/api/tools/vote?proposalId=789&vote=Yes&accountId=novotingpower.near"

# Expected error response:
{
  "error": "Account novotingpower.near has no voting power. Current voting power: 0"
}

# Error case: User has already voted
curl "http://localhost:3000/api/tools/vote?proposalId=123&vote=Yes&accountId=alreadyvoted.near"

# Expected error response:
{
  "error": "Account alreadyvoted.near has already voted on proposal 123. Existing vote: {\"vote\":0,\"voting_power\":\"1000000000000000000000000\"}"
}

# Error case: Invalid voting option
curl "http://localhost:3000/api/tools/vote?proposalId=123&vote=InvalidOption&accountId=voter.near"

# Expected error response:
{
  "error": "Invalid vote option \"InvalidOption\". Available options: 0: \"Yes\", 1: \"No\", 2: \"Abstain\""
}
```

### 7. Get veNEAR Balance

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

### 8. Get Account Balance

```bash
# Get NEAR account balance for a specific account
curl "http://localhost:3000/api/tools/get-account-balance?accountId=user.near"

# Expected response:
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

# Get account balance for account with no balance
curl "http://localhost:3000/api/tools/get-account-balance?accountId=newuser.near"

# Expected response:
{
  "accountId": "newuser.near",
  "balance": {
    "raw": "0",
    "nears": "0.000000"
  },
  "metadata": {
    "description": "NEAR account balance information",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}

# Test error handling - missing accountId
curl "http://localhost:3000/api/tools/get-account-balance"

# Expected response:
{
  "error": "accountId is required"
}

# Test error handling - invalid accountId
curl "http://localhost:3000/api/tools/get-account-balance?accountId="

# Expected response:
{
  "error": "Invalid account ID"
}
```

### 10. Get veNEAR Balance

```bash
# Get comprehensive veNEAR balance for a specific account
curl "http://localhost:3000/api/tools/get-venear-balance?accountId=user.near"

# Expected response:
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

# Get veNEAR balance for account with no detailed data
curl "http://localhost:3000/api/tools/get-venear-balance?accountId=newuser.near"

# Expected response:
{
  "accountId": "newuser.near",
  "tokenBalance": {
    "raw": "0",
    "nears": "0.000000",
    "method": "ft_balance_of",
    "description": "Standard fungible token balance"
  },
  "detailedBalance": null,
  "metadata": {
    "contract": "venear.near",
    "token": "veNEAR",
    "hasDetailedData": false,
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### 11. Search Proposals

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

### 12. Deploy Lockup Contract

```bash
# Deploy a new lockup contract
curl "http://localhost:3000/api/tools/deploy-lockup"

# Expected response:
{
  "transactionPayload": {
    "receiverId": "venear.near",
    "actions": [
      {
        "type": "FunctionCall",
        "params": {
          "methodName": "deploy_lockup",
          "gas": "100000000000000",
          "deposit": "500000000000000000000000",
          "args": {}
        }
      }
    ]
  }
}
```

### 13. Delete Lockup Contract

```bash
# Delete lockup contract when locked amount is zero
curl "http://localhost:3000/api/tools/delete-lockup?accountId=user.near"

# Expected response:
{
  "transactionPayload": {
    "receiverId": "lockup.user.near",
    "actions": [
      {
        "type": "FunctionCall",
        "params": {
          "methodName": "delete_lockup",
          "gas": "200000000000000",
          "deposit": "1",
          "args": {}
        }
      }
    ]
  }
}

# Error case: No lockup found for account
curl "http://localhost:3000/api/tools/delete-lockup?accountId=nolockup.near"

# Expected error response:
{
  "error": "No lockup found for this account"
}

# Error case: Locked amount is not zero
curl "http://localhost:3000/api/tools/delete-lockup?accountId=lockeduser.near"

# Expected error response:
{
  "error": "Cannot delete lockup: locked amount is not zero",
  "lockedAmount": "1000000000000000000000000"
}

# Error case: Missing accountId parameter
curl "http://localhost:3000/api/tools/delete-lockup"

# Expected error response:
{
  "error": "accountId parameter is required"
}
```

### 14. Lock NEAR Tokens

```bash
# Lock NEAR tokens in lockup contract
curl "http://localhost:3000/api/tools/lock-near?accountId=user.near"

# Expected response:
{
  "transactionPayload": {
    "receiverId": "lockup.user.near",
    "actions": [
      {
        "type": "FunctionCall",
        "params": {
          "methodName": "lock_near",
          "gas": "100000000000000",
          "deposit": "1",
          "args": {}
        }
      }
    ]
  },
  "liquidBalance": "5000000000000000000000000"
}

# Error case: No lockup found for account
curl "http://localhost:3000/api/tools/lock-near?accountId=nolockup.near"

# Expected error response:
{
  "error": "No lockup found for this account"
}

# Error case: Insufficient liquid balance (less than 1 NEAR)
curl "http://localhost:3000/api/tools/lock-near?accountId=lowbalance.near"

# Expected error response:
{
  "error": "Insufficient liquid balance to lock NEAR",
  "liquidAmount": "500000000000000000000000",
  "minimumRequired": "1000000000000000000000000"
}

# Error case: Missing accountId parameter
curl "http://localhost:3000/api/tools/lock-near"

# Expected error response:
{
  "error": "accountId parameter is required"
}
```

### 15. Withdraw NEAR Tokens from Lockup

```bash
# Withdraw NEAR tokens from lockup contract
curl "http://localhost:3000/api/tools/withdraw-lockup?accountId=user.near"

# Expected response:
{
  "transactionPayload": {
    "receiverId": "lockup.user.near",
    "actions": [
      {
        "type": "FunctionCall",
        "params": {
          "methodName": "transfer",
          "gas": "100000000000000",
          "deposit": "0",
          "args": {
            "amount": "3000000000000000000000000",
            "receiver_id": "user.near"
          }
        }
      }
    ]
  }
}

# Error case: No lockup found for account
curl "http://localhost:3000/api/tools/withdraw-lockup?accountId=nolockup.near"

# Expected error response:
{
  "error": "No lockup found for this account"
}

# Error case: Insufficient withdrawable balance (less than 1 NEAR)
curl "http://localhost:3000/api/tools/withdraw-lockup?accountId=lowbalance.near"

# Expected error response:
{
  "error": "Insufficient withdrawable balance",
  "withdrawableAmount": "500000000000000000000000",
  "liquidAmount": "1000000000000000000000000",
  "liquidOwnersBalance": "500000000000000000000000",
  "minimumRequired": "1000000000000000000000000"
}

# Error case: Missing accountId parameter
curl "http://localhost:3000/api/tools/withdraw-lockup"

# Expected error response:
{
  "error": "accountId parameter is required"
}
```

### 16. Deposit and Stake NEAR Tokens

```bash
# Deposit and stake NEAR tokens from lockup contract
curl "http://localhost:3000/api/tools/deposit-and-stake?accountId=user.near"

# Expected response:
{
  "transactionPayload": {
    "receiverId": "lockup.user.near",
    "actions": [
      {
        "type": "FunctionCall",
        "params": {
          "methodName": "deposit_and_stake",
          "gas": "200000000000000",
          "deposit": "1",
          "args": {
            "amount": "5000000000000000000000000"
          }
        }
      }
    ]
  }
}

# Error case: No lockup found for account
curl "http://localhost:3000/api/tools/deposit-and-stake?accountId=nolockup.near"

# Expected error response:
{
  "error": "No lockup found for this account"
}

# Error case: No staking pool found for lockup
curl "http://localhost:3000/api/tools/deposit-and-stake?accountId=nopool.near"

# Expected error response:
{
  "error": "No staking pool found for this lockup"
}

# Error case: Insufficient liquid owner balance (less than 1 NEAR)
curl "http://localhost:3000/api/tools/deposit-and-stake?accountId=lowbalance.near"

# Expected error response:
{
  "error": "Insufficient liquid owner balance to stake",
  "liquidOwnersBalance": "500000000000000000000000",
  "minimumRequired": "1000000000000000000000000"
}

# Error case: Missing accountId parameter
curl "http://localhost:3000/api/tools/deposit-and-stake"

# Expected error response:
{
  "error": "accountId parameter is required"
}
```

### 17. Select Staking Pool

```bash
# Select a staking pool in lockup contract
curl "http://localhost:3000/api/tools/select-staking-pool?accountId=user.near&stakingPoolAccountId=staking.pool.near"

# Expected response:
{
  "transactionPayload": {
    "receiverId": "lockup.user.near",
    "actions": [
      {
        "type": "FunctionCall",
        "params": {
          "methodName": "select_staking_pool",
          "gas": "100000000000000",
          "deposit": "1",
          "args": {
            "staking_pool_account_id": "staking.pool.near"
          }
        }
      }
    ]
  }
}

# Error case: No lockup found for account
curl "http://localhost:3000/api/tools/select-staking-pool?accountId=nolockup.near&stakingPoolAccountId=staking.pool.near"

# Expected error response:
{
  "error": "No lockup found for this account"
}

# Error case: Missing accountId parameter
curl "http://localhost:3000/api/tools/select-staking-pool?stakingPoolAccountId=staking.pool.near"

# Expected error response:
{
  "error": "accountId parameter is required"
}

# Error case: Missing stakingPoolAccountId parameter
curl "http://localhost:3000/api/tools/select-staking-pool?accountId=user.near"

# Expected error response:
{
  "error": "stakingPoolAccountId parameter is required"
}
```

### 18. Unselect Staking Pool

```bash
# Unselect a staking pool in lockup contract
curl "http://localhost:3000/api/tools/unselect-staking-pool?accountId=user.near&stakingPoolAccountId=staking.pool.near"

# Expected response:
{
  "transactionPayload": {
    "receiverId": "lockup.user.near",
    "actions": [
      {
        "type": "FunctionCall",
        "params": {
          "methodName": "unselect_staking_pool",
          "gas": "100000000000000",
          "deposit": "1",
          "args": {
            "staking_pool_account_id": "staking.pool.near"
          }
        }
      }
    ]
  }
}

# Error case: No lockup found for account
curl "http://localhost:3000/api/tools/unselect-staking-pool?accountId=nolockup.near&stakingPoolAccountId=staking.pool.near"

# Expected error response:
{
  "error": "No lockup found for this account"
}

# Error case: Missing accountId parameter
curl "http://localhost:3000/api/tools/unselect-staking-pool?stakingPoolAccountId=staking.pool.near"

# Expected error response:
{
  "error": "accountId parameter is required"
}

# Error case: Missing stakingPoolAccountId parameter
curl "http://localhost:3000/api/tools/unselect-staking-pool?accountId=user.near"

# Expected error response:
{
  "error": "stakingPoolAccountId parameter is required"
}
```

### 19. Refresh Staking Pool Balance

```bash
# Refresh staking pool balance in lockup contract
curl "http://localhost:3000/api/tools/refresh-staking-pool-balance?accountId=user.near"

# Expected response:
{
  "transactionPayload": {
    "receiverId": "lockup.user.near",
    "actions": [
      {
        "type": "FunctionCall",
        "params": {
          "methodName": "refresh_staking_pool_balance",
          "gas": "100000000000000",
          "deposit": "1",
          "args": {}
        }
      }
    ]
  }
}

# Error case: No lockup found for account
curl "http://localhost:3000/api/tools/refresh-staking-pool-balance?accountId=nolockup.near"

# Expected error response:
{
  "error": "No lockup found for this account"
}

# Error case: No staking pool found for lockup
curl "http://localhost:3000/api/tools/refresh-staking-pool-balance?accountId=nopool.near"

# Expected error response:
{
  "error": "No staking pool found for this lockup"
}

# Error case: Missing accountId parameter
curl "http://localhost:3000/api/tools/refresh-staking-pool-balance"

# Expected error response:
{
  "error": "accountId parameter is required"
}
```

### 20. Delegate All veNEAR Tokens

```bash
# Delegate all veNEAR tokens to a specific account
curl "http://localhost:3000/api/tools/delegate-all?receiverId=delegate.near"

# Expected response:
{
  "transactionPayload": {
    "receiverId": "venear.near",
    "actions": [
      {
        "type": "FunctionCall",
        "params": {
          "methodName": "delegate_all",
          "gas": "100000000000000",
          "deposit": "1",
          "args": {
            "receiver_id": "delegate.near"
          }
        }
      }
    ]
  }
}

# Error case: Missing receiverId parameter
curl "http://localhost:3000/api/tools/delegate-all"

# Expected error response:
{
  "error": "receiverId parameter is required"
}

# Error case: Invalid receiver ID format
curl "http://localhost:3000/api/tools/delegate-all?receiverId=INVALID_ACCOUNT"

# Expected error response:
{
  "error": "Invalid receiver ID format. Must be a valid NEAR account ID"
}

# Error case: Receiver ID too short
curl "http://localhost:3000/api/tools/delegate-all?receiverId=a"

# Expected error response:
{
  "error": "Invalid receiver ID format. Must be a valid NEAR account ID"
}

# Error case: Receiver ID too long
curl "http://localhost:3000/api/tools/delegate-all?receiverId=verylongaccountidthatiswaytoolongandshouldnotbeallowedbecauseitviolatesthenearaccountidlengthlimit"

# Expected error response:
{
  "error": "Invalid receiver ID format. Must be a valid NEAR account ID"
}
```

### 21. Undelegate All veNEAR Tokens

```bash
# Undelegate all veNEAR tokens from current delegate
curl "http://localhost:3000/api/tools/undelegate?accountId=user.near"

# Expected response:
{
  "transactionPayload": {
    "receiverId": "venear.near",
    "actions": [
      {
        "type": "FunctionCall",
        "params": {
          "methodName": "undelegate",
          "gas": "100000000000000",
          "deposit": "1",
          "args": {}
        }
      }
    ]
  },
  "delegationInfo": {
    "account_id": "delegate.near",
    "amount": "1000000000000000000000000"
  }
}

# Error case: Missing accountId parameter
curl "http://localhost:3000/api/tools/undelegate"

# Expected error response:
{
  "error": "accountId parameter is required"
}

# Error case: Account not currently delegating
curl "http://localhost:3000/api/tools/undelegate?accountId=nodelegation.near"

# Expected error response:
{
  "error": "Account is not currently delegating any veNEAR tokens",
  "accountInfo": {
    "account": {
      "account_id": "nodelegation.near",
      "balance": "5000000000000000000000000",
      "delegation": null
    }
  }
}

### 22. Begin Unlock NEAR Tokens

```bash
# Begin unlock process for NEAR tokens in lockup contract
curl "http://localhost:3000/api/tools/begin-unlock-near?lockupId=lockup.user.near"

# Expected response:
{
  "transactionPayload": {
    "receiverId": "lockup.user.near",
    "actions": [
      {
        "type": "FunctionCall",
        "params": {
          "methodName": "begin_unlock_near",
          "gas": "100000000000000",
          "deposit": "1",
          "args": {}
        }
      }
    ]
  }
}

# Error case: Missing lockupId parameter
curl "http://localhost:3000/api/tools/begin-unlock-near"

# Expected error response:
{
  "error": "lockupId is required"
}

# Error case: Empty lockupId
curl "http://localhost:3000/api/tools/begin-unlock-near?lockupId="

# Expected error response:
{
  "error": "lockupId is required"
}
```

### 23. End Unlock NEAR Tokens

```bash
# End unlock process for NEAR tokens in lockup contract
curl "http://localhost:3000/api/tools/end-unlock-near?lockupId=lockup.user.near"

# Expected response:
{
  "transactionPayload": {
    "receiverId": "lockup.user.near",
    "actions": [
      {
        "type": "FunctionCall",
        "params": {
          "methodName": "end_unlock_near",
          "gas": "100000000000000",
          "deposit": "1",
          "args": {}
        }
      }
    ]
  }
}

# Error case: Missing lockupId parameter
curl "http://localhost:3000/api/tools/end-unlock-near"

# Expected error response:
{
  "error": "lockupId is required"
}

# Error case: Empty lockupId
curl "http://localhost:3000/api/tools/end-unlock-near?lockupId="

# Expected error response:
{
  "error": "lockupId is required"
}

# Error case: No pending unlock amount
curl "http://localhost:3000/api/tools/end-unlock-near?lockupId=lockup.nopending.near"

# Expected error response:
{
  "error": "No pending unlock amount found"
}

# Error case: Unlock period has not ended yet
curl "http://localhost:3000/api/tools/end-unlock-near?lockupId=lockup.locked.near"

# Expected error response:
{
  "error": "Unlock period has not ended yet"
}


## Error Testing

### Test Missing Parameters

```bash
# Missing proposalId
curl "http://localhost:3000/api/tools/get-proposal"

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
curl "http://localhost:3000/api/tools/vote?proposalId=123&vote=Maybe&accountId=voter.near"

# Expected response:
{
  "error": "Invalid vote option \"Maybe\". Available options: 0: \"Yes\", 1: \"No\", 2: \"Abstain\""
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
async function voteOnProposal(proposalId, vote, accountId) {
  try {
    const params = new URLSearchParams({
      proposalId: proposalId.toString(),
      vote,
      accountId
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

// Deploy lockup contract transaction
async function deployLockup() {
  try {
    const response = await axios.get('/api/tools/deploy-lockup');
    return response.data;
  } catch (error) {
    console.error('Error deploying lockup:', error.response?.data?.error || error.message);
    throw error;
  }
}

// Delete lockup contract transaction
async function deleteLockup(accountId) {
  try {
    const response = await axios.get(`/api/tools/delete-lockup?accountId=${accountId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting lockup:', error.response?.data?.error || error.message);
    throw error;
  }
}

// Lock NEAR tokens in lockup contract
async function lockNear(accountId) {
  try {
    const response = await axios.get(`/api/tools/lock-near?accountId=${accountId}`);
    return response.data;
  } catch (error) {
    console.error('Error locking NEAR:', error.response?.data?.error || error.message);
    throw error;
  }
}

// Withdraw NEAR tokens from lockup contract
async function withdrawLockup(accountId) {
  try {
    const response = await axios.get(`/api/tools/withdraw-lockup?accountId=${accountId}`);
    return response.data;
  } catch (error) {
    console.error('Error withdrawing from lockup:', error.response?.data?.error || error.message);
    throw error;
  }
}

// Deposit and stake NEAR tokens from lockup contract
async function depositAndStake(accountId) {
  try {
    const response = await axios.get(`/api/tools/deposit-and-stake?accountId=${accountId}`);
    return response.data;
  } catch (error) {
    console.error('Error depositing and staking:', error.response?.data?.error || error.message);
    throw error;
  }
}

// Select staking pool in lockup contract
async function selectStakingPool(accountId, stakingPoolAccountId) {
  try {
    const response = await axios.get(`/api/tools/select-staking-pool?accountId=${accountId}&stakingPoolAccountId=${stakingPoolAccountId}`);
    return response.data;
  } catch (error) {
    console.error('Error selecting staking pool:', error.response?.data?.error || error.message);
    throw error;
  }
}

// Unselect staking pool in lockup contract
async function unselectStakingPool(accountId, stakingPoolAccountId) {
  try {
    const response = await axios.get(`/api/tools/unselect-staking-pool?accountId=${accountId}&stakingPoolAccountId=${stakingPoolAccountId}`);
    return response.data;
  } catch (error) {
    console.error('Error unselecting staking pool:', error.response?.data?.error || error.message);
    throw error;
  }
}

// Refresh staking pool balance in lockup contract
async function refreshStakingPoolBalance(accountId) {
  try {
    const response = await axios.get(`/api/tools/refresh-staking-pool-balance?accountId=${accountId}`);
    return response.data;
  } catch (error) {
    console.error('Error refreshing staking pool balance:', error.response?.data?.error || error.message);
    throw error;
  }
}

// Delegate all veNEAR tokens to a specific account
async function delegateAll(receiverId) {
  try {
    const response = await axios.get(`/api/tools/delegate-all?receiverId=${receiverId}`);
    return response.data;
  } catch (error) {
    console.error('Error delegating all veNEAR:', error.response?.data?.error || error.message);
    throw error;
  }
}

// Undelegate all veNEAR tokens from current delegate
async function undelegate(accountId) {
  try {
    const response = await axios.get(`/api/tools/undelegate?accountId=${accountId}`);
    return response.data;
  } catch (error) {
    console.error('Error undelegating all veNEAR:', error.response?.data?.error || error.message);
    throw error;
  }
}

// Begin unlock process for NEAR tokens in lockup contract
async function beginUnlockNear(lockupId) {
  try {
    const response = await axios.get(`/api/tools/begin-unlock-near?lockupId=${lockupId}`);
    return response.data;
  } catch (error) {
    console.error('Error beginning unlock NEAR:', error.response?.data?.error || error.message);
    throw error;
  }
}

// End unlock process for NEAR tokens in lockup contract
async function endUnlockNear(lockupId) {
  try {
    const response = await axios.get(`/api/tools/end-unlock-near?lockupId=${lockupId}`);
    return response.data;
  } catch (error) {
    console.error('Error ending unlock NEAR:', error.response?.data?.error || error.message);
    throw error;
  }
}