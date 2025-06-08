// Load production environment configuration
const { loadProductionEnv } = require('./load-production-env');
loadProductionEnv();

const { Pool } = require('pg');
const fs = require('fs');
const xml2js = require('xml2js');

class TimestampUpdater {
  constructor() {
    this.dbPool = new Pool({
      user: process.env.DATABASE_USERNAME,
      host: process.env.DATABASE_HOST,
      database: process.env.DATABASE_NAME,
      password: process.env.DATABASE_PASSWORD,
      port: parseInt(process.env.DATABASE_PORT) || 5432,
      ssl: process.env.DATABASE_SSL === 'true' ? {
        rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false'
      } : false,
    });
    this.processedItems = [];
  }

  async updateTimestampsFromWordPress(xmlFilePath) {
    console.log('Starting timestamp update from WordPress XML...\n');

    // First, parse the WordPress XML to get the original dates
    const wordpressData = await this.parseWordPressXML(xmlFilePath);
    
    // Get current Strapi data from database
    const strapiArticles = await this.getStrapiArticles();
    const strapiKnowledgebase = await this.getStrapiKnowledgebase();
    
    console.log(`Found ${strapiArticles.length} articles and ${strapiKnowledgebase.length} knowledgebase entries in database\n`);

    // Update timestamps for articles (News category)
    let updatedArticles = 0;
    for (const article of strapiArticles) {
      const wordpressItem = wordpressData.find(item => 
        this.generateSlug(item.slug) === article.slug ||
        this.generateSlug(item.title) === article.slug
      );
      
      if (wordpressItem && wordpressItem.category === 'news') {
        await this.updateArticleTimestamp(article.id, wordpressItem);
        updatedArticles++;
        console.log(`✓ Updated article: ${article.title}`);
      }
    }

    // Update timestamps for knowledgebase (Insights category)
    let updatedKnowledgebase = 0;
    for (const kb of strapiKnowledgebase) {
      const wordpressItem = wordpressData.find(item => 
        this.generateSlug(item.slug) === kb.slug ||
        this.generateSlug(item.title) === kb.slug
      );
      
      if (wordpressItem && wordpressItem.category === 'insights') {
        await this.updateKnowledgebaseTimestamp(kb.id, wordpressItem);
        updatedKnowledgebase++;
        console.log(`✓ Updated knowledgebase: ${kb.title}`);
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Updated ${updatedArticles} articles`);
    console.log(`Updated ${updatedKnowledgebase} knowledgebase entries`);
    console.log(`Total records updated: ${updatedArticles + updatedKnowledgebase}`);
  }

  async parseWordPressXML(xmlFilePath) {
    console.log('Parsing WordPress XML...');
    
    const xmlData = fs.readFileSync(xmlFilePath, 'utf8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);
    
    const items = result.rss.channel[0].item;
    const processedItems = [];

    for (const item of items) {
      const postType = this.getFieldValue(item, 'wp:post_type');
      const status = this.getFieldValue(item, 'wp:status');
      
      if (postType === 'post' && status === 'publish') {
        const title = this.getFieldValue(item, 'title');
        const slug = this.getFieldValue(item, 'wp:post_name');
        const postDate = this.getFieldValue(item, 'wp:post_date');
        const modifiedDate = this.getFieldValue(item, 'wp:post_modified');
        const pubDate = this.getFieldValue(item, 'pubDate');
        
        // Get categories
        const categories = this.extractCategories(item);
        const primaryCategory = categories.find(cat => cat.domain === 'category');
        
        if (primaryCategory) {
          processedItems.push({
            title,
            slug,
            postDate: this.parseWordPressDate(postDate || pubDate),
            modifiedDate: this.parseWordPressDate(modifiedDate || postDate || pubDate),
            publishedDate: this.parseWordPressDate(postDate || pubDate),
            category: primaryCategory.nicename
          });
        }
      }
    }

    console.log(`Parsed ${processedItems.length} published WordPress posts\n`);
    return processedItems;
  }

  async getStrapiArticles() {
    const query = `
      SELECT id, title, slug, created_at, updated_at, published_at 
      FROM articles 
      ORDER BY id
    `;
    
    try {
      const result = await this.dbPool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error fetching articles:', error.message);
      return [];
    }
  }

  async getStrapiKnowledgebase() {
    const query = `
      SELECT id, title, slug, created_at, updated_at, published_at 
      FROM knowledgebases 
      ORDER BY id
    `;
    
    try {
      const result = await this.dbPool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error fetching knowledgebase entries:', error.message);
      return [];
    }
  }

  async updateArticleTimestamp(articleId, wordpressData) {
    const query = `
      UPDATE articles 
      SET 
        created_at = $1,
        updated_at = $2,
        published_at = $3
      WHERE id = $4
    `;

    const values = [
      wordpressData.postDate,
      wordpressData.modifiedDate,
      wordpressData.publishedDate,
      articleId
    ];

    try {
      await this.dbPool.query(query, values);
      
      console.log(`  📅 ${wordpressData.postDate.toDateString()} → ${wordpressData.modifiedDate.toDateString()}`);
    } catch (error) {
      console.error(`Error updating article ${articleId}:`, error.message);
    }
  }

  async updateKnowledgebaseTimestamp(kbId, wordpressData) {
    const query = `
      UPDATE knowledgebases 
      SET 
        created_at = $1,
        updated_at = $2,
        published_at = $3
      WHERE id = $4
    `;

    const values = [
      wordpressData.postDate,
      wordpressData.modifiedDate,
      wordpressData.publishedDate,
      kbId
    ];

    try {
      await this.dbPool.query(query, values);
      
      console.log(`  📅 ${wordpressData.postDate.toDateString()} → ${wordpressData.modifiedDate.toDateString()}`);
    } catch (error) {
      console.error(`Error updating knowledgebase ${kbId}:`, error.message);
    }
  }

  generateSlug(originalSlug) {
    return originalSlug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  parseWordPressDate(dateString) {
    if (!dateString) return new Date();
    
    try {
      let parsedDate;
      
      if (dateString.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
        const isoDate = dateString.replace(' ', 'T') + 'Z';
        parsedDate = new Date(isoDate);
      } else {
        parsedDate = new Date(dateString);
      }
      
      if (isNaN(parsedDate.getTime())) {
        console.warn(`Invalid date parsed: ${dateString}, using current date`);
        return new Date();
      }
      
      return parsedDate;
    } catch (error) {
      console.warn(`Failed to parse date: ${dateString}, using current date`);
      return new Date();
    }
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

  async testDatabaseConnection() {
    try {
      console.log('Testing database connection...');
      const result = await this.dbPool.query('SELECT NOW() as current_time');
      console.log(`✓ Database connected successfully at ${result.rows[0].current_time}`);
      
      // Test if Strapi tables exist
      const tablesResult = await this.dbPool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND (table_name = 'articles' OR table_name = 'knowledgebases')
        ORDER BY table_name
      `);
      
      console.log(`✓ Found Strapi tables: ${tablesResult.rows.map(row => row.table_name).join(', ')}`);
      
      return true;
    } catch (error) {
      console.error('Database connection failed:', error.message);
      return false;
    }
  }

  async close() {
    await this.dbPool.end();
  }
}

// Main execution
async function main() {
  const xmlFilePath = process.argv[2] || 'wordpress/inplaysoft.WordPress.2025-06-07.xml';
  
  if (!fs.existsSync(xmlFilePath)) {
    console.error(`XML file not found: ${xmlFilePath}`);
    process.exit(1);
  }

  const updater = new TimestampUpdater();
  
  try {
    // Test connection first
    const connected = await updater.testDatabaseConnection();
    if (!connected) {
      console.error('Cannot proceed without database connection');
      process.exit(1);
    }
    
    // Update timestamps
    await updater.updateTimestampsFromWordPress(xmlFilePath);
    
  } catch (error) {
    console.error('Error updating timestamps:', error);
  } finally {
    await updater.close();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = TimestampUpdater; 