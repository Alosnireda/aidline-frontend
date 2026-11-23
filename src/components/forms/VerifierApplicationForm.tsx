'use client';

import { useState } from 'react';

import { useWallet } from '@/components/wallet/WalletProvider';
import { api, ApiError } from '@/lib/api';
import { applicationErrors, type ApplicationField } from '@/lib/applicationErrors';

/** Props that link an input to its error message, when it has one. */
function errorProps(field: ApplicationField, message: string | undefined) {
  return message ? { 'aria-invalid': true, 'aria-describedby': `${field}-error` } : {};
}

function FieldError({ field, message }: { field: ApplicationField; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${field}-error`} className="mt-1.5 text-sm text-danger">
      {message}
    </p>
  );
}

export function VerifierApplicationForm() {
  const { address, state: wallet, connect } = useWallet();
  const [orgName, setOrgName] = useState('');
  const [country, setCountry] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ApplicationField, string>>>({});

  if (wallet.status !== 'connected' || !address) {
    return (
      <div className="border-y border-rule py-6">
        <p>Applications are tied to the wallet you will verify with.</p>
        <button type="button" className="btn btn-primary mt-4" onClick={() => void connect()}>
          Connect wallet to apply
        </button>
      </div>
    );
  }

  if (status === 'sent') {
    return (
      <div role="status" className="border-l-2 border-ink pl-4">
        <p className="font-medium text-ink">Application received</p>
        <p className="mt-1">
          We will review {orgName} and register your wallet on chain once approved. Your profile
          appears in the list above as soon as that happens.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setFieldErrors({});
        setStatus('sending');
        try {
          await api.applyAsVerifier({
            address,
            orgName: orgName.trim(),
            country: country.trim(),
            website: website.trim() || undefined,
            description: description.trim(),
          });
          setStatus('sent');
        } catch (err) {
          setStatus('idle');
          if (err instanceof ApiError && err.issues.length) {
            const { fields, general } = applicationErrors(err.issues);
            setFieldErrors(fields);
            setError(
              general.length
                ? general.join(' ')
                : 'Some answers need fixing. See the messages under each field.',
            );
          } else {
            setError('The application could not be sent. Try again in a moment.');
          }
        }
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="org">
            Organisation
          </label>
          <input
            id="org"
            {...errorProps('orgName', fieldErrors.orgName)}
            className="field"
            required
            minLength={2}
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
          />
          <FieldError field="orgName" message={fieldErrors.orgName} />
        </div>
        <div>
          <label className="label" htmlFor="country">
            Country
          </label>
          <input
            id="country"
            {...errorProps('country', fieldErrors.country)}
            className="field"
            required
            minLength={2}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
          <FieldError field="country" message={fieldErrors.country} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="website">
          Website <span className="font-normal text-ink-muted">(optional)</span>
        </label>
        <input
          id="website"
          {...errorProps('website', fieldErrors.website)}
          type="url"
          className="field"
          placeholder="https://"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
        <FieldError field="website" message={fieldErrors.website} />
      </div>
      <div>
        <label className="label" htmlFor="about">
          How you verify work on the ground
        </label>
        <textarea
          id="about"
          {...errorProps('description', fieldErrors.description)}
          className="field min-h-32"
          required
          minLength={20}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <FieldError field="description" message={fieldErrors.description} />
      </div>
      <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending' : 'Send application'}
      </button>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
