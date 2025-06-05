const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:1337';
const API_ENDPOINT = '/api/articles?populate=*'; // Test with articles and populate related data

async function testCache() {
  console.log('🧪 Testing Strapi Cache Performance...\n');

  // Function to measure response time
  async function makeRequest(requestNumber) {
    const startTime = Date.now();
    try {
      const response = await fetch(`${BASE_URL}${API_ENDPOINT}`);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Request ${requestNumber}: ${responseTime}ms - Status: ${response.status}`);
        
        // Check for cache headers
        const cacheControl = response.headers.get('cache-control');
        const etag = response.headers.get('etag');
        const lastModified = response.headers.get('last-modified');
        
        if (cacheControl || etag || lastModified) {
          console.log(`  Cache headers found - Cache-Control: ${cacheControl}, ETag: ${etag}`);
        }
        
        return { responseTime, status: response.status, itemCount: data.data?.length || 0 };
      } else {
        console.log(`Request ${requestNumber}: ERROR - Status: ${response.status}`);
        return { responseTime, status: response.status, error: true };
      }
    } catch (error) {
      console.log(`Request ${requestNumber}: ERROR - ${error.message}`);
      return { responseTime: Date.now() - startTime, error: true };
    }
  }

  // Make multiple requests to test caching
  const results = [];
  const numberOfRequests = 5;

  for (let i = 1; i <= numberOfRequests; i++) {
    const result = await makeRequest(i);
    results.push(result);
    
    // Small delay between requests
    if (i < numberOfRequests) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Analyze results
  console.log('\n📊 Cache Performance Analysis:');
  console.log('=====================================');
  
  const successfulRequests = results.filter(r => !r.error);
  if (successfulRequests.length > 0) {
    const avgResponseTime = successfulRequests.reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests.length;
    const firstRequestTime = successfulRequests[0]?.responseTime;
    const subsequentRequests = successfulRequests.slice(1);
    const avgSubsequentTime = subsequentRequests.length > 0 
      ? subsequentRequests.reduce((sum, r) => sum + r.responseTime, 0) / subsequentRequests.length 
      : 0;

    console.log(`First request: ${firstRequestTime}ms`);
    console.log(`Subsequent requests average: ${avgSubsequentTime.toFixed(2)}ms`);
    console.log(`Overall average: ${avgResponseTime.toFixed(2)}ms`);
    
    if (subsequentRequests.length > 0 && avgSubsequentTime < firstRequestTime * 0.8) {
      console.log('✅ Cache appears to be working! Subsequent requests are significantly faster.');
    } else if (subsequentRequests.length > 0) {
      console.log('⚠️  Cache might not be working optimally. Response times are similar.');
    }
  }

  console.log('\n💡 Tips to verify cache is working:');
  console.log('1. Check your Strapi console for cache debug messages');
  console.log('2. Look for cache-related headers in response');
  console.log('3. Subsequent requests should be faster than the first one');
  console.log('4. Check browser Network tab for cache status');
}

// Run the test
testCache().catch(console.error); 