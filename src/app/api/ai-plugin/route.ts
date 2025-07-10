import { ACCOUNT_ID, PLUGIN_URL } from "@/app/config";
import { NextResponse } from "next/server";

export async function GET() {
    const pluginData = {
        openapi: "3.0.0",
        info: {
            title: "NEAR Governance Bot API",
            description: "API for NEAR governance bot functionality including proposal management and blockchain interactions",
            version: "1.0.0",
        },
        servers: [
            {
                url: PLUGIN_URL,
            },
        ],
        "x-mb": {
            "account-id": ACCOUNT_ID,
            assistant: {
                name: "NEAR Governance Assistant",
                description: "An assistant that helps with NEAR governance, proposal management, and blockchain interactions. Can fetch and process governance proposals, handle proposal events, and create NEAR transaction payloads.",
                instructions: "You are a Governance Assistant for NEAR's House of Stake (HoS), helping delegates and veNEAR voters understand and evaluate proposals. Your job is to:\n\n- Interpret governance proposals\n- Determine type, origin, and voting requirements\n- Present clear summaries with action guidance\n- Generate transactions for delegates to vote on\n- Respect the structure of House of Stake, including screening logic and stakeholder roles\n\nWhen asked to summarize a proposal, you will receive a proposal as structured input (from a smart contract). Based on this, return the following fields:\n\n---\n\n1. TL;DR\nA 1–2 sentence summary of what the proposal is and why it matters.\n\n2. Proposal Type\nWhat kind of proposal is it? (FunctionCall, ChangeConfig, AddMemberToRole, Transfer, etc.)\n\n3. Voting Threshold\nSpecify whether it requires:\n- **Simple Majority (51%)** – Screened and approved by the Screening Committee\n- **Supermajority (75%)** – Unscreened\n\n4. Proposed By\nAccount ID of the proposer. Indicate if they are an endorsed delegate, working group, or other stakeholder.\n\n5. Voting Deadline\nTime remaining until vote closes (if available).\n\n6. Action Required\nWhat should a delegate or voter do? (e.g., review a diff, validate a config change, check treasury)\n\n7. Impact Scope\nExplain what this proposal affects:\n- Governance structure?\n- Treasury?\n- Smart contract behavior?\n- Delegate performance?\n- Reward system?\n\n8. Assistant Commentary\nProvide useful context:\n- Is this proposal routine, controversial, or high-impact?\n- Does it resemble past proposals?\n- Are there complex or risky elements?\n- Flag if the proposal appears misaligned or ambiguous.\n\n9. Tags (Optional)\nAdd 1–3 labels from the following:\n- `screened`\n- `unscreened`\n- `delegate-proposed`\n- `working-group`\n- `treasury-impact`\n- `config-change`\n- `smart-contract-upgrade`\n- `low-risk`\n- `high-stakes`\n- `needs-closer-review`",
                tools: [{ type: "generate-transaction" }, { type: "sign-message" }]
            },
        },
        paths: {
            "/api/tools/get-proposal": {
                get: {
                    summary: "Get proposal details",
                    description: "Gets detailed information about a specific governance proposal",
                    operationId: "get-proposal",
                    parameters: [
                        {
                            name: "proposalId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string"
                            },
                            description: "The ID of the proposal to fetch"
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Successful response",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            proposal: {
                                                type: "object",
                                                description: "The proposal details",
                                                properties: {
                                                    id: { type: "number" },
                                                    title: { type: "string" },
                                                    description: { type: "string" },
                                                    link: { type: "string" },
                                                    deadline: { type: "string" },
                                                    voting_power: { type: "string" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "400": {
                            description: "Bad request",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: { type: "string" }
                                        }
                                    }
                                }
                            }
                        },
                        "404": {
                            description: "Proposal not found",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: { type: "string" }
                                        }
                                    }
                                }
                            }
                        },
                        "500": {
                            description: "Server error",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: { type: "string" },
                                            details: { type: "string" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/api/tools/get-recent-proposals": {
                get: {
                    summary: "Fetch recent proposals",
                    description: "Fetches the most recent governance proposals from the voting contract",
                    operationId: "get-recent-proposals",
                    parameters: [
                        {
                            name: "count",
                            in: "query",
                            required: false,
                            schema: {
                                type: "integer",
                                minimum: 1,
                                maximum: 50
                            },
                            description: "Number of proposals to fetch (1-50, default: 5)"
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Successful response",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            proposals: {
                                                type: "array",
                                                items: {
                                                    type: "object",
                                                    properties: {
                                                        id: { type: "number" },
                                                        title: { type: "string" },
                                                        description: { type: "string" },
                                                        status: { type: "string" }
                                                    }
                                                }
                                            },
                                            totalCount: { type: "number" },
                                            fromIndex: { type: "number" },
                                            limit: { type: "number" }
                                        }
                                    }
                                }
                            }
                        },
                        "400": {
                            description: "Bad request",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: { type: "string" }
                                        }
                                    }
                                }
                            }
                        },
                        "500": {
                            description: "Server error",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: { type: "string" },
                                            details: { type: "string" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/api/tools/get-recent-active-proposals": {
                get: {
                    summary: "Fetch recent active proposals",
                    description: "Fetches the most recent proposals that have been approved for voting",
                    operationId: "get-recent-active-proposals",
                    parameters: [
                        {
                            name: "count",
                            in: "query",
                            required: false,
                            schema: {
                                type: "integer",
                                minimum: 1,
                                maximum: 50
                            },
                            description: "Number of proposals to fetch (1-50, default: 5)"
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Successful response",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            proposals: {
                                                type: "array",
                                                items: {
                                                    type: "object",
                                                    properties: {
                                                        id: { type: "number" },
                                                        title: { type: "string" },
                                                        description: { type: "string" },
                                                        snapshot_block: { type: "number" },
                                                        total_voting_power: { type: "string" }
                                                    }
                                                }
                                            },
                                            totalCount: { type: "number" },
                                            fromIndex: { type: "number" },
                                            limit: { type: "number" }
                                        }
                                    }
                                }
                            }
                        },
                        "400": {
                            description: "Bad request",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: { type: "string" }
                                        }
                                    }
                                }
                            }
                        },
                        "500": {
                            description: "Server error",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: { type: "string" },
                                            details: { type: "string" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
            "/api/tools/get-delegators": {
                get: {
                    summary: "Get delegators for an account",
                    description: "Fetches all delegators for a specific account to provide voter-delegate context",
                    operationId: "get-delegators",
                    parameters: [
                        {
                            name: "accountId",
                            in: "query",
                        required: true,
                            schema: {
                                type: "string"
                            },
                            description: "The NEAR account ID to get delegators for"
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Successful response",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                            accountId: { type: "string" },
                                            delegators: {
                                                type: "array",
                                                items: {
                                                    type: "object",
                                                    properties: {
                                                        delegator: { type: "string" },
                                                        delegated_power: { type: "string" },
                                                        delegation_date: { type: "string" }
                                                    }
                                                }
                                            },
                                            delegationStats: {
                                            type: "object",
                                            properties: {
                                                    accountId: { type: "string" },
                                                    totalDelegators: { type: "number" },
                                                    totalDelegatedPower: { type: "string" },
                                                    averageDelegation: { type: "string" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "400": {
                            description: "Bad request",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: { type: "string" }
                                        }
                                    }
                                }
                            }
                        },
                        "500": {
                            description: "Server error",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: { type: "string" },
                                            details: { type: "string" }
                                        }
                                    }
                                        }
                                    }
                                }
                            }
                        }
                    },
            "/api/tools/create-proposal": {
                get: {
                    summary: "Create a proposal transaction",
                    description: "Creates a NEAR transaction payload for creating a new governance proposal",
                    operationId: "create-proposal",
                    parameters: [
                        {
                            name: "title",
                            in: "query",
                        required: true,
                            schema: {
                                type: "string"
                            },
                            description: "The title of the proposal"
                        },
                        {
                            name: "description",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string"
                            },
                            description: "The description of the proposal"
                        },
                        {
                            name: "link",
                            in: "query",
                            required: false,
                            schema: {
                                type: "string"
                            },
                            description: "Optional link to additional information"
                        },
                        {
                            name: "votingOptions",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string"
                            },
                            description: "Comma-separated list of voting options (e.g., 'Yes,No,Abstain')"
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Successful response",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                            transactionPayload: {
                                                type: "object",
                                                properties: {
                                                    receiverId: {
                                            type: "string",
                                                        description: "The voting contract account ID"
                                                    },
                                                    actions: {
                                                        type: "array",
                                                        items: {
                                                            type: "object",
                                                            properties: {
                                                                type: {
                                                                    type: "string",
                                                                    description: "The type of action (FunctionCall)"
                                                                },
                                                                params: {
                                                                    type: "object",
                                                                    properties: {
                                                                        methodName: {
                                                                            type: "string",
                                                                            description: "The contract method to call (create_proposal)"
                                                                        },
                                                                        gas: {
                                                                            type: "string",
                                                                            description: "Gas limit in gas units"
                                                                        },
                                                                        deposit: {
                                                                            type: "string",
                                                                            description: "Deposit amount in yoctoNEAR"
                                                                        },
                                                                        args: {
                                                                            type: "object",
                                                                            properties: {
                                                                                metadata: {
                                            type: "object",
                                            properties: {
                                                title: { type: "string" },
                                                description: { type: "string" },
                                                                                        link: { type: "string" },
                                                                                        voting_options: {
                                                                                            type: "array",
                                                                                            items: { type: "string" }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "400": {
                            description: "Bad request",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: { type: "string" }
                                        }
                                    }
                                }
                            }
                        },
                        "500": {
                            description: "Server error",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: { type: "string" },
                                            details: { type: "string" }
                                        }
                                    }
                                        }
                                    }
                                }
                            }
                        }
                    },
            "/api/tools/vote": {
                get: {
                    summary: "Create a vote transaction",
                    description: "Creates a NEAR transaction payload for voting on a governance proposal. Validates that the account has sufficient veNEAR voting power and hasn't already voted before allowing the vote.",
                    operationId: "vote",
                    parameters: [
                        {
                            name: "proposalId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string"
                            },
                            description: "The ID of the proposal to vote on"
                        },
                        {
                            name: "vote",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string"
                            },
                            description: "The voting option text (e.g., 'Yes', 'No', 'Lebron James', etc.)"
                        },
                        {
                            name: "accountId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string"
                            },
                            description: "The NEAR account ID of the voter"
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Successful response",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            transactionPayload: {
                                                type: "object",
                                                properties: {
                                                    receiverId: {
                                                        type: "string",
                                                        description: "The voting contract account ID"
                                                    },
                                                    actions: {
                                                        type: "array",
                                                        items: {
                                                            type: "object",
                                                            properties: {
                                                                type: {
                                                                    type: "string",
                                                                    description: "The type of action (FunctionCall)"
                                                                },
                                                                params: {
                                                                    type: "object",
                                                                    properties: {
                                                                        methodName: {
                                                                            type: "string",
                                                                            description: "The contract method to call (vote)"
                                                                        },
                                                                        gas: {
                                                                            type: "string",
                                                                            description: "Gas limit in gas units (200 Tgas = 200000000000000)"
                                                                        },
                                                                        deposit: {
                                                                            type: "string",
                                                                            description: "Deposit amount in yoctoNEAR"
                                                                        },
                                                                        args: {
                                                                            type: "object",
                                                                            properties: {
                                                                                proposal_id: { type: "number" },
                                                                                vote: { type: "string" },
                                                                                merkle_proof: { type: "string" },
                                                                                v_account: { type: "string" }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                    }
                                                }
                                            },
                                            votingInfo: {
                                                type: "object",
                                                properties: {
                                                    accountId: { type: "string" },
                                                    votingPower: { type: "string" },
                                                    proposalId: { type: "number" },
                                                    vote: { type: "number" },
                                                    voteOption: { type: "string" },
                                                    hasVoted: { type: "boolean" },
                                                    existingVote: { 
                                                        type: "object",
                                                        nullable: true,
                                                        description: "Existing vote data if user has already voted"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "400": {
                            description: "Bad request",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: { type: "string" }
                                        }
                                    }
                                }
                            }
                        },
                        "500": {
                            description: "Server error",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: { type: "string" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },

            "/api/tools/get-account-balance": {
                get: {
                    summary: "Get NEAR account balance",
                    description: "Gets the NEAR account balance for a given account ID",
                    operationId: "get-account-balance",
                    parameters: [
                        {
                            name: "accountId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string"
                            },
                            description: "The NEAR account ID to get balance for"
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Successful response",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            accountId: { type: "string" },
                                            balance: {
                                                type: "object",
                                                properties: {
                                                    raw: { type: "string" },
                                                    nears: { type: "string" }
                                                }
                                            },
                                            metadata: {
                                                type: "object",
                                                properties: {
                                                    description: { type: "string" },
                                                    timestamp: { type: "string" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "400": {
                            description: "Bad request",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: { type: "string" }
                                        }
                                    }
                                }
                            }
                        },
                        "404": {
                            description: "Account not found",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: { type: "string" }
                                        }
                                    }
                                }
                            }
                        },
                        "500": {
                            description: "Server error",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: { type: "string" },
                                            details: { type: "string" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/api/tools/get-venear-balance": {
                get: {
                    summary: "Get comprehensive veNEAR balance",
                    description: "Gets both token balance (ft_balance_of) and detailed balance information (get_accounts) for veNEAR",
                    operationId: "get-venear-balance",
                    parameters: [
                        {
                            name: "accountId",
                            in: "query",
                        required: true,
                            schema: {
                                type: "string"
                            },
                            description: "The NEAR account ID to get veNEAR balance for"
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Successful response",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                            accountId: { type: "string" },
                                            tokenBalance: {
                                                type: "object",
                                                properties: {
                                                    raw: { type: "string" },
                                                    nears: { type: "string" },
                                                    method: { type: "string" },
                                                    description: { type: "string" }
                                                }
                                            },
                                            detailedBalance: {
                                            type: "object",
                                                nullable: true,
                                            properties: {
                                                    raw: { type: "string" },
                                                    nears: { type: "string" },
                                                    lockedBalance: {
                                                        type: "object",
                                                        properties: {
                                                            raw: { type: "string" },
                                                            nears: { type: "string" }
                                                        }
                                                    },
                                                    votingPower: {
                                                        type: "object",
                                                        properties: {
                                                            raw: { type: "string" },
                                                            nears: { type: "string" }
                                                        }
                                                    },
                                                    delegationPower: {
                                                        type: "object",
                                                        properties: {
                                                            raw: { type: "string" },
                                                            nears: { type: "string" }
                                                        }
                                                    },
                                                    totalPower: {
                                                        type: "object",
                                                        properties: {
                                                            raw: { type: "string" },
                                                            nears: { type: "string" }
                                                        }
                                                    },
                                                    unlockTime: { type: "string" },
                                                    method: { type: "string" },
                                                    description: { type: "string" }
                                                }
                                            },
                                            metadata: {
                                                type: "object",
                                                properties: {
                                                    contract: { type: "string" },
                                                    token: { type: "string" },
                                                    hasDetailedData: { type: "boolean" },
                                                    timestamp: { type: "string" }
                                                }
                                            }
                                        }
                                }
                            }
                        }
                    },
                        "400": {
                            description: "Bad request",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: { type: "string" }
                                        }
                                    }
                                }
                            }
                        },
                        "500": {
                            description: "Server error",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: { type: "string" },
                                            details: { type: "string" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/api/tools/get-account-state": {
                get: {
                    summary: "Get comprehensive account state",
                    description: "Gets comprehensive account state including veNEAR balance, voting power, delegation status, and detailed lockup information (deployment status, balances, timestamps, costs, staking pool data, and governance statistics)",
                    operationId: "get-account-state",
                    parameters: [
                        {
                            name: "accountId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string"
                            },
                            description: "The NEAR account ID to get state for"
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Successful response",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            accountId: { type: "string" },
                                            accountBalance: {
                                                type: "object",
                                                properties: {
                                                    raw: { type: "string" },
                                                    nears: { type: "string" }
                                                }
                                            },
                                            veNearTokenBalance: {
                                                type: "object",
                                                properties: {
                                                    raw: { type: "string" },
                                                    nears: { type: "string" }
                                                }
                                            },
                                            balance: {
                                                type: "object",
                                                properties: {
                                                    raw: { type: "string" },
                                                    nears: { type: "string" }
                                                }
                                            },
                                            lockedBalance: {
                                                type: "object",
                                                nullable: true,
                                                properties: {
                                                    raw: { type: "string" },
                                                    nears: { type: "string" }
                                                }
                                            },
                                            unlockTime: { type: "string", nullable: true },
                                            votingPower: {
                                                type: "object",
                                                nullable: true,
                                                properties: {
                                                    raw: { type: "string" },
                                                    nears: { type: "string" }
                                                }
                                            },
                                            delegationPower: {
                                                type: "object",
                                                nullable: true,
                                                properties: {
                                                    raw: { type: "string" },
                                                    nears: { type: "string" }
                                                }
                                            },
                                            totalPower: {
                                                type: "object",
                                                nullable: true,
                                                properties: {
                                                    raw: { type: "string" },
                                                    nears: { type: "string" }
                                                }
                                            },
                                            delegation: {
                                                type: "object",
                                                properties: {
                                                    isDelegator: { type: "boolean" },
                                                    isDelegate: { type: "boolean" },
                                                    delegatedTo: { type: "string", nullable: true },
                                                    delegatorsCount: { type: "number" },
                                                    totalDelegatedPower: {
                                                        type: "object",
                                                        properties: {
                                                            raw: { type: "string" },
                                                            nears: { type: "string" }
                                                        }
                                                    }
                                                }
                                            },
                                            lockup: {
                                                type: "object",
                                                properties: {
                                                    isLockupDeployed: { type: "boolean" },
                                                    lockupId: { type: "string", nullable: true },
                                                    lockupBalance: {
                                                        type: "object",
                                                        properties: {
                                                            raw: { type: "string" },
                                                            nears: { type: "string" }
                                                        }
                                                    },
                                                    lockupInfoReady: { type: "boolean" },
                                                    lockedAmount: {
                                                        type: "object",
                                                        properties: {
                                                            raw: { type: "string" },
                                                            nears: { type: "string" }
                                                        }
                                                    },
                                                    lockupLiquidOwnersBalance: {
                                                        type: "object",
                                                        properties: {
                                                            raw: { type: "string" },
                                                            nears: { type: "string" }
                                                        }
                                                    },
                                                    lockupLiquidAmount: {
                                                        type: "object",
                                                        properties: {
                                                            raw: { type: "string" },
                                                            nears: { type: "string" }
                                                        }
                                                    },
                                                    withdrawableAmount: {
                                                        type: "object",
                                                        properties: {
                                                            raw: { type: "string" },
                                                            nears: { type: "string" }
                                                        }
                                                    },
                                                    lockupPendingAmount: {
                                                        type: "object",
                                                        properties: {
                                                            raw: { type: "string" },
                                                            nears: { type: "string" }
                                                        }
                                                    },
                                                    lockupUnlockTimestampNs: { type: "string", nullable: true },
                                                    untilUnlock: { type: "string", nullable: true },
                                                    registrationCost: {
                                                        type: "object",
                                                        properties: {
                                                            raw: { type: "string" },
                                                            nears: { type: "string" }
                                                        }
                                                    },
                                                    lockupCost: {
                                                        type: "object",
                                                        properties: {
                                                            raw: { type: "string" },
                                                            nears: { type: "string" }
                                                        }
                                                    },
                                                    stakingPool: { type: "string", nullable: true },
                                                    knownDepositedBalance: {
                                                        type: "object",
                                                        properties: {
                                                            raw: { type: "string" },
                                                            nears: { type: "string" }
                                                        }
                                                    }
                                                }
                                            },
                                            metadata: {
                                                type: "object",
                                                properties: {
                                                    contract: { type: "string" },
                                                    votingContract: { type: "string" },
                                                    token: { type: "string" },
                                                    description: { type: "string" },
                                                    timestamp: { type: "string" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "400": {
                            description: "Bad request",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: { type: "string" }
                                        }
                                    }
                                }
                            }
                        },
                        "404": {
                            description: "Account not found",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: { type: "string" }
                                        }
                                    }
                                }
                            }
                        },
                        "500": {
                            description: "Server error",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: { type: "string" },
                                            details: { type: "string" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
            "/api/tools/search-proposal": {
                get: {
                    summary: "Search proposals by query and filters",
                    description: "Searches through all governance proposals using text queries, status filters, and sorting options",
                    operationId: "search-proposal",
                    parameters: [
                        {
                            name: "q",
                            in: "query",
                            required: false,
                            schema: {
                                type: "string"
                            },
                            description: "Search query to find proposals by title, description, or ID"
                        },


                        {
                            name: "limit",
                            in: "query",
                            required: false,
                            schema: {
                                type: "integer",
                                minimum: 1,
                                maximum: 100
                            },
                            description: "Maximum number of proposals to return (1-100, default: 50)"
                        },

                    ],
                    responses: {
                        "200": {
                            description: "Successful search response",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            proposals: {
                                                type: "array",
                                                items: {
                                                    type: "object",
                                                    properties: {
                                                        id: { type: "number" },
                                                        title: { type: "string" },
                                                        description: { type: "string" },
                                                        status: { type: "string", nullable: true },
                                                        link: { type: "string", nullable: true },
                                                        creation_time_ns: { type: "string", nullable: true },
                                                        reviewer_id: { type: "string", nullable: true },
                                                        voting_start_time_ns: { type: "string", nullable: true },
                                                        voting_duration_ns: { type: "string", nullable: true }
                                                    }
                                                }
                                            },
                                            search: {
                                                type: "object",
                                                properties: {
                                                    query: { type: "string", nullable: true },
                                                    totalFound: { type: "number" },
                                                    limit: { type: "number" }
                                                }
                                            },
                                            statistics: {
                                                type: "object",
                                                properties: {
                                                    totalFound: { type: "number" },
                                                    limit: { type: "number" },
                                                    statusCounts: {
                                                        type: "object",
                                                        additionalProperties: { type: "number" }
                                                    },

                                                }
                                            },
                                            metadata: {
                                                type: "object",
                                                properties: {
                                                    contract: { type: "string" },
                                                    description: { type: "string" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "400": {
                            description: "Bad request",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: { type: "string" }
                                        }
                                    }
                                }
                            }
                        },
                        "500": {
                            description: "Server error",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: { type: "string" },
                                            details: { type: "string" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                                    }
                },
            "/api/tools/approve-proposal": {
                get: {
                    summary: "Approve a governance proposal",
                    description: "Approves a governance proposal by authorized users (owner, guardian, or reviewer). Only proposals with status 'Created' can be approved.",
                    operationId: "approve-proposal",
                    parameters: [
                        {
                            name: "proposalId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string"
                            },
                            description: "The ID of the proposal to approve"
                        },
                        {
                            name: "accountId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string"
                            },
                            description: "The NEAR account ID of the approver"
                        },

                    ],
                    responses: {
                        "200": {
                            description: "Successful approval transaction payload",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                                                                        transactionPayload: {
                                                type: "object",
                                                properties: {
                                                    receiverId: { type: "string" },
                                                    actions: {
                                                        type: "array",
                                                        items: {
                                                            type: "object",
                                                            properties: {
                                                                type: { type: "string" },
                                                                params: {
                                                                    type: "object",
                                                                    properties: {
                                                                        methodName: { type: "string" },
                                                                        gas: { type: "string" },
                                                                        deposit: { type: "string" },
                                                                        args: {
                                                                            type: "object",
                                                                            properties: {
                                                                                proposal_id: { type: "number" },
                                                                                voting_start_time_sec: { type: "null" }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "400": {
                            description: "Bad request",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: { type: "string" }
                                        }
                                    }
                                }
                            }
                        },
                        "403": {
                            description: "Forbidden - insufficient permissions",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: { type: "string" }
                                        }
                                    }
                                }
                            }
                        },
                        "500": {
                            description: "Server error",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: { type: "string" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
        }
    }
}
    return NextResponse.json(pluginData);
}