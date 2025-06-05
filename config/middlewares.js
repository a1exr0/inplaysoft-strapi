module.exports = ({ env }) => {
  // Load production config if in production
  let productionConfig = {};
  if (env('NODE_ENV') === 'production') {
    try {
      productionConfig = require('./production')({ env });
    } catch (error) {
      console.warn('Production config not found, using defaults');
    }
  }

  const middlewares = [
    'strapi::logger',
    'strapi::errors',
    
    // Security middleware with production settings
    {
      name: 'strapi::security',
      config: {
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            'connect-src': ["'self'", 'https:'],
            'img-src': ["'self'", 'data:', 'blob:', 'https:'],
            'media-src': ["'self'", 'data:', 'blob:', 'https:'],
            upgradeInsecureRequests: productionConfig.security?.ssl ?? env.bool('SECURE_SSL', false) ? [] : null,
          },
        },
        hsts: {
          enabled: productionConfig.security?.hsts ?? env.bool('HSTS_ENABLED', false),
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
        },
      },
    },

    // CORS middleware with production settings
    ...(productionConfig.security?.cors?.enabled ?? env.bool('CORS_ENABLED', true) ? [{
      name: 'strapi::cors',
      config: {
        headers: '*',
        origin: ['http://localhost:1337', 'http://localhost:3000', 'https://localhost:3000'],
        credentials: productionConfig.security?.cors?.credentials ?? env.bool('CORS_CREDENTIALS', true),
        exposedHeaders: productionConfig.security?.cors?.exposedHeaders ?? ['Content-Range', 'X-Content-Range'],
      },
    }] : []),

    'strapi::poweredBy',
    'strapi::query',
    'strapi::body',
    'strapi::session',
    'strapi::favicon',
    'strapi::public',

    // Compression middleware with production settings
    ...(productionConfig.compression?.enabled ?? env.bool('COMPRESSION_ENABLED', false) ? [{
      name: 'strapi::compression',
      config: {
        level: productionConfig.compression?.level ?? env.int('COMPRESSION_LEVEL', 6),
        threshold: productionConfig.compression?.threshold ?? env.int('COMPRESSION_THRESHOLD', 1024),
      },
    }] : []),


  ];

  return middlewares;
};
