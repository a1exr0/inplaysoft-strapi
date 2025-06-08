const path = require('path');

// Load production environment variables from ecosystem.config.js
function loadProductionEnv() {
  try {
    const ecosystemPath = path.join(process.cwd(), 'ecosystem.config.js');
    const ecosystem = require(ecosystemPath);
    
    if (ecosystem.apps && ecosystem.apps.length > 0) {
      const app = ecosystem.apps[0];
      if (app.env) {
        // Set environment variables from ecosystem config
        Object.keys(app.env).forEach(key => {
          if (!process.env[key]) {
            process.env[key] = app.env[key];
          }
        });
        console.log('✅ Loaded production environment from ecosystem.config.js');
        return true;
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not load ecosystem.config.js, falling back to .env files');
  }
  
  // Fallback to .env.production if it exists
  try {
    require('dotenv').config({ path: '.env.production' });
    console.log('✅ Loaded environment from .env.production');
    return true;
  } catch (error) {
    console.warn('⚠️ Could not load .env.production, using default .env');
  }
  
  // Final fallback to regular .env
  try {
    require('dotenv').config();
    console.log('✅ Loaded environment from .env');
    return true;
  } catch (error) {
    console.error('❌ Could not load any environment configuration');
    return false;
  }
}

module.exports = { loadProductionEnv }; 