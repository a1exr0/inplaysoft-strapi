require('dotenv').config();

class DuplicateRemover {
  constructor() {
    this.baseUrl = process.env.PUBLIC_URL || 'http://localhost:1337';
    this.apiToken = process.env.STRAPI_API_TOKEN;
  }

  async initialize() {
    if (!this.apiToken) {
      throw new Error('STRAPI_API_TOKEN is required. Please set it in your .env file.');
    }
    
    console.log('Duplicate Remover initialized');
    console.log(`Target URL: ${this.baseUrl}`);
  }

  async removeDuplicates() {
    console.log('🔍 Starting duplicate removal process...');
    
    try {
      await this.initialize();
      
      // Check for duplicate articles
      console.log('\n📰 Checking for duplicate articles...');
      await this.removeDuplicateArticles();
      
      // Check for duplicate knowledgebase entries
      console.log('\n📚 Checking for duplicate knowledgebase entries...');
      await this.removeDuplicateKnowledgebase();
      
      console.log('\n✅ Duplicate removal completed!');
      
    } catch (error) {
      console.error('❌ Duplicate removal failed:', error);
      throw error;
    }
  }

  async removeDuplicateArticles() {
    try {
      // Get all articles
      const articles = await this.strapiRequest('GET', '/api/articles?pagination[limit]=1000');
      
      if (!articles.data || articles.data.length === 0) {
        console.log('   No articles found');
        return;
      }
      
      console.log(`   Found ${articles.data.length} articles`);
      
      // Group by slug
      const slugGroups = {};
      articles.data.forEach(article => {
        const slug = article.attributes.slug;
        if (!slugGroups[slug]) {
          slugGroups[slug] = [];
        }
        slugGroups[slug].push(article);
      });
      
      // Find duplicates
      const duplicates = Object.keys(slugGroups).filter(slug => slugGroups[slug].length > 1);
      
      if (duplicates.length === 0) {
        console.log('   ✅ No duplicate articles found');
        return;
      }
      
      console.log(`   ⚠️ Found ${duplicates.length} slugs with duplicates:`);
      
      let removedCount = 0;
      
      for (const slug of duplicates) {
        const duplicateArticles = slugGroups[slug];
        console.log(`\n   📝 Slug: ${slug} (${duplicateArticles.length} duplicates)`);
        
        // Sort by ID to keep the first one (oldest)
        duplicateArticles.sort((a, b) => a.id - b.id);
        
        // Keep the first one, remove the rest
        const toKeep = duplicateArticles[0];
        const toRemove = duplicateArticles.slice(1);
        
        console.log(`     Keeping: ID ${toKeep.id} (${toKeep.attributes.title})`);
        
        for (const article of toRemove) {
          try {
            await this.strapiRequest('DELETE', `/api/articles/${article.id}`);
            console.log(`     ❌ Removed: ID ${article.id} (${article.attributes.title})`);
            removedCount++;
          } catch (error) {
            console.error(`     ⚠️ Failed to remove article ID ${article.id}:`, error.message);
          }
        }
      }
      
      console.log(`\n   ✅ Removed ${removedCount} duplicate articles`);
      
    } catch (error) {
      console.error('   ❌ Failed to remove duplicate articles:', error);
    }
  }

  async removeDuplicateKnowledgebase() {
    try {
      // Get all knowledgebase entries
      const entries = await this.strapiRequest('GET', '/api/knowledgebases?pagination[limit]=1000');
      
      if (!entries.data || entries.data.length === 0) {
        console.log('   No knowledgebase entries found');
        return;
      }
      
      console.log(`   Found ${entries.data.length} knowledgebase entries`);
      
      // Group by slug
      const slugGroups = {};
      entries.data.forEach(entry => {
        const slug = entry.attributes.slug;
        if (!slugGroups[slug]) {
          slugGroups[slug] = [];
        }
        slugGroups[slug].push(entry);
      });
      
      // Find duplicates
      const duplicates = Object.keys(slugGroups).filter(slug => slugGroups[slug].length > 1);
      
      if (duplicates.length === 0) {
        console.log('   ✅ No duplicate knowledgebase entries found');
        return;
      }
      
      console.log(`   ⚠️ Found ${duplicates.length} slugs with duplicates:`);
      
      let removedCount = 0;
      
      for (const slug of duplicates) {
        const duplicateEntries = slugGroups[slug];
        console.log(`\n   📚 Slug: ${slug} (${duplicateEntries.length} duplicates)`);
        
        // Sort by ID to keep the first one (oldest)
        duplicateEntries.sort((a, b) => a.id - b.id);
        
        // Keep the first one, remove the rest
        const toKeep = duplicateEntries[0];
        const toRemove = duplicateEntries.slice(1);
        
        console.log(`     Keeping: ID ${toKeep.id} (${toKeep.attributes.title})`);
        
        for (const entry of toRemove) {
          try {
            await this.strapiRequest('DELETE', `/api/knowledgebases/${entry.id}`);
            console.log(`     ❌ Removed: ID ${entry.id} (${entry.attributes.title})`);
            removedCount++;
          } catch (error) {
            console.error(`     ⚠️ Failed to remove knowledgebase entry ID ${entry.id}:`, error.message);
          }
        }
      }
      
      console.log(`\n   ✅ Removed ${removedCount} duplicate knowledgebase entries`);
      
    } catch (error) {
      console.error('   ❌ Failed to remove duplicate knowledgebase entries:', error);
    }
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
}

// Main execution
async function main() {
  const remover = new DuplicateRemover();
  await remover.removeDuplicates();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DuplicateRemover; 