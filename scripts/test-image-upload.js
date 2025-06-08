require('dotenv').config();
const FormData = require('form-data');
const fetch = require('node-fetch');

class ImageUploadTester {
  constructor() {
    this.baseUrl = process.env.PUBLIC_URL || 'http://localhost:1337';
    this.apiToken = process.env.STRAPI_API_TOKEN;
  }

  async testImageUploads() {
    console.log('🧪 Testing Image Upload Issues...\n');

    const testImages = [
      {
        name: 'WebP Image (failing)',
        url: 'https://inplaysoft.com/wp-content/uploads/2024/07/sbc-summit-rio-map.webp'
      },
      {
        name: 'PNG Image (working)',
        url: 'https://f7v.8d6.myftpupload.com/wp-content/uploads/2024/07/milti-tenant-platform-1024x804-1.png'
      },
      {
        name: 'JPEG Image (working)',
        url: 'https://f7v.8d6.myftpupload.com/wp-content/uploads/2024/07/Multi-vs-Classic.jpg'
      }
    ];

    for (const image of testImages) {
      console.log(`\n📸 Testing: ${image.name}`);
      console.log(`🔗 URL: ${image.url}`);
      
      try {
        // Step 1: Test download
        const downloadResult = await this.testImageDownload(image.url);
        if (!downloadResult.success) {
          console.log(`❌ Download failed: ${downloadResult.error}`);
          continue;
        }

        console.log(`✅ Download successful:`);
        console.log(`   - Size: ${downloadResult.size} bytes`);
        console.log(`   - Type: ${downloadResult.contentType}`);
        console.log(`   - Format: ${downloadResult.format}`);

        // Step 2: Test upload
        const uploadResult = await this.testImageUpload(image.url, downloadResult.buffer);
        if (uploadResult.success) {
          console.log(`✅ Upload successful: ${uploadResult.data.name}`);
        } else {
          console.log(`❌ Upload failed: ${uploadResult.error}`);
          
          // Additional diagnostics for failed uploads
          await this.diagnoseUploadFailure(downloadResult);
        }

      } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
      }
    }

    // Test upload limits and configuration
    await this.testUploadConfiguration();
  }

  async testImageDownload(imageUrl) {
    try {
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${response.statusText}` 
        };
      }

      const buffer = await response.buffer();
      const contentType = response.headers.get('content-type') || 'unknown';
      
      // Determine format from URL and content type
      const format = this.getImageFormat(imageUrl, contentType);

      return {
        success: true,
        buffer,
        size: buffer.length,
        contentType,
        format
      };

    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async testImageUpload(originalUrl, buffer) {
    try {
      const fileName = originalUrl.split('/').pop();
      const formData = new FormData();
      
      formData.append('files', buffer, fileName);

      const response = await fetch(`${this.baseUrl}/api/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          status: response.status
        };
      }

      const data = await response.json();
      return { success: true, data: data[0] };

    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async diagnoseUploadFailure(downloadResult) {
    console.log('\n🔍 Diagnosing upload failure...');

    // Check file size limits
    const sizeMB = downloadResult.size / (1024 * 1024);
    console.log(`   📏 File size: ${sizeMB.toFixed(2)} MB`);
    
    if (sizeMB > 10) {
      console.log('   ⚠️  File might be too large (>10MB)');
    }

    // Check format support
    console.log(`   🎨 Format: ${downloadResult.format}`);
    
    if (downloadResult.format === 'webp') {
      console.log('   ⚠️  WebP format might not be supported by Strapi');
      console.log('   💡 Consider converting WebP to PNG/JPEG');
    }

    // Check content type
    console.log(`   📋 Content-Type: ${downloadResult.contentType}`);
    
    if (!downloadResult.contentType.startsWith('image/')) {
      console.log('   ⚠️  Invalid content type for image');
    }

    // Test with smaller/converted image
    if (downloadResult.format === 'webp') {
      console.log('\n🔄 Testing potential solution: Convert WebP to PNG');
      // We'll suggest this solution
    }
  }

  async testUploadConfiguration() {
    console.log('\n⚙️  Testing Upload Configuration...');

    try {
      // Test upload endpoint accessibility
      const response = await fetch(`${this.baseUrl}/api/upload`, {
        method: 'OPTIONS',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        }
      });

      console.log(`📡 Upload endpoint status: ${response.status}`);

      // Check headers for any CORS or other issues
      const allowedMethods = response.headers.get('allow') || 'Not specified';
      console.log(`📋 Allowed methods: ${allowedMethods}`);

    } catch (error) {
      console.error(`❌ Upload endpoint test failed: ${error.message}`);
    }
  }

  getImageFormat(url, contentType) {
    // Check URL extension first
    const urlLower = url.toLowerCase();
    if (urlLower.endsWith('.webp')) return 'webp';
    if (urlLower.endsWith('.png')) return 'png';
    if (urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg')) return 'jpeg';
    if (urlLower.endsWith('.gif')) return 'gif';

    // Fallback to content type
    if (contentType.includes('webp')) return 'webp';
    if (contentType.includes('png')) return 'png';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpeg';
    if (contentType.includes('gif')) return 'gif';

    return 'unknown';
  }
}

// Main execution
async function main() {
  const tester = new ImageUploadTester();
  await tester.testImageUploads();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ImageUploadTester; 