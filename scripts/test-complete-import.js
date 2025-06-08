require('dotenv').config();
const WordPressImporter = require('./wordpress-import');

async function testCompleteImport() {
  console.log('Testing complete import process with corrected redirects...\n');

  const importer = new WordPressImporter();
  
  // Override processItem to limit to 2 posts for testing
  let processedCount = 0;
  const originalProcessItem = importer.processItem.bind(importer);
  
  importer.processItem = async function(item) {
    if (processedCount >= 2) return;
    
    const result = await originalProcessItem(item);
    processedCount++;
    return result;
  };

  try {
    await importer.importFromXML('wordpress/inplaysoft.WordPress.2025-06-07.xml');
    
    console.log('\n=== Generated Redirects ===');
    for (const redirect of importer.redirects) {
      console.log(`${redirect.from} → ${redirect.to} (${redirect.type})`);
    }
    
    console.log(`\n✓ Successfully processed ${processedCount} posts with corrected redirect URLs`);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testCompleteImport(); 