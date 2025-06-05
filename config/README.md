# Configuration Structure

This project uses a clean separation between **secrets** (stored in environment files) and **settings** (stored in JavaScript configuration files).

## 📁 Configuration Files Overview

### **Environment Files (.env)**
Contains **only secrets and sensitive data** - never commit to version control:

- `.env` - Development secrets
- `.env.production` - Production secrets

### **JavaScript Configuration Files**
Contains **application settings and behavior** - safe to commit:

- `config/production.js` - Production-specific settings
- `config/database.js` - Database configuration
- `config/middlewares.js` - Middleware configuration  
- `config/performance.js` - Performance settings
- `config/server.js` - Server configuration

## 🔒 Secrets vs Settings

### **Secrets (.env files)**
```env
# Database credentials
DATABASE_HOST=your-db-host.com
DATABASE_PASSWORD=secret-password
DATABASE_USERNAME=username

# API keys and tokens
APP_KEYS="secret-keys"
JWT_SECRET=jwt-secret
API_TOKEN_SALT=api-salt

# Third-party credentials
STRIPE_SECRET_KEY=sk_live_...
AWS_SECRET_ACCESS_KEY=aws-secret
```

### **Settings (JavaScript files)**
```javascript
// Performance settings
database: {
  pool: { min: 5, max: 50 },
  queryTimeout: 30000,
},

// Application behavior
cache: {
  enabled: true,
  maxAge: 300000,
},

// Feature toggles
monitoring: {
  enabled: true,
  memoryThreshold: 80,
},
```

## 🚀 Production Configuration

### **1. Environment-Based Loading**
```javascript
// config/production.js
module.exports = ({ env }) => ({
  database: {
    pool: {
      min: env.int('DATABASE_POOL_MIN', 5), // Override via env if needed
      max: env.int('DATABASE_POOL_MAX', 50),
    }
  }
});
```

### **2. Automatic Production Optimization**
When `NODE_ENV=production`:
- Loads optimized settings from `config/production.js`
- Enables performance features (compression, caching)
- Applies security hardening (HSTS, CSP)
- Configures production database pools

### **3. Environment Variable Overrides**
You can still override any setting via environment variables:
```env
# Override production defaults
DATABASE_POOL_MAX=100
CACHE_ENABLED=false
RATE_LIMIT_MAX=2000
```

## 📊 Configuration Loading Priority

1. **JavaScript config defaults** (lowest priority)
2. **Production config settings** (if NODE_ENV=production)
3. **Environment variables** (highest priority)

```javascript
// Example loading order
const poolMax = 
  env.int('DATABASE_POOL_MAX') ||     // 1. Environment variable
  productionConfig.database?.pool?.max || // 2. Production config
  20;                                 // 3. Default value
```

## 🛠️ Development vs Production

### **Development**
```bash
# Uses defaults optimized for development
npm run develop

# Settings from:
# - config/database.js defaults
# - .env overrides
```

### **Production**
```bash
# Uses production-optimized settings
NODE_ENV=production npm start

# Settings from:
# - config/production.js optimized settings
# - .env.production secret overrides
# - Environment variable final overrides
```

## 🔧 Adding New Configuration

### **1. For Secrets (credentials, keys)**
Add to `.env.production`:
```env
NEW_API_SECRET=your-secret-key
```

### **2. For Settings (behavior, features)**
Add to `config/production.js`:
```javascript
newFeature: {
  enabled: env.bool('NEW_FEATURE_ENABLED', true),
  timeout: env.int('NEW_FEATURE_TIMEOUT', 5000),
},
```

### **3. For Middleware Configuration**
Update `config/middlewares.js`:
```javascript
// Use production config
...(productionConfig.newMiddleware?.enabled ? [{
  name: 'custom::middleware',
  config: productionConfig.newMiddleware.config
}] : [])
```

## 📝 Best Practices

### **✅ Do:**
- Keep secrets in `.env` files
- Keep settings in JavaScript configs
- Use environment variable overrides for deployment flexibility
- Document configuration changes
- Use typed environment helpers (`env.int()`, `env.bool()`)

### **❌ Don't:**
- Put secrets in JavaScript files
- Put application logic in environment files
- Commit `.env` files to version control
- Hard-code values without environment fallbacks

## 🔍 Configuration Validation

The configuration automatically validates:
- Required environment variables
- Data types (int, bool, array)
- Production-specific requirements
- Security settings enforcement

## 📋 Configuration Checklist

### **Development Setup:**
- [ ] Copy `.env.example` to `.env`
- [ ] Set database credentials
- [ ] Configure local services

### **Production Setup:**
- [ ] Set all secrets in `.env.production`
- [ ] Verify production settings in `config/production.js`
- [ ] Test configuration with `npm run optimize:db`
- [ ] Monitor performance with `npm run test:performance`

### **Deployment:**
- [ ] Secrets configured in deployment environment
- [ ] Production config validated
- [ ] Database optimizations applied
- [ ] Performance monitoring enabled 