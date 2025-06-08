require('dotenv').config();
// Load production environment configuration
const { loadProductionEnv } = require('./load-production-env');
loadProductionEnv();

const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

class WordPressImporterFixed {
  constructor() {
    this.baseUrl = process.env.PUBLIC_URL || 'http://localhost:1337';
    this.apiToken = process.env.STRAPI_API_TOKEN;
    this.defaultAuthor = null;
    this.categories = new Map();
    this.knowledgebaseCategories = new Map();
    this.processedSlugs = new Set(); // Track processed slugs to prevent duplicates
    this.redirects = [];
    this.attachmentMap = {}; // Map of post_id -> attachment URLs
  }

  async initialize() {
    if (!this.apiToken) {
      throw new Error('STRAPI_API_TOKEN is required. Please set it in your .env file.');
    }
    
    console.log('WordPress Importer initialized');
    console.log(`Target URL: ${this.baseUrl}`);
  }

  async importFromXML(xmlFilePath) {
    console.log('🚀 Starting WordPress XML import...');
    
    try {
      // DON'T clear processed slugs - keep them to prevent duplicates across runs
      // this.processedSlugs.clear();
      
      // Read and parse XML
      const xmlData = fs.readFileSync(xmlFilePath, 'utf8');
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xmlData);
      
      const channel = result.rss.channel[0];
      const items = channel.item || [];
      
      console.log(`📄 Found ${items.length} items in XML`);
      
      // Initialize authentication
      await this.initialize();
      
      // Create default author
      await this.createDefaultAuthor();
      
      // Build attachment map (attachment post_id -> parent post_id -> attachment URLs)
      console.log(`📎 Building attachment map...`);
      this.attachmentMap = this.buildAttachmentMap(items);
      console.log(`📎 Found ${Object.keys(this.attachmentMap).length} posts with attachments`);
      
      // Filter and count published posts
      const publishedPosts = items.filter(item => {
        const postType = this.getFieldValue(item, 'wp:post_type');
        const status = this.getFieldValue(item, 'wp:status');
        return postType === 'post' && status === 'publish';
      });
      
      console.log(`📝 Found ${publishedPosts.length} published posts to import`);
      
      // Process all items
      let processedCount = 0;
      let skippedCount = 0;
      
      for (const item of publishedPosts) {
        const result = await this.processItem(item);
        if (result) {
          processedCount++;
        } else {
          skippedCount++;
        }
      }
      
      // Generate redirects file
      await this.generateRedirectsFile();
      
      console.log('\n✅ Import completed successfully!');
      console.log(`📊 Statistics:`);
      console.log(`   - Processed: ${processedCount}`);
      console.log(`   - Skipped: ${skippedCount}`);
      console.log(`   - Redirects: ${this.redirects.length}`);
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      throw error;
    }
  }

  async processItem(item) {
    const title = this.getFieldValue(item, 'title');
    const content = this.getFieldValue(item, 'content:encoded');
    const excerpt = this.getFieldValue(item, 'excerpt:encoded');
    const pubDate = this.getFieldValue(item, 'pubDate');
    const postDate = this.getFieldValue(item, 'wp:post_date');
    const modifiedDate = this.getFieldValue(item, 'wp:post_modified');
    const slug = this.getFieldValue(item, 'wp:post_name');
    const originalLink = this.getFieldValue(item, 'link');
    
    // Skip if no title or already processed
    if (!title || !title.trim()) {
      console.log(`⚠️ Skipping item with no title`);
      return false;
    }
    
    // Check in-memory tracking first (for efficiency)
    if (this.processedSlugs.has(slug)) {
      console.log(`⚠️ Skipping duplicate slug (in-memory): ${slug}`);
      return false;
    }
    
    // Get categories to determine if it's an article or knowledgebase entry
    const categories = this.extractCategories(item);
    const primaryCategory = categories.find(cat => cat.domain === 'category');
    const categoryName = primaryCategory ? primaryCategory.nicename : 'insights';
    
    // Check database for existing posts
    try {
      let existingPost = null;
      if (categoryName === 'news') {
        const existingArticles = await this.strapiRequest('GET', `/api/articles?filters[slug][$eq]=${slug}`);
        existingPost = existingArticles.data && existingArticles.data.length > 0 ? existingArticles.data[0] : null;
      } else {
        const existingEntries = await this.strapiRequest('GET', `/api/knowledgebases?filters[slug][$eq]=${slug}`);
        existingPost = existingEntries.data && existingEntries.data.length > 0 ? existingEntries.data[0] : null;
      }
      
      if (existingPost) {
        console.log(`⚠️ Skipping - ${categoryName === 'news' ? 'Article' : 'Knowledgebase entry'} already exists: ${slug} (ID: ${existingPost.id})`);
        // Mark as processed and add to redirects
        this.processedSlugs.add(slug);
        const wordpressPath = this.extractWordPressPath(originalLink);
        this.redirects.push({
          from: wordpressPath,
          to: `/${categoryName === 'news' ? 'blog' : 'knowledgebase'}/${slug}`,
          type: 'permanent'
        });
        return true; // Consider it successful since it exists
      }
    } catch (error) {
      console.error(`   ❌ Error checking for existing post with slug ${slug}:`, error.message);
      // Continue with creation attempt
    }
    
    console.log(`\n🔄 Processing: ${title}`);
    console.log(`   Category: ${categoryName}${!primaryCategory ? ' (default - no category found)' : ''}`);
    console.log(`   Original date: ${postDate || pubDate}`);

    // Mark as processed immediately to prevent duplicates
    this.processedSlugs.add(slug);

    try {
      // Priority 1: Check for WordPress post attachments (most reliable)
      const postId = this.getFieldValue(item, 'wp:post_id');
      let coverImage = null;
      
      if (this.attachmentMap[postId] && this.attachmentMap[postId].length > 0) {
        console.log(`   📎 Found ${this.attachmentMap[postId].length} WordPress attachments`);
        const firstAttachment = this.attachmentMap[postId][0];
        console.log(`   📎 Using attachment: ${firstAttachment.title}`);
        coverImage = await this.downloadAndUploadImage(firstAttachment.url);
        if (coverImage) {
          console.log(`   ✅ Uploaded WordPress attachment as cover`);
        }
      }
      
      // Priority 2: Extract images from content (if no attachment cover found)
      if (!coverImage) {
        console.log(`   📷 Extracting images from content...`);
        const images = await this.extractAndUploadImages(content);
        console.log(`   📷 Found ${images.length} images in content`);
        coverImage = images.length > 0 ? images[0] : null;
      }
      
      // Priority 3: Check for Elementor cover image (fallback)
      if (!coverImage) {
        console.log(`   🔍 Checking for Elementor cover image...`);
        coverImage = await this.extractElementorCoverImage(item);
        if (coverImage) {
          console.log(`   ✅ Found Elementor cover image`);
        }
      }

      // Clean and convert content
      const cleanContent = this.cleanHtmlContent(content);
      
      // Create content based on category
      let success = false;
      if (categoryName === 'news') {
        success = await this.createArticle({
          title,
          content: cleanContent,
          excerpt,
          slug,
          coverImage,
          pubDate,
          postDate,
          modifiedDate,
          originalLink,
          originalSlug: slug
        });
      } else {
        // Default all other categories (including 'insights' and no category) to knowledgebase
        if (categoryName !== 'insights') {
          console.log(`   📚 Unsupported category '${categoryName}' - adding to knowledgebase`);
        }
        success = await this.createKnowledgebaseEntry({
          title,
          content: cleanContent,
          excerpt,
          slug,
          coverImage,
          pubDate,
          postDate,
          modifiedDate,
          originalLink,
          originalSlug: slug
        });
      }
      
      return success;
      
    } catch (error) {
      console.error(`   ❌ Failed to process item: ${title}`, error.message);
      return false;
    }
  }

  async createArticle(data) {
    try {
      // Check if article already exists in database
      const existingArticles = await this.strapiRequest('GET', `/api/articles?filters[slug][$eq]=${data.slug}`);
      
      if (existingArticles.data && existingArticles.data.length > 0) {
        console.log(`   ⚠️ Article already exists with slug: ${data.slug} (ID: ${existingArticles.data[0].id})`);
        // Still add to redirects if needed
        const wordpressPath = this.extractWordPressPath(data.originalLink);
        this.redirects.push({
          from: wordpressPath,
          to: `/blog/${data.slug}`,
          type: 'permanent'
        });
        return true; // Consider it successful since it exists
      }

      // Create or get category
      const categoryId = await this.createOrGetCategory('News', 'news');
      
      // Prepare article data with original WordPress dates
      const originalDate = this.parseWordPressDate(data.postDate || data.pubDate);
      
      const articleData = {
        title: data.title,
        description: (data.excerpt || data.title).substring(0, 80),
        slug: this.generateUniqueSlug(data.slug),
        cover: data.coverImage?.id || null,
        author: this.defaultAuthor.id,
        category: categoryId,
        blocks: [
          {
            __component: 'shared.rich-text',
            body: data.content
          }
        ],
        publishedAt: originalDate.toISOString(),
        seo: {
          metaTitle: data.title,
          metaDescription: data.excerpt || data.title.substring(0, 160)
        }
      };

      console.log(`   📝 Creating article with cover: ${data.coverImage ? 'YES' : 'NO'}`);

      // Create article via Strapi API
      const response = await this.strapiRequest('POST', '/api/articles', {
        data: articleData
      });

      if (response && response.data) {
        // Extract WordPress URL path for redirect
        const wordpressPath = this.extractWordPressPath(data.originalLink);
        this.redirects.push({
          from: wordpressPath,
          to: `/blog/${articleData.slug}`,
          type: 'permanent'
        });
        console.log(`   ✅ Created article: ${data.title} (ID: ${response.data.id})`);
        return true;
      }

    } catch (error) {
      console.error(`   ❌ Failed to create article: ${data.title}`, error.message);
      return false;
    }
  }

  async createKnowledgebaseEntry(data) {
    try {
      // Check if knowledgebase entry already exists in database
      const existingEntries = await this.strapiRequest('GET', `/api/knowledgebases?filters[slug][$eq]=${data.slug}`);
      
      if (existingEntries.data && existingEntries.data.length > 0) {
        console.log(`   ⚠️ Knowledgebase entry already exists with slug: ${data.slug} (ID: ${existingEntries.data[0].id})`);
        // Still add to redirects if needed
        const wordpressPath = this.extractWordPressPath(data.originalLink);
        this.redirects.push({
          from: wordpressPath,
          to: `/knowledgebase/${data.slug}`,
          type: 'permanent'
        });
        return true; // Consider it successful since it exists
      }

      // Create or get knowledgebase category
      const categoryId = await this.createOrGetKnowledgebaseCategory('Insights', 'insights');
      
      // Prepare knowledgebase data with original WordPress dates
      const originalDate = this.parseWordPressDate(data.postDate || data.pubDate);
      
      const kbData = {
        title: data.title,
        description: (data.excerpt || data.title).substring(0, 80),
        slug: this.generateUniqueSlug(data.slug),
        cover: data.coverImage?.id || null,
        author: this.defaultAuthor.id,
        knowledgebase_category: categoryId,
        blocks: [
          {
            __component: 'shared.rich-text',
            body: data.content
          }
        ],
        publishedAt: originalDate.toISOString(),
        seo: {
          metaTitle: data.title,
          metaDescription: data.excerpt || data.title.substring(0, 160)
        }
      };

      console.log(`   📚 Creating knowledgebase with cover: ${data.coverImage ? 'YES' : 'NO'}`);

      // Create knowledgebase entry via Strapi API
      const response = await this.strapiRequest('POST', '/api/knowledgebases', {
        data: kbData
      });

      if (response && response.data) {
        // Extract WordPress URL path for redirect
        const wordpressPath = this.extractWordPressPath(data.originalLink);
        this.redirects.push({
          from: wordpressPath,
          to: `/knowledgebase/${kbData.slug}`,
          type: 'permanent'
        });
        console.log(`   ✅ Created knowledgebase: ${data.title} (ID: ${response.data.id})`);
        return true;
      }

    } catch (error) {
      console.error(`   ❌ Failed to create knowledgebase entry: ${data.title}`, error.message);
      return false;
    }
  }

  async createDefaultAuthor() {
    try {
      // Check if default author exists
      const authors = await this.strapiRequest('GET', '/api/authors?filters[name][$eq]=InplaySoft');
      
      if (authors.data && authors.data.length > 0) {
        this.defaultAuthor = authors.data[0];
        console.log('✅ Using existing default author');
        return;
      }

      // Create default author
      const authorData = {
        name: 'InplaySoft',
        position: 'Content Team',
        team: 'Marketing'
      };

      const response = await this.strapiRequest('POST', '/api/authors', {
        data: authorData
      });

      if (response && response.data) {
        this.defaultAuthor = response.data;
        console.log('✅ Created default author');
      }

    } catch (error) {
      console.error('❌ Failed to create default author:', error);
    }
  }

  async createOrGetCategory(name, slug) {
    if (this.categories.has(slug)) {
      return this.categories.get(slug);
    }

    try {
      // Check if category exists
      const categories = await this.strapiRequest('GET', `/api/categories?filters[slug][$eq]=${slug}`);
      
      if (categories.data && categories.data.length > 0) {
        const categoryId = categories.data[0].id;
        this.categories.set(slug, categoryId);
        return categoryId;
      }

      // Create new category
      const categoryData = {
        name,
        slug,
        description: name
      };

      const response = await this.strapiRequest('POST', '/api/categories', {
        data: categoryData
      });

      if (response && response.data) {
        const categoryId = response.data.id;
        this.categories.set(slug, categoryId);
        console.log(`✅ Created category: ${name}`);
        return categoryId;
      }

    } catch (error) {
      console.error(`❌ Failed to create/get category: ${name}`, error);
      return null;
    }
  }

  async createOrGetKnowledgebaseCategory(name, slug) {
    if (this.knowledgebaseCategories.has(slug)) {
      return this.knowledgebaseCategories.get(slug);
    }

    try {
      // Check if category exists
      const categories = await this.strapiRequest('GET', `/api/knowledgebase-categories?filters[slug][$eq]=${slug}`);
      
      if (categories.data && categories.data.length > 0) {
        const categoryId = categories.data[0].id;
        this.knowledgebaseCategories.set(slug, categoryId);
        return categoryId;
      }

      // Create new category
      const categoryData = {
        name,
        slug,
        description: name
      };

      const response = await this.strapiRequest('POST', '/api/knowledgebase-categories', {
        data: categoryData
      });

      if (response && response.data) {
        const categoryId = response.data.id;
        this.knowledgebaseCategories.set(slug, categoryId);
        console.log(`✅ Created knowledgebase category: ${name}`);
        return categoryId;
      }

    } catch (error) {
      console.error(`❌ Failed to create/get knowledgebase category: ${name}`, error);
      return null;
    }
  }

  async extractAndUploadImages(content) {
    if (!content || !content.includes('<img')) {
      return [];
    }

    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const imageUrls = [];
    let match;

    while ((match = imgRegex.exec(content)) !== null) {
      imageUrls.push(match[1]);
    }

    if (imageUrls.length === 0) {
      return [];
    }

    // Get only main images (no WordPress auto-generated sizes)
    const mainImages = this.getMainImagesOnly(imageUrls);
    console.log(`     📷 Processing ${mainImages.length} main images (filtered from ${imageUrls.length} total)`);

    const uploadedImages = [];
    for (const imageUrl of mainImages) {
      try {
        const uploadedImage = await this.downloadAndUploadImage(imageUrl);
        if (uploadedImage) {
          uploadedImages.push(uploadedImage);
          console.log(`     ✅ Uploaded: ${uploadedImage.name}`);
        }
      } catch (error) {
        console.error(`     ❌ Failed to upload image: ${imageUrl}`, error.message);
      }
    }

    return uploadedImages;
  }

  getMainImagesOnly(imageUrls) {
    const mainImages = [];
    const processedBaseUrls = new Set();

    for (const url of imageUrls) {
      const baseUrl = this.getBaseImageUrl(url);
      
      if (!processedBaseUrls.has(baseUrl)) {
        mainImages.push(url);
        processedBaseUrls.add(baseUrl);
      }
    }

    return mainImages;
  }

  getBaseImageUrl(url) {
    // Remove WordPress size suffixes like -300x200, -150x150, etc.
    return url.replace(/-\d+x\d+(\.[^.]+)$/, '$1');
  }

  parseWordPressDate(dateString) {
    if (!dateString) {
      return new Date();
    }

    // Handle various WordPress date formats
    const formats = [
      dateString, // Try as-is first
      dateString.replace(' ', 'T'), // Convert space to T for ISO format
      dateString + 'Z' // Add timezone if missing
    ];

    for (const format of formats) {
      const date = new Date(format);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    console.warn(`Failed to parse date: ${dateString}, using current date`);
    return new Date();
  }

  async downloadAndUploadImage(imageUrl) {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      const fileName = path.basename(new URL(imageUrl).pathname);
      
      // Create form data
      const formData = new FormData();
      const blob = new Blob([buffer], { type: response.headers.get('content-type') || 'image/jpeg' });
      formData.append('files', blob, fileName);

      // Upload to Strapi
      const uploadResponse = await this.strapiUploadRequest('/api/upload', formData);
      
      if (uploadResponse && uploadResponse[0]) {
        return uploadResponse[0];
      }

      // If uploadResponse is null (500 error case), try to find the uploaded file
      if (uploadResponse === null) {
        console.log(`🔍 Checking if file was uploaded despite 500 error: ${fileName}`);
        const uploadedFile = await this.findUploadedFile(fileName);
        if (uploadedFile) {
          console.log(`✅ File found in media library: ${uploadedFile.name}`);
          return uploadedFile;
        } else {
          console.log(`❌ File not found in media library`);
        }
      }

      return null;
    } catch (error) {
      console.error(`Failed to download/upload image: ${imageUrl}`, error.message);
      return null;
    }
  }

  async findUploadedFile(fileName) {
    try {
      const response = await fetch(`${this.baseUrl}/api/upload/files`, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        }
      });

      if (!response.ok) {
        return null;
      }

      const files = await response.json();
      
      // Look for exact filename match or similar (Strapi may modify filename)
      return files.find(file => 
        file.name === fileName || 
        file.name.includes(fileName.split('.')[0]) // Match base name
      );
    } catch (error) {
      return null;
    }
  }

  cleanHtmlContent(content) {
    if (!content) return '';

    // Remove WordPress-specific attributes from img tags
    content = content.replace(
      /<img([^>]*)\s+(width|height|srcset|sizes)="[^"]*"([^>]*)/gi,
      '<img$1$3'
    );

    // Add responsive styling to img tags
    content = content.replace(
      /<img([^>]*?)(?:\s+style="[^"]*")?([^>]*?)>/gi,
      '<img$1 style="max-width: 100%; height: auto;"$2>'
    );

    // Clean up multiple spaces and empty attributes
    content = content.replace(/\s+/g, ' ');
    content = content.replace(/\s+>/g, '>');

    return content.trim();
  }

  extractCategories(item) {
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

  getFieldValue(item, fieldName) {
    const field = item[fieldName];
    if (!field) return '';
    return Array.isArray(field) ? field[0] : field;
  }

  generateUniqueSlug(originalSlug) {
    // Simple implementation - could be enhanced with uniqueness checking
    return originalSlug || `post-${Date.now()}`;
  }

  extractWordPressPath(originalLink) {
    if (!originalLink) return '/';
    
    try {
      const url = new URL(originalLink);
      return url.pathname;
    } catch (error) {
      return '/';
    }
  }

  async extractElementorCoverImage(item) {
    try {
      const postMeta = item['wp:postmeta'];
      if (!postMeta) return null;

      // Find _elementor_data meta
      const elementorMeta = postMeta.find(meta => 
        this.getFieldValue(meta, 'wp:meta_key') === '_elementor_data'
      );

      if (!elementorMeta) return null;

      const elementorData = this.getFieldValue(elementorMeta, 'wp:meta_value');
      if (!elementorData) return null;

      // Parse Elementor JSON
      const parsedData = JSON.parse(elementorData);
      const backgroundImageUrl = this.findElementorBackgroundImage(parsedData);

      if (backgroundImageUrl) {
        console.log(`     🎨 Found Elementor background image: ${backgroundImageUrl}`);
        return await this.downloadAndUploadImage(backgroundImageUrl);
      }

      return null;
    } catch (error) {
      // Silent fail for Elementor extraction
      return null;
    }
  }

  findElementorBackgroundImage(elementorData) {
    if (!elementorData || typeof elementorData !== 'object') return null;

    // Recursive search for background_image.url
    if (elementorData.background_image && elementorData.background_image.url) {
      return elementorData.background_image.url;
    }

    // Search in arrays and objects
    for (const key in elementorData) {
      if (elementorData.hasOwnProperty(key)) {
        const value = elementorData[key];
        if (Array.isArray(value)) {
          for (const item of value) {
            const result = this.findElementorBackgroundImage(item);
            if (result) return result;
          }
        } else if (typeof value === 'object' && value !== null) {
          const result = this.findElementorBackgroundImage(value);
          if (result) return result;
        }
      }
    }

    return null;
  }

  async strapiRequest(method, endpoint, data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (this.apiToken) {
      options.headers.Authorization = `Bearer ${this.apiToken}`;
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Strapi API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Strapi request failed: ${method} ${endpoint}`, error);
      throw error;
    }
  }

  async strapiUploadRequest(endpoint, formData) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options = {
      method: 'POST',
      body: formData
    };

    if (this.apiToken) {
      options.headers = {
        Authorization: `Bearer ${this.apiToken}`
      };
    }

    try {
      const response = await fetch(url, options);
      const responseText = await response.text();

      // Handle the case where Strapi returns 500 but upload succeeds
      if (!response.ok) {
        // For 500 errors, check if it's the known "successful upload but error response" case
        if (response.status === 500) {
          try {
            const errorData = JSON.parse(responseText);
            if (errorData.error && errorData.error.message === "Internal Server Error") {
              console.log(`⚠️ Got 500 error but upload might have succeeded, checking...`);
              // Return null to signal we need to verify the upload
              return null;
            }
          } catch (parseError) {
            // If we can't parse, fall through to throwing error
          }
        }
        
        throw new Error(`Strapi upload error: ${response.status} - ${responseText}`);
      }

      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Failed to parse upload response: ${parseError.message}`);
      }
    } catch (error) {
      console.error(`Strapi upload failed: ${endpoint}`, error);
      throw error;
    }
  }

  buildAttachmentMap(items) {
    const map = {};
    
    // Find all attachment items
    const attachments = items.filter(item => {
      const postType = this.getFieldValue(item, 'wp:post_type');
      return postType === 'attachment';
    });

    console.log(`📎 Found ${attachments.length} total attachments`);

    // Map attachments to their parent posts
    for (const attachment of attachments) {
      const parentId = this.getFieldValue(attachment, 'wp:post_parent');
      const attachmentUrl = this.getFieldValue(attachment, 'wp:attachment_url');
      
      if (parentId && parentId !== '0' && attachmentUrl) {
        if (!map[parentId]) {
          map[parentId] = [];
        }
        map[parentId].push({
          url: attachmentUrl,
          title: this.getFieldValue(attachment, 'title') || 'Attachment'
        });
      }
    }

    return map;
  }

  async generateRedirectsFile() {
    const redirectsContent = this.redirects.map(redirect => 
      `${redirect.from} ${redirect.to} 301`
    ).join('\n');

    fs.writeFileSync('_redirects', redirectsContent);
    console.log(`✅ Generated ${this.redirects.length} redirects in _redirects file`);
  }
}

// Main execution
async function main() {
  const importer = new WordPressImporterFixed();
  await importer.importFromXML('wordpress/inplaysoft.WordPress.2025-06-07.xml');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = WordPressImporterFixed; 