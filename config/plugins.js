module.exports = ({ env }) => ({
    seo: {
        enabled: true,
        },
        upload: {
          config: {
            provider: 'aws-s3',
            providerOptions: {
              accessKeyId: env('AWS_ACCESS_KEY_ID'),
              secretAccessKey: env('AWS_ACCESS_SECRET'),
              region: env('AWS_REGION'),
              params: {
                ACL: env('AWS_ACL', 'public-read'),
                signedUrlExpires: env('AWS_SIGNED_URL_EXPIRES', 15 * 60),
                Bucket: env('AWS_BUCKET'),
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
        enabled: true,
        config: {
        debug: false, // Enable debug logs
        max: 1000, // Maximum number of items in the cache (only for memory cache)
        ttl: 1000 * 60 * 60, // Time to live for cache items (1 hour)
        size: 1024 * 1024 * 1024, // Maximum size of the cache (1 GB) (only for memory cache)
        allowStale: false, // Allow stale cache items (only for memory cache)
        cacheableRoutes: [], // Caches routes which start with these paths (if empty array, all '/api' routes are cached)
        provider: 'memory', // Cache provider ('memory' or 'redis')
        cacheHeaders: true, // Plugin also stores response headers in the cache (set to false if you don't want to cache headers)
        cacheAuthorizedRequests: false, // Cache requests with authorization headers (set to true if you want to cache authorized requests)
        cacheGetTimeoutInMs: 1000, // Timeout for getting cached data in milliseconds (default is 1 seconds)
        },
    }
});