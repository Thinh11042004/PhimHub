const axios = require('axios');

async function testFrontendLogin() {
  try {
    console.log('🔍 Testing frontend login format...');
    
    // Test with username field (what frontend might be sending)
    console.log('\n📋 Test 1: With username field (should fail)');
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        username: 'admin',
        password: 'admin123'
      });
      console.log('❌ Unexpected success:', response.data);
    } catch (error) {
      console.log('✅ Expected failure:', error.response?.status, error.response?.data?.message);
    }
    
    // Test with identifier field (correct format)
    console.log('\n📋 Test 2: With identifier field (should succeed)');
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        identifier: 'admin',
        password: 'admin123'
      });
      console.log('✅ Success:', response.status);
      console.log('Token:', response.data.data?.token?.substring(0, 20) + '...');
    } catch (error) {
      console.log('❌ Unexpected failure:', error.response?.status, error.response?.data?.message);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testFrontendLogin();
