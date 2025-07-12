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
                    operationId: "approveProposal",
                    summary: "Approve a governance proposal",
                    description: "Generates a NEAR transaction payload for approving governance proposal",
                    parameters: [
                        {
                            name: "proposalId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "integer",
                                minimum: 0
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
                            description: "The user's account ID"
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
                                                    receiverId: { type: "string", description: "Contract account ID to receive the transaction" },
                                                    actions: {
                                                        type: "array",
                                                        items: {
                                                            type: "object",
                                                            properties: {
                                                                type: { type: "string", description: "Action type (FunctionCall)" },
                                                                params: {
                                                                    type: "object",
                                                                    properties: {
                                                                        methodName: { type: "string", description: "Contract method to call" },
                                                                        gas: { type: "string", description: "Gas limit for the transaction" },
                                                                        deposit: { type: "string", description: "NEAR deposit amount" },
                                                                        args: {
                                                                            type: "object",
                                                                            properties: {
                                                                                proposal_id: { type: "integer", description: "ID of the proposal to approve" },
                                                                                voting_start_time_sec: {
                                                                                    type: "integer",
                                                                                    nullable: true,
                                                                                    description: "Voting start time in seconds (null for immediate start)"
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
                    operationId: "createProposal",
                    summary: "Create a new governance proposal",
                    description: "Generates a NEAR transaction payload for creating governance proposal",
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
                            description: "Comma-separated list of voting options"
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
                                                    receiverId: { type: "string", description: "Contract account ID to receive the transaction" },
                                                    actions: {
                                                        type: "array",
                                                        items: {
                                                            type: "object",
                                                            properties: {
                                                                type: { type: "string", description: "Action type (FunctionCall)" },
                                                                params: {
                                                                    type: "object",
                                                                    properties: {
                                                                        methodName: { type: "string", description: "Contract method to call" },
                                                                        gas: { type: "string", description: "Gas limit for the transaction" },
                                                                        deposit: { type: "string", description: "NEAR deposit amount" },
                                                                        args: {
                                                                            type: "object",
                                                                            properties: {
                                                                                metadata: {
                                                                                    type: "object",
                                                                                    properties: {
                                                                                        title: { type: "string", description: "Proposal title" },
                                                                                        description: { type: "string", description: "Proposal description" },
                                                                                        link: { type: "string", description: "Optional link to additional information" },
                                                                                        voting_options: {
                                                                                            type: "array",
                                                                                            items: { type: "string", description: "Voting option text" },
                                                                                            description: "List of voting options for the proposal"
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
                    operationId: "getAccountBalance",
                    summary: "Get NEAR account balance",
                    description: "Returns NEAR balance for user account ID",
                    parameters: [
                        {
                            name: "accountId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string"
                            },
                            description: "The user's account ID"
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
                                            accountId: { type: "string", description: "The user's account ID" },
                                            balance: {
                                                type: "object",
                                                properties: {
                                                    raw: { type: "string", description: "Balance in yoctoNEAR (smallest unit)" },
                                                    nears: { type: "string", description: "Balance in NEAR units" }
                                                }
                                            },
                                            metadata: {
                                                type: "object",
                                                properties: {
                                                    description: { type: "string", description: "Description of the balance data" },
                                                    timestamp: { type: "string", description: "ISO timestamp of when the data was fetched" }
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
                    operationId: "getAccountState",
                    summary: "Get comprehensive account state",
                    description: "Returns detailed account state with veNEAR balance and delegation info",
                    parameters: [
                        {
                            name: "accountId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string"
                            },
                            description: "The user's account ID"
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
                                            accountId: { type: "string", description: "The user's account ID" },
                                            balance: { type: "string", description: "Total veNEAR balance in yoctoNEAR" },
                                            locked_balance: { type: "string", description: "Locked veNEAR balance in yoctoNEAR" },
                                            unlock_time: { type: "string", description: "Timestamp when locked balance becomes available" },
                                            voting_power: { type: "string", description: "Voting power derived from veNEAR balance" },
                                            delegation_power: { type: "string", description: "Power available for delegation" },
                                            total_power: { type: "string", description: "Total power (voting + delegation)" },
                                            is_delegator: { type: "boolean", description: "Whether the account is a delegator" },
                                            is_delegate: { type: "boolean", description: "Whether the account is a delegate" },
                                            delegated_to: { type: "string", description: "Account ID this user delegates to" },
                                            delegators_count: { type: "integer", description: "Number of delegators for this account" },
                                            total_delegated_power: { type: "string", description: "Total power delegated to this account" },
                                            last_vote: {
                                                type: "object",
                                                properties: {
                                                    proposal_id: { type: "integer", description: "ID of the last proposal voted on" },
                                                    vote: { type: "string", description: "Vote cast on the last proposal" },
                                                    timestamp: { type: "string", description: "Timestamp of the last vote" }
                                                }
                                            },
                                            governance_stats: {
                                                type: "object",
                                                properties: {
                                                    total_votes: { type: "integer", description: "Total number of votes cast" },
                                                    yes_votes: { type: "integer", description: "Number of yes votes" },
                                                    no_votes: { type: "integer", description: "Number of no votes" },
                                                    abstain_votes: { type: "integer", description: "Number of abstain votes" },
                                                    participation_rate: { type: "number", description: "Voting participation rate as percentage" }
                                                }
                                            },
                                            lockupInfo: {
                                                type: "object",
                                                properties: {
                                                    isLockupDeployed: { type: "boolean", description: "Whether the lockup contract is deployed" },
                                                    lockupId: { type: "string", description: "Lockup account ID" },
                                                    lockupBalance: { type: "string", description: "Total balance in lockup contract" },
                                                    lockupInfoReady: { type: "boolean", description: "Whether lockup info is fully loaded" },
                                                    lockedAmount: { type: "string", description: "Amount locked in the contract" },
                                                    lockupLiquidOwnersBalance: { type: "string", description: "Liquid balance owned by main account" },
                                                    lockupLiquidAmount: { type: "string", description: "Liquid amount available in lockup" },
                                                    withdrawableAmount: { type: "string", description: "Amount that can be withdrawn" },
                                                    lockupPendingAmount: { type: "string", description: "Pending amount in lockup" },
                                                    lockupUnlockTimestampNs: { type: "string", description: "Unlock timestamp in nanoseconds" },
                                                    untilUnlock: { type: "string", description: "Human-readable unlock time" },
                                                    registrationCost: { type: "string", description: "Cost to register with veNEAR" },
                                                    lockupCost: { type: "string", description: "Cost to deploy lockup contract" },
                                                    stakingPool: { type: "string", description: "Staking pool account ID" },
                                                    knownDepositedBalance: { type: "string", description: "Known deposited balance in staking pool" }
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
                    operationId: "getDelegators",
                    summary: "Get delegators for an account",
                    description: "Returns list of delegators for delegate account ID",
                    parameters: [
                        {
                            name: "accountId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string"
                            },
                            description: "The delegate account ID"
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
                                            accountId: { type: "string", description: "The delegate's account ID" },
                                            delegators: {
                                                type: "array",
                                                items: {
                                                    type: "object",
                                                    properties: {
                                                        delegator: { type: "string", description: "Account ID of the delegator" },
                                                        delegated_power: { type: "string", description: "Amount of power delegated" },
                                                        delegation_date: { type: "string", description: "Date when delegation was made" }
                                                    }
                                                }
                                            },
                                            delegationStats: {
                                                type: "object",
                                                properties: {
                                                    totalDelegators: { type: "integer", description: "Total number of delegators" },
                                                    totalDelegatedPower: { type: "string", description: "Total power delegated to this account" },
                                                    averageDelegation: { type: "string", description: "Average delegation amount" }
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
                    operationId: "getProposal",
                    summary: "Get a specific proposal",
                    description: "Returns governance proposal details by proposal ID",
                    parameters: [
                        {
                            name: "proposalId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string"
                            },
                            description: "The proposal ID"
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
                                                    id: { type: "integer", description: "Unique proposal identifier" },
                                                    title: { type: "string", description: "Proposal title" },
                                                    description: { type: "string", description: "Detailed proposal description" },
                                                    link: { type: "string", description: "Optional link to additional information" },
                                                    deadline: { type: "string", description: "Voting deadline timestamp" },
                                                    voting_power: { type: "string", description: "Voting power for this proposal" },
                                                    status: { type: "string", description: "Current proposal status" },
                                                    snapshot_block: { type: "integer", description: "Block number for voting snapshot" },
                                                    total_voting_power: { type: "string", description: "Total voting power in the system" }
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
                    operationId: "getRecentActiveProposals",
                    summary: "Get recent active proposals",
                    description: "Returns recent proposals currently active for voting",
                    parameters: [
                        {
                            name: "count",
                            in: "query",
                            required: false,
                            schema: {
                                type: "integer",
                                minimum: 1,
                                maximum: 50,
                                default: 5
                            },
                            description: "Number of proposals to fetch (1-50)"
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
                                                        id: { type: "integer", description: "Unique proposal identifier" },
                                                        title: { type: "string", description: "Proposal title" },
                                                        description: { type: "string", description: "Detailed proposal description" },
                                                        snapshot_block: { type: "integer", description: "Block number for voting snapshot" },
                                                        total_voting_power: { type: "string", description: "Total voting power in the system" },
                                                        link: { type: "string", description: "Optional link to additional information" },
                                                        deadline: { type: "string", description: "Voting deadline timestamp" }
                                                    }
                                                }
                                            },
                                            totalCount: { type: "integer", description: "Total number of active proposals" },
                                            fromIndex: { type: "integer", description: "Starting index of the results" },
                                            limit: { type: "integer", description: "Number of proposals returned" }
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
                    operationId: "getRecentProposals",
                    summary: "Get recent proposals",
                    description: "Returns recent governance proposals with all statuses",
                    parameters: [
                        {
                            name: "count",
                            in: "query",
                            required: false,
                                schema: {
                                type: "integer",
                                minimum: 1,
                                maximum: 50,
                                default: 5
                            },
                            description: "Number of proposals to fetch (1-50)"
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
                                                        id: { type: "integer", description: "Unique proposal identifier" },
                                                        title: { type: "string", description: "Proposal title" },
                                                        description: { type: "string", description: "Detailed proposal description" },
                                                        status: { type: "string", description: "Current proposal status" },
                                                        link: { type: "string", description: "Optional link to additional information" },
                                                        deadline: { type: "string", description: "Voting deadline timestamp" },
                                                        voting_power: { type: "string", description: "Voting power for this proposal" }
                                                    }
                                                }
                                            },
                                            totalCount: { type: "integer", description: "Total number of proposals" },
                                            fromIndex: { type: "integer", description: "Starting index of the results" },
                                            limit: { type: "integer", description: "Number of proposals returned" }
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
                    operationId: "getVeNearBalance",
                    summary: "Get veNEAR balance",
                    description: "Returns veNEAR token balance for user account ID",
                    parameters: [
                        {
                            name: "accountId",
                            in: "query",
                        required: true,
                                schema: {
                                            type: "string"
                                },
                            description: "The user's account ID"
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
                                            accountId: { type: "string", description: "The user's account ID" },
                                            tokenBalance: {
                                                type: "object",
                                                properties: {
                                                    raw: { type: "string", description: "veNEAR balance in yoctoNEAR" },
                                                    nears: { type: "string", description: "veNEAR balance in NEAR units" },
                                                    method: { type: "string", description: "Method used to fetch balance" },
                                                    description: { type: "string", description: "Description of the balance data" }
                                                }
                                            },
                                            detailedBalance: {
                                                type: "object",
                                                nullable: true,
                                                properties: {
                                                    raw: { type: "string", description: "Detailed balance in yoctoNEAR" },
                                                    nears: { type: "string", description: "Detailed balance in NEAR units" },
                                                    lockedBalance: {
                                                        type: "object",
                                                        properties: {
                                                            raw: { type: "string", description: "Locked balance in yoctoNEAR" },
                                                            nears: { type: "string", description: "Locked balance in NEAR units" }
                                                        }
                                                    },
                                                    votingPower: {
                                                        type: "object",
                                                        properties: {
                                                            raw: { type: "string", description: "Voting power in yoctoNEAR" },
                                                            nears: { type: "string", description: "Voting power in NEAR units" }
                                                        }
                                                    },
                                                    delegationPower: {
                                                        type: "object",
                                                        properties: {
                                                            raw: { type: "string", description: "Delegation power in yoctoNEAR" },
                                                            nears: { type: "string", description: "Delegation power in NEAR units" }
                                                        }
                                                    },
                                                    totalPower: {
                                                        type: "object",
                                                        properties: {
                                                            raw: { type: "string", description: "Total power in yoctoNEAR" },
                                                            nears: { type: "string", description: "Total power in NEAR units" }
                                                        }
                                                    },
                                                    unlockTime: { type: "string", description: "Timestamp when locked funds unlock" },
                                                    method: { type: "string", description: "Method used to fetch detailed data" },
                                                    description: { type: "string", description: "Description of the detailed balance" }
                                                }
                                            },
                                            metadata: {
                                                type: "object",
                                                properties: {
                                                    contract: { type: "string", description: "veNEAR contract address" },
                                                    token: { type: "string", description: "Token symbol (veNEAR)" },
                                                    hasDetailedData: { type: "boolean", description: "Whether detailed data is available" },
                                                    timestamp: { type: "string", description: "ISO timestamp of when data was fetched" }
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
                    operationId: "searchProposal",
                    summary: "Search proposals",
                    description: "Returns governance proposals matching search query",
                    parameters: [
                        {
                            name: "q",
                            in: "query",
                            required: false,
                            schema: {
                                type: "string"
                            },
                            description: "Search query for semantic search"
                        },
                        {
                            name: "limit",
                            in: "query",
                            required: false,
                            schema: {
                                type: "integer",
                                minimum: 1,
                                maximum: 100,
                                default: 50
                            },
                            description: "Maximum number of results to return (1-100)"
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
                                                        id: { type: "integer", description: "Unique proposal identifier" },
                                                        title: { type: "string", description: "Proposal title" },
                                                        description: { type: "string", description: "Detailed proposal description" },
                                                        link: { type: "string", description: "Optional link to additional information" },
                                                        status: { type: "string", description: "Current proposal status" },
                                                        creation_time_ns: { type: "string", description: "Creation timestamp in nanoseconds" },
                                                        reviewer_id: { type: "string", description: "ID of the proposal reviewer" },
                                                        voting_start_time_ns: { type: "string", description: "Voting start time in nanoseconds" },
                                                        voting_duration_ns: { type: "string", description: "Voting duration in nanoseconds" }
                                                    }
                                                }
                                            },
                                            query: { type: "string", description: "Search query used" },
                                            limit: { type: "integer", description: "Maximum number of results returned" },
                                            totalFound: { type: "integer", description: "Total number of proposals found" }
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
                    operationId: "vote",
                    summary: "Vote on a proposal",
                    description: "Generates a NEAR transaction payload for voting on governance proposal",
                    parameters: [
                        {
                            name: "proposalId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string"
                            },
                            description: "The proposal ID to vote on"
                        },
                        {
                            name: "accountId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string"
                            },
                            description: "The user's account ID"
                        },
                        {
                            name: "vote",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string"
                            },
                            description: "The voting option text (e.g., 'Yes', 'No', 'Abstain')"
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
                                                    receiverId: { type: "string", description: "Contract account ID to receive the transaction" },
                                                    actions: {
                                                        type: "array",
                                                        items: {
                                                            type: "object",
                                                            properties: {
                                                                type: { type: "string", description: "Action type (FunctionCall)" },
                                                                params: {
                                                                    type: "object",
                                                                    properties: {
                                                                        methodName: { type: "string", description: "Contract method to call" },
                                                                        gas: { type: "string", description: "Gas limit for the transaction" },
                                                                        deposit: { type: "string", description: "NEAR deposit amount" },
                                                                        args: {
                                                                            type: "object",
                                                                            properties: {
                                                                                proposal_id: { type: "integer", description: "ID of the proposal to vote on" },
                                                                                vote: { type: "integer", description: "Vote index (0 for first option, 1 for second, etc.)" },
                                                                                merkle_proof: { type: "string", description: "Merkle proof for veNEAR verification" },
                                                                                v_account: { type: "string", description: "Virtual account identifier" }
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
            },
            "/api/tools/deploy-lockup": {
                get: {
                    operationId: "deployLockup",
                    summary: "Deploy lockup contract",
                    description: "Generates a NEAR transaction payload for deploying lockup contract",
                    parameters: [],
                    responses: {
                        "200": {
                            description: "Lockup deployment transaction payload generated successfully",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            transactionPayload: {
                                                type: "object",
                                                properties: {
                                                    receiverId: { type: "string", description: "Contract account ID to receive the transaction" },
                                                    actions: {
                                                        type: "array",
                                                        items: {
                                                            type: "object",
                                                            properties: {
                                                                type: { type: "string", description: "Action type (FunctionCall)" },
                                                                params: {
                                                                    type: "object",
                                                                    properties: {
                                                                        methodName: { type: "string", description: "Contract method to call" },
                                                                        gas: { type: "string", description: "Gas limit for the transaction" },
                                                                        deposit: { type: "string", description: "NEAR deposit amount (dynamic cost from contract)" },
                                                                        args: {
                                                                            type: "object",
                                                                            properties: {},
                                                                            description: "Empty arguments object"
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
                        "500": {
                            description: "Internal server error"
                        }
                    }
                }
            },
            "/api/tools/delete-lockup": {
                get: {
                    operationId: "deleteLockup",
                    summary: "Delete lockup contract",
                    description: "Generates a NEAR transaction payload for deleting lockup contract when locked amount is zero",
                    parameters: [
                        {
                            name: "accountId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string"
                            },
                            description: "The user's account ID"
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Lockup deletion transaction payload generated successfully",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            transactionPayload: {
                                                type: "object",
                                                properties: {
                                                    receiverId: { type: "string", description: "Lockup contract account ID to receive the transaction" },
                                                    actions: {
                                                        type: "array",
                                                        items: {
                                                            type: "object",
                                                            properties: {
                                                                type: { type: "string", description: "Action type (FunctionCall)" },
                                                                params: {
                                                                    type: "object",
                                                                    properties: {
                                                                        methodName: { type: "string", description: "Contract method to call (delete_lockup)" },
                                                                        gas: { type: "string", description: "Gas limit for the transaction (200 Tgas)" },
                                                                        deposit: { type: "string", description: "NEAR deposit amount (at least 1 yoctoNEAR)" },
                                                                        args: {
                                                                            type: "object",
                                                                            properties: {},
                                                                            description: "Empty arguments object"
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
                            description: "Bad request - invalid parameters, no lockup found, or locked amount is not zero"
                        },
                        "500": {
                            description: "Internal server error"
                        }
                    }
                }
            },
            "/api/tools/lock-near": {
                get: {
                    operationId: "lockNear",
                    summary: "Lock NEAR tokens",
                    description: "Generates a NEAR transaction payload for locking NEAR tokens in the lockup contract",
                    parameters: [
                        {
                            name: "accountId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string"
                            },
                            description: "The user's account ID"
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Lock NEAR transaction payload generated successfully",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            transactionPayload: {
                                                type: "object",
                                                properties: {
                                                    receiverId: { type: "string", description: "Lockup contract account ID to receive the transaction" },
                                                    actions: {
                                                        type: "array",
                                                        items: {
                                                            type: "object",
                                                            properties: {
                                                                type: { type: "string", description: "Action type (FunctionCall)" },
                                                                params: {
                                                                    type: "object",
                                                                    properties: {
                                                                        methodName: { type: "string", description: "Contract method to call (lock_near)" },
                                                                        gas: { type: "string", description: "Gas limit for the transaction (100 Tgas)" },
                                                                        deposit: { type: "string", description: "NEAR deposit amount (at least 1 yoctoNEAR)" },
                                                                        args: {
                                                                            type: "object",
                                                                            properties: {},
                                                                            description: "Empty arguments object"
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }                                        }
                                    }
                                }
                            }
                        },
                        "400": {
                            description: "Bad request - invalid parameters, no lockup found, or insufficient liquid balance"
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