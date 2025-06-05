module.exports = ({ env }) => ({
  // Response caching configuration
  cache: {
    enabled: env.bool('CACHE_ENABLED', true),
    type: 'memory', // or 'redis' for production
    maxAge: env.int('CACHE_MAX_AGE', 300000), // 5 minutes
    models: [
      'api::article.article',
      'api::category.category',
      'api::author.author',
      'api::global.global',
    ],
  },

  // Query optimization settings
  query: {
    // Limit default population depth to prevent N+1 queries
    populateCreatorFields: false,
    
    // Default pagination settings
    pagination: {
      defaultLimit: env.int('DEFAULT_PAGINATION_LIMIT', 25),
      maxLimit: env.int('MAX_PAGINATION_LIMIT', 100),
    },

    // Optimize default sorting
    defaultSort: {
      'api::article.article': 'published_at:desc',
      'api::category.category': 'name:asc',
      'api::author.author': 'name:asc',
    },
  },

  // Media optimization
  media: {
    // Optimize image processing
    responsive: {
      enabled: true,
      breakpoints: {
        xlarge: 1920,
        large: 1000,
        medium: 750,
        small: 500,
      },
    },
    
    // Image compression settings
    compression: {
      enabled: true,
      quality: env.int('IMAGE_QUALITY', 80),
      progressive: true,
    },
  },

  // API optimization
  api: {
    // Enable response compression
    compression: {
      enabled: true,
      options: {
        level: 6,
        threshold: 1024,
      },
    },

    // Rate limiting (adjust as needed)
    rateLimit: {
      enabled: env.bool('RATE_LIMIT_ENABLED', true),
      max: env.int('RATE_LIMIT_MAX', 100),
      windowMs: env.int('RATE_LIMIT_WINDOW', 60000), // 1 minute
    },

    // CORS optimization
    cors: {
      enabled: true,
      credentials: true,
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
    },
  },

  // Database query optimization
  database: {
    // Enable query logging for analysis
    logging: env.bool('DB_QUERY_LOGGING', false),
    
    // Connection pool optimization
    pool: {
      min: env.int('DATABASE_POOL_MIN', 2),
      max: env.int('DATABASE_POOL_MAX', 20),
    },

    // Query timeout settings
    timeout: {
      query: env.int('DB_QUERY_TIMEOUT', 30000), // 30 seconds
      connection: env.int('DB_CONNECTION_TIMEOUT', 60000), // 1 minute
    },
  },

  // Memory optimization
  memory: {
    // Limit memory usage for large operations
    maxMemoryUsage: env.int('MAX_MEMORY_USAGE', 512 * 1024 * 1024), // 512MB
    
    // Garbage collection hints
    gc: {
      enabled: env.bool('GC_ENABLED', true),
      interval: env.int('GC_INTERVAL', 300000), // 5 minutes
    },
  },

  // Monitoring and analytics
  monitoring: {
    // Enable performance monitoring
    enabled: env.bool('MONITORING_ENABLED', true),
    
    // Slow query threshold
    slowQueryThreshold: env.int('SLOW_QUERY_THRESHOLD', 300), // 300ms
    
    // Memory usage monitoring
    memoryThreshold: env.int('MEMORY_THRESHOLD', 80), // 80%
  },
}); 