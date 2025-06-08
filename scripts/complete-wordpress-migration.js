require('dotenv').config();
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class CompleteMigrationWorkflow {
  constructor() {
    this.xmlFilePath = process.argv[2] || 'wordpress/inplaysoft.WordPress.2025-06-07.xml';
  }

  async runMigration() {
    console.log('🚀 Starting Complete WordPress Migration Workflow\n');
    console.log('='.repeat(60));
    
    try {
      // Step 1: Run WordPress Import
      console.log('\n📥 STEP 1: WordPress Content Import');
      console.log('-'.repeat(40));
      await this.runWordPressImport();
      
      // Step 2: Update Timestamps in Database
      console.log('\n⏰ STEP 2: Update Original WordPress Timestamps');
      console.log('-'.repeat(40));
      await this.updateTimestamps();
      
      console.log('\n✅ MIGRATION COMPLETE!');
      console.log('='.repeat(60));
      console.log('\n🎉 Your WordPress content has been successfully migrated to Strapi with:');
      console.log('  ✓ All articles and knowledgebase entries imported');
      console.log('  ✓ Cover images extracted from content and Elementor data');
      console.log('  ✓ Images optimized and uploaded to S3');
      console.log('  ✓ Original WordPress timestamps preserved');
      console.log('  ✓ SEO redirects generated for all posts');
      console.log('  ✓ Clean, responsive HTML content');
      
      console.log('\n📋 Next Steps:');
      console.log('  1. Check your Strapi admin panel to verify content');
      console.log('  2. Deploy the _redirects file to your hosting platform');
      console.log('  3. Test some of the redirects to ensure they work');
      console.log('  4. Update your site navigation if needed');
      
    } catch (error) {
      console.error('\n❌ Migration failed:', error.message);
      process.exit(1);
    }
  }

  async runWordPressImport() {
    console.log(`Importing from: ${this.xmlFilePath}`);
    console.log('This will:');
    console.log('  • Parse WordPress XML export');
    console.log('  • Create articles and knowledgebase entries');
    console.log('  • Extract and optimize images');
    console.log('  • Upload images to S3');
    console.log('  • Generate SEO redirects');
    console.log();
    
    try {
      const { stdout, stderr } = await execAsync(`node scripts/wordpress-import.js "${this.xmlFilePath}"`);
      console.log(stdout);
      if (stderr) {
        console.warn('Warnings:', stderr);
      }
      console.log('✅ WordPress import completed successfully');
    } catch (error) {
      console.error('WordPress import failed:', error.message);
      throw error;
    }
  }

  async updateTimestamps() {
    console.log(`Updating timestamps from: ${this.xmlFilePath}`);
    console.log('This will:');
    console.log('  • Connect to PostgreSQL database');
    console.log('  • Match imported content with WordPress dates');
    console.log('  • Update created_at, updated_at, published_at directly in DB');
    console.log('  • Preserve original WordPress timeline');
    console.log();
    
    try {
      const { stdout, stderr } = await execAsync(`node scripts/update-timestamps-db.js "${this.xmlFilePath}"`);
      console.log(stdout);
      if (stderr) {
        console.warn('Warnings:', stderr);
      }
      console.log('✅ Timestamp update completed successfully');
    } catch (error) {
      console.error('Timestamp update failed:', error.message);
      throw error;
    }
  }

  static showUsage() {
    console.log('\nUsage:');
    console.log('  node scripts/complete-wordpress-migration.js [xml-file-path]');
    console.log('\nExample:');
    console.log('  node scripts/complete-wordpress-migration.js wordpress/export.xml');
    console.log('  npm run migrate:complete wordpress/export.xml');
    console.log('\nDefault XML file: wordpress/inplaysoft.WordPress.2025-06-07.xml');
  }
}

// Main execution
async function main() {
  const workflow = new CompleteMigrationWorkflow();
  
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    CompleteMigrationWorkflow.showUsage();
    return;
  }
  
  await workflow.runMigration();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = CompleteMigrationWorkflow; 