// Mirrors contracts/aidline/src/errors.rs. Keep the codes in sync.
const CONTRACT_ERRORS: Record<number, string> = {
  1: 'This campaign does not exist.',
  2: 'This campaign is no longer active.',
  3: 'This campaign has passed its deadline.',
  4: 'Enter an amount greater than zero.',
  5: 'Milestones must be positive amounts, between 1 and 20 of them.',
  6: 'The deadline must be in the future.',
  7: 'That address is not a registered verifier.',
  8: 'That amount would take the campaign past its goal.',
  9: 'There is not enough in escrow to pay the next milestone yet.',
  10: 'Every milestone has already been released.',
  11: 'Refunds open once a campaign is cancelled or passes its deadline.',
  12: 'This wallet has nothing left to reclaim from this campaign.',
  13: 'This wallet is not allowed to do that.',
  14: 'This campaign already has a sponsor matching pool.',
  15: 'This campaign has no sponsor matching pool.',
  16: 'The matching settings are not valid. Check the ratio and the cap, then try again.',
  17: 'The unspent part of this sponsor pool cannot be returned yet.',
  18: 'A verifier bond of at least the required minimum amount is required to register.',
  19: 'No verifier bond was found for this wallet.',
  20: 'This bond is not ready to withdraw yet, or nothing remains to withdraw.',
  21: 'The bond withdrawal waiting period has not finished yet.',
  22: 'The slash amount is larger than the remaining bond.',
  23: 'This pledge is invalid. Check that the amount is above zero and that you have approved enough token allowance for the contract.',
  24: 'This is not an emergency campaign, so it cannot take an advance.',
  25: 'This campaign has already taken its emergency advance.',
  26: 'That advance is larger than the amount held in escrow.',
};

/**
 * Contract errors `remove_verifier` and `reassign_verifier` can return, keyed by
 * the codes in aidline-contracts `contracts/aidline/src/errors.rs`. Passed to
 * `describeError` for those calls so their messages describe what went wrong.
 */
export const VERIFIER_ADMIN_ERRORS: Record<number, string> = {
  1: 'Only the Aidline admin wallet can manage verifiers.',
  2: 'There is no campaign with that id.',
  6: 'That campaign is no longer active, so its verifier cannot be changed.',
  7: 'That campaign has passed its deadline, so its verifier cannot be changed.',
  9: 'The new verifier is not registered. Register them first, then reassign.',
  31: 'The contract is paused. Try again once it is unpaused.',
  40: 'This campaign has already been reassigned the maximum number of times.',
  42: 'A milestone on that campaign is overdue, so its verifier cannot be changed.',
};

/**
 * Turns RPC, contract and wallet failures into a sentence a donor can act on.
 * `contractErrors` overrides the default messages for a specific call.
 */
export function describeError(err: unknown, contractErrors?: Record<number, string>): string {
  const text = err instanceof Error ? err.message : String(err);
  const code = /Error\(Contract, #(\d+)\)/.exec(text)?.[1];
  if (code && contractErrors?.[Number(code)]) return contractErrors[Number(code)]!;
  if (code && CONTRACT_ERRORS[Number(code)]) return CONTRACT_ERRORS[Number(code)]!;
  if (/declined|rejected|denied/i.test(text)) return 'The request was declined in your wallet.';
  if (/account not found|Account not found/i.test(text))
    return 'This wallet has no funds on this network yet. Fund it first, then try again.';
  if (/balance|insufficient|underfunded/i.test(text))
    return 'This wallet does not have enough balance for that amount plus fees.';
  return text.length > 200 ? `${text.slice(0, 200)}…` : text;
}
