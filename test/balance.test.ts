import { nativeToScVal, rpc, scValToNative, xdr } from '@stellar/stellar-sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/config', () => ({
  config: {
    rpcUrl: 'https://rpc.example',
    networkPassphrase: 'Test Network',
    contractId: 'CAAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQC526',
    tokenId: 'CABAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAFNSZ',
  },
}));

import { contributionOf, tokenBalance } from '@/lib/stellar/balance';

const donor = 'GDWUSKGGFDI4FRXK5EBTRECZSVQSSWJHHJOGH6JWG3AUMFFMQ435DIAG';

function simulateValue(value: bigint) {
  return vi.spyOn(rpc.Server.prototype, 'simulateTransaction').mockResolvedValue({
    result: { retval: nativeToScVal(value, { type: 'i128' }) },
  } as never);
}

interface SimulatedTransaction {
  operations: {
    func: {
      invokeContract: {
        functionName: { toString(): string };
        args: xdr.ScVal[];
      };
    };
  }[];
}

afterEach(() => vi.restoreAllMocks());

describe('contributionOf', () => {
  it('simulates contribution_of with the campaign id and donor', async () => {
    const simulate = simulateValue(123_000_000n);
    await expect(contributionOf('7', donor)).resolves.toBe(123_000_000n);

    const tx = simulate.mock.calls[0]![0] as SimulatedTransaction;
    const operation = tx.operations[0]!.func.invokeContract;
    expect(operation.functionName.toString()).toBe('contribution_of');
    expect(operation.args.map(scValToNative)).toEqual([7n, donor]);
  });

  it('returns null when the simulation fails', async () => {
    vi.spyOn(rpc.Server.prototype, 'simulateTransaction').mockResolvedValue({
      error: 'contract unavailable',
    } as never);
    await expect(contributionOf('7', donor)).resolves.toBeNull();
  });
});

describe('tokenBalance', () => {
  it('still reads the token balance from the token contract', async () => {
    const simulate = simulateValue(42n);
    await expect(tokenBalance(donor)).resolves.toBe(42n);

    const tx = simulate.mock.calls[0]![0] as SimulatedTransaction;
    expect(tx.operations[0]!.func.invokeContract.functionName.toString()).toBe('balance');
  });
});
