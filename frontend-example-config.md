# Frontend Image Optimization for Strapi 5

## Next.js Configuration

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['your-s3-bucket.s3.amazonaws.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
}
```

## Usage in Components

```jsx
// components/OptimizedImage.jsx
import Image from 'next/image'

export default function OptimizedImage({ src, alt, ...props }) {
  return (
    <Image
      src={src}
      alt={alt}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
      loading="lazy"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      {...props}
    />
  )
}
```

## Fetch from Strapi

```javascript
// lib/strapi.js
const getStrapiMedia = (media) => {
  const { url } = media.data.attributes
  const imageUrl = url.startsWith('/') ? `${process.env.NEXT_PUBLIC_STRAPI_API_URL}${url}` : url
  return imageUrl
}

export { getStrapiMedia }
```

## Benefits
- Automatic WebP/AVIF conversion
- Responsive images
- Lazy loading
- Optimized for Core Web Vitals
- Works with your existing AWS S3 setup 