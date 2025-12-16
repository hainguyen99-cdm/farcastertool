'use client';

import React, { useCallback, useEffect, useState } from 'react';
import GameLabelSelector from '../../accounts/components/game-label-selector';

export type ActionType = 'GetFeed' | 'LikeCast' | 'RecastCast' | 'PinMiniApp' | 'Delay' | 'JoinChannel' | 'FollowUser' | 'UpdateWallet' | 'CreateRecordGame' | 'CreateCast' | string;

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
  readonly loop: number;
  readonly shuffle: boolean;
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
  const [loop, setLoop] = useState<number>(script.loop || 1);
  const [shuffle, setShuffle] = useState<boolean>(script.shuffle || false);

  // Sync internal actions state when script prop changes
  useEffect(() => {
    setActions(script.actions);
    setLoop(script.loop || 1);
    setShuffle(script.shuffle || false);
  }, [script.actions, script.loop, script.shuffle]);

  const availableTypes: ActionType[] = ['GetFeed', 'LikeCast', 'RecastCast', 'PinMiniApp', 'Delay', 'JoinChannel', 'FollowUser', 'UpdateWallet', 'CreateRecordGame', 'CreateCast', 'MiniAppEvent', 'AnalyticsEvents'];

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
        loop,
        shuffle,
      };
      onSave(updatedScript);
      setSaveMessage('Script saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [script, actions, loop, shuffle, onSave]);

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

      {/* Loop and Shuffle Configuration */}
      <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="script-loop" className="text-sm text-gray-700">Loop Count</label>
          <input
            id="script-loop"
            type="number"
            min={1}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
            value={loop}
            onChange={(e) => setLoop(Math.max(1, Number.parseInt(e.target.value || '1', 10)))}
          />
          <p className="text-xs text-gray-500">Number of times to execute the script</p>
        </div>
        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
              checked={shuffle}
              onChange={(e) => setShuffle(e.target.checked)}
            />
            Shuffle Actions
          </label>
          <p className="text-xs text-gray-500">Randomize action order on each loop</p>
        </div>
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
              {action.type === 'CreateRecordGame' && (
                <div className="max-w-md">
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`gameLabel-${action.id}`} className="text-sm text-gray-700">Game Label</label>
                    <GameLabelSelector
                      inputId={`gameLabel-${action.id}`}
                      value={typeof action.config?.gameLabel === 'string' ? (action.config.gameLabel as string) : ''}
                      onChange={(val) => handleUpdateAction(action.id, { config: { ...action.config, gameLabel: val } })}
                    />
                    <p className="text-xs text-gray-500">Must match a privy token's game label on the account.</p>
                  </div>
                </div>
              )}
              {action.type === 'CreateCast' && (
                <div className="space-y-4 max-w-2xl">
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`castText-${action.id}`} className="text-sm text-gray-700">Cast Text</label>
                    <textarea
                      id={`castText-${action.id}`}
                      placeholder="Enter your cast text here..."
                      className="rounded-md border border-gray-300 px-2 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                      rows={3}
                      value={typeof action.config?.text === 'string' ? action.config.text as string : ''}
                      onChange={(e) => {
                        handleUpdateAction(action.id, {
                          config: { ...action.config, text: e.target.value }
                        });
                      }}
                    />
                    <p className="text-xs text-gray-500">The text content of your cast (max 300 characters).</p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor={`uploadMedia-${action.id}`} className="text-sm text-gray-700">Upload Media Files (Optional)</label>
                    <input
                      id={`uploadMedia-${action.id}`}
                      type="file"
                      multiple
                      accept="image/*"
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) {
                          const fileArray = Array.from(files).map(f => ({
                            name: f.name,
                            size: f.size,
                            type: f.type,
                            file: f // Store actual File object for upload
                          }));
                          handleUpdateAction(action.id, {
                            config: { 
                              ...action.config, 
                              mediaFiles: fileArray
                            }
                          });
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500">Upload image files to be included in the cast. Maximum 4 images per cast.</p>
                  </div>

                  {typeof action.config?.mediaFiles === 'object' && Array.isArray(action.config.mediaFiles) && (action.config.mediaFiles as any[]).length > 0 && (
                    <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                      <p className="text-xs font-medium text-blue-900 mb-2">Selected Files ({(action.config.mediaFiles as any[]).length}):</p>
                      <ul className="space-y-1">
                        {(action.config.mediaFiles as any[]).map((file, idx) => (
                          <li key={idx} className="text-xs text-blue-700">
                            {idx + 1}. {file.name} ({(file.size / 1024).toFixed(2)} KB)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="rounded-md border border-green-200 bg-green-50 p-3">
                    <p className="text-xs font-medium text-green-900">How it works:</p>
                    <ul className="text-xs text-green-700 mt-2 space-y-1 list-disc list-inside">
                      <li>Upload image files (optional)</li>
                      <li>Files are automatically uploaded to Farcaster during cast creation</li>
                      <li>Media URLs are automatically added to your cast</li>
                      <li>Maximum 4 images per cast</li>
                    </ul>
                  </div>
                </div>
              )}
              {action.type === 'FollowUser' && (
                <div className="max-w-md">
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`userLink-${action.id}`} className="text-sm text-gray-700">User Link</label>
                    <input
                      id={`userLink-${action.id}`}
                      type="url"
                      placeholder="https://farcaster.xyz/pauline-unik"
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                      value={typeof action.config?.userLink === 'string' ? action.config.userLink as string : ''}
                      onChange={(e) => {
                        handleUpdateAction(action.id, {
                          config: { ...action.config, userLink: e.target.value }
                        });
                      }}
                    />
                    <p className="text-xs text-gray-500">Enter the full Farcaster user profile URL (e.g., https://farcaster.xyz/username).</p>
                  </div>
                </div>
              )}
              {action.type === 'MiniAppEvent' && (
                <div className="grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`domain-${action.id}`} className="text-sm text-gray-700">Domain</label>
                    <input
                      id={`domain-${action.id}`}
                      type="text"
                      placeholder="maze.gfun.top"
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                      value={typeof action.config?.domain === 'string' ? action.config.domain as string : ''}
                      onChange={(e) => {
                        handleUpdateAction(action.id, {
                          config: { ...action.config, domain: e.target.value }
                        });
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`event-${action.id}`} className="text-sm text-gray-700">Event</label>
                    <input
                      id={`event-${action.id}`}
                      type="text"
                      placeholder="open"
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                      value={typeof action.config?.event === 'string' ? action.config.event as string : ''}
                      onChange={(e) => {
                        handleUpdateAction(action.id, {
                          config: { ...action.config, event: e.target.value }
                        });
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label htmlFor={`platformType-${action.id}`} className="text-sm text-gray-700">Platform Type</label>
                    <select
                      id={`platformType-${action.id}`}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                      value={typeof action.config?.platformType === 'string' ? action.config.platformType as string : 'web'}
                      onChange={(e) => {
                        handleUpdateAction(action.id, {
                          config: { ...action.config, platformType: e.target.value }
                        });
                      }}
                    >
                      <option value="web">Web</option>
                      <option value="mobile">Mobile</option>
                    </select>
                    <p className="text-xs text-gray-500">Send a mini app event to Farcaster (e.g., domain: maze.gfun.top, event: open).</p>
                  </div>
                </div>
              )}
              {action.type === 'AnalyticsEvents' && (
                <div className="grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`frameDomain-${action.id}`} className="text-sm text-gray-700">Frame Domain</label>
                    <input
                      id={`frameDomain-${action.id}`}
                      type="text"
                      placeholder="maze.gfun.top"
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                      value={typeof action.config?.frameDomain === 'string' ? action.config.frameDomain as string : ''}
                      onChange={(e) => {
                        handleUpdateAction(action.id, {
                          config: { ...action.config, frameDomain: e.target.value }
                        });
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`frameName-${action.id}`} className="text-sm text-gray-700">Frame Name</label>
                    <input
                      id={`frameName-${action.id}`}
                      type="text"
                      placeholder="Maze Runner by Uptopia"
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                      value={typeof action.config?.frameName === 'string' ? action.config.frameName as string : ''}
                      onChange={(e) => {
                        handleUpdateAction(action.id, {
                          config: { ...action.config, frameName: e.target.value }
                        });
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label htmlFor={`frameUrl-${action.id}`} className="text-sm text-gray-700">Frame URL</label>
                    <input
                      id={`frameUrl-${action.id}`}
                      type="url"
                      placeholder="https://maze.gfun.top"
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                      value={typeof action.config?.frameUrl === 'string' ? action.config.frameUrl as string : ''}
                      onChange={(e) => {
                        handleUpdateAction(action.id, {
                          config: { ...action.config, frameUrl: e.target.value }
                        });
                      }}
                    />
                    <p className="text-xs text-gray-500">
                      Send analytics events to Farcaster. Type defaults to "frame-launch", timestamp is current time, and authorFid is automatically retrieved from account.
                    </p>
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
