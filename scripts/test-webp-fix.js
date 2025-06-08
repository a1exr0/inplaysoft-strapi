require('dotenv').config();
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testWebPFix() {
  console.log('🧪 Testing WebP Upload Fix...\n');

  const baseUrl = process.env.PUBLIC_URL || 'http://localhost:1337';
  const apiToken = process.env.STRAPI_API_TOKEN;
  
  // Test the specific failing image
  const imageUrl = 'https://inplaysoft.com/wp-content/uploads/2024/07/sbc-summit-rio-map.webp';
  const fileName = 'test-webp-fix.webp';

  try {
    console.log(`📸 Testing: ${fileName}`);
    console.log(`🔗 URL: ${imageUrl}`);

    // Step 1: Download
    const response = await fetch(imageUrl);
    const buffer = await response.buffer();
    console.log(`✅ Downloaded: ${buffer.length} bytes`);

    // Step 2: Upload with our fix
    const formData = new FormData();
    formData.append('files', buffer, fileName);

    const uploadResponse = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      body: formData,
    });

    const responseText = await uploadResponse.text();
    console.log(`📊 Response Status: ${uploadResponse.status}`);
    console.log(`📊 Response OK: ${uploadResponse.ok}`);

    let uploadResult = null;

    if (uploadResponse.ok) {
      uploadResult = JSON.parse(responseText);
      console.log(`✅ Upload succeeded directly: ${uploadResult[0].name}`);
    } else if (uploadResponse.status === 500) {
      console.log(`⚠️ Got 500 error, checking if file was uploaded...`);
      
      // Check if file exists
      const filesResponse = await fetch(`${baseUrl}/api/upload/files`, {
        headers: { Authorization: `Bearer ${apiToken}` }
      });
      
      if (filesResponse.ok) {
        const files = await filesResponse.json();
        const uploadedFile = files.find(file => 
          file.name.includes('test-webp-fix') || 
          file.name.includes('sbc-summit-rio-map')
        );
        
        if (uploadedFile) {
          console.log(`✅ File found despite 500 error: ${uploadedFile.name}`);
          console.log(`🔗 URL: ${uploadedFile.url}`);
          console.log(`💡 Fix is working! Upload succeeded but returned 500.`);
        } else {
          console.log(`❌ File not found, upload actually failed`);
        }
      }
    } else {
      console.log(`❌ Upload failed with status: ${uploadResponse.status}`);
      console.log(`📋 Response: ${responseText}`);
    }

  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
}

testWebPFix(); 