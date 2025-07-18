import { DEPLOYMENT_URL } from "vercel-url";

const ACCOUNT_ID = process.env.ACCOUNT_ID;

// Set the plugin url in order of BITTE_CONFIG, env, DEPLOYMENT_URL (used for Vercel deployments)
const PLUGIN_URL = DEPLOYMENT_URL || `${process.env.NEXT_PUBLIC_HOST || 'localhost'}:${process.env.PORT || 3000}`;

// NEAR configuration
const NEAR_RPC_URL = process.env.NEAR_RPC_URL || "https://rpc.testnet.near.org";
const VOTING_CONTRACT = process.env.VOTING_CONTRACT;
const VENEAR_CONTRACT_ID = process.env.VENEAR_CONTRACT_ID;

if (!PLUGIN_URL) {
  console.error(
    "!!! Plugin URL not found in env, BITTE_CONFIG or DEPLOYMENT_URL !!!"
  );
  process.exit(1);
}

export { ACCOUNT_ID, PLUGIN_URL, NEAR_RPC_URL, VOTING_CONTRACT, VENEAR_CONTRACT_ID };
