#!/bin/bash

# Development script for FUEP Post-UTME Portal API
# This script helps manage the development Docker environment

set -e

# Colors for output
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

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available. Please install Docker Compose and try again."
        exit 1
    fi
}

# Function to start development environment
start_dev() {
    print_status "Starting development environment..."
    
    # Start base services (postgres, redis, minio, mailhog)
    print_status "Starting base services..."
    docker-compose up -d postgres redis minio mailhog
    
    # Wait for postgres to be ready
    print_status "Waiting for PostgreSQL to be ready..."
    docker-compose run --rm api sh -c "until pg_isready -h postgres -U fuep -d fuep_portal; do sleep 2; done"
    
    # Start API in development mode
    print_status "Starting API in development mode..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d api
    
    print_success "Development environment started successfully!"
    print_status "API will be available at: http://localhost:4000"
    print_status "API Documentation: http://localhost:4000/docs"
    print_status "Adminer (Database): http://localhost:8080"
    print_status "Redis Commander: http://localhost:8081"
    print_status "MailHog: http://localhost:8025"
    print_status "MinIO Console: http://localhost:9001"
}

# Function to stop development environment
stop_dev() {
    print_status "Stopping development environment..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
    print_success "Development environment stopped successfully!"
}

# Function to restart development environment
restart_dev() {
    print_status "Restarting development environment..."
    stop_dev
    start_dev
}

# Function to view logs
logs() {
    if [ -z "$1" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
    else
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f "$1"
    fi
}

# Function to rebuild and restart API
rebuild_api() {
    print_status "Rebuilding API container..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml build api
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d api
    print_success "API rebuilt and restarted successfully!"
}

# Function to show status
status() {
    print_status "Development environment status:"
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps
}

# Function to show help
show_help() {
    echo "FUEP Post-UTME Portal API Development Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start the development environment"
    echo "  stop      Stop the development environment"
    echo "  restart   Restart the development environment"
    echo "  logs      Show logs (use 'logs [service]' for specific service)"
    echo "  rebuild   Rebuild and restart the API container"
    echo "  status    Show status of all services"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start          # Start development environment"
    echo "  $0 logs api       # Show API logs"
    echo "  $0 rebuild        # Rebuild API container"
}

# Main script logic
main() {
    check_docker
    check_docker_compose
    
    case "${1:-help}" in
        start)
            start_dev
            ;;
        stop)
            stop_dev
            ;;
        restart)
            restart_dev
            ;;
        logs)
            logs "$2"
            ;;
        rebuild)
            rebuild_api
            ;;
        status)
            status
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
