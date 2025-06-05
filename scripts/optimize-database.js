#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Database configuration from environment
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  database: process.env.DATABASE_NAME || 'strapi_local',
  user: process.env.DATABASE_USERNAME || 'postgres',
  password: String(process.env.DATABASE_PASSWORD || ''), // Ensure password is a string
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// Debug database configuration (without password)
console.log('🔧 Database Configuration:');
console.log(`  Host: ${dbConfig.host}`);
console.log(`  Port: ${dbConfig.port}`);
console.log(`  Database: ${dbConfig.database}`);
console.log(`  User: ${dbConfig.user}`);
console.log(`  SSL: ${dbConfig.ssl ? 'enabled' : 'disabled'}`);
console.log(`  Password: ${dbConfig.password ? '[SET]' : '[NOT SET]'}\n`);

const pool = new Pool(dbConfig);

console.log('🚀 Starting Database Optimization for Strapi Blog...\n');

async function checkDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT current_database(), version()');
    console.log('✅ Database Connection Successful!');
    console.log(`   Database: ${result.rows[0].current_database}`);
    console.log(`   PostgreSQL: ${result.rows[0].version.split(' ')[1]}`);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('  1. Check if PostgreSQL is running');
    console.log('  2. Verify database credentials in .env file');
    console.log('  3. Ensure database exists: CREATE DATABASE strapi_local;');
    console.log('  4. Test connection manually: psql -h localhost -U postgres -d strapi_local');
    return false;
  }
}

async function checkTablesExist() {
  try {
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('articles', 'categories', 'authors', 'admin_users', 'files')
      ORDER BY table_name;
    `;
    const result = await pool.query(query);
    console.log('📋 Existing Strapi tables:', result.rows.map(r => r.table_name));
    return result.rows.length > 0;
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
    return false;
  }
}

async function getCurrentIndexes() {
  try {
    const query = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ('articles', 'categories', 'authors', 'admin_users', 'files')
      ORDER BY tablename, indexname;
    `;
    const result = await pool.query(query);
    console.log('\n📊 Current indexes:');
    result.rows.forEach(row => {
      console.log(`  ${row.tablename}.${row.indexname}`);
    });
    return result.rows;
  } catch (error) {
    console.error('❌ Error fetching indexes:', error.message);
    return [];
  }
}

async function analyzeTableSizes() {
  try {
    const query = `
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('articles', 'categories', 'authors', 'admin_users', 'files')
      ORDER BY size_bytes DESC;
    `;
    const result = await pool.query(query);
    console.log('\n📈 Table sizes:');
    result.rows.forEach(row => {
      console.log(`  ${row.tablename}: ${row.size}`);
    });
    return result.rows;
  } catch (error) {
    console.error('❌ Error analyzing table sizes:', error.message);
    return [];
  }
}

async function applyOptimizations() {
  try {
    const sqlFile = path.join(__dirname, '..', 'database', 'optimize-indexes.sql');
    
    if (!fs.existsSync(sqlFile)) {
      console.log('❌ SQL optimization file not found:', sqlFile);
      return false;
    }

    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split SQL into individual statements - improved parsing
    const statements = sql
      .split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('--'))
      .join('\n')
      .split(/;\s*$/m)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && stmt.toUpperCase().includes('CREATE INDEX'))
      .map(stmt => stmt.endsWith(';') ? stmt : stmt + ';');

    console.log(`\n🔧 Applying ${statements.length} optimization statements...`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        const indexMatch = statement.match(/CREATE INDEX[^I]*IF NOT EXISTS\s+([a-z_]+)/i);
        const indexName = indexMatch ? indexMatch[1] : 'unknown';
        console.log(`  Creating index: ${indexName}`);
        
        await pool.query(statement);
        successCount++;
        console.log(`  ✅ Successfully created: ${indexName}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          skipCount++;
          console.log(`  ⏭️  Index already exists, skipping...`);
        } else if (error.message.includes('does not exist')) {
          skipCount++;
          console.log(`  ⏭️  Table does not exist yet, skipping...`);
        } else {
          errorCount++;
          console.error(`  ❌ Error: ${error.message}`);
        }
      }
    }

    console.log(`\n📊 Optimization Results:`);
    console.log(`  ✅ Successfully applied: ${successCount}`);
    console.log(`  ⏭️  Skipped: ${skipCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);

    return errorCount === 0;
  } catch (error) {
    console.error('❌ Error applying optimizations:', error.message);
    return false;
  }
}

async function runPerformanceAnalysis() {
  try {
    console.log('\n🔍 Running performance analysis...');

    // Check for missing indexes on foreign keys
    const missingIndexesQuery = `
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
      )
      AND t.relname IN ('articles', 'categories', 'authors')
      ORDER BY t.relname, a.attname;
    `;

    const missingIndexes = await pool.query(missingIndexesQuery);
    
    if (missingIndexes.rows.length > 0) {
      console.log('⚠️  Missing indexes on foreign keys:');
      missingIndexes.rows.forEach(row => {
        console.log(`  ${row.table_name}.${row.column_name} (${row.constraint_name})`);
      });
    } else {
      console.log('✅ All foreign keys are properly indexed');
    }

    // Check index usage statistics (if available)
    const indexUsageQuery = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes 
      WHERE schemaname = 'public'
      AND tablename IN ('articles', 'categories', 'authors', 'admin_users', 'files')
      ORDER BY idx_scan DESC;
    `;

    const indexUsage = await pool.query(indexUsageQuery);
    if (indexUsage.rows.length > 0) {
      console.log('\n📊 Index usage statistics:');
      indexUsage.rows.forEach(row => {
        console.log(`  ${row.tablename}.${row.indexname}: ${row.idx_scan} scans`);
      });
    }

  } catch (error) {
    console.error('❌ Error in performance analysis:', error.message);
  }
}

async function generateRecommendations() {
  console.log('\n💡 Performance Recommendations:');
  console.log('  1. ✅ Apply the database optimization script');
  console.log('  2. 🔍 Monitor query performance with pg_stat_statements');
  console.log('  3. 📊 Use EXPLAIN ANALYZE for slow queries');
  console.log('  4. 🚀 Consider connection pooling (already configured)');
  console.log('  5. 🗂️  Implement pagination for large datasets');
  console.log('  6. 💾 Use Redis for caching frequently accessed data');
  console.log('  7. 📈 Monitor database performance with pg_stat_user_tables');
  
  console.log('\n🔧 Additional Strapi optimizations:');
  console.log('  • Enable response caching in Strapi configuration');
  console.log('  • Use populate selectively in API calls');
  console.log('  • Consider CDN for media files');
  console.log('  • Enable gzip compression');
}

async function main() {
  try {
    // Check database connection
    const connected = await checkDatabaseConnection();
    if (!connected) {
      process.exit(1);
    }

    // Check if Strapi tables exist
    const tablesExist = await checkTablesExist();
    if (!tablesExist) {
      console.log('\n⚠️  Strapi tables not found. Please run your Strapi application first to create the database schema.');
      console.log('   Run: npm run develop');
      console.log('\n   Then run this script again to apply optimizations.');
      process.exit(0);
    }

    // Analyze current state
    await getCurrentIndexes();
    await analyzeTableSizes();

    // Apply optimizations
    const success = await applyOptimizations();
    
    if (success) {
      console.log('\n✅ Database optimization completed successfully!');
    }

    // Run performance analysis
    await runPerformanceAnalysis();

    // Generate recommendations
    await generateRecommendations();

    console.log('\n🎉 Database optimization process completed!');
    console.log('\n📝 Next steps:');
    console.log('  1. Test your application performance');
    console.log('  2. Monitor query execution times');
    console.log('  3. Run VACUUM ANALYZE on your database regularly');
    console.log('  4. Consider upgrading PostgreSQL if using an older version');

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Process interrupted. Cleaning up...');
  await pool.end();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function
main().catch(console.error); 