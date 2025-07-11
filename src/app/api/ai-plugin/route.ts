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
            "/api/tools/approve-proposal": {
                get: {
                    summary: "Approve a governance proposal",
                    description: "Generate a NEAR transaction payload to approve a governance proposal. Requires appropriate permissions (owner, guardian, or reviewer role).",
                    parameters: [
                        {
                            name: "proposalId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "integer",
                                minimum: 0,
                                description: "The ID of the proposal to approve"
                            }
                        },
                        {
                            name: "accountId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string",
                                description: "The account ID requesting approval"
                            }
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Approval transaction payload generated successfully",
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
                                                                                proposal_id: { type: "integer" },
                                                                                voting_start_time_sec: {
                                                                                    type: "integer",
                                                                                    nullable: true
                                                                                }
                                                                            },
                                                                            required: ["proposal_id", "voting_start_time_sec"]
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
                            description: "Bad request - invalid parameters or proposal cannot be approved"
                        },
                        "403": {
                            description: "Forbidden - insufficient permissions"
                        },
                        "500": {
                            description: "Internal server error"
                        }
                    }
                }
            },
            "/api/tools/create-proposal": {
                get: {
                    summary: "Create a new governance proposal",
                    description: "Generate a NEAR transaction payload to create a new governance proposal",
                    parameters: [
                        {
                            name: "title",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string",
                                description: "The title of the proposal"
                            }
                        },
                        {
                            name: "description",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string",
                                description: "The description of the proposal"
                            }
                        },
                        {
                            name: "link",
                            in: "query",
                            required: false,
                            schema: {
                                type: "string",
                                description: "Optional link to additional information"
                            }
                        },
                        {
                            name: "votingOptions",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string",
                                description: "Comma-separated list of voting options"
                            }
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Proposal creation transaction payload generated successfully",
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
                                                                                    },
                                                                                    required: ["title", "description", "voting_options"]
                                                                                }
                                                                            },
                                                                            required: ["metadata"]
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
                            description: "Bad request - missing required parameters"
                        },
                        "500": {
                            description: "Internal server error"
                        }
                    }
                }
            },
            "/api/tools/get-account-balance": {
                get: {
                    summary: "Get NEAR account balance",
                    description: "Fetch the NEAR balance for a specific account",
                    parameters: [
                        {
                            name: "accountId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string",
                                description: "The NEAR account ID"
                            }
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Account balance retrieved successfully",
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
                            description: "Bad request - invalid account ID"
                        },
                        "500": {
                            description: "Internal server error"
                        }
                    }
                }
            },
            "/api/tools/get-account-state": {
                get: {
                    summary: "Get comprehensive account state",
                    description: "Fetch detailed account state including veNEAR balance, delegation info, and lockup details",
                    parameters: [
                        {
                            name: "accountId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string",
                                description: "The NEAR account ID"
                            }
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Account state retrieved successfully",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            accountId: { type: "string" },
                                            balance: { type: "string" },
                                            locked_balance: { type: "string" },
                                            unlock_time: { type: "string" },
                                            voting_power: { type: "string" },
                                            delegation_power: { type: "string" },
                                            total_power: { type: "string" },
                                            is_delegator: { type: "boolean" },
                                            is_delegate: { type: "boolean" },
                                            delegated_to: { type: "string" },
                                            delegators_count: { type: "integer" },
                                            total_delegated_power: { type: "string" },
                                            last_vote: {
                                                type: "object",
                                                properties: {
                                                    proposal_id: { type: "integer" },
                                                    vote: { type: "string" },
                                                    timestamp: { type: "string" }
                                                }
                                            },
                                            governance_stats: {
                                                type: "object",
                                                properties: {
                                                    total_votes: { type: "integer" },
                                                    yes_votes: { type: "integer" },
                                                    no_votes: { type: "integer" },
                                                    abstain_votes: { type: "integer" },
                                                    participation_rate: { type: "number" }
                                                }
                                            },
                                            lockupInfo: {
                                                type: "object",
                                                properties: {
                                                    isLockupDeployed: { type: "boolean" },
                                                    lockupId: { type: "string" },
                                                    lockupBalance: { type: "string" },
                                                    lockupInfoReady: { type: "boolean" },
                                                    lockedAmount: { type: "string" },
                                                    lockupLiquidOwnersBalance: { type: "string" },
                                                    lockupLiquidAmount: { type: "string" },
                                                    withdrawableAmount: { type: "string" },
                                                    lockupPendingAmount: { type: "string" },
                                                    lockupUnlockTimestampNs: { type: "string" },
                                                    untilUnlock: { type: "string" },
                                                    registrationCost: { type: "string" },
                                                    lockupCost: { type: "string" },
                                                    stakingPool: { type: "string" },
                                                    knownDepositedBalance: { type: "string" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "400": {
                            description: "Bad request - invalid account ID or no veNEAR balance found"
                        },
                        "500": {
                            description: "Internal server error"
                        }
                    }
                }
            },
            "/api/tools/get-delegators": {
                get: {
                    summary: "Get delegators for an account",
                    description: "Fetch all delegators for a specific delegate account",
                    parameters: [
                        {
                            name: "accountId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string",
                                description: "The delegate account ID"
                            }
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Delegators retrieved successfully",
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
                                                    totalDelegators: { type: "integer" },
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
                            description: "Bad request - invalid account ID or no delegators found"
                        },
                        "500": {
                            description: "Internal server error"
                        }
                    }
                }
            },
            "/api/tools/get-proposal": {
                get: {
                    summary: "Get a specific proposal",
                    description: "Fetch details of a specific governance proposal by ID",
                    parameters: [
                        {
                            name: "proposalId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string",
                                description: "The proposal ID"
                            }
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Proposal retrieved successfully",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            proposal: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "integer" },
                                                    title: { type: "string" },
                                                    description: { type: "string" },
                                                    link: { type: "string" },
                                                    deadline: { type: "string" },
                                                    voting_power: { type: "string" },
                                                    status: { type: "string" },
                                                    snapshot_block: { type: "integer" },
                                                    total_voting_power: { type: "string" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "400": {
                            description: "Bad request - invalid proposal ID or proposal does not exist"
                        },
                        "500": {
                            description: "Internal server error"
                        }
                    }
                }
            },
            "/api/tools/get-recent-active-proposals": {
                get: {
                    summary: "Get recent active proposals",
                    description: "Fetch recent proposals that are currently active for voting",
                    parameters: [
                        {
                            name: "count",
                            in: "query",
                            required: false,
                            schema: {
                                type: "integer",
                                minimum: 1,
                                maximum: 50,
                                default: 5,
                                description: "Number of proposals to fetch (1-50)"
                            }
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Active proposals retrieved successfully",
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
                                                        id: { type: "integer" },
                                                        title: { type: "string" },
                                                        description: { type: "string" },
                                                        snapshot_block: { type: "integer" },
                                                        total_voting_power: { type: "string" },
                                                        link: { type: "string" },
                                                        deadline: { type: "string" }
                                                    }
                                                }
                                            },
                                            totalCount: { type: "integer" },
                                            fromIndex: { type: "integer" },
                                            limit: { type: "integer" }
                                        }
                                    }
                                }
                            }
                        },
                        "400": {
                            description: "Bad request - invalid count parameter"
                        },
                        "500": {
                            description: "Internal server error"
                        }
                    }
                }
            },
            "/api/tools/get-recent-proposals": {
                get: {
                    summary: "Get recent proposals",
                    description: "Fetch recent governance proposals (all statuses)",
                    parameters: [
                        {
                            name: "count",
                            in: "query",
                            required: false,
                            schema: {
                                type: "integer",
                                minimum: 1,
                                maximum: 50,
                                default: 5,
                                description: "Number of proposals to fetch (1-50)"
                            }
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Proposals retrieved successfully",
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
                                                        id: { type: "integer" },
                                                        title: { type: "string" },
                                                        description: { type: "string" },
                                                        status: { type: "string" },
                                                        link: { type: "string" },
                                                        deadline: { type: "string" },
                                                        voting_power: { type: "string" }
                                                    }
                                                }
                                            },
                                            totalCount: { type: "integer" },
                                            fromIndex: { type: "integer" },
                                            limit: { type: "integer" }
                                        }
                                    }
                                }
                            }
                        },
                        "400": {
                            description: "Bad request - invalid count parameter"
                        },
                        "500": {
                            description: "Internal server error"
                        }
                    }
                }
            },
            "/api/tools/get-venear-balance": {
                get: {
                    summary: "Get veNEAR balance",
                    description: "Fetch veNEAR token balance and detailed balance information for an account",
                    parameters: [
                        {
                            name: "accountId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string",
                                description: "The NEAR account ID"
                            }
                        }
                    ],
                    responses: {
                        "200": {
                            description: "veNEAR balance retrieved successfully",
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
                            description: "Bad request - invalid account ID"
                        },
                        "500": {
                            description: "Internal server error"
                        }
                    }
                }
            },
            "/api/tools/search-proposal": {
                get: {
                    summary: "Search proposals",
                    description: "Search governance proposals using semantic search with vector embeddings",
                    parameters: [
                        {
                            name: "q",
                            in: "query",
                            required: false,
                            schema: {
                                type: "string",
                                description: "Search query for semantic search"
                            }
                        },
                        {
                            name: "limit",
                            in: "query",
                            required: false,
                            schema: {
                                type: "integer",
                                minimum: 1,
                                maximum: 100,
                                default: 50,
                                description: "Maximum number of results to return (1-100)"
                            }
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Search results retrieved successfully",
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
                                                        id: { type: "integer" },
                                                        title: { type: "string" },
                                                        description: { type: "string" },
                                                        link: { type: "string" },
                                                        status: { type: "string" },
                                                        creation_time_ns: { type: "string" },
                                                        reviewer_id: { type: "string" },
                                                        voting_start_time_ns: { type: "string" },
                                                        voting_duration_ns: { type: "string" }
                                                    }
                                                }
                                            },
                                            query: { type: "string" },
                                            limit: { type: "integer" },
                                            totalFound: { type: "integer" }
                                        }
                                    }
                                }
                            }
                        },
                        "400": {
                            description: "Bad request - invalid limit parameter"
                        },
                        "500": {
                            description: "Internal server error"
                        }
                    }
                }
            },
            "/api/tools/vote": {
                get: {
                    summary: "Vote on a proposal",
                    description: "Generate a NEAR transaction payload to vote on a governance proposal",
                    parameters: [
                        {
                            name: "proposalId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string",
                                description: "The proposal ID to vote on"
                            }
                        },
                        {
                            name: "accountId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string",
                                description: "The account ID voting on the proposal"
                            }
                        },
                        {
                            name: "vote",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string",
                                description: "The voting option text (e.g., 'Yes', 'No', 'Abstain')"
                            }
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Vote transaction payload generated successfully",
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
                                                                                proposal_id: { type: "integer" },
                                                                                vote: { type: "integer" },
                                                                                merkle_proof: { type: "string" },
                                                                                v_account: { type: "string" }
                                                                            },
                                                                            required: ["proposal_id", "vote", "merkle_proof", "v_account"]
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
                            description: "Bad request - invalid parameters, proposal not active, or user already voted"
                        },
                        "500": {
                            description: "Internal server error"
                        }
                    }
                }
            }
        }
    };
    return NextResponse.json(pluginData);
}