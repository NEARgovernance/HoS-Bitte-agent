import { NextResponse } from 'next/server';
import { VOTING_CONTRACT, NEAR_RPC_URL } from '@/app/config';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from "@langchain/core/documents";
import { generateText } from "ai";

// Define proposal type
interface Proposal {
  id: number;
  title: string;
  description: string;
  link?: string;
  deadline?: string;
  voting_power?: string;
  status?: string;
  snapshot_block?: number;
  total_voting_power?: string;
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
        metadata: {
          id: proposal.id,
          title: proposal.title,
          description: proposal.description,
          status: proposal.status,
          link: proposal.link,
          deadline: proposal.deadline,
          voting_power: proposal.voting_power,
          snapshot_block: proposal.snapshot_block,
          total_voting_power: proposal.total_voting_power,
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
    // Fallback to traditional search
    return traditionalSearch(proposals, query);
  }
}

// Traditional keyword-based search
function traditionalSearch(proposals: Proposal[], query: string): Proposal[] {
  if (!query || query.trim().length === 0) {
    return proposals;
  }

  const searchQuery = query.toLowerCase().trim();
  const searchTerms = searchQuery.split(' ').filter(term => term.length > 0);

  return proposals.filter(proposal => {
    // Search in title
    const titleMatch = searchTerms.some(term => 
      proposal.title.toLowerCase().includes(term)
    );

    // Search in description
    const descriptionMatch = searchTerms.some(term => 
      proposal.description.toLowerCase().includes(term)
    );

    // Search in status
    const statusMatch = searchTerms.some(term => {
      if (proposal.status) {
        return proposal.status.toLowerCase().includes(term);
      }
      return false;
    });

    // Search in proposal ID
    const idMatch = searchTerms.some(term => {
      const proposalId = proposal.id.toString();
      return proposalId.includes(term);
    });

    return titleMatch || descriptionMatch || statusMatch || idMatch;
  });
}

// Hybrid search combining semantic and traditional search
async function hybridSearch(proposals: Proposal[], query: string, limit: number = 10): Promise<Proposal[]> {
  if (!query || query.trim().length === 0) {
    return proposals;
  }

  try {
    // Get semantic search results
    const semanticResults = await semanticSearch(proposals, query, Math.ceil(limit * 0.7));
    
    // Get traditional search results
    const traditionalResults = traditionalSearch(proposals, query);
    
    // Combine and deduplicate results
    const combined = new Map<number, Proposal>();
    
    // Add semantic results first (higher priority)
    semanticResults.forEach(proposal => {
      combined.set(proposal.id, proposal);
    });
    
    // Add traditional results if we haven't reached the limit
    for (const proposal of traditionalResults) {
      if (combined.size >= limit) break;
      if (!combined.has(proposal.id)) {
        combined.set(proposal.id, proposal);
      }
    }
    
    return Array.from(combined.values());
  } catch (error) {
    console.error('Hybrid search error:', error);
    // Fallback to traditional search
    return traditionalSearch(proposals, query);
  }
}

// Filter proposals by status
function filterByStatus(proposals: Proposal[], status: string): Proposal[] {
  if (!status) {
    return proposals;
  }

  const statusLower = status.toLowerCase();
  return proposals.filter(proposal => {
    const proposalStatus = proposal.status?.toLowerCase() || '';
    return proposalStatus.includes(statusLower) || statusLower.includes(proposalStatus);
  });
}

// Sort proposals by relevance and recency
function sortProposals(proposals: Proposal[], query: string, sortBy: string = 'relevance'): Proposal[] {
  if (sortBy === 'id' || sortBy === 'newest') {
    return proposals.sort((a, b) => b.id - a.id);
  }

  if (sortBy === 'oldest') {
    return proposals.sort((a, b) => a.id - b.id);
  }

  if (sortBy === 'relevance' && query) {
    // Sort by relevance score
    return proposals.sort((a, b) => {
      const queryLower = query.toLowerCase();
      
      // Calculate relevance scores
      const aScore = calculateRelevanceScore(a, queryLower);
      const bScore = calculateRelevanceScore(b, queryLower);
      
      return bScore - aScore;
    });
  }

  // Default: sort by ID (newest first)
  return proposals.sort((a, b) => b.id - a.id);
}

// Calculate relevance score for a proposal
function calculateRelevanceScore(proposal: Proposal, query: string): number {
  let score = 0;
  const queryTerms = query.split(' ').filter(term => term.length > 0);

  // Title matches get highest weight
  queryTerms.forEach(term => {
    if (proposal.title.toLowerCase().includes(term)) {
      score += 10;
    }
  });

  // Description matches get medium weight
  queryTerms.forEach(term => {
    if (proposal.description.toLowerCase().includes(term)) {
      score += 5;
    }
  });

  // Status matches get lower weight
  queryTerms.forEach(term => {
    if (proposal.status && proposal.status.toLowerCase().includes(term)) {
      score += 3;
    }
  });

  // Exact ID match gets high weight
  if (proposal.id.toString() === query) {
    score += 15;
  }

  return score;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sort') || 'relevance';
    const limit = searchParams.get('limit');
    const searchType = searchParams.get('searchType') || 'hybrid'; // 'semantic', 'traditional', 'hybrid'

    // Validate limit parameter
    let limitValue = 50; // default
    if (limit) {
      const parsedLimit = parseInt(limit);
      if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) {
        limitValue = parsedLimit;
      } else {
        return NextResponse.json({ 
          error: 'limit must be a number between 1 and 100' 
        }, { status: 400 });
      }
    }

    // Validate sort parameter
    const validSortOptions = ['relevance', 'newest', 'oldest', 'id'];
    if (!validSortOptions.includes(sortBy)) {
      return NextResponse.json({ 
        error: 'sort must be one of: relevance, newest, oldest, id' 
      }, { status: 400 });
    }

    // Validate search type parameter
    const validSearchTypes = ['semantic', 'traditional', 'hybrid'];
    if (!validSearchTypes.includes(searchType)) {
      return NextResponse.json({ 
        error: 'searchType must be one of: semantic, traditional, hybrid' 
      }, { status: 400 });
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
      switch (searchType) {
        case 'semantic':
          proposals = await semanticSearch(proposals, query, limitValue);
          break;
        case 'traditional':
          proposals = traditionalSearch(proposals, query);
          break;
        case 'hybrid':
        default:
          proposals = await hybridSearch(proposals, query, limitValue);
          break;
      }
    }

    // Apply status filter
    if (status) {
      proposals = filterByStatus(proposals, status);
    }

    // Sort proposals
    proposals = sortProposals(proposals, query, sortBy);

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
        status: status || null,
        sortBy,
        searchType,
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