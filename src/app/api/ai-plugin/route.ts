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
                instructions: "You help with NEAR governance, create NEAR transactions, and manage proposal data. For governance, you can fetch proposal details, get recent proposals, handle proposal events, and process governance notifications. For blockchain transactions, first generate a transaction payload using the appropriate endpoint (/api/tools/create-near-transaction), then explicitly use the 'generate-transaction' tool for NEAR to actually send the transaction on the client side. Simply getting the payload from the endpoints is not enough - the corresponding tool must be used to execute the transaction.",
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
            "/api/tools/handle-new-proposal": {
                post: {
                    summary: "Handle new proposal event",
                    description: "Processes a new proposal submission event and formats a notification message",
                    operationId: "handle-new-proposal",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["proposalId"],
                                    properties: {
                                        proposalId: {
                                            type: "string",
                                            description: "The ID of the new proposal"
                                        },
                                        eventDetails: {
                                            type: "object",
                                            properties: {
                                                title: { type: "string" },
                                                description: { type: "string" },
                                                link: { type: "string" }
                                            },
                                            description: "Optional event details"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        "200": {
                            description: "Successful response",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            success: { type: "boolean" },
                                            proposalId: { type: "string" },
                                            message: { type: "string" },
                                            proposal: { type: "object" },
                                            eventDetails: { type: "object" }
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
            "/api/tools/handle-proposal-approval": {
                post: {
                    summary: "Handle proposal approval event",
                    description: "Processes a proposal approval event and formats a notification message",
                    operationId: "handle-proposal-approval",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["proposalId"],
                                    properties: {
                                        proposalId: {
                                            type: "string",
                                            description: "The ID of the approved proposal"
                                        },
                                        eventDetails: {
                                            type: "object",
                                            properties: {
                                                title: { type: "string" },
                                                description: { type: "string" },
                                                link: { type: "string" }
                                            },
                                            description: "Optional event details"
                                        },
                                        currentStatus: {
                                            type: "string",
                                            description: "Current status of the proposal"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        "200": {
                            description: "Successful response",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            success: { type: "boolean" },
                                            proposalId: { type: "string" },
                                            message: { type: "string" },
                                            proposal: { type: "object" },
                                            eventDetails: { type: "object" },
                                            newStatus: { type: "string" },
                                            alreadyProcessed: { type: "boolean" }
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
        },
    };

    return NextResponse.json(pluginData);
}