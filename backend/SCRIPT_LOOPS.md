# Script Loops Feature

This document describes the loop functionality added to scripts, allowing users to execute script actions multiple times with optional shuffling.

## Overview

Scripts now support two new configuration options:
- **Loop Count**: Number of times to execute the entire script
- **Shuffle**: Randomize the order of actions on each loop iteration

## Backend Implementation

### Schema Changes

**New Script Schema** (`script.schema.ts`):
```typescript
@Schema()
export class Script {
  @Prop({ required: true })
  name: string;

  @Prop({ type: [ScriptActionSchema] })
  actions: ScriptAction[];

  @Prop({ default: false })
  shuffle: boolean;

  @Prop({ default: 1 })
  loop: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}
```

### Service Updates

**ScriptExecutionService** now accepts `ScriptExecutionOptions`:
```typescript
export interface ScriptExecutionOptions {
  loop?: number;
  shuffle?: boolean;
}

async executeScript(
  accountId: string, 
  actions: ScriptAction[],
  options: ScriptExecutionOptions = {}
): Promise<ExecuteScriptResult>
```

### API Changes

**Script Controller** endpoints now accept options:
```typescript
@Post('execute')
async executeScript(
  @Body() body: { 
    accountId: string; 
    actions: ScriptAction[];
    options?: ScriptExecutionOptions;
  }
)
```

## Frontend Implementation

### Script Builder

The script builder now includes loop configuration UI:
- Loop count input field (minimum 1)
- Shuffle checkbox
- Real-time preview of total actions (actions × loops)

### Script Executor

The script executor component includes:
- Loop count configuration
- Shuffle toggle
- Progress tracking across multiple loops

## Usage Examples

### Basic Loop
```typescript
// Execute script 3 times
await scriptExecutionService.executeScript(accountId, actions, { loop: 3 });
```

### Loop with Shuffle
```typescript
// Execute script 2 times with randomized action order
await scriptExecutionService.executeScript(accountId, actions, { 
  loop: 2, 
  shuffle: true 
});
```

### Multiple Accounts
```typescript
// Execute script on multiple accounts with loops
await scriptExecutionService.executeScriptOnMultipleAccounts(
  accountIds, 
  actions, 
  { loop: 5, shuffle: true }
);
```

## Execution Flow

1. **Loop Iteration**: For each loop iteration (0 to loop-1)
2. **Action Shuffling**: If shuffle is enabled, randomize action order
3. **Action Execution**: Execute each action in the current order
4. **Result Tracking**: Track results with loop index for debugging

## Result Structure

```typescript
interface ExecuteScriptResult {
  accountId: string;
  actionsExecuted: number;    // Total actions executed
  loopsExecuted: number;     // Number of loops completed
  results: Array<{
    actionType: ActionType;
    success: boolean;
    result?: unknown;
    error?: string;
    loopIndex?: number;       // Which loop this result belongs to
  }>;
}
```

## Testing

Comprehensive tests are included in `script-execution.service.spec.ts`:
- Default execution (loop=1, shuffle=false)
- Custom loop counts
- Shuffle functionality
- Error handling
- Multiple account execution

## Benefits

1. **Automation**: Execute complex workflows multiple times
2. **Randomization**: Shuffle actions to simulate varied user behavior
3. **Scalability**: Run scripts across multiple accounts with loops
4. **Debugging**: Track which loop each result belongs to
5. **Flexibility**: Mix and match loop and shuffle options

## Migration

Existing scripts will continue to work with default values:
- `loop: 1` (execute once)
- `shuffle: false` (maintain action order)

No breaking changes to existing functionality.
