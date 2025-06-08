const fs = require('fs');
const xml2js = require('xml2js');

async function testXMLParsing() {
  console.log('Testing XML parsing...');
  
  const xmlFilePath = 'wordpress/inplaysoft.WordPress.2025-06-07.xml';
  
  if (!fs.existsSync(xmlFilePath)) {
    console.error(`XML file not found: ${xmlFilePath}`);
    return;
  }

  try {
    // Read and parse XML
    const xmlData = fs.readFileSync(xmlFilePath, 'utf8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);
    
    const channel = result.rss.channel[0];
    const items = channel.item || [];
    
    console.log(`✓ Found ${items.length} items in XML`);
    
    // Analyze first few items
    let newsCount = 0;
    let insightsCount = 0;
    let otherCount = 0;
    
    for (let i = 0; i < Math.min(items.length, 10); i++) {
      const item = items[i];
      const postType = getFieldValue(item, 'wp:post_type');
      
      if (postType !== 'post') continue;
      
      const title = getFieldValue(item, 'title');
      const status = getFieldValue(item, 'wp:status');
      
      if (status !== 'publish') continue;
      
      const categories = extractCategories(item);
      const primaryCategory = categories.find(cat => cat.domain === 'category');
      
      console.log(`Item ${i + 1}: ${title}`);
      console.log(`  Category: ${primaryCategory ? primaryCategory.nicename : 'none'}`);
      
      if (primaryCategory) {
        if (primaryCategory.nicename === 'news') {
          newsCount++;
        } else if (primaryCategory.nicename === 'insights') {
          insightsCount++;
        } else {
          otherCount++;
        }
      }
    }
    
    console.log(`\nSample analysis (first 10 published posts):`);
    console.log(`- News articles: ${newsCount}`);
    console.log(`- Insights articles: ${insightsCount}`);
    console.log(`- Other categories: ${otherCount}`);
    
    // Count all posts
    let totalNews = 0;
    let totalInsights = 0;
    let totalOther = 0;
    let totalPublished = 0;
    
    for (const item of items) {
      const postType = getFieldValue(item, 'wp:post_type');
      if (postType !== 'post') continue;
      
      const status = getFieldValue(item, 'wp:status');
      if (status !== 'publish') continue;
      
      totalPublished++;
      
      const categories = extractCategories(item);
      const primaryCategory = categories.find(cat => cat.domain === 'category');
      
      if (primaryCategory) {
        if (primaryCategory.nicename === 'news') {
          totalNews++;
        } else if (primaryCategory.nicename === 'insights') {
          totalInsights++;
        } else {
          totalOther++;
        }
      }
    }
    
    console.log(`\nTotal counts:`);
    console.log(`- Total published posts: ${totalPublished}`);
    console.log(`- Total News articles: ${totalNews}`);
    console.log(`- Total Insights articles: ${totalInsights}`);
    console.log(`- Total Other categories: ${totalOther}`);
    
    // Find images
    let imageCount = 0;
    for (let i = 0; i < Math.min(items.length, 5); i++) {
      const item = items[i];
      const content = getFieldValue(item, 'content:encoded');
      const imageRegex = /https:\/\/inplaysoft\.com\/wp-content\/uploads\/[^"'\s)]+\.(jpg|jpeg|png|gif|webp)/gi;
      const matches = content.match(imageRegex);
      if (matches) {
        imageCount += matches.length;
        console.log(`First article has ${matches.length} images`);
        break;
      }
    }
    
    console.log(`\n✓ XML parsing test completed successfully!`);
    
  } catch (error) {
    console.error('✗ XML parsing failed:', error.message);
  }
}

function getFieldValue(item, fieldName) {
  const field = item[fieldName];
  if (!field) return '';
  return Array.isArray(field) ? field[0] : field;
}

function extractCategories(item) {
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

testXMLParsing().catch(console.error); 