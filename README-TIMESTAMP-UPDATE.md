# WordPress Timestamp Update Guide

This guide explains how to update the `created_at`, `updated_at`, and `published_at` timestamps in your Strapi database to preserve the original WordPress publication dates after migration.

## Why This Is Needed

When importing content via Strapi's API, you cannot set the `created_at` and `updated_at` fields directly - Strapi automatically sets these to the current time. To preserve the original WordPress timeline, we need to update these timestamps directly in the database after the import is complete.

## Prerequisites

1. **WordPress import completed** - Run the main import script first
2. **Database access** - PostgreSQL connection configured in `.env`
3. **WordPress XML file** - Original export file for date extraction

## Database Timestamp Update

### Option 1: Automatic Script (Recommended)

Run the complete migration workflow that handles both import and timestamp updates:

```bash
# Complete migration (import + timestamp update)
npm run migrate:complete

# Or with custom XML file
npm run migrate:complete wordpress/your-export.xml
```

### Option 2: Manual Timestamp Update

If you've already run the import, update timestamps separately:

```bash
# Update timestamps only
npm run update:timestamps

# Or with custom XML file
npm run update:timestamps wordpress/your-export.xml
```

### Option 3: Individual Scripts

```bash
# Step 1: Import content
npm run import:wordpress

# Step 2: Update timestamps
npm run update:timestamps
```

## What Gets Updated

The script updates three timestamp fields in both `articles` and `knowledgebases` tables:

| Field | Source | Description |
|-------|--------|-------------|
| `created_at` | `wp:post_date` | Original WordPress creation date |
| `updated_at` | `wp:post_modified` | Last modified date in WordPress |
| `published_at` | `wp:post_date` | Publication date (preserved from import) |

## Database Configuration

Ensure your `.env` file has the correct database settings:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
```

## How It Works

1. **Parse WordPress XML** - Extracts original dates from all published posts
2. **Query Strapi Database** - Gets all imported articles and knowledgebase entries
3. **Match Records** - Matches Strapi records to WordPress posts by slug/title
4. **Update Timestamps** - Direct SQL UPDATE queries preserve original dates

## Example Output

```
Starting timestamp update from WordPress XML...

Parsing WordPress XML...
Parsed 89 published WordPress posts

Found 16 articles and 34 knowledgebase entries in database

✓ Updated article: Gamification in online gambling
  📅 Fri Jul 05 2024 → Mon Sep 15 2024
✓ Updated knowledgebase: Multi-tenant gaming platform
  📅 Fri Jul 05 2024 → Fri Jul 05 2024

=== Summary ===
Updated 16 articles
Updated 34 knowledgebase entries
Total records updated: 50
```

## Verification

After running the timestamp update, verify the dates in your Strapi admin panel:

1. Go to **Content Manager > Articles**
2. Check the **Created** column shows original WordPress dates
3. Repeat for **Content Manager > Knowledgebases**

## Database Queries

You can also manually verify/update timestamps with SQL:

```sql
-- Check current timestamps
SELECT id, title, slug, created_at, updated_at, published_at 
FROM articles 
ORDER BY created_at;

-- Example manual update (if needed)
UPDATE articles 
SET 
  created_at = '2024-07-05 12:22:22',
  updated_at = '2024-09-15 14:30:00'
WHERE slug = 'gamification-in-online-gambling';
```

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
psql -h localhost -U your_username -d strapi -c "SELECT NOW();"
```

### Missing Tables

If you get "table doesn't exist" errors:

1. Ensure you've run the WordPress import first
2. Check that your Strapi application is using the correct database
3. Verify table names match your Strapi content types

### Date Format Issues

The script handles multiple WordPress date formats:
- `2024-07-05 12:22:22` (wp:post_date)
- RFC date format (pubDate)
- Invalid dates fall back to current time

### Slug Matching Issues

Records are matched by:
1. Exact slug match (WordPress slug → Strapi slug)
2. Title-based slug match (if WordPress slug differs)

## Complete Migration Workflow

For a fresh migration, use this complete workflow:

```bash
# 1. Ensure Strapi is running
npm run develop

# 2. Run complete migration (import + timestamps)
npm run migrate:complete

# 3. Verify in Strapi admin panel
# 4. Deploy _redirects file to your hosting platform
```

## Benefits

After timestamp update, your content will:
- ✅ Show original WordPress publication dates
- ✅ Maintain proper chronological order
- ✅ Preserve content creation timeline
- ✅ Enable accurate date-based filtering
- ✅ Support proper SEO date signals

## Support

If you encounter issues:
1. Check the console output for specific error messages
2. Verify database connection and permissions
3. Ensure XML file path is correct
4. Check that content was imported successfully first 