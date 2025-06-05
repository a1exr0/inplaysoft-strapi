module.exports = ({ env }) => ({
  // ============================================================================
  // DATABASE PERFORMANCE OPTIMIZATION SETTINGS
  // ============================================================================

  database: {
    // Connection Pool Settings (Optimized for Production)
    pool: {
      min: env.int('DATABASE_POOL_MIN', 5),
      max: env.int('DATABASE_POOL_MAX', 50),
      acquireTimeoutMillis: env.int('DATABASE_ACQUIRE_TIMEOUT', 60000),
      createTimeoutMillis: env.int('DATABASE_CREATE_TIMEOUT', 30000),
      destroyTimeoutMillis: env.int('DATABASE_DESTROY_TIMEOUT', 5000),
      idleTimeoutMillis: env.int('DATABASE_IDLE_TIMEOUT', 30000),
      reapIntervalMillis: env.int('DATABASE_REAP_INTERVAL', 1000),
      createRetryIntervalMillis: env.int('DATABASE_RETRY_INTERVAL', 100),
    },

    // Database Query Performance
    debug: env.bool('DATABASE_DEBUG', false),
    logging: env.bool('DB_QUERY_LOGGING', false),
    queryTimeout: env.int('DB_QUERY_TIMEOUT', 30000),
    connectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 120000),

    // Database Optimization Control
    forceOptimize: env.bool('FORCE_OPTIMIZE', false),
    autoOptimizeOnStartup: env.bool('AUTO_OPTIMIZE_ON_STARTUP', true),
    slowQueryThreshold: env.int('SLOW_QUERY_THRESHOLD', 300),
  },

  // ============================================================================
  // APPLICATION PERFORMANCE SETTINGS
  // ============================================================================

  // Pagination Settings
  pagination: {
    defaultLimit: env.int('DEFAULT_PAGINATION_LIMIT', 25),
    maxLimit: env.int('MAX_PAGINATION_LIMIT', 100),
  },

  // Caching Configuration
  cache: {
    enabled: env.bool('CACHE_ENABLED', true),
    type: env('CACHE_TYPE', 'memory'), // 'memory' or 'redis'
    maxAge: env.int('CACHE_MAX_AGE', 1800000), // 5 minutes
    ttl: env.int('CACHE_TTL', 1800000),
    models: [
      'api::article.article',
      'api::category.category',
      'api::author.author',
      'api::global.global',
    ],
  },

  // Response Compression
  compression: {
    enabled: env.bool('COMPRESSION_ENABLED', true),
    level: env.int('COMPRESSION_LEVEL', 6),
    threshold: env.int('COMPRESSION_THRESHOLD', 1024),
  },

  // Rate Limiting
  rateLimit: {
    enabled: env.bool('RATE_LIMIT_ENABLED', true),
    max: env.int('RATE_LIMIT_MAX', 1000), // requests per window
    windowMs: env.int('RATE_LIMIT_WINDOW', 60000), // 1 minute
    message: 'Too many requests from this IP, please try again later.',
  },

  // ============================================================================
  // MONITORING & ANALYTICS
  // ============================================================================

  // Performance Monitoring
  monitoring: {
    enabled: env.bool('MONITORING_ENABLED', true),
    performanceMonitoring: env.bool('PERFORMANCE_MONITORING', true),
    memoryThreshold: env.int('MEMORY_THRESHOLD', 80), // percentage
    cpuThreshold: env.int('CPU_THRESHOLD', 80), // percentage
  },

  // Error Tracking & Logging
  logging: {
    level: env('LOG_LEVEL', 'warn'), // 'error', 'warn', 'info', 'debug'
    errorTracking: env.bool('ERROR_TRACKING_ENABLED', true),
    metrics: env.bool('METRICS_ENABLED', true),
  },

  // Health Check Settings
  healthCheck: {
    enabled: env.bool('HEALTH_CHECK_ENABLED', true),
    timeout: env.int('HEALTH_CHECK_TIMEOUT', 30000),
    interval: env.int('HEALTH_CHECK_INTERVAL', 30000),
  },

  // ============================================================================
  // MEDIA & FILE OPTIMIZATION
  // ============================================================================

  // Image Optimization
  media: {
    imageQuality: env.int('IMAGE_QUALITY', 80),
    imageCompression: env.bool('IMAGE_COMPRESSION', true),
    imageProgressive: env.bool('IMAGE_PROGRESSIVE', true),
    responsiveImages: env.bool('RESPONSIVE_IMAGES', true),
    
    // File Upload Settings
    maxFileSize: env.int('MAX_FILE_SIZE', 10485760), // 10MB
    allowedFileTypes: env.array('ALLOWED_FILE_TYPES', ['images', 'documents', 'videos']),
    
    // Responsive breakpoints
    breakpoints: {
      xlarge: 1920,
      large: 1000,
      medium: 750,
      small: 500,
    },
  },

  // ============================================================================
  // SECURITY & SSL
  // ============================================================================

  // SSL & Security Headers
  security: {
    ssl: env.bool('SECURE_SSL', true),
    headers: env.bool('SECURITY_HEADERS', true),
    cors: {
      enabled: env.bool('CORS_ENABLED', true),
      credentials: env.bool('CORS_CREDENTIALS', true),
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
    },
    
    // Content Security Policy
    csp: env.bool('CSP_ENABLED', true),
    hsts: env.bool('HSTS_ENABLED', true),
  },

  // ============================================================================
  // MEMORY & RESOURCE MANAGEMENT
  // ============================================================================

  // Memory Limits
  resources: {
    maxMemoryUsage: env.int('MAX_MEMORY_USAGE', 1073741824), // 1GB
    nodeOptions: env('NODE_OPTIONS', '--max-old-space-size=2048'),
    
    // Garbage Collection
    gc: {
      enabled: env.bool('GC_ENABLED', true),
      interval: env.int('GC_INTERVAL', 300000), // 5 minutes
    },
    
    // Process Management
    cluster: {
      mode: env.bool('CLUSTER_MODE', false),
      workers: env.int('WORKER_PROCESSES', 1),
    },
  },

  // ============================================================================
  // THIRD-PARTY INTEGRATIONS
  // ============================================================================

  // CDN Configuration
  cdn: {
    enabled: env.bool('CDN_ENABLED', false),
    url: env('CDN_URL', ''),
  },

  // Redis Configuration
  redis: {
    enabled: env.bool('REDIS_ENABLED', false),
    host: env('REDIS_HOST', 'localhost'),
    port: env.int('REDIS_PORT', 6379),
    password: env('REDIS_PASSWORD', ''),
    db: env.int('REDIS_DB', 0),
  },

  // Email Configuration
  email: {
    provider: env('EMAIL_PROVIDER', ''),
    host: env('EMAIL_HOST', ''),
    port: env.int('EMAIL_PORT', 587),
    secure: env.bool('EMAIL_SECURE', false),
    username: env('EMAIL_USERNAME', ''),
    password: env('EMAIL_PASSWORD', ''),
  },

  // ============================================================================
  // DEPLOYMENT & MAINTENANCE
  // ============================================================================

  // Deployment Settings
  deployment: {
    type: env('DEPLOYMENT_TYPE', 'production'),
    autoRestart: env.bool('AUTO_RESTART', true),
  },

  // Maintenance Mode
  maintenance: {
    enabled: env.bool('MAINTENANCE_MODE', false),
    message: env('MAINTENANCE_MESSAGE', 'System is under maintenance'),
  },

  // Backup Settings
  backup: {
    enabled: env.bool('ENABLE_DB_BACKUP', true),
    retentionDays: env.int('BACKUP_RETENTION_DAYS', 30),
  },

  // Update Notifications
  updates: {
    autoCheck: env.bool('AUTO_UPDATE_CHECK', false),
    telemetryDisabled: env.bool('TELEMETRY_DISABLED', true),
  },

  // ============================================================================
  // API OPTIMIZATION
  // ============================================================================

  api: {
    // Default populate settings to prevent N+1 queries
    defaultPopulate: false,
    
    // Query optimization
    maxQueryComplexity: env.int('MAX_QUERY_COMPLEXITY', 20),
    maxQueryDepth: env.int('MAX_QUERY_DEPTH', 10),
    
    // Response optimization
    responseTransforms: {
      removeNullValues: env.bool('REMOVE_NULL_VALUES', true),
      stripMetadata: env.bool('STRIP_METADATA', false),
    },
  },
}); 