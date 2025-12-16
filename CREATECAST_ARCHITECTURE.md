# CreateCast Action - Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FARCASTER NETWORK                         │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Farcaster API (client.farcaster.xyz)                      │ │
│  │  ├─ POST /v2/casts (Create Cast)                           │ │
│  │  ├─ POST /v1/generate-image-upload-url (Media Upload)      │ │
│  │  └─ PUT /upload-url (Media Upload)                         │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ HTTPS
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (NestJS)                            │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ScriptController                                          │ │
│  │  ├─ POST /scripts/execute                                  │ │
│  │  └─ POST /scripts/execute-multiple                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                              ▼                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ScriptExecutionService                                    │ │
│  │  ├─ executeScript()                                        │ │
│  │  └─ executeScriptOnMultipleAccounts()                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                              ▼                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ActionProcessor (Bull Queue)                              │ │
│  │  ├─ processAction()                                        │ │
│  │  ├─ case 'CreateCast': {...}                               │ │
│  │  └─ Handles all action types                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                              ▼                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  FarcasterService                                          │ │
│  │  ├─ createCast(token, text, embeds)                        │ │
│  │  ├─ likeCast()                                             │ │
│  │  ├─ recastCast()                                           │ │
│  │  └─ Other Farcaster operations                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                              ▼                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  LoggingService                                            │ │
│  │  ├─ createLog() - Store action results                     │ │
│  │  └─ MongoDB Logs Collection                                │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ HTTP/REST
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Script Builder (React Component)                          │ │
│  │  ├─ ScriptBuilder                                          │ │
│  │  ├─ CreateCast UI Configuration                            │ │
│  │  └─ Action Status Display                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                              ▼                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  API Routes (Next.js)                                      │ │
│  │  ├─ POST /api/scripts/execute                              │ │
│  │  ├─ POST /api/scripts/create-cast                          │ │
│  │  └─ POST /api/scripts/execute-multiple                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                              ▼                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Utility Functions                                         │ │
│  │  ├─ parseEmbedUrls()                                       │ │
│  │  ├─ prepareCreateCastPayload()                             │ │
│  │  ├─ executeCreateCast()                                    │ │
│  │  └─ validateCreateCastConfig()                             │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Request/Response Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. USER INTERACTION (Frontend)                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  User navigates to /scripts                                      │
│         ↓                                                         │
│  Creates new script                                              │
│         ↓                                                         │
│  Adds CreateCast action                                          │
│         ↓                                                         │
│  Configures:                                                     │
│    - Text: "Hello Farcaster!"                                    │
│    - Embeds: https://example.com/image.png                       │
│         ↓                                                         │
│  Selects accounts                                                │
│         ↓                                                         │
│  Clicks "Execute Script"                                         │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND PROCESSING                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  validateCreateCastConfig()                                      │
│    ├─ Check text not empty                                       │
│    ├─ Check text length ≤ 300                                    │
│    ├─ Check embed count ≤ 4                                      │
│    └─ Validate URL format                                        │
│         ↓                                                         │
│  prepareCreateCastPayload()                                      │
│    ├─ Parse embed URLs from textarea                             │
│    ├─ Filter empty lines                                         │
│    └─ Create payload object                                      │
│         ↓                                                         │
│  POST /api/scripts/execute                                       │
│    {                                                             │
│      "accountId": "...",                                         │
│      "actions": [{                                               │
│        "type": "CreateCast",                                     │
│        "config": {                                               │
│          "text": "Hello Farcaster!",                             │
│          "embedUrls": "https://example.com/image.png"            │
│        }                                                         │
│      }]                                                          │
│    }                                                             │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 3. BACKEND ROUTING                                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ScriptController.executeScript()                                │
│    ├─ Validate request body                                      │
│    ├─ Extract accountId and actions                              │
│    └─ Call ScriptExecutionService                                │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 4. SCRIPT EXECUTION                                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ScriptExecutionService.executeScript()                          │
│    ├─ Find account by ID                                         │
│    ├─ For each action in script:                                 │
│    │   ├─ Create job in Bull queue                               │
│    │   ├─ Wait for job completion                                │
│    │   └─ Collect results                                        │
│    └─ Return aggregated results                                  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 5. ACTION PROCESSING (Bull Queue)                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ActionProcessor.processAction()                                 │
│    ├─ Extract action type and config                             │
│    ├─ Switch on action type                                      │
│    │   ├─ case 'CreateCast':                                     │
│    │   │   ├─ Extract text and embedUrls                         │
│    │   │   ├─ Parse URLs from embedUrls string                   │
│    │   │   ├─ Validate URLs                                      │
│    │   │   ├─ Call FarcasterService.createCast()                 │
│    │   │   └─ Store result                                       │
│    │   └─ case ...: (other actions)                              │
│    ├─ Log result to database                                     │
│    └─ Return result                                              │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 6. FARCASTER API CALL                                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  FarcasterService.createCast()                                   │
│    ├─ Decrypt token                                              │
│    ├─ Enforce rate limit (5 req/sec)                             │
│    ├─ Validate input:                                            │
│    │   ├─ Text required and ≤ 320 chars                          │
│    │   └─ Embeds ≤ 4                                             │
│    ├─ Build payload:                                             │
│    │   {                                                         │
│    │     "text": "Hello Farcaster!",                             │
│    │     "embeds": [                                             │
│    │       {"url": "https://example.com/image.png"}              │
│    │     ]                                                       │
│    │   }                                                         │
│    ├─ Execute with retry:                                        │
│    │   ├─ POST https://client.farcaster.xyz/v2/casts             │
│    │   ├─ Authorization: Bearer {token}                          │
│    │   ├─ Retry up to 3 times on failure                         │
│    │   └─ Exponential backoff (300ms → 600ms → 1200ms)           │
│    └─ Return response                                            │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 7. FARCASTER RESPONSE                                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Success Response:                                               │
│  {                                                               │
│    "cast": {                                                     │
│      "hash": "0x...",                                            │
│      "text": "Hello Farcaster!",                                 │
│      "embeds": [{"url": "https://example.com/image.png"}],       │
│      "timestamp": 1702742400                                     │
│    }                                                             │
│  }                                                               │
│                                                                   │
│  OR                                                              │
│                                                                   │
│  Error Response:                                                 │
│  {                                                               │
│    "error": "Invalid request",                                   │
│    "message": "..."                                              │
│  }                                                               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 8. LOGGING                                                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  LoggingService.createLog()                                      │
│    ├─ Store in MongoDB:                                          │
│    │   {                                                         │
│    │     "accountId": "...",                                     │
│    │     "scenarioId": "...",                                    │
│    │     "actionType": "CreateCast",                             │
│    │     "status": "SUCCESS",                                    │
│    │     "result": {...},                                        │
│    │     "timestamp": "..."                                      │
│    │   }                                                         │
│    └─ Log to console                                             │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 9. RESPONSE TO FRONTEND                                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Return to ScriptExecutionService                                │
│    ↓                                                              │
│  Return to ScriptController                                      │
│    ↓                                                              │
│  Return to Frontend API Route                                    │
│    ↓                                                              │
│  Response:                                                       │
│  {                                                               │
│    "accountId": "...",                                           │
│    "actionsExecuted": 1,                                         │
│    "loopsExecuted": 1,                                           │
│    "results": [{                                                 │
│      "actionType": "CreateCast",                                 │
│      "success": true,                                            │
│      "result": {...}                                             │
│    }]                                                            │
│  }                                                               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 10. FRONTEND DISPLAY                                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Update ActionStatusCard                                         │
│    ├─ Display success/failure                                    │
│    ├─ Show cast details                                          │
│    ├─ Display any errors                                         │
│    └─ Update UI with results                                     │
│                                                                   │
│  User sees:                                                      │
│    ✅ CreateCast - Success                                       │
│       Cast created: "Hello Farcaster!"                           │
│       Embeds: 1 image                                            │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INPUT (Frontend)                         │
│                                                                   │
│  Cast Text:        "Hello Farcaster!"                            │
│  Embed URLs:       "https://example.com/image.png"               │
│  Upload Method:    "imagedelivery"                               │
│  Media Files:      (optional)                                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    VALIDATION LAYER
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  PARSED & VALIDATED DATA                         │
│                                                                   │
│  text:             "Hello Farcaster!"                            │
│  embedUrls:        ["https://example.com/image.png"]             │
│  uploadMethod:     "imagedelivery"                               │
│  mediaFiles:       []                                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    PAYLOAD PREPARATION
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              FARCASTER API PAYLOAD                               │
│                                                                   │
│  {                                                               │
│    "text": "Hello Farcaster!",                                   │
│    "embeds": [                                                   │
│      {                                                           │
│        "url": "https://example.com/image.png"                    │
│      }                                                           │
│    ]                                                             │
│  }                                                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    FARCASTER API CALL
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              FARCASTER API RESPONSE                              │
│                                                                   │
│  {                                                               │
│    "cast": {                                                     │
│      "hash": "0xabcd1234...",                                    │
│      "text": "Hello Farcaster!",                                 │
│      "embeds": [                                                 │
│        {                                                         │
│          "url": "https://example.com/image.png"                  │
│        }                                                         │
│      ],                                                          │
│      "timestamp": 1702742400,                                    │
│      "author": {                                                 │
│        "fid": 12345,                                             │
│        "username": "user"                                        │
│      }                                                           │
│    }                                                             │
│  }                                                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    LOGGING & STORAGE
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              MONGODB LOG ENTRY                                   │
│                                                                   │
│  {                                                               │
│    "_id": ObjectId("..."),                                       │
│    "accountId": ObjectId("..."),                                 │
│    "scenarioId": ObjectId("..."),                                │
│    "actionType": "CreateCast",                                   │
│    "status": "SUCCESS",                                          │
│    "result": {                                                   │
│      "cast": {...}                                               │
│    },                                                            │
│    "createdAt": ISODate("2025-12-16T..."),                       │
│    "updatedAt": ISODate("2025-12-16T...")                        │
│  }                                                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    RESPONSE TO FRONTEND
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND DISPLAY                                    │
│                                                                   │
│  ✅ CreateCast - Success                                         │
│     Cast Hash: 0xabcd1234...                                     │
│     Text: Hello Farcaster!                                       │
│     Embeds: 1 image                                              │
│     Timestamp: 2025-12-16 10:00:00                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    USER INPUT                                    │
└──────────────────────────────────────────────────────────────────┘
                              ↓
                    FRONTEND VALIDATION
                              ↓
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
    VALID                                      INVALID
        │                                           │
        │                                    ┌──────────────┐
        │                                    │ Show Error   │
        │                                    │ Message      │
        │                                    │              │
        │                                    │ "Cast text   │
        │                                    │ is required" │
        │                                    └──────────────┘
        │                                           │
        │                                           ▼
        │                                    User corrects
        │                                    input
        │                                           │
        │                                           ↓
        │                                    Retry validation
        │
        ▼
    SEND TO BACKEND
        │
        ▼
    BACKEND VALIDATION
        │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
    VALID                                      INVALID
        │                                           │
        │                                    ┌──────────────┐
        │                                    │ Log Error    │
        │                                    │ Return Error │
        │                                    │ Response     │
        │                                    └──────────────┘
        │                                           │
        │                                           ▼
        │                                    FRONTEND ERROR
        │                                    DISPLAY
        │                                           │
        │                                           ▼
        │                                    Show error in
        │                                    action status
        │
        ▼
    CALL FARCASTER API
        │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
    SUCCESS                                    FAILURE
        │                                           │
        │                                    ┌──────────────┐
        │                                    │ Retry Logic  │
        │                                    │              │
        │                                    │ Attempt 1    │
        │                                    │ Attempt 2    │
        │                                    │ Attempt 3    │
        │                                    │              │
        │                                    │ If all fail:  │
        │                                    │ Return error  │
        │                                    └──────────────┘
        │                                           │
        │                                           ▼
        ▼                                    FRONTEND ERROR
    LOG SUCCESS                               DISPLAY
        │                                           │
        ▼                                           ▼
    RETURN RESULT                           User sees error
        │                                   and can retry
        ▼
    FRONTEND SUCCESS
    DISPLAY
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCRIPT BUILDER PAGE                           │
│  (app/scripts/page.tsx)                                          │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Script List                                              │  │
│  │  ├─ Select script                                         │  │
│  │  └─ Delete script                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  SCRIPT BUILDER (script-builder.tsx)                      │  │
│  │                                                            │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ Add Action Section                                  │  │  │
│  │  │ ├─ Action Type Dropdown                             │  │  │
│  │  │ │  └─ "CreateCast" ← NEW                            │  │  │
│  │  │ └─ Add Button                                       │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ Actions List                                        │  │  │
│  │  │ ├─ Action Item                                      │  │  │
│  │  │ │  ├─ Type Selector                                 │  │  │
│  │  │ │  ├─ Config Section                                │  │  │
│  │  │ │  │  ├─ Cast Text (textarea)                       │  │  │
│  │  │ │  │  ├─ Embed URLs (textarea)                      │  │  │
│  │  │ │  │  ├─ Media Files (file input)                   │  │  │
│  │  │ │  │  └─ Upload Method (select)                     │  │  │
│  │  │ │  └─ Remove Button                                 │  │  │
│  │  │ └─ Action Item                                      │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ Save Button                                         │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Account Selector (account-selector.tsx)                 │  │
│  │  ├─ Account List                                         │  │
│  │  └─ Multi-select Checkboxes                              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Execute Button                                          │  │
│  │  └─ Triggers script execution                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                    │
└──────────────────────────────┼────────────────────────────────────┘
                              │
                              ▼
                    POST /api/scripts/execute
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ACTION STATUS CARD                            │
│  (action-status-card.tsx)                                        │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Progress Bar                                             │  │
│  │  ├─ Current Account: 1/3                                  │  │
│  │  └─ Current Action: 1/5                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Action Results                                           │  │
│  │  ├─ CreateCast                                            │  │
│  │  │  ├─ Status: ✅ Success                                 │  │
│  │  │  ├─ Result: Cast created                               │  │
│  │  │  └─ Details: {...}                                     │  │
│  │  └─ Other Actions                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Close Button                                             │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## State Management Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    SCRIPT BUILDER STATE                           │
│  (React Hooks)                                                    │
│                                                                   │
│  const [actions, setActions] = useState<ScriptAction[]>          │
│  const [newType, setNewType] = useState<ActionType>              │
│  const [isSaving, setIsSaving] = useState<boolean>               │
│  const [saveMessage, setSaveMessage] = useState<string | null>   │
│  const [loop, setLoop] = useState<number>                        │
│  const [shuffle, setShuffle] = useState<boolean>                 │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
                    USER INTERACTION
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                    EVENT HANDLERS                                 │
│                                                                   │
│  handleAddAction()                                               │
│    └─ setActions([...actions, newAction])                        │
│                                                                   │
│  handleUpdateAction(id, updates)                                 │
│    └─ setActions(actions.map(a => a.id === id ? {...} : a))     │
│                                                                   │
│  handleRemoveAction(id)                                          │
│    └─ setActions(actions.filter(a => a.id !== id))              │
│                                                                   │
│  handleSave()                                                    │
│    ├─ setIsSaving(true)                                          │
│    ├─ Call onSave(updatedScript)                                 │
│    ├─ setSaveMessage("Script saved successfully!")               │
│    └─ setIsSaving(false)                                         │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
                    STATE UPDATES
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                    COMPONENT RE-RENDER                            │
│                                                                   │
│  Script Builder displays:                                        │
│    ├─ Actions list with current state                            │
│    ├─ Add action form                                            │
│    ├─ Loop and shuffle controls                                  │
│    ├─ Save button                                                │
│    └─ Save message (if any)                                      │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
                    USER SEES UPDATES
```

## Database Schema

```
┌──────────────────────────────────────────────────────────────────┐
│                    LOGS COLLECTION                                │
│  (MongoDB)                                                        │
│                                                                   │
│  {                                                               │
│    "_id": ObjectId("..."),                                       │
│    "accountId": ObjectId("..."),                                 │
│    "scenarioId": ObjectId("..."),                                │
│    "actionType": "CreateCast",                                   │
│    "status": "SUCCESS" | "FAILURE",                              │
│    "result": {                                                   │
│      "cast": {                                                   │
│        "hash": "0x...",                                          │
│        "text": "Hello Farcaster!",                               │
│        "embeds": [{"url": "..."}],                               │
│        "timestamp": 1702742400                                   │
│      }                                                           │
│    },                                                            │
│    "error": "Error message (if failed)",                         │
│    "createdAt": ISODate("2025-12-16T10:00:00Z"),                 │
│    "updatedAt": ISODate("2025-12-16T10:00:00Z")                  │
│  }                                                               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

**Last Updated**: December 16, 2025  
**Version**: 1.0.0

