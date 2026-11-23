import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  contract,
  nativeToScVal,
  rpc,
  scValToNative,
  TransactionBuilder,
  xdr,
} from '@stellar/stellar-sdk';

import { config } from '../config';

async function simulateRead(
  contractId: string,
  method: string,
  ...args: xdr.ScVal[]
): Promise<unknown> {
  if (!contractId) return null;
async function readBigInt(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
): Promise<bigint | null> {
  const server = new rpc.Server(config.rpcUrl, { allowHttp: config.rpcUrl.startsWith('http:') });
  const tx = new TransactionBuilder(new Account(contract.NULL_ACCOUNT, '0'), {
    fee: BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(30)
    .build();
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim) || !sim.result) return null;
  return scValToNative(sim.result.retval);
}

/** Normalizes a Soroban unit enum decoded by `scValToNative` to its variant name. */
export function enumTag(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] ?? '');
  if (value && typeof value === 'object' && 'tag' in value) {
    return String((value as { tag: unknown }).tag);
  }
  return String(value ?? '');
}

/**
 * Reads a wallet's balance of the campaign token straight from its contract.
 * Works for native XLM and any other Stellar asset contract. Returns null when
 * the account does not exist on this network yet.
 */
export async function tokenBalance(address: string): Promise<bigint | null> {
  const raw = await simulateRead(config.tokenId, 'balance', new Address(address).toScVal());
  return raw === null || raw === undefined ? null : BigInt(raw as bigint);
}

export type BondStatus = 'Active' | 'PendingWithdrawal' | 'Withdrawn' | 'Slashed';

export interface VerifierBond {
  verifier: string;
  amount: bigint;
  remaining: bigint;
  status: BondStatus;
  deregisteredAt: number;
}

/** Returns the minimum required verifier bond in token units (`0n` when disabled). */
export async function getBondRequirement(): Promise<bigint> {
  const raw = await simulateRead(config.contractId, 'bond_requirement');
  return raw === null || raw === undefined ? 0n : BigInt(raw as bigint | number | string);
}

/** Returns the bond withdrawal delay in seconds (`0` when no delay is set). */
export async function getBondWithdrawDelay(): Promise<number> {
  const raw = await simulateRead(config.contractId, 'bond_withdraw_delay');
  return raw === null || raw === undefined ? 0 : Number(raw);
}

/** Returns the on-chain bond record for `verifier`, or `null` if none exists. */
export async function getVerifierBond(verifier: string): Promise<VerifierBond | null> {
  const raw = await simulateRead(
    config.contractId,
    'get_verifier_bond',
    new Address(verifier).toScVal(),
  );
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  return {
    verifier: String(r.verifier),
    amount: BigInt(r.amount as bigint | number | string),
    remaining: BigInt(r.remaining as bigint | number | string),
    status: enumTag(r.status) as BondStatus,
    deregisteredAt: Number(r.deregistered_at ?? 0),
  };
}

/** Reads the token allowance granted by `owner` to `spender` (e.g. the Aidline contract). */
export async function tokenAllowance(owner: string, spender: string): Promise<bigint | null> {
  const raw = await simulateRead(
    config.tokenId,
    'allowance',
    new Address(owner).toScVal(),
    new Address(spender).toScVal(),
  );
  return raw === null || raw === undefined ? null : BigInt(raw as bigint | number | string);
}

export interface Pledge {
  pledgeId: string;
  donor: string;
  campaignId: string;
  pledgedAmount: bigint;
  pulledAmount: bigint;
  active: boolean;
}

/** Returns the on-chain `Pledge` record for `pledgeId`, or `null` if not found. */
export async function getPledge(pledgeId: string | bigint): Promise<Pledge | null> {
  const raw = await simulateRead(
    config.contractId,
    'get_pledge',
    nativeToScVal(BigInt(pledgeId), { type: 'u64' }),
  );
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  return {
    pledgeId: String(r.pledge_id),
    donor: String(r.donor),
    campaignId: String(r.campaign_id),
    pledgedAmount: BigInt(r.pledged_amount as bigint | number | string),
    pulledAmount: BigInt(r.pulled_amount as bigint | number | string),
    active: Boolean(r.active),
  };
}

export interface SponsorPoolData {
  sponsor: string;
  campaignId: string;
  ratioBps: number;
  cap: bigint;
  deposited: bigint;
  remaining: bigint;
  matched: bigint;
}

/** Reads the on-chain `SponsorPool` for `campaignId` and `sponsor`, or `null` if none exists. */
export async function getSponsorPool(
  campaignId: string | bigint,
  sponsor: string,
): Promise<SponsorPoolData | null> {
  const raw = await simulateRead(
    config.contractId,
    'get_sponsor_pool',
    nativeToScVal(BigInt(campaignId), { type: 'u64' }),
    new Address(sponsor).toScVal(),
  );
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  return {
    sponsor: String(r.sponsor),
    campaignId: String(r.campaign_id),
    ratioBps: Number(r.ratio_bps),
    cap: BigInt(r.cap as bigint | number | string),
    deposited: BigInt(r.deposited as bigint | number | string),
    remaining: BigInt(r.remaining as bigint | number | string),
    matched: BigInt(r.matched as bigint | number | string),
  };
}

/**
 * Reads a wallet's balance of the campaign token straight from its contract.
 * Works for native XLM and any other Stellar asset contract. Returns null when
 * the account does not exist on this network yet.
 */
export function tokenBalance(address: string): Promise<bigint | null> {
  return readBigInt(config.tokenId, 'balance', [new Address(address).toScVal()]);
}

/** Reads the donor's recorded contribution, which is what the contract refunds against. */
export function contributionOf(campaignId: string, donor: string): Promise<bigint | null> {
  return readBigInt(config.contractId, 'contribution_of', [
    nativeToScVal(BigInt(campaignId), { type: 'u64' }),
    new Address(donor).toScVal(),
  ]);
}

/**
 * Reads the admin address straight from the Aidline contract using a read-only simulation call.
 * Returns null when the contract is not configured, does not respond, or has no admin.
 */
export async function contractAdmin(): Promise<string | null> {
  if (!config.contractId) return null;
  try {
    const server = new rpc.Server(config.rpcUrl, { allowHttp: config.rpcUrl.startsWith('http:') });
    const tx = new TransactionBuilder(new Account(contract.NULL_ACCOUNT, '0'), {
      fee: BASE_FEE,
      networkPassphrase: config.networkPassphrase,
    })
      .addOperation(new Contract(config.contractId).call('admin'))
      .setTimeout(30)
      .build();
    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(sim) || !sim.result) return null;
    const admin = scValToNative(sim.result.retval);
    return typeof admin === 'string' ? admin : null;
  } catch {
    return null;
  }
}

/**
 * Resolves the admin address by querying the contract first, falling back to NEXT_PUBLIC_ADMIN_ADDRESS.
 * Returns null if neither is available.
 */
export async function getAdminAddress(
  readContractAdmin: () => Promise<string | null> = contractAdmin,
): Promise<string | null> {
  const onChain = await readContractAdmin().catch(() => null);
  if (onChain) return onChain;
  return config.adminAddress.trim() || null;
}
