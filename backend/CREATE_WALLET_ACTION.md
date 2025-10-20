# CREATE_WALLET Action

## Overview
The `CREATE_WALLET` action allows you to create a new Ethereum wallet from a mnemonic seed phrase and save the wallet address to the account.

## Action Type
- **Enum**: `ActionType.CREATE_WALLET`
- **String**: `'CreateWallet'`

## Configuration
The action requires the following configuration:

```json
{
  "type": "CreateWallet",
  "config": {
    "secretPhrase": "your twelve word mnemonic phrase here"
  }
}
```

### Required Parameters
- `secretPhrase` (string): A 12-word mnemonic seed phrase used to generate the wallet

## Example Usage

### Basic Example
```json
{
  "name": "Create Wallet from Seed Phrase",
  "actions": [
    {
      "type": "CreateWallet",
      "config": {
        "secretPhrase": "melody exist churn minimum cabin begin file reopen ozone record polar sausage"
      },
      "order": 1
    }
  ],
  "shuffle": false,
  "loop": 1
}
```

### With Multiple Actions
```json
{
  "name": "Create Wallet and Update Account",
  "actions": [
    {
      "type": "CreateWallet",
      "config": {
        "secretPhrase": "melody exist churn minimum cabin begin file reopen ozone record polar sausage"
      },
      "order": 1
    },
    {
      "type": "UpdateWallet",
      "config": {},
      "order": 2
    }
  ],
  "shuffle": false,
  "loop": 1
}
```

## Response Format
When the action executes successfully, it returns:

```json
{
  "success": true,
  "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "privateKey": "0x1234567890abcdef...",
  "message": "Wallet created and saved successfully"
}
```

## What Happens
1. **Wallet Creation**: The action uses the provided mnemonic phrase to generate a new Ethereum wallet using the ethers.js library
2. **Address Generation**: A unique wallet address is derived from the mnemonic phrase
3. **Private Key Extraction**: The corresponding private key is extracted (returned in response)
4. **Account Update**: The wallet address is saved to the account record in the database
5. **Logging**: The action result is logged for tracking and debugging

## Security Notes
- The private key is returned in the response but should be handled securely
- The mnemonic phrase should be kept secure and not logged in plain text
- Consider encrypting sensitive wallet data if storing long-term

## Error Handling
The action will throw an error if:
- `secretPhrase` is missing from the configuration
- The mnemonic phrase is invalid or malformed
- The account ID is not found
- Database update fails

## Dependencies
- **ethers.js**: Used for wallet creation and cryptographic operations
- **Account Service**: For updating the account with the new wallet address
- **Logging Service**: For tracking action execution

## Integration
This action integrates with:
- Account management system
- Action processor queue
- Logging and monitoring systems
- Database persistence layer




