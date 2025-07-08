# NEAR Governance Bot API

API for NEAR governance bot functionality with proposal management, voting, and blockchain interactions.

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
pnpm dev
```

## Environment Variables

Create a `.env` file with:

```bash
# Required
VOTING_CONTRACT=voting.contract.near
VENEAR_CONTRACT_ID=venear.near
ACCOUNT_ID=your-account.near
PLUGIN_URL=http://localhost:3000

# Optional
NEAR_RPC_URL=https://rpc.testnet.near.org
OPENAI_API_KEY=sk-your-openai-api-key-here
```

## API Documentation

Access the OpenAPI specification at `GET /api/ai-plugin`

## API Endpoints

- **GET** `/api/tools/get-proposal?proposalId={id}` - Get proposal details
- **GET** `/api/tools/get-recent-proposals?count={number}` - Fetch recent proposals
- **GET** `/api/tools/get-recent-active-proposals?count={number}` - Fetch active proposals
- **GET** `/api/tools/get-votes?proposalId={id}` - Get proposal votes
- **GET** `/api/tools/get-delegators?accountId={account}` - Get account delegators
- **GET** `/api/tools/create-proposal?title={title}&description={description}&votingOptions={options}` - Create proposal transaction
- **GET** `/api/tools/vote?proposalId={id}&vote={choice}&accountId={account}` - Vote on proposal
- **GET** `/api/tools/get-account-balance?accountId={account}` - Get NEAR balance
- **GET** `/api/tools/get-venear-balance?accountId={account}` - Get veNEAR balance
- **GET** `/api/tools/get-account-state?accountId={account}` - Get comprehensive account state
- **GET** `/api/tools/lookup-state?accountId={account}` - Alias for get-account-state
- **GET** `/api/tools/search-proposal?q={query}&limit={number}` - Search proposals

### Get account balance
```bash
curl "http://localhost:3000/api/tools/get-account-balance?accountId=user.near"
```

### Get veNEAR balance
```bash
curl "http://localhost:3000/api/tools/get-venear-balance?accountId=user.near"
```

### Get account state
```bash
curl "http://localhost:3000/api/tools/lookup-state?accountId=user.near"
```

### Search proposals
```bash
curl "http://localhost:3000/api/tools/search-proposal?q=treasury&limit=20"
```

## Error Handling

All endpoints return appropriate HTTP status codes and error messages:

- `400`: Bad Request - Missing or invalid parameters
- `404`: Not Found - Proposal doesn't exist
- `500`: Internal Server Error - Server or RPC errors

Error responses include:
```json
{
  "error": "Error description",
  "details": "Additional error details"
}
```

## Configuration

The API uses centralized configuration from `@/app/config`:

- `NEAR_RPC_URL`: NEAR RPC endpoint (defaults to testnet)
- `VOTING_CONTRACT`: NEAR voting contract address
- `OPENAI_API_KEY`: OpenAI API key for semantic search embeddings (required)

## Usage Examples

### Get Proposal Details
```bash
curl "http://localhost:3000/api/tools/get-proposal?proposalId=123"
```

### Get recent active proposals
```bash
curl "http://localhost:3000/api/tools/fetch-recent-active-proposals?count=10"
``` 

## Troubleshooting

### Common Issues

**Environment Variables Not Set**
```
Error: VOTING_CONTRACT environment variable not set
```
Solution: Check your `.env` file and ensure all required variables are set.

**RPC Connection Issues**
```
Error: RPC request failed: 500
```
Solution: Verify your `NEAR_RPC_URL` and network connectivity.

**OpenAI API Errors**
```
Error: OpenAI API key not configured
```
Solution: Set your `OPENAI_API_KEY` in the `.env` file.

**Build Errors**
```
Error: TypeScript compilation failed
```
Solution: Run `pnpm install` and check for missing dependencies.

### Network Configuration

- **Testnet**: Use testnet contract addresses and RPC endpoint
- **Mainnet**: Use mainnet contract addresses and RPC endpoint
- **Local**: Use local NEAR node for development

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:

- Create an issue on GitHub
- Check the troubleshooting section
- Review the test examples in `test-api.md`
- Consult the NEAR documentation for blockchain-specific questions