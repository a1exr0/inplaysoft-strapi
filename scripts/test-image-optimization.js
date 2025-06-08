const WordPressImporter = require('./wordpress-import');

// Test the image optimization logic
function testImageOptimization() {
  console.log('🧪 Testing Image Optimization Logic...');
  
  const importer = new WordPressImporter();
  
  // Mock WordPress image URLs (similar to what we saw in the logs)
  const testUrls = [
    'https://inplaysoft.com/wp-content/uploads/2024/07/milti-tenant-platform-1024x804-1.png',
    'https://inplaysoft.com/wp-content/uploads/2024/07/milti-tenant-platform-1024x804-1-300x236.png',
    'https://inplaysoft.com/wp-content/uploads/2024/07/milti-tenant-platform-1024x804-1-768x603.png', 
    'https://inplaysoft.com/wp-content/uploads/2024/07/milti-tenant-platform-1024x804-1-15x12.png',
    'https://inplaysoft.com/wp-content/uploads/2024/07/original-image.jpg',
    'https://inplaysoft.com/wp-content/uploads/2024/07/another-image-400x300.webp',
    'https://inplaysoft.com/wp-content/uploads/2024/07/another-image-800x600.webp'
  ];
  
  console.log(`\n📋 Input: ${testUrls.length} total image URLs`);
  testUrls.forEach((url, i) => console.log(`   ${i + 1}. ${url.split('/').pop()}`));
  
  const optimized = importer.getMainImagesOnly(testUrls);
  
  console.log(`\n✨ Output: ${optimized.length} main images selected`);
  optimized.forEach((url, i) => console.log(`   ${i + 1}. ${url.split('/').pop()}`));
  
  console.log(`\n💡 Optimization: ${testUrls.length - optimized.length} duplicate sizes skipped`);
  console.log(`   Efficiency: ${Math.round((1 - optimized.length/testUrls.length) * 100)}% reduction in uploads`);
  
  // Test base URL extraction
  console.log('\n🔍 Base URL Extraction Test:');
  const testCases = [
    'image.jpg',
    'image-300x200.jpg', 
    'image-1024x768-1.png',
    'complex-name-800x600.webp'
  ];
  
  testCases.forEach(filename => {
    const full = `https://example.com/${filename}`;
    const base = importer.getBaseImageUrl(full);
    console.log(`   ${filename} → ${base.split('/').pop()}`);
  });
  
  console.log('\n✅ Image optimization test completed!');
}

testImageOptimization(); 