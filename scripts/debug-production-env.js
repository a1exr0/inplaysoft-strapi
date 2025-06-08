require('dotenv').config();

console.log('🔍 Debugging Production Environment Variables\n');

console.log('Environment variables check:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`STRAPI_API_TOKEN exists: ${!!process.env.STRAPI_API_TOKEN}`);
console.log(`STRAPI_API_TOKEN length: ${process.env.STRAPI_API_TOKEN?.length || 0}`);
console.log(`API Token first 20 chars: ${process.env.STRAPI_API_TOKEN?.substring(0, 20) || 'NOT_FOUND'}...`);
console.log(`PUBLIC_URL: ${process.env.PUBLIC_URL || 'NOT_SET'}`);

// Check if running under PM2
console.log(`\nPM2 Detection:`);
console.log(`PM2_HOME: ${process.env.PM2_HOME || 'NOT_SET'}`);
console.log(`PM2_INSTANCE_ID: ${process.env.PM2_INSTANCE_ID || 'NOT_SET'}`);

// Test API connection
async function testConnection() {
  console.log('\n🌐 Testing API Connection...');
  
  const baseUrl = process.env.PUBLIC_URL || 'http://localhost:1337';
  const apiToken = process.env.STRAPI_API_TOKEN;
  
  if (!apiToken) {
    console.log('❌ No API token found - cannot test connection');
    return;
  }
  
  try {
    const response = await fetch(`${baseUrl}/api/articles`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API connection successful - found ${data.data?.length || 0} articles`);
    } else {
      const error = await response.text();
      console.log(`❌ API connection failed: ${error}`);
    }
    
  } catch (error) {
    console.log(`❌ Connection error: ${error.message}`);
  }
}

testConnection().catch(console.error); 