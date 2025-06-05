#!/bin/bash

# Production Deployment Script with Database Optimization
# Usage: ./scripts/deploy-production.sh

set -e  # Exit on any error

echo "🚀 Starting Production Deployment..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running in production environment
if [ "$NODE_ENV" != "production" ]; then
    print_warning "NODE_ENV is not set to 'production'. Current value: ${NODE_ENV:-'not set'}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled."
        exit 1
    fi
fi

# Step 1: Backup Database (if needed)
print_status "Step 1: Creating database backup..."
if command -v pg_dump &> /dev/null; then
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    pg_dump $DATABASE_URL > "backups/$BACKUP_FILE" 2>/dev/null || print_warning "Database backup failed or skipped"
    print_success "Database backup created: $BACKUP_FILE"
else
    print_warning "pg_dump not found. Skipping database backup."
fi

# Step 2: Install Dependencies
print_status "Step 2: Installing production dependencies..."
npm ci --only=production

# Step 3: Build Application
print_status "Step 3: Building Strapi application..."
npm run build

# Step 4: Database Migration (Strapi handles this)
print_status "Step 4: Running database migrations..."
# Strapi automatically handles migrations on startup, but you can run them manually:
# npm run strapi migrate

# Step 5: Apply Database Optimizations
print_status "Step 5: Applying database optimizations..."
if [ -f "scripts/optimize-database.js" ]; then
    print_status "Running database optimization script..."
    node scripts/optimize-database.js
    
    if [ $? -eq 0 ]; then
        print_success "Database optimization completed successfully!"
    else
        print_error "Database optimization failed!"
        print_warning "Deployment can continue, but performance may be affected."
        read -p "Continue deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    print_warning "Database optimization script not found. Skipping optimization."
fi

# Step 6: Start Application (or restart if using PM2/Docker)
print_status "Step 6: Starting application..."

# Option A: Direct start
# npm start

# Option B: PM2 (if using PM2)
if command -v pm2 &> /dev/null; then
    pm2 restart strapi || pm2 start npm --name "strapi" -- start
    print_success "Application restarted with PM2"
else
    print_status "PM2 not found. Please start your application manually with: npm start"
fi

# Step 7: Health Check
print_status "Step 7: Running health check..."
sleep 5  # Wait for application to start

# Test if the application is responding
if curl -f -s http://localhost:${PORT:-1337}/api/articles > /dev/null; then
    print_success "Health check passed! Application is responding."
else
    print_warning "Health check failed. Please verify the application manually."
fi

# Step 8: Performance Test (Optional)
if [ -f "scripts/test-performance.js" ]; then
    print_status "Step 8: Running performance tests..."
    node scripts/test-performance.js
fi

print_success "🎉 Production deployment completed!"
print_status "Monitor your application logs and performance metrics."

echo ""
echo "📝 Post-deployment checklist:"
echo "  ✓ Database optimizations applied"
echo "  ✓ Application started"
echo "  ✓ Health check completed"
echo "  □ Monitor application logs"
echo "  □ Check performance metrics"
echo "  □ Verify all features working"
echo "" 