const WordPressImporter = require('./wordpress-import');

class TestImporter extends WordPressImporter {
  async importFromXML(xmlFilePath) {
    console.log('Starting WordPress XML test import (limited items)...');
    
    try {
      // Read and parse XML
      const fs = require('fs');
      const xml2js = require('xml2js');
      
      const xmlData = fs.readFileSync(xmlFilePath, 'utf8');
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xmlData);
      
      const channel = result.rss.channel[0];
      const items = channel.item || [];
      
      console.log(`Found ${items.length} items in XML`);
      
      // Initialize authentication
      await this.initialize();
      
      // Create default author
      await this.createDefaultAuthor();
      
      // Process only first 3 published posts
      let processed = 0;
      const maxItems = 3;
      
      for (const item of items) {
        if (processed >= maxItems) break;
        
        const postType = this.getFieldValue(item, 'wp:post_type');
        const status = this.getFieldValue(item, 'wp:status');
        
        if (postType === 'post' && status === 'publish') {
          await this.processItem(item);
          processed++;
        }
      }
      
      // Generate redirects file
      await this.generateRedirectsFile();
      
      console.log(`Test import completed! Processed ${processed} items.`);
      console.log(`Generated ${this.redirects.length} redirects`);
      
    } catch (error) {
      console.error('Test import failed:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  require('dotenv').config();
  
  const xmlFilePath = 'wordpress/inplaysoft.WordPress.2025-06-07.xml';
  
  const importer = new TestImporter();
  await importer.importFromXML(xmlFilePath);
}

main().catch(console.error); 