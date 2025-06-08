const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const fetch = require('node-fetch');
const AWS = require('aws-sdk');
const slugify = require('slugify');
const FormData = require('form-data');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_ACCESS_SECRET,
  region: process.env.AWS_REGION,
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

class WordPressImporter {
  constructor() {
    this.redirects = [];
    this.processedImages = new Map();
    this.categories = new Map();
    this.knowledgebaseCategories = new Map();
    this.authors = new Map();
    this.defaultAuthor = null;
    this.apiToken = null;
  }

  async initialize() {
    // Get API token from environment variable
    this.apiToken = process.env.STRAPI_API_TOKEN;
    
    if (!this.apiToken) {
      console.error('❌ Missing STRAPI_API_TOKEN environment variable');
      console.log('');
      console.log('Please create an API token in Strapi admin:');
      console.log('1. Go to Settings > API Tokens');
      console.log('2. Click "Create new API Token"');
      console.log('3. Name: "WordPress Import"');
      console.log('4. Token type: "Full access"');
      console.log('5. Copy the generated token');
      console.log('6. Add to .env file: STRAPI_API_TOKEN=your_token_here');
      console.log('');
      throw new Error('API token required for import');
    }
    
    console.log('✓ Using API token for authentication');
  }

  async importFromXML(xmlFilePath) {
    console.log('Starting WordPress XML import...');
    
    try {
      // Read and parse XML
      const xmlData = fs.readFileSync(xmlFilePath, 'utf8');
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xmlData);
      
      const channel = result.rss.channel[0];
      const items = channel.item || [];
      
      console.log(`Found ${items.length} items in XML`);
      
      // Initialize authentication
      await this.initialize();
      
      // Create default author
      await this.createDefaultAuthor();
      
      // Process all items
      for (const item of items) {
        await this.processItem(item);
      }
      
      // Generate redirects file
      await this.generateRedirectsFile();
      
      console.log('Import completed successfully!');
      console.log(`Processed ${this.redirects.length} redirects`);
      
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }

  async processItem(item) {
    const postType = this.getFieldValue(item, 'wp:post_type');
    
    // Only process posts
    if (postType !== 'post') {
      return;
    }

    const title = this.getFieldValue(item, 'title');
    const content = this.getFieldValue(item, 'content:encoded');
    const excerpt = this.getFieldValue(item, 'excerpt:encoded');
    const pubDate = this.getFieldValue(item, 'pubDate');
    const postDate = this.getFieldValue(item, 'wp:post_date');
    const modifiedDate = this.getFieldValue(item, 'wp:post_modified');
    const slug = this.getFieldValue(item, 'wp:post_name');
    const status = this.getFieldValue(item, 'wp:status');
    const originalLink = this.getFieldValue(item, 'link');
    
    // Skip drafts
    if (status !== 'publish') {
      return;
    }

    // Get categories
    const categories = this.extractCategories(item);
    const primaryCategory = categories.find(cat => cat.domain === 'category');
    
    if (!primaryCategory) {
      console.log(`No primary category found for: ${title}`);
      return;
    }

    console.log(`Processing: ${title} (Category: ${primaryCategory.nicename})`);
    console.log(`  📅 Original date: ${postDate || pubDate}`);

    // Extract images from content
    const images = await this.extractAndUploadImages(content);
    
    // Check for Elementor cover image if no images found in content
    let coverImage = images.length > 0 ? images[0] : null;
    if (!coverImage) {
      coverImage = await this.extractElementorCoverImage(item);
    }

    // Clean and convert content
    const cleanContent = this.cleanHtmlContent(content);
    
    // Create content based on category
    if (primaryCategory.nicename === 'news') {
      await this.createArticle({
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
    } else if (primaryCategory.nicename === 'insights') {
      await this.createKnowledgebaseEntry({
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
  }

  async createArticle(data) {
    try {
      // Create or get category
      const categoryId = await this.createOrGetCategory('News', 'news');
      
      // Prepare article data with original WordPress dates
      const originalDate = this.parseWordPressDate(data.postDate || data.pubDate);
      const modifiedDate = this.parseWordPressDate(data.modifiedDate || data.postDate || data.pubDate);
      
      const articleData = {
        title: data.title,
        description: data.excerpt || data.title.substring(0, 80),
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
        console.log(`✓ Created article: ${data.title} (${originalDate.toDateString()})`);
      }

    } catch (error) {
      console.error(`Failed to create article: ${data.title}`, error.message);
      // Continue with next item instead of crashing
    }
  }

  async createKnowledgebaseEntry(data) {
    try {
      // Create or get knowledgebase category
      const categoryId = await this.createOrGetKnowledgebaseCategory('Insights', 'insights');
      
      // Prepare knowledgebase data with original WordPress dates
      const originalDate = this.parseWordPressDate(data.postDate || data.pubDate);
      const modifiedDate = this.parseWordPressDate(data.modifiedDate || data.postDate || data.pubDate);
      
      const kbData = {
        title: data.title,
        description: data.excerpt || data.title.substring(0, 160),
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
        console.log(`✓ Created knowledgebase entry: ${data.title} (${originalDate.toDateString()})`);
      }

    } catch (error) {
      console.error(`Failed to create knowledgebase entry: ${data.title}`, error.message);
      // Continue with next item instead of crashing
    }
  }

  async createDefaultAuthor() {
    try {
      // Check if default author exists
      const authors = await this.strapiRequest('GET', '/api/authors?filters[name][$eq]=InplaySoft');
      
      if (authors.data && authors.data.length > 0) {
        this.defaultAuthor = authors.data[0];
        console.log('Using existing default author');
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
        console.log('✓ Created default author');
      }

    } catch (error) {
      console.error('Failed to create default author:', error);
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

      // Create category
      const categoryData = {
        name,
        slug,
        description: `${name} articles and content`
      };

      const response = await this.strapiRequest('POST', '/api/categories', {
        data: categoryData
      });

      if (response && response.data) {
        const categoryId = response.data.id;
        this.categories.set(slug, categoryId);
        console.log(`✓ Created category: ${name}`);
        return categoryId;
      }

    } catch (error) {
      console.error(`Failed to create category: ${name}`, error);
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

      // Create category
      const categoryData = {
        name,
        slug,
        description: `${name} knowledgebase content`
      };

      const response = await this.strapiRequest('POST', '/api/knowledgebase-categories', {
        data: categoryData
      });

      if (response && response.data) {
        const categoryId = response.data.id;
        this.knowledgebaseCategories.set(slug, categoryId);
        console.log(`✓ Created knowledgebase category: ${name}`);
        return categoryId;
      }

    } catch (error) {
      console.error(`Failed to create knowledgebase category: ${name}`, error);
    }
  }

  async extractAndUploadImages(content) {
    const images = [];
    const imageRegex = /https:\/\/inplaysoft\.com\/wp-content\/uploads\/[^"'\s)]+\.(jpg|jpeg|png|gif|webp)/gi;
    const matches = content.match(imageRegex);
    
    if (!matches) return images;

    // Filter to get only main images (not WordPress auto-generated sizes)
    const mainImages = this.getMainImagesOnly(matches);
    
    if (matches.length > mainImages.length) {
      console.log(`📸 Optimized: ${matches.length} images found, uploading ${mainImages.length} main images only`);
    }

    for (const imageUrl of mainImages) {
      if (this.processedImages.has(imageUrl)) {
        images.push(this.processedImages.get(imageUrl));
        continue;
      }

      try {
        const uploadedImage = await this.downloadAndUploadImage(imageUrl);
        if (uploadedImage) {
          this.processedImages.set(imageUrl, uploadedImage);
          images.push(uploadedImage);
        }
      } catch (error) {
        console.error(`Failed to process image: ${imageUrl}`, error);
      }
    }

    return images;
  }

  getMainImagesOnly(imageUrls) {
    const mainImages = new Set();
    
    for (const url of imageUrls) {
      // Extract base filename without WordPress size suffixes
      const baseUrl = this.getBaseImageUrl(url);
      
      // Skip if we already have the main version of this image
      if (mainImages.has(baseUrl)) continue;
      
      // Check if this is a WordPress resized version (contains -WIDTHxHEIGHT pattern)
      const isResized = /-\d+x\d+(-\d+)?\.(jpg|jpeg|png|gif|webp)$/i.test(url);
      
      if (!isResized) {
        // This is likely the original image
        mainImages.add(url);
      } else {
        // This is a resized version - check if we have the original
        const originalUrl = url.replace(/-\d+x\d+(-\d+)?(\.(jpg|jpeg|png|gif|webp))$/i, '$2');
        
        // Only add the resized version if we haven't seen any version of this image yet
        if (!Array.from(mainImages).some(existing => this.getBaseImageUrl(existing) === this.getBaseImageUrl(originalUrl))) {
          mainImages.add(url); // Use the largest available version
        }
      }
    }
    
    return Array.from(mainImages);
  }

  getBaseImageUrl(url) {
    // Remove WordPress size suffixes to get base filename
    return url.replace(/-\d+x\d+(-\d+)?(\.(jpg|jpeg|png|gif|webp))$/i, '$2');
  }

  parseWordPressDate(dateString) {
    if (!dateString) return new Date();
    
    // WordPress date format: "2024-07-05 12:22:22" or RFC date format
    try {
      let parsedDate;
      
      // Try parsing as WordPress date format first
      if (dateString.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
        // Convert WordPress date format to ISO format
        const isoDate = dateString.replace(' ', 'T') + 'Z';
        parsedDate = new Date(isoDate);
      } else {
        // Try parsing as standard date format (pubDate, etc.)
        parsedDate = new Date(dateString);
      }
      
      // Check if the date is valid
      if (isNaN(parsedDate.getTime())) {
        console.warn(`Invalid date parsed: ${dateString}, using current date`);
        return new Date();
      }
      
      return parsedDate;
    } catch (error) {
      console.warn(`Failed to parse date: ${dateString}, using current date`);
      return new Date();
    }
  }

  async downloadAndUploadImage(imageUrl) {
    try {
      console.log(`Downloading image: ${imageUrl}`);
      
      // Download image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }

      const buffer = await response.buffer();
      const contentType = response.headers.get('content-type');
      
      // Generate filename
      const urlPath = new URL(imageUrl).pathname;
      const filename = path.basename(urlPath);
      
      // Create form data for Strapi upload
      const formData = new FormData();
      formData.append('files', buffer, {
        filename: filename,
        contentType: contentType
      });

      // Upload via Strapi API
      const uploadResponse = await this.strapiUploadRequest('/api/upload', formData);
      
      if (uploadResponse && uploadResponse[0]) {
        console.log(`✓ Uploaded image: ${filename}`);
        return uploadResponse[0];
      }

    } catch (error) {
      console.error(`Failed to download/upload image: ${imageUrl}`, error);
      return null;
    }
  }

  cleanHtmlContent(content) {
    if (!content) return '';
    
    // Remove WordPress-specific shortcodes and Elementor data
    let cleaned = content
      .replace(/\[elementor-element[^\]]*\]/g, '')
      .replace(/\[\/elementor-element\]/g, '')
      .replace(/\[vc_[^\]]*\]/g, '')
      .replace(/\[\/vc_[^\]]*\]/g, '')
      .replace(/data-elementor-[^=]*="[^"]*"/g, '')
      .replace(/class="elementor-[^"]*"/g, '')
      .replace(/<div[^>]*elementor[^>]*>/g, '<div>')
      .replace(/<!--.*?-->/gs, '')
      .trim();

    // Replace WordPress image URLs (all sizes) with the main uploaded image
    cleaned = cleaned.replace(
      /https:\/\/inplaysoft\.com\/wp-content\/uploads\/[^"'\s)]+\.(jpg|jpeg|png|gif|webp)/gi,
      (match) => {
        // First check if we have the exact match
        if (this.processedImages.has(match)) {
          return this.processedImages.get(match).url;
        }
        
        // If not, look for the main version of this image
        const baseUrl = this.getBaseImageUrl(match);
        for (const [processedUrl, processedImage] of this.processedImages) {
          if (this.getBaseImageUrl(processedUrl) === baseUrl) {
            return processedImage.url;
          }
        }
        
        return match; // Keep original if no processed version found
      }
    );

    // Clean up image tags - remove WordPress-specific sizing attributes
    cleaned = cleaned.replace(
      /<img([^>]*?)\/?>/gi,
      (match, attributes) => {
        // Remove width, height, srcset, and sizes attributes
        let cleanAttributes = attributes
          .replace(/\s*width\s*=\s*["'][^"']*["']/gi, '')
          .replace(/\s*height\s*=\s*["'][^"']*["']/gi, '')
          .replace(/\s*srcset\s*=\s*["'][^"']*["']/gi, '')
          .replace(/\s*sizes\s*=\s*["'][^"']*["']/gi, '')
          .replace(/\s*\/$/, '') // Remove trailing slash if present
          .trim();
        
        // Add responsive styling if not already present
        if (!cleanAttributes.includes('style=')) {
          cleanAttributes += ' style="max-width: 100%; height: auto;"';
        } else {
          // Enhance existing style with responsive properties
          cleanAttributes = cleanAttributes.replace(
            /style\s*=\s*["']([^"']*)["']/i,
            (styleMatch, existingStyle) => {
              let style = existingStyle;
              if (!style.includes('max-width')) {
                style += '; max-width: 100%';
              }
              if (!style.includes('height')) {
                style += '; height: auto';
              }
              return `style="${style}"`;
            }
          );
        }
        
        return `<img${cleanAttributes ? ' ' + cleanAttributes : ''} />`;
      }
    );

    return cleaned;
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
    return originalSlug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  extractWordPressPath(originalLink) {
    if (!originalLink) return '/';
    
    try {
      const url = new URL(originalLink);
      return url.pathname; // This will return something like "/2024/07/05/multi-tenant-gaming-platform/"
    } catch (error) {
      console.warn(`Failed to parse WordPress URL: ${originalLink}, using fallback`);
      return '/';
    }
  }

  async extractElementorCoverImage(item) {
    try {
      // Look for Elementor data in post meta
      if (!item['wp:postmeta']) return null;
      
      const postMeta = Array.isArray(item['wp:postmeta']) ? item['wp:postmeta'] : [item['wp:postmeta']];
      
      for (const meta of postMeta) {
        const metaKey = this.getFieldValue(meta, 'wp:meta_key');
        const metaValue = this.getFieldValue(meta, 'wp:meta_value');
        
        if (metaKey === '_elementor_data' && metaValue) {
          try {
            // Parse Elementor JSON data
            const elementorData = JSON.parse(metaValue);
            
            // Look for background images in Elementor sections
            const coverImageUrl = this.findElementorBackgroundImage(elementorData);
            
            if (coverImageUrl) {
              console.log(`📸 Found Elementor cover image: ${coverImageUrl}`);
              
              // Download and upload the Elementor cover image
              const uploadedImage = await this.downloadAndUploadImage(coverImageUrl);
              if (uploadedImage) {
                return uploadedImage;
              }
            }
          } catch (parseError) {
            console.warn('Failed to parse Elementor data:', parseError.message);
          }
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Error extracting Elementor cover image:', error.message);
      return null;
    }
  }

  findElementorBackgroundImage(elementorData) {
    if (!Array.isArray(elementorData)) return null;
    
    // Recursively search through Elementor structure for background images
    for (const element of elementorData) {
      if (element.settings && element.settings.background_image && element.settings.background_image.url) {
        // Found a background image - return the URL
        const imageUrl = element.settings.background_image.url;
        
        // Convert escaped URLs back to normal format
        const cleanUrl = imageUrl.replace(/\\\//g, '/');
        
        // Skip empty URLs
        if (cleanUrl && cleanUrl !== '') {
          return cleanUrl;
        }
      }
      
      // Recursively search in elements
      if (element.elements && Array.isArray(element.elements)) {
        const foundImage = this.findElementorBackgroundImage(element.elements);
        if (foundImage) return foundImage;
      }
    }
    
    return null;
  }



  async strapiRequest(method, endpoint, data = null) {
    const url = `${process.env.PUBLIC_URL || 'http://localhost:1337'}${endpoint}`;
    
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
    const url = `${process.env.PUBLIC_URL || 'http://localhost:1337'}${endpoint}`;
    
    const options = {
      method: 'POST',
      body: formData
    };

    if (this.apiToken) {
      options.headers = {
        'Authorization': `Bearer ${this.apiToken}`
      };
    }
    
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Strapi upload error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Strapi upload failed: ${endpoint}`, error);
      throw error;
    }
  }

  async generateRedirectsFile() {
    const redirectsContent = this.redirects.map(redirect => 
      `${redirect.from} ${redirect.to} 301`
    ).join('\n');

    fs.writeFileSync('_redirects', redirectsContent);
    console.log(`✓ Generated _redirects file with ${this.redirects.length} redirects`);
  }
}

// Main execution
async function main() {
  require('dotenv').config();
  
  const xmlFilePath = process.argv[2] || 'wordpress/inplaysoft.WordPress.2025-06-07.xml';
  
  if (!fs.existsSync(xmlFilePath)) {
    console.error(`XML file not found: ${xmlFilePath}`);
    process.exit(1);
  }

  const importer = new WordPressImporter();
  await importer.importFromXML(xmlFilePath);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = WordPressImporter; 