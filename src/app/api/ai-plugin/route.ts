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
                }
            },
            "/api/tools/create-near-transaction": {
                get: {
                    operationId: "createNearTransaction",
                    summary: "Create a NEAR transaction payload",
                    description: "Generates a NEAR transaction payload for transferring tokens to be used directly in the generate-tx tool",
                    parameters: [
                        {
                            name: "receiverId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string"
                            },
                            description: "The NEAR account ID of the receiver"
                        },
                        {
                            name: "amount",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string"
                            },
                            description: "The amount of NEAR tokens to transfer"
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
                                                        description: "The receiver's NEAR account ID"
                                                    },
                                                    actions: {
                                                        type: "array",
                                                        items: {
                                                            type: "object",
                                                            properties: {
                                                                type: {
                                                                    type: "string",
                                                                    description: "The type of action (e.g., 'Transfer')"
                                                                },
                                                                params: {
                                                                    type: "object",
                                                                    properties: {
                                                                        deposit: {
                                                                            type: "string",
                                                                            description: "The amount to transfer in yoctoNEAR"
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
                                            error: {
                                                type: "string",
                                                description: "Error message"
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "500": {
                            description: "Error response",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: {
                                                type: "string",
                                                description: "Error message"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/api/tools/get-votes": {
                get: {
                    summary: "Get votes for a proposal",
                    description: "Fetches all votes for a specific proposal to track decision split",
                    operationId: "get-votes",
                    parameters: [
                        {
                            name: "proposalId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string"
                            },
                            description: "The ID of the proposal to get votes for"
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
                                            proposalId: { type: "string" },
                                            votes: {
                                                type: "array",
                                                items: {
                                                    type: "object",
                                                    properties: {
                                                        voter: { type: "string" },
                                                        vote: { type: "string" },
                                                        voting_power: { type: "string" },
                                                        timestamp: { type: "string" }
                                                    }
                                                }
                                            },
                                            decisionSplit: {
                                                type: "object",
                                                properties: {
                                                    total: { type: "number" },
                                                    yes: { type: "number" },
                                                    no: { type: "number" },
                                                    abstain: { type: "number" },
                                                    yesPercentage: { type: "string" },
                                                    noPercentage: { type: "string" },
                                                    abstainPercentage: { type: "string" }
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
                    description: "Creates a NEAR transaction payload for voting on a governance proposal",
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
                                type: "string",
                                enum: ["Yes", "No", "Abstain"]
                            },
                            description: "The vote choice (Yes, No, or Abstain)"
                        },
                        {
                            name: "accountId",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string"
                            },
                            description: "The NEAR account ID of the voter"
                        },
                        {
                            name: "snapshotBlockHeight",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string"
                            },
                            description: "The snapshot block height for the proposal"
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
                                                                            description: "Gas limit in gas units"
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
                                            vote: {
                                                type: "object",
                                                properties: {
                                                    proposalId: { type: "number" },
                                                    vote: { type: "string" },
                                                    accountId: { type: "string" },
                                                    snapshotBlockHeight: { type: "number" },
                                                    merkleProof: { type: "string" },
                                                    vAccount: { type: "string" }
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
        },
    };

    return NextResponse.json(pluginData);
}