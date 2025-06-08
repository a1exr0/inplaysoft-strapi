require('dotenv').config();
const WordPressImporter = require('./wordpress-import');

async function testElementorImages() {
  console.log('Testing Elementor cover image extraction...\n');

  const importer = new WordPressImporter();
  
  // Override processItem to only process posts with Elementor data and no content images
  let processedCount = 0;
  const originalProcessItem = importer.processItem.bind(importer);
  
  importer.processItem = async function(item) {
    if (processedCount >= 3) return;
    
    const postType = this.getFieldValue(item, 'wp:post_type');
    const status = this.getFieldValue(item, 'wp:status');
    const title = this.getFieldValue(item, 'title');
    
    // Only process published posts
    if (postType !== 'post' || status !== 'publish') return;
    
    // Check if this post has Elementor data
    const hasElementorData = item['wp:postmeta'] && 
      (Array.isArray(item['wp:postmeta']) ? item['wp:postmeta'] : [item['wp:postmeta']])
        .some(meta => {
          const metaKey = this.getFieldValue(meta, 'wp:meta_key');
          return metaKey === '_elementor_data';
        });
    
    if (hasElementorData) {
      console.log(`🔍 Testing post with Elementor data: ${title}`);
      
      // Test extracting Elementor cover image
      const elementorCover = await this.extractElementorCoverImage(item);
      
      if (elementorCover) {
        console.log(`✅ Successfully extracted Elementor cover image for: ${title}`);
        console.log(`   Image ID: ${elementorCover.id}, URL: ${elementorCover.url}`);
      } else {
        console.log(`❌ No Elementor cover image found for: ${title}`);
      }
      
      console.log('---');
      processedCount++;
    }
  };

  try {
    await importer.importFromXML('wordpress/inplaysoft.WordPress.2025-06-07.xml');
    
    console.log(`\n✓ Successfully tested Elementor image extraction on ${processedCount} posts`);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testElementorImages(); 