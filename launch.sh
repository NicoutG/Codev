#!/bin/bash

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Use docker compose (v2) if available, otherwise docker-compose (v1)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

print_info "Starting Polytech Stats application deployment..."

# Stop and remove existing containers
print_info "Stopping and removing existing containers..."
$DOCKER_COMPOSE down -v 2>/dev/null || true

# Remove old images (optional, comment out if you want to keep them)
print_info "Cleaning up old images..."
docker image prune -f || true

# Build images
print_info "Building Docker images..."
$DOCKER_COMPOSE build --no-cache

# Start services
print_info "Starting services..."
$DOCKER_COMPOSE up -d

# Wait for PostgreSQL to be ready
print_info "Waiting for PostgreSQL to be ready..."
timeout=60
counter=0
until docker exec polytech_postgres pg_isready -U postgres > /dev/null 2>&1; do
    sleep 2
    counter=$((counter + 2))
    if [ $counter -ge $timeout ]; then
        print_error "PostgreSQL failed to start within $timeout seconds"
        exit 1
    fi
done
print_info "PostgreSQL is ready!"

# Wait for backend to be ready
print_info "Waiting for backend to be ready..."
timeout=60
counter=0
until curl -f http://localhost:8000/docs > /dev/null 2>&1; do
    sleep 2
    counter=$((counter + 2))
    if [ $counter -ge $timeout ]; then
        print_warn "Backend might not be fully ready, but continuing..."
        break
    fi
done

# Initialize database
print_info "Initializing database..."
docker exec polytech_backend python init_db.py || print_warn "Database initialization might have failed, but continuing..."

# Import sample data
print_info "Importing sample data from examples folder..."
docker exec polytech_backend python init_sample_data.py || print_warn "Sample data import might have failed, but continuing..."

# Show status
print_info "Checking service status..."
$DOCKER_COMPOSE ps

# Show status
echo ""
print_info "═══════════════════════════════════════════════════════════"
print_info "  Application is running!"
print_info "═══════════════════════════════════════════════════════════"
echo ""
print_info "Services:"
echo "  🌐 Frontend:    http://localhost"
echo "  🔧 Backend API: http://localhost:8000"
echo "  📚 API Docs:    http://localhost:8000/docs"
echo ""
print_warn "Useful commands:"
echo "  📋 View logs:    docker-compose logs -f"
echo "  🛑 Stop:         docker-compose down"
echo "  🔄 Restart:      docker-compose restart"
echo ""
print_info "═══════════════════════════════════════════════════════════"
echo ""

# Ask if user wants to follow logs
read -p "Do you want to follow logs? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    $DOCKER_COMPOSE logs -f
else
    print_info "You can view logs later with: docker-compose logs -f"
fi
