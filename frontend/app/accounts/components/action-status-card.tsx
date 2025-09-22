'use client';

import React from 'react';

export type ActionStatus = 'pending' | 'running' | 'success' | 'error';

export interface ActionResult {
  readonly actionType: string;
  readonly success: boolean;
  readonly result?: unknown;
  readonly error?: string;
}

export interface ActionStatusCardProps {
  readonly isVisible: boolean;
  readonly accountName: string;
  readonly isExecuting: boolean;
  readonly currentAction?: string;
  readonly currentActionIndex?: number;
  readonly totalActions?: number;
  readonly results: ActionResult[];
  readonly onClose: () => void;
}

const getStatusIcon = (status: ActionStatus): string => {
  switch (status) {
    case 'pending':
      return '⏳';
    case 'running':
      return '🔄';
    case 'success':
      return '✅';
    case 'error':
      return '❌';
    default:
      return '⏳';
  }
};

const getStatusColor = (status: ActionStatus): string => {
  switch (status) {
    case 'pending':
      return 'text-gray-500';
    case 'running':
      return 'text-blue-500';
    case 'success':
      return 'text-green-500';
    case 'error':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

const getStatusBgColor = (status: ActionStatus): string => {
  switch (status) {
    case 'pending':
      return 'bg-gray-50';
    case 'running':
      return 'bg-blue-50';
    case 'success':
      return 'bg-green-50';
    case 'error':
      return 'bg-red-50';
    default:
      return 'bg-gray-50';
  }
};

const ActionStatusCard: React.FC<ActionStatusCardProps> = ({
  isVisible,
  accountName,
  isExecuting,
  currentAction,
  currentActionIndex,
  totalActions,
  results,
  onClose,
}) => {
  if (!isVisible) return null;

  const resolvedTotal: number = totalActions || 0;
  const completedCount: number = Math.min(results.length, resolvedTotal);

  const getActionStatus = (index: number): ActionStatus => {
    if (index < completedCount) {
      return results[index].success ? 'success' : 'error';
    }
    if (isExecuting && index === completedCount) {
      return 'running';
    }
    return 'pending';
  };

  const progressPercentage = resolvedTotal > 0 ? (completedCount / resolvedTotal) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="action-status-title">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl ring-1 ring-gray-200">
        <div className="mb-4 flex items-start justify-between">
          <h2 id="action-status-title" className="text-lg font-semibold">
            Script Execution - {accountName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
            aria-label="Close action status"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        {resolvedTotal > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{completedCount} / {resolvedTotal}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Current Action Status */}
        {isExecuting && currentAction && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔄</span>
              <div>
                <h3 className="text-sm font-medium text-blue-800">Currently Executing</h3>
                <p className="text-sm text-blue-700">{currentAction}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action List */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900">Action Status</h3>
          {resolvedTotal > 0 ? (
            <div className="space-y-2">
              {Array.from({ length: resolvedTotal }, (_, index) => {
                const status = getActionStatus(index);
                const result = results[index];
                
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 rounded-lg border p-3 ${getStatusBgColor(status)}`}
                  >
                    <span className="text-lg">{getStatusIcon(status)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          Action {index + 1}
                        </span>
                        <span className={`text-sm ${getStatusColor(status)}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </div>
                      {result && (
                        <div className="mt-1 text-xs text-gray-600">
                          {result.success ? (
                            <span className="text-green-600">Completed successfully</span>
                          ) : (
                            <span className="text-red-600">
                              Error: {result.error || 'Unknown error'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
              <p className="text-sm text-gray-500">No actions to execute</p>
            </div>
          )}
        </div>

        {/* Summary */}
        {results.length > 0 && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Execution Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {results.filter(r => r.success).length}
                </div>
                <div className="text-gray-600">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600">
                  {results.filter(r => !r.success).length}
                </div>
                <div className="text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-600">
                  {results.length}
                </div>
                <div className="text-gray-600">Total</div>
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
            onClick={onClose}
          >
            {isExecuting ? 'Close (Keep Running)' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionStatusCard;
