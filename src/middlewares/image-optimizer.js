const sharp = require('sharp');
const path = require('path');

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    await next();

    // Only process upload requests
    if (ctx.url.includes('/api/upload') && ctx.method === 'POST') {
      const files = ctx.state.files || [];
      
      for (const file of files) {
        if (file.mime.startsWith('image/') && !file.mime.includes('svg')) {
          try {
            // Create WebP version
            const webpBuffer = await sharp(file.buffer)
              .webp({ quality: 80 })
              .toBuffer();

            // Create responsive sizes
            const sizes = [
              { name: 'thumbnail', width: 300 },
              { name: 'medium', width: 768 },
              { name: 'large', width: 1200 }
            ];

            const formats = [];
            
            // Add original WebP
            formats.push({
              ...file,
              name: file.name.replace(/\.[^/.]+$/, '.webp'),
              buffer: webpBuffer,
              mime: 'image/webp',
              ext: '.webp'
            });

            // Add responsive sizes
            for (const size of sizes) {
              const resizedBuffer = await sharp(file.buffer)
                .resize(size.width, null, { withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();

              formats.push({
                ...file,
                name: file.name.replace(/\.[^/.]+$/, `_${size.name}.webp`),
                buffer: resizedBuffer,
                mime: 'image/webp',
                ext: '.webp'
              });
            }

            // Update file object with formats
            file.formats = formats;
          } catch (error) {
            strapi.log.error('Image optimization failed:', error);
          }
        }
      }
    }
  };
}; 