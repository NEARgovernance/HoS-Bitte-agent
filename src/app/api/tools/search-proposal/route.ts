import { NextResponse } from 'next/server';
import { VOTING_CONTRACT, NEAR_RPC_URL } from '@/app/config';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from "@langchain/core/documents";

// Define proposal type
interface Proposal {
  id: number;
  title: string;
  description: string;
  link?: string;
  status?: string;
  creation_time_ns?: string;
  reviewer_id?: string;
  voting_start_time_ns?: string;
  voting_duration_ns?: string;
}

// Global vector store and embeddings instance
let vectorStore: MemoryVectorStore | null = null;
let embeddings: OpenAIEmbeddings | null = null;

// Initialize embeddings and vector store
async function initializeVectorStore(proposals: Proposal[]): Promise<MemoryVectorStore> {
  if (!embeddings) {
    embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }

  if (!vectorStore) {
    // Create documents from proposals
    const documents = proposals.map(proposal => {
      const content = `Title: ${proposal.title}\nDescription: ${proposal.description}\nStatus: ${proposal.status || 'unknown'}\nID: ${proposal.id}`;
      return new Document({
        pageContent: content,
        metadata:{
            id: proposal.id,
            title: proposal.title,
            description: proposal.description,
            status: proposal.status,
            link: proposal.link,
            creation_time_ns: proposal.creation_time_ns,
            reviewer_id: proposal.reviewer_id,
            voting_start_time_ns: proposal.voting_start_time_ns,
            voting_duration_ns: proposal.voting_duration_ns,
          },
      });
    });

    vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);
  }

  return vectorStore;
}

// Get total number of proposals
async function getNumProposals(): Promise<number | NextResponse> {
  if (!VOTING_CONTRACT) {
    return NextResponse.json({ error: 'VOTING_CONTRACT environment variable not set' }, { status: 500 });
  }

  const payload = {
    jsonrpc: "2.0",
    id: "1",
    method: "query",
    params: {
      request_type: "call_function",
      finality: "final",
      account_id: VOTING_CONTRACT,
      method_name: "get_num_proposals",
      args_base64: Buffer.from(JSON.stringify({})).toString("base64"),
    },
  };

  try {
    const res = await fetch(NEAR_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `RPC request failed: ${res.status}` }, { status: 500 });
    }

    const json = await res.json();

    if (json.error) {
      return NextResponse.json({ error: `RPC error: ${json.error.message}` }, { status: 500 });
    }

    if (!json.result || !json.result.result || json.result.result.length === 0) {
      return 0;
    }

    // Convert byte array to string, then parse JSON
    const bytes = json.result.result;
    const raw = Buffer.from(bytes).toString("utf-8");
    const numProposals = JSON.parse(raw);

    return numProposals;
  } catch (error) {
    console.error('Error fetching number of proposals:', error);
    return NextResponse.json({ error: 'Failed to fetch number of proposals' }, { status: 500 });
  }
}

// Fetch all proposals from NEAR RPC
async function fetchAllProposals(): Promise<Proposal[] | NextResponse> {
  if (!VOTING_CONTRACT) {
    return NextResponse.json({ error: 'VOTING_CONTRACT environment variable not set' }, { status: 500 });
  }

  // First get the total number of proposals
  const numProposalsResult = await getNumProposals();
  
  // Check if result is an error response
  if (numProposalsResult instanceof NextResponse) {
    return numProposalsResult;
  }

  const numProposals = numProposalsResult;
  
  if (numProposals === 0) {
    return [];
  }

  const payload = {
    jsonrpc: "2.0",
    id: "1",
    method: "query",
    params: {
      request_type: "call_function",
      finality: "final",
      account_id: VOTING_CONTRACT,
      method_name: "get_proposals",
      args_base64: Buffer.from(JSON.stringify({ from_index: 0, limit: numProposals })).toString("base64"),
    },
  };

  try {
    const res = await fetch(NEAR_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `RPC request failed: ${res.status}` }, { status: 500 });
    }

    const json = await res.json();

    if (json.error) {
      return NextResponse.json({ error: `RPC error: ${json.error.message}` }, { status: 500 });
    }

    if (!json.result || !json.result.result || json.result.result.length === 0) {
      return [];
    }

    // Convert byte array to string, then parse JSON
    const bytes = json.result.result;
    const raw = Buffer.from(bytes).toString("utf-8");
    const proposals: Proposal[] = JSON.parse(raw);

    return proposals;
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
  }
}

// Semantic search using vector embeddings
async function semanticSearch(proposals: Proposal[], query: string, limit: number = 10): Promise<Proposal[]> {
  if (!query || query.trim().length === 0) {
    return proposals;
  }

  try {
    const vectorStore = await initializeVectorStore(proposals);
    
    // Perform similarity search
    const results = await vectorStore.similaritySearch(query, limit);
    // Convert back to proposals and maintain order
    const proposalMap = new Map(proposals.map(p => [p.id, p]));
    const semanticResults: Proposal[] = [];
    
    for (const result of results) {
      const proposal = proposalMap.get(result.metadata.id);
      if (proposal) {
        semanticResults.push(proposal);
      }
    }
    
    return semanticResults;
  } catch (error) {
    console.error('Semantic search error:', error);
    // Return empty array if semantic search fails
    return [];
  }
}







export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = searchParams.get('limit');

    // Validate limit parameter
    let limitValue = 50; // default
    if (limit) {
      const parsedLimit = parseInt(limit);
      if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) {
        limitValue = parsedLimit;
      } else {
        return NextResponse.json({ 
          error: 'limit must be a number between 1 and 100' 
        }, { status: 200 });
      }
    }





    if (!VOTING_CONTRACT) {
      return NextResponse.json({ error: 'VOTING_CONTRACT environment variable not set' }, { status: 500 });
    }

    // Fetch all proposals
    const result = await fetchAllProposals();
    
    // Check if result is an error response
    if (result instanceof NextResponse) {
      return result;
    }

    let proposals = result;

    // Apply search filter
    if (query.trim()) {
      proposals = await semanticSearch(proposals, query, limitValue);
    }





    // Apply limit
    const totalFound = proposals.length;
    proposals = proposals.slice(0, limitValue);

    // Calculate statistics
    const statusCounts = proposals.reduce((acc: Record<string, number>, proposal: Proposal) => {
      const status = proposal.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});



    return NextResponse.json({ 
      proposals,
      search: {
        query: query || null,
        totalFound,
        limit: limitValue
      },
      statistics: {
        totalFound,
        limit: limitValue,
        statusCounts
      },
      metadata: {
        contract: VOTING_CONTRACT,
        description: "Search results for House of Stake governance proposals"
      }
    });
  } catch (error) {
    console.error('Error searching proposals:', error);
    return NextResponse.json({ 
      error: 'Failed to search proposals',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 