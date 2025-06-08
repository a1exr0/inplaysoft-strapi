require('dotenv').config();
const FormData = require('form-data');
const fetch = require('node-fetch');

class DuplicateUploadTester {
  constructor() {
    this.baseUrl = process.env.PUBLIC_URL || 'http://localhost:1337';
    this.apiToken = process.env.STRAPI_API_TOKEN;
  }

  async testDuplicateUpload() {
    console.log('🔍 Testing Duplicate Filename Theory...\n');

    // Test the problematic WebP image
    const imageUrl = 'https://inplaysoft.com/wp-content/uploads/2024/07/sbc-summit-rio-map.webp';
    
    try {
      // Step 1: Check existing files
      await this.checkExistingFiles();
      
      // Step 2: Try upload with original name
      console.log('\n📸 Testing upload with original filename...');
      const originalResult = await this.testUploadWithName(imageUrl, 'sbc-summit-rio-map.webp');
      
      if (!originalResult.success) {
        console.log(`❌ Original name failed: ${originalResult.error}`);
        
        // Step 3: Try upload with unique name
        console.log('\n🔄 Testing upload with unique filename...');
        const timestamp = Date.now();
        const uniqueName = `sbc-summit-rio-map-${timestamp}.webp`;
        const uniqueResult = await this.testUploadWithName(imageUrl, uniqueName);
        
        if (uniqueResult.success) {
          console.log(`✅ Unique name succeeded: ${uniqueResult.data.name}`);
          console.log('\n💡 SOLUTION: The issue is duplicate filenames!');
        } else {
          console.log(`❌ Unique name also failed: ${uniqueResult.error}`);
        }
      } else {
        console.log(`✅ Original name succeeded: ${originalResult.data.name}`);
      }

    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
    }
  }

  async checkExistingFiles() {
    console.log('📋 Checking existing files in Media Library...');
    
    try {
      const response = await fetch(`${this.baseUrl}/api/upload/files`, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        }
      });

      if (!response.ok) {
        console.log(`⚠️ Cannot fetch files: ${response.status}`);
        return;
      }

      const files = await response.json();
      
      // Look for files with similar names
      const webpFiles = files.filter(file => 
        file.name.toLowerCase().includes('sbc-summit-rio-map')
      );

      console.log(`🗂️ Found ${files.length} total files`);
      console.log(`📁 Found ${webpFiles.length} files matching 'sbc-summit-rio-map':`);
      
      webpFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. "${file.name}" (ID: ${file.id})`);
        console.log(`      - URL: ${file.url}`);
        console.log(`      - Size: ${file.size} bytes`);
      });

    } catch (error) {
      console.error(`❌ Error checking files: ${error.message}`);
    }
  }

  async testUploadWithName(imageUrl, fileName) {
    try {
      // Download the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return { success: false, error: `Download failed: ${response.status}` };
      }

      const buffer = await response.buffer();
      
      // Upload with specific filename
      const formData = new FormData();
      formData.append('files', buffer, fileName);

      const uploadResponse = await fetch(`${this.baseUrl}/api/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        return {
          success: false,
          error: `HTTP ${uploadResponse.status}: ${errorText}`
        };
      }

      const data = await uploadResponse.json();
      return { success: true, data: data[0] };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Main execution
async function main() {
  const tester = new DuplicateUploadTester();
  await tester.testDuplicateUpload();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DuplicateUploadTester; 