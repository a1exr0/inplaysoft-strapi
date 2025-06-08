require('dotenv').config();

class CompleteCleanup {
  constructor() {
    this.baseUrl = process.env.PUBLIC_URL || 'http://localhost:1337';
    this.apiToken = process.env.STRAPI_API_TOKEN;
    
    // Add logging to show what endpoint and credentials we're using
    console.log('🔧 CLEANUP CONFIGURATION:');
    console.log(`   📡 Base URL: ${this.baseUrl}`);
    console.log(`   🔑 API Token: ${this.apiToken ? `${this.apiToken.substring(0, 10)}...${this.apiToken.substring(this.apiToken.length - 4)}` : 'NOT SET'}`);
    console.log(`   📊 Token Length: ${this.apiToken ? this.apiToken.length : 0} characters`);
    console.log('');
  }

  async performCompleteCleanup() {
    console.log('🧹 Starting Complete Cleanup of Imported Content...\n');

    try {
      // Step 1: Check current state
      await this.checkCurrentState();
      
      // Step 2: Remove all articles
      await this.removeAllArticles();
      
      // Step 3: Remove all knowledgebase entries
      await this.removeAllKnowledgebase();
      
      // Step 4: Ask about files cleanup
      await this.handleFilesCleanup();
      
      // Step 5: Verify cleanup
      await this.verifyCleanup();

      console.log('\n✅ Complete cleanup finished!');

    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  async checkCurrentState() {
    console.log('=== CURRENT STATE ===\n');

    try {
      const articles = await this.strapiRequest('GET', '/api/articles');
      const knowledgebase = await this.strapiRequest('GET', '/api/knowledgebases');
      const files = await this.strapiRequest('GET', '/api/upload/files');

      console.log(`📰 Articles found: ${articles.data?.length || 0}`);
      console.log(`📚 Knowledgebase found: ${knowledgebase.data?.length || 0}`);
      console.log(`📁 Uploaded files: ${files.length || 0}`);

      if (articles.data?.length > 0) {
        console.log('\nArticles:');
        articles.data.forEach((article, index) => {
          console.log(`  ${index + 1}. "${article.title}" (ID: ${article.id})`);
        });
      }

      if (knowledgebase.data?.length > 0) {
        console.log('\nKnowledgebase entries:');
        knowledgebase.data.slice(0, 10).forEach((kb, index) => {
          console.log(`  ${index + 1}. "${kb.title}" (ID: ${kb.id})`);
        });
        if (knowledgebase.data.length > 10) {
          console.log(`  ... and ${knowledgebase.data.length - 10} more`);
        }
      }

    } catch (error) {
      console.error('Error checking current state:', error.message);
    }

    console.log('\n' + '-'.repeat(60) + '\n');
  }

  async removeAllArticles() {
    console.log('=== REMOVING ALL ARTICLES ===\n');

    try {
      const articles = await this.strapiRequest('GET', '/api/articles');
      
      if (!articles.data || articles.data.length === 0) {
        console.log('✅ No articles to remove');
        return;
      }

      console.log(`🗑️ Removing ${articles.data.length} articles...`);

      let removedCount = 0;
      let failedCount = 0;

      for (const article of articles.data) {
        try {
          await this.strapiRequestNoResponse('DELETE', `/api/articles/${article.id}`);
          console.log(`  ✅ Removed: "${article.title}" (ID: ${article.id})`);
          removedCount++;
        } catch (error) {
          console.error(`  ❌ Failed to remove: "${article.title}" (ID: ${article.id}) - ${error.message}`);
          failedCount++;
        }
      }

      console.log(`\n📊 Articles removal summary:`);
      console.log(`  - Removed: ${removedCount}`);
      console.log(`  - Failed: ${failedCount}`);

    } catch (error) {
      console.error('Error removing articles:', error.message);
    }

    console.log('\n' + '-'.repeat(60) + '\n');
  }

  async removeAllKnowledgebase() {
    console.log('=== REMOVING ALL KNOWLEDGEBASE ENTRIES ===\n');

    try {
      const knowledgebase = await this.strapiRequest('GET', '/api/knowledgebases');
      
      if (!knowledgebase.data || knowledgebase.data.length === 0) {
        console.log('✅ No knowledgebase entries to remove');
        return;
      }

      console.log(`🗑️ Removing ${knowledgebase.data.length} knowledgebase entries...`);

      let removedCount = 0;
      let failedCount = 0;

      for (const kb of knowledgebase.data) {
        try {
          await this.strapiRequestNoResponse('DELETE', `/api/knowledgebases/${kb.id}`);
          console.log(`  ✅ Removed: "${kb.title}" (ID: ${kb.id})`);
          removedCount++;
        } catch (error) {
          console.error(`  ❌ Failed to remove: "${kb.title}" (ID: ${kb.id}) - ${error.message}`);
          failedCount++;
        }
      }

      console.log(`\n📊 Knowledgebase removal summary:`);
      console.log(`  - Removed: ${removedCount}`);
      console.log(`  - Failed: ${failedCount}`);

    } catch (error) {
      console.error('Error removing knowledgebase:', error.message);
    }

    console.log('\n' + '-'.repeat(60) + '\n');
  }

  async handleFilesCleanup() {
    console.log('=== UPLOADED FILES CLEANUP ===\n');

    try {
      const files = await this.strapiRequest('GET', '/api/upload/files');
      
      if (!files || files.length === 0) {
        console.log('✅ No uploaded files found');
        return;
      }

      console.log(`📁 Found ${files.length} uploaded files`);
      console.log('⚠️ Note: Removing all uploaded files will delete ALL images in your S3 bucket');
      console.log('🔧 For now, we\'ll leave files intact. You can manually clean S3 if needed.');
      
      // Uncomment below if you want to remove files too
      /*
      console.log(`🗑️ Removing ${files.length} files...`);
      
      let removedCount = 0;
      let failedCount = 0;

      for (const file of files) {
        try {
          await this.strapiRequestNoResponse('DELETE', `/api/upload/files/${file.id}`);
          console.log(`  ✅ Removed: "${file.name}" (ID: ${file.id})`);
          removedCount++;
        } catch (error) {
          console.error(`  ❌ Failed to remove: "${file.name}" (ID: ${file.id}) - ${error.message}`);
          failedCount++;
        }
      }

      console.log(`\n📊 Files removal summary:`);
      console.log(`  - Removed: ${removedCount}`);
      console.log(`  - Failed: ${failedCount}`);
      */

    } catch (error) {
      console.error('Error handling files:', error.message);
    }

    console.log('\n' + '-'.repeat(60) + '\n');
  }

  async verifyCleanup() {
    console.log('=== CLEANUP VERIFICATION ===\n');

    try {
      const articles = await this.strapiRequest('GET', '/api/articles');
      const knowledgebase = await this.strapiRequest('GET', '/api/knowledgebases');
      const files = await this.strapiRequest('GET', '/api/upload/files');

      console.log(`📰 Remaining articles: ${articles.data?.length || 0}`);
      console.log(`📚 Remaining knowledgebase: ${knowledgebase.data?.length || 0}`);
      console.log(`📁 Remaining files: ${files.length || 0}`);

      if ((articles.data?.length || 0) === 0 && (knowledgebase.data?.length || 0) === 0) {
        console.log('\n🎉 SUCCESS: All content has been removed!');
      } else {
        console.log('\n⚠️ Some content still remains:');
        
        if (articles.data?.length > 0) {
          console.log('Remaining articles:');
          articles.data.forEach(article => {
            console.log(`  - "${article.title}" (ID: ${article.id})`);
          });
        }
        
        if (knowledgebase.data?.length > 0) {
          console.log('Remaining knowledgebase:');
          knowledgebase.data.forEach(kb => {
            console.log(`  - "${kb.title}" (ID: ${kb.id})`);
          });
        }
      }

    } catch (error) {
      console.error('Error verifying cleanup:', error.message);
    }

    console.log('\n' + '-'.repeat(60) + '\n');
  }

  async strapiRequest(method, endpoint, data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`🌐 Making ${method} request to: ${url}`);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (this.apiToken) {
      options.headers.Authorization = `Bearer ${this.apiToken}`;
      console.log(`🔐 Using Authorization header: Bearer ${this.apiToken.substring(0, 10)}...${this.apiToken.substring(this.apiToken.length - 4)}`);
    } else {
      console.log('⚠️ No API token found - requests will be unauthorized!');
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      console.log(`📊 Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error Response: ${errorText}`);
        throw new Error(`Strapi API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ Request successful`);
      return result;
    } catch (error) {
      console.error(`❌ Strapi request failed: ${method} ${endpoint}`, error);
      throw error;
    }
  }

  async strapiRequestNoResponse(method, endpoint, data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`🌐 Making ${method} request to: ${url}`);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (this.apiToken) {
      options.headers.Authorization = `Bearer ${this.apiToken}`;
      console.log(`🔐 Using Authorization header: Bearer ${this.apiToken.substring(0, 10)}...${this.apiToken.substring(this.apiToken.length - 4)}`);
    } else {
      console.log('⚠️ No API token found - requests will be unauthorized!');
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      console.log(`📊 Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error Response: ${errorText}`);
        throw new Error(`Strapi API error: ${response.status} - ${errorText}`);
      }

      console.log(`✅ Delete request successful`);
      // For DELETE requests, don't try to parse JSON response
      return true;
    } catch (error) {
      console.error(`❌ Strapi request failed: ${method} ${endpoint}`, error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const cleanup = new CompleteCleanup();
  await cleanup.performCompleteCleanup();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CompleteCleanup; 