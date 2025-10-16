'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ScenarioBuilder, { BuilderAction } from './components/scenario-builder';

type ActionType = 'GetFeed' | 'LikeCast' | 'Delay' | 'JoinChannel' | 'CreateRecordGame' | string;

interface ScenarioAction {
  readonly type: ActionType;
  readonly order: number;
  readonly config?: Record<string, unknown>;
}

interface Scenario {
  readonly _id: string;
  readonly name: string;
  readonly shuffle: boolean;
  readonly loop: number;
  readonly actions?: ScenarioAction[];
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

const formatDateTime = (iso?: string): string => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};

const formatActionsSummary = (actions?: ScenarioAction[]): string => {
  if (!actions || actions.length === 0) return 'No actions';
  const ordered = [...actions].sort((a, b) => a.order - b.order);
  const summary = ordered.map((a) => a.type).join(' → ');
  return summary;
};

const ScenariosPage: React.FC = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formLoop, setFormLoop] = useState<number>(1);
  const [formShuffle, setFormShuffle] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<Array<{ _id: string; name: string }>>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  const [logs, setLogs] = useState<Array<{ timestamp: string; actionType: string; status: string; error?: string }>>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newScenarioName, setNewScenarioName] = useState<string>('');

  const handleFetchScenarios = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setHasError(false);
    try {
      const response = await fetch('/api/scenarios', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch scenarios');
      const data: Scenario[] = await response.json();
      setScenarios(data);
    } catch {
      setHasError(true);
      setScenarios([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void handleFetchScenarios();
  }, [handleFetchScenarios]);

  useEffect(() => {
    const loadAccounts = async (): Promise<void> => {
      try {
        const res = await fetch('/api/accounts', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const mapped = (Array.isArray(data) ? data : []).map((a: { _id: string; name: string }) => ({ _id: a._id, name: a.name }));
        setAccounts(mapped);
      } catch {}
    };
    if (selectedScenarioId) {
      void loadAccounts();
    }
  }, [selectedScenarioId]);

  const totalActions = useMemo<number>(() => scenarios.reduce((acc, s) => acc + (s.actions?.length || 0), 0), [scenarios]);

  const selectedScenario = useMemo<Scenario | undefined>(() => scenarios.find((s) => s._id === selectedScenarioId), [scenarios, selectedScenarioId]);
  const builderActions = useMemo<BuilderAction[]>(() => (selectedScenario?.actions || []).map((a, i) => ({ id: `${i}`, type: a.type, order: a.order, config: a.config || {} })), [selectedScenario]);
  const handleBuilderChange = (updated: BuilderAction[]): void => {
    // Only update local UI for now; persisting will be implemented later steps
    // Reflect order change in table state
    if (!selectedScenario) return;
    const updatedScenario: Scenario = { ...selectedScenario, actions: updated.map((a) => ({ type: a.type, order: a.order, config: a.config })) };
    setScenarios((prev) => prev.map((s) => s._id === selectedScenario._id ? updatedScenario : s));
  };

  useEffect(() => {
    if (!selectedScenario) return;
    setFormLoop(selectedScenario.loop ?? 1);
    setFormShuffle(Boolean(selectedScenario.shuffle));
    setSelectedAccountIds([]);
    setExecutionResult(null);
  }, [selectedScenario]);

  const handleSaveScenario = async (): Promise<void> => {
    if (!selectedScenario) return;
    setIsSaving(true);
    try {
      const body = JSON.stringify({ loop: formLoop, shuffle: formShuffle, actions: (selectedScenario.actions || []).map((a) => ({ type: a.type, order: a.order, config: a.config })) });
      const res = await fetch(`/api/scenarios/${encodeURIComponent(selectedScenario._id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body });
      if (!res.ok) throw new Error('Failed to save scenario');
      const updated: Scenario = await res.json();
      setScenarios((prev) => prev.map((s) => s._id === updated._id ? updated : s));
      setSelectedScenarioId(null);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAccount = (id: string): void => {
    setSelectedAccountIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleExecuteScenario = async (): Promise<void> => {
    if (!selectedScenario) return;
    setIsExecuting(true);
    setExecutionResult(null);
    try {
      const res = await fetch(`/api/scenarios/${encodeURIComponent(selectedScenario._id)}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountIds: selectedAccountIds }),
      });
      const text = await res.text();
      setExecutionResult(text);
      // After execution, refresh logs
      void handleFetchLogs();
    } finally {
      setIsExecuting(false);
    }
  };

  const handleFetchLogs = async (): Promise<void> => {
    if (!selectedScenario) return;
    setIsLoadingLogs(true);
    try {
      const res = await fetch(`/api/logs/scenario/${encodeURIComponent(selectedScenario._id)}?page=1&limit=20`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items as Array<{ timestamp: string; actionType: string; status: string; error?: string }> : [];
      setLogs(items);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleCreateScenario = async (): Promise<void> => {
    if (!newScenarioName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newScenarioName.trim(), actions: [], shuffle: false, loop: 1 }),
      });
      if (!res.ok) throw new Error('Failed to create scenario');
      const created: Scenario = await res.json();
      setScenarios((prev) => [created, ...prev]);
      setNewScenarioName('');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Scenarios</h1>
        </div>
        <div className="rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Loading scenarios…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Scenarios</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500" aria-live="polite">{scenarios.length} scenarios • {totalActions} actions</div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="New scenario name"
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
              value={newScenarioName}
              onChange={(e) => setNewScenarioName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { void handleCreateScenario(); } }}
            />
            <button
              type="button"
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:opacity-50"
              onClick={() => { void handleCreateScenario(); }}
              disabled={isCreating || !newScenarioName.trim()}
              aria-busy={isCreating}
            >
              {isCreating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      </div>

      {hasError ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-red-700" role="alert" aria-live="assertive">
          Failed to load scenarios. Please try again.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Name</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Loop</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Shuffle</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Actions</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Updated</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Builder</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {scenarios.map((scenario) => (
              <tr key={scenario._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{scenario.name}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{scenario.loop}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${scenario.shuffle ? 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' : 'bg-gray-100 text-gray-800 ring-gray-600/20'}`}>{scenario.shuffle ? 'Yes' : 'No'}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{formatActionsSummary(scenario.actions)}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(scenario.updatedAt)}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="rounded-md border border-indigo-200 bg-white px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                    aria-label={`Open builder for ${scenario.name}`}
                    tabIndex={0}
                    onClick={() => setSelectedScenarioId(scenario._id)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setSelectedScenarioId(scenario._id); }}
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
            {scenarios.length === 0 && !hasError ? (
              <tr>
                <td className="px-4 py-6 text-sm text-gray-500" colSpan={5}>No scenarios found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {selectedScenario ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="scenario-builder-title">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSelectedScenarioId(null)} />
          <div className="relative z-10 w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl ring-1 ring-gray-200">
            <div className="mb-4 flex items-start justify-between">
              <h2 id="scenario-builder-title" className="text-lg font-semibold">Edit Actions — {selectedScenario.name}</h2>
              <button
                type="button"
                onClick={() => setSelectedScenarioId(null)}
                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                aria-label="Close scenario builder"
              >
                ✕
              </button>
            </div>
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="scenario-loop" className="text-sm text-gray-700">Loop</label>
                <input
                  id="scenario-loop"
                  type="number"
                  min={1}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                  value={formLoop}
                  onChange={(e) => setFormLoop(Math.max(1, Number.parseInt(e.target.value || '1', 10)))}
                />
              </div>
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                    checked={formShuffle}
                    onChange={(e) => setFormShuffle(e.target.checked)}
                  />
                  Shuffle
                </label>
              </div>
            </div>
            <ScenarioBuilder actions={builderActions} onChange={handleBuilderChange} />
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-2 text-sm font-medium text-gray-900">Select Accounts</div>
                <div className="max-h-40 overflow-auto rounded border border-gray-200">
                  <ul className="divide-y divide-gray-100">
                    {accounts.map((acc) => (
                      <li key={acc._id} className="flex items-center justify-between px-3 py-2">
                        <div className="truncate text-sm text-gray-900">{acc.name}</div>
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                            checked={selectedAccountIds.includes(acc._id)}
                            onChange={() => toggleAccount(acc._id)}
                            aria-label={`Select ${acc.name}`}
                          />
                        </label>
                      </li>
                    ))}
                    {accounts.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-gray-500">No accounts available.</li>
                    ) : null}
                  </ul>
                </div>
              </div>
              <div>
                <div className="mb-2 text-sm font-medium text-gray-900">Execution Output</div>
                <div className="h-40 overflow-auto rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-800" aria-live="polite">
                  {executionResult ? executionResult : '—'}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium text-gray-900">Recent Logs</div>
                <button
                  type="button"
                  className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                  onClick={() => { void handleFetchLogs(); }}
                  disabled={isLoadingLogs}
                >
                  {isLoadingLogs ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
              <div className="max-h-48 overflow-auto rounded border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left font-semibold text-gray-600">Time</th>
                      <th scope="col" className="px-3 py-2 text-left font-semibold text-gray-600">Action</th>
                      <th scope="col" className="px-3 py-2 text-left font-semibold text-gray-600">Status</th>
                      <th scope="col" className="px-3 py-2 text-left font-semibold text-gray-600">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {logs.map((log, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-gray-700">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="px-3 py-2 text-gray-700">{log.actionType}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${log.status === 'Success' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-red-50 text-red-700 ring-red-600/20'}`}>{log.status}</span>
                        </td>
                        <td className="px-3 py-2 text-gray-700">{log.error || ''}</td>
                      </tr>
                    ))}
                    {logs.length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-gray-500" colSpan={4}>No logs yet.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                onClick={() => setSelectedScenarioId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:opacity-50"
                onClick={() => { void handleSaveScenario(); }}
                disabled={isSaving}
                aria-busy={isSaving}
              >
                {isSaving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:opacity-50"
                onClick={() => { void handleExecuteScenario(); }}
                disabled={isExecuting || selectedAccountIds.length === 0}
                aria-busy={isExecuting}
              >
                {isExecuting ? 'Executing…' : 'Execute'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ScenariosPage;



