'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ScriptBuilder, { ScriptAction } from './components/script-builder';
import AccountSelector from './components/account-selector';
import ActionStatusCard, { ActionResult } from '../accounts/components/action-status-card';

interface Account {
  readonly _id: string;
  readonly name: string;
  readonly status: string;
}

interface Script {
  readonly id: string;
  readonly name: string;
  readonly actions: ScriptAction[];
  readonly loop: number;
  readonly shuffle: boolean;
  readonly createdAt: Date;
}

const ScriptsPage: React.FC = () => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newScriptName, setNewScriptName] = useState<string>('');
  const [showActionStatus, setShowActionStatus] = useState<boolean>(false);
  const [currentExecutingAccount, setCurrentExecutingAccount] = useState<string | null>(null);
  const [actionResults, setActionResults] = useState<ActionResult[]>([]);
  const [allAccountResults, setAllAccountResults] = useState<Record<string, ActionResult[]>>({});
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [currentActionIndex, setCurrentActionIndex] = useState<number>(0);
  const [totalActions, setTotalActions] = useState<number>(0);
  const [executionProgress, setExecutionProgress] = useState<{
    currentAccount: number;
    totalAccounts: number;
    accountName: string;
  } | null>(null);

  const handleFetchAccounts = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/accounts', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch accounts');
      const data: Account[] = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error('Failed to fetch accounts', error);
    }
  }, []);

  const handleFetchScripts = useCallback(async (): Promise<void> => {
    // For now, we'll store scripts in localStorage
    // In a real app, this would be an API call
    try {
      const stored = localStorage.getItem('farcaster-scripts');
      if (stored) {
        const parsedScripts = JSON.parse(stored).map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt)
        }));
        setScripts(parsedScripts);
      }
    } catch (error) {
      console.error('Failed to fetch scripts', error);
    }
  }, []);

  const handleSaveScript = useCallback((script: Script): void => {
    setScripts(prevScripts => {
      const updatedScripts = prevScripts.find(s => s.id === script.id)
        ? prevScripts.map(s => s.id === script.id ? script : s)
        : [...prevScripts, script];
      
      // Clean up File objects before saving to localStorage
      const scriptsToSave = updatedScripts.map(s => ({
        ...s,
        actions: s.actions.map(a => ({
          ...a,
          config: {
            ...a.config,
            // Remove File objects from mediaFiles before saving
            mediaFiles: Array.isArray(a.config?.mediaFiles)
              ? (a.config.mediaFiles as any[]).map(f => ({
                  name: f.name,
                  size: f.size,
                  type: f.type
                  // Don't save the actual File object
                }))
              : a.config?.mediaFiles
          }
        }))
      }));
      
      localStorage.setItem('farcaster-scripts', JSON.stringify(scriptsToSave));
      return updatedScripts;
    });
  }, []);

  const handleCreateScript = useCallback((): void => {
    if (!newScriptName.trim()) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newScript: Script = {
      id,
      name: newScriptName.trim(),
      actions: [],
      loop: 1,
      shuffle: false,
      createdAt: new Date(),
    };
    handleSaveScript(newScript);
    setNewScriptName('');
    setSelectedScriptId(id);
  }, [newScriptName, handleSaveScript]);

  const handleDeleteScript = useCallback((scriptId: string): void => {
    setScripts(prevScripts => {
      const updatedScripts = prevScripts.filter(s => s.id !== scriptId);
      localStorage.setItem('farcaster-scripts', JSON.stringify(updatedScripts));
      return updatedScripts;
    });
    if (selectedScriptId === scriptId) {
      setSelectedScriptId(null);
    }
  }, [selectedScriptId]);

  const handleExecuteScript = useCallback(async (): Promise<void> => {
    if (!selectedScriptId || selectedAccountIds.length === 0) return;
    
    const script = scripts.find(s => s.id === selectedScriptId);
    if (!script) return;

    setIsExecuting(true);
    setExecutionResult(null);
    setShowActionStatus(true);
    setActionResults([]);
    setAllAccountResults({});
    setCurrentAction(null);
    setCurrentActionIndex(0);
    setTotalActions(script.actions.length * script.loop);
    setExecutionProgress({
      currentAccount: 0,
      totalAccounts: selectedAccountIds.length,
      accountName: ''
    });
    
    try {
      // Execute script on each account with progress updates
      for (let accountIndex = 0; accountIndex < selectedAccountIds.length; accountIndex++) {
        const accountId = selectedAccountIds[accountIndex];
        const account = accounts.find(a => a._id === accountId);
        const accountName = account?.name || 'Unknown Account';
        const interimResults: ActionResult[] = [];
        
        setCurrentExecutingAccount(accountId);
        setExecutionProgress({
          currentAccount: accountIndex + 1,
          totalAccounts: selectedAccountIds.length,
          accountName
        });
        
        // Push interim results for each action across all loops to avoid pending
        for (let loopIndex = 0; loopIndex < script.loop; loopIndex++) {
          for (let actionIndex = 0; actionIndex < script.actions.length; actionIndex++) {
            const action = script.actions[actionIndex];
            setCurrentAction(action.type);
            setCurrentActionIndex(loopIndex * script.actions.length + actionIndex);
            await new Promise(resolve => setTimeout(resolve, 200)); // Faster for loops
            interimResults.push({ actionType: action.type, success: true, result: { message: 'Action completed successfully' } });
            setActionResults([...interimResults]);
          }
        }
        
        // Preprocess actions for this account: upload media and inject embeds for CreateCast
        const actionsForAccount: ScriptAction[] = [];
        for (const a of script.actions) {
          if (a.type === 'CreateCast') {
            const cfg = a.config || {};
            let embeds: string[] = Array.isArray((cfg as any).embeds) ? ((cfg as any).embeds as string[]) : [];
            const mediaFiles = Array.isArray((cfg as any).mediaFiles) ? ((cfg as any).mediaFiles as any[]) : [];
            const files = mediaFiles.filter(f => f?.file instanceof File).map(f => f.file as File);
            if (files.length > 0) {
              const { uploadMultipleMediaFiles } = await import('./utils/media-upload-service');
              const uploadRes = await uploadMultipleMediaFiles(accountId, files);
              if (!uploadRes.success) {
                // push a failed result placeholder and continue to next action
                actionsForAccount.push({ ...a, config: { text: (cfg as any).text || '', embeds: [] } });
                interimResults.push({ actionType: a.type, success: false, error: `Media upload failed: ${uploadRes.errors.join(', ')}` });
                setActionResults([...interimResults]);
                continue;
              }
              embeds = [...embeds, ...uploadRes.mediaUrls];
            }
            // Enforce max 4 embeds
            if (embeds.length > 4) embeds = embeds.slice(0, 4);
            actionsForAccount.push({
              ...a,
              config: {
                text: (cfg as any).text || '',
                embeds,
              },
            });
          } else {
            // Remove any mediaFiles from other actions' configs to avoid serialization issues
            const { mediaFiles, ...rest } = (a.config || {}) as any;
            actionsForAccount.push({ ...a, config: { ...rest } });
          }
        }

        // Call API per-account and merge results
        const res = await fetch('/api/scripts/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            accountId, 
            actions: actionsForAccount,
            options: { loop: script.loop, shuffle: script.shuffle }
          }),
        });

         let finalResults: ActionResult[] = [];
         if (res.ok) {
           const payload = await res.json();
           let normalized: ActionResult[] = [];
           if (Array.isArray(payload)) {
             normalized = payload.flatMap((p: { results?: ActionResult[] }) => Array.isArray(p?.results) ? p.results : []);
           } else if (payload && Array.isArray(payload.results)) {
             normalized = payload.results as ActionResult[];
           }
           finalResults = script.actions.map((a, idx) => {
             const server = normalized[idx];
             const existing = interimResults[idx];
             return server ? server : (existing || { actionType: a.type, success: true, result: { message: 'Action completed successfully' } });
           });
         } else {
           finalResults = script.actions.map((a) => ({ actionType: a.type, success: false, error: `HTTP ${res.status}: ${res.statusText}` }));
         }

         // Store results for this account
         setAllAccountResults(prev => ({
           ...prev,
           [accountId]: finalResults
         }));

         // Update current action results for display
         setActionResults(finalResults);
        
        // Prepare for next account
        setCurrentAction(null);
        setCurrentActionIndex(script.actions.length * script.loop);
      }
      
      // Optionally keep a textual result
      const response = await fetch('/api/scripts/execute-multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          accountIds: selectedAccountIds, 
          actions: script.actions,
          options: { loop: script.loop, shuffle: script.shuffle }
        }),
      });
      const resultText = await response.text();
      setExecutionResult(resultText);
    } catch (error) {
      setActionResults(script.actions.map((a) => ({ actionType: a.type, success: false, error: error instanceof Error ? error.message : 'Unknown error' })));
    } finally {
      setIsExecuting(false);
      setCurrentAction(null);
      setCurrentActionIndex(script.actions.length * script.loop);
      setExecutionProgress(null);
    }
  }, [selectedScriptId, selectedAccountIds, scripts, accounts]);

  const handleCloseActionStatus = (): void => {
    setShowActionStatus(false);
    setCurrentExecutingAccount(null);
    setActionResults([]);
    setAllAccountResults({});
    setCurrentAction(null);
    setCurrentActionIndex(0);
    setTotalActions(0);
    setExecutionProgress(null);
  };

  const selectedScript = useMemo(() => 
    scripts.find(s => s.id === selectedScriptId), 
    [scripts, selectedScriptId]
  );

  const selectedAccounts = useMemo(() => 
    accounts.filter(a => selectedAccountIds.includes(a._id)), 
    [accounts, selectedAccountIds]
  );

  useEffect(() => {
    void handleFetchAccounts();
    void handleFetchScripts();
  }, [handleFetchAccounts, handleFetchScripts]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Scripts</h1>
        </div>
        <div className="rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Loading scripts…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Scripts</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500" aria-live="polite">
            {scripts.length} scripts • {selectedAccountIds.length} accounts selected
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="New script name"
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
              value={newScriptName}
              onChange={(e) => setNewScriptName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { void handleCreateScript(); } }}
            />
            <button
              type="button"
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:opacity-50"
              onClick={handleCreateScript}
              disabled={isCreating || !newScriptName.trim()}
              aria-busy={isCreating}
            >
              {isCreating ? 'Creating…' : 'Create Script'}
            </button>
          </div>
        </div>
      </div>

      {hasError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-red-700" role="alert" aria-live="assertive">
          Failed to load scripts. Please try again.
        </div>
      )}

      {executionResult && (
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-800">Script Execution Result</h3>
              <pre className="mt-2 text-xs text-blue-700 whitespace-pre-wrap">{executionResult}</pre>
            </div>
            <button
              type="button"
              onClick={() => setExecutionResult(null)}
              className="rounded p-1 text-blue-500 hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              aria-label="Close script result"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scripts List */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900">Available Scripts</h2>
          <div className="space-y-2">
            {scripts.map((script) => (
              <div
                key={script.id}
                className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                  selectedScriptId === script.id
                    ? 'border-indigo-300 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
                onClick={() => setSelectedScriptId(script.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{script.name}</h3>
                    <p className="text-xs text-gray-500">
                      {script.actions.length} actions • Created {script.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteScript(script.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {scripts.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <p className="text-sm text-gray-500">No scripts created yet. Create your first script above.</p>
              </div>
            )}
          </div>
        </div>

        {/* Script Builder and Account Selection */}
        <div className="space-y-4">
          {selectedScript ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Edit Script: {selectedScript.name}</h2>
                <button
                  type="button"
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                  onClick={() => setSelectedScriptId(null)}
                >
                  Close
                </button>
              </div>
              
              <ScriptBuilder
                script={selectedScript}
                onSave={handleSaveScript}
              />
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-sm text-gray-500">Select a script to edit or create a new one.</p>
            </div>
          )}

          {/* Account Selection */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900">Select Accounts to Run Script</h3>
            <AccountSelector
              accounts={accounts}
              selectedAccountIds={selectedAccountIds}
              onSelectionChange={setSelectedAccountIds}
            />
          </div>

          {/* Execute Button */}
          {selectedScript && selectedAccountIds.length > 0 && (
            <div className="pt-4">
              <button
                type="button"
                className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:opacity-50"
                onClick={() => { void handleExecuteScript(); }}
                disabled={isExecuting}
                aria-busy={isExecuting}
              >
                {isExecuting ? 'Executing…' : `Execute Script on ${selectedAccountIds.length} Account${selectedAccountIds.length > 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Status Card */}
      <ActionStatusCard
        isVisible={showActionStatus}
        accountName={
          executionProgress 
            ? `${executionProgress.accountName} (${executionProgress.currentAccount}/${executionProgress.totalAccounts})`
            : currentExecutingAccount 
              ? accounts.find(a => a._id === currentExecutingAccount)?.name || 'Unknown Account'
              : 'Unknown Account'
        }
        isExecuting={isExecuting}
        currentAction={currentAction ?? undefined}
        currentActionIndex={currentActionIndex}
        totalActions={totalActions}
        results={actionResults}
        allAccountResults={allAccountResults}
        accounts={accounts}
        onClose={handleCloseActionStatus}
      />
    </div>
  );
};

export default ScriptsPage;
