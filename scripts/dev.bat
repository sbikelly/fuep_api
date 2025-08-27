@echo off
REM Development script for FUEP Post-UTME Portal API (Windows)
REM This script helps manage the development Docker environment

setlocal enabledelayedexpansion

REM Colors for output (Windows 10+ supports ANSI colors)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Function to print colored output
:print_status
echo %BLUE%[INFO]%NC% %~1
goto :eof

:print_success
echo %GREEN%[SUCCESS]%NC% %~1
goto :eof

REM Function to check if Docker is running
:check_docker
docker info >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Docker is not running. Please start Docker and try again.
    exit /b 1
)
goto :eof

REM Function to check if Docker Compose is available
:check_docker_compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    docker compose version >nul 2>&1
    if errorlevel 1 (
        echo %RED%[ERROR]%NC% Docker Compose is not available. Please install Docker Compose and try again.
        exit /b 1
    )
)
goto :eof

REM Function to start development environment
:start_dev
call :print_status "Starting development environment..."
    
REM Start base services (postgres, redis, minio, mailhog)
call :print_status "Starting base services..."
docker-compose up -d postgres redis minio mailhog
    
REM Wait for postgres to be ready
call :print_status "Waiting for PostgreSQL to be ready..."
docker-compose run --rm api sh -c "until pg_isready -h postgres -U fuep -d fuep_portal; do sleep 2; done"
    
REM Start API in development mode
call :print_status "Starting API in development mode..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d api
    
call :print_success "Development environment started successfully!"
call :print_status "API will be available at: http://localhost:4000"
call :print_status "API Documentation: http://localhost:4000/docs"
call :print_status "Adminer (Database): http://localhost:8080"
call :print_status "Redis Commander: http://localhost:8081"
call :print_status "MailHog: http://localhost:8025"
call :print_status "MinIO Console: http://localhost:9001"
goto :eof

REM Function to stop development environment
:stop_dev
call :print_status "Stopping development environment..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
call :print_success "Development environment stopped successfully!"
goto :eof

REM Function to restart development environment
:restart_dev
call :print_status "Restarting development environment..."
call :stop_dev
call :start_dev
goto :eof

REM Function to view logs
:logs
if "%~1"=="" (
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
) else (
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f "%~1"
)
goto :eof

REM Function to rebuild and restart API
:rebuild_api
call :print_status "Rebuilding API container..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml build api
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d api
call :print_success "API rebuilt and restarted successfully!"
goto :eof

REM Function to show status
:status
call :print_status "Development environment status:"
docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps
goto :eof

REM Function to show help
:show_help
echo FUEP Post-UTME Portal API Development Script
echo.
echo Usage: %0 [COMMAND]
echo.
echo Commands:
echo   start     Start the development environment
echo   stop      Stop the development environment
echo   restart   Restart the development environment
echo   logs      Show logs ^(use 'logs [service]' for specific service^)
echo   rebuild   Rebuild and restart the API container
echo   status    Show status of all services
echo   help      Show this help message
echo.
echo Examples:
echo   %0 start          # Start development environment
echo   %0 logs api       # Show API logs
echo   %0 rebuild        # Rebuild API container
goto :eof

REM Main script logic
:main
call :check_docker
if errorlevel 1 exit /b 1

call :check_docker_compose
if errorlevel 1 exit /b 1

if "%~1"=="" goto :show_help
if "%~1"=="start" goto :start_dev
if "%~1"=="stop" goto :stop_dev
if "%~1"=="restart" goto :restart_dev
if "%~1"=="logs" goto :logs
if "%~1"=="rebuild" goto :rebuild_api
if "%~1"=="status" goto :status
if "%~1"=="help" goto :show_help
if "%~1"=="--help" goto :show_help
if "%~1"=="-h" goto :show_help

echo %RED%[ERROR]%NC% Unknown command: %~1
call :show_help
exit /b 1

REM Run main function with all arguments
call :main %*
