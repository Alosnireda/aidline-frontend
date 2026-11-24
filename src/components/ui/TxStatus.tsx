'use client';

import { useI18n } from '@/components/i18n/I18nProvider';
import type { MessageKey } from '@/i18n';
import { txSteps, type TxStepId, type TxStepStatus } from '@/lib/txSteps';
import type { TxPhase, TxState } from '@/lib/useTx';

import { TxLink } from './TxLink';

const STEP_LABEL: Record<TxStepId, MessageKey> = {
  build: 'tx.step.build',
  sign: 'tx.step.sign',
  submit: 'tx.step.submit',
  confirmed: 'tx.step.confirmed',
};

const STATUS_LABEL: Record<TxStepStatus, MessageKey> = {
  complete: 'tx.status.done',
  current: 'tx.status.current',
  failed: 'tx.status.failed',
  upcoming: 'tx.status.upcoming',
};

const PHASE_MESSAGE: Record<TxPhase, MessageKey> = {
  preparing: 'tx.phase.preparing',
  prepared: 'tx.phase.preparing',
  signing: 'tx.phase.signing',
  submitting: 'tx.phase.submitting',
  confirming: 'tx.phase.confirming',
  syncing: 'tx.phase.syncing',
};

// Each marker differs in shape and fill as well as colour, so a step's state never rests on
// colour alone. The only motion is a pulse on the current step, and only where the reader has
// not asked for reduced motion.
const MARKER: Record<TxStepStatus, string> = {
  complete: 'bg-ink',
  current: 'border-2 border-ink bg-paper motion-safe:animate-pulse',
  failed: 'bg-danger',
  upcoming: 'border border-rule bg-paper',
};

/**
 * Shows a wallet action as four steps (build, sign, submit, confirmed) and ends with the
 * transaction hash and its explorer link. Every panel that runs a transaction renders this, so
 * donating, refunding, releasing, cancelling and creating all read the same way. A failure is
 * shown under the step it happened at.
 */
export function TxStatus({ state, success }: { state: TxState; success: React.ReactNode }) {
  const { t } = useI18n();
  const steps = txSteps(state);
  if (!steps) return null;

  const inProgress =
    state.phase !== 'idle' && state.phase !== 'done' && state.phase !== 'error' ? state : null;
  const currentIndex = steps.findIndex((step) => step.status === 'current');
  const description = inProgress ? t(PHASE_MESSAGE[inProgress.phase]) : null;

  return (
    <div className="mt-4">
      <ol
        aria-label={t('tx.progress')}
        className="space-y-3 border-l border-rule pl-5 text-[0.9375rem]"
      >
        {steps.map((step) => (
          <li
            key={step.id}
            aria-current={step.status === 'current' ? 'step' : undefined}
            className="relative"
          >
            <span
              aria-hidden="true"
              className={`absolute -left-[1.6875rem] top-[0.4375rem] h-2 w-2 ${MARKER[step.status]}`}
            />
            <p className={step.status === 'upcoming' ? 'text-ink-muted' : 'text-ink'}>
              <span className="font-medium">{t(STEP_LABEL[step.id])}</span>
              <span className={step.status === 'failed' ? 'text-danger' : 'text-ink-muted'}>
                {' · '}
                {t(STATUS_LABEL[step.status])}
              </span>
            </p>
            {step.status === 'current' && description && (
              <p className="text-ink-muted">
                {description}
                {/* #145: Show network fee when available */}
                {inProgress?.fee && <> · {t('tx.fee', { fee: inProgress.fee })}</>}
              </p>
            )}
            {step.status === 'failed' && state.phase === 'error' && (
              <p role="alert" className="mt-1 border-l-2 border-danger pl-3 text-danger">
                {state.message}
              </p>
            )}
          </li>
        ))}
      </ol>

      {/* Announces progress to screen readers without re-reading the whole list. */}
      {inProgress && description && currentIndex >= 0 && (
        <p role="status" className="sr-only">
          {t('tx.live', {
            n: currentIndex + 1,
            total: steps.length,
            step: t(STEP_LABEL[steps[currentIndex].id]),
            description,
          })}
        </p>
      )}

      {state.phase === 'done' && (
        <div role="status" className="mt-4 border-l-2 border-ink pl-3 text-[0.9375rem]">
          <p className="text-ink">{success}</p>
          <p className="kicker mt-2">{t('tx.hash')}</p>
          <p className="figure break-all text-[0.8125rem] text-ink">{state.hash}</p>
          <TxLink hash={state.hash} />
        </div>
      )}
    </div>
  );
}
