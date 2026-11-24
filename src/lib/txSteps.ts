import type { TxPhase, TxState } from './useTx';

/** The four stages every wallet action walks through, as the stepper shows them. */
export type TxStepId = 'build' | 'sign' | 'submit' | 'confirmed';

export const TX_STEPS: readonly { id: TxStepId; label: string }[] = [
  { id: 'build', label: 'Build' },
  { id: 'sign', label: 'Sign' },
  { id: 'submit', label: 'Submit' },
  { id: 'confirmed', label: 'Confirmed' },
];

export type TxStepStatus = 'complete' | 'current' | 'failed' | 'upcoming';

export interface TxStep {
  id: TxStepId;
  label: string;
  status: TxStepStatus;
}

/** Which step a phase of `useTx` belongs to. */
export function stepForPhase(phase: TxPhase): TxStepId {
  switch (phase) {
    case 'preparing':
    case 'prepared':
      return 'build';
    case 'signing':
      return 'sign';
    case 'submitting':
      return 'submit';
    case 'confirming':
    case 'syncing':
      return 'confirmed';
  }
}

function indexOfStep(id: TxStepId): number {
  return TX_STEPS.findIndex((step) => step.id === id);
}

/**
 * The stepper for a transaction in `state`, or null while nothing has started. Steps before the
 * active one are complete. A failed transaction marks the step it failed at and leaves the later
 * ones waiting; a finished one has every step complete.
 */
export function txSteps(state: TxState): TxStep[] | null {
  if (state.phase === 'idle') return null;

  const statusAt = (status: (index: number) => TxStepStatus): TxStep[] =>
    TX_STEPS.map((step, index) => ({ ...step, status: status(index) }));

  if (state.phase === 'done') return statusAt(() => 'complete');

  if (state.phase === 'error') {
    const failed = indexOfStep(state.failedAt ?? 'build');
    return statusAt((index) =>
      index < failed ? 'complete' : index === failed ? 'failed' : 'upcoming',
    );
  }

  const current = indexOfStep(stepForPhase(state.phase));
  return statusAt((index) =>
    index < current ? 'complete' : index === current ? 'current' : 'upcoming',
  );
}
