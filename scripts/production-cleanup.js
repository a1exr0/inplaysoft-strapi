// Production cleanup script that works with pm2 ecosystem.config.js environment variables
const fetch = require('node-fetch');

class ProductionCleanup {
  constructor() {
    // Get environment variables (these are set by pm2 from ecosystem.config.js)
    this.baseUrl = process.env.PUBLIC_URL || 'http://localhost:1337';
    this.apiToken = process.env.STRAPI_API_TOKEN;
    
    if (!this.apiToken) {
      console.error('❌ Missing STRAPI_API_TOKEN environment variable');
      console.error('💡 Make sure your pm2 ecosystem.config.js has STRAPI_API_TOKEN set');
      process.exit(1);
    }
    
    console.log('🔧 Production Cleanup Configuration:');
    console.log(`   Base URL: ${this.baseUrl}`);
    console.log(`   API Token: ${this.apiToken.substring(0, 20)}... (${this.apiToken.length} chars)`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  }

  async performCleanup() {
    console.log('\n🧹 Starting Production Content Cleanup...\n');

    try {
      // Step 1: Test API connection first
      await this.testApiConnection();
      
      // Step 2: Remove all articles
      await this.removeAllArticles();
      
      // Step 3: Remove all knowledgebase entries
      await this.removeAllKnowledgebase();
      
      // Step 4: Final verification
      await this.finalVerification();

      console.log('\n✅ Production cleanup completed!');

    } catch (error) {
      console.error('❌ Production cleanup failed:', error);
      throw error;
    }
  }

  async testApiConnection() {
    console.log('=== TESTING API CONNECTION ===\n');

    try {
      const response = await this.strapiRequest('GET', '/api/articles');
      console.log(`✅ API connection successful - found ${response.data?.length || 0} articles`);
      
      // Test delete permissions by checking user permissions
      const userResponse = await this.strapiRequest('GET', '/api/users/me');
      if (userResponse) {
        console.log('✅ API token has valid permissions');
      }
      
    } catch (error) {
      console.error('❌ API connection failed:', error.message);
      console.error('💡 Check your STRAPI_API_TOKEN and ensure it has Full Access permissions');
      throw error;
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

      console.log(`🗑️ Found ${articles.data.length} articles to remove`);

      let removedCount = 0;
      let failedCount = 0;

      for (const article of articles.data) {
        try {
          // First try with documentId (Strapi v5 preferred method)
          if (article.documentId) {
            try {
              await this.deleteRequest(`/api/articles/${article.documentId}`);
              console.log(`  ✅ Removed via documentId: "${article.title}" (${article.documentId})`);
              removedCount++;
              continue;
            } catch (docError) {
              console.log(`  ⚠️ DocumentId failed for "${article.title}": ${docError.message}`);
            }
          }

          // Fallback to numeric ID
          await this.deleteRequest(`/api/articles/${article.id}`);
          console.log(`  ✅ Removed via ID: "${article.title}" (${article.id})`);
          removedCount++;

        } catch (error) {
          console.error(`  ❌ Failed to remove: "${article.title}" - ${error.message}`);
          failedCount++;
        }
      }

      console.log(`\n📊 Articles removal summary:`);
      console.log(`  - Removed: ${removedCount}`);
      console.log(`  - Failed: ${failedCount}`);

    } catch (error) {
      console.error('Error removing articles:', error.message);
      throw error;
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

      console.log(`🗑️ Found ${knowledgebase.data.length} knowledgebase entries to remove`);

      let removedCount = 0;
      let failedCount = 0;

      for (const kb of knowledgebase.data) {
        try {
          // First try with documentId (Strapi v5 preferred method)
          if (kb.documentId) {
            try {
              await this.deleteRequest(`/api/knowledgebases/${kb.documentId}`);
              console.log(`  ✅ Removed via documentId: "${kb.title}" (${kb.documentId})`);
              removedCount++;
              continue;
            } catch (docError) {
              console.log(`  ⚠️ DocumentId failed for "${kb.title}": ${docError.message}`);
            }
          }

          // Fallback to numeric ID  
          await this.deleteRequest(`/api/knowledgebases/${kb.id}`);
          console.log(`  ✅ Removed via ID: "${kb.title}" (${kb.id})`);
          removedCount++;

        } catch (error) {
          console.error(`  ❌ Failed to remove: "${kb.title}" - ${error.message}`);
          failedCount++;
        }
      }

      console.log(`\n📊 Knowledgebase removal summary:`);
      console.log(`  - Removed: ${removedCount}`);
      console.log(`  - Failed: ${failedCount}`);

    } catch (error) {
      console.error('Error removing knowledgebase:', error.message);
      throw error;
    }

    console.log('\n' + '-'.repeat(60) + '\n');
  }

  async finalVerification() {
    console.log('=== FINAL VERIFICATION ===\n');

    try {
      const articles = await this.strapiRequest('GET', '/api/articles');
      const knowledgebase = await this.strapiRequest('GET', '/api/knowledgebases');

      console.log(`📰 Remaining articles: ${articles.data?.length || 0}`);
      console.log(`📚 Remaining knowledgebase: ${knowledgebase.data?.length || 0}`);

      if ((articles.data?.length || 0) === 0 && (knowledgebase.data?.length || 0) === 0) {
        console.log('\n🎉 SUCCESS: All content has been removed!');
        console.log('🔄 You can now refresh your admin panel and it should be empty.');
      } else {
        console.log('\n⚠️ Some content still remains - this may be normal:');
        
        if (articles.data?.length > 0) {
          console.log(`\nRemaining articles (${articles.data.length}):`);
          articles.data.slice(0, 5).forEach((article, index) => {
            console.log(`  ${index + 1}. "${article.title}" (ID: ${article.id})`);
          });
          if (articles.data.length > 5) {
            console.log(`  ... and ${articles.data.length - 5} more`);
          }
        }
        
        if (knowledgebase.data?.length > 0) {
          console.log(`\nRemaining knowledgebase (${knowledgebase.data.length}):`);
          knowledgebase.data.slice(0, 5).forEach((kb, index) => {
            console.log(`  ${index + 1}. "${kb.title}" (ID: ${kb.id})`);
          });
          if (knowledgebase.data.length > 5) {
            console.log(`  ... and ${knowledgebase.data.length - 5} more`);
          }
        }
      }

    } catch (error) {
      console.error('Error in final verification:', error.message);
    }

    console.log('\n' + '-'.repeat(60) + '\n');
  }

  async deleteRequest(endpoint) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options = {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiToken}`
      }
    };

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${response.status}: ${errorText}`);
    }

    return true;
  }

  async strapiRequest(method, endpoint, data = null) {
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

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Strapi API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }
}

// Main execution
async function main() {
  console.log('🚀 Production Cleanup Script Starting...\n');
  
  const cleanup = new ProductionCleanup();
  await cleanup.performCleanup();
  
  console.log('🎯 Production cleanup script finished');
}

if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Production cleanup script failed:', error);
    process.exit(1);
  });
}

module.exports = ProductionCleanup; 