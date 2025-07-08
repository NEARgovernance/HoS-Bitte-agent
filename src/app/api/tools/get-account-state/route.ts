import { NextResponse } from 'next/server';
import { VENEAR_CONTRACT_ID, VOTING_CONTRACT, NEAR_RPC_URL } from '@/app/config';

// Define account state types
interface AccountState {
  account_id: string;
  balance: string;
  locked_balance?: string;
  unlock_time?: string;
  voting_power?: string;
  delegation_power?: string;
  total_power?: string;
  is_delegator?: boolean;
  is_delegate?: boolean;
  delegated_to?: string;
  delegators_count?: number;
  total_delegated_power?: string;
  last_vote?: {
    proposal_id: number;
    vote: string;
    timestamp: string;
  };
  governance_stats?: {
    total_votes: number;
    yes_votes: number;
    no_votes: number;
    abstain_votes: number;
    participation_rate: number;
  };
  // Lockup and staking information
  is_lockup_deployed?: boolean;
  lockup_id?: string;
  lockup_balance?: string;
  lockup_info_ready?: boolean;
  locked_amount?: string;
  lockup_liquid_owners_balance?: string;
  lockup_liquid_amount?: string;
  withdrawable_amount?: string;
  lockup_pending_amount?: string;
  lockup_unlock_timestamp_ns?: string;
  until_unlock?: string;
  registration_cost?: string;
  lockup_cost?: string;
  staking_pool?: string;
  known_deposited_balance?: string;
}

// Convert yoctoNEAR to NEAR
function yoctoToNEAR(yoctoAmount: string): string {
  const amount = parseFloat(yoctoAmount);
  if (isNaN(amount)) return '0';
  return (amount / 1e24).toFixed(6);
}

// Fetch veNEAR balance and basic account state
async function fetchVeNEARBalance(accountId: string): Promise<AccountState | NextResponse> {
  if (!VENEAR_CONTRACT_ID) {
    return NextResponse.json({ error: 'VENEAR_CONTRACT_ID environment variable not set' }, { status: 500 });
  }

  if (!accountId || accountId.trim() === '') {
    return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
  }

  const payload = {
    jsonrpc: "2.0",
    id: "1",
    method: "query",
    params: {
      request_type: "call_function",
      finality: "final",
      account_id: VENEAR_CONTRACT_ID,
      method_name: "get_accounts",
      args_base64: Buffer.from(JSON.stringify({ account_id: accountId })).toString("base64"),
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
      return NextResponse.json({ error: `No veNEAR balance found for account ${accountId}` }, { status: 404 });
    }

    // Convert byte array to string, then parse JSON
    const bytes = json.result.result;
    const raw = Buffer.from(bytes).toString("utf-8");
    const balanceData: AccountState = JSON.parse(raw);

    return balanceData;
  } catch (error) {
    console.error('Error fetching veNEAR balance:', error);
    return NextResponse.json({ error: 'Failed to fetch veNEAR balance' }, { status: 500 });
  }
}

// Fetch delegation information
async function fetchDelegationInfo(accountId: string): Promise<{ isDelegator: boolean; delegatedTo?: string; isDelegate: boolean; delegatorsCount: number; totalDelegatedPower: string } | NextResponse> {
  if (!VOTING_CONTRACT) {
    return NextResponse.json({ error: 'VOTING_CONTRACT environment variable not set' }, { status: 500 });
  }

  try {
    // Check if account is a delegator
    const delegatorPayload = {
      jsonrpc: "2.0",
      id: "1",
      method: "query",
      params: {
        request_type: "call_function",
        finality: "final",
        account_id: VOTING_CONTRACT,
        method_name: "get_delegation",
        args_base64: Buffer.from(JSON.stringify({ account_id: accountId })).toString("base64"),
      },
    };

    const delegatorRes = await fetch(NEAR_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(delegatorPayload),
    });

    let isDelegator = false;
    let delegatedTo: string | undefined;

    if (delegatorRes.ok) {
      const delegatorJson = await delegatorRes.json();
      if (delegatorJson.result && delegatorJson.result.result && delegatorJson.result.result.length > 0) {
        const delegatorBytes = delegatorJson.result.result;
        const delegatorRaw = Buffer.from(delegatorBytes).toString("utf-8");
        const delegationData = JSON.parse(delegatorRaw);
        isDelegator = true;
        delegatedTo = delegationData.delegated_to || delegationData.delegate;
      }
    }

    // Check if account is a delegate
    const delegatePayload = {
      jsonrpc: "2.0",
      id: "1",
      method: "query",
      params: {
        request_type: "call_function",
        finality: "final",
        account_id: VOTING_CONTRACT,
        method_name: "get_delegators",
        args_base64: Buffer.from(JSON.stringify({ account_id: accountId })).toString("base64"),
      },
    };

    const delegateRes = await fetch(NEAR_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(delegatePayload),
    });

    let isDelegate = false;
    let delegatorsCount = 0;
    let totalDelegatedPower = '0';

    if (delegateRes.ok) {
      const delegateJson = await delegateRes.json();
      if (delegateJson.result && delegateJson.result.result && delegateJson.result.result.length > 0) {
        const delegateBytes = delegateJson.result.result;
        const delegateRaw = Buffer.from(delegateBytes).toString("utf-8");
        const delegatorsData = JSON.parse(delegateRaw);
        isDelegate = true;
        delegatorsCount = Array.isArray(delegatorsData) ? delegatorsData.length : 0;
        totalDelegatedPower = Array.isArray(delegatorsData) 
          ? delegatorsData.reduce((sum: number, delegator: { delegated_power?: string }) => sum + (parseFloat(delegator.delegated_power || '0') || 0), 0).toString()
          : '0';
      }
    }

    return {
      isDelegator,
      delegatedTo,
      isDelegate,
      delegatorsCount,
      totalDelegatedPower
    };
  } catch (error) {
    console.error('Error fetching delegation info:', error);
    return NextResponse.json({ error: 'Failed to fetch delegation information' }, { status: 500 });
  }
}

// Fetch NEAR account balance
async function fetchAccountBalance(accountId: string): Promise<{ accountBalance: string } | NextResponse> {
  try {
    const payload = {
      jsonrpc: "2.0",
      id: "1",
      method: "query",
      params: {
        request_type: "view_account",
        finality: "final",
        account_id: accountId,
      },
    };

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

    if (!json.result) {
      return NextResponse.json({ error: `Account ${accountId} not found` }, { status: 404 });
    }

    return { accountBalance: json.result.amount || '0' };
  } catch (error) {
    console.error('Error fetching account balance:', error);
    return NextResponse.json({ error: 'Failed to fetch account balance' }, { status: 500 });
  }
}

// Define lockup info interface
interface LockupInfo {
  isLockupDeployed: boolean;
  lockupId: string | null;
  lockupBalance: string;
  lockupInfoReady: boolean;
  lockedAmount: string;
  lockupLiquidOwnersBalance: string;
  lockupLiquidAmount: string;
  withdrawableAmount: string;
  lockupPendingAmount: string;
  lockupUnlockTimestampNs: string | null;
  untilUnlock: string | null;
  registrationCost: string;
  lockupCost: string;
  stakingPool: string | null;
  knownDepositedBalance: string;
}

// Fetch lockup and staking information
async function fetchLockupInfo(accountId: string): Promise<{ lockupInfo: LockupInfo } | NextResponse> {
  if (!VENEAR_CONTRACT_ID) {
    return NextResponse.json({ error: 'VENEAR_CONTRACT_ID environment variable not set' }, { status: 500 });
  }

  try {
    // Get account info from veNEAR contract
    const accountInfoPayload = {
      jsonrpc: "2.0",
      id: "1",
      method: "query",
      params: {
        request_type: "call_function",
        finality: "final",
        account_id: VENEAR_CONTRACT_ID,
        method_name: "get_account_info",
        args_base64: Buffer.from(JSON.stringify({ account_id: accountId })).toString("base64"),
      },
    };

    const accountInfoRes = await fetch(NEAR_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(accountInfoPayload),
    });

    let accountInfo = null;
    let isLockupDeployed = false;

    if (accountInfoRes.ok) {
      const accountInfoJson = await accountInfoRes.json();
      if (accountInfoJson.result && accountInfoJson.result.result && accountInfoJson.result.result.length > 0) {
        const accountInfoBytes = accountInfoJson.result.result;
        const accountInfoRaw = Buffer.from(accountInfoBytes).toString("utf-8");
        accountInfo = JSON.parse(accountInfoRaw);
        isLockupDeployed = !!accountInfo?.internal?.lockup_version;
      }
    }

    // Get lockup account ID
    const lockupIdPayload = {
      jsonrpc: "2.0",
      id: "1",
      method: "query",
      params: {
        request_type: "call_function",
        finality: "final",
        account_id: VENEAR_CONTRACT_ID,
        method_name: "get_lockup_account_id",
        args_base64: Buffer.from(JSON.stringify({ account_id: accountId })).toString("base64"),
      },
    };

    const lockupIdRes = await fetch(NEAR_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lockupIdPayload),
    });

    let lockupId = null;
    if (lockupIdRes.ok) {
      const lockupIdJson = await lockupIdRes.json();
      if (lockupIdJson.result && lockupIdJson.result.result && lockupIdJson.result.result.length > 0) {
        const lockupIdBytes = lockupIdJson.result.result;
        const lockupIdRaw = Buffer.from(lockupIdBytes).toString("utf-8");
        lockupId = JSON.parse(lockupIdRaw);
      }
    }

    // Get lockup account balance
    let lockupBalance = '0';
    if (lockupId) {
      const lockupBalancePayload = {
        jsonrpc: "2.0",
        id: "1",
        method: "query",
        params: {
          request_type: "view_account",
          finality: "final",
          account_id: lockupId,
        },
      };

      const lockupBalanceRes = await fetch(NEAR_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lockupBalancePayload),
      });

      if (lockupBalanceRes.ok) {
        const lockupBalanceJson = await lockupBalanceRes.json();
        if (lockupBalanceJson.result) {
          lockupBalance = lockupBalanceJson.result.amount || '0';
        }
      }
    }

    // Update isLockupDeployed based on lockup balance
    isLockupDeployed = isLockupDeployed && lockupBalance !== null && lockupBalance !== undefined && lockupBalance !== '0';
    const lockupInfoReady = accountInfo && lockupId && lockupBalance !== null;

    // Get storage balance bounds (registration cost)
    const registrationCostPayload = {
      jsonrpc: "2.0",
      id: "1",
      method: "query",
      params: {
        request_type: "call_function",
        finality: "final",
        account_id: VENEAR_CONTRACT_ID,
        method_name: "storage_balance_bounds",
        args_base64: Buffer.from(JSON.stringify({})).toString("base64"),
      },
    };

    const registrationCostRes = await fetch(NEAR_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registrationCostPayload),
    });

    let registrationCost = '0';
    if (registrationCostRes.ok) {
      const registrationCostJson = await registrationCostRes.json();
      if (registrationCostJson.result && registrationCostJson.result.result && registrationCostJson.result.result.length > 0) {
        const registrationCostBytes = registrationCostJson.result.result;
        const registrationCostRaw = Buffer.from(registrationCostBytes).toString("utf-8");
        const registrationCostData = JSON.parse(registrationCostRaw);
        registrationCost = registrationCostData.min || '0';
      }
    }

    // Get lockup deployment cost
    const lockupCostPayload = {
      jsonrpc: "2.0",
      id: "1",
      method: "query",
      params: {
        request_type: "call_function",
        finality: "final",
        account_id: VENEAR_CONTRACT_ID,
        method_name: "get_lockup_deployment_cost",
        args_base64: Buffer.from(JSON.stringify({})).toString("base64"),
      },
    };

    const lockupCostRes = await fetch(NEAR_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lockupCostPayload),
    });

    let lockupCost = '0';
    if (lockupCostRes.ok) {
      const lockupCostJson = await lockupCostRes.json();
      if (lockupCostJson.result && lockupCostJson.result.result && lockupCostJson.result.result.length > 0) {
        const lockupCostBytes = lockupCostJson.result.result;
        const lockupCostRaw = Buffer.from(lockupCostBytes).toString("utf-8");
        const lockupCostData = JSON.parse(lockupCostRaw);
        lockupCost = lockupCostData || '0';
      }
    }

    // Initialize lockup-related variables
    let lockedAmount = '0';
    let lockupLiquidOwnersBalance = '0';
    let lockupLiquidAmount = '0';
    let withdrawableAmount = '0';
    let lockupPendingAmount = '0';
    let lockupUnlockTimestampNs = null;
    let untilUnlock = null;
    let stakingPool = null;
    let knownDepositedBalance = '0';

    // If lockup is deployed, fetch additional lockup information
    if (isLockupDeployed && lockupId) {
      // Get locked balance
      const lockedAmountPayload = {
        jsonrpc: "2.0",
        id: "1",
        method: "query",
        params: {
          request_type: "call_function",
          finality: "final",
          account_id: lockupId,
          method_name: "get_venear_locked_balance",
          args_base64: Buffer.from(JSON.stringify({})).toString("base64"),
        },
      };

      const lockedAmountRes = await fetch(NEAR_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lockedAmountPayload),
      });

      if (lockedAmountRes.ok) {
        const lockedAmountJson = await lockedAmountRes.json();
        if (lockedAmountJson.result && lockedAmountJson.result.result && lockedAmountJson.result.result.length > 0) {
          const lockedAmountBytes = lockedAmountJson.result.result;
          const lockedAmountRaw = Buffer.from(lockedAmountBytes).toString("utf-8");
          lockedAmount = JSON.parse(lockedAmountRaw);
        }
      }

      // Get liquid owners balance
      const liquidOwnersBalancePayload = {
        jsonrpc: "2.0",
        id: "1",
        method: "query",
        params: {
          request_type: "call_function",
          finality: "final",
          account_id: lockupId,
          method_name: "get_liquid_owners_balance",
          args_base64: Buffer.from(JSON.stringify({})).toString("base64"),
        },
      };

      const liquidOwnersBalanceRes = await fetch(NEAR_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(liquidOwnersBalancePayload),
      });

      if (liquidOwnersBalanceRes.ok) {
        const liquidOwnersBalanceJson = await liquidOwnersBalanceRes.json();
        if (liquidOwnersBalanceJson.result && liquidOwnersBalanceJson.result.result && liquidOwnersBalanceJson.result.result.length > 0) {
          const liquidOwnersBalanceBytes = liquidOwnersBalanceJson.result.result;
          const liquidOwnersBalanceRaw = Buffer.from(liquidOwnersBalanceBytes).toString("utf-8");
          lockupLiquidOwnersBalance = JSON.parse(liquidOwnersBalanceRaw);
        }
      }

      // Get liquid amount
      const liquidAmountPayload = {
        jsonrpc: "2.0",
        id: "1",
        method: "query",
        params: {
          request_type: "call_function",
          finality: "final",
          account_id: lockupId,
          method_name: "get_venear_liquid_balance",
          args_base64: Buffer.from(JSON.stringify({})).toString("base64"),
        },
      };

      const liquidAmountRes = await fetch(NEAR_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(liquidAmountPayload),
      });

      if (liquidAmountRes.ok) {
        const liquidAmountJson = await liquidAmountRes.json();
        if (liquidAmountJson.result && liquidAmountJson.result.result && liquidAmountJson.result.result.length > 0) {
          const liquidAmountBytes = liquidAmountJson.result.result;
          const liquidAmountRaw = Buffer.from(liquidAmountBytes).toString("utf-8");
          lockupLiquidAmount = JSON.parse(liquidAmountRaw);
        }
      }

      // Calculate withdrawable amount
      if (lockupLiquidOwnersBalance && lockupLiquidAmount) {
        const ownersBalance = parseFloat(lockupLiquidOwnersBalance);
        const liquidAmount = parseFloat(lockupLiquidAmount);
        withdrawableAmount = ownersBalance > liquidAmount ? lockupLiquidAmount : lockupLiquidOwnersBalance;
      }

      // Get pending amount
      const pendingAmountPayload = {
        jsonrpc: "2.0",
        id: "1",
        method: "query",
        params: {
          request_type: "call_function",
          finality: "final",
          account_id: lockupId,
          method_name: "get_venear_pending_balance",
          args_base64: Buffer.from(JSON.stringify({})).toString("base64"),
        },
      };

      const pendingAmountRes = await fetch(NEAR_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingAmountPayload),
      });

      if (pendingAmountRes.ok) {
        const pendingAmountJson = await pendingAmountRes.json();
        if (pendingAmountJson.result && pendingAmountJson.result.result && pendingAmountJson.result.result.length > 0) {
          const pendingAmountBytes = pendingAmountJson.result.result;
          const pendingAmountRaw = Buffer.from(pendingAmountBytes).toString("utf-8");
          lockupPendingAmount = JSON.parse(pendingAmountRaw);
        }
      }

      // Get unlock timestamp
      const unlockTimestampPayload = {
        jsonrpc: "2.0",
        id: "1",
        method: "query",
        params: {
          request_type: "call_function",
          finality: "final",
          account_id: lockupId,
          method_name: "get_venear_unlock_timestamp",
          args_base64: Buffer.from(JSON.stringify({})).toString("base64"),
        },
      };

      const unlockTimestampRes = await fetch(NEAR_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(unlockTimestampPayload),
      });

      if (unlockTimestampRes.ok) {
        const unlockTimestampJson = await unlockTimestampRes.json();
        if (unlockTimestampJson.result && unlockTimestampJson.result.result && unlockTimestampJson.result.result.length > 0) {
          const unlockTimestampBytes = unlockTimestampJson.result.result;
          const unlockTimestampRaw = Buffer.from(unlockTimestampBytes).toString("utf-8");
          lockupUnlockTimestampNs = JSON.parse(unlockTimestampRaw);
          
          // Calculate until unlock
          if (lockupUnlockTimestampNs) {
            const unlockTime = parseFloat(lockupUnlockTimestampNs) / 1e6;
            const currentTime = new Date().getTime();
            untilUnlock = Math.max(0, unlockTime - currentTime).toString();
          }
        }
      }

      // Get staking pool
      const stakingPoolPayload = {
        jsonrpc: "2.0",
        id: "1",
        method: "query",
        params: {
          request_type: "call_function",
          finality: "final",
          account_id: lockupId,
          method_name: "get_staking_pool_account_id",
          args_base64: Buffer.from(JSON.stringify({})).toString("base64"),
        },
      };

      const stakingPoolRes = await fetch(NEAR_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stakingPoolPayload),
      });

      if (stakingPoolRes.ok) {
        const stakingPoolJson = await stakingPoolRes.json();
        if (stakingPoolJson.result && stakingPoolJson.result.result && stakingPoolJson.result.result.length > 0) {
          const stakingPoolBytes = stakingPoolJson.result.result;
          const stakingPoolRaw = Buffer.from(stakingPoolBytes).toString("utf-8");
          stakingPool = JSON.parse(stakingPoolRaw);
        }
      }

      // Get known deposited balance
      const knownDepositedBalancePayload = {
        jsonrpc: "2.0",
        id: "1",
        method: "query",
        params: {
          request_type: "call_function",
          finality: "final",
          account_id: lockupId,
          method_name: "get_known_deposited_balance",
          args_base64: Buffer.from(JSON.stringify({})).toString("base64"),
        },
      };

      const knownDepositedBalanceRes = await fetch(NEAR_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(knownDepositedBalancePayload),
      });

      if (knownDepositedBalanceRes.ok) {
        const knownDepositedBalanceJson = await knownDepositedBalanceRes.json();
        if (knownDepositedBalanceJson.result && knownDepositedBalanceJson.result.result && knownDepositedBalanceJson.result.result.length > 0) {
          const knownDepositedBalanceBytes = knownDepositedBalanceJson.result.result;
          const knownDepositedBalanceRaw = Buffer.from(knownDepositedBalanceBytes).toString("utf-8");
          knownDepositedBalance = JSON.parse(knownDepositedBalanceRaw);
        }
      }
    }

    const lockupInfo: LockupInfo = {
      isLockupDeployed: isLockupDeployed,
      lockupId: lockupId,
      lockupBalance: lockupBalance,
      lockupInfoReady: lockupInfoReady,
      lockedAmount: lockedAmount,
      lockupLiquidOwnersBalance: lockupLiquidOwnersBalance,
      lockupLiquidAmount: lockupLiquidAmount,
      withdrawableAmount: withdrawableAmount,
      lockupPendingAmount: lockupPendingAmount,
      lockupUnlockTimestampNs: lockupUnlockTimestampNs,
      untilUnlock: untilUnlock,
      registrationCost: registrationCost,
      lockupCost: lockupCost,
      stakingPool: stakingPool,
      knownDepositedBalance: knownDepositedBalance
    };

    return { lockupInfo };
  } catch (error) {
    console.error('Error fetching lockup info:', error);
    return NextResponse.json({ error: 'Failed to fetch lockup information' }, { status: 500 });
  }
}

// Fetch voting history and statistics


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    if (!VENEAR_CONTRACT_ID) {
      return NextResponse.json({ error: 'VENEAR_CONTRACT_ID environment variable not set' }, { status: 500 });
    }

    // Fetch veNEAR balance and basic account state
    const balanceResult = await fetchVeNEARBalance(accountId);
    if (balanceResult instanceof NextResponse) {
      return balanceResult;
    }

    // Fetch delegation information
    const delegationResult = await fetchDelegationInfo(accountId);
    if (delegationResult instanceof NextResponse) {
      return delegationResult;
    }

    // Fetch lockup and staking information
    const lockupResult = await fetchLockupInfo(accountId);
    if (lockupResult instanceof NextResponse) {
      return lockupResult;
    }

    // Fetch NEAR account balance
    const accountBalanceResult = await fetchAccountBalance(accountId);
    if (accountBalanceResult instanceof NextResponse) {
      return accountBalanceResult;
    }

    // Fetch veNEAR token balance using ft_balance_of
    const veNearTokenBalancePayload = {
      jsonrpc: "2.0",
      id: "1",
      method: "query",
      params: {
        request_type: "call_function",
        finality: "final",
        account_id: VENEAR_CONTRACT_ID,
        method_name: "ft_balance_of",
        args_base64: Buffer.from(JSON.stringify({ account_id: accountId })).toString("base64"),
      },
    };

    let veNearTokenBalance = '0';
    try {
      const veNearTokenBalanceRes = await fetch(NEAR_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(veNearTokenBalancePayload),
      });

      if (veNearTokenBalanceRes.ok) {
        const veNearTokenBalanceJson = await veNearTokenBalanceRes.json();
        if (veNearTokenBalanceJson.result && veNearTokenBalanceJson.result.result && veNearTokenBalanceJson.result.result.length > 0) {
          const veNearTokenBalanceBytes = veNearTokenBalanceJson.result.result;
          const veNearTokenBalanceRaw = Buffer.from(veNearTokenBalanceBytes).toString("utf-8");
          veNearTokenBalance = JSON.parse(veNearTokenBalanceRaw);
        }
      }
    } catch (error) {
      console.error('Error fetching veNEAR token balance:', error);
      // Continue with default value
    }

    // Combine all data
    const accountState = {
      ...balanceResult,
      ...delegationResult,
      account_balance: accountBalanceResult.accountBalance,
      ve_near_token_balance: veNearTokenBalance
    };
    // Calculate lockup NEAR values
    const lockupBalanceInNEAR = yoctoToNEAR(lockupResult.lockupInfo.lockupBalance || '0');
    const lockedAmountInNEAR = yoctoToNEAR(lockupResult.lockupInfo.lockedAmount || '0');
    const lockupLiquidOwnersBalanceInNEAR = yoctoToNEAR(lockupResult.lockupInfo.lockupLiquidOwnersBalance || '0');
    const lockupLiquidAmountInNEAR = yoctoToNEAR(lockupResult.lockupInfo.lockupLiquidAmount || '0');
    const withdrawableAmountInNEAR = yoctoToNEAR(lockupResult.lockupInfo.withdrawableAmount || '0');
    const lockupPendingAmountInNEAR = yoctoToNEAR(lockupResult.lockupInfo.lockupPendingAmount || '0');
    const registrationCostInNEAR = yoctoToNEAR(lockupResult.lockupInfo.registrationCost || '0');
    const lockupCostInNEAR = yoctoToNEAR(lockupResult.lockupInfo.lockupCost || '0');
    const knownDepositedBalanceInNEAR = yoctoToNEAR(lockupResult.lockupInfo.knownDepositedBalance || '0');
    const accountBalanceInNEAR = yoctoToNEAR(accountState.account_balance || '0');
    const veNearTokenBalanceInNEAR = yoctoToNEAR(accountState.ve_near_token_balance || '0');

    return NextResponse.json({ 
      accountId: accountState.account_id,
      accountBalance: {
        raw: accountState.account_balance || '0',
        nears: accountBalanceInNEAR
      },
      veNearTokenBalance: {
        raw: accountState.ve_near_token_balance || '0',
        nears: veNearTokenBalanceInNEAR
      },
      lockup: {
        isLockupDeployed: lockupResult.lockupInfo.isLockupDeployed,
        lockupId: lockupResult.lockupInfo.lockupId,
        lockupBalance: {
          raw: lockupResult.lockupInfo.lockupBalance,
          nears: lockupBalanceInNEAR
        },
        lockupInfoReady: lockupResult.lockupInfo.lockupInfoReady,
        lockedAmount: {
          raw: lockupResult.lockupInfo.lockedAmount,
          nears: lockedAmountInNEAR
        },
        lockupLiquidOwnersBalance: {
          raw: lockupResult.lockupInfo.lockupLiquidOwnersBalance,
          nears: lockupLiquidOwnersBalanceInNEAR
        },
        lockupLiquidAmount: {
          raw: lockupResult.lockupInfo.lockupLiquidAmount,
          nears: lockupLiquidAmountInNEAR
        },
        withdrawableAmount: {
          raw: lockupResult.lockupInfo.withdrawableAmount,
          nears: withdrawableAmountInNEAR
        },
        lockupPendingAmount: {
          raw: lockupResult.lockupInfo.lockupPendingAmount,
          nears: lockupPendingAmountInNEAR
        },
        lockupUnlockTimestampNs: lockupResult.lockupInfo.lockupUnlockTimestampNs,
        untilUnlock: lockupResult.lockupInfo.untilUnlock,
        registrationCost: {
          raw: lockupResult.lockupInfo.registrationCost,
          nears: registrationCostInNEAR
        },
        lockupCost: {
          raw: lockupResult.lockupInfo.lockupCost,
          nears: lockupCostInNEAR
        },
        stakingPool: lockupResult.lockupInfo.stakingPool,
        knownDepositedBalance: {
          raw: lockupResult.lockupInfo.knownDepositedBalance,
          nears: knownDepositedBalanceInNEAR
        }
      },
      metadata: {
        contract: VENEAR_CONTRACT_ID,
        votingContract: VOTING_CONTRACT,
        token: "veNEAR",
        description: "Comprehensive account state for House of Stake governance",
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching account state:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch account state',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 