# Production Cleanup Guide for PM2 Environment

## Problem
Getting 403 Forbidden errors when trying to clean up existing content on production server, even with a "Full Access" API token.

## Root Cause
The cleanup scripts were designed to load environment variables from `.env` files using `dotenv`, but in production with PM2, environment variables are set through `ecosystem.config.js` and don't need `dotenv`.

## Solution Steps

### 1. First - Debug Environment Variables

Run the environment debugging script to verify your API token is being loaded correctly:

```bash
# On your production server, in the project directory
node scripts/debug-production-env.js
```

This will show:
- Whether `STRAPI_API_TOKEN` is loaded
- Token length and format
- Basic API connectivity test

### 2. Check API Token Permissions

Run the permission checker to identify what's wrong with your API token:

```bash
node scripts/check-api-permissions.js
```

This comprehensive test will check:
- Basic API connection
- Read permissions
- Write permissions (create test)
- Delete permissions (the problem area)
- Token type analysis

### 3. Fix API Token Issues

Based on the permission checker results:

#### If Token Not Found:
```bash
# Check if ecosystem.config.js has STRAPI_API_TOKEN set
cat ecosystem.config.js | grep STRAPI_API_TOKEN

# Restart PM2 to reload environment variables
pm2 restart strapi-inplaysoft
```

#### If Token Has Wrong Permissions:
1. Go to Strapi Admin → Settings → API Tokens
2. Delete the existing token
3. Create a new "Full Access" token
4. Update `ecosystem.config.js` with the new token:

```javascript
// In ecosystem.config.js
env: {
  // ... other variables ...
  STRAPI_API_TOKEN: 'your_new_full_access_token_here',
}
```

5. Restart PM2:
```bash
pm2 restart strapi-inplaysoft
```

### 4. Run Production Cleanup

Use the new production-specific cleanup script:

```bash
# Option 1: Direct execution
node scripts/production-cleanup.js

# Option 2: Using the shell script (recommended)
chmod +x scripts/run-production-cleanup.sh
./scripts/run-production-cleanup.sh
```

### 5. Alternative: Manual Database Cleanup

If API cleanup still fails, you can clean up directly in the database:

```bash
# Connect to your PostgreSQL database
psql -h database-2.cn400g4oc6qa.us-west-2.rds.amazonaws.com -U postgres -d strapi-db

# Check current content
SELECT COUNT(*) FROM articles;
SELECT COUNT(*) FROM knowledgebases;

# Delete all articles (be careful!)
DELETE FROM articles;

# Delete all knowledgebase entries
DELETE FROM knowledgebases;

# Verify cleanup
SELECT COUNT(*) FROM articles;
SELECT COUNT(*) FROM knowledgebases;
```

## Key Differences Between Scripts

### Old Scripts (Problem)
- Used `require('dotenv').config()` 
- Expected `.env` file
- Didn't work with PM2 environment variables

### New Scripts (Solution)
- **`production-cleanup.js`**: No dotenv, uses PM2 environment variables directly
- **`debug-production-env.js`**: Diagnoses environment variable loading
- **`check-api-permissions.js`**: Tests API token permissions thoroughly

## Environment Variable Setup

Your `ecosystem.config.js` should look like this:

```javascript
module.exports = {
  apps: [{
    name: 'strapi-inplaysoft',
    // ... other config ...
    env: {
      // ... other variables ...
      STRAPI_API_TOKEN: 'your_full_access_token_here',
      PUBLIC_URL: 'https://your-domain.com', // or http://localhost:1337 for local
      NODE_ENV: 'production',
    }
  }]
};
```

## Troubleshooting Checklist

- [ ] API token exists in `ecosystem.config.js`
- [ ] API token is "Full Access" type (not limited)
- [ ] PM2 process restarted after token update
- [ ] Strapi server is running and accessible
- [ ] No network/firewall issues blocking API calls
- [ ] Token has not expired or been revoked

## Quick Commands Reference

```bash
# Check PM2 status
pm2 status

# Restart Strapi
pm2 restart strapi-inplaysoft

# View PM2 logs
pm2 logs strapi-inplaysoft

# Debug environment
node scripts/debug-production-env.js

# Check API permissions
node scripts/check-api-permissions.js

# Run production cleanup
node scripts/production-cleanup.js
```

## Still Having Issues?

If cleanup still fails after following this guide:

1. Check Strapi server logs: `pm2 logs strapi-inplaysoft`
2. Verify API token in Strapi admin panel
3. Try creating content manually via API to test permissions
4. Consider using database cleanup as last resort

The 403 Forbidden error specifically indicates that your API token lacks the necessary delete permissions, so focus on steps 2-3 above. 