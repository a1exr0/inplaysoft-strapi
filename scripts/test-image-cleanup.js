const WordPressImporter = require('./wordpress-import');

function testImageCleanup() {
  console.log('Testing WordPress image HTML cleanup...\n');

  const importer = new WordPressImporter();
  
  // Test cases with various WordPress image formats
  const testImages = [
    // Complex WordPress image with all attributes
    `<img width="1024" height="804" src="https://inplaysoft.com/wp-content/uploads/2024/07/milti-tenant-platform-1024x804-1.png" alt="" srcset="https://inplaysoft.com/wp-content/uploads/2024/07/milti-tenant-platform-1024x804-1.png 1024w, https://inplaysoft.com/wp-content/uploads/2024/07/milti-tenant-platform-1024x804-1-300x236.png 300w, https://inplaysoft.com/wp-content/uploads/2024/07/milti-tenant-platform-1024x804-1-768x603.png 768w" sizes="(max-width: 1024px) 100vw, 1024px" />`,
    
    // Simple image with just width/height
    `<img width="500" height="300" src="https://inplaysoft.com/wp-content/uploads/2024/07/test-image.jpg" alt="Test image" />`,
    
    // Image with existing style
    `<img width="800" height="600" src="https://inplaysoft.com/wp-content/uploads/2024/07/styled-image.png" alt="Styled" style="border: 1px solid #ccc;" />`,
    
    // Image with class and other attributes
    `<img class="wp-image-123" width="640" height="480" src="https://inplaysoft.com/wp-content/uploads/2024/07/class-image.jpg" alt="Class image" srcset="multiple sizes here" sizes="responsive sizes" />`
  ];

  console.log('=== Original vs Cleaned Image Tags ===\n');
  
  testImages.forEach((originalImage, index) => {
    console.log(`Test ${index + 1}:`);
    console.log('BEFORE:');
    console.log(originalImage);
    console.log('\nAFTER:');
    
    const cleaned = importer.cleanHtmlContent(originalImage);
    console.log(cleaned);
    console.log('\n' + '='.repeat(80) + '\n');
  });

  // Test with a complete HTML content block
  const fullContent = `
    <p>This is a test article with multiple images.</p>
    <img width="1024" height="804" src="https://inplaysoft.com/wp-content/uploads/2024/07/milti-tenant-platform-1024x804-1.png" alt="" srcset="https://inplaysoft.com/wp-content/uploads/2024/07/milti-tenant-platform-1024x804-1.png 1024w, https://inplaysoft.com/wp-content/uploads/2024/07/milti-tenant-platform-1024x804-1-300x236.png 300w" sizes="(max-width: 1024px) 100vw, 1024px" />
    <p>Some text between images.</p>
    <img width="500" height="300" src="https://inplaysoft.com/wp-content/uploads/2024/07/another-image.jpg" alt="Another image" class="aligncenter" />
    <p>End of content.</p>
  `;

  console.log('=== Full Content Test ===\n');
  console.log('ORIGINAL CONTENT:');
  console.log(fullContent);
  console.log('\nCLEANED CONTENT:');
  console.log(importer.cleanHtmlContent(fullContent));

  console.log('\n✓ Image cleanup test completed!');
}

testImageCleanup(); 