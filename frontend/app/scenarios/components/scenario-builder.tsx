'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import GameLabelSelector from '../../accounts/components/game-label-selector';

export type ActionType = 'GetFeed' | 'LikeCast' | 'RecastCast' | 'PinMiniApp' | 'Delay' | 'JoinChannel' | 'CreateRecordGame' | string;

export interface BuilderAction {
  readonly id: string;
  readonly type: ActionType;
  readonly order: number;
  readonly config: Record<string, unknown>;
}

export interface ScenarioBuilderProps {
  readonly actions: BuilderAction[];
  readonly onChange: (actions: BuilderAction[]) => void;
  readonly onRemove?: (id: string) => void;
}

const reorder = (list: BuilderAction[], startIndex: number, endIndex: number): BuilderAction[] => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result.map((item, index) => ({ ...item, order: index }));
};

const ScenarioBuilder: React.FC<ScenarioBuilderProps> = ({ actions, onChange, onRemove }) => {
  const [newType, setNewType] = useState<ActionType>('GetFeed');
  const availableTypes = useMemo<ActionType[]>(() => ['GetFeed', 'LikeCast', 'RecastCast', 'PinMiniApp', 'Delay', 'JoinChannel', 'CreateRecordGame'], []);

  const handleDragEnd = useCallback((result: DropResult): void => {
    if (!result.destination) return;
    const updated = reorder(actions, result.source.index, result.destination.index);
    onChange(updated);
  }, [actions, onChange]);

  const handleAddAction = (): void => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextOrder = actions.length;
    const defaultConfig: Record<string, unknown> = newType === 'Delay' ? { durationMs: 5000 } : {};
    onChange([...actions, { id, type: newType, order: nextOrder, config: defaultConfig }]);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="actions">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
            <div className="flex items-end justify-between gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3">
              <div className="flex flex-1 items-end gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <label htmlFor="new-action-type" className="text-sm text-gray-700">Add Action</label>
                  <select
                    id="new-action-type"
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
            {actions.map((action, index) => (
              <Draggable key={action.id} draggableId={action.id} index={index}>
                {(dragProvided, snapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    className={`rounded-lg border ${snapshot.isDragging ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-white'} shadow-sm`}
                  >
                    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span {...dragProvided.dragHandleProps} aria-label="Drag handle" className="cursor-grab select-none rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700" tabIndex={0}>≡</span>
                        <select
                          aria-label="Action type"
                          className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                          value={action.type}
                          onChange={(e) => {
                            const nextType = e.target.value as ActionType;
                            const nextConfig: Record<string, unknown> = nextType === 'Delay' ? { durationMs: 5000 } : {};
                            onChange(actions.map((a) => a.id === action.id ? { ...a, type: nextType, config: nextConfig } : a));
                          }}
                        >
                          {availableTypes.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => { onRemove ? onRemove(action.id) : onChange(actions.filter((a) => a.id !== action.id).map((a, i) => ({ ...a, order: i }))); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { onRemove ? onRemove(action.id) : onChange(actions.filter((a) => a.id !== action.id).map((a, i) => ({ ...a, order: i }))); } }}
                        tabIndex={0}
                        aria-label={'Remove ' + action.type}
                        className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="px-4 py-3">
                      {action.type === 'Delay' ? (
                        <div className="flex max-w-xs items-center gap-2">
                          <label htmlFor={`delay-${action.id}`} className="text-sm text-gray-700">Delay (ms)</label>
                          <input
                            id={`delay-${action.id}`}
                            type="number"
                            className="block w-32 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                            value={typeof action.config?.durationMs === 'number' ? action.config.durationMs as number : 5000}
                            onChange={(e) => {
                              const value = Number.parseInt(e.target.value, 10);
                              const updated = actions.map((a) => a.id === action.id ? { ...a, config: { ...a.config, durationMs: Number.isFinite(value) ? value : 0 } } : a);
                              onChange(updated);
                            }}
                          />
                        </div>
                      ) : null}
                      {action.type === 'LikeCast' || action.type === 'RecastCast' ? (
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
                                    const updated = actions.map((a) => a.id === action.id ? { ...a, config: { ...a.config, likeMethod: 'random' } } : a);
                                    onChange(updated);
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
                                    const updated = actions.map((a) => a.id === action.id ? { ...a, config: { ...a.config, likeMethod: 'url', castUrl: '' } } : a);
                                    onChange(updated);
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
                                  const updated = actions.map((a) => a.id === action.id ? { ...a, config: { ...a.config, castUrl: e.target.value } } : a);
                                  onChange(updated);
                                }}
                              />
                              <p className="text-xs text-gray-500">
                                Enter the full Farcaster URL of the thread (e.g., https://farcaster.xyz/username/0x...)
                              </p>
                            </div>
                          )}
                        </div>
                      ) : null}
                      {action.type === 'JoinChannel' ? (
                        <div className="grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="flex flex-col gap-1">
                            <label htmlFor={`channel-${action.id}`} className="text-sm text-gray-700">Channel Key</label>
                            <input
                              id={`channel-${action.id}`}
                              type="text"
                              className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                              value={typeof action.config?.channelKey === 'string' ? action.config.channelKey as string : ''}
                              onChange={(e) => {
                                const updated = actions.map((a) => a.id === action.id ? { ...a, config: { ...a.config, channelKey: e.target.value } } : a);
                                onChange(updated);
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
                                const updated = actions.map((a) => a.id === action.id ? { ...a, config: { ...a.config, inviteCode: e.target.value } } : a);
                                onChange(updated);
                              }}
                            />
                          </div>
                        </div>
                      ) : null}
                      {action.type === 'PinMiniApp' ? (
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
                                const updated = actions.map((a) => a.id === action.id ? { ...a, config: { ...a.config, domain: e.target.value } } : a);
                                onChange(updated);
                              }}
                            />
                            <p className="text-xs text-gray-500">Enter the miniapp domain to pin (favorite).</p>
                          </div>
                        </div>
                      ) : null}
                      {action.type === 'CreateRecordGame' ? (
                        <div className="max-w-md">
                          <div className="flex flex-col gap-1">
                            <label htmlFor={`gameLabel-${action.id}`} className="text-sm text-gray-700">Game Label</label>
                            <GameLabelSelector
                              inputId={`gameLabel-${action.id}`}
                              value={typeof action.config?.gameLabel === 'string' ? action.config.gameLabel as string : ''}
                              onChange={(val) => {
                                const updated = actions.map((a) => a.id === action.id ? { ...a, config: { ...a.config, gameLabel: val } } : a);
                                onChange(updated);
                              }}
                            />
                            <p className="text-xs text-gray-500">Must match a privy token's game label on the account.</p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default ScenarioBuilder;



