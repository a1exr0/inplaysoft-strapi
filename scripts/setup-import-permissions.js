/**
 * Setup script to configure Strapi permissions for WordPress import
 * Run this before running the import script
 */

console.log('🔑 Setting up API Token for WordPress Import');
console.log('');
console.log('For secure WordPress import, create an API token:');
console.log('');
console.log('1. 🚀 Start Strapi in development mode:');
console.log('   npm run develop');
console.log('');
console.log('2. 🔑 Go to Strapi Admin Panel:');
console.log('   http://localhost:1337/admin');
console.log('');
console.log('3. 🎫 Create API Token:');
console.log('   - Go to Settings > API Tokens');
console.log('   - Click "Create new API Token"');
console.log('   - Name: "WordPress Import"');
console.log('   - Description: "Token for WordPress content import"');
console.log('   - Token type: "Full access"');
console.log('   - Token duration: "30 days" (or unlimited)');
console.log('   - Click "Save"');
console.log('');
console.log('4. 📋 Copy the generated token');
console.log('');
console.log('5. 📝 Add token to .env file:');
console.log('   STRAPI_API_TOKEN=your_generated_token_here');
console.log('');
console.log('6. ▶️ Run the import:');
console.log('   npm run import:wordpress');
console.log('');
console.log('🔒 This approach is secure and doesn\'t require public permissions.');
console.log('');

// Check if Strapi is running
const fetch = require('node-fetch');

async function checkStrapiStatus() {
  try {
    const response = await fetch('http://localhost:1337/admin');
    if (response.ok) {
      console.log('✅ Strapi is running at http://localhost:1337');
    } else {
      console.log('❌ Strapi is not accessible');
    }
  } catch (error) {
    console.log('❌ Strapi is not running. Start it with: npm run develop');
  }
}

checkStrapiStatus(); 