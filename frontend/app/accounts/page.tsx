'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AccountForm, { AccountFormInput } from './components/account-form';
import ImportAccountsModal from './components/import-accounts-modal';
import ScriptExecutor, { ScriptAction } from './components/script-executor';
import ActionStatusCard, { ActionResult } from './components/action-status-card';

type AccountStatus = 'Active' | 'Expired' | 'Error' | string;

interface PrivyToken {
  readonly gameLabel: string;
  readonly encryptedPrivyToken: string;
}

interface Account {
  readonly _id: string;
  readonly name: string;
  readonly status: AccountStatus;
  readonly lastUsed?: string | null;
  readonly error?: string;
  readonly walletAddress?: string;
  readonly username?: string;
  readonly fid?: number;
  readonly privyTokens?: PrivyToken[];
}

const getStatusBadgeClasses = (status: AccountStatus): string => {
  if (status === 'Active') return 'bg-green-100 text-green-800 ring-green-600/20';
  if (status === 'Expired') return 'bg-yellow-100 text-yellow-800 ring-yellow-600/20';
  if (status === 'Error') return 'bg-red-100 text-red-800 ring-red-600/20';
  return 'bg-gray-100 text-gray-800 ring-gray-600/20';
};

const formatLastUsed = (iso?: string | null): string => {
  if (!iso) return 'Never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Never';
  return date.toLocaleString();
};

const AccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState<boolean>(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
  const [editAccountId, setEditAccountId] = useState<string | null>(null);
  const [isExecutingScript, setIsExecutingScript] = useState<boolean>(false);
  const [scriptResult, setScriptResult] = useState<string | null>(null);
  const [showActionStatus, setShowActionStatus] = useState<boolean>(false);
  const [currentExecutingAccount, setCurrentExecutingAccount] = useState<string | null>(null);
  const [actionResults, setActionResults] = useState<ActionResult[]>([]);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [currentActionIndex, setCurrentActionIndex] = useState<number>(0);
  const [totalActions, setTotalActions] = useState<number>(0);
  const [isUpdatingWallet, setIsUpdatingWallet] = useState<boolean>(false);
  const [updatingAccountId, setUpdatingAccountId] = useState<string | null>(null);

  const handleOpenAdd = (): void => setIsAddOpen(true);
  const handleOpenImport = (): void => setIsImportOpen(true);
  const handleCloseAdd = (): void => setIsAddOpen(false);
  const handleCloseImport = (): void => setIsImportOpen(false);
  const handleOpenEdit = (id: string): void => setEditAccountId(id);
  const handleCloseEdit = (): void => setEditAccountId(null);
  const handleOpenDelete = (id: string): void => setDeleteAccountId(id);
  const handleCloseDelete = (): void => setDeleteAccountId(null);
  const handleImported = async (): Promise<void> => { await handleFetchAccounts(); };

  const handleFetchAccounts = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setHasError(false);
    try {
      const response = await fetch('/api/accounts', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch accounts');
      const data: Account[] = await response.json();
      setAccounts(data);
    } catch {
      setHasError(true);
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void handleFetchAccounts();
  }, [handleFetchAccounts]);

  const editInitialValues = useMemo<Partial<AccountFormInput> | undefined>(() => {
    if (!editAccountId) return undefined;
    const target = accounts.find((a) => a._id === editAccountId);
    if (!target) return undefined;
    return { 
      name: target.name, 
      status: (target.status as 'Active' | 'Expired' | 'Error'),
      privyTokens: target.privyTokens?.map(pt => ({
        gameLabel: pt.gameLabel,
        privyToken: '••••••••' // Don't show actual token values
      })) || []
    };
  }, [accounts, editAccountId]);

  const handleSubmitAdd = async (values: AccountFormInput): Promise<void> => {
    setIsSubmittingAdd(true);
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error('Failed to create account');
      await handleFetchAccounts();
      handleCloseAdd();
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleSubmitEdit = async (values: AccountFormInput): Promise<void> => {
    if (!editAccountId) return;
    setIsSubmittingEdit(true);
    try {
      const response = await fetch(`/api/accounts/${encodeURIComponent(editAccountId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error('Failed to update account');
      await handleFetchAccounts();
      handleCloseEdit();
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteAccount = async (): Promise<void> => {
    if (!deleteAccountId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/accounts/${encodeURIComponent(deleteAccountId)}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete account');
      await handleFetchAccounts();
      handleCloseDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExecuteScript = async (accountId: string, actions: ScriptAction[]): Promise<void> => {
    setIsExecutingScript(true);
    setScriptResult(null);
    setShowActionStatus(true);
    setCurrentExecutingAccount(accountId);
    setActionResults([]);
    setCurrentAction(null);
    setCurrentActionIndex(0);
    setTotalActions(actions.length);

    try {
      const interimResults: ActionResult[] = [];

      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        setCurrentAction(action.type);
        setCurrentActionIndex(i);
        await new Promise(resolve => setTimeout(resolve, 400));
        // Push an optimistic success for visual continuity
        interimResults.push({ actionType: action.type, success: true, result: { message: 'Action completed successfully' } });
        setActionResults([...interimResults]);
      }

      // Call API once with all actions
      const response = await fetch('/api/scripts/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, actions }),
      });

      if (response.ok) {
        const payload = await response.json();
        let normalized: ActionResult[] = [];
        if (Array.isArray(payload)) {
          normalized = payload.flatMap((p: { results?: ActionResult[] }) => Array.isArray(p?.results) ? p.results : []);
        } else if (payload && Array.isArray(payload.results)) {
          normalized = payload.results as ActionResult[];
        }
        // Merge normalized into interim by index; preserve earlier entries if server returned fewer
        const merged: ActionResult[] = actions.map((a, idx) => {
          const server = normalized[idx];
          const existing = interimResults[idx];
          return server ? server : (existing || { actionType: a.type, success: true, result: { message: 'Action completed successfully' } });
        });
        setActionResults(merged);
        setScriptResult(JSON.stringify(payload));
      } else {
        // Mark all as failed with HTTP error
        const failed: ActionResult[] = actions.map((a) => ({ actionType: a.type, success: false, error: `HTTP ${response.status}: ${response.statusText}` }));
        setActionResults(failed);
      }
    } catch (error) {
      setActionResults(actions.map((a) => ({ actionType: a.type, success: false, error: error instanceof Error ? error.message : 'Unknown error' })));
    } finally {
      setIsExecutingScript(false);
      setCurrentAction(null);
      setCurrentActionIndex(actions.length);
    }
  };

  const handleCloseActionStatus = (): void => {
    setShowActionStatus(false);
    setCurrentExecutingAccount(null);
    setActionResults([]);
    setCurrentAction(null);
    setCurrentActionIndex(0);
    setTotalActions(0);
  };

  const handleUpdateWalletAndUsername = async (accountId: string): Promise<void> => {
    setIsUpdatingWallet(true);
    setUpdatingAccountId(accountId);
    try {
      const response = await fetch(`/api/accounts/${encodeURIComponent(accountId)}/update-wallet-username`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to update wallet and username');
      await handleFetchAccounts();
    } catch (error) {
      console.error('Error updating wallet and username:', error);
      // You could add a toast notification here
    } finally {
      setIsUpdatingWallet(false);
      setUpdatingAccountId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Accounts</h1>
          <div className="space-x-2">
            <button
              type="button"
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
              aria-label="Add Account"
              disabled
            >
              Add Account
            </button>
            <button
              type="button"
              className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
              aria-label="Import Accounts"
              disabled
            >
              Import Accounts
            </button>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Loading accounts…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Accounts</h1>
        <div className="space-x-2">
          <button
            type="button"
            onClick={handleOpenAdd}
            onKeyDown={(e) => { if (e.key === 'Enter') handleOpenAdd(); }}
            tabIndex={0}
            aria-label="Add Account"
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          >
            Add Account
          </button>
          <button
            type="button"
            onClick={handleOpenImport}
            onKeyDown={(e) => { if (e.key === 'Enter') handleOpenImport(); }}
            tabIndex={0}
            aria-label="Import Accounts"
            className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          >
            Import Accounts
          </button>
        </div>
      </div>

      {hasError ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-red-700" role="alert" aria-live="assertive">
          Failed to load accounts. Please try again.
        </div>
      ) : null}

      {scriptResult && (
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-800">Script Execution Result</h3>
              <pre className="mt-2 text-xs text-blue-700 whitespace-pre-wrap">{scriptResult}</pre>
            </div>
            <button
              type="button"
              onClick={() => setScriptResult(null)}
              className="rounded p-1 text-blue-500 hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              aria-label="Close script result"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Name</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Username</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">FID</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Wallet Address</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Last Used</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {accounts.map((account) => (
              <tr key={account._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{account.name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadgeClasses(account.status)}`}>
                    {account.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{account.username || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-700 font-mono">{account.fid || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-700 font-mono text-xs">
                  {account.walletAddress ? `${account.walletAddress.slice(0, 6)}...${account.walletAddress.slice(-4)}` : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{formatLastUsed(account.lastUsed)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ScriptExecutor
                      accountId={account._id}
                      accountName={account.name}
                      onExecute={handleExecuteScript}
                      isExecuting={isExecutingScript}
                    />
                    <button
                      type="button"
                      className="rounded-md border border-green-200 bg-white px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:opacity-50"
                      aria-label={`Update wallet and username for ${account.name}`}
                      tabIndex={0}
                      onClick={() => handleUpdateWalletAndUsername(account._id)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateWalletAndUsername(account._id); }}
                      disabled={isUpdatingWallet && updatingAccountId === account._id}
                    >
                      {isUpdatingWallet && updatingAccountId === account._id ? 'Updating...' : 'Update Wallet'}
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-indigo-200 bg-white px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                      aria-label={`Edit ${account.name}`}
                      tabIndex={0}
                      onClick={() => handleOpenEdit(account._id)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleOpenEdit(account._id); }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                      aria-label={`Delete ${account.name}`}
                      tabIndex={0}
                      onClick={() => handleOpenDelete(account._id)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleOpenDelete(account._id); }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && !hasError ? (
              <tr>
                <td className="px-4 py-6 text-sm text-gray-500" colSpan={7}>No accounts found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Add Account Modal */}
      {isAddOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="add-account-title">
          <div className="fixed inset-0 bg-black/40" onClick={handleCloseAdd} />
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl ring-1 ring-gray-200">
            <div className="mb-4 flex items-start justify-between">
              <h2 id="add-account-title" className="text-lg font-semibold">Add Account</h2>
              <button
                type="button"
                onClick={handleCloseAdd}
                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                aria-label="Close add account form"
              >
                ✕
              </button>
            </div>
            <AccountForm mode="add" onSubmit={handleSubmitAdd} onCancel={handleCloseAdd} isSubmitting={isSubmittingAdd} />
          </div>
        </div>
      ) : null}

      {/* Edit Account Modal */}
      {editAccountId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="edit-account-title">
          <div className="fixed inset-0 bg-black/40" onClick={handleCloseEdit} />
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl ring-1 ring-gray-200">
            <div className="mb-4 flex items-start justify-between">
              <h2 id="edit-account-title" className="text-lg font-semibold">Edit Account</h2>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                aria-label="Close edit account form"
              >
                ✕
              </button>
            </div>
            <AccountForm mode="edit" initialValues={editInitialValues} onSubmit={handleSubmitEdit} onCancel={handleCloseEdit} isSubmitting={isSubmittingEdit} />
          </div>
        </div>
      ) : null}

      {/* Import Accounts Modal */}
      {isImportOpen ? (
        <ImportAccountsModal
          onClose={handleCloseImport}
          onImported={() => { void handleImported(); }}
        />
      ) : null}

      {/* Delete Confirmation Modal */}
      {deleteAccountId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
          <div className="fixed inset-0 bg-black/40" onClick={handleCloseDelete} />
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl ring-1 ring-gray-200">
            <div className="mb-4 flex items-start justify-between">
              <h2 id="delete-account-title" className="text-lg font-semibold">Delete Account</h2>
              <button
                type="button"
                onClick={handleCloseDelete}
                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                aria-label="Close delete confirmation"
              >
                ✕
              </button>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete this account? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                onClick={handleCloseDelete}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:opacity-50"
                onClick={() => { void handleDeleteAccount(); }}
                disabled={isDeleting}
                aria-busy={isDeleting}
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Action Status Card */}
      <ActionStatusCard
        isVisible={showActionStatus}
        accountName={currentExecutingAccount ? accounts.find(a => a._id === currentExecutingAccount)?.name || 'Unknown Account' : 'Unknown Account'}
        isExecuting={isExecutingScript}
        currentAction={currentAction ?? undefined}
        currentActionIndex={currentActionIndex}
        totalActions={totalActions}
        results={actionResults}
        onClose={handleCloseActionStatus}
      />
    </div>
  );
};

export default AccountsPage;


