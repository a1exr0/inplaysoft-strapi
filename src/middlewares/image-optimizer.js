const sharp = require('sharp');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    await next();

    // Only process upload requests
    if (ctx.url.includes('/upload') && ctx.method === 'POST') {
      const files = ctx.request.files;
      
      if (files && typeof files === 'object') {
        let fileArray = [];
        if (Array.isArray(files)) {
          fileArray = files;
        } else if (files.files) {
          fileArray = Array.isArray(files.files) ? files.files : [files.files];
        } else {
          const possibleFiles = Object.values(files).find(val => 
            val && (Array.isArray(val) || (val.originalFilename && val.mimetype))
          );
          if (possibleFiles) {
            fileArray = Array.isArray(possibleFiles) ? possibleFiles : [possibleFiles];
          }
        }
        
        for (let i = 0; i < fileArray.length; i++) {
          const file = fileArray[i];
          
          // Process image files (excluding SVG)
          if (file && file.mimetype && file.mimetype.startsWith('image/') && !file.mimetype.includes('svg')) {
            console.log('🖼️  Processing image for WebP conversion:', file.originalFilename);
            
            try {
              let imageBuffer;
              if (file.filepath) {
                imageBuffer = require('fs').readFileSync(file.filepath);
              } else {
                console.log('❌ No filepath available for image processing');
                continue;
              }

              // Create WebP version
              const webpBuffer = await sharp(imageBuffer)
                .webp({ quality: 80 })
                .toBuffer();

              // Create responsive sizes
              const sizes = [
                { name: 'thumbnail', width: 300 },
                { name: 'medium', width: 750 },
                { name: 'large', width: 1200 }
              ];

              const webpFormats = {};
              
              for (const size of sizes) {
                const resizedBuffer = await sharp(imageBuffer)
                  .resize(size.width, null, { withoutEnlargement: true })
                  .webp({ quality: 80 })
                  .toBuffer();
                
                webpFormats[size.name] = {
                  buffer: resizedBuffer,
                  width: size.width,
                  size: resizedBuffer.length
                };
              }

              // Also create main WebP version
              webpFormats.main = {
                buffer: webpBuffer,
                size: webpBuffer.length
              };

              const compressionRatio = ((file.size - webpBuffer.length) / file.size * 100).toFixed(1);
              console.log(`✅ WebP conversion completed: ${file.originalFilename} (${compressionRatio}% compression)`);

              // Upload WebP files to S3 and update response
              if (ctx.response && ctx.response.body && Array.isArray(ctx.response.body)) {
                const uploadedFile = ctx.response.body[0]; // Assuming single file upload
                if (uploadedFile && uploadedFile.formats) {
                  try {
                    // Initialize S3 with existing configuration
                    const s3Config = {
                      region: process.env.AWS_REGION,
                      credentials: {
                        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                        secretAccessKey: process.env.AWS_ACCESS_SECRET,
                      }
                    };
                    
                    if (!s3Config.credentials.accessKeyId || !s3Config.credentials.secretAccessKey || !s3Config.region) {
                      console.log('⚠️  AWS credentials not found - WebP files created but not uploaded');
                    } else {
                      const s3 = new S3Client(s3Config);
                      const bucketName = process.env.AWS_BUCKET_NAME;
                      
                      // Upload main WebP file
                      const mainWebpKey = uploadedFile.hash.replace(/\.[^/.]+$/, '.webp');
                      const mainUploadParams = {
                        Bucket: bucketName,
                        Key: mainWebpKey,
                        Body: webpFormats.main.buffer,
                        ContentType: 'image/webp'
                      };
                      
                      const mainUploadResult = await s3.send(new PutObjectCommand(mainUploadParams));
                      
                      // Update main file to WebP
                      uploadedFile.url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${mainWebpKey}`;
                      uploadedFile.mime = 'image/webp';
                      uploadedFile.ext = '.webp';
                      uploadedFile.size = (webpFormats.main.size / 1024).toFixed(2);
                      
                      // Upload and update format variants
                      const updatedFormats = {};
                      for (const [formatName, formatData] of Object.entries(uploadedFile.formats)) {
                        if (webpFormats[formatName]) {
                          const webpKey = formatData.hash.replace(/\.[^/.]+$/, '.webp');
                          const formatUploadParams = {
                            Bucket: bucketName,
                            Key: webpKey,
                            Body: webpFormats[formatName].buffer,
                            ContentType: 'image/webp'
                          };
                          
                          const formatUploadResult = await s3.send(new PutObjectCommand(formatUploadParams));
                          
                          // Update format to WebP
                          updatedFormats[formatName] = {
                            ...formatData,
                            url: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${webpKey}`,
                            mime: 'image/webp',
                            ext: '.webp',
                            size: (webpFormats[formatName].size / 1024).toFixed(2),
                            sizeInBytes: webpFormats[formatName].size
                          };
                        } else {
                          // Keep original format if no WebP version
                          updatedFormats[formatName] = formatData;
                        }
                      }
                      
                      uploadedFile.formats = updatedFormats;
                      
                      console.log(`🎉 Successfully uploaded ${Object.keys(updatedFormats).length + 1} WebP files to S3`);
                    }
                  } catch (s3Error) {
                    console.error('❌ S3 upload failed:', s3Error.message);
                    console.log('🚧 Keeping original files');
                  }
                  
                  // Add WebP processing info to response for debugging
                  uploadedFile.webpProcessingInfo = {
                    originalSize: file.size,
                    webpSize: webpBuffer.length,
                    compressionRatio: compressionRatio + '%',
                    webpFormatsCreated: Object.keys(webpFormats),
                    processingTimestamp: new Date().toISOString()
                  };
                }
              }

            } catch (error) {
              console.error('❌ Error processing image:', file.originalFilename, error.message);
            }
          }
        }
      }
    }
  };
}; 