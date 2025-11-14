const ethers = require('ethers');
const canonicalize = require('canonicalize');
const https = require('https');

const myMnemonic = 'payment invest rent plastic hybrid oxygen strong develop brass friend outside dove';

async function run() {
  // WARNING: Example only -- do not ever hard-code your real mnemonic!
  wallet = ethers.HDNodeWallet.fromPhrase(myMnemonic);

  const currentTimestamp = Date.now(); // get the current timestamp

  const payload = canonicalize({
    method: 'generateToken',
    params: { 
      timestamp: currentTimestamp,
    },
  });

  const signedPayload = await(wallet.signMessage(payload));

  const signature = Buffer.from(ethers.getBytes(signedPayload)).toString('base64');

  const bearerToken = `eip191:${signature}`;

  // console.log(`Custody bearer token: ${bearerToken}`);

  // make an HTTP request with the bearer token
  const options = {
    hostname: 'api.farcaster.xyz',
    path: '/v2/auth',
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    }
  };

  const req = https.request(options, (res) => {

    let body = '';

    res.on('data', chunk => {
      body += chunk;
    });
  
    res.on('end', () => {
      // Parse the response body as JSON
      const json = JSON.parse(body);
  
      const appBearerToken = `${json.result.token.secret}`;

      // Log the parsed JSON
      console.log(`Application bearer token: ${appBearerToken}`);
    });

  });

  req.on('error', (error) => {
    // log any errors that occur when making the request
    console.error(`Request error: ${error.message}`);
  });

  req.write(JSON.stringify({
    method: 'generateToken',
    params: {
      timestamp: currentTimestamp,
    }
  }));

  req.end();
}

run();