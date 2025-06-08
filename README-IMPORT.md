# WordPress to Strapi Import Guide

This script imports content from a WordPress XML export into your Strapi CMS, automatically handling:

- **Category-based content routing**: "News" → Articles, "Insights" → Knowledgebase
- **Image migration**: Downloads from WordPress and uploads to S3 via Strapi
- **SEO redirects**: Generates 301 redirects from old URLs to new ones
- **Content adaptation**: Cleans HTML and structures it for Strapi's dynamic zones

## Prerequisites

1. **Strapi running locally**: Make sure your Strapi server is running (`npm run develop`)
2. **S3 configured**: Your `.env` file should have AWS S3 settings
3. **XML export**: WordPress XML export file in the `wordpress/` directory
4. **API Token created**: Create a Strapi API token for secure access

## Usage

### 1. Prepare XML Export
Place your WordPress XML export file in the `wordpress/` directory:
```
wordpress/
  └── inplaysoft.WordPress.2025-06-07.xml
```

### 2. Create API Token
```bash
npm run setup:import
```
Follow the instructions to create a secure API token in Strapi admin.

### 3. Run Import
```bash
npm run import:wordpress
```

Or with a custom XML file path:
```bash
npm run import:wordpress path/to/your/export.xml
```

## What the Import Does

### Content Processing
- **News articles** → Creates entries in `Articles` content type
- **Insights articles** → Creates entries in `Knowledgebase` content type
- **Categories** → Auto-creates "News" category and "Insights" knowledgebase category
- **Author** → Uses default "InplaySoft" author for all content

### Image Handling
1. Downloads images from WordPress URLs
2. Uploads to your S3 bucket via Strapi's upload system
3. Updates content with new image URLs
4. Preserves image metadata and creates Strapi media entries

### SEO & Redirects
- Generates `_redirects` file with 301 redirects
- News: `/{old-slug}/` → `/blog/{new-slug}`
- Insights: `/{old-slug}/` → `/knowledgebase/{new-slug}`

### Content Structure
Each imported item gets:
- **Title** from WordPress post title
- **Description** from excerpt (or generated from title)
- **Slug** cleaned and URL-friendly
- **Cover image** from first image in content
- **Rich text content** in dynamic zone
- **SEO metadata** with title, description, keywords
- **Publication date** preserved from WordPress

## After Import

1. **Review content**: Check imported articles and knowledgebase entries
2. **Update redirects**: Deploy the generated `_redirects` file to your hosting
3. **Check images**: Verify all images uploaded correctly to S3
4. **Test URLs**: Ensure redirects work properly

## Troubleshooting

### Common Issues

**"Missing STRAPI_API_TOKEN environment variable"**
- Create an API token in Strapi admin (Settings > API Tokens)
- Add `STRAPI_API_TOKEN=your_token` to your `.env` file
- Make sure the token has "Full access" permissions

**"Failed to download image"**
- Some WordPress images might be unavailable
- Script continues with other images

**"Strapi API error: 403"**
- Verify your API token is correct and has full access
- Check that the token hasn't expired

### Logs
The script provides detailed console output:
- `✓ Created article: Title` - Successfully imported
- `✓ Uploaded image: filename.jpg` - Image processed
- `✓ Created category: News` - Category created
- Error messages with details for failed operations

## Script Configuration

Key settings in `scripts/wordpress-import.js`:

```javascript
// Default author settings
const authorData = {
  name: 'InplaySoft',
  position: 'Content Team',
  team: 'Marketing'
};

// URL patterns for redirects
// News: /{old-slug}/ → /blog/{new-slug}
// Insights: /{old-slug}/ → /knowledgebase/{new-slug}
```

## Content Mapping

| WordPress | Strapi Content Type | Category Mapping |
|-----------|-------------------|------------------|
| News posts | Articles | `api::category.category` |
| Insights posts | Knowledgebase | `api::knowledgebase-category.knowledgebase-category` |
| Images | Media Library | S3 upload via Strapi |
| Categories | Auto-created | News/Insights |

---

**Need help?** Check the console output for detailed error messages and processing status. 