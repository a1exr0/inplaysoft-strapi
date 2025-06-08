require('dotenv').config();
const FormData = require('form-data');
const fetch = require('node-fetch');

class UploadResponseDebugger {
  constructor() {
    this.baseUrl = process.env.PUBLIC_URL || 'http://localhost:1337';
    this.apiToken = process.env.STRAPI_API_TOKEN;
  }

  async debugUploadResponse() {
    console.log('🐛 Debugging Upload Response...\n');

    const imageUrl = 'https://inplaysoft.com/wp-content/uploads/2024/07/sbc-summit-rio-map.webp';
    const timestamp = Date.now();
    const fileName = `debug-upload-${timestamp}.webp`;

    try {
      console.log(`📸 Testing upload: ${fileName}`);
      console.log(`🔗 Source URL: ${imageUrl}`);

      // Step 1: Download the image
      console.log('\n📥 Step 1: Downloading image...');
      const downloadResponse = await fetch(imageUrl);
      console.log(`   Status: ${downloadResponse.status} ${downloadResponse.statusText}`);
      console.log(`   Content-Type: ${downloadResponse.headers.get('content-type')}`);
      console.log(`   Content-Length: ${downloadResponse.headers.get('content-length')}`);

      if (!downloadResponse.ok) {
        console.log('❌ Download failed');
        return;
      }

      const buffer = await downloadResponse.buffer();
      console.log(`   ✅ Downloaded: ${buffer.length} bytes`);

      // Step 2: Upload to Strapi with detailed logging
      console.log('\n📤 Step 2: Uploading to Strapi...');
      
      const formData = new FormData();
      formData.append('files', buffer, fileName);

      console.log(`   📋 FormData created with filename: ${fileName}`);
      console.log(`   🎯 Target URL: ${this.baseUrl}/api/upload`);
      console.log(`   🔑 Using API Token: ${this.apiToken ? 'YES' : 'NO'}`);

      const uploadResponse = await fetch(`${this.baseUrl}/api/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
        body: formData,
      });

      // Detailed response logging
      console.log(`\n📊 Upload Response Details:`);
      console.log(`   Status Code: ${uploadResponse.status}`);
      console.log(`   Status Text: ${uploadResponse.statusText}`);
      console.log(`   OK Flag: ${uploadResponse.ok}`);
      
      // Log all response headers
      console.log(`   Response Headers:`);
      for (const [key, value] of uploadResponse.headers.entries()) {
        console.log(`     ${key}: ${value}`);
      }

      // Get response body as text first to see raw content
      const responseText = await uploadResponse.text();
      console.log(`   Response Body (raw): ${responseText}`);

      // Try to parse as JSON
      let responseData = null;
      try {
        responseData = JSON.parse(responseText);
        console.log(`   Response Body (parsed):`, JSON.stringify(responseData, null, 2));
      } catch (parseError) {
        console.log(`   ⚠️ JSON Parse Error: ${parseError.message}`);
      }

      // Analysis
      console.log(`\n🔍 Analysis:`);
      if (uploadResponse.ok) {
        console.log(`   ✅ HTTP Status indicates SUCCESS`);
        if (responseData && Array.isArray(responseData) && responseData.length > 0) {
          console.log(`   ✅ Response contains file data`);
          console.log(`   📁 Uploaded file: ${responseData[0].name}`);
          console.log(`   🆔 File ID: ${responseData[0].id}`);
          console.log(`   🔗 File URL: ${responseData[0].url}`);
        } else if (responseData && responseData.data) {
          console.log(`   ✅ Response contains data object`);
          console.log(`   📊 Data:`, responseData.data);
        } else {
          console.log(`   ⚠️ Unexpected response format`);
        }
      } else {
        console.log(`   ❌ HTTP Status indicates FAILURE`);
        if (responseData && responseData.error) {
          console.log(`   📋 Error Details:`, responseData.error);
        }
      }

      // Verify file was actually created
      console.log(`\n🔍 Verification: Checking if file exists in Media Library...`);
      await this.verifyFileExists(fileName);

    } catch (error) {
      console.error(`❌ Debug failed: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    }
  }

  async verifyFileExists(fileName) {
    try {
      const response = await fetch(`${this.baseUrl}/api/upload/files`, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        }
      });

      if (response.ok) {
        const files = await response.json();
        const uploadedFile = files.find(file => file.name === fileName);
        
        if (uploadedFile) {
          console.log(`   ✅ File found in Media Library: ${uploadedFile.name}`);
          console.log(`   🔗 URL: ${uploadedFile.url}`);
          return true;
        } else {
          console.log(`   ❌ File NOT found in Media Library`);
          return false;
        }
      } else {
        console.log(`   ⚠️ Cannot verify - API error: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.log(`   ⚠️ Verification failed: ${error.message}`);
      return null;
    }
  }
}

// Main execution
async function main() {
  const uploader = new UploadResponseDebugger();
  await uploader.debugUploadResponse();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = UploadResponseDebugger; 