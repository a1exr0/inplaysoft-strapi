require('dotenv').config();

class ImportIssueFixer {
  constructor() {
    this.baseUrl = process.env.PUBLIC_URL || 'http://localhost:1337';
    this.apiToken = process.env.STRAPI_API_TOKEN;
  }

  async fixAllIssues() {
    console.log('🔧 Fixing WordPress Import Issues...\n');

    try {
      // Step 1: Analyze current state
      await this.analyzeCurrentState();
      
      // Step 2: Remove duplicates
      await this.removeDuplicates();
      
      // Step 3: Fix cover images
      await this.fixCoverImages();
      
      // Step 4: Verify fixes
      await this.verifyFixes();

      console.log('\n✅ All issues have been fixed!');

    } catch (error) {
      console.error('Error fixing issues:', error);
    }
  }

  async analyzeCurrentState() {
    console.log('=== ANALYZING CURRENT STATE ===\n');

    const articles = await this.strapiRequest('GET', '/api/articles');
    const knowledgebase = await this.strapiRequest('GET', '/api/knowledgebases');
    const files = await this.strapiRequest('GET', '/api/upload/files');

    console.log(`📰 Articles: ${articles.data?.length || 0}`);
    console.log(`📚 Knowledgebase: ${knowledgebase.data?.length || 0}`);
    console.log(`📁 Uploaded files: ${files.length || 0}`);

    // Find duplicates
    const duplicates = this.findDuplicatesByTitle(articles.data || [], knowledgebase.data || []);
    console.log(`🔄 Duplicate titles found: ${duplicates.length}`);

    console.log('\n' + '-'.repeat(60) + '\n');
  }

  async removeDuplicates() {
    console.log('=== REMOVING DUPLICATES ===\n');

    // Get all content
    const articles = await this.strapiRequest('GET', '/api/articles');
    const knowledgebase = await this.strapiRequest('GET', '/api/knowledgebases');

    const allContent = [
      ...(articles.data || []).map(item => ({ ...item, type: 'article' })),
      ...(knowledgebase.data || []).map(item => ({ ...item, type: 'knowledgebase' }))
    ];

    // Group by title
    const titleGroups = {};
    allContent.forEach(item => {
      const title = item.title;
      if (!titleGroups[title]) {
        titleGroups[title] = [];
      }
      titleGroups[title].push(item);
    });

    // Find and remove duplicates
    let removedCount = 0;
    for (const [title, items] of Object.entries(titleGroups)) {
      if (items.length > 1) {
        console.log(`🔄 Found ${items.length} copies of: "${title}"`);
        
        // Keep the first one, remove the rest
        const toKeep = items[0];
        const toRemove = items.slice(1);
        
        console.log(`  ✓ Keeping: ${toKeep.type} ID ${toKeep.id}`);
        
        for (const item of toRemove) {
          try {
            const endpoint = item.type === 'article' ? '/api/articles' : '/api/knowledgebases';
            await this.strapiRequest('DELETE', `${endpoint}/${item.documentId}`);
            console.log(`  ❌ Removed: ${item.type} ID ${item.id}`);
            removedCount++;
          } catch (error) {
            console.error(`  ⚠️ Failed to remove ${item.type} ID ${item.id}:`, error.message);
          }
        }
      }
    }

    console.log(`\n✅ Removed ${removedCount} duplicate entries`);
    console.log('\n' + '-'.repeat(60) + '\n');
  }

  async fixCoverImages() {
    console.log('=== FIXING COVER IMAGES ===\n');

    // Get all uploaded files
    const files = await this.strapiRequest('GET', '/api/upload/files');
    console.log(`📁 Available files: ${files.length}`);

    // Get content without covers
    const articles = await this.strapiRequest('GET', '/api/articles?populate=cover');
    const knowledgebase = await this.strapiRequest('GET', '/api/knowledgebases?populate=cover');

    const articlesNeedingCovers = articles.data?.filter(article => !article.cover) || [];
    const knowledgebaseNeedingCovers = knowledgebase.data?.filter(kb => !kb.cover) || [];

    console.log(`📰 Articles needing covers: ${articlesNeedingCovers.length}`);
    console.log(`📚 Knowledgebase needing covers: ${knowledgebaseNeedingCovers.length}`);

    // Try to match covers by title similarity or first available image
    let fixedCovers = 0;

    // Fix articles
    for (const article of articlesNeedingCovers) {
      const matchedFile = this.findMatchingImage(article.title, files);
      if (matchedFile) {
        try {
          await this.strapiRequest('PUT', `/api/articles/${article.documentId}`, {
            data: { cover: matchedFile.id }
          });
          console.log(`✓ Fixed cover for article: ${article.title}`);
          fixedCovers++;
        } catch (error) {
          console.error(`Failed to fix cover for article ${article.title}:`, error.message);
        }
      }
    }

    // Fix knowledgebase
    for (const kb of knowledgebaseNeedingCovers) {
      const matchedFile = this.findMatchingImage(kb.title, files);
      if (matchedFile) {
        try {
          await this.strapiRequest('PUT', `/api/knowledgebases/${kb.documentId}`, {
            data: { cover: matchedFile.id }
          });
          console.log(`✓ Fixed cover for knowledgebase: ${kb.title}`);
          fixedCovers++;
        } catch (error) {
          console.error(`Failed to fix cover for knowledgebase ${kb.title}:`, error.message);
        }
      }
    }

    console.log(`\n✅ Fixed ${fixedCovers} cover images`);
    console.log('\n' + '-'.repeat(60) + '\n');
  }

  findMatchingImage(title, files) {
    if (!files || files.length === 0) return null;

    // Clean title for matching
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Try to find an image with similar name
    let bestMatch = null;
    let bestScore = 0;

    for (const file of files) {
      if (!file.mime?.startsWith('image/')) continue;

      const fileName = file.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Calculate similarity score
      let score = 0;
      const titleWords = cleanTitle.split('').join('');
      const fileWords = fileName.split('').join('');
      
      // Simple substring matching
      if (fileName.includes(cleanTitle.substring(0, 10))) {
        score = 100;
      } else if (cleanTitle.includes(fileName.substring(0, 10))) {
        score = 80;
      } else {
        // Count common characters
        for (let i = 0; i < Math.min(titleWords.length, fileWords.length); i++) {
          if (titleWords[i] === fileWords[i]) score++;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = file;
      }
    }

    // If no good match, return first image
    if (bestScore < 5 && files.length > 0) {
      const firstImage = files.find(f => f.mime?.startsWith('image/'));
      return firstImage || null;
    }

    return bestMatch;
  }

  async verifyFixes() {
    console.log('=== VERIFICATION ===\n');

    const articles = await this.strapiRequest('GET', '/api/articles?populate=cover');
    const knowledgebase = await this.strapiRequest('GET', '/api/knowledgebases?populate=cover');

    const articlesWithCovers = articles.data?.filter(a => a.cover)?.length || 0;
    const knowledgebaseWithCovers = knowledgebase.data?.filter(kb => kb.cover)?.length || 0;

    console.log(`📰 Articles: ${articles.data?.length || 0} total, ${articlesWithCovers} with covers`);
    console.log(`📚 Knowledgebase: ${knowledgebase.data?.length || 0} total, ${knowledgebaseWithCovers} with covers`);

    // Check for remaining duplicates
    const duplicates = this.findDuplicatesByTitle(articles.data || [], knowledgebase.data || []);
    console.log(`🔄 Remaining duplicates: ${duplicates.length}`);

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found');
    } else {
      console.log('⚠️ Still have duplicates:', duplicates);
    }

    console.log('\n' + '-'.repeat(60) + '\n');
  }

  findDuplicatesByTitle(articles, knowledgebase) {
    const titleCounts = {};
    const duplicates = [];

    // Count article titles
    articles.forEach(article => {
      const title = article.title;
      titleCounts[title] = (titleCounts[title] || 0) + 1;
    });

    // Count knowledgebase titles
    knowledgebase.forEach(kb => {
      const title = kb.title;
      titleCounts[title] = (titleCounts[title] || 0) + 1;
    });

    // Find duplicates
    for (const [title, count] of Object.entries(titleCounts)) {
      if (count > 1) {
        duplicates.push(title);
      }
    }

    return duplicates;
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
}

// Main execution
async function main() {
  const fixer = new ImportIssueFixer();
  await fixer.fixAllIssues();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ImportIssueFixer; 