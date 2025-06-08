require('dotenv').config();

class FinalImportCheck {
  constructor() {
    this.baseUrl = process.env.PUBLIC_URL || 'http://localhost:1337';
    this.apiToken = process.env.STRAPI_API_TOKEN;
  }

  async checkFinalStatus() {
    console.log('📊 Final Import Status Check\n');

    try {
      // Check articles
      const articles = await this.strapiRequest('GET', '/api/articles?populate=cover');
      console.log(`📰 Articles: ${articles.data?.length || 0}`);
      
      let articlesWithCovers = 0;
      if (articles.data) {
        articles.data.forEach(article => {
          if (article.cover) articlesWithCovers++;
        });
      }
      console.log(`   - With covers: ${articlesWithCovers}`);
      console.log(`   - Without covers: ${(articles.data?.length || 0) - articlesWithCovers}`);

      // Check knowledgebase
      const knowledgebase = await this.strapiRequest('GET', '/api/knowledgebases?populate=cover');
      console.log(`\n📚 Knowledgebase: ${knowledgebase.data?.length || 0}`);
      
      let kbWithCovers = 0;
      if (knowledgebase.data) {
        knowledgebase.data.forEach(kb => {
          if (kb.cover) kbWithCovers++;
        });
      }
      console.log(`   - With covers: ${kbWithCovers}`);
      console.log(`   - Without covers: ${(knowledgebase.data?.length || 0) - kbWithCovers}`);

      // Check uploaded files
      const files = await this.strapiRequest('GET', '/api/upload/files');
      console.log(`\n📁 Uploaded files: ${files.length || 0}`);

      // Summary
      const totalContent = (articles.data?.length || 0) + (knowledgebase.data?.length || 0);
      const totalWithCovers = articlesWithCovers + kbWithCovers;
      const coverPercentage = totalContent > 0 ? Math.round((totalWithCovers / totalContent) * 100) : 0;

      console.log(`\n✅ SUMMARY:`);
      console.log(`   Total content: ${totalContent}`);
      console.log(`   Content with covers: ${totalWithCovers} (${coverPercentage}%)`);
      console.log(`   Images uploaded: ${files.length || 0}`);

    } catch (error) {
      console.error('Error checking status:', error.message);
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
  const checker = new FinalImportCheck();
  await checker.checkFinalStatus();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = FinalImportCheck; 