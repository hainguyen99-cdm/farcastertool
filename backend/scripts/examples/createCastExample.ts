#!/usr/bin/env node

/**
 * Example: Create Cast Action in Script Execution
 * 
 * This example demonstrates how to use the CREATE_CAST action
 * within a script that can be executed via the API.
 * 
 * The script shows:
 * 1. Creating a text-only cast
 * 2. Creating a cast with media URLs
 * 3. Executing multiple casts in sequence
 */

import axios from 'axios';

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const ACCOUNT_ID = process.env.ACCOUNT_ID || 'your-account-id';

/**
 * Example 1: Simple text-only cast
 */
async function example1_TextOnlyCast() {
  console.log('\n=== Example 1: Text-Only Cast ===\n');

  const payload = {
    accountId: ACCOUNT_ID,
    actions: [
      {
        type: 'CreateCast',
        config: {
          text: 'Hello Farcaster! This is my first automated cast 🚀',
        },
        order: 0,
      },
    ],
  };

  console.log('Request payload:');
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(`${BACKEND_URL}/scripts/execute`, payload);
    console.log('\nResponse:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 2: Cast with media URLs
 */
async function example2_CastWithMedia() {
  console.log('\n=== Example 2: Cast with Media ===\n');

  const payload = {
    accountId: ACCOUNT_ID,
    actions: [
      {
        type: 'CreateCast',
        config: {
          text: 'Check out this amazing image! 📸',
          mediaUrls: [
            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e60570cf-4555-438c-4463-59f997f4c300/original',
          ],
        },
        order: 0,
      },
    ],
  };

  console.log('Request payload:');
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(`${BACKEND_URL}/scripts/execute`, payload);
    console.log('\nResponse:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 3: Cast with multiple media
 */
async function example3_CastWithMultipleMedia() {
  console.log('\n=== Example 3: Cast with Multiple Media ===\n');

  const payload = {
    accountId: ACCOUNT_ID,
    actions: [
      {
        type: 'CreateCast',
        config: {
          text: 'A collection of amazing moments! 🎨',
          mediaUrls: [
            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/image1/original',
            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/image2/original',
            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/image3/original',
          ],
        },
        order: 0,
      },
    ],
  };

  console.log('Request payload:');
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(`${BACKEND_URL}/scripts/execute`, payload);
    console.log('\nResponse:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 4: Script with multiple actions including CREATE_CAST
 */
async function example4_ComplexScript() {
  console.log('\n=== Example 4: Complex Script with Multiple Actions ===\n');

  const payload = {
    accountId: ACCOUNT_ID,
    actions: [
      {
        type: 'UpdateWallet',
        config: {},
        order: 0,
      },
      {
        type: 'Delay',
        config: {
          delayMs: 2000,
        },
        order: 1,
      },
      {
        type: 'CreateCast',
        config: {
          text: 'Just updated my wallet and now posting! 💪',
        },
        order: 2,
      },
      {
        type: 'Delay',
        config: {
          delayMs: 1000,
        },
        order: 3,
      },
      {
        type: 'CreateCast',
        config: {
          text: 'Another cast after a short delay! ⏰',
          mediaUrls: [
            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/example-image/original',
          ],
        },
        order: 4,
      },
    ],
  };

  console.log('Request payload:');
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(`${BACKEND_URL}/scripts/execute`, payload);
    console.log('\nResponse:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 5: Script with loop - create multiple casts
 */
async function example5_LoopedCasts() {
  console.log('\n=== Example 5: Looped Script (Multiple Casts) ===\n');

  const payload = {
    accountId: ACCOUNT_ID,
    actions: [
      {
        type: 'CreateCast',
        config: {
          text: 'This cast will be created multiple times in a loop!',
        },
        order: 0,
      },
      {
        type: 'Delay',
        config: {
          delayMs: 1000,
        },
        order: 1,
      },
    ],
    options: {
      loop: 3, // Create 3 casts
      shuffle: false,
    },
  };

  console.log('Request payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('\nNote: This will create 3 casts with 1 second delay between each');

  try {
    const response = await axios.post(`${BACKEND_URL}/scripts/execute`, payload);
    console.log('\nResponse:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 6: Execute on multiple accounts
 */
async function example6_MultipleAccounts() {
  console.log('\n=== Example 6: Execute on Multiple Accounts ===\n');

  const payload = {
    accountIds: [
      'account-id-1',
      'account-id-2',
      'account-id-3',
    ],
    actions: [
      {
        type: 'CreateCast',
        config: {
          text: 'Broadcasting to multiple accounts! 📢',
        },
        order: 0,
      },
    ],
  };

  console.log('Request payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('\nNote: This will execute the script on 3 different accounts');

  try {
    const response = await axios.post(
      `${BACKEND_URL}/scripts/execute-multiple`,
      payload
    );
    console.log('\nResponse:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🎬 CREATE_CAST Action Examples\n');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Account ID: ${ACCOUNT_ID}\n`);

  const examples = process.argv.slice(2);

  if (examples.length === 0) {
    console.log('Available examples:');
    console.log('  1 - Text-only cast');
    console.log('  2 - Cast with single media');
    console.log('  3 - Cast with multiple media');
    console.log('  4 - Complex script with multiple actions');
    console.log('  5 - Looped script (multiple casts)');
    console.log('  6 - Multiple accounts\n');
    console.log('Usage: npx ts-node scripts/examples/createCastExample.ts <example-number>\n');
    console.log('Examples:');
    console.log('  npx ts-node scripts/examples/createCastExample.ts 1');
    console.log('  npx ts-node scripts/examples/createCastExample.ts 1 2 3');
    return;
  }

  for (const example of examples) {
    switch (example) {
      case '1':
        await example1_TextOnlyCast();
        break;
      case '2':
        await example2_CastWithMedia();
        break;
      case '3':
        await example3_CastWithMultipleMedia();
        break;
      case '4':
        await example4_ComplexScript();
        break;
      case '5':
        await example5_LoopedCasts();
        break;
      case '6':
        await example6_MultipleAccounts();
        break;
      default:
        console.log(`Unknown example: ${example}`);
    }
  }
}

main().catch(console.error);

