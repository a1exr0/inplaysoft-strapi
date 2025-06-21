module.exports = ({ env }) => [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'dl.airtable.com',
            `${env('AWS_BUCKET_NAME')}.s3.${env('AWS_REGION')}.amazonaws.com`,
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'dl.airtable.com',
            `${env('AWS_BUCKET_NAME')}.s3.${env('AWS_REGION')}.amazonaws.com`,
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      headers: ['*'],
      origin: [
        'http://localhost:1337', // Strapi admin
        'http://localhost:3000', // Local development
        'https://preview.inplaysoft.com', // Production preview domain
        'https://www.inplaysoft.com', // Production main domain
        'https://inplaysoft.com', // Production main domain (without www)
        // Dynamic origin function for all inplaysoft.com subdomains
        (origin, callback) => {
          if (!origin) return callback(null, true);
          if (origin.includes('.inplaysoft.com') || origin.includes('inplaysoft.com')) {
            return callback(null, true);
          }
          callback(new Error('Not allowed by CORS'));
        }
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  // Custom image optimizer middleware
  {
    name: 'global::image-optimizer',
    config: {}
  }
];