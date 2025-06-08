const fs = require('fs');
const xml2js = require('xml2js');

async function testRedirectGeneration() {
  console.log('Testing WordPress URL path extraction for redirects...\n');

  // Test the extractWordPressPath method
  function extractWordPressPath(originalLink) {
    if (!originalLink) return '/';
    
    try {
      const url = new URL(originalLink);
      return url.pathname;
    } catch (error) {
      console.warn(`Failed to parse WordPress URL: ${originalLink}, using fallback`);
      return '/';
    }
  }

  // Test cases
  const testUrls = [
    'https://inplaysoft.com/2024/07/05/multi-tenant-gaming-platform/',
    'https://inplaysoft.com/2024/09/18/inplaysofts-guide-to-lisbon-during-sbc/',
    'https://inplaysoft.com/2025/01/01/igaming-trends-for-2025-what-to-watch-for-in-the-upcoming-year/',
    'https://inplaysoft.com/?p=1522'
  ];

  console.log('=== URL Path Extraction Test ===');
  for (const url of testUrls) {
    const path = extractWordPressPath(url);
    console.log(`Original: ${url}`);
    console.log(`Extracted Path: ${path}`);
    console.log('---');
  }

  // Now test with actual XML data
  const xmlFilePath = 'wordpress/inplaysoft.WordPress.2025-06-07.xml';
  
  if (!fs.existsSync(xmlFilePath)) {
    console.error(`XML file not found: ${xmlFilePath}`);
    return;
  }

  const xmlData = fs.readFileSync(xmlFilePath, 'utf8');
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(xmlData);
  
  const items = result.rss.channel[0].item;
  
  console.log('\n=== Real WordPress Posts Sample ===');
  let count = 0;
  
  for (const item of items) {
    const postType = item['wp:post_type'] ? (Array.isArray(item['wp:post_type']) ? item['wp:post_type'][0] : item['wp:post_type']) : '';
    const status = item['wp:status'] ? (Array.isArray(item['wp:status']) ? item['wp:status'][0] : item['wp:status']) : '';
    const title = item.title ? (Array.isArray(item.title) ? item.title[0] : item.title) : '';
    const link = item.link ? (Array.isArray(item.link) ? item.link[0] : item.link) : '';
    
    // Only process published posts
    if (postType === 'post' && status === 'publish' && count < 5) {
      const wordpressPath = extractWordPressPath(link);
      
      console.log(`Title: ${title}`);
      console.log(`WordPress URL: ${link}`);
      console.log(`Extracted Path: ${wordpressPath}`);
      console.log(`Redirect would be: ${wordpressPath} → /blog/new-slug-here`);
      console.log('---');
      
      count++;
    }
  }

  console.log(`\n✓ Successfully tested redirect path extraction with ${count} real WordPress posts`);
}

testRedirectGeneration().catch(console.error); 