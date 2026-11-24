import { describe, expect, it } from 'vitest';

import { stepForPhase, TX_STEPS, txSteps, type TxStepStatus } from '@/lib/txSteps';
import type { TxPhase, TxState } from '@/lib/useTx';

const statuses = (state: TxState): TxStepStatus[] | undefined =>
  txSteps(state)?.map((step) => step.status);

describe('TX_STEPS', () => {
  it('lists build, sign, submit and confirmed in that order', () => {
    expect(TX_STEPS.map((step) => step.id)).toEqual(['build', 'sign', 'submit', 'confirmed']);
    expect(TX_STEPS.map((step) => step.label)).toEqual(['Build', 'Sign', 'Submit', 'Confirmed']);
  });
});

describe('stepForPhase', () => {
  it('maps every phase of a transaction to one of the four steps', () => {
    const expected: Record<TxPhase, string> = {
      preparing: 'build',
      prepared: 'build',
      signing: 'sign',
      submitting: 'submit',
      confirming: 'confirmed',
      syncing: 'confirmed',
    };
    for (const [phase, step] of Object.entries(expected)) {
      expect(stepForPhase(phase as TxPhase)).toBe(step);
    }
  });
});

describe('txSteps', () => {
  it('shows nothing until a transaction starts', () => {
    expect(txSteps({ phase: 'idle' })).toBeNull();
  });

  it('marks the active step current, earlier ones complete and later ones upcoming', () => {
    expect(statuses({ phase: 'preparing' })).toEqual(['current', 'upcoming', 'upcoming', 'upcoming']);
    expect(statuses({ phase: 'prepared', fee: '0.01' })).toEqual([
      'current',
      'upcoming',
      'upcoming',
      'upcoming',
    ]);
    expect(statuses({ phase: 'signing' })).toEqual(['complete', 'current', 'upcoming', 'upcoming']);
    expect(statuses({ phase: 'submitting' })).toEqual([
      'complete',
      'complete',
      'current',
      'upcoming',
    ]);
    expect(statuses({ phase: 'confirming' })).toEqual([
      'complete',
      'complete',
      'complete',
      'current',
    ]);
  });

  it('keeps the last step current while the page catches up with the ledger', () => {
    expect(statuses({ phase: 'syncing' })).toEqual(['complete', 'complete', 'complete', 'current']);
  });

  it('completes every step once the transaction is done', () => {
    expect(statuses({ phase: 'done', hash: 'abc' })).toEqual([
      'complete',
      'complete',
      'complete',
      'complete',
    ]);
  });

  it('marks the step an error happened at and leaves later steps waiting', () => {
    expect(statuses({ phase: 'error', message: 'No', failedAt: 'build' })).toEqual([
      'failed',
      'upcoming',
      'upcoming',
      'upcoming',
    ]);
    expect(statuses({ phase: 'error', message: 'Declined', failedAt: 'sign' })).toEqual([
      'complete',
      'failed',
      'upcoming',
      'upcoming',
    ]);
    expect(statuses({ phase: 'error', message: 'Rejected', failedAt: 'submit' })).toEqual([
      'complete',
      'complete',
      'failed',
      'upcoming',
    ]);
    expect(statuses({ phase: 'error', message: 'Timed out', failedAt: 'confirmed' })).toEqual([
      'complete',
      'complete',
      'complete',
      'failed',
    ]);
  });

  it('puts an error with no recorded step at the first step', () => {
    expect(statuses({ phase: 'error', message: 'Something broke' })).toEqual([
      'failed',
      'upcoming',
      'upcoming',
      'upcoming',
    ]);
  });

  it('has exactly one current or failed step while a transaction is running or has failed', () => {
    const states: TxState[] = [
      { phase: 'preparing' },
      { phase: 'signing' },
      { phase: 'submitting' },
      { phase: 'confirming' },
      { phase: 'syncing' },
      { phase: 'error', message: 'No', failedAt: 'sign' },
    ];
    for (const state of states) {
      const active = txSteps(state)!.filter(
        (step) => step.status === 'current' || step.status === 'failed',
      );
      expect(active).toHaveLength(1);
    }
  });

  it('keeps the step ids and labels on every entry', () => {
    expect(txSteps({ phase: 'signing' })).toEqual([
      { id: 'build', label: 'Build', status: 'complete' },
      { id: 'sign', label: 'Sign', status: 'current' },
      { id: 'submit', label: 'Submit', status: 'upcoming' },
      { id: 'confirmed', label: 'Confirmed', status: 'upcoming' },
    ]);
  });
});
