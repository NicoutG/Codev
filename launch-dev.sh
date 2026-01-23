#!/bin/bash

# Script pour le développement local (sans Docker)

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info "Starting development environment..."

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL client not found. Please install PostgreSQL."
    exit 1
fi

# Backend setup
print_info "Setting up backend..."
cd src/indicateurs/backend

if [ ! -d "venv" ]; then
    print_info "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
print_info "Installing backend dependencies..."
pip install -r requirements.txt

# Initialize database if needed
print_info "Initializing database..."
python init_db.py || print_warn "Database might already be initialized"

# Start backend in background
print_info "Starting backend server..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

cd ../../../

# Frontend setup
print_info "Setting up frontend..."
cd src/indicateurs/frontend/frontend

if [ ! -d "node_modules" ]; then
    print_info "Installing frontend dependencies..."
    npm install --cache /tmp/npm-cache
fi

# Start frontend
print_info "Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

cd ../../../

print_info "Development servers started!"
echo ""
print_info "Services:"
echo "  - Frontend: http://localhost:5173"
echo "  - Backend: http://localhost:8000"
echo "  - API Docs: http://localhost:8000/docs"
echo ""
print_warn "Press Ctrl+C to stop all servers"

# Trap to cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# Wait for processes
wait
