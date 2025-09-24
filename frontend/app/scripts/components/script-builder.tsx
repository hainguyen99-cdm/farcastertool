'use client';

import React, { useCallback, useEffect, useState } from 'react';

export type ActionType = 'GetFeed' | 'LikeCast' | 'RecastCast' | 'PinMiniApp' | 'Delay' | 'JoinChannel' | string;

export interface ScriptAction {
  readonly id: string;
  readonly type: ActionType;
  readonly order: number;
  readonly config: Record<string, unknown>;
}

export interface Script {
  readonly id: string;
  readonly name: string;
  readonly actions: ScriptAction[];
  readonly createdAt: Date;
}

export interface ScriptBuilderProps {
  readonly script: Script;
  readonly onSave: (script: Script) => void;
}

const ScriptBuilder: React.FC<ScriptBuilderProps> = ({ script, onSave }) => {
  const [actions, setActions] = useState<ScriptAction[]>(script.actions);
  const [newType, setNewType] = useState<ActionType>('GetFeed');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Sync internal actions state when script prop changes
  useEffect(() => {
    setActions(script.actions);
  }, [script.actions]);

  const availableTypes: ActionType[] = ['GetFeed', 'LikeCast', 'RecastCast', 'PinMiniApp', 'Delay', 'JoinChannel'];

  const handleAddAction = useCallback((): void => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextOrder = actions.length;
    const defaultConfig: Record<string, unknown> = newType === 'Delay' ? { durationMs: 5000 } : {};
    setActions(prev => [...prev, { id, type: newType, order: nextOrder, config: defaultConfig }]);
  }, [actions.length, newType]);

  const handleRemoveAction = useCallback((id: string): void => {
    setActions(prev => prev.filter(a => a.id !== id).map((a, i) => ({ ...a, order: i })));
  }, []);

  const handleUpdateAction = useCallback((id: string, updates: Partial<ScriptAction>): void => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const handleSave = useCallback(async (): Promise<void> => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const updatedScript: Script = {
        ...script,
        actions: actions.map((a, i) => ({ ...a, order: i })),
      };
      onSave(updatedScript);
      setSaveMessage('Script saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [script, actions, onSave]);

  return (
    <div className="space-y-4">
      {/* Add Action Section */}
      <div className="flex items-end justify-between gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3">
        <div className="flex flex-1 items-end gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <label htmlFor="script-action-type" className="text-sm text-gray-700">Add Action</label>
            <select
              id="script-action-type"
              className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
              value={newType}
              onChange={(e) => setNewType(e.target.value as ActionType)}
            >
              {availableTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          onClick={handleAddAction}
          aria-label="Add action"
        >
          Add
        </button>
      </div>

      {/* Actions List */}
      <div className="space-y-3">
        {actions.map((action, index) => (
          <div key={action.id} className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">#{index + 1}</span>
                <select
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                  value={action.type}
                  onChange={(e) => handleUpdateAction(action.id, { type: e.target.value as ActionType })}
                >
                  {availableTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveAction(action.id)}
                className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
              >
                Remove
              </button>
            </div>
            <div className="px-4 py-3">
              {action.type === 'Delay' && (
                <div className="flex max-w-xs items-center gap-2">
                  <label htmlFor={`delay-${action.id}`} className="text-sm text-gray-700">Delay (ms)</label>
                  <input
                    id={`delay-${action.id}`}
                    type="number"
                    className="block w-32 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                    value={typeof action.config?.durationMs === 'number' ? action.config.durationMs as number : 5000}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value, 10);
                      handleUpdateAction(action.id, {
                        config: { ...action.config, durationMs: Number.isFinite(value) ? value : 0 }
                      });
                    }}
                  />
                </div>
              )}
              {(action.type === 'LikeCast' || action.type === 'RecastCast') && (
                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-700">{action.type === 'RecastCast' ? 'Recast Method' : 'Like Cast Method'}</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`likeMethod-${action.id}`}
                          value="random"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                          checked={action.config?.likeMethod !== 'url'}
                          onChange={() => {
                            handleUpdateAction(action.id, {
                              config: { ...action.config, likeMethod: 'random' }
                            });
                          }}
                        />
                        <span className="text-sm text-gray-700">Random (from feed)</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`likeMethod-${action.id}`}
                          value="url"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                          checked={action.config?.likeMethod === 'url'}
                          onChange={() => {
                            handleUpdateAction(action.id, {
                              config: { ...action.config, likeMethod: 'url', castUrl: '' }
                            });
                          }}
                        />
                        <span className="text-sm text-gray-700">Specific URL</span>
                      </label>
                    </div>
                  </div>
                  {action.config?.likeMethod === 'url' && (
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`castUrl-${action.id}`} className="text-sm text-gray-700">Cast URL</label>
                      <input
                        id={`castUrl-${action.id}`}
                        type="url"
                        placeholder="https://farcaster.xyz/username/0x..."
                        className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                        value={typeof action.config?.castUrl === 'string' ? action.config.castUrl as string : ''}
                        onChange={(e) => {
                          handleUpdateAction(action.id, {
                            config: { ...action.config, castUrl: e.target.value }
                          });
                        }}
                      />
                      <p className="text-xs text-gray-500">
                        Enter the full Farcaster URL of the thread (e.g., https://farcaster.xyz/username/0x...)
                      </p>
                    </div>
                  )}
                </div>
              )}
              {action.type === 'JoinChannel' && (
                <div className="grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`channel-${action.id}`} className="text-sm text-gray-700">Channel Key</label>
                    <input
                      id={`channel-${action.id}`}
                      type="text"
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                      value={typeof action.config?.channelKey === 'string' ? action.config.channelKey as string : ''}
                      onChange={(e) => {
                        handleUpdateAction(action.id, {
                          config: { ...action.config, channelKey: e.target.value }
                        });
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`invite-${action.id}`} className="text-sm text-gray-700">Invite Code</label>
                    <input
                      id={`invite-${action.id}`}
                      type="text"
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                      value={typeof action.config?.inviteCode === 'string' ? action.config.inviteCode as string : ''}
                      onChange={(e) => {
                        handleUpdateAction(action.id, {
                          config: { ...action.config, inviteCode: e.target.value }
                        });
                      }}
                    />
                  </div>
                </div>
              )}
              {action.type === 'PinMiniApp' && (
                <div className="max-w-md">
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`domain-${action.id}`} className="text-sm text-gray-700">App Domain</label>
                    <input
                      id={`domain-${action.id}`}
                      type="text"
                      placeholder="boom.gfun.top"
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                      value={typeof action.config?.domain === 'string' ? action.config.domain as string : ''}
                      onChange={(e) => {
                        handleUpdateAction(action.id, {
                          config: { ...action.config, domain: e.target.value }
                        });
                      }}
                    />
                    <p className="text-xs text-gray-500">Enter the miniapp domain to pin (favorite).</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {actions.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
            <p className="text-sm text-gray-500">No actions added yet. Add actions to build your script.</p>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="text-sm text-gray-500">
            {actions.length} action{actions.length !== 1 ? 's' : ''} configured
          </div>
          {saveMessage && (
            <div className="text-sm text-green-600 font-medium">
              {saveMessage}
            </div>
          )}
        </div>
        <button
          type="button"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:opacity-50"
          onClick={() => { void handleSave(); }}
          disabled={isSaving}
          aria-busy={isSaving}
        >
          {isSaving ? 'Saving…' : 'Save Script'}
        </button>
      </div>
    </div>
  );
};

export default ScriptBuilder;
