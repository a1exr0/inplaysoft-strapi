module.exports = ({ env }) => ({
    seo: {
        enabled: true,
        },
        upload: {
          config: {
            provider: 'aws-s3',
            providerOptions: {
              s3Options: {
                credentials: {
                  accessKeyId: env('AWS_ACCESS_KEY_ID'),
                  secretAccessKey: env('AWS_ACCESS_SECRET'),
                },
                region: env('AWS_REGION'),
                params: {
                  ACL: env('AWS_ACL', 'public-read'),
                  signedUrlExpires: env('AWS_SIGNED_URL_EXPIRES', 15 * 60),
                  Bucket: env('AWS_BUCKET_NAME'),
                },
              },
            },
            actionOptions: {
              upload: {},
              uploadStream: {},
              delete: {},
            },
          },
        },
    // config/plugins.{js,ts}
    'strapi-cache': {
        enabled: env.bool('CACHE_ENABLED', true),
        config: {
        debug: env.bool('CACHE_DEBUG', false), // Enable debug logs (disable in production)
        max: env.int('CACHE_MAX_ITEMS', 1000), // Maximum number of items in the cache (only for memory cache)
        ttl: env.int('CACHE_TTL', 1000 * 60 * 60 * 24 * 7), // Time to live for cache items (1 week - perfect for CMS content)
        size: env.int('CACHE_SIZE', 1024 * 1024 * 1024), // Maximum size of the cache (1 GB) (only for memory cache)
        allowStale: env.bool('CACHE_ALLOW_STALE', false), // Allow stale cache items (only for memory cache)
        cacheableRoutes: ['/api/articles', '/api/footer', '/api/header', '/api/global', '/api/home-page', '/api/categories', '/api/authors'], // Caches routes which start with these paths (if empty array, all '/api' routes are cached)
        provider: env('CACHE_PROVIDER', 'memory'), // Cache provider ('memory' or 'redis')
        cacheHeaders: env.bool('CACHE_HEADERS', true), // Plugin also stores response headers in the cache (set to false if you don't want to cache headers)
        cacheAuthorizedRequests: env.bool('CACHE_AUTHORIZED_REQUESTS', true), // Cache requests with authorization headers (set to true if you want to cache authorized requests)
        cacheGetTimeoutInMs: env.int('CACHE_GET_TIMEOUT', 500), // Timeout for getting cached data in milliseconds (500ms for faster response)
        },
    }
});