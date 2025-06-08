require('dotenv').config();
const fs = require('fs');
const xml2js = require('xml2js');

class ImportDiagnostics {
  constructor() {
    this.baseUrl = process.env.PUBLIC_URL || 'http://localhost:1337';
    this.apiToken = process.env.STRAPI_API_TOKEN;
  }

  async diagnoseImportIssues() {
    console.log('🔍 Diagnosing WordPress Import Issues...\n');

    try {
      // 1. Check what was actually imported
      await this.checkImportedContent();
      
      // 2. Analyze WordPress categories
      await this.analyzeWordPressCategories();
      
      // 3. Check cover image assignments
      await this.checkCoverImages();
      
      // 4. Look for duplicates
      await this.checkForDuplicates();

    } catch (error) {
      console.error('Diagnostic failed:', error);
    }
  }

  async checkImportedContent() {
    console.log('=== IMPORTED CONTENT ANALYSIS ===\n');

    try {
      // Check articles
      const articles = await this.strapiRequest('GET', '/api/articles?populate=*');
      console.log(`📰 Articles found: ${articles.data?.length || 0}`);
      console.log('Raw articles response structure:', JSON.stringify(articles, null, 2).substring(0, 500) + '...');
      
      if (articles.data?.length > 0) {
        console.log('Sample articles:');
        articles.data.slice(0, 3).forEach(article => {
          console.log(`  - ${article.attributes?.title || article.title || 'NO TITLE'} (ID: ${article.id})`);
        });
      }

      // Check knowledgebase
      const knowledgebase = await this.strapiRequest('GET', '/api/knowledgebases?populate=*');
      console.log(`📚 Knowledgebase entries found: ${knowledgebase.data?.length || 0}`);
      
      if (knowledgebase.data?.length > 0) {
        console.log('Sample knowledgebase entries:');
        knowledgebase.data.slice(0, 3).forEach(kb => {
          console.log(`  - ${kb.attributes.title} (ID: ${kb.id}, Cover: ${kb.attributes.cover?.data ? 'YES' : 'NO'})`);
        });
      }

    } catch (error) {
      console.error('Error checking imported content:', error.message);
    }

    console.log('\n' + '-'.repeat(60) + '\n');
  }

  async analyzeWordPressCategories() {
    console.log('=== WORDPRESS CATEGORIES ANALYSIS ===\n');

    const xmlFilePath = 'wordpress/inplaysoft.WordPress.2025-06-07.xml';
    
    if (!fs.existsSync(xmlFilePath)) {
      console.log('❌ WordPress XML file not found');
      return;
    }

    try {
      const xmlData = fs.readFileSync(xmlFilePath, 'utf8');
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xmlData);
      
      const items = result.rss.channel[0].item;
      
      const categoryStats = new Map();
      let postsWithoutCategory = 0;
      let publishedPosts = 0;

      for (const item of items) {
        const postType = this.getFieldValue(item, 'wp:post_type');
        const status = this.getFieldValue(item, 'wp:status');
        
        if (postType === 'post' && status === 'publish') {
          publishedPosts++;
          
          const categories = this.extractCategories(item);
          const primaryCategory = categories.find(cat => cat.domain === 'category');
          
          if (primaryCategory) {
            const catName = primaryCategory.nicename;
            categoryStats.set(catName, (categoryStats.get(catName) || 0) + 1);
          } else {
            postsWithoutCategory++;
          }
        }
      }

      console.log(`📊 Total published posts: ${publishedPosts}`);
      console.log(`📊 Posts without category: ${postsWithoutCategory}`);
      console.log('\nCategory breakdown:');
      
      for (const [category, count] of categoryStats) {
        console.log(`  - ${category}: ${count} posts`);
      }

    } catch (error) {
      console.error('Error analyzing WordPress categories:', error.message);
    }

    console.log('\n' + '-'.repeat(60) + '\n');
  }

  async checkCoverImages() {
    console.log('=== COVER IMAGE ANALYSIS ===\n');

    try {
      // Check articles
      const articles = await this.strapiRequest('GET', '/api/articles?populate=cover');
      let articlesWithCover = 0;
      let articlesWithoutCover = 0;

      if (articles.data) {
        articles.data.forEach(article => {
          if (article.attributes.cover?.data) {
            articlesWithCover++;
          } else {
            articlesWithoutCover++;
            console.log(`❌ Article without cover: ${article.attributes.title}`);
          }
        });
      }

      console.log(`📰 Articles with cover images: ${articlesWithCover}`);
      console.log(`📰 Articles without cover images: ${articlesWithoutCover}`);

      // Check knowledgebase
      const knowledgebase = await this.strapiRequest('GET', '/api/knowledgebases?populate=cover');
      let kbWithCover = 0;
      let kbWithoutCover = 0;

      if (knowledgebase.data) {
        knowledgebase.data.forEach(kb => {
          if (kb.attributes.cover?.data) {
            kbWithCover++;
          } else {
            kbWithoutCover++;
            console.log(`❌ Knowledgebase without cover: ${kb.attributes.title}`);
          }
        });
      }

      console.log(`📚 Knowledgebase with cover images: ${kbWithCover}`);
      console.log(`📚 Knowledgebase without cover images: ${kbWithoutCover}`);

      // Check uploaded files
      const files = await this.strapiRequest('GET', '/api/upload/files');
      console.log(`📁 Total uploaded files: ${files.length || 0}`);

    } catch (error) {
      console.error('Error checking cover images:', error.message);
    }

    console.log('\n' + '-'.repeat(60) + '\n');
  }

  async checkForDuplicates() {
    console.log('=== DUPLICATE CONTENT ANALYSIS ===\n');

    try {
      // Check for duplicate article titles
      const articles = await this.strapiRequest('GET', '/api/articles');
      const knowledgebase = await this.strapiRequest('GET', '/api/knowledgebases');

      const articleTitles = articles.data?.map(a => a.attributes.title) || [];
      const kbTitles = knowledgebase.data?.map(kb => kb.attributes.title) || [];

      // Find duplicates within articles
      const articleDuplicates = this.findDuplicates(articleTitles);
      if (articleDuplicates.length > 0) {
        console.log('🔄 Duplicate article titles:');
        articleDuplicates.forEach(title => {
          console.log(`  - ${title}`);
        });
      }

      // Find duplicates within knowledgebase
      const kbDuplicates = this.findDuplicates(kbTitles);
      if (kbDuplicates.length > 0) {
        console.log('🔄 Duplicate knowledgebase titles:');
        kbDuplicates.forEach(title => {
          console.log(`  - ${title}`);
        });
      }

      // Find cross-duplicates (same title in both collections)
      const crossDuplicates = articleTitles.filter(title => kbTitles.includes(title));
      if (crossDuplicates.length > 0) {
        console.log('🔄 Cross-collection duplicates (same title in both articles and knowledgebase):');
        crossDuplicates.forEach(title => {
          console.log(`  - ${title}`);
        });
      }

      console.log(`\nSummary:`);
      console.log(`  - Article duplicates: ${articleDuplicates.length}`);
      console.log(`  - Knowledgebase duplicates: ${kbDuplicates.length}`);
      console.log(`  - Cross-collection duplicates: ${crossDuplicates.length}`);

    } catch (error) {
      console.error('Error checking for duplicates:', error.message);
    }

    console.log('\n' + '-'.repeat(60) + '\n');
  }

  findDuplicates(array) {
    const counts = {};
    const duplicates = [];

    array.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });

    for (const [item, count] of Object.entries(counts)) {
      if (count > 1) {
        duplicates.push(item);
      }
    }

    return duplicates;
  }

  extractCategories(item) {
    const categories = [];
    if (item.category) {
      for (const cat of item.category) {
        if (typeof cat === 'object' && cat.$) {
          categories.push({
            domain: cat.$.domain,
            nicename: cat.$.nicename,
            name: cat._
          });
        }
      }
    }
    return categories;
  }

  getFieldValue(item, fieldName) {
    const field = item[fieldName];
    if (!field) return '';
    return Array.isArray(field) ? field[0] : field;
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
  const diagnostics = new ImportDiagnostics();
  await diagnostics.diagnoseImportIssues();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ImportDiagnostics; 