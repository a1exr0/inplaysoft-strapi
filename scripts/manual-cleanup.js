require('dotenv').config();

class ManualCleanup {
  constructor() {
    this.baseUrl = process.env.PUBLIC_URL || 'http://localhost:1337';
    this.apiToken = process.env.STRAPI_API_TOKEN;
  }

  async performCleanup() {
    console.log('🧹 Performing Manual Cleanup...\n');

    try {
      // Step 1: Remove all imported content and start fresh
      await this.removeAllImportedContent();
      
      // Step 2: Check remaining state
      await this.checkRemainingContent();

      console.log('\n✅ Manual cleanup completed!');

    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  async removeAllImportedContent() {
    console.log('=== REMOVING ALL IMPORTED CONTENT ===\n');

    try {
      // Get all articles and knowledgebase entries
      const articles = await this.strapiRequest('GET', '/api/articles');
      const knowledgebase = await this.strapiRequest('GET', '/api/knowledgebases');

      console.log(`📰 Found ${articles.data?.length || 0} articles to remove`);
      console.log(`📚 Found ${knowledgebase.data?.length || 0} knowledgebase entries to remove`);

      // Remove all articles
      if (articles.data && articles.data.length > 0) {
        for (const article of articles.data) {
          try {
            // Use the numeric ID instead of documentId for deletion
            await this.strapiRequestNoResponse('DELETE', `/api/articles/${article.id}`);
            console.log(`❌ Removed article: "${article.title}" (ID: ${article.id})`);
          } catch (error) {
            console.error(`Failed to remove article ${article.id}:`, error.message);
          }
        }
      }

      // Remove all knowledgebase entries
      if (knowledgebase.data && knowledgebase.data.length > 0) {
        for (const kb of knowledgebase.data) {
          try {
            // Use the numeric ID instead of documentId for deletion
            await this.strapiRequestNoResponse('DELETE', `/api/knowledgebases/${kb.id}`);
            console.log(`❌ Removed knowledgebase: "${kb.title}" (ID: ${kb.id})`);
          } catch (error) {
            console.error(`Failed to remove knowledgebase ${kb.id}:`, error.message);
          }
        }
      }

      console.log('\n✅ All imported content removed');

    } catch (error) {
      console.error('Error removing content:', error);
    }

    console.log('\n' + '-'.repeat(60) + '\n');
  }

  async checkRemainingContent() {
    console.log('=== FINAL STATE CHECK ===\n');

    const articles = await this.strapiRequest('GET', '/api/articles');
    const knowledgebase = await this.strapiRequest('GET', '/api/knowledgebases');
    const files = await this.strapiRequest('GET', '/api/upload/files');

    console.log(`📰 Remaining articles: ${articles.data?.length || 0}`);
    console.log(`📚 Remaining knowledgebase: ${knowledgebase.data?.length || 0}`);
    console.log(`📁 Uploaded files: ${files.length || 0}`);

    if (articles.data?.length > 0) {
      console.log('Remaining articles:');
      articles.data.forEach(article => {
        console.log(`  - ${article.title} (ID: ${article.id})`);
      });
    }

    if (knowledgebase.data?.length > 0) {
      console.log('Remaining knowledgebase:');
      knowledgebase.data.forEach(kb => {
        console.log(`  - ${kb.title} (ID: ${kb.id})`);
      });
    }

    console.log('\n' + '-'.repeat(60) + '\n');
  }

  async strapiRequest(method, endpoint, data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (this.apiToken) {
      options.headers.Authorization = `Bearer ${this.apiToken}`;
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Strapi API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Strapi request failed: ${method} ${endpoint}`, error);
      throw error;
    }
  }

  async strapiRequestNoResponse(method, endpoint, data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (this.apiToken) {
      options.headers.Authorization = `Bearer ${this.apiToken}`;
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Strapi API error: ${response.status} - ${errorText}`);
      }

      // For DELETE requests, don't try to parse JSON response
      return true;
    } catch (error) {
      console.error(`Strapi request failed: ${method} ${endpoint}`, error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const cleanup = new ManualCleanup();
  await cleanup.performCleanup();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ManualCleanup; 