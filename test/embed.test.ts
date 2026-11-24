import { describe, expect, it } from 'vitest';

import { embedDonateState } from '@/lib/embed';

describe('embedDonateState', () => {
  it('offers the donate form only for an active campaign', () => {
    expect(embedDonateState('active')).toEqual({ canDonate: true });
  });

  it.each([
    ['completed', 'fully released'],
    ['cancelled', 'cancelled'],
    ['expired', 'ended'],
  ] as const)('shows a status line instead of the form for %s campaigns', (status, label) => {
    const state = embedDonateState(status);
    expect(state.canDonate).toBe(false);
    if (!state.canDonate) {
      expect(state.message).toContain(label);
      expect(state.message).toMatch(/no longer taking donations/);
    }
  });
});
