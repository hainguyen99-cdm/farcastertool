'use client';

import React, { useCallback } from 'react';

interface Account {
  readonly _id: string;
  readonly name: string;
  readonly status: string;
}

export interface AccountSelectorProps {
  readonly accounts: Account[];
  readonly selectedAccountIds: string[];
  readonly onSelectionChange: (accountIds: string[]) => void;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({ 
  accounts, 
  selectedAccountIds, 
  onSelectionChange 
}) => {
  const handleToggleAccount = useCallback((accountId: string): void => {
    onSelectionChange(
      selectedAccountIds.includes(accountId)
        ? selectedAccountIds.filter(id => id !== accountId)
        : [...selectedAccountIds, accountId]
    );
  }, [selectedAccountIds, onSelectionChange]);

  const handleSelectAll = useCallback((): void => {
    onSelectionChange(accounts.map(a => a._id));
  }, [accounts, onSelectionChange]);

  const handleSelectNone = useCallback((): void => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  const getStatusBadgeClasses = (status: string): string => {
    if (status === 'Active') return 'bg-green-100 text-green-800 ring-green-600/20';
    if (status === 'Expired') return 'bg-yellow-100 text-yellow-800 ring-yellow-600/20';
    if (status === 'Error') return 'bg-red-100 text-red-800 ring-red-600/20';
    return 'bg-gray-100 text-gray-800 ring-gray-600/20';
  };

  return (
    <div className="space-y-3">
      {/* Selection Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          onClick={handleSelectAll}
        >
          Select All
        </button>
        <button
          type="button"
          className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          onClick={handleSelectNone}
        >
          Select None
        </button>
        <span className="text-xs text-gray-500">
          {selectedAccountIds.length} of {accounts.length} selected
        </span>
      </div>

      {/* Accounts List */}
      <div className="max-h-64 overflow-auto rounded border border-gray-200">
        {accounts.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-gray-500">
            No accounts available. Create accounts first.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {accounts.map((account) => (
              <li key={account._id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                    checked={selectedAccountIds.includes(account._id)}
                    onChange={() => handleToggleAccount(account._id)}
                    aria-label={`Select ${account.name}`}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{account.name}</span>
                    <span className={`inline-flex w-fit items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusBadgeClasses(account.status)}`}>
                      {account.status}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selected Accounts Summary */}
      {selectedAccountIds.length > 0 && (
        <div className="rounded-md bg-blue-50 p-3">
          <h4 className="text-xs font-medium text-blue-800 mb-2">Selected Accounts:</h4>
          <div className="flex flex-wrap gap-1">
            {selectedAccountIds.map(accountId => {
              const account = accounts.find(a => a._id === accountId);
              return account ? (
                <span
                  key={accountId}
                  className="inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
                >
                  {account.name}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSelector;
