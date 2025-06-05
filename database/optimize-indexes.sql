-- PostgreSQL Index Optimization Script for Strapi Blog
-- This script creates strategic indexes to improve query performance
-- Run this after your Strapi application has created all tables

-- ============================================================================
-- ARTICLES TABLE INDEXES (Most Important - Main Content)
-- ============================================================================

-- Index for published articles filtering (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_published_at_desc 
ON articles (published_at DESC) 
WHERE published_at IS NOT NULL;

-- Index for slug lookups (single article pages)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_slug 
ON articles (slug) 
WHERE slug IS NOT NULL;

-- Index for category filtering with published articles
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_category_published 
ON articles (category_id, published_at DESC) 
WHERE published_at IS NOT NULL;

-- Index for author filtering with published articles
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_author_published 
ON articles (author_id, published_at DESC) 
WHERE published_at IS NOT NULL;

-- Index for title search (full-text search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_title_search 
ON articles USING gin(to_tsvector('english', COALESCE(title, '')));

-- Index for description search (full-text search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_description_search 
ON articles USING gin(to_tsvector('english', COALESCE(description, '')));

-- Combined index for listing published articles with SEO fields
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_list_published 
ON articles (published_at DESC, created_at DESC) 
WHERE published_at IS NOT NULL;

-- Index for locale-specific queries (i18n support)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_locale_published 
ON articles (locale, published_at DESC) 
WHERE published_at IS NOT NULL AND locale IS NOT NULL;

-- ============================================================================
-- CATEGORIES TABLE INDEXES
-- ============================================================================

-- Index for category slug lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_slug 
ON categories (slug) 
WHERE slug IS NOT NULL;

-- Index for category name sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_name 
ON categories (name) 
WHERE name IS NOT NULL;

-- ============================================================================
-- AUTHORS TABLE INDEXES
-- ============================================================================

-- Index for author name lookups and sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_authors_name 
ON authors (name) 
WHERE name IS NOT NULL;

-- ============================================================================
-- STRAPI SYSTEM TABLE INDEXES
-- ============================================================================

-- Index for admin users table (login performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_users_email 
ON admin_users (email) 
WHERE email IS NOT NULL;

-- Index for admin users active status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_users_active 
ON admin_users (is_active, email) 
WHERE is_active = true;

-- Index for API tokens (authentication performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_strapi_api_tokens_access_key 
ON strapi_api_tokens (access_key) 
WHERE access_key IS NOT NULL;

-- Index for transfer tokens
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_strapi_transfer_tokens_access_key 
ON strapi_transfer_tokens (access_key) 
WHERE access_key IS NOT NULL;

-- ============================================================================
-- MEDIA/FILES TABLE INDEXES (Strapi Upload Plugin)
-- ============================================================================

-- Index for file lookups by name
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_name 
ON files (name) 
WHERE name IS NOT NULL;

-- Index for file lookups by hash (duplicate detection)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_hash 
ON files (hash) 
WHERE hash IS NOT NULL;

-- Index for file provider and provider_metadata
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_provider 
ON files (provider) 
WHERE provider IS NOT NULL;

-- ============================================================================
-- RELATIONS TABLE INDEXES (Strapi handles relations via link tables)
-- ============================================================================

-- These indexes will be created when the tables exist
-- Articles to Categories relation
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_category_links_article_id 
-- ON articles_category_links (article_id);

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_category_links_category_id 
-- ON articles_category_links (category_id);

-- Articles to Authors relation  
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_author_links_article_id 
-- ON articles_author_links (article_id);

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_author_links_author_id 
-- ON articles_author_links (author_id);

-- ============================================================================
-- INTERNATIONALIZATION (i18n) INDEXES
-- ============================================================================

-- Index for locale-specific global settings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_globals_locale 
ON globals (locale) 
WHERE locale IS NOT NULL;

-- Index for locale-specific home pages
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_home_pages_locale 
ON home_pages (locale) 
WHERE locale IS NOT NULL;

-- Index for locale-specific footers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_footers_locale 
ON footers (locale) 
WHERE locale IS NOT NULL;

-- Index for locale-specific headers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_headers_locale 
ON headers (locale) 
WHERE locale IS NOT NULL;

-- ============================================================================
-- COMPONENT TABLES INDEXES
-- ============================================================================

-- These will depend on the actual component structure Strapi creates

-- ============================================================================
-- MAINTENANCE QUERIES
-- ============================================================================

-- Query to check index usage
-- SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- ORDER BY idx_tup_read DESC;

-- Query to check table sizes
-- SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Query to find slow queries (requires pg_stat_statements extension)
-- SELECT query, calls, total_time, mean_time, rows 
-- FROM pg_stat_statements 
-- ORDER BY mean_time DESC 
-- LIMIT 10; 