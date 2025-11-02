#!/bin/bash

# Sarakt Land Registry - Start Script
# Starts both backend and frontend, then opens browser

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=5001
FRONTEND_PORT=8080
FRONTEND_URL="http://localhost:${FRONTEND_PORT}"
BACKEND_URL="http://localhost:${BACKEND_PORT}"

# Function to cleanup background processes on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down servers...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    exit 0
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Sarakt Land Registry - Starting      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

# Check if required commands exist
command -v node >/dev/null 2>&1 || { echo -e "${RED}Error: Node.js is not installed${NC}" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}Error: npm is not installed${NC}" >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo -e "${RED}Error: Python 3 is not installed${NC}" >&2; exit 1; }

# Check if ports are available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}Warning: Port $port is already in use${NC}"
        return 1
    fi
    return 0
}

echo -e "${BLUE}Checking prerequisites...${NC}"
check_port $BACKEND_PORT
check_port $FRONTEND_PORT

# Check if backend dependencies are installed
if [ ! -d "backend/__pycache__" ] && [ ! -f "backend/.dependencies_installed" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend
    pip install -r requirements.txt --quiet || {
        echo -e "${RED}Failed to install backend dependencies${NC}"
        exit 1
    }
    cd ..
    touch backend/.dependencies_installed 2>/dev/null || true
fi

# Check if frontend dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

# Start backend server
echo -e "${GREEN}Starting backend server on port ${BACKEND_PORT}...${NC}"
cd backend
python3 -m uvicorn app:app --host 0.0.0.0 --port $BACKEND_PORT > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo -e "${BLUE}Waiting for backend to be ready...${NC}"
BACKEND_READY=false
for i in {1..30}; do
    if curl -s $BACKEND_URL/health > /dev/null 2>&1; then
        BACKEND_READY=true
        break
    fi
    sleep 1
done

if [ "$BACKEND_READY" = true ]; then
    echo -e "${GREEN}✓ Backend server is ready${NC}"
else
    echo -e "${RED}✗ Backend server failed to start${NC}"
    echo -e "${YELLOW}Check backend.log for details${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Start frontend server
echo -e "${GREEN}Starting frontend server on port ${FRONTEND_PORT}...${NC}"
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to be ready
echo -e "${BLUE}Waiting for frontend to be ready...${NC}"
FRONTEND_READY=false
for i in {1..30}; do
    if curl -s $FRONTEND_URL > /dev/null 2>&1; then
        FRONTEND_READY=true
        break
    fi
    sleep 1
done

if [ "$FRONTEND_READY" = true ]; then
    echo -e "${GREEN}✓ Frontend server is ready${NC}"
else
    echo -e "${YELLOW}Frontend is starting (may take a few more seconds)${NC}"
fi

# Open browser
echo -e "\n${BLUE}Opening browser...${NC}"
sleep 2

# Detect OS and open browser accordingly
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open $FRONTEND_URL
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open > /dev/null; then
        xdg-open $FRONTEND_URL
    elif command -v gnome-open > /dev/null; then
        gnome-open $FRONTEND_URL
    elif command -v kde-open > /dev/null; then
        kde-open $FRONTEND_URL
    else
        echo -e "${YELLOW}Could not auto-open browser. Please open: ${FRONTEND_URL}${NC}"
    fi
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows
    start $FRONTEND_URL
else
    echo -e "${YELLOW}Could not auto-open browser. Please open: ${FRONTEND_URL}${NC}"
fi

echo -e "\n${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Application is running!              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}\n"
echo -e "${BLUE}Frontend: ${NC}${FRONTEND_URL}"
echo -e "${BLUE}Backend API: ${NC}${BACKEND_URL}"
echo -e "${BLUE}API Docs: ${NC}${BACKEND_URL}/docs\n"
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}\n"

# Tail the logs
tail -f backend.log frontend.log 2>/dev/null || {
    # If tail fails, just wait
    wait
}

