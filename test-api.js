async function testAPI() {
  try {
    const response = await fetch('https://waitlist.fero-elibrary.shop/api/waitlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'system-test-bot@example.com',
        role: 'creator'
      })
    });
    
    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testAPI();
