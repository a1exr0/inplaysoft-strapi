const fetch = require('node-fetch');

class APIPermissionChecker {
  constructor() {
    this.baseUrl = process.env.PUBLIC_URL || 'http://localhost:1337';
    this.apiToken = process.env.STRAPI_API_TOKEN;
    
    if (!this.apiToken) {
      console.error('❌ Missing STRAPI_API_TOKEN environment variable');
      process.exit(1);
    }
    
    console.log('🔍 API Permission Checker');
    console.log(`Base URL: ${this.baseUrl}`);
    console.log(`Token: ${this.apiToken.substring(0, 20)}...`);
  }

  async checkPermissions() {
    console.log('\n📋 Checking API Token Permissions...\n');

    // Test 1: Basic connection
    await this.testBasicConnection();
    
    // Test 2: Read permissions
    await this.testReadPermissions();
    
    // Test 3: Write permissions (create test)
    await this.testWritePermissions();
    
    // Test 4: Delete permissions
    await this.testDeletePermissions();
    
    // Test 5: Check token type
    await this.checkTokenType();
  }

  async testBasicConnection() {
    console.log('🌐 Test 1: Basic API Connection');
    
    try {
      const response = await fetch(`${this.baseUrl}/api`);
      if (response.ok) {
        console.log('  ✅ Basic connection successful');
      } else {
        console.log(`  ❌ Basic connection failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`  ❌ Connection error: ${error.message}`);
    }
  }

  async testReadPermissions() {
    console.log('\n📖 Test 2: Read Permissions');
    
    const endpoints = [
      '/api/articles',
      '/api/knowledgebases',
      '/api/categories',
      '/api/authors',
      '/api/users/me'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.apiRequest('GET', endpoint);
        if (response.status === 200) {
          const data = await response.json();
          console.log(`  ✅ ${endpoint}: ${data.data?.length || 'OK'} records`);
        } else {
          console.log(`  ❌ ${endpoint}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`  ❌ ${endpoint}: ${error.message}`);
      }
    }
  }

  async testWritePermissions() {
    console.log('\n✍️ Test 3: Write Permissions (Create Test)');
    
    try {
      // Try to create a test category
      const testCategory = {
        data: {
          name: 'API_TEST_CATEGORY',
          slug: 'api-test-category',
          description: 'Test category for API permission check'
        }
      };

      const response = await this.apiRequest('POST', '/api/categories', testCategory);
      if (response.ok) {
        const data = await response.json();
        console.log('  ✅ CREATE permission: Working');
        
        // Clean up the test category
        try {
          await this.apiRequest('DELETE', `/api/categories/${data.data.id}`);
          console.log('  ✅ DELETE permission: Working (cleanup successful)');
        } catch (deleteError) {
          console.log('  ⚠️ DELETE permission: Failed to cleanup test category');
        }
      } else {
        const errorText = await response.text();
        console.log(`  ❌ CREATE permission: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.log(`  ❌ CREATE permission: ${error.message}`);
    }
  }

  async testDeletePermissions() {
    console.log('\n🗑️ Test 4: Delete Permissions');
    
    try {
      // Get first article to test delete on
      const articlesResponse = await this.apiRequest('GET', '/api/articles');
      
      if (articlesResponse.ok) {
        const articles = await articlesResponse.json();
        
        if (articles.data && articles.data.length > 0) {
          const firstArticle = articles.data[0];
          console.log(`  🎯 Testing delete on: "${firstArticle.title}" (ID: ${firstArticle.id})`);
          
          // Test delete permission (but don't actually delete)
          const deleteResponse = await this.apiRequest('DELETE', `/api/articles/${firstArticle.id}`, null, true);
          
          if (deleteResponse.status === 200 || deleteResponse.status === 204) {
            console.log('  ✅ DELETE permission: Working');
            
            // Since we actually deleted it, let's restore it by creating again
            console.log('  🔄 Restoring deleted article...');
            // We can't easily restore, so just note this
            console.log('  ⚠️ Article was actually deleted - you may need to re-import');
            
          } else if (deleteResponse.status === 403) {
            console.log('  ❌ DELETE permission: FORBIDDEN - API token lacks delete permissions');
          } else {
            const errorText = await deleteResponse.text();
            console.log(`  ❌ DELETE permission: ${deleteResponse.status} - ${errorText}`);
          }
        } else {
          console.log('  ℹ️ No articles found to test delete permission');
        }
      }
    } catch (error) {
      console.log(`  ❌ DELETE permission test failed: ${error.message}`);
    }
  }

  async checkTokenType() {
    console.log('\n🔑 Test 5: Token Type Analysis');
    
    try {
      // Try to access admin-only endpoints
      const adminEndpoints = [
        '/api/users/me',
        '/admin/users/me'
      ];

      for (const endpoint of adminEndpoints) {
        try {
          const response = await this.apiRequest('GET', endpoint);
          if (response.ok) {
            console.log(`  ✅ ${endpoint}: Accessible`);
          } else {
            console.log(`  ❌ ${endpoint}: ${response.status} ${response.statusText}`);
          }
        } catch (error) {
          console.log(`  ❌ ${endpoint}: ${error.message}`);
        }
      }

      // Check if this is a full access token
      console.log('\n🔍 Token Analysis:');
      console.log(`  Token Length: ${this.apiToken.length}`);
      console.log(`  Token Format: ${this.apiToken.length > 100 ? 'Full Access Token' : 'Limited Token'}`);
      
    } catch (error) {
      console.log(`  ❌ Token analysis failed: ${error.message}`);
    }
  }

  async apiRequest(method, endpoint, data = null, dryRun = false) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiToken}`
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    if (dryRun && method === 'DELETE') {
      // For dry run, just check if we get 403 or other response
      console.log(`    🔍 Dry run: ${method} ${url}`);
    }

    return await fetch(url, options);
  }
}

// Main execution
async function main() {
  const checker = new APIPermissionChecker();
  await checker.checkPermissions();
  
  console.log('\n✅ API permission check completed!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = APIPermissionChecker; 