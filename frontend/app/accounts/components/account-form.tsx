import React, { useEffect, useMemo, useState } from 'react';

export type AccountFormMode = 'add' | 'edit';

export interface AccountFormInput {
  readonly name: string;
  readonly status: 'Active' | 'Expired' | 'Error';
  readonly token?: string;
}

interface AccountFormProps {
  readonly mode: AccountFormMode;
  readonly initialValues?: Partial<AccountFormInput>;
  readonly isSubmitting?: boolean;
  readonly onSubmit: (values: AccountFormInput) => void;
  readonly onCancel: () => void;
}

/**
 * AccountForm renders a controlled form to add or edit an account.
 */
const AccountForm: React.FC<AccountFormProps> = ({ mode, initialValues, isSubmitting = false, onSubmit, onCancel }) => {
  const [name, setName] = useState<string>('');
  const [status, setStatus] = useState<'Active' | 'Expired' | 'Error'>('Active');
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    setName(initialValues?.name ?? '');
    setStatus((initialValues?.status as 'Active' | 'Expired' | 'Error') ?? 'Active');
  }, [initialValues]);

  const title = useMemo<string>(() => (mode === 'add' ? 'Add Account' : 'Edit Account'), [mode]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setHasError(false);
    setErrorMessage('');
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      setHasError(true);
      setErrorMessage('Name must be between 2 and 50 characters.');
      return;
    }
    if (!['Active', 'Expired', 'Error'].includes(status)) {
      setHasError(true);
      setErrorMessage('Invalid status selected.');
      return;
    }
    if (mode === 'add') {
      const trimmedToken = token.trim();
      if (!trimmedToken) {
        setHasError(true);
        setErrorMessage('Token is required to create an account.');
        return;
      }
      if (trimmedToken.length < 10) {
        setHasError(true);
        setErrorMessage('Token must be at least 10 characters long.');
        return;
      }
      onSubmit({ name: trimmedName, status, token: trimmedToken });
      return;
    }
    const trimmedTokenOptional = token.trim();
    onSubmit({ name: trimmedName, status, token: trimmedTokenOptional || undefined });
  };

  return (
    <form onSubmit={handleSubmit} aria-label={title} className="w-full">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            aria-required="true"
            aria-invalid={hasError && !name.trim() ? true : undefined}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Account name"
          />
        </div>
        <div>
          <label htmlFor="token" className="block text-sm font-medium text-gray-700">Token {mode === 'add' ? <span className="text-red-600">*</span> : <span className="text-gray-400">(optional)</span>}</label>
          <input
            id="token"
            name="token"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required={mode === 'add'}
            aria-required={mode === 'add' ? 'true' : undefined}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder={mode === 'add' ? 'Enter token' : 'Leave blank to keep current token'}
          />
          <p className="mt-1 text-xs text-gray-500">Token is stored securely. {mode === 'edit' ? 'Leave blank to keep existing token.' : ''}</p>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'Active' | 'Expired' | 'Error')}
            className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            aria-label="Select account status"
          >
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
            <option value="Error">Error</option>
          </select>
        </div>
        {hasError ? (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>
        ) : null}
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          onKeyDown={(e) => { if (e.key === 'Enter') onCancel(); }}
          tabIndex={0}
          className="rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          aria-label="Cancel"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          aria-label={mode === 'add' ? 'Create account' : 'Save account'}
        >
          {mode === 'add' ? (isSubmitting ? 'Creating…' : 'Create') : (isSubmitting ? 'Saving…' : 'Save')}
        </button>
      </div>
    </form>
  );
};

export default AccountForm;


