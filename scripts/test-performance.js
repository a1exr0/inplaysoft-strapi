#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:1337/api';

// Performance test configuration
const tests = [
  {
    name: 'Articles List (Default)',
    url: `${API_BASE}/articles`,
    expectedTime: 100 // ms
  },
  {
    name: 'Articles List (with Population)',
    url: `${API_BASE}/articles?populate=*`,
    expectedTime: 150 // ms
  },
  {
    name: 'Articles List (Paginated)',
    url: `${API_BASE}/articles?pagination[pageSize]=10&pagination[page]=1`,
    expectedTime: 80 // ms
  },
  {
    name: 'Categories List',
    url: `${API_BASE}/categories`,
    expectedTime: 50 // ms
  },
  {
    name: 'Authors List',
    url: `${API_BASE}/authors`,
    expectedTime: 50 // ms
  },
  {
    name: 'Single Article by ID',
    url: `${API_BASE}/articles/1`,
    expectedTime: 50 // ms
  }
];

async function measurePerformance(test) {
  const iterations = 5;
  const times = [];
  
  console.log(`\n🧪 Testing: ${test.name}`);
  console.log(`   URL: ${test.url}`);
  
  for (let i = 0; i < iterations; i++) {
    try {
      const startTime = Date.now();
      const response = await axios.get(test.url);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      times.push(responseTime);
      
      if (i === 0) {
        console.log(`   Status: ${response.status}`);
        console.log(`   Data count: ${Array.isArray(response.data.data) ? response.data.data.length : 1}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      return null;
    }
  }
  
  const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  const status = avgTime <= test.expectedTime ? '✅' : '⚠️';
  
  console.log(`   ${status} Average: ${avgTime}ms (min: ${minTime}ms, max: ${maxTime}ms)`);
  console.log(`   Expected: ≤${test.expectedTime}ms`);
  
  return {
    name: test.name,
    avgTime,
    minTime,
    maxTime,
    expectedTime: test.expectedTime,
    passed: avgTime <= test.expectedTime
  };
}

async function waitForStrapi() {
  console.log('🔍 Waiting for Strapi to be ready...');
  
  for (let i = 0; i < 30; i++) {
    try {
      await axios.get(`${API_BASE}/articles`);
      console.log('✅ Strapi is ready!\n');
      return true;
    } catch (error) {
      if (i < 29) {
        process.stdout.write('.');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  console.log('\n❌ Strapi is not responding after 30 seconds');
  return false;
}

async function runPerformanceTests() {
  console.log('🚀 Strapi Performance Testing Tool\n');
  console.log('This tool tests API response times after database optimization.');
  
  // Wait for Strapi to be ready
  const isReady = await waitForStrapi();
  if (!isReady) {
    process.exit(1);
  }
  
  const results = [];
  
  // Run all tests
  for (const test of tests) {
    const result = await measurePerformance(test);
    if (result) {
      results.push(result);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n📊 Performance Test Summary:');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '⚠️  SLOW';
    const improvement = result.expectedTime > result.avgTime 
      ? ` (${Math.round(((result.expectedTime - result.avgTime) / result.expectedTime) * 100)}% better than expected)`
      : '';
    
    console.log(`${status} ${result.name}: ${result.avgTime}ms${improvement}`);
  });
  
  console.log('='.repeat(60));
  console.log(`📈 Overall Score: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 Excellent! All performance targets met.');
    console.log('   Your database optimizations are working perfectly!');
  } else if (passed >= total * 0.8) {
    console.log('👍 Good! Most performance targets met.');
    console.log('   Consider additional optimizations for remaining slow queries.');
  } else {
    console.log('⚠️  Some performance issues detected.');
    console.log('   Review slow queries and consider additional database tuning.');
  }
  
  console.log('\n💡 Performance Tips:');
  console.log('   • Use pagination for large datasets');
  console.log('   • Populate only necessary relations');
  console.log('   • Consider caching for frequently accessed data');
  console.log('   • Monitor database query performance regularly');
  
  console.log('\n📝 Next Steps:');
  console.log('   • Monitor real-world usage patterns');
  console.log('   • Set up continuous performance monitoring');
  console.log('   • Consider implementing Redis caching for production');
}

// Run the tests
runPerformanceTests().catch(console.error); 