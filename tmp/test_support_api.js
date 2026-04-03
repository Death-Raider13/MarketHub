const http = require('http');

async function testApi() {
  console.log('--- Testing Support System APIs ---');
  
  // Note: This script is a placeholder since we can't easily generate a valid Firebase ID token here.
  // In a real environment, we would use a test user token.
  
  const endpoints = [
    { path: '/api/support/my-tickets', method: 'GET' },
    { path: '/api/support/my-tickets/test-id', method: 'GET' }
  ];

  for (const endpoint of endpoints) {
    console.log(`Checking ${endpoint.method} ${endpoint.path}...`);
    // Expected result: 401 Unauthorized because no Bearer token is provided
    try {
      const res = await new Promise((resolve) => {
        const req = http.request({
          hostname: 'localhost',
          port: 3000,
          path: endpoint.path,
          method: endpoint.method,
        }, (response) => {
          let data = '';
          response.on('data', (chunk) => data += chunk);
          response.on('end', () => resolve({ status: response.statusCode, data }));
        });
        req.on('error', (e) => resolve({ error: e }));
        req.end();
      });

      if (res.status === 401) {
        console.log(`✅ ${endpoint.path} correctly returned 401 (Unauthorized) for unauthenticated request.`);
      } else {
        console.log(`❌ ${endpoint.path} returned ${res.status}. Expected 401.`);
      }
    } catch (e) {
      console.log(`⚠️ Could not reach local server: ${e.message}`);
    }
  }
}

testApi();
