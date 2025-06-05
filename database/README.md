# Database Performance Optimization Guide

This guide provides comprehensive database optimization strategies for your Strapi blog application to reduce query times from 300ms+ to under 100ms.

## 🚀 Quick Start

### 1. Apply Database Indexes

```bash
# First, make sure your Strapi application is running to create tables
npm run develop

# In a new terminal, run the optimization script
node scripts/optimize-database.js
```

### 2. Update Environment Variables

Add these performance-related environment variables to your `.env` file:

```env
# Database Performance
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20
DATABASE_CONNECTION_TIMEOUT=60000
DATABASE_DEBUG=false

# Query Performance
DEFAULT_PAGINATION_LIMIT=25
MAX_PAGINATION_LIMIT=100
SLOW_QUERY_THRESHOLD=300

# Caching
CACHE_ENABLED=true
CACHE_MAX_AGE=300000

# Monitoring
MONITORING_ENABLED=true
DB_QUERY_LOGGING=false
```

## 📊 Database Indexes Created

### Articles Table (Primary Performance Target)
- **`idx_articles_published_at_desc`**: Optimizes listing published articles (most common query)
- **`idx_articles_slug`**: Optimizes single article page loads
- **`idx_articles_category_published`**: Optimizes category filtering
- **`idx_articles_author_published`**: Optimizes author filtering
- **`idx_articles_title_search`**: Enables fast full-text search on titles
- **`idx_articles_description_search`**: Enables fast full-text search on descriptions
- **`idx_articles_locale_published`**: Optimizes i18n queries

### Categories Table
- **`idx_categories_slug`**: Fast category page loads
- **`idx_categories_name`**: Optimizes category sorting

### Authors Table
- **`idx_authors_name`**: Fast author lookups and sorting

### System Tables
- **Admin users**: Email-based login optimization
- **API tokens**: Authentication performance
- **Files**: Media handling optimization

## 🔍 Performance Monitoring

### Check Query Performance

```sql
-- Enable query statistics (run once)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Check slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
WHERE mean_time > 300  -- queries taking more than 300ms
ORDER BY mean_time DESC;
```

### Monitor Index Usage

```sql
-- Check which indexes are being used
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Analyze Table Sizes

```sql
-- Check table sizes to identify optimization targets
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 🛠️ Application-Level Optimizations

### 1. Optimize API Calls

```javascript
// Bad: Loads all relations (N+1 queries)
const articles = await strapi.entityService.findMany('api::article.article');

// Good: Selective population
const articles = await strapi.entityService.findMany('api::article.article', {
  populate: {
    author: {
      select: ['name', 'position']
    },
    category: {
      select: ['name', 'slug']
    },
    cover: {
      select: ['url', 'alternativeText']
    }
  },
  pagination: {
    pageSize: 25
  },
  sort: 'published_at:desc'
});
```

### 2. Implement Caching

```javascript
// In your controller
const cache = strapi.cache;
const cacheKey = `articles:${page}:${category}`;

let articles = await cache.get(cacheKey);
if (!articles) {
  articles = await strapi.entityService.findMany('api::article.article', {
    // your query options
  });
  await cache.set(cacheKey, articles, { ttl: 300000 }); // 5 minutes
}
```

### 3. Use Pagination Everywhere

```javascript
// Always paginate results
const articles = await strapi.entityService.findMany('api::article.article', {
  pagination: {
    page: page || 1,
    pageSize: 25,
    withCount: true
  }
});
```

## 📈 Expected Performance Improvements

| Query Type | Before Optimization | After Optimization | Improvement |
|------------|--------------------|--------------------|-------------|
| Article listing | 300-500ms | 50-100ms | 70-80% faster |
| Single article | 200-300ms | 20-50ms | 85-90% faster |
| Category filtering | 400-600ms | 80-120ms | 70-80% faster |
| Search queries | 500-1000ms | 100-200ms | 80-90% faster |
| Admin login | 100-200ms | 20-50ms | 75-80% faster |

## 🔧 Advanced Optimizations

### 1. Connection Pooling
The database configuration now includes optimized connection pooling:
- Minimum connections: 2
- Maximum connections: 20
- Connection timeouts: 60 seconds
- Idle timeout: 30 seconds

### 2. Full-Text Search
PostgreSQL full-text search indexes are created for:
- Article titles
- Article descriptions

### 3. Partial Indexes
Many indexes use `WHERE` clauses to:
- Only index published articles
- Exclude null values
- Reduce index size and improve performance

## 🚨 Troubleshooting

### Common Issues

1. **Tables don't exist**
   ```bash
   # Make sure Strapi is running first
   npm run develop
   # Then run optimization
   node scripts/optimize-database.js
   ```

2. **Connection errors**
   ```bash
   # Check your database configuration
   psql -h localhost -U postgres -d strapi_local
   ```

3. **Slow queries persist**
   ```sql
   -- Analyze table statistics
   ANALYZE articles;
   ANALYZE categories;
   ANALYZE authors;
   ```

### Performance Testing

```bash
# Test API performance
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:1337/api/articles?populate=*"

# Create curl-format.txt:
echo "     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n" > curl-format.txt
```

## 📝 Maintenance

### Regular Maintenance Tasks

1. **Weekly**: Run `VACUUM ANALYZE` on your database
2. **Monthly**: Check index usage and remove unused indexes
3. **Quarterly**: Review and optimize slow queries
4. **As needed**: Update statistics with `ANALYZE`

### Monitoring Queries

```sql
-- Check for unused indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes 
WHERE idx_scan = 0
AND schemaname = 'public';

-- Check for missing indexes on foreign keys
SELECT 
  c.conname AS constraint_name,
  t.relname AS table_name,
  a.attname AS column_name
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
WHERE c.contype = 'f'
AND NOT EXISTS (
  SELECT 1 FROM pg_index i
  WHERE i.indrelid = c.conrelid
  AND a.attnum = ANY(i.indkey)
);
```

## 🎯 Next Steps

1. **Apply the optimizations** using the provided scripts
2. **Monitor performance** using the provided queries
3. **Test your application** to ensure everything works correctly
4. **Set up regular maintenance** tasks
5. **Consider implementing Redis** for caching in production
6. **Add monitoring tools** like New Relic or DataDog for ongoing analysis

## 📞 Support

If you encounter issues with these optimizations:

1. Check the troubleshooting section above
2. Review the PostgreSQL logs for errors
3. Use `EXPLAIN ANALYZE` to understand query execution plans
4. Consider consulting with a database administrator for complex issues

Remember to always test these optimizations in a development environment before applying them to production! 