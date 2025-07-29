import { NextResponse } from 'next/server';

export async function GET() {
  const schema = {
    title: 'Create Proposal',
    description: 'Form schema for creating a new governance proposal',
    type: 'object',
    properties: {
      title: {
        type: 'string',
        title: 'Title',
        description: 'The title of the proposal',
      },
      description: {
        type: 'string',
        title: 'Description',
        description: 'Detailed description of the proposal',
      },
      link: {
        type: 'string',
        title: 'Link',
        description: 'Optional link to additional information',
      },
      votingOptions: {
        type: 'string',
        title: 'Voting Options',
        description: 'Comma-separated list of voting options (e.g., Yes,No,Abstain)',
      },
    },
    required: ['title', 'description', 'votingOptions'],
  };
  return NextResponse.json({ schema });
} 