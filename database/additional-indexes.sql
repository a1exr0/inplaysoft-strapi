-- Additional indexes for article relationships
-- Run this after the main optimization script

-- Check if articles table has category_id column and create index
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'articles' AND column_name = 'category_id'
  ) THEN
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_category_id 
    ON articles (category_id, published_at DESC) 
    WHERE published_at IS NOT NULL AND category_id IS NOT NULL;
  END IF;
END $$;

-- Check if articles table has author_id column and create index
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'articles' AND column_name = 'author_id'
  ) THEN
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_author_id 
    ON articles (author_id, published_at DESC) 
    WHERE published_at IS NOT NULL AND author_id IS NOT NULL;
  END IF;
END $$;

-- Analyze tables to update statistics after index creation
ANALYZE articles;
ANALYZE categories;
ANALYZE authors;
ANALYZE files;
ANALYZE admin_users; 