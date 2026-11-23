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
  return BigInt(scValToNative(sim.result.retval) as bigint);
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
